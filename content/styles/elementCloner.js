/**
 * ZenReader - Element Cloner Module
 *
 * This script handles the cloning of DOM elements with style preservation,
 * ensuring that cloned elements maintain their original appearance.
 */

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
  const computedStyle = getStyleFromCache(sourceElement) || window.getComputedStyle(sourceElement);

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
  if (targetElement.tagName.toLowerCase() === 'a') {
    // Preserve link color and decoration
    targetElement.style.color = computedStyle.color;
    targetElement.style.textDecoration = computedStyle.textDecoration;
  }

  // Special handling for images
  if (targetElement.tagName.toLowerCase() === 'img') {
    targetElement.style.maxWidth = '100%';
    targetElement.style.height = 'auto';
    targetElement.style.display = 'inline-block';
  }

  // Special handling for common tags
  const tagNameUpper = targetElement.tagName.toUpperCase();
  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagNameUpper)) {
    // Keep heading styles
    targetElement.style.fontWeight = computedStyle.fontWeight || 'bold';
    targetElement.style.margin = computedStyle.margin || '0.5em 0';
    targetElement.style.lineHeight = computedStyle.lineHeight || '1.2';
  }

  if (tagNameUpper === 'P') {
    // Keep paragraph spacing
    targetElement.style.margin = computedStyle.margin || '1em 0';
  }

  if (['UL', 'OL'].includes(tagNameUpper)) {
    // Keep list styles
    targetElement.style.paddingLeft = computedStyle.paddingLeft || '40px';
    targetElement.style.marginTop = computedStyle.marginTop || '1em';
    targetElement.style.marginBottom = computedStyle.marginBottom || '1em';
  }

  if (tagNameUpper === 'PRE' || tagNameUpper === 'CODE') {
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
