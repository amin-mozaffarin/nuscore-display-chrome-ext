// CONFIGURATION: Change this to the ID you want to watch
const DEFAULT_DISPLAY_IP = "192.168.4.1"
const DB_NAME = "nuDB";
const STORE_NAME = "meetingMatches";
const POLL_INTERVAL = 1 * 1000;
const DISPLAY_TIMEOUT = 1 * 1000;

let currentDisplayIP =  DEFAULT_DISPLAY_IP;

console.log(`[ScoreExtractor] Initializing...`);

function getMeetingUuidFromUrl() {
    const meetingUuid = location.pathname.split('/')[4]
    return meetingUuid;
}

async function pollDatabase() {
    const meetingUuid = getMeetingUuidFromUrl();
    if (!meetingUuid) {
      await sendData('- : -')
      return
    };

    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Ensure the store exists before trying to open it
        if (!db.objectStoreNames.contains(STORE_NAME)) return;

        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = async () => {
            const allMatches = getAllRequest.result;
            const matches = allMatches.filter(match => match.nuLigaMeetingUuid === meetingUuid);
            
            let matchesA = 0
            let matchesB = 0
            const completedMatches = matches.filter(match => match.isCompleted)
            if (completedMatches.length === 0) {
              await sendData('0 : 0')
              return
            }

            completedMatches.forEach(match => {
              matchesA += match.matchesA
              matchesB += match.matchesB
            });

            const score = `${matchesA} : ${matchesB}`
            await sendData(score);
        };
    };
}

// 1. Load the API Endpoint from storage on startup
chrome.storage.sync.get({
  displayIP: DEFAULT_DISPLAY_IP
}, (items) => {
  currentDisplayIP = items.displayIP;
  console.log(`[ScoreExtractor] Display IP set to: ${currentDisplayIP}`);
  // Run initial extraction only after we have the endpoint
  pollDatabase();
});

// 2. Listen for changes in options
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.displayIP) {
    currentDisplayIP = changes.displayIP.newValue;
    console.log(`[ScoreExtractor] Display IP updated to: ${currentDisplayIP}`);
    pollDatabase();
  }
});

// Sends the extracted data to the configured API endpoint
async function sendData(score) {
  console.log(`[ScoreExtractor] sending score ${score} to display ${currentDisplayIP} and overwrite footer...`)
  overwriteFooter(score)

  const payload = {
    text: score,
    hold: true,
    stack: false,
  };

  const API_ENDPOINT = `http://${currentDisplayIP}/api/notify`

  const abortController = new AbortController();
  const timerId = setTimeout(() => abortController.abort(), DISPLAY_TIMEOUT);

  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    })
    clearTimeout(timerId)
    console.log(`[ScoreExtractor] Display successfully updated to ${score}`);
  } catch(err) {
    console.error(`[ScoreExtractor] Display update failed`);
  }
}

function overwriteFooter(score) {
  const element = document.querySelector('#scoreRow span');

  if (!element) {
    // Element might not be loaded yet, or was removed.
    return; 
  }

  element.textContent = `Spielstand*: ${score}`;  
}

setInterval(pollDatabase, POLL_INTERVAL);