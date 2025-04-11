/**
 * ZenReader - Content Script with Enhanced Style Preservation
 *
 * This script manages the interaction with the web page, including:
 * - Element selection mode
 * - Focus mode activation/deactivation with Shadow DOM
 * - Visual styling and overlays
 * - Enhanced style preservation and inheritance
 * - Improved width handling
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
let styleCache = new Map(); // Cache for computed styles

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
 * Analyzes selected element to determine if it's a main content container
 * @param {HTMLElement} element - The element to analyze
 * @returns {Boolean} - True if the element appears to be main content
 */
function isMainContent(element) {
  if (!element) return false;

  // Check tag name - articles and sections are likely main content
  const tagName = element.tagName.toLowerCase();
  if (['article', 'main', 'section'].includes(tagName)) {
    return true;
  }

  // Check class names for common content indicators
  const className = element.className;
  if (className && typeof className === 'string') {
    const lcClass = className.toLowerCase();
    const contentIndicators = ['content', 'article', 'post', 'entry', 'main', 'body'];
    if (contentIndicators.some(indicator => lcClass.includes(indicator))) {
      return true;
    }
  }

  // Check ID for content indicators
  const id = element.id;
  if (id && typeof id === 'string') {
    const lcId = id.toLowerCase();
    const contentIndicators = ['content', 'article', 'post', 'entry', 'main', 'body'];
    if (contentIndicators.some(indicator => lcId.includes(indicator))) {
      return true;
    }
  }

  // Check if it has common content elements
  const hasParagraphs = element.querySelectorAll('p').length > 1;
  const hasHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;

  return hasParagraphs && hasHeadings;
}

/**
 * Activates focus mode on the selected element
 */
function enterFocusMode() {
  if (isFocusMode || !selectedElement) return;

  isFocusMode = true;

  // Clear the style cache before we begin
  styleCache.clear();

  // Prepare by capturing styles from the entire DOM hierarchy
  captureStylesRecursively(selectedElement);

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
 * Recursively captures and caches computed styles for an element and its children
 * @param {HTMLElement} element - The element to capture styles from
 */
function captureStylesRecursively(element) {
  // Skip if element is null or not an element node
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

  // Capture this element's computed style
  if (!styleCache.has(element)) {
    styleCache.set(element, window.getComputedStyle(element));
  }

  // Recursively capture styles for all children
  Array.from(element.children).forEach(child => {
    captureStylesRecursively(child);
  });
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
 * Analyzes the whole page to determine dominant text and background colors
 * @returns {Object} - Object containing dominant colors
 */
function analyzeDominantColors() {
  // Create default color settings
  const colorSettings = {
    textColor: '#000000',
    bgColor: '#ffffff',
    isDarkTheme: false
  };

  try {
    // Get body computed style
    const bodyStyle = window.getComputedStyle(document.body);

    // Try to determine if the page uses a dark theme
    const bodyBgColor = bodyStyle.backgroundColor;
    const bodyTextColor = bodyStyle.color;

    // If we have valid colors from the body
    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
      colorSettings.bgColor = bodyBgColor;
      colorSettings.isDarkTheme = isColorDark(bodyBgColor);
    }

    if (bodyTextColor && bodyTextColor !== 'rgba(0, 0, 0, 0)') {
      colorSettings.textColor = bodyTextColor;
    }

    // Now check our selected element and its parents
    let element = selectedElement;
    while (element && element !== document.body) {
      const style = styleCache.get(element) || window.getComputedStyle(element);

      const bgColor = style.backgroundColor;
      const textColor = style.color;

      // If element has non-transparent background, use it
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colorSettings.bgColor = bgColor;
        colorSettings.isDarkTheme = isColorDark(bgColor);
        break; // Found a definitive background color
      }

      // Update text color if it's defined
      if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
        colorSettings.textColor = textColor;
      }

      element = element.parentElement;
    }

    // Sanity check for color contrast
    if (colorSettings.isDarkTheme && !isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else if (!colorSettings.isDarkTheme && isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else {
      // Poor contrast, force better colors
      colorSettings.textColor = colorSettings.isDarkTheme ? '#ffffff' : '#000000';
    }
  } catch (e) {
    console.error('Error analyzing colors:', e);
    // Fallback to defaults if there's an error
  }

  return colorSettings;
}

/**
 * Determines if a color is dark based on its brightness
 * @param {String} color - The color to check (hex, rgb, or rgba)
 * @returns {Boolean} - True if the color is dark
 */
function isColorDark(color) {
  // Parse the color to get RGB values
  let r, g, b;

  if (!color) return false;

  try {
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      // RGB or RGBA color
      const parts = color.match(/\d+/g).map(Number);
      r = parts[0];
      g = parts[1];
      b = parts[2];
    } else {
      // Unknown color format
      return false;
    }

    // Calculate perceived brightness using the formula:
    // (0.299*R + 0.587*G + 0.114*B)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

    // Return true if the color is dark (brightness < 128)
    return brightness < 128;
  } catch (e) {
    console.error('Error determining color brightness:', e);
    return false;
  }
}

