/**
 * ZenReader - Selection Mode Module
 *
 * Manages the selection mode which allows users to pick an element to focus on.
 * Handles element highlighting, hover effects, and selection event handling.
 */

import { getState } from './state';
import { enterFocusMode } from './focusMode';

/**
 * Handles mouse over events during selection mode
 */
function handleMouseOver(event: MouseEvent): void {
  if (!getState().isSelectionMode) return;

  const target = event.target as HTMLElement;

  // Skip body and html elements
  if (target === document.body || target === document.documentElement) return;

  // Add visual indicator for hover
  target.classList.add('zenreader-hover');
  event.stopPropagation();
}

/**
 * Handles mouse out events during selection mode
 */
function handleMouseOut(event: MouseEvent): void {
  if (!getState().isSelectionMode) return;

  const target = event.target as HTMLElement;

  // Remove visual indicator
  target.classList.remove('zenreader-hover');
  event.stopPropagation();
}

/**
 * Handles element selection when user clicks during selection mode
 */
function handleElementSelection(event: MouseEvent): void {
  if (!getState().isSelectionMode) return;

  // Prevent default click behavior
  event.preventDefault();
  event.stopPropagation();

  const state = getState();

  // Save the selected element
  state.selectedElement = event.target as HTMLElement;

  // Exit selection mode
  exitSelectionMode();

  // Enter focus mode
  enterFocusMode();
}

/**
 * Initializes the selection mode allowing users to pick an element to focus on
 */
export function startSelectionMode(): void {
  const state = getState();
  if (state.isSelectionMode || state.isFocusMode) return;

  state.isSelectionMode = true;

  // Add hover effect on mouseover
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleElementSelection, true);
}

/**
 * Exits the selection mode
 */
export function exitSelectionMode(): void {
  const state = getState();
  if (!state.isSelectionMode) return;

  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleElementSelection, true);

  // Remove hover effect from all elements
  const hoverElements = document.querySelectorAll('.zenreader-hover');
  hoverElements.forEach(function (el) {
    el.classList.remove('zenreader-hover');
  });

  state.isSelectionMode = false;
}

/**
 * Analyzes selected element to determine if it's a main content container
 */
export function isMainContent(element: HTMLElement | null): boolean {
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
    if (contentIndicators.some(function (indicator) { return lcClass.includes(indicator); })) {
      return true;
    }
  }

  // Check ID for content indicators
  const id = element.id;
  if (id && typeof id === 'string') {
    const lcId = id.toLowerCase();
    const contentIndicators = ['content', 'article', 'post', 'entry', 'main', 'body'];
    if (contentIndicators.some(function (indicator) { return lcId.includes(indicator); })) {
      return true;
    }
  }

  // Check if it has common content elements
  const hasParagraphs = element.querySelectorAll('p').length > 1;
  const hasHeadings = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;

  return hasParagraphs && hasHeadings;
}
