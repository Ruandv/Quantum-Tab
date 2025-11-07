// Content script that runs on web pages
// This script has access to the DOM of the current page

import { WebsiteCounterData } from '@/types/common';

console.log('Quantum Tab content script loaded');

// Website visit tracking
async function trackWebsiteVisit(): Promise<void> {
  try {
    const hostname = window.location.hostname.replace('www.', '');
    const url = window.location.href;

    // Get current website counters
    const result = await chrome.storage.local.get('websiteCounters');
    const websiteCounters = result.websiteCounters || [];

    // Find if this website is being tracked
    const existingIndex = websiteCounters.findIndex((site: WebsiteCounterData) => site.hostname === hostname);

    if (existingIndex !== -1) {
      // Update existing counter
      websiteCounters[existingIndex].count += 1;
      websiteCounters[existingIndex].lastVisited = Date.now();
      websiteCounters[existingIndex].url = url; // Update to latest URL

      // Save updated counters - this will trigger the storage listener in WebsiteCounter component
      await chrome.storage.local.set({ websiteCounters });

      console.log(
        `Website visit tracked: ${hostname} (${websiteCounters[existingIndex].count} visits)`
      );
    }
  } catch (error) {
    console.error('Failed to track website visit:', error);
  }
}

// Track the current page visit when content script loads
trackWebsiteVisit();

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.action) {
    case 'highlightText':
      if (message.text) {
        highlightTextOnPage(message.text);
        sendResponse({ success: true, action: 'highlightText' });
      }
      break;

    default:
      console.log('Unknown action:', message.action);
      sendResponse({ error: 'Unknown action' });
  }

  return true; // Indicates we want to send an asynchronous response
});

// Function to highlight text on the page
function highlightTextOnPage(searchText: string): void {
  // Remove existing highlights
  removeExistingHighlights();

  if (!searchText.trim()) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

  const textNodes: Text[] = [];
  let node;

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent || parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE') {
      return;
    }

    const text = textNode.textContent || '';
    const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');

    if (regex.test(text)) {
      const highlightedHTML = text.replace(
        regex,
        '<mark style="background-color: yellow; color: black;">$1</mark>'
      );
      const wrapper = document.createElement('span');
      wrapper.innerHTML = highlightedHTML;

      parent.replaceChild(wrapper, textNode);
    }
  });
}

// Function to remove existing highlights
function removeExistingHighlights(): void {
  const highlights = document.querySelectorAll('mark[style*="background-color: yellow"]');
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parent.normalize();
    }
  });
}

// Utility function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Send a message to the background script when the page loads
window.addEventListener('load', () => {
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    url: window.location.href,
    title: document.title,
  });
});
