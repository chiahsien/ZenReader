/**
 * ZenReader - Selection Mode Module
 *
 * This script manages the selection mode which allows users to pick an element to focus on.
 * It handles element highlighting, hover effects, and selection event handling.
 */

/**
 * Initializes the selection mode allowing users to pick an element to focus on
 */
function startSelectionMode() {
  if (zenReaderState.isSelectionMode || zenReaderState.isFocusMode) return;

  zenReaderState.isSelectionMode = true;

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
  if (!zenReaderState.isSelectionMode) return;

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
  if (!zenReaderState.isSelectionMode) return;

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
  if (!zenReaderState.isSelectionMode) return;

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  // Save the selected element
  zenReaderState.selectedElement = event.target;

  // Exit selection mode
  exitSelectionMode();

  // Enter focus mode
  enterFocusMode();
}

/**
 * Exits the selection mode
 */
function exitSelectionMode() {
  if (!zenReaderState.isSelectionMode) return;

  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleElementSelection, true);

  // Remove hover effect from all elements
  const hoverElements = document.querySelectorAll('.zenreader-hover');
  hoverElements.forEach(el => el.classList.remove('zenreader-hover'));

  zenReaderState.isSelectionMode = false;
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
