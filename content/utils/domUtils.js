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
