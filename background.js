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
 * Updates the context menu title based on ZenReader's active state
 * This is now a more robust function that will work even with potential race conditions
 * @param {boolean} active - Whether ZenReader is currently active on the current tab
 */
function updateContextMenu(active) {
  if (contextMenuId) {
    const title = active ?
      chrome.i18n.getMessage("exitFocusMode") :
      chrome.i18n.getMessage("enterFocusMode");

    try {
      chrome.contextMenus.update(contextMenuId, { title }, () => {
        // Handle potential error in callback
        if (chrome.runtime.lastError) {
          console.log("Could not update context menu:", chrome.runtime.lastError.message);

          // If error is because menu doesn't exist, recreate it
          if (chrome.runtime.lastError.message.includes("not found")) {
            createContextMenu(active);
          }
        }
      });
    } catch (e) {
      console.log("Error updating context menu:", e.message);
      // Attempt to recreate the context menu if there was an error
      createContextMenu(active);
    }
  } else {
    // If menu ID doesn't exist, create the menu
    createContextMenu(active);
  }
}

/**
 * Creates the context menu item for ZenReader with the appropriate state
 * @param {boolean} active - Whether ZenReader is currently active (optional)
 */
function createContextMenu(active = false) {
  // Remove any existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create the context menu item with the correct state
    const title = active ?
      chrome.i18n.getMessage("exitFocusMode") :
      chrome.i18n.getMessage("enterFocusMode");

    try {
      contextMenuId = chrome.contextMenus.create({
        id: "zenreader-toggle",
        title: title,
        contexts: ["all"]
      }, () => {
        // Handle potential error in callback
        if (chrome.runtime.lastError) {
          console.log("Could not create context menu:", chrome.runtime.lastError.message);
        }
      });
    } catch (e) {
      console.log("Error creating context menu:", e.message);
    }
  });
}

/**
 * Sends message to content script to initiate selection mode or toggle focus mode
 * @param {number} tabId - ID of the current tab
 */
function activateZenReader(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: "activate"
  }, (response) => {
    // Handle any error in the response
    if (chrome.runtime.lastError) {
      console.log("Activation message error:", chrome.runtime.lastError.message);
    }
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
 * Set the state for a tab and update UI accordingly
 * @param {number} tabId - The ID of the tab
 * @param {boolean} active - Whether the tab is active
 */
function setTabState(tabId, active) {
  // Only update if the state has actually changed
  if (tabStates[tabId] !== active) {
    tabStates[tabId] = active;
    updateIcon(tabId, active);

    // Check if this is the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id === tabId) {
        // Update context menu immediately if this is the active tab
        updateContextMenu(active);
      }
    });
  }
}

/**
 * Ensures that the context menu is updated for the active tab
 * Used when switching tabs or when the state might be uncertain
 */
function syncContextMenuWithActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTabId = tabs[0].id;
      const isActive = getTabState(activeTabId);
      updateContextMenu(isActive);
    }
  });
}

/**
 * Opens the ZenReader About page in a new tab
 */
function openAboutPage() {
  // Get the URL for the about page
  const aboutURL = chrome.runtime.getURL('about/about.html');

  // Open the about page in a new tab
  chrome.tabs.create({ url: aboutURL });
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
  // Sync context menu with the newly activated tab's state
  syncContextMenuWithActiveTab();
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
        // Double-check the tab state here
        syncContextMenuWithActiveTab();
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stateChanged" && sender.tab) {
    const tabId = sender.tab.id;
    const isActive = message.isActive;

    // Update state for this specific tab
    setTabState(tabId, isActive);

    // Send a response to acknowledge receipt
    try {
      sendResponse({ success: true });
    } catch (e) {
      console.log("Error sending response:", e.message);
    }
  }

  // Return false since we're not using sendResponse asynchronously
  return false;
});

// Set up a periodic check to ensure context menu stays in sync
// This helps catch any edge cases we might have missed
setInterval(() => {
  syncContextMenuWithActiveTab();
}, 5000); // Every 5 seconds