/**
 * Adjusts a color's brightness by a percentage
 * @param {String} color - The color to adjust (hex, rgb, or rgba)
 * @param {Number} percent - The percentage to adjust (-100 to 100)
 * @returns {String} - The adjusted color in rgb format
 */
function adjustColorBrightness(color, percent) {
  let r, g, b, a = 1;

  if (!color) return 'rgb(255, 255, 255)';

  try {
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      // RGB or RGBA color
      const parts = color.match(/\d+/g).map(Number);
      r = parts[0];
      g = parts[1];
      b = parts[2];
      if (parts.length > 3) {
        a = parseFloat(parts[3]);
      }
    } else {
      // Default to white
      return 'rgb(255, 255, 255)';
    }

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + Math.floor(r * percent / 100)));
    g = Math.max(0, Math.min(255, g + Math.floor(g * percent / 100)));
    b = Math.max(0, Math.min(255, b + Math.floor(b * percent / 100)));

    // Return adjusted color
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    console.error('Error adjusting color brightness:', e);
    return 'rgb(255, 255, 255)';
  }
}

/**
 * Creates the container that displays the focused content
 * Uses Shadow DOM for style encapsulation with enhanced style preservation
 */
function createFocusContainer() {
  // Analyze the page colors
  const colorSettings = analyzeDominantColors();

  // Determine if the selected element is likely main content
  const likelyMainContent = isMainContent(selectedElement);

  // Create main container
  focusContainer = document.createElement('div');
  focusContainer.className = 'zenreader-focus-container';

  // Apply background color to focus container
  focusContainer.style.backgroundColor = colorSettings.bgColor;

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
  exitButton = document.createElement('button');
  exitButton.className = 'zenreader-exit-button';
  exitButton.textContent = 'X';
  exitButton.title = chrome.i18n?.getMessage("exitFocusMode") || "Exit Focus Mode";
  exitButton.addEventListener('click', exitFocusMode);

  // Style exit button based on theme
  exitButton.style.backgroundColor = colorSettings.isDarkTheme ? '#555555' : '#f0f0f0';
  exitButton.style.color = colorSettings.isDarkTheme ? '#ffffff' : '#333333';

  // Add exit button to toolbar
  toolbar.appendChild(exitButton);

  // Add toolbar to focus container
  focusContainer.appendChild(toolbar);

  // Create content wrapper for scrollable content
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'zenreader-content-wrapper';

  // Set appropriate width based on content type
  contentWrapper.style.maxWidth = '100%';
  contentWrapper.style.margin = '0 auto';
  contentWrapper.style.width = '100%';

  // Attach shadow DOM to the content wrapper
  shadowRoot = contentWrapper.attachShadow({ mode: 'open' });

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
  addStylesToShadowDOM(shadowRoot, colorSettings, likelyMainContent);

  // Clone selected element with enhanced style preservation
  const contentClone = cloneElementWithStyles(selectedElement, likelyMainContent);

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
 * Creates a deep clone of an element with inline styles preserved
 * @param {HTMLElement} element - The element to clone
 * @param {Boolean} isMainContent - Whether this is likely main content
 * @returns {HTMLElement} - The cloned element with preserved styles
 */
function cloneElementWithStyles(element, isMainContent) {
  // Create a deep clone of the element
  const clone = element.cloneNode(true);

  // Apply computed styles to the clone inline
  applyComputedStylesToElement(clone, element, isMainContent, true);

  // Process all child nodes recursively, but limit depth for performance
  processChildrenWithStyles(clone, element, isMainContent, 0);

  return clone;
}

/**
 * Recursively processes children applying styles with a depth limit
 * @param {HTMLElement} targetElement - The cloned target element
 * @param {HTMLElement} sourceElement - The original source element
 * @param {Boolean} isMainContent - Whether this is main content
 * @param {Number} depth - Current recursion depth
 */
function processChildrenWithStyles(targetElement, sourceElement, isMainContent, depth) {
  // Limit recursion depth to prevent performance issues
  const MAX_DEPTH = 5;

  if (depth > MAX_DEPTH) return;

  const sourceChildren = sourceElement.children;
  const targetChildren = targetElement.children;

  // Process direct children
  for (let i = 0; i < sourceChildren.length; i++) {
    if (i < targetChildren.length && sourceChildren[i].nodeType === Node.ELEMENT_NODE) {
      // Apply styles to this child
      applyComputedStylesToElement(targetChildren[i], sourceChildren[i], isMainContent, false);

      // Recursively process its children
      if (sourceChildren[i].children.length > 0) {
        processChildrenWithStyles(targetChildren[i], sourceChildren[i], isMainContent, depth + 1);
      }
    }
  }
}

/**
 * The key style properties that should be preserved inline during cloning
 */
const IMPORTANT_STYLE_PROPERTIES = [
  // Text properties
  'color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'line-height', 'letter-spacing',

  // Background properties
  'background-color', 'background-image', 'background-size', 'background-position',

  // Layout properties
  'display', 'position', 'margin', 'padding', 'border',

  // Visual properties
  'opacity', 'box-shadow', 'border-radius'
];

/**
 * Applies computed styles from a source element to a target element
 * @param {HTMLElement} targetElement - The element to apply styles to
 * @param {HTMLElement} sourceElement - The element to get styles from
 * @param {Boolean} isMainContent - Whether this is likely main content
 * @param {Boolean} isTopLevel - Whether this is the top-level element
 */
function applyComputedStylesToElement(targetElement, sourceElement, isMainContent, isTopLevel) {
  if (!targetElement || !sourceElement || targetElement.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  // Get the computed style for the source element
  const computedStyle = styleCache.get(sourceElement) || window.getComputedStyle(sourceElement);

  // Skip elements with no valid computed style (may happen with detached elements)
  if (!computedStyle.color) {
    return;
  }

  // Apply width specially - we want to ensure content fills the container appropriately
  if (isTopLevel) {
    // Force top-level element to full width
    targetElement.style.setProperty('width', '100%', 'important');
    targetElement.style.setProperty('max-width', '100%', 'important');
    targetElement.style.setProperty('box-sizing', 'border-box', 'important');
    targetElement.style.setProperty('padding-left', '0', 'important');
    targetElement.style.setProperty('padding-right', '0', 'important');

    // Handle float that might cause layout issues
    if (computedStyle.float && computedStyle.float !== 'none') {
      targetElement.style.setProperty('float', 'none', 'important');
    }

    // Remove any fixed positioning
    if (computedStyle.position === 'fixed' || computedStyle.position === 'absolute') {
      targetElement.style.setProperty('position', 'relative', 'important');
    }

    // Remove side margins that might push content to one side
    targetElement.style.setProperty('margin-left', '0', 'important');
    targetElement.style.setProperty('margin-right', '0', 'important');

    // Handle column layouts
    if (computedStyle.columnCount && computedStyle.columnCount !== 'auto') {
      targetElement.style.setProperty('column-count', '1', 'important');
    }

    // Reset any transforms
    if (computedStyle.transform && computedStyle.transform !== 'none') {
      targetElement.style.setProperty('transform', 'none', 'important');
    }
  } else {
    // For non-top-level elements, handle width differently based on element type
    const tagName = targetElement.tagName.toLowerCase();

    // Handle elements that should always be full width
    const shouldBeFull = ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside'];
    if (shouldBeFull.includes(tagName)) {
      // Only force width if it has content or other elements inside
      if (sourceElement.children.length > 0 || sourceElement.innerText.trim().length > 0) {
        targetElement.style.setProperty('width', '100%', 'important');
      }
    }

    // Images, videos, iframes should preserve aspect ratio but fit container
    if (['img', 'video', 'iframe', 'canvas', 'svg'].includes(tagName)) {
      targetElement.style.setProperty('max-width', '100%', 'important');
      targetElement.style.setProperty('height', 'auto', 'important');

      // Center media elements
      if (tagName === 'img' || tagName === 'video') {
        // Only center if it's a standalone image (parent only has this element)
        if (sourceElement.parentElement && sourceElement.parentElement.children.length === 1) {
          targetElement.style.setProperty('display', 'block', 'important');
          targetElement.style.setProperty('margin-left', 'auto', 'important');
          targetElement.style.setProperty('margin-right', 'auto', 'important');
        }
      }
    }

    // Tables should have appropriate width and scroll if needed
    if (tagName === 'table') {
      targetElement.style.setProperty('width', '100%', 'important');
      targetElement.style.setProperty('max-width', '100%', 'important');

      // Add horizontal scrolling for wide tables
      if (sourceElement.offsetWidth > 500) { // If table is relatively wide
        targetElement.style.setProperty('display', 'block', 'important');
        targetElement.style.setProperty('overflow-x', 'auto', 'important');
      }
    }

    // Container divs should expand fully
    if (tagName === 'div') {
      // Determine if this div is a major container (has many children or paragraphs)
      const hasParagraphs = sourceElement.querySelectorAll('p').length > 0;
      const hasHeadings = sourceElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
      const hasMultipleChildren = sourceElement.children.length > 2;

      if (hasParagraphs || hasHeadings || hasMultipleChildren) {
        targetElement.style.setProperty('width', '100%', 'important');

        // Check for common container class names
        const className = targetElement.className || '';
        const containsContentClass = /content|article|post|main|body|text/i.test(className);

        if (containsContentClass) {
          targetElement.style.setProperty('max-width', '100%', 'important');
          targetElement.style.setProperty('margin-left', '0', 'important');
          targetElement.style.setProperty('margin-right', '0', 'important');
        }
      }
    }
  }

  // Preserve original display value unless it's none
  const displayValue = computedStyle.display;
  if (displayValue !== 'none') {
    targetElement.style.setProperty('display', displayValue, 'important');
  }

  // Apply background-color only if it's not transparent
  const bgColor = computedStyle.backgroundColor;
  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
    targetElement.style.setProperty('background-color', bgColor, 'important');
  }

  // Apply text color
  const textColor = computedStyle.color;
  if (textColor) {
    targetElement.style.setProperty('color', textColor, 'important');
  }

  // Apply other important properties
  IMPORTANT_STYLE_PROPERTIES.forEach(prop => {
    const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const value = computedStyle[camelProp];

    // Skip width-related properties for top-level elements as we've handled them specially
    if (isTopLevel && (prop === 'width' || prop === 'max-width')) {
      return;
    }

    if (value && value !== 'none' && value !== 'normal' && value !== '0px' &&
        value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
      targetElement.style[camelProp] = value;
    }
  });

  // Special handling for links
  if (targetElement.tagName === 'A') {
    // Preserve link color and decoration
    targetElement.style.color = computedStyle.color;
    targetElement.style.textDecoration = computedStyle.textDecoration;
  }

  // Special handling for images
  if (targetElement.tagName === 'IMG') {
    targetElement.style.maxWidth = '100%';
    targetElement.style.height = 'auto';
    targetElement.style.display = 'inline-block';
  }

  // Special handling for common tags
  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(targetElement.tagName)) {
    // Keep heading styles
    targetElement.style.fontWeight = computedStyle.fontWeight || 'bold';
    targetElement.style.margin = computedStyle.margin || '0.5em 0';
    targetElement.style.lineHeight = computedStyle.lineHeight || '1.2';
  }

  if (targetElement.tagName === 'P') {
    // Keep paragraph spacing
    targetElement.style.margin = computedStyle.margin || '1em 0';
  }

  if (['UL', 'OL'].includes(targetElement.tagName)) {
    // Keep list styles
    targetElement.style.paddingLeft = computedStyle.paddingLeft || '40px';
    targetElement.style.marginTop = computedStyle.marginTop || '1em';
    targetElement.style.marginBottom = computedStyle.marginBottom || '1em';
  }

  if (targetElement.tagName === 'PRE' || targetElement.tagName === 'CODE') {
    // Keep code formatting
    targetElement.style.fontFamily = 'monospace';
    targetElement.style.whiteSpace = 'pre-wrap';
    targetElement.style.backgroundColor = computedStyle.backgroundColor || '#f5f5f5';
    targetElement.style.padding = computedStyle.padding || '0.2em 0.4em';
    targetElement.style.width = '100%';
    targetElement.style.overflow = 'auto';
  }

  // Add data attribute to mark as processed
  targetElement.setAttribute('data-zenreader-styled', 'true');
}

