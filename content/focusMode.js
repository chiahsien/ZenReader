/**
 * ZenReader - Focus Mode Module
 *
 * This script manages the focus mode which displays the selected content in a distraction-free overlay.
 * It handles creating the overlay, focus container, and shadow DOM content.
 */

/**
 * Activates focus mode on the selected element
 */
function enterFocusMode() {
  if (zenReaderState.isFocusMode || !zenReaderState.selectedElement) return;

  zenReaderState.isFocusMode = true;

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

  // Apply toolbar styles based on dark/light theme
  if (colorSettings.isDarkTheme) {
    toolbar.style.backgroundColor = adjustColorBrightness(colorSettings.bgColor, 15);
    toolbar.style.borderBottomColor = adjustColorBrightness(colorSettings.bgColor, 30);
  } else {
    toolbar.style.backgroundColor = adjustColorBrightness(colorSettings.bgColor, -10);
    toolbar.style.borderBottomColor = adjustColorBrightness(colorSettings.bgColor, -20);
  }

  // Create title element in the toolbar
  const titleElement = document.createElement('div');
  titleElement.className = 'zenreader-title';
  titleElement.textContent = document.title;
  titleElement.title = document.title; // Add tooltip for long titles

  // Set title color for contrast with toolbar
  titleElement.style.color = colorSettings.isDarkTheme ? '#f0f0f0' : '#333333';

  toolbar.appendChild(titleElement);

  // Create exit button in the toolbar
  zenReaderState.exitButton = document.createElement('button');
  zenReaderState.exitButton.className = 'zenreader-exit-button';
  zenReaderState.exitButton.textContent = 'X';
  zenReaderState.exitButton.title = chrome.i18n?.getMessage("exitFocusMode") || "Exit Focus Mode";
  zenReaderState.exitButton.addEventListener('click', exitFocusMode);

  // Style exit button based on theme
  zenReaderState.exitButton.style.backgroundColor = colorSettings.isDarkTheme ? '#555555' : '#f0f0f0';
  zenReaderState.exitButton.style.color = colorSettings.isDarkTheme ? '#ffffff' : '#333333';

  // Add exit button to toolbar
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

/**
 * Exits the focus mode and returns to normal view
 */
function exitFocusMode() {
  if (!zenReaderState.isFocusMode) return;

  // Remove overlay
  if (zenReaderState.overlayElement && zenReaderState.overlayElement.parentNode) {
    zenReaderState.overlayElement.parentNode.removeChild(zenReaderState.overlayElement);
  }

  // Remove focus container
  if (zenReaderState.focusContainer && zenReaderState.focusContainer.parentNode) {
    zenReaderState.focusContainer.parentNode.removeChild(zenReaderState.focusContainer);
  }

  // Reset state
  zenReaderState.isFocusMode = false;
  zenReaderState.selectedElement = null;
  zenReaderState.overlayElement = null;
  zenReaderState.focusContainer = null;
  zenReaderState.exitButton = null;
  zenReaderState.shadowRoot = null;

  // Clear the style cache
  clearStyleCache();

  // Restore scrolling
  document.body.classList.remove('zenreader-focus-active');

  // Notify background script of state change
  updateBackgroundState(false);
}
