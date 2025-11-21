// CONFIGURATION: Change this to the ID you want to watch
const TARGET_ELEMENT_ID = "scoreRow"; 
const API_ENDPOINT = "http://192.168.178.35/api/notify";

console.log(`Score Extractor: Watching for #${TARGET_ELEMENT_ID}...`);

let lastScore = ""; // Used to prevent sending duplicate data

/**
 * Scans the target element and logs found numbers
 */
function extractAndLog() {
  const element = document.getElementById(TARGET_ELEMENT_ID);

  if (!element) {
    // Element might not be loaded yet, or was removed.
    return; 
  }

  const text = element.innerText || element.textContent;
  
  // Regex to find numbers (integers and decimals)
  const regex = /\d+\s*:\s*\d+/g;
  const found = text.match(regex);
  const score = found.length ? found[0] : '';

  if (score) {
    // Check if data is new before sending
    const currentScore = score;
    
    if (currentScore !== lastScore) {
      console.log(`[Extractor] New score detected:`, score);
      
      // Update cache
      lastScore = currentScore;
      
      // Send to server
      sendData(score);
    }    
  } else {
    console.log(`[Extractor] #${TARGET_ELEMENT_ID} exists but contains no score.`);
  }
}

/**
 * Sends the extracted data to the configured API endpoint
 */
function sendData(score) {
  const payload = {
    text: score,
    hold: true,
    stack: false,
  };

  fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) {
      console.log(`[Extractor] Successfully posted data to ${API_ENDPOINT}`);
    } else {
      console.error(`[Extractor] API Error: ${response.status} ${response.statusText}`);
    }
  })
  .catch(error => {
    console.error(`[Extractor] Network Error:`, error);
  });
}

// 1. Run immediately on load
extractAndLog();

// 2. Set up a MutationObserver to handle dynamic content changes
// We use a debounce timer to prevent spamming the extraction if the DOM changes rapidly
let debounceTimer;

const observer = new MutationObserver((mutations) => {
  // Clear the previous timer
  clearTimeout(debounceTimer);

  // Wait for the DOM to settle for 500ms before extracting
  debounceTimer = setTimeout(() => {
    extractAndLog();
  }, 500);
});

// Start observing the entire body.
// This ensures we catch it if the target element is added dynamically later (React/Vue/Angular)
// or if the text inside the existing target element changes.
observer.observe(document.body, {
  childList: true,      // specific nodes added/removed
  subtree: true,        // watch all descendants, not just direct children
  characterData: true   // watch for text content changes
});