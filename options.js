const DEFAULT_DISPLAY_IP = "192.168.4.1";

// 1. Load settings when the options page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    displayIP: DEFAULT_DISPLAY_IP // If nothing is saved, this default is used
  }, (items) => {
    document.getElementById('displayIP').value = items.displayIP;
  });
});

// 2. Save settings
document.getElementById('save').addEventListener('click', () => {
  const ip = document.getElementById('displayIP').value.trim();
  
  chrome.storage.sync.set({
    displayIP: ip
  }, () => {
    showStatus('Settings saved successfully.');
  });
});

// 3. Reset to default
document.getElementById('reset').addEventListener('click', () => {
  document.getElementById('displayIP').value = DEFAULT_DISPLAY_IP;
  
  chrome.storage.sync.set({
    displayIP: DEFAULT_DISPLAY_IP
  }, () => {
    showStatus('Restored default settings.');
  });
});

function showStatus(text) {
  const status = document.getElementById('status');
  status.textContent = text;
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}