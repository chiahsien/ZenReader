/**
 * ZenReader - Message Handler Module
 *
 * Manages communication with the background script,
 * handling messages and sending state updates.
 */

import { getState, verifyStateConsistency } from '../state';
import { startSelectionMode } from '../selectionMode';
import { exitFocusMode } from '../focusMode';

/**
 * Initializes the message handler to listen for background script messages
 */
export function initMessageHandler(): void {
  chrome.runtime.onMessage.addListener(function (
    message: { action: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; isActive?: boolean; error?: string }) => void,
  ) {
    try {
      const state = getState();

      if (message.action === 'activate') {
        if (!state.isSelectionMode && !state.isFocusMode) {
          startSelectionMode();
          sendResponse({
            success: true,
            isActive: getState().isSelectionMode || getState().isFocusMode,
          });
        } else if (state.isFocusMode) {
          exitFocusMode();
          sendResponse({
            success: true,
            isActive: false,
          });
        } else {
          sendResponse({
            success: true,
            isActive: state.isSelectionMode || state.isFocusMode,
          });
        }
      } else {
        sendResponse({
          success: false,
          error: 'Unknown action',
          isActive: getState().isSelectionMode || getState().isFocusMode,
        });
      }
    } catch (e) {
      console.log('Error handling message:', (e as Error).message);
      const state = getState();
      sendResponse({
        success: false,
        error: (e as Error).message,
        isActive: state.isSelectionMode || state.isFocusMode,
      });
    }

    return false;
  });

  setInterval(verifyStateConsistency, 2000);
}
