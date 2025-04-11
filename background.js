/**
 * ZenReader - Background Script
 *
 * This script handles the extension's background process, including:
 * - Icon click handling in the Chrome toolbar
 * - Context menu creation and handling
 * - Communication with content script
 */

// Initialize extension state
let isActive = false;

/**
 * Updates the extension icon state based on whether focus mode is active
 * @param {boolean} active - Whether ZenReader is currently active
 */
function updateIcon(active) {
  const path = active ? {
    16: "icons/icon16-active.png",
    48: "icons/icon48-active.png",
    128: "icons/icon128-active.png"
  } : {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png"
  };

  chrome.action.setIcon({ path });
}

/**
 * Creates context menu item for the extension
 */
function createContextMenu() {
  chrome.contextMenus.create({
    id: "zenreader",
    title: chrome.i18n.getMessage("focusOnThisSection"),
    contexts: ["page", "selection", "link", "image", "video"]
  });
}

/**
 * Sends message to content script to initiate selection mode or toggle focus mode
 * @param {number} tabId - ID of the current tab
 * @param {Object} info - Information about the context click
 */
function activateZenReader(tabId, info = {}) {
  chrome.tabs.sendMessage(tabId, {
    action: "activate",
    source: info.menuItemId ? "contextMenu" : "toolbar",
    info: info
  });
}

// Set up event listeners when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Handle toolbar icon clicks
chrome.action.onClicked.addListener((tab) => {
  activateZenReader(tab.id);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  activateZenReader(tab.id, info);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stateChanged") {
    isActive = message.isActive;
    updateIcon(isActive);

    // Send a response to close the message channel properly
    sendResponse({ success: true });
  }

  // Return true only if we're actually using sendResponse asynchronously
  // Since our operation is synchronous, we don't need to return true
  return false;
});
