/**
 * ZenReader - Message Handler Module
 *
 * This script manages communication with the background script,
 * handling messages and sending state updates.
 */

/**
 * Initializes the message handler to listen for background script messages
 */
function initMessageHandler() {
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'activate') {
        // Start selection mode when activated from toolbar or context menu
        if (!zenReaderState.isSelectionMode && !zenReaderState.isFocusMode) {
          startSelectionMode();
        } else if (zenReaderState.isFocusMode) {
          // If already in focus mode, exit it
          exitFocusMode();
        }

        // Send a response to close the message channel properly
        sendResponse({ success: true });
      }
    } catch(e) {
      console.log("Error handling message:", e.message);
      // Send error response
      sendResponse({ success: false, error: e.message });
    }

    // We're handling this synchronously, so no need to return true
    return false;
  });
}
