/**
 * ZenReader - Background Script
 *
 * This script handles the extension's background process, including:
 * - Icon click handling in the Chrome toolbar
 * - Context menu creation and management
 * - Communication with content script
 */

// Initialize extension state
let isActive = false;
let contextMenuId = null;

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
 * Updates the context menu title based on current state
 * @param {boolean} active - Whether ZenReader is currently active
 */
function updateContextMenu(active) {
  if (!contextMenuId) return;

  const title = active ?
    chrome.i18n.getMessage("exitFocusMode") :
    chrome.i18n.getMessage("enterFocusMode");

  chrome.contextMenus.update(contextMenuId, { title });
}

/**
 * Creates the context menu item for ZenReader
 */
function createContextMenu() {
  // Remove any existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create a new context menu item
    contextMenuId = chrome.contextMenus.create({
      id: "zenreader-toggle",
      title: chrome.i18n.getMessage("enterFocusMode"),
      contexts: ["page", "selection"],
    });
  });
}

/**
 * Sends message to content script to initiate selection mode or toggle focus mode
 * @param {number} tabId - ID of the current tab
 */
function activateZenReader(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: "activate",
    source: "toolbar"
  });
}

// Set up event listeners when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu
  createContextMenu();

  console.log("ZenReader extension installed");
});

// Handle toolbar icon clicks
chrome.action.onClicked.addListener((tab) => {
  activateZenReader(tab.id);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "zenreader-toggle") {
    chrome.tabs.sendMessage(tab.id, {
      action: "activate",
      source: "contextMenu"
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stateChanged") {
    isActive = message.isActive;
    updateIcon(isActive);
    updateContextMenu(isActive);

    // Send a response to close the message channel properly
    sendResponse({ success: true });
  }

  // Return false since our operation is synchronous
  return false;
});
