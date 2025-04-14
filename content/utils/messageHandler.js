/**
 * ZenReader - Message Handler Module
 *
 * This script manages communication with the background script,
 * handling messages and sending state updates.
 */

/**
 * Initializes the message handler to listen for background script messages
 * with enhanced error handling
 */
function initMessageHandler() {
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.action === 'activate') {
        // Start selection mode when activated from toolbar or context menu
        if (!zenReaderState.isSelectionMode && !zenReaderState.isFocusMode) {
          startSelectionMode();
          // Send response with current state
          sendResponse({
            success: true,
            isActive: zenReaderState.isSelectionMode || zenReaderState.isFocusMode
          });
        } else if (zenReaderState.isFocusMode) {
          // If already in focus mode, exit it
          exitFocusMode();
          // Send response with current state (should be inactive now)
          sendResponse({
            success: true,
            isActive: false
          });
        } else {
          // Something else is happening, just report current state
          sendResponse({
            success: true,
            isActive: zenReaderState.isSelectionMode || zenReaderState.isFocusMode
          });
        }
      } else {
        // Unknown action, send error response
        sendResponse({
          success: false,
          error: "Unknown action",
          isActive: zenReaderState.isSelectionMode || zenReaderState.isFocusMode
        });
      }
    } catch (e) {
      console.log("Error handling message:", e.message);
      // Send error response with current state information
      sendResponse({
        success: false,
        error: e.message,
        isActive: zenReaderState.isSelectionMode || zenReaderState.isFocusMode
      });
    }

    // We're handling this synchronously, so no need to return true
    return false;
  });

  // Set up a periodic state verification
  setInterval(verifyStateConsistency, 2000); // Every 2 seconds
}
