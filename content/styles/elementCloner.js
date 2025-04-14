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

  // 關鍵改進：檢查元素是否屬於可能是標籤集合的一部分
  // 保留行內元素的原始排列方式
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
    // 關鍵改進：標籤元素的特殊處理
    if (isPossibleTag) {
      // 保留原始顯示類型，避免修改行內元素的排列方式
      if (computedStyle.display) {
        targetElement.style.setProperty('display', computedStyle.display, 'important');
      }

      // 保留其他可能影響元素排列的關鍵屬性
      if (computedStyle.float && computedStyle.float !== 'none') {
        targetElement.style.setProperty('float', computedStyle.float, 'important');
      }

      // 保留 flexbox 相關屬性，如果有的話
      if (computedStyle.flex) {
        targetElement.style.setProperty('flex', computedStyle.flex, 'important');
      }

      // 確保不會強制改變寬度
      targetElement.style.removeProperty('width');

      // 保留原始 margin，不強制修改
      if (computedStyle.marginLeft) {
        targetElement.style.setProperty('margin-left', computedStyle.marginLeft);
      }
      if (computedStyle.marginRight) {
        targetElement.style.setProperty('margin-right', computedStyle.marginRight);
      }

      // 保留 white-space 屬性
      if (computedStyle.whiteSpace) {
        targetElement.style.setProperty('white-space', computedStyle.whiteSpace, 'important');
      }
    } else {
      // 原有的邏輯，處理非標籤元素
      // 為非顯式標籤的元素處理寬度
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
  // 改進：對於所有元素（不僅是標籤），確保 display 屬性被保留
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

  // 改進：擴展關鍵樣式屬性列表，包含更多與排版相關的屬性
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
 * 判斷元素是否可能是標籤元素
 * @param {HTMLElement} element - 要檢查的元素
 * @returns {boolean} - 如果元素可能是標籤則返回 true
 */
function isPossibleTagElement(element) {
  if (!element) return false;

  // 檢查常見的標籤特徵
  const tagName = element.tagName.toLowerCase();
  const className = (typeof element.className === 'string' ? element.className : (element.className?.baseVal || '')).toLowerCase();
  const id = (element.id || '').toLowerCase();
  const innerText = element.innerText || '';

  // 1. 常見標籤元素標識
  const commonTagIdentifiers = [
    'tag', 'label', 'badge', 'pill', 'chip', 'hashtag', 'category'
  ];

  // 檢查類名是否包含標籤標識
  const hasTagClass = commonTagIdentifiers.some(id => className.includes(id));

  // 檢查 ID 是否包含標籤標識
  const hasTagId = commonTagIdentifiers.some(id => id.includes(id));

  // 2. 檢查典型標籤行為特徵

  // 標籤通常很短
  const isShortText = innerText.length < 30;

  // 標籤通常是簡單元素，不包含複雜子結構
  const hasSimpleStructure = element.children.length <= 1;

  // 3. 檢查外觀特徵

  // 獲取計算樣式
  const style = getStyleFromCache(element) || window.getComputedStyle(element);

  // 標籤通常有邊框半徑
  const hasBorderRadius = style.borderRadius && style.borderRadius !== '0px';

  // 標籤通常顯示為內聯或內聯塊元素
  const hasInlineDisplay = style.display === 'inline' ||
    style.display === 'inline-block' ||
    style.display === 'inline-flex';

  // 標籤通常有背景色或邊框
  const hasBackground = style.backgroundColor &&
    style.backgroundColor !== 'transparent' &&
    style.backgroundColor !== 'rgba(0, 0, 0, 0)';

  const hasBorder = style.border && style.border !== 'none' && style.border !== '0px';

  // 4. 檢查內容特徵

  // 標籤通常有 # 前綴（社交媒體標籤）
  const isHashtag = innerText.trim().startsWith('#');

  // 5. 檢查父元素特徵

  // 標籤通常位於標籤容器中
  let hasTagContainer = false;
  if (element.parentElement) {
    const parentClass = (typeof element.parentElement.className === 'string' ?
      element.parentElement.className :
      (element.parentElement.className?.baseVal || '')).toLowerCase();
    const parentId = (element.parentElement.id || '').toLowerCase();

    hasTagContainer = commonTagIdentifiers.some(id => parentClass.includes(id) || parentId.includes(id));
  }

  // 綜合評估：如果滿足多項條件，則可能是標籤
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
