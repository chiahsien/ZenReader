/**
 * ZenReader - DOM Utilities Module
 *
 * This script provides utilities for DOM manipulation and processing.
 */

/**
 * Estimates the number of element nodes in a subtree
 * Stops counting at a cap to avoid performance issues on very large DOMs
 * @param {HTMLElement} element - Root element to count from
 * @param {Number} cap - Maximum count before returning early (default 2000)
 * @returns {Number} - Estimated element count (capped at cap value)
 */
function estimateTreeSize(element, cap) {
  if (!element) return 0;
  if (cap === undefined) cap = 2000;

  var count = 0;
  var walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    count++;
    if (count >= cap) return cap;
  }
  return count;
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

  // Improvement: Locate potential tag containers and preserve their layout
  const possibleTagContainers = element.querySelectorAll(
    '[class*="tags"], [class*="labels"], [class*="badges"], ' +
    '[class*="pills"], [class*="chips"], [class*="hashtags"], ' +
    '[id*="tags"], [id*="labels"], [id*="badges"], ' +
    '[id*="pills"], [id*="chips"], [id*="hashtags"]'
  );

  possibleTagContainers.forEach(container => {
    // Ensure tag containers retain their inline or flex properties
    const style = window.getComputedStyle(container);
    if (style.display === 'flex' || style.display === 'inline-flex') {
      container.style.setProperty('display', style.display, 'important');

      // Preserve flex-related properties
      if (style.flexWrap) container.style.setProperty('flex-wrap', style.flexWrap, 'important');
      if (style.flexDirection) container.style.setProperty('flex-direction', style.flexDirection, 'important');
      if (style.justifyContent) container.style.setProperty('justify-content', style.justifyContent, 'important');
      if (style.alignItems) container.style.setProperty('align-items', style.alignItems, 'important');
      if (style.gap) container.style.setProperty('gap', style.gap, 'important');
    } else {
      // If not flex, ensure proper inline display
      container.style.setProperty('display', 'flex', 'important');
      container.style.setProperty('flex-wrap', 'wrap', 'important');
      container.style.setProperty('align-items', 'center', 'important');
      container.style.setProperty('gap', '0.5em', 'important');
    }

    // Handle tag elements within the container
    Array.from(container.children).forEach(child => {
      // Check if it is a tag element
      if (isPossibleTagElement(child)) {
        // Ensure tags retain inline display
        child.style.setProperty('display', 'inline-block', 'important');
        child.style.setProperty('width', 'auto', 'important');
        child.style.setProperty('max-width', 'none', 'important');
      }
    });
  });

  // Now fix common layout issues

  // 1. Fix floating elements issues - Exclude potential tag elements
  const floatElements = element.querySelectorAll('[style*="float:"], [style*="float :"]');
  floatElements.forEach(el => {
    // Check if it is a potential tag element
    if (!isPossibleTagElement(el)) {
      // Prevent floating that might break layout
      const tagNameLower = el.tagName.toLowerCase();
      if (tagNameLower !== 'img') { // Keep float for images if needed
        el.style.setProperty('float', 'none', 'important');
        el.style.setProperty('width', '100%', 'important');
      }
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

  // 4. Fix fixed-width containers - Exclude potential tag containers
  const containers = element.querySelectorAll('div, article, section, main');
  containers.forEach(container => {
    // Exclude potential tag containers
    if (!container.className ||
      !(/tags|labels|badges|pills|chips|hashtags/i.test(container.className))) {
      // Check for narrow fixed width
      const style = window.getComputedStyle(container);
      const widthValue = parseInt(style.width);

      // If width is fixed and less than 90% of parent
      if (!isNaN(widthValue) && !style.width.includes('%') && widthValue < 800) {
        container.style.setProperty('width', '100%', 'important');
        container.style.setProperty('max-width', '100%', 'important');
      }
    }
  });

  // 5. Fix specific side-aligned elements - Exclude potential tag elements
  const sideElements = element.querySelectorAll('[class*="left"], [class*="right"], [class*="side"]');
  sideElements.forEach(el => {
    if (!isPossibleTagElement(el)) {
      const tagNameLower = el.tagName.toLowerCase();
      if (tagNameLower !== 'img' && tagNameLower !== 'span') {
        el.style.setProperty('float', 'none', 'important');
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('margin-left', '0', 'important');
        el.style.setProperty('margin-right', '0', 'important');
      }
    }
  });
}

/**
 * Resolves lazy-loaded images in a cloned element tree so they display in focus mode.
 * Handles common lazy-loading patterns. Operates on the clone only, never the original DOM.
 * @param {HTMLElement} cloneElement - The cloned element tree to process
 */
function resolveLazyImages(cloneElement) {
  if (!cloneElement) return;

  var images = cloneElement.querySelectorAll('img');
  for (var i = 0; i < images.length; i++) {
    var img = images[i];

    var lazySrc = img.getAttribute('data-src') ||
                  img.getAttribute('data-lazy-src') ||
                  img.getAttribute('data-original');
    if (lazySrc) {
      img.setAttribute('src', lazySrc);
    }

    var lazySrcset = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (lazySrcset) {
      img.setAttribute('srcset', lazySrcset);
    }

    var lazySizes = img.getAttribute('data-sizes');
    if (lazySizes) {
      img.setAttribute('sizes', lazySizes);
    }

    // Replace placeholder data-URI with real src if available
    var currentSrc = img.getAttribute('src') || '';
    if (currentSrc.indexOf('data:image/') === 0 && img.getAttribute('data-src')) {
      img.setAttribute('src', img.getAttribute('data-src'));
    }

    if (img.getAttribute('loading') === 'lazy') {
      img.removeAttribute('loading');
    }

    // Remove lazy-loading CSS classes that may block rendering
    var className = img.className || '';
    if (typeof className === 'string') {
      img.className = className.replace(/\b(lazy|lazyload|lazyloaded|lazyloading)\b/g, '').trim();
    }
  }

  // Handle <picture> <source> elements with lazy srcset
  var sources = cloneElement.querySelectorAll('picture source[data-srcset]');
  for (var j = 0; j < sources.length; j++) {
    var source = sources[j];
    source.setAttribute('srcset', source.getAttribute('data-srcset'));
  }

  // Handle <noscript> fallback images: if an img has a <noscript> sibling containing an <img>,
  // extract the noscript image's src as the real source
  var noscripts = cloneElement.querySelectorAll('noscript');
  for (var k = 0; k < noscripts.length; k++) {
    var noscript = noscripts[k];
    var prevImg = noscript.previousElementSibling;
    if (prevImg && prevImg.tagName === 'IMG') {
      var noscriptContent = noscript.textContent || '';
      var srcMatch = noscriptContent.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        prevImg.setAttribute('src', srcMatch[1]);
      }
    }
  }
}
