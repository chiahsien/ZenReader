/**
 * ZenReader - Content Script Main Entry Point
 *
 * Entry point for the content script injected on-demand by the background service worker.
 * Initializes all modules and sets up global event listeners.
 */

import { getState } from './state';
import { initStyleCache } from './styles/styleCache';
import { initMessageHandler } from './utils/messageHandler';
import { startSelectionMode, exitSelectionMode } from './selectionMode';
import { exitFocusMode } from './focusMode';

/**
 * Handles keydown events for shortcut keys
 */
export function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    const state = getState();
    if (state.isSelectionMode) {
      exitSelectionMode();
    } else if (state.isFocusMode) {
      exitFocusMode();
    }
  }
}

function activateZenReader(): void {
  const state = getState();
  if (state.isSelectionMode || state.isFocusMode) {
    if (state.isFocusMode) {
      exitFocusMode();
    }
    return;
  }

  startSelectionMode();
}

if (!window.__zenReaderInjected) {
  window.__zenReaderInjected = true;

  initStyleCache();
  initMessageHandler();
  document.addEventListener('keydown', handleKeyDown);
}