/**
 * Modifies links in the cloned content for safety and fixes common layout issues
 * @param {HTMLElement} element - The cloned element
 */
function modifyLinks(element) {
  // First fix links
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

  // Now fix common layout issues

  // 1. Fix floating elements issues
  const floatElements = element.querySelectorAll('[style*="float:"], [style*="float :"]');
  floatElements.forEach(el => {
    // Prevent floating that might break layout
    if (el.tagName !== 'IMG') { // Keep float for images if needed
      el.style.setProperty('float', 'none', 'important');
      el.style.setProperty('width', '100%', 'important');
    }
  });

  // 2. Fix absolutely positioned elements
  const absElements = element.querySelectorAll('[style*="position:absolute"], [style*="position: absolute"]');
  absElements.forEach(el => {
    el.style.setProperty('position', 'relative', 'important');
    el.style.setProperty('top', 'auto', 'important');
    el.style.setProperty('left', 'auto', 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
  });

  // 3. Fix multi-column layouts
  const colElements = element.querySelectorAll('[style*="column-count"], [style*="columns"]');
  colElements.forEach(el => {
    el.style.setProperty('column-count', '1', 'important');
    el.style.setProperty('columns', 'auto', 'important');
  });

  // 4. Fix fixed-width containers
  const containers = element.querySelectorAll('div, article, section, main');
  containers.forEach(container => {
    // Check for narrow fixed width
    const style = window.getComputedStyle(container);
    const widthValue = parseInt(style.width);

    // If width is fixed and less than 90% of parent
    if (!isNaN(widthValue) && !style.width.includes('%') && widthValue < 800) {
      container.style.setProperty('width', '100%', 'important');
      container.style.setProperty('max-width', '100%', 'important');
    }
  });

  // 5. Fix specific side-aligned elements
  const sideElements = element.querySelectorAll('[class*="left"], [class*="right"], [class*="side"]');
  sideElements.forEach(el => {
    if (el.tagName !== 'IMG' && el.tagName !== 'SPAN') {
      el.style.setProperty('float', 'none', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('margin-left', '0', 'important');
      el.style.setProperty('margin-right', '0', 'important');
    }
  });
}

/**
 * Adds styles to the shadow DOM to maintain original content styling
 * @param {ShadowRoot} shadow - The shadow root to add styles to
 * @param {Object} colors - The color settings determined for the page
 * @param {Boolean} isMainContent - Whether this is likely main content
 */
function addStylesToShadowDOM(shadow, colors, isMainContent) {
  // Create style element for base styles
  const baseStyle = document.createElement('style');

  // Default styles
  baseStyle.textContent = `
    .shadow-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
      color: ${colors.isDarkTheme ? '#6ea8fe' : '#0066cc'};
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    th, td {
      border: 1px solid ${colors.isDarkTheme ? '#555' : '#ddd'};
      padding: 8px;
    }

    pre, code {
      background-color: ${colors.isDarkTheme ? '#2d2d2d' : '#f5f5f5'};
      border-radius: 3px;
      padding: 0.2em 0.4em;
      font-family: monospace;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    /* List spacing */
    ul, ol {
      padding-left: 40px;
      margin: 1em 0;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      line-height: 1.2;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.3em; }
    h4 { font-size: 1.2em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; }

    /* Block quotes */
    blockquote {
      border-left: 4px solid ${colors.isDarkTheme ? '#555' : '#ddd'};
      padding-left: 1em;
      margin-left: 0;
      margin-right: 0;
      font-style: italic;
    }

    /* Fix for common width issues */
    * {
      max-width: 100%;
      box-sizing: border-box;
    }

    /* Special styles for article content */
    ${isMainContent ? `
      .shadow-container > * {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
      }

      /* Special styles for text containers in articles */
      .shadow-container > div,
      .shadow-container > section,
      .shadow-container > article {
        width: 100% !important;
      }
    ` : ''}
  `;
shadow.appendChild(baseStyle);

  // Try to copy stylesheets from the original page with an enhanced approach
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

    // Add special handling for common dynamic style changes
    // This helps with sites that modify styles via JavaScript and fixes width issues
    const specialStylesElement = document.createElement('style');
    specialStylesElement.textContent = `
      /* Fix width issues - ensure all elements respect container boundaries */
      *, *::before, *::after {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }

      /* Remove any fixed positioning that could cause layout issues */
      [style*="position: fixed"],
      [style*="position:fixed"] {
        position: relative !important;
      }

      /* Remove any absolute positioning at the top level that could cause layout issues */
      .shadow-container > [style*="position: absolute"],
      .shadow-container > [style*="position:absolute"] {
        position: relative !important;
      }

      /* Fix for floated elements */
      .shadow-container::after {
        content: "";
        display: table;
        clear: both;
      }

      /* Force main content containers to fill width */
      div[class*="content"],
      div[class*="article"],
      div[class*="post"],
      div[id*="content"],
      div[id*="article"],
      div[id*="post"],
      article, section, main {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }

      /* Ensure grid and flex items expand properly */
      [class*="grid"] > *,
      [class*="flex"] > *,
      [style*="display: grid"] > *,
      [style*="display:grid"] > *,
      [style*="display: flex"] > *,
      [style*="display:flex"] > * {
        width: 100%;
      }

      /* Ensure code blocks are readable */
      pre, code, .code, [class*="code"] {
        font-family: monospace !important;
        white-space: pre-wrap !important;
        background-color: ${colors.isDarkTheme ? '#2d2d2d' : '#f5f5f5'} !important;
        color: ${colors.isDarkTheme ? '#e0e0e0' : '#333'} !important;
        width: 100% !important;
        overflow-x: auto !important;
      }

      /* Ensure links are visible */
      a:not([data-zenreader-styled]) {
        color: ${colors.isDarkTheme ? '#6ea8fe' : '#0066cc'} !important;
        text-decoration: underline !important;
      }

      /* Ensure tables are visible and fit container */
      table:not([data-zenreader-styled]) {
        border-collapse: collapse !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 1em 0 !important;
        table-layout: auto !important;
        display: block !important;
        overflow-x: auto !important;
      }

      /* Ensure images don't overflow */
      img:not([data-zenreader-styled]) {
        max-width: 100% !important;
        height: auto !important;
        object-fit: contain !important;
      }

      /* Fix for common sidebar layouts */
      [class*="sidebar"],
      [id*="sidebar"],
      aside {
        float: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
    shadow.appendChild(specialStylesElement);

  } catch (e) {
    console.error('Error copying styles to shadow DOM:', e);
  }
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

  // Clear the style cache
  styleCache.clear();

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
