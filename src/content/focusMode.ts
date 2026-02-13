/**
 * ZenReader - Focus Mode Module
 *
 * Manages the focus mode which displays the selected content in a distraction-free overlay.
 * Handles creating the overlay, focus container, and shadow DOM content.
 */

import { getState, updateBackgroundState, resetFocusState } from './state';
import { clearStyleCache, captureStylesRecursively } from './styles/styleCache';
import { cloneElementWithStyles } from './styles/elementCloner';
import { addStylesToShadowDOM } from './styles/shadowDomStyles';
import { materializePseudoElements } from './styles/layoutFixer';
import { analyzeDominantColors } from './utils/colorUtils';
import { estimateTreeSize, modifyLinks, resolveLazyImages } from './utils/domUtils';
import { isMainContent } from './selectionMode';

/**
 * Opens the About page by sending a message to the background script
 */
function openAboutPage(): void {
  chrome.runtime.sendMessage({ action: 'openAboutPage' }, function (response) {
    if (chrome.runtime.lastError) {
      console.log('Error opening about page:', chrome.runtime.lastError.message);
    }
  });
}

/**
 * Creates the darkened overlay that covers the original page
 */
function createOverlay(): void {
  const state = getState();

  state.overlayElement = document.createElement('div');
  state.overlayElement.className = 'zenreader-overlay';

  state.overlayElement.addEventListener('click', function (event: MouseEvent) {
    if (event.target === getState().overlayElement) {
      exitFocusMode();
    }
  });

  state.overlayElement.addEventListener('wheel', function (event: WheelEvent) {
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });

  document.body.appendChild(state.overlayElement);
}

/**
 * Sets up wheel event handling for the content wrapper
 */
function setupWheelEventHandling(contentWrapper: HTMLElement): void {
  const state = getState();

  if (state.focusContainer) {
    state.focusContainer.addEventListener('wheel', function (event: WheelEvent) {
      event.stopPropagation();
    }, { capture: true });
  }

  contentWrapper.addEventListener('wheel', function (event: WheelEvent) {
    event.stopPropagation();
  }, { capture: true });
}

/**
 * Creates the container that displays the focused content.
 * Uses Shadow DOM for style encapsulation with enhanced style preservation.
 */
function createFocusContainer(): void {
  const state = getState();
  if (!state.selectedElement) return;

  const colorSettings = analyzeDominantColors();
  const likelyMainContent = isMainContent(state.selectedElement);

  state.focusContainer = document.createElement('div');
  state.focusContainer.className = 'zenreader-focus-container';
  state.focusContainer.style.backgroundColor = colorSettings.bgColor;

  const toolbar = document.createElement('div');
  toolbar.className = 'zenreader-toolbar';

  const titleElement = document.createElement('div');
  titleElement.className = 'zenreader-title';
  titleElement.textContent = document.title || 'ZenReader';

  state.aboutButton = document.createElement('button');
  state.aboutButton.className = 'zenreader-about-button';
  state.aboutButton.title = chrome.i18n?.getMessage('aboutZenReader') || 'About ZenReader';
  state.aboutButton.innerHTML = '?';
  state.aboutButton.addEventListener('click', openAboutPage);

  state.exitButton = document.createElement('button');
  state.exitButton.className = 'zenreader-exit-button';
  state.exitButton.innerHTML = '&#x2715;';
  state.exitButton.title = chrome.i18n?.getMessage('exitFocusMode') || 'Exit Focus Mode';
  state.exitButton.addEventListener('click', exitFocusMode);

  toolbar.appendChild(state.aboutButton);
  toolbar.appendChild(titleElement);
  toolbar.appendChild(state.exitButton);
  state.focusContainer.appendChild(toolbar);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'zenreader-content-wrapper';
  contentWrapper.style.maxWidth = '100%';
  contentWrapper.style.margin = '0 auto';
  contentWrapper.style.width = '100%';

  state.shadowRoot = contentWrapper.attachShadow({ mode: 'open' });

  const shadowContainer = document.createElement('div');
  shadowContainer.className = 'shadow-container';
  shadowContainer.style.color = colorSettings.textColor;
  shadowContainer.style.backgroundColor = 'transparent';

  if (likelyMainContent) {
    shadowContainer.style.maxWidth = '100%';
    shadowContainer.style.margin = '0 auto';
  } else {
    shadowContainer.style.width = '100%';
  }

  addStylesToShadowDOM(state.shadowRoot, colorSettings, likelyMainContent, function (fetchedCSSTexts: string[]) {
    getState().fetchedCSSTexts = fetchedCSSTexts;
  });

  const contentClone = cloneElementWithStyles(state.selectedElement, likelyMainContent, state.maxDepth ?? 20);

  resolveLazyImages(contentClone);
  materializePseudoElements(state.selectedElement, contentClone);
  modifyLinks(contentClone);

  shadowContainer.appendChild(contentClone);
  state.shadowRoot.appendChild(shadowContainer);
  state.focusContainer.appendChild(contentWrapper);
  document.body.appendChild(state.focusContainer);

  setupWheelEventHandling(contentWrapper);
}

/**
 * Activates focus mode on the selected element
 */
export function enterFocusMode(): void {
  const state = getState();
  if (state.isFocusMode || !state.selectedElement) return;

  state.isFocusMode = true;
  updateBackgroundState(true);
  clearStyleCache();

  const treeSize = estimateTreeSize(state.selectedElement, 2000);
  if (treeSize < 100) {
    state.maxDepth = 50;
  } else if (treeSize <= 1000) {
    state.maxDepth = 20;
  } else {
    state.maxDepth = 10;
  }

  captureStylesRecursively(state.selectedElement, 0, state.maxDepth);
  createOverlay();
  createFocusContainer();

  document.body.classList.add('zenreader-focus-active');
}

/**
 * Exits the focus mode and returns to normal view
 */
export function exitFocusMode(): void {
  const state = getState();
  if (!state.isFocusMode) return;

  state.isFocusMode = false;
  updateBackgroundState(false);

  if (state.overlayElement && state.overlayElement.parentNode) {
    state.overlayElement.parentNode.removeChild(state.overlayElement);
  }

  if (state.focusContainer && state.focusContainer.parentNode) {
    state.focusContainer.parentNode.removeChild(state.focusContainer);
  }

  resetFocusState();

  const fontStyle = document.querySelector('style[data-zenreader-fonts]');
  if (fontStyle && fontStyle.parentNode) {
    fontStyle.parentNode.removeChild(fontStyle);
  }

  clearStyleCache();

  document.body.classList.remove('zenreader-focus-active');
}
