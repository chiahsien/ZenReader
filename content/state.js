/**
 * ZenReader - State Management
 *
 * This script manages the shared state between different modules of the ZenReader extension.
 * For Chrome extensions without ES6 module support, we use this approach to share state.
 *
 * Note: zenReaderState is defined in index.js and available to all scripts.
 */

/**
 * Updates the background script state, with error handling for invalidated context
 * @param {boolean} isActive - Whether ZenReader is active
 */
function updateBackgroundState(isActive) {
  try {
    chrome.runtime.sendMessage({
      action: "stateChanged",
      isActive: isActive
    }, (response) => {
      // Check for error in the response
      if (chrome.runtime.lastError) {
        console.log("Could not communicate with background script:", chrome.runtime.lastError.message);
        // Continue without error - the UI may be slightly inconsistent but functionality will work
      }
    });
  } catch(e) {
    // Handle the case where extension context is invalidated
    console.log("Extension communication error:", e.message);
    // Continue without error - the UI may be slightly inconsistent but functionality will work
  }
}
