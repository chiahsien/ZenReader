export interface ZenReaderState {
  isSelectionMode: boolean;
  isFocusMode: boolean;
  selectedElement: HTMLElement | null;
  overlayElement: HTMLElement | null;
  focusContainer: HTMLElement | null;
  exitButton: HTMLElement | null;
  aboutButton: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
  maxDepth: number | null;
  fetchedCSSTexts: string[] | null;
  currentStateActive: boolean;
}

const state: ZenReaderState = {
  isSelectionMode: false,
  isFocusMode: false,
  selectedElement: null,
  overlayElement: null,
  focusContainer: null,
  exitButton: null,
  aboutButton: null,
  shadowRoot: null,
  maxDepth: null,
  fetchedCSSTexts: null,
  currentStateActive: false,
};

export function getState(): ZenReaderState {
  return state;
}

export function resetFocusState(): void {
  state.selectedElement = null;
  state.overlayElement = null;
  state.focusContainer = null;
  state.exitButton = null;
  state.aboutButton = null;
  state.shadowRoot = null;
  state.maxDepth = null;
  state.fetchedCSSTexts = null;
}

export function updateBackgroundState(isActive: boolean): void {
  state.currentStateActive = isActive;

  const maxRetries = 3;
  let retryCount = 0;

  function attemptStateUpdate(): void {
    try {
      chrome.runtime.sendMessage({
        action: 'stateChanged',
        isActive,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Could not communicate with background script:', chrome.runtime.lastError.message);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptStateUpdate, 100 * retryCount);
          }
        } else if (!response || !response.success) {
          console.log('Background script returned unsuccessful response');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptStateUpdate, 100 * retryCount);
          }
        }
      });
    } catch (e) {
      console.log('Extension communication error:', (e as Error).message);
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(attemptStateUpdate, 100 * retryCount);
      }
    }
  }

  attemptStateUpdate();
}

export function verifyStateConsistency(): void {
  const currentActive = state.isFocusMode;
  if (state.currentStateActive !== currentActive) {
    console.log('State inconsistency detected, updating background');
    updateBackgroundState(currentActive);
  }
}
