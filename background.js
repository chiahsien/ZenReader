/**
 * ZenReader - Background Script
 *
 * This script handles the extension's background process, including:
 * - Icon click handling in the Chrome toolbar
 * - Context menu creation and management
 * - Communication with content script
 * - Tab state tracking
 */

// Initialize extension state
let contextMenuId = null;

// Object to track active status for each tab
let tabStates = {};

/**
 * Updates the extension icon state based on whether focus mode is active for a specific tab
 * @param {number} tabId - ID of the tab
 * @param {boolean} active - Whether ZenReader is currently active on the tab
 */
function updateIcon(tabId, active) {
  const path = active ? {
    16: "icons/icon16-active.png",
    48: "icons/icon48-active.png",
    128: "icons/icon128-active.png"
  } : {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png"
  };

  chrome.action.setIcon({ path, tabId });
}

/**
 * Updates the context menu by removing the old one and creating a new one with the appropriate state
 * @param {boolean} active - Whether ZenReader is currently active on the current tab
 */
function updateContextMenu(active) {
  // Remove the existing menu item
  if (contextMenuId) {
    chrome.contextMenus.remove(contextMenuId, () => {
      // Create a new menu item with state-appropriate title
      createContextMenuWithState(active);
    });
  } else {
    // If no existing menu (first run), just create a new one
    createContextMenuWithState(active);
  }
}

/**
 * Creates a context menu item with the appropriate state
 * @param {boolean} active - Whether ZenReader is currently active
 */
function createContextMenuWithState(active) {
  const title = active ?
    chrome.i18n.getMessage("exitFocusMode") :
    chrome.i18n.getMessage("enterFocusMode");

  contextMenuId = chrome.contextMenus.create({
    id: "zenreader-toggle",
    title: title,
    contexts: ["page", "selection"]
  });
}

/**
 * Creates the initial context menu item for ZenReader
 */
function createContextMenu() {
  // Remove any existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create a new context menu item with default inactive state
    createContextMenuWithState(false);
  });
}

/**
 * Sends message to content script to initiate selection mode or toggle focus mode
 * @param {number} tabId - ID of the current tab
 */
function activateZenReader(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: "activate"
  });
}

/**
 * Get the state for a tab, defaulting to inactive if not found
 * @param {number} tabId - The ID of the tab
 * @returns {boolean} - Whether the tab is active
 */
function getTabState(tabId) {
  return tabStates[tabId] || false;
}

/**
 * Set the state for a tab
 * @param {number} tabId - The ID of the tab
 * @param {boolean} active - Whether the tab is active
 */
function setTabState(tabId, active) {
  tabStates[tabId] = active;
  updateIcon(tabId, active);
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
    activateZenReader(tab.id);
  }
});

// Handle tab removal to clean up state
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clean up the tab state when a tab is closed
  if (tabStates[tabId]) {
    delete tabStates[tabId];
  }
});

// Handle tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Update context menu based on the newly activated tab's state
  updateContextMenu(getTabState(activeInfo.tabId));
});

// Handle tab updates to ensure icon is correct when navigating
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // If the tab is navigating to a new page, reset its state
  if (changeInfo.status === 'loading' && changeInfo.url) {
    setTabState(tabId, false);
  }

  // If the tab has finished loading, update context menu if it's the active tab
  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id === tabId) {
        updateContextMenu(getTabState(tabId));
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stateChanged" && sender.tab) {
    const tabId = sender.tab.id;

    // Update state for this specific tab
    setTabState(tabId, message.isActive);

    // Update context menu if this is the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id === tabId) {
        updateContextMenu(message.isActive);
      }
    });

    // Send a response to close the message channel properly
    sendResponse({ success: true });
  }

  // Return false since our operation is synchronous
  return false;
});
