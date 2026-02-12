/**
 * ZenReader - Shadow DOM Styles Module
 *
 * This script handles creating and applying styles to the Shadow DOM used
 * for the focus mode content. Supports two-phase loading: same-origin styles
 * are injected synchronously, cross-origin sheets are fetched asynchronously
 * via the background service worker.
 */

/**
 * Adds styles to the shadow DOM to maintain original content styling.
 * Phase 1 (sync): base styles, same-origin sheets, inline styles, CSS custom properties.
 * Phase 2 (async): cross-origin sheets fetched via background, @font-face recovery,
 * CSS custom property update from fetched sheets.
 * @param {ShadowRoot} shadow - The shadow root to add styles to
 * @param {Object} colors - The color settings determined for the page
 * @param {Boolean} isMainContent - Whether this is likely main content
 * @param {Function} onCrossOriginComplete - Callback when async fetches finish (optional)
 */
function addStylesToShadowDOM(shadow, colors, isMainContent, onCrossOriginComplete) {
  var baseStyle = document.createElement('style');

  baseStyle.textContent = `
    .shadow-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 20px;
      width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }

    .shadow-container > *:first-child {
      margin: 0 !important;
      padding: 0 !important;
    }

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

    ul, ol {
      padding-left: 40px;
      margin: 1em 0;
    }

    li {
      margin-bottom: 0.5em;
    }

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

    blockquote {
      border-left: 4px solid ${colors.isDarkTheme ? '#555' : '#ddd'};
      padding-left: 1em;
      margin-left: 0;
      margin-right: 0;
      font-style: italic;
    }

    * {
      max-width: 100%;
      box-sizing: border-box;
    }

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

      .shadow-container > div,
      .shadow-container > section,
      .shadow-container > article {
        width: 100% !important;
      }
    ` : ''}
  `;
  shadow.appendChild(baseStyle);

  // Phase 1: inject same-origin custom properties
  var customProps = collectCSSCustomProperties();
  injectCSSCustomProperties(shadow, customProps);

  var crossOriginURLs = [];
  var sameOriginFontFaces = [];

  try {
    var styleSheets = Array.from(document.styleSheets);

    styleSheets.forEach(function (sheet) {
      try {
        if (!sheet.cssRules) {
          if (sheet.href) {
            crossOriginURLs.push(sheet.href);
          }
          return;
        }

        var style = document.createElement('style');

        Array.from(sheet.cssRules).forEach(function (rule) {
          try {
            style.textContent += rule.cssText + '\n';

            if (rule instanceof CSSFontFaceRule) {
              sameOriginFontFaces.push(rule.cssText);
            }
          } catch (ruleError) {
            console.debug('Could not access rule:', ruleError);
          }
        });

        shadow.appendChild(style);
      } catch (sheetError) {
        if (sheet.href) {
          crossOriginURLs.push(sheet.href);
        }
        console.debug('Could not access stylesheet:', sheetError);
      }
    });

    var inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach(function (inlineStyle) {
      var style = document.createElement('style');
      style.textContent = inlineStyle.textContent;
      shadow.appendChild(style);
    });

    var specialStylesElement = document.createElement('style');
    specialStylesElement.textContent = createSpecialCssRules(colors);
    shadow.appendChild(specialStylesElement);

  } catch (e) {
    console.error('Error copying styles to shadow DOM:', e);
  }

  // Inject same-origin @font-face rules into shadow and document head
  if (sameOriginFontFaces.length > 0) {
    injectFontFaces(shadow, sameOriginFontFaces);
  }

  // Phase 2: fetch cross-origin stylesheets asynchronously
  if (crossOriginURLs.length > 0) {
    fetchCrossOriginSheets(shadow, crossOriginURLs, function (fetchedCSSTexts) {
      var updatedProps = collectCSSCustomProperties();
      injectCSSCustomProperties(shadow, updatedProps);

      var fetchedFontFaces = [];
      for (var i = 0; i < fetchedCSSTexts.length; i++) {
        var extracted = extractFontFaceRules(fetchedCSSTexts[i]);
        for (var j = 0; j < extracted.length; j++) {
          fetchedFontFaces.push(extracted[j]);
        }
      }
      if (fetchedFontFaces.length > 0) {
        injectFontFaces(shadow, fetchedFontFaces);
      }

      if (onCrossOriginComplete) {
        onCrossOriginComplete(fetchedCSSTexts);
      }
    });
  } else {
    if (onCrossOriginComplete) {
      onCrossOriginComplete([]);
    }
  }
}

/**
 * Fetches an array of cross-origin stylesheet URLs via the background service worker
 * and injects the results into the shadow DOM. Uses a 3-second per-sheet timeout.
 * @param {ShadowRoot} shadow - The shadow root to inject fetched CSS into
 * @param {Array} urls - Array of cross-origin stylesheet URLs
 * @param {Function} callback - Called with array of successfully fetched CSS text strings
 */
function fetchCrossOriginSheets(shadow, urls, callback) {
  var remaining = urls.length;
  var fetchedCSSTexts = [];

  if (remaining === 0) {
    callback(fetchedCSSTexts);
    return;
  }

  for (var i = 0; i < urls.length; i++) {
    fetchSingleCrossOriginSheet(shadow, urls[i], function (cssText) {
      if (cssText) {
        fetchedCSSTexts.push(cssText);
      }
      remaining--;
      if (remaining === 0) {
        callback(fetchedCSSTexts);
      }
    });
  }
}

/**
 * Fetches a single cross-origin stylesheet via the background service worker
 * and injects it into the shadow DOM. Falls back to a <link> element on failure.
 * @param {ShadowRoot} shadow - The shadow root to inject into
 * @param {String} href - The URL of the stylesheet
 * @param {Function} done - Callback with cssText on success, null on failure
 */
function fetchSingleCrossOriginSheet(shadow, href, done) {
  try {
    chrome.runtime.sendMessage({ action: 'fetchCSS', url: href }, function (response) {
      if (chrome.runtime.lastError) {
        console.debug('fetchCSS message error:', chrome.runtime.lastError.message);
        injectLinkFallback(shadow, href);
        done(null);
        return;
      }

      if (response && response.success && response.cssText) {
        injectCSSTextIntoShadow(shadow, response.cssText);
        done(response.cssText);
      } else {
        injectLinkFallback(shadow, href);
        done(null);
      }
    });
  } catch (e) {
    console.debug('Error fetching cross-origin sheet:', e);
    injectLinkFallback(shadow, href);
    done(null);
  }
}

/**
 * Injects raw CSS text as a <style> element into a shadow root
 * @param {ShadowRoot} shadow - The shadow root
 * @param {String} cssText - The CSS text to inject
 */
function injectCSSTextIntoShadow(shadow, cssText) {
  var style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
}

/**
 * Injects a <link> element as a fallback when CSS text fetch fails
 * @param {ShadowRoot} shadow - The shadow root
 * @param {String} href - The stylesheet URL
 */
function injectLinkFallback(shadow, href) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  shadow.appendChild(link);
}

/**
 * Collects CSS custom properties (--variables) from :root, documentElement, and body
 * @returns {Object} - Map of property names to their computed values
 */
function collectCSSCustomProperties() {
  var properties = {};

  var targets = [document.documentElement];
  if (document.body) {
    targets.push(document.body);
  }

  for (var t = 0; t < targets.length; t++) {
    try {
      var sheets = Array.from(document.styleSheets);
      for (var s = 0; s < sheets.length; s++) {
        try {
          var rules = sheets[s].cssRules;
          if (!rules) continue;

          for (var r = 0; r < rules.length; r++) {
            var rule = rules[r];
            if (rule.type !== CSSRule.STYLE_RULE) continue;

            var selector = rule.selectorText || '';
            if (selector === ':root' || selector === 'html' || selector === 'body' ||
                selector === ':root, html' || selector === 'html, :root') {
              for (var p = 0; p < rule.style.length; p++) {
                var propName = rule.style[p];
                if (propName.indexOf('--') === 0) {
                  properties[propName] = rule.style.getPropertyValue(propName).trim();
                }
              }
            }
          }
        } catch (sheetErr) {
          // cross-origin sheet, skip
        }
      }
    } catch (e) {
      console.debug('Error collecting custom properties from sheets:', e);
    }
  }

  return properties;
}

/**
 * Injects CSS custom properties into the shadow DOM via a :host {} style block.
 * Removes any previously injected custom property block before creating a new one.
 * @param {ShadowRoot} shadow - The shadow root
 * @param {Object} properties - Map of property names to values
 */
function injectCSSCustomProperties(shadow, properties) {
  var existing = shadow.querySelector('style[data-zenreader-custom-props]');
  if (existing) {
    existing.parentNode.removeChild(existing);
  }

  var propNames = Object.keys(properties);
  if (propNames.length === 0) return;

  var cssLines = [];
  for (var i = 0; i < propNames.length; i++) {
    cssLines.push('  ' + propNames[i] + ': ' + properties[propNames[i]] + ';');
  }

  var style = document.createElement('style');
  style.setAttribute('data-zenreader-custom-props', 'true');
  style.textContent = ':host {\n' + cssLines.join('\n') + '\n}\n' +
                       '.shadow-container {\n' + cssLines.join('\n') + '\n}';

  // Insert after base style so custom props are available to all subsequent styles
  if (shadow.firstChild && shadow.firstChild.nextSibling) {
    shadow.insertBefore(style, shadow.firstChild.nextSibling);
  } else {
    shadow.appendChild(style);
  }
}

/**
 * Extracts @font-face rule blocks from a CSS text string using regex
 * @param {String} cssText - Raw CSS text to search
 * @returns {Array} - Array of @font-face rule strings
 */
function extractFontFaceRules(cssText) {
  if (!cssText) return [];
  var matches = cssText.match(/@font-face\s*\{[^}]*\}/gi);
  return matches || [];
}

/**
 * Injects @font-face rules into both the shadow DOM and the document head.
 * Deduplicates against previously injected rules using a data attribute marker.
 * @param {ShadowRoot} shadow - The shadow root
 * @param {Array} fontFaceRules - Array of @font-face CSS rule strings
 */
function injectFontFaces(shadow, fontFaceRules) {
  if (!fontFaceRules || fontFaceRules.length === 0) return;

  var dedupedRules = [];
  var existingHead = document.querySelector('style[data-zenreader-fonts]');
  var existingContent = existingHead ? existingHead.textContent : '';

  for (var i = 0; i < fontFaceRules.length; i++) {
    if (existingContent.indexOf(fontFaceRules[i]) === -1) {
      dedupedRules.push(fontFaceRules[i]);
    }
  }

  if (dedupedRules.length === 0) return;

  var combined = dedupedRules.join('\n');

  var shadowStyle = document.createElement('style');
  shadowStyle.textContent = combined;
  shadow.appendChild(shadowStyle);

  // Fonts must also load in the main document context for Shadow DOM to use them
  if (existingHead) {
    existingHead.textContent += '\n' + combined;
  } else {
    var headStyle = document.createElement('style');
    headStyle.setAttribute('data-zenreader-fonts', 'true');
    headStyle.textContent = combined;
    document.head.appendChild(headStyle);
  }
}

/**
 * Creates special CSS rules for handling common styling issues
 * @param {Object} colors - The color settings determined for the page
 * @returns {String} - CSS rules as a string
 */
function createSpecialCssRules(colors) {
  return `
    *, *::before, *::after {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    [style*="position: fixed"],
    [style*="position:fixed"] {
      position: relative !important;
    }

    .shadow-container > [style*="position: absolute"],
    .shadow-container > [style*="position:absolute"] {
      position: relative !important;
    }

    .shadow-container::after {
      content: "";
      display: table;
      clear: both;
    }

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

    [class*="grid"] > *,
    [class*="flex"] > *,
    [style*="display: grid"] > *,
    [style*="display:grid"] > *,
    [style*="display: flex"] > *,
    [style*="display:flex"] > * {
      width: 100%;
    }

    pre, code, .code, [class*="code"] {
      font-family: monospace !important;
      white-space: pre-wrap !important;
      background-color: ${colors.isDarkTheme ? '#2d2d2d' : '#f5f5f5'} !important;
      color: ${colors.isDarkTheme ? '#e0e0e0' : '#333'} !important;
      width: 100% !important;
      overflow-x: auto !important;
    }

    a:not([data-zenreader-styled]) {
      color: ${colors.isDarkTheme ? '#6ea8fe' : '#0066cc'} !important;
      text-decoration: underline !important;
    }

    table:not([data-zenreader-styled]) {
      border-collapse: collapse !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 1em 0 !important;
      table-layout: auto !important;
      display: block !important;
      overflow-x: auto !important;
    }

    img:not([data-zenreader-styled]) {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }

    [class*="sidebar"],
    [id*="sidebar"],
    aside {
      float: none !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;
}
