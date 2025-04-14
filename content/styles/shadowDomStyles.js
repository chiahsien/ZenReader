/**
 * ZenReader - Shadow DOM Styles Module
 *
 * This script handles creating and applying styles to the Shadow DOM used
 * for the focus mode content.
 */

/**
 * Adds styles to the shadow DOM to maintain original content styling
 * @param {ShadowRoot} shadow - The shadow root to add styles to
 * @param {Object} colors - The color settings determined for the page
 * @param {Boolean} isMainContent - Whether this is likely main content
 */
function addStylesToShadowDOM(shadow, colors, isMainContent) {
  // Create style element for base styles
  const baseStyle = document.createElement('style');

  // Default styles
  baseStyle.textContent = `
    .shadow-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 20px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }

    /* First child element - remove horizontal margins/paddings and set vertical paddings */
    .shadow-container > *:first-child {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Basic element styles */
    p, div, span, h1, h2, h3, h4, h5, h6 {
      margin-bottom: 1em;
    }

    a {
      color: ${colors.isDarkTheme ? '#6ea8fe' : '#0066cc'};
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    th, td {
      border: 1px solid ${colors.isDarkTheme ? '#555' : '#ddd'};
      padding: 8px;
    }

    pre, code {
      background-color: ${colors.isDarkTheme ? '#2d2d2d' : '#f5f5f5'};
      border-radius: 3px;
      padding: 0.2em 0.4em;
      font-family: monospace;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    /* List spacing */
    ul, ol {
      padding-left: 40px;
      margin: 1em 0;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      line-height: 1.2;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.3em; }
    h4 { font-size: 1.2em; }
    h5 { font-size: 1.1em; }
    h6 { font-size: 1em; }

    /* Block quotes */
    blockquote {
      border-left: 4px solid ${colors.isDarkTheme ? '#555' : '#ddd'};
      padding-left: 1em;
      margin-left: 0;
      margin-right: 0;
      font-style: italic;
    }

    /* Fix for common width issues */
    * {
      max-width: 100%;
      box-sizing: border-box;
    }

    /* Special styles for article content */
    ${isMainContent ? `
      .shadow-container > * {
        width: 100% !important;
        max-width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
      }

      /* Special styles for text containers in articles */
      .shadow-container > div,
      .shadow-container > section,
      .shadow-container > article {
        width: 100% !important;
      }
    ` : ''}
  `;
  shadow.appendChild(baseStyle);

  // Try to copy stylesheets from the original page with an enhanced approach
  try {
    // Get all stylesheets from the document
    const styleSheets = Array.from(document.styleSheets);

    // Process each stylesheet
    styleSheets.forEach(sheet => {
      try {
        // Skip cross-origin stylesheets
        if (!sheet.cssRules) return;

        // Create a new style element for each stylesheet
        const style = document.createElement('style');

        // Get all the CSS rules
        Array.from(sheet.cssRules).forEach(rule => {
          try {
            // Add each rule to our style element
            style.textContent += rule.cssText + '\n';
          } catch (ruleError) {
            // Skip individual rules that cause errors
            console.debug('Could not access rule:', ruleError);
          }
        });

        // Add the style to the shadow DOM
        shadow.appendChild(style);
      } catch (sheetError) {
        // Skip stylesheets that cause errors (likely cross-origin)
        console.debug('Could not access stylesheet:', sheetError);
      }
    });

    // Copy any inline styles
    const inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach(inlineStyle => {
      const style = document.createElement('style');
      style.textContent = inlineStyle.textContent;
      shadow.appendChild(style);
    });

    // Add special handling for common dynamic style changes
    const specialStylesElement = document.createElement('style');
    specialStylesElement.textContent = createSpecialCssRules(colors);
    shadow.appendChild(specialStylesElement);

  } catch (e) {
    console.error('Error copying styles to shadow DOM:', e);
  }
}

/**
 * Creates special CSS rules for handling common styling issues
 * @param {Object} colors - The color settings determined for the page
 * @returns {String} - CSS rules as a string
 */
function createSpecialCssRules(colors) {
  return `
    /* Fix width issues - ensure all elements respect container boundaries */
    *, *::before, *::after {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Remove any fixed positioning that could cause layout issues */
    [style*="position: fixed"],
    [style*="position:fixed"] {
      position: relative !important;
    }

    /* Remove any absolute positioning at the top level that could cause layout issues */
    .shadow-container > [style*="position: absolute"],
    .shadow-container > [style*="position:absolute"] {
      position: relative !important;
    }

    /* Fix for floated elements */
    .shadow-container::after {
      content: "";
      display: table;
      clear: both;
    }

    /* Force main content containers to fill width */
    div[class*="content"],
    div[class*="article"],
    div[class*="post"],
    div[id*="content"],
    div[id*="article"],
    div[id*="post"],
    article, section, main {
      width: 100% !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* 改進：標籤相關元素保留原有佈局 */
    [class*="tag"],
    [class*="label"],
    [class*="badge"],
    [class*="pill"],
    [class*="chip"],
    [class*="hashtag"],
    [id*="tag"],
    [id*="label"],
    [id*="badge"],
    [id*="pill"],
    [id*="chip"],
    [id*="hashtag"] {
      width: auto !important;
      max-width: none !important;
      display: inline-block !important;
      vertical-align: middle !important;
    }

    /* 為標籤容器保留佈局 */
    [class*="tags"],
    [class*="labels"],
    [class*="badges"],
    [class*="pills"],
    [class*="chips"],
    [class*="hashtags"],
    [id*="tags"],
    [id*="labels"],
    [id*="badges"],
    [id*="pills"],
    [id*="chips"],
    [id*="hashtags"] {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 0.5em !important;
    }

    /* Ensure grid and flex items expand properly */
    [class*="grid"] > *,
    [class*="flex"] > *,
    [style*="display: grid"] > *,
    [style*="display:grid"] > *,
    [style*="display: flex"] > *,
    [style*="display:flex"] > * {
      width: 100%;
    }

    /* Ensure code blocks are readable */
    pre, code, .code, [class*="code"] {
      font-family: monospace !important;
      white-space: pre-wrap !important;
      background-color: ${colors.isDarkTheme ? '#2d2d2d' : '#f5f5f5'} !important;
      color: ${colors.isDarkTheme ? '#e0e0e0' : '#333'} !important;
      width: 100% !important;
      overflow-x: auto !important;
    }

    /* Ensure links are visible */
    a:not([data-zenreader-styled]) {
      color: ${colors.isDarkTheme ? '#6ea8fe' : '#0066cc'} !important;
      text-decoration: underline !important;
    }

    /* Ensure tables are visible and fit container */
    table:not([data-zenreader-styled]) {
      border-collapse: collapse !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1em 0 !important;
      table-layout: auto !important;
      display: block !important;
      overflow-x: auto !important;
    }

    /* Ensure images don't overflow */
    img:not([data-zenreader-styled]) {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }

    /* Fix for common sidebar layouts */
    [class*="sidebar"],
    [id*="sidebar"],
    aside {
      float: none !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;
}
