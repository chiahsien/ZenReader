/**
 * ZenReader - Content Script Main Entry Point
 *
 * This script serves as the entry point for the ZenReader extension's content script,
 * initializing and connecting all the modular components.
 */

// Global state (will be accessed by all modules)
const zenReaderState = {
  isSelectionMode: false,
  isFocusMode: false,
  selectedElement: null,
  overlayElement: null,
  focusContainer: null,
  exitButton: null,
  shadowRoot: null
};

// Initialize all modules
(function() {
  // Initialize style cache - must be done first
  initStyleCache();

  // Initialize message handlers
  initMessageHandler();
})();

/**
 * Activates the ZenReader extension when triggered by background script
 * @param {string} source - The source of activation (toolbar or context menu)
 */
function activateZenReader(source) {
  if (zenReaderState.isSelectionMode || zenReaderState.isFocusMode) {
    if (zenReaderState.isFocusMode) {
      exitFocusMode();
    }
    return;
  }

  startSelectionMode();
}

/**
 * Handles keydown events for shortcut keys
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeyDown(event) {
  // ESC key to exit
  if (event.key === 'Escape') {
    if (zenReaderState.isSelectionMode) {
      exitSelectionMode();
    } else if (zenReaderState.isFocusMode) {
      exitFocusMode();
    }
  }
}

// All our modules will be loaded after this file and have access to
// everything defined here. In a module-based world, we'd use imports/exports,
// but for Chrome extension development compatibility, we're using this approach.
