/**
 * ZenReader - About Page Script
 *
 * This script handles the functionality of the About page,
 * including loading internationalized content and dynamic version information.
 */

/**
 * Initializes the internationalization for the About page
 */
function initI18n() {
    // Get all elements with data-i18n attribute
    const i18nElements = document.querySelectorAll('[data-i18n]');

    // Replace content of each element with translated string
    i18nElements.forEach(element => {
        const messageKey = element.getAttribute('data-i18n');
        const translatedMessage = chrome.i18n.getMessage(messageKey);

        // Only replace content if translation exists
        if (translatedMessage) {
            const tagName = element.tagName.toUpperCase(); // Ensure uppercase for comparison

            // Special handling for input elements
            if (tagName === 'INPUT' && element.type === 'button') {
                element.value = translatedMessage;
            }
            // Special handling for elements with links or buttons that should keep their inner elements
            else if (tagName === 'A' || tagName === 'BUTTON') {
                // If the element has children, we want to replace just the text nodes
                if (element.childElementCount > 0) {
                    // Get all text nodes
                    const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === 3);
                    if (textNodes.length > 0) {
                        // Replace text of the first text node
                        textNodes[0].nodeValue = translatedMessage;
                    } else {
                        // If no text nodes, prepend one
                        element.prepend(translatedMessage);
                    }
                } else {
                    // If no children, just set the content
                    element.textContent = translatedMessage;
                }
            }
            // Handle title attribute for page title
            else if (tagName === 'TITLE') {
                document.title = translatedMessage;
                element.textContent = translatedMessage;
            }
            // Default handling for most elements
            else {
                element.textContent = translatedMessage;
            }
        }
    });
}

/**
 * Set the page direction based on current locale
 */
function setPageDirection() {
    // Get the current locale (this is a simplified example)
    const locale = chrome.i18n.getUILanguage();

    // List of RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

    // Check if current language is RTL
    const isRtl = rtlLanguages.some(lang => locale.startsWith(lang));

    // Set direction attribute on html element
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    // Add a class for potential additional RTL styling
    document.body.classList.toggle('rtl', isRtl);
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize internationalization
    try {
        initI18n();
        setPageDirection();
    } catch (error) {
        console.error('Error initializing i18n:', error);
        // If there's an error with chrome.i18n, we'll fall back to default English content
    }

    // Placeholder for the dynamic version detection
    // Will be implemented in Task 13

    // Set developer name
    document.getElementById('developer').textContent = 'Your Name';

    console.log('ZenReader About page initialized');
});
