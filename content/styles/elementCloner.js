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

  // Key improvement: Check if element belongs to a potential tag collection
  // Preserve the original arrangement of inline elements
  const isPossibleTag = isPossibleTagElement(sourceElement);

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
    // Key improvement: Special handling for tag elements
    if (isPossibleTag) {
      // Preserve the original display type to avoid modifying the arrangement of inline elements
      if (computedStyle.display) {
        targetElement.style.setProperty('display', computedStyle.display, 'important');
      }

      // Preserve other key properties that might affect element arrangement
      if (computedStyle.float && computedStyle.float !== 'none') {
        targetElement.style.setProperty('float', computedStyle.float, 'important');
      }

      // Preserve flexbox-related properties, if any
      if (computedStyle.flex) {
        targetElement.style.setProperty('flex', computedStyle.flex, 'important');
      }

      // Ensure width is not forcibly changed
      targetElement.style.removeProperty('width');

      // Preserve original margin, do not forcibly modify
      if (computedStyle.marginLeft) {
        targetElement.style.setProperty('margin-left', computedStyle.marginLeft);
      }
      if (computedStyle.marginRight) {
        targetElement.style.setProperty('margin-right', computedStyle.marginRight);
      }

      // Preserve white-space property
      if (computedStyle.whiteSpace) {
        targetElement.style.setProperty('white-space', computedStyle.whiteSpace, 'important');
      }
    } else {
      // Original logic for handling non-tag elements
      // Handle width for non-explicit tag elements
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
  }

  // Preserve original display value unless it's none
  // Improvement: For all elements (not just tags), ensure the display property is preserved
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

  // Handle background shorthand property and individual properties
  if (computedStyle.background && computedStyle.background !== 'none' && computedStyle.background !== 'rgba(0, 0, 0, 0)') {
    // Apply the complete background shorthand property
    targetElement.style.setProperty('background', computedStyle.background, 'important');
  } else {
    // Apply individual background properties if shorthand is not available
    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
      targetElement.style.setProperty('background-image', computedStyle.backgroundImage);
    }
    if (computedStyle.backgroundPosition) {
      targetElement.style.setProperty('background-position', computedStyle.backgroundPosition);
    }
    if (computedStyle.backgroundRepeat) {
      targetElement.style.setProperty('background-repeat', computedStyle.backgroundRepeat);
    }
    if (computedStyle.backgroundSize && computedStyle.backgroundSize !== 'auto') {
      targetElement.style.setProperty('background-size', computedStyle.backgroundSize);
    }
    if (computedStyle.backgroundOrigin) {
      targetElement.style.setProperty('background-origin', computedStyle.backgroundOrigin);
    }
    if (computedStyle.backgroundClip) {
      targetElement.style.setProperty('background-clip', computedStyle.backgroundClip);
    }
    if (computedStyle.backgroundAttachment) {
      targetElement.style.setProperty('background-attachment', computedStyle.backgroundAttachment);
    }
  }

  // Improvement: Extend the list of key style properties to include more typography-related properties
  const EXTENDED_STYLE_PROPERTIES = [
    ...IMPORTANT_STYLE_PROPERTIES,
    'white-space', 'word-spacing', 'word-break', 'flex', 'flex-direction',
    'flex-wrap', 'flex-flow', 'justify-content', 'align-items', 'align-content',
    'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
    'column-gap', 'row-gap', 'gap'
  ];

  // Apply other important properties
  EXTENDED_STYLE_PROPERTIES.forEach(prop => {
    const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const value = computedStyle[camelProp];

    // Skip width-related properties for top-level elements as we've handled them specially
    if (isTopLevel && (prop === 'width' || prop === 'max-width')) {
      return;
    }

    // Skip background properties as we've handled them specially above
    if (prop.startsWith('background')) {
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
 * Determines if an element is likely a tag element
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Returns true if the element is likely a tag
 */
function isPossibleTagElement(element) {
  if (!element) return false;

  // Check common tag characteristics
  const tagName = element.tagName.toLowerCase();
  const className = (typeof element.className === 'string' ? element.className : (element.className?.baseVal || '')).toLowerCase();
  const id = (element.id || '').toLowerCase();
  const innerText = element.innerText || '';

  // 1. Common tag element identifiers
  const commonTagIdentifiers = [
    'tag', 'label', 'badge', 'pill', 'chip', 'hashtag', 'category'
  ];

  // Check if class name contains tag identifiers
  const hasTagClass = commonTagIdentifiers.some(id => className.includes(id));

  // Check if ID contains tag identifiers
  const hasTagId = commonTagIdentifiers.some(id => id.includes(id));

  // 2. Check typical tag behavior characteristics

  // Tags are usually short
  const isShortText = innerText.length < 30;

  // Tags are usually simple elements without complex substructures
  const hasSimpleStructure = element.children.length <= 1;

  // 3. Check appearance characteristics

  // Get computed style
  const style = getStyleFromCache(element) || window.getComputedStyle(element);

  // Tags often have border radius
  const hasBorderRadius = style.borderRadius && style.borderRadius !== '0px';

  // Tags are often displayed as inline or inline-block elements
  const hasInlineDisplay = style.display === 'inline' ||
    style.display === 'inline-block' ||
    style.display === 'inline-flex';

  // Tags often have background color or border
  const hasBackground = style.backgroundColor &&
    style.backgroundColor !== 'transparent' &&
    style.backgroundColor !== 'rgba(0, 0, 0, 0)';

  const hasBorder = style.border && style.border !== 'none' && style.border !== '0px';

  // 4. Check content characteristics

  // Tags often have a # prefix (social media tags)
  const isHashtag = innerText.trim().startsWith('#');

  // 5. Check parent element characteristics

  // Tags are often located in tag containers
  let hasTagContainer = false;
  if (element.parentElement) {
    const parentClass = (typeof element.parentElement.className === 'string' ?
      element.parentElement.className :
      (element.parentElement.className?.baseVal || '')).toLowerCase();
    const parentId = (element.parentElement.id || '').toLowerCase();

    hasTagContainer = commonTagIdentifiers.some(id => parentClass.includes(id) || parentId.includes(id));
  }

  // Comprehensive evaluation: If multiple conditions are met, it is likely a tag
  const isTag = (
    hasTagClass ||
    hasTagId ||
    isHashtag ||
    hasTagContainer ||
    (isShortText && hasSimpleStructure && (hasInlineDisplay || hasBorderRadius || hasBackground || hasBorder))
  );

  return isTag;
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
 * @param {Number} maxDepth - Maximum recursion depth for style processing (default 20)
 * @returns {HTMLElement} - The cloned element with preserved styles
 */
function cloneElementWithStyles(element, isMainContent, maxDepth) {
  if (maxDepth === undefined) maxDepth = 20;
  var clone = element.cloneNode(true);

  applyComputedStylesToElement(clone, element, isMainContent, true);

  processChildrenWithStyles(clone, element, isMainContent, 0, maxDepth);

  return clone;
}

/**
 * Recursively processes children applying styles with a depth limit
 * @param {HTMLElement} targetElement - The cloned target element
 * @param {HTMLElement} sourceElement - The original source element
 * @param {Boolean} isMainContent - Whether this is main content
 * @param {Number} depth - Current recursion depth
 * @param {Number} maxDepth - Maximum recursion depth
 */
function processChildrenWithStyles(targetElement, sourceElement, isMainContent, depth, maxDepth) {
  if (depth > maxDepth) return;

  var sourceChildren = sourceElement.children;
  var targetChildren = targetElement.children;

  for (var i = 0; i < sourceChildren.length; i++) {
    if (i < targetChildren.length && sourceChildren[i].nodeType === Node.ELEMENT_NODE) {
      applyComputedStylesToElement(targetChildren[i], sourceChildren[i], isMainContent, false);

      if (sourceChildren[i].children.length > 0) {
        processChildrenWithStyles(targetChildren[i], sourceChildren[i], isMainContent, depth + 1, maxDepth);
      }
    }
  }
}
