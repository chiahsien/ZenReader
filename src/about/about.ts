/**
 * ZenReader - About Page Script
 *
 * Handles the functionality of the About page,
 * including loading internationalized content and dynamic version information.
 */

function initI18n(): void {
  const i18nElements = document.querySelectorAll('[data-i18n]');

  i18nElements.forEach(function (element) {
    const messageKey = element.getAttribute('data-i18n');
    if (!messageKey) return;

    const translatedMessage = chrome.i18n.getMessage(messageKey);
    if (!translatedMessage) return;

    const tagName = element.tagName.toUpperCase();

    if (tagName === 'INPUT' && (element as HTMLInputElement).type === 'button') {
      (element as HTMLInputElement).value = translatedMessage;
    } else if (tagName === 'A' || tagName === 'BUTTON') {
      if (element.childElementCount > 0) {
        const textNodes = Array.from(element.childNodes).filter(
          function (node) { return node.nodeType === Node.TEXT_NODE; },
        );
        if (textNodes.length > 0) {
          textNodes[0].nodeValue = translatedMessage;
        } else {
          element.prepend(translatedMessage);
        }
      } else {
        element.textContent = translatedMessage;
      }
    } else if (tagName === 'TITLE') {
      document.title = translatedMessage;
      element.textContent = translatedMessage;
    } else {
      element.textContent = translatedMessage;
    }
  });
}

function setPageDirection(): void {
  const locale = chrome.i18n.getUILanguage();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const isRtl = rtlLanguages.some(function (lang) { return locale.startsWith(lang); });

  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.body.classList.toggle('rtl', isRtl);
}

async function getExtensionVersion(): Promise<string> {
  try {
    const manifest = chrome.runtime.getManifest();
    return manifest.version || '1.0.0';
  } catch (error) {
    console.error('Error getting extension version:', error);
    return '1.0.0';
  }
}

async function updateDynamicContent(): Promise<void> {
  try {
    const versionElement = document.getElementById('version');
    if (versionElement) {
      const version = await getExtensionVersion();
      versionElement.textContent = version;
    }
  } catch (error) {
    console.error('Error updating dynamic content:', error);
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  try {
    initI18n();
    setPageDirection();
    await updateDynamicContent();
    console.log('ZenReader About page initialized');
  } catch (error) {
    console.error('Error initializing about page:', error);
  }
});
