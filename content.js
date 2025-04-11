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
 * Activates focus mode on the selected element
 */
function enterFocusMode() {
  if (isFocusMode || !selectedElement) return;

  isFocusMode = true;

  // Create overlay
  createOverlay();

  // Create focus container
  createFocusContainer();

  // Notify background script of state change
  chrome.runtime.sendMessage({
    action: "stateChanged",
    isActive: true
  });

  // Add event listener for ESC key to exit
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Creates the darkened overlay that covers the original page
 */
function createOverlay() {
  overlayElement = document.createElement('div');
  overlayElement.className = 'zenreader-overlay';
  document.body.appendChild(overlayElement);
}

/**
 * Creates the container that displays the focused content
 */
function createFocusContainer() {
  // Create container for focused content
  focusContainer = document.createElement('div');
  focusContainer.className = 'zenreader-focus-container';

  // Clone selected element content
  const contentClone = selectedElement.cloneNode(true);
  focusContainer.appendChild(contentClone);

  // Create exit button
  createExitButton();

  // Add to document
  document.body.appendChild(focusContainer);

  // Prevent scrolling of the background page
  document.body.style.overflow = 'hidden';
}

/**
 * Creates the exit button in the corner of focus mode
 */
function createExitButton() {
  exitButton = document.createElement('button');
  exitButton.className = 'zenreader-exit-button';
  exitButton.textContent = 'X';
  exitButton.title = chrome.i18n.getMessage("exitFocusMode");

  exitButton.addEventListener('click', exitFocusMode);

  // Add to focus container
  focusContainer.appendChild(exitButton);
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

  // Remove focus container
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
  document.body.style.overflow = '';

  // Notify background script of state change
  chrome.runtime.sendMessage({
    action: "stateChanged",
    isActive: false
  });
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
  if (message.action === 'activate') {
    // Start selection mode when activated from toolbar or context menu
    if (!isSelectionMode && !isFocusMode) {
      startSelectionMode();
    } else if (isFocusMode) {
      // If already in focus mode, exit it
      exitFocusMode();
    }
  }

  // Always return true for async response
  return true;
});
