/**
 * ZenReader - Focus Mode Module
 *
 * This script manages the focus mode which displays the selected content in a distraction-free overlay.
 * It handles creating the overlay, focus container, and shadow DOM content.
 */

/**
 * Activates focus mode on the selected element
 * Enhanced with better state management
 */
function enterFocusMode() {
  if (zenReaderState.isFocusMode || !zenReaderState.selectedElement) return;

  // Set state to true BEFORE any other operations
  zenReaderState.isFocusMode = true;

  // Notify background script of state change immediately
  // This ensures the context menu gets updated promptly
  updateBackgroundState(true);

  // Clear the style cache before we begin
  clearStyleCache();

  // Prepare by capturing styles from the entire DOM hierarchy
  captureStylesRecursively(zenReaderState.selectedElement);

  // Create overlay
  createOverlay();

  // Create focus container
  createFocusContainer();

  // Prevent scrolling of the background page
  document.body.classList.add('zenreader-focus-active');

  // Add event listener for ESC key to exit
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Exits the focus mode and returns to normal view
 * Enhanced with better state management
 */
function exitFocusMode() {
  if (!zenReaderState.isFocusMode) return;

  // Set state to false BEFORE any other operations
  zenReaderState.isFocusMode = false;

  // Notify background script of state change immediately
  // This ensures the context menu gets updated promptly
  updateBackgroundState(false);

  // Remove overlay
  if (zenReaderState.overlayElement && zenReaderState.overlayElement.parentNode) {
    zenReaderState.overlayElement.parentNode.removeChild(zenReaderState.overlayElement);
  }

  // Remove focus container
  if (zenReaderState.focusContainer && zenReaderState.focusContainer.parentNode) {
    zenReaderState.focusContainer.parentNode.removeChild(zenReaderState.focusContainer);
  }

  // Reset other state properties
  zenReaderState.selectedElement = null;
  zenReaderState.overlayElement = null;
  zenReaderState.focusContainer = null;
  zenReaderState.exitButton = null;
  zenReaderState.aboutButton = null; // Reset about button reference
  zenReaderState.shadowRoot = null;

  // Clear the style cache
  clearStyleCache();

  // Restore scrolling
  document.body.classList.remove('zenreader-focus-active');
}

/**
 * Creates the darkened overlay that covers the original page
 * Also adds click event to allow exiting focus mode by clicking outside the container
 */
function createOverlay() {
  zenReaderState.overlayElement = document.createElement('div');
  zenReaderState.overlayElement.className = 'zenreader-overlay';

  // Add click event listener to exit focus mode when clicking the overlay
  zenReaderState.overlayElement.addEventListener('click', (event) => {
    // Ensure the click was directly on the overlay and not bubbled from content
    if (event.target === zenReaderState.overlayElement) {
      exitFocusMode();
    }
  });

  // Prevent wheel events on the overlay from affecting the underlying page
  zenReaderState.overlayElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });

  document.body.appendChild(zenReaderState.overlayElement);
}

/**
 * Opens the About page by sending a message to the background script
 */
function openAboutPage() {
  chrome.runtime.sendMessage({ action: "openAboutPage" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Error opening about page:", chrome.runtime.lastError.message);
    }
  });
}

/**
 * Creates the container that displays the focused content
 * Uses Shadow DOM for style encapsulation with enhanced style preservation
 */
function createFocusContainer() {
  // Analyze the page colors
  const colorSettings = analyzeDominantColors();

  // Determine if the selected element is likely main content
  const likelyMainContent = isMainContent(zenReaderState.selectedElement);

  // Create main container
  zenReaderState.focusContainer = document.createElement('div');
  zenReaderState.focusContainer.className = 'zenreader-focus-container';

  // Apply background color to focus container
  zenReaderState.focusContainer.style.backgroundColor = colorSettings.bgColor;

  // Create toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'zenreader-toolbar';

  // Create title element in the toolbar
  const titleElement = document.createElement('div');
  titleElement.className = 'zenreader-title';
  titleElement.textContent = document.title || 'ZenReader';

  // Create About button
  zenReaderState.aboutButton = document.createElement('button');
  zenReaderState.aboutButton.className = 'zenreader-about-button';
  zenReaderState.aboutButton.title = chrome.i18n?.getMessage("aboutZenReader") || "About ZenReader";
  zenReaderState.aboutButton.innerHTML = '?';
  zenReaderState.aboutButton.addEventListener('click', openAboutPage);

  // Create exit button
  zenReaderState.exitButton = document.createElement('button');
  zenReaderState.exitButton.className = 'zenreader-exit-button';
  zenReaderState.exitButton.innerHTML = '✕';
  zenReaderState.exitButton.title = chrome.i18n?.getMessage("exitFocusMode") || "Exit Focus Mode";
  zenReaderState.exitButton.addEventListener('click', exitFocusMode);

  // Add components to toolbar
  toolbar.appendChild(zenReaderState.aboutButton);
  toolbar.appendChild(titleElement);
  toolbar.appendChild(zenReaderState.exitButton);

  // Add toolbar to focus container
  zenReaderState.focusContainer.appendChild(toolbar);

  // Create content wrapper for scrollable content
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'zenreader-content-wrapper';

  // Set appropriate width based on content type
  contentWrapper.style.maxWidth = '100%';
  contentWrapper.style.margin = '0 auto';
  contentWrapper.style.width = '100%';

  // Attach shadow DOM to the content wrapper
  zenReaderState.shadowRoot = contentWrapper.attachShadow({ mode: 'open' });

  // Create a container for the content inside shadow DOM
  const shadowContainer = document.createElement('div');
  shadowContainer.className = 'shadow-container';

  // Set text color in the shadow container
  shadowContainer.style.color = colorSettings.textColor;
  shadowContainer.style.backgroundColor = 'transparent'; // Let parent background show through

  // Set appropriate width based on content type
  if (likelyMainContent) {
    // For main content like articles, use a readable width
    shadowContainer.style.maxWidth = '100%';
    shadowContainer.style.margin = '0 auto';
  } else {
    // For other content, use full width
    shadowContainer.style.width = '100%';
  }

  // Add necessary styles to the shadow DOM
  addStylesToShadowDOM(zenReaderState.shadowRoot, colorSettings, likelyMainContent);

  // Clone selected element with enhanced style preservation
  const contentClone = cloneElementWithStyles(zenReaderState.selectedElement, likelyMainContent);

  // Modify links to open in new tabs for safety
  modifyLinks(contentClone);

  // Add the cloned content to the shadow container
  shadowContainer.appendChild(contentClone);

  // Add the shadow container to the shadow root
  zenReaderState.shadowRoot.appendChild(shadowContainer);

  // Add content wrapper to focus container
  zenReaderState.focusContainer.appendChild(contentWrapper);

  // Add focus container to document
  document.body.appendChild(zenReaderState.focusContainer);

  // Handle wheel events
  setupWheelEventHandling(contentWrapper);
}

/**
 * Sets up wheel event handling for the content wrapper
 * @param {HTMLElement} contentWrapper - The content wrapper element
 */
function setupWheelEventHandling(contentWrapper) {
  // Prevent wheel events on the container from propagating to the page
  // but allow scrolling within the content wrapper
  zenReaderState.focusContainer.addEventListener('wheel', (event) => {
    event.stopPropagation();
  }, { capture: true });

  // Specifically handle wheel events in the content wrapper
  contentWrapper.addEventListener('wheel', (event) => {
    // Allow normal scrolling behavior within the wrapper
    // but prevent it from affecting the underlying page
    event.stopPropagation();
  }, { capture: true });
}
