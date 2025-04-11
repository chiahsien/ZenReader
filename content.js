/**
 * ZenReader - Content Script (Modified with Method 3: Shadow DOM)
 *
 * This script manages the interaction with the web page, including:
 * - Element selection mode
 * - Focus mode activation/deactivation with Shadow DOM
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
let shadowRoot = null;

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
 * Uses Shadow DOM for style encapsulation
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

  // Get page background and text colors
  const bodyStyle = window.getComputedStyle(document.body);
  const originalBgColor = bodyStyle.backgroundColor;
  const originalColor = bodyStyle.color;

  // Apply to focus container if they're not transparent/default
  if (originalBgColor !== 'rgba(0, 0, 0, 0)' && originalBgColor !== 'transparent') {
    focusContainer.style.backgroundColor = originalBgColor;
  }

  // Attach shadow DOM to the content wrapper
  shadowRoot = contentWrapper.attachShadow({ mode: 'open' });

  // Create a container for the content inside shadow DOM
  const shadowContainer = document.createElement('div');
  shadowContainer.className = 'shadow-container';
  if (originalColor !== '' && originalColor !== 'rgb(0, 0, 0)') {
    shadowContainer.style.color = originalColor;
  }

  // Add necessary styles to the shadow DOM
  addStylesToShadowDOM(shadowRoot);

  // Clone selected element content
  const contentClone = selectedElement.cloneNode(true);

  // Modify links to open in new tabs for safety
  modifyLinks(contentClone);

  // Add the cloned content to the shadow container
  shadowContainer.appendChild(contentClone);

  // Add the shadow container to the shadow root
  shadowRoot.appendChild(shadowContainer);

  // Add content wrapper to focus container
  focusContainer.appendChild(contentWrapper);

  // Add focus container to document
  document.body.appendChild(focusContainer);

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
 * Adds styles to the shadow DOM to maintain original content styling
 * @param {ShadowRoot} shadow - The shadow root to add styles to
 */
function addStylesToShadowDOM(shadow) {
  // Create style element for base styles
  const baseStyle = document.createElement('style');
  baseStyle.textContent = `
    .shadow-container {
      font-family: inherit;
      line-height: 1.5;
      padding: 20px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }

    /* Basic element styles */
    p, div, span, h1, h2, h3, h4, h5, h6 {
      margin-bottom: 1em;
    }

    a {
      color: #0066cc;
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }

    pre, code {
      background-color: #f5f5f5;
      border-radius: 3px;
      padding: 0.2em 0.4em;
      font-family: monospace;
    }
  `;

  shadow.appendChild(baseStyle);

  // Copy stylesheets from the original page
  try {
    // Get all stylesheets from the document
    const styleSheets = Array.from(document.styleSheets);

    // Process each stylesheet
    styleSheets.forEach(sheet => {
      try {
        // Skip cross-origin stylesheets
        if (!sheet.cssRules) return;

        // Create a new style element for each stylesheet
        const style = document.createElement('style');

        // Get all the CSS rules
        Array.from(sheet.cssRules).forEach(rule => {
          try {
            // Add each rule to our style element
            style.textContent += rule.cssText + '\n';
          } catch (ruleError) {
            // Skip individual rules that cause errors
            console.debug('Could not access rule:', ruleError);
          }
        });

        // Add the style to the shadow DOM
        shadow.appendChild(style);
      } catch (sheetError) {
        // Skip stylesheets that cause errors (likely cross-origin)
        console.debug('Could not access stylesheet:', sheetError);
      }
    });

    // Copy any inline styles
    const inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach(inlineStyle => {
      const style = document.createElement('style');
      style.textContent = inlineStyle.textContent;
      shadow.appendChild(style);
    });

    // Add computed styles from the selected element
    const computedStyle = window.getComputedStyle(selectedElement);
    const elementStyle = document.createElement('style');
    elementStyle.textContent = `
      .shadow-container {
        color: ${computedStyle.color};
        font-family: ${computedStyle.fontFamily};
        font-size: ${computedStyle.fontSize};
        line-height: ${computedStyle.lineHeight};
      }
    `;
    shadow.appendChild(elementStyle);
  } catch (e) {
    console.error('Error copying styles to shadow DOM:', e);
  }
}

/**
 * Modifies links in the cloned content for safety
 * @param {HTMLElement} element - The cloned element
 */
function modifyLinks(element) {
  const links = element.querySelectorAll('a');
  links.forEach(link => {
    // Preserve the href
    const href = link.getAttribute('href');
    if (href) {
      // Make sure relative links still work
      if (href.startsWith('/') || !href.includes('://')) {
        // Get the base URL of the current page
        const baseUrl = window.location.origin;
        link.setAttribute('href', baseUrl + (href.startsWith('/') ? href : '/' + href));
      }
    }

    // Open links in new tabs for safety
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
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
  shadowRoot = null;

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
