/**
 * ZenReader - Content Script
 *
 * This script manages the interaction with the web page, including:
 * - Element selection mode
 * - Focus mode activation/deactivation
 * - Visual styling and overlays
 * - Keyboard shortcuts handling
 */

// State management
let isSelectionMode = false;
let isFocusMode = false;
let selectedElement = null;
let overlayElement = null;
let focusContainer = null;
let exitButton = null;

/**
 * Initializes the selection mode allowing users to pick an element to focus on
 */
function startSelectionMode() {
  if (isSelectionMode || isFocusMode) return;

  isSelectionMode = true;

  // Add hover effect on mouseover
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleElementSelection, true);

  // Allow cancellation with ESC key
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Handles mouse over events during selection mode
 * @param {Event} event - The mouseover event
 */
function handleMouseOver(event) {
  if (!isSelectionMode) return;

  const target = event.target;

  // Skip body and html elements
  if (target === document.body || target === document.documentElement) return;

  // Add visual indicator for hover
  target.classList.add('zenreader-hover');
  event.stopPropagation();
}

/**
 * Handles mouse out events during selection mode
 * @param {Event} event - The mouseout event
 */
function handleMouseOut(event) {
  if (!isSelectionMode) return;

  const target = event.target;

  // Remove visual indicator
  target.classList.remove('zenreader-hover');
  event.stopPropagation();
}

/**
 * Handles element selection when user clicks during selection mode
 * @param {Event} event - The click event
 */
function handleElementSelection(event) {
  if (!isSelectionMode) return;

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  // Save the selected element
  selectedElement = event.target;

  // Exit selection mode
  exitSelectionMode();

  // Enter focus mode
  enterFocusMode();
}

/**
 * Exits the selection mode
 */
function exitSelectionMode() {
  if (!isSelectionMode) return;

  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleElementSelection, true);

  // Remove hover effect from all elements
  const hoverElements = document.querySelectorAll('.zenreader-hover');
  hoverElements.forEach(el => el.classList.remove('zenreader-hover'));

  isSelectionMode = false;
}

/**
 * Handles wheel events to prevent scroll propagation to underlying page
 * @param {WheelEvent} event - The wheel event
 */
function handleWheelEvent(event) {
  // Prevent the wheel event from propagating to the underlying page
  event.stopPropagation();
}

/**
 * Activates focus mode on the selected element
 */
function enterFocusMode() {
  if (isFocusMode || !selectedElement) return;

  isFocusMode = true;

  // Create overlay
  createOverlay();

  // Create focus container
  createFocusContainer();

  // Prevent scrolling of the background page
  document.body.classList.add('zenreader-focus-active');

  // Notify background script of state change
  updateBackgroundState(true);

  // Add event listener for ESC key to exit
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Creates the darkened overlay that covers the original page
 * Also adds click event to allow exiting focus mode by clicking outside the container
 */
function createOverlay() {
  overlayElement = document.createElement('div');
  overlayElement.className = 'zenreader-overlay';

  // Add click event listener to exit focus mode when clicking the overlay
  overlayElement.addEventListener('click', (event) => {
    // Ensure the click was directly on the overlay and not bubbled from content
    if (event.target === overlayElement) {
      exitFocusMode();
    }
  });

  // Prevent wheel events on the overlay from affecting the underlying page
  overlayElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });

  document.body.appendChild(overlayElement);
}

/**
 * Creates the container that displays the focused content
 */
function createFocusContainer() {
  // Create main container
  focusContainer = document.createElement('div');
  focusContainer.className = 'zenreader-focus-container';

  // Create toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'zenreader-toolbar';

  // Create title element in the toolbar
  const titleElement = document.createElement('div');
  titleElement.className = 'zenreader-title';
  titleElement.textContent = document.title;
  titleElement.title = document.title; // Add tooltip for long titles
  toolbar.appendChild(titleElement);

  // Create exit button in the toolbar
  exitButton = document.createElement('button');
  exitButton.className = 'zenreader-exit-button';
  exitButton.textContent = 'X';
  exitButton.title = chrome.i18n?.getMessage("exitFocusMode") || "Exit Focus Mode";
  exitButton.addEventListener('click', exitFocusMode);

  // Add exit button to toolbar
  toolbar.appendChild(exitButton);

  // Add toolbar to focus container
  focusContainer.appendChild(toolbar);

  // Create content wrapper for scrollable content
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'zenreader-content-wrapper';

  // Clone selected element content
  const contentClone = selectedElement.cloneNode(true);
  contentWrapper.appendChild(contentClone);

  // Add content wrapper to focus container
  focusContainer.appendChild(contentWrapper);

  // Add focus container to document
  document.body.appendChild(focusContainer);

  // Prevent wheel events on the container from propagating to the page
  // but allow scrolling within the content wrapper
  focusContainer.addEventListener('wheel', (event) => {
    event.stopPropagation();
  }, { capture: true });

  // Specifically handle wheel events in the content wrapper
  contentWrapper.addEventListener('wheel', (event) => {
    // Allow normal scrolling behavior within the wrapper
    // but prevent it from affecting the underlying page
    event.stopPropagation();
  }, { capture: true });
}

/**
 * Exits the focus mode and returns to normal view
 */
function exitFocusMode() {
  if (!isFocusMode) return;

  // Remove overlay
  if (overlayElement && overlayElement.parentNode) {
    overlayElement.parentNode.removeChild(overlayElement);
  }

  // Remove focus container (which includes the toolbar and exit button)
  if (focusContainer && focusContainer.parentNode) {
    focusContainer.parentNode.removeChild(focusContainer);
  }

  // Reset state
  isFocusMode = false;
  selectedElement = null;
  overlayElement = null;
  focusContainer = null;
  exitButton = null;

  // Restore scrolling
  document.body.classList.remove('zenreader-focus-active');

  // Notify background script of state change
  updateBackgroundState(false);
}

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

/**
 * Handles keydown events for shortcut keys
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeyDown(event) {
  // ESC key to exit
  if (event.key === 'Escape') {
    if (isSelectionMode) {
      exitSelectionMode();
    } else if (isFocusMode) {
      exitFocusMode();
    }
  }
}

/**
 * Handles messages from the background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'activate') {
      // Start selection mode when activated from toolbar or context menu
      if (!isSelectionMode && !isFocusMode) {
        startSelectionMode();
      } else if (isFocusMode) {
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
