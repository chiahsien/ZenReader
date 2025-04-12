/**
 * ZenReader - Style Cache Module
 *
 * This script manages the caching of computed styles for DOM elements,
 * improving performance by reducing redundant style calculations.
 */

// Style cache to store computed styles
let styleCache = null;

/**
 * Initializes the style cache
 */
function initStyleCache() {
  styleCache = new Map();
}

/**
 * Clears the style cache
 */
function clearStyleCache() {
  if (styleCache) {
    styleCache.clear();
  }
}

/**
 * Gets a cached style for an element or null if not in cache
 * @param {HTMLElement} element - The element to get styles for
 * @returns {CSSStyleDeclaration|null} - The cached computed style or null
 */
function getStyleFromCache(element) {
  if (!styleCache) return null;
  return styleCache.get(element) || null;
}

/**
 * Sets a style in the cache
 * @param {HTMLElement} element - The element to cache styles for
 * @param {CSSStyleDeclaration} style - The computed style
 */
function setStyleInCache(element, style) {
  if (!styleCache || !element || !style) return;
  styleCache.set(element, style);
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
