import type { ColorSettings } from '../utils/colorUtils';

export function addStylesToShadowDOM(
  shadow: ShadowRoot,
  colors: ColorSettings,
  isMainContent: boolean,
  onCrossOriginComplete?: (fetchedCSSTexts: string[]) => void,
): void {
  const baseStyle = document.createElement('style');

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

  const customProps = collectCSSCustomProperties();
  injectCSSCustomProperties(shadow, customProps);

  const crossOriginURLs: string[] = [];
  const sameOriginFontFaces: string[] = [];

  try {
    const styleSheets = Array.from(document.styleSheets);

    styleSheets.forEach(function (sheet) {
      try {
        if (!sheet.cssRules) {
          if (sheet.href) {
            crossOriginURLs.push(sheet.href);
          }
          return;
        }

        const style = document.createElement('style');

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

    const inlineStyles = document.querySelectorAll('style');
    inlineStyles.forEach(function (inlineStyle) {
      const style = document.createElement('style');
      style.textContent = inlineStyle.textContent;
      shadow.appendChild(style);
    });

    const specialStylesElement = document.createElement('style');
    specialStylesElement.textContent = createSpecialCssRules(colors);
    shadow.appendChild(specialStylesElement);

  } catch (e) {
    console.error('Error copying styles to shadow DOM:', e);
  }

  if (sameOriginFontFaces.length > 0) {
    injectFontFaces(shadow, sameOriginFontFaces);
  }

  if (crossOriginURLs.length > 0) {
    fetchCrossOriginSheets(shadow, crossOriginURLs, function (fetchedCSSTexts) {
      const updatedProps = collectCSSCustomProperties();
      injectCSSCustomProperties(shadow, updatedProps);

      const fetchedFontFaces: string[] = [];
      for (let i = 0; i < fetchedCSSTexts.length; i++) {
        const extracted = extractFontFaceRules(fetchedCSSTexts[i]);
        for (let j = 0; j < extracted.length; j++) {
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

function fetchCrossOriginSheets(
  shadow: ShadowRoot,
  urls: string[],
  callback: (texts: string[]) => void,
): void {
  let remaining = urls.length;
  const fetchedCSSTexts: string[] = [];

  if (remaining === 0) {
    callback(fetchedCSSTexts);
    return;
  }

  for (let i = 0; i < urls.length; i++) {
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

function fetchSingleCrossOriginSheet(
  shadow: ShadowRoot,
  href: string,
  done: (cssText: string | null) => void,
): void {
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

function injectCSSTextIntoShadow(shadow: ShadowRoot, cssText: string): void {
  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
}

function injectLinkFallback(shadow: ShadowRoot, href: string): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  shadow.appendChild(link);
}

function collectCSSCustomProperties(): Record<string, string> {
  const properties: Record<string, string> = {};

  const targets = [document.documentElement];
  if (document.body) {
    targets.push(document.body);
  }

  for (let t = 0; t < targets.length; t++) {
    try {
      const sheets = Array.from(document.styleSheets);
      for (let s = 0; s < sheets.length; s++) {
        try {
          const rules = sheets[s].cssRules;
          if (!rules) continue;

          for (let r = 0; r < rules.length; r++) {
            const rule = rules[r];
            if (rule.type !== CSSRule.STYLE_RULE) continue;

            const styleRule = rule as CSSStyleRule;
            const selector = styleRule.selectorText || '';
            if (selector === ':root' || selector === 'html' || selector === 'body' ||
                selector === ':root, html' || selector === 'html, :root') {
              for (let p = 0; p < styleRule.style.length; p++) {
                const propName = styleRule.style[p];
                if (propName.indexOf('--') === 0) {
                  properties[propName] = styleRule.style.getPropertyValue(propName).trim();
                }
              }
            }
          }
        } catch (_sheetErr) {
          // cross-origin sheet, skip
        }
      }
    } catch (e) {
      console.debug('Error collecting custom properties from sheets:', e);
    }
  }

  return properties;
}

function injectCSSCustomProperties(shadow: ShadowRoot, properties: Record<string, string>): void {
  const existing = shadow.querySelector('style[data-zenreader-custom-props]');
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing);
  }

  const propNames = Object.keys(properties);
  if (propNames.length === 0) return;

  const cssLines: string[] = [];
  for (let i = 0; i < propNames.length; i++) {
    cssLines.push('  ' + propNames[i] + ': ' + properties[propNames[i]] + ';');
  }

  const style = document.createElement('style');
  style.setAttribute('data-zenreader-custom-props', 'true');
  style.textContent = ':host {\n' + cssLines.join('\n') + '\n}\n' +
                       '.shadow-container {\n' + cssLines.join('\n') + '\n}';

  if (shadow.firstChild && shadow.firstChild.nextSibling) {
    shadow.insertBefore(style, shadow.firstChild.nextSibling);
  } else {
    shadow.appendChild(style);
  }
}

/**
 * Extracts @font-face rule blocks from CSS text using regex.
 * The regex matches the @font-face at-rule including its full declaration block.
 */
export function extractFontFaceRules(cssText: string): string[] {
  if (!cssText) return [];
  const matches = cssText.match(/@font-face\s*\{[^}]*\}/gi);
  return matches || [];
}

function injectFontFaces(shadow: ShadowRoot, fontFaceRules: string[]): void {
  if (!fontFaceRules || fontFaceRules.length === 0) return;

  const dedupedRules: string[] = [];
  const existingHead = document.querySelector('style[data-zenreader-fonts]');
  const existingContent = existingHead ? existingHead.textContent || '' : '';

  for (let i = 0; i < fontFaceRules.length; i++) {
    if (existingContent.indexOf(fontFaceRules[i]) === -1) {
      dedupedRules.push(fontFaceRules[i]);
    }
  }

  if (dedupedRules.length === 0) return;

  const combined = dedupedRules.join('\n');

  const shadowStyle = document.createElement('style');
  shadowStyle.textContent = combined;
  shadow.appendChild(shadowStyle);

  // Fonts must load in the main document context for Shadow DOM to use them
  if (existingHead) {
    existingHead.textContent += '\n' + combined;
  } else {
    const headStyle = document.createElement('style');
    headStyle.setAttribute('data-zenreader-fonts', 'true');
    headStyle.textContent = combined;
    document.head.appendChild(headStyle);
  }
}

function createSpecialCssRules(colors: ColorSettings): string {
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
