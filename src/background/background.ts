// Background service worker for Chrome Extension Manifest V3
import { BackgroundMessage, BackgroundResponse } from '../types/common';
import { GitHubService } from '../services/githubService';

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
  console.log('Message action type:', typeof message.action, 'value:', message.action);
  
  // Handle async operations properly
  if (message.action === 'fetchPullRequests') {
    console.log('Handling fetchPullRequests action (async)');
    handleGitHubApiRequest(message, sendResponse);
    return true; // Keep message channel open for async response
  }
  
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

    case 'pageLoaded':
      // Handle page loaded notifications from content script
      sendResponse({ success: true });
      break;
      
    default:
      console.warn('Unknown action:', message.action);
      console.warn('Available actions: getTabInfo, updateBadge, pageLoaded, fetchPullRequests');
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

// GitHub API handler
const handleGitHubApiRequest = async (message: BackgroundMessage, sendResponse: (response: BackgroundResponse) => void) => {
  if (message.action !== 'fetchPullRequests') {
    sendResponse({ action: 'fetchPullRequests', success: false, error: 'Invalid action' });
    return;
  }

  const { patToken, repositoryUrl } = message.data;

  console.log('GitHub API request received:', { repositoryUrl, hasToken: !!patToken });

  // Validate required parameters
  if (!patToken) {
    sendResponse({
      action: 'fetchPullRequests',
      success: false,
      error: 'GitHub Personal Access Token is required'
    });
    return;
  }

  if (!repositoryUrl) {
    sendResponse({
      action: 'fetchPullRequests',
      success: false,
      error: 'Repository URL is required'
    });
    return;
  }

  try {
    console.log('Fetching pull requests using GitHub Service...');
    
    // Use the GitHub service to fetch real data
    const pullRequests = await GitHubService.getPullRequests(
      patToken,
      repositoryUrl,
      { state: 'open', per_page: 10 } // Fetch up to 10 open PRs
    );

    console.log(`GitHub API response ready: ${pullRequests.length} PRs fetched`);

    // Return the pull requests directly - they already match our GitHubPullRequest interface
    sendResponse({
      action: 'fetchPullRequests',
      success: true,
      data: pullRequests
    });

  } catch (error) {
    console.error('GitHub API request failed:', error);
    
    let errorMessage = 'Failed to fetch pull requests';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Provide more helpful error messages for common issues
      if (error.message.includes('401')) {
        errorMessage = 'Invalid GitHub token. Please check your Personal Access Token.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Repository not found. Please check the repository URL and token permissions.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access forbidden. Check your token permissions or rate limit.';
      }
    }
    
    sendResponse({
      action: 'fetchPullRequests',
      success: false,
      error: errorMessage
    });
  }
};

// Utility function to log errors
const logError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  // You could send this to an analytics service or error tracking
};