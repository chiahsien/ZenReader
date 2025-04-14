/**
 * ZenReader - State Management
 *
 * This script manages the shared state between different modules of the ZenReader extension.
 * For Chrome extensions without ES6 module support, we use this approach to share state.
 *
 * Note: zenReaderState is defined in index.js and available to all scripts.
 */

/**
 * Updates the background script state, with enhanced error handling
 * and retry mechanism for stability
 * @param {boolean} isActive - Whether ZenReader is active
 */
function updateBackgroundState(isActive) {
  // Keep track of the current state in a simplified way
  zenReaderState.currentStateActive = isActive;

  // Use a retry mechanism for better reliability
  const maxRetries = 3;
  let retryCount = 0;

  function attemptStateUpdate() {
    try {
      chrome.runtime.sendMessage({
        action: "stateChanged",
        isActive: isActive
      }, (response) => {
        // Check for error in the response
        if (chrome.runtime.lastError) {
          console.log("Could not communicate with background script:", chrome.runtime.lastError.message);

          // Retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptStateUpdate, 100 * retryCount); // Exponential backoff
          }
        } else if (!response || !response.success) {
          // Message was sent but we got an unsuccessful response
          console.log("Background script returned unsuccessful response");

          // Retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptStateUpdate, 100 * retryCount);
          }
        }
        // If we got a successful response, we're done!
      });
    } catch (e) {
      // Handle the case where extension context is invalidated
      console.log("Extension communication error:", e.message);

      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptStateUpdate, 100 * retryCount);
      }
    }
  }

  // Start the first attempt
  attemptStateUpdate();
}

/**
 * Helper function to validate our current state matches what's shown in the UI
 * Can be called periodically or on key events
 */
function verifyStateConsistency() {
  const currentActive = zenReaderState.isFocusMode;

  // If our tracked state doesn't match the actual UI state, update background
  if (zenReaderState.currentStateActive !== currentActive) {
    console.log("State inconsistency detected, updating background");
    updateBackgroundState(currentActive);
  }
}
