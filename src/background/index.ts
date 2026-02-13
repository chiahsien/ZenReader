/**
 * ZenReader - Background Script
 *
 * Handles the extension's background process, including:
 * - Icon click handling in the Chrome toolbar
 * - Context menu creation and management
 * - Communication with content script
 * - Tab state tracking with on-demand content script injection
 * - About page navigation
 * - Cross-origin CSS proxy fetch
 */

let pageContextMenuId: string | number | null = null;
const tabStates: Record<number, boolean> = {};
const injectedTabs = new Set<number>();

function updateIcon(tabId: number, active: boolean): void {
  const path = active ? {
    16: 'icons/icon16-active.png',
    48: 'icons/icon48-active.png',
    128: 'icons/icon128-active.png',
  } : {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  };

  try {
    chrome.action.setIcon({ path, tabId }, function () {
      if (chrome.runtime.lastError) {
        console.log('Could not set icon:', chrome.runtime.lastError.message);
      }
    });
  } catch (e) {
    console.log('Error setting icon:', (e as Error).message);
  }
}

function updatePageContextMenu(active: boolean): void {
  if (pageContextMenuId) {
    const title = active
      ? chrome.i18n.getMessage('exitFocusMode')
      : chrome.i18n.getMessage('enterFocusMode');

    try {
      chrome.contextMenus.update(pageContextMenuId, { title }, function () {
        if (chrome.runtime.lastError) {
          console.log('Could not update context menu:', chrome.runtime.lastError.message);
          if (chrome.runtime.lastError.message?.includes('not found')) {
            createPageContextMenu(active);
          }
        }
      });
    } catch (e) {
      console.log('Error updating context menu:', (e as Error).message);
      createPageContextMenu(active);
    }
  } else {
    createPageContextMenu(active);
  }
}

function createPageContextMenu(active: boolean = false): void {
  chrome.contextMenus.removeAll(function () {
    const title = active
      ? chrome.i18n.getMessage('exitFocusMode')
      : chrome.i18n.getMessage('enterFocusMode');

    try {
      pageContextMenuId = chrome.contextMenus.create({
        id: 'zenreader-toggle',
        title: title,
        contexts: ['page'],
      }, function () {
        if (chrome.runtime.lastError) {
          console.log('Could not create page context menu:', chrome.runtime.lastError.message);
        }
      });

      chrome.contextMenus.create({
        id: 'zenreader-about',
        title: chrome.i18n.getMessage('aboutZenReader'),
        contexts: ['action'],
      }, function () {
        if (chrome.runtime.lastError) {
          console.log('Could not create action context menu item:', chrome.runtime.lastError.message);
        }
      });
    } catch (e) {
      console.log('Error creating context menus:', (e as Error).message);
    }
  });
}

function sendActivateMessage(tabId: number): void {
  chrome.tabs.sendMessage(tabId, { action: 'activate' }, function (response) {
    if (chrome.runtime.lastError) {
      console.log('Activation message error:', chrome.runtime.lastError.message);
    }
  });
}

/**
 * Injects content script and CSS into a tab if not already injected, then activates.
 * Skips chrome:// and chrome-extension:// URLs which cannot be scripted.
 */
async function injectAndActivate(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id || !tab.url) return;
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  if (!injectedTabs.has(tab.id)) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/content/content.css'],
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/index.js'],
      });
      injectedTabs.add(tab.id);
    } catch (e) {
      console.log('Could not inject into tab:', (e as Error).message);
      return;
    }
  }

  sendActivateMessage(tab.id);
}

function getTabState(tabId: number): boolean {
  return tabStates[tabId] || false;
}

function setTabState(tabId: number, active: boolean): void {
  if (tabStates[tabId] !== active) {
    tabStates[tabId] = active;
    updateIcon(tabId, active);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0 && tabs[0].id === tabId) {
        updatePageContextMenu(active);
      }
    });
  }
}

function syncPageContextMenuWithActiveTab(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0 && tabs[0].id !== undefined) {
      const activeTabId = tabs[0].id;
      const isActive = getTabState(activeTabId);
      updatePageContextMenu(isActive);
    }
  });
}

function openAboutPage(): void {
  const aboutURL = chrome.runtime.getURL('src/about/about.html');
  chrome.tabs.create({ url: aboutURL });
}

/**
 * Fetches a cross-origin CSS stylesheet via the background service worker,
 * bypassing content script CORS restrictions.
 * Uses AbortController with a 3-second timeout to avoid hanging on slow servers.
 */
async function fetchCSSFromBackground(
  url: string,
  sendResponse: (response: { success: boolean; cssText?: string; error?: string }) => void,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 3000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      sendResponse({ success: false, error: 'HTTP ' + response.status });
      return;
    }

    const cssText = await response.text();
    sendResponse({ success: true, cssText: cssText });
  } catch (e) {
    clearTimeout(timeoutId);
    sendResponse({ success: false, error: (e as Error).message });
  }
}

// Extension lifecycle events
chrome.runtime.onInstalled.addListener(function () {
  createPageContextMenu();
  console.log('ZenReader extension installed');
});

chrome.action.onClicked.addListener(function (tab) {
  injectAndActivate(tab);
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'zenreader-toggle' && tab) {
    injectAndActivate(tab);
  } else if (info.menuItemId === 'zenreader-about') {
    openAboutPage();
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  delete tabStates[tabId];
  injectedTabs.delete(tabId);
});

chrome.tabs.onActivated.addListener(function (_activeInfo) {
  syncPageContextMenuWithActiveTab();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, _tab) {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    setTabState(tabId, false);
    injectedTabs.delete(tabId);
  }

  if (changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0 && tabs[0].id === tabId) {
        syncPageContextMenuWithActiveTab();
      }
    });
  }
});

chrome.runtime.onMessage.addListener(function (
  message: { action: string; isActive?: boolean; url?: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: { success: boolean; cssText?: string; error?: string }) => void,
) {
  if (message.action === 'stateChanged' && sender.tab && sender.tab.id !== undefined) {
    const tabId = sender.tab.id;
    const isActive = message.isActive ?? false;
    setTabState(tabId, isActive);

    try {
      sendResponse({ success: true });
    } catch (e) {
      console.log('Error sending response:', (e as Error).message);
    }
    return false;
  } else if (message.action === 'openAboutPage') {
    openAboutPage();
    sendResponse({ success: true });
    return false;
  } else if (message.action === 'fetchCSS' && message.url) {
    fetchCSSFromBackground(message.url, sendResponse);
    return true;
  }

  return false;
});

setInterval(syncPageContextMenuWithActiveTab, 5000);
