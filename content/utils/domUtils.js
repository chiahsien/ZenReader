/**
 * ZenReader - DOM Utilities Module
 *
 * This script provides utilities for DOM manipulation and processing.
 */

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
