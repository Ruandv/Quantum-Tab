// Background service worker for Chrome Extension Manifest V3

// Listen for extension installation or startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  // Set up initial state or perform initialization tasks
  chrome.storage.sync.set({
    extensionInstalled: true,
    installDate: new Date().toISOString(),
  });
});

// Listen for extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from:', sender);
  
  switch (message.action) {
    case 'getTabInfo':
      if (sender.tab) {
        sendResponse({
          tabId: sender.tab.id,
          url: sender.tab.url,
          title: sender.tab.title,
        });
      }
      break;
      
    case 'updateBadge':
      if (sender.tab && message.text) {
        chrome.action.setBadgeText({
          text: message.text,
          tabId: sender.tab.id,
        });
        chrome.action.setBadgeBackgroundColor({
          color: message.color || '#FF0000',
        });
      }
      sendResponse({ success: true });
      break;
      
    default:
      console.log('Unknown action:', message.action);
      sendResponse({ error: 'Unknown action' });
  }
  
  // Return true to indicate we want to send an asynchronous response
  return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    
    // You can perform actions when tabs are updated
    // For example, inject content scripts or update extension state
  }
});

// Handle browser action clicks (if needed)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked in tab:', tab.id);
  // This won't fire if you have a popup defined in manifest.json
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Storage changed in namespace:', namespace, changes);
});

// Utility function to log errors
const logError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  // You could send this to an analytics service or error tracking
};