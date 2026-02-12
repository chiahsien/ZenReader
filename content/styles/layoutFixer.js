/**
 * ZenReader - Layout Fixer Module
 *
 * This script materializes CSS pseudo-elements (::before, ::after) from the
 * source DOM into real <span> elements in the clone, preserving visual content
 * that would otherwise be lost inside the Shadow DOM.
 */

/**
 * List of CSS properties to copy from pseudo-element computed styles
 */
var PSEUDO_STYLE_PROPERTIES = [
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'float', 'clear', 'width', 'height', 'minWidth', 'minHeight',
  'maxWidth', 'maxHeight', 'margin', 'padding', 'border',
  'borderRadius', 'color', 'backgroundColor', 'backgroundImage',
  'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
  'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
  'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
  'textTransform', 'verticalAlign', 'whiteSpace', 'opacity',
  'boxShadow', 'zIndex', 'overflow', 'listStyleType'
];

/**
 * Walks the source and clone trees in parallel, materializing ::before and
 * ::after pseudo-elements from the source into real spans in the clone.
 * @param {HTMLElement} sourceRoot - The original DOM element tree
 * @param {HTMLElement} cloneRoot - The cloned element tree
 */
function materializePseudoElements(sourceRoot, cloneRoot) {
  if (!sourceRoot || !cloneRoot) return;

  var sourceWalker = document.createTreeWalker(sourceRoot, NodeFilter.SHOW_ELEMENT);
  var cloneWalker = document.createTreeWalker(cloneRoot, NodeFilter.SHOW_ELEMENT);

  materializeSinglePseudo(sourceRoot, cloneRoot, '::before');
  materializeSinglePseudo(sourceRoot, cloneRoot, '::after');

  var sourceNode = sourceWalker.nextNode();
  var cloneNode = cloneWalker.nextNode();

  while (sourceNode && cloneNode) {
    materializeSinglePseudo(sourceNode, cloneNode, '::before');
    materializeSinglePseudo(sourceNode, cloneNode, '::after');
    sourceNode = sourceWalker.nextNode();
    cloneNode = cloneWalker.nextNode();
  }
}

/**
 * Checks a single source element for a pseudo-element and, if it has visible
 * content, creates a real <span> in the clone to represent it.
 * @param {HTMLElement} sourceEl - The original element to inspect
 * @param {HTMLElement} cloneEl - The corresponding cloned element
 * @param {String} pseudoType - Either '::before' or '::after'
 */
function materializeSinglePseudo(sourceEl, cloneEl, pseudoType) {
  try {
    var pseudoStyle = window.getComputedStyle(sourceEl, pseudoType);

    var rawContent = pseudoStyle.getPropertyValue('content');
    if (!rawContent || rawContent === 'none' || rawContent === 'normal') return;

    var display = pseudoStyle.getPropertyValue('display');
    if (display === 'none') return;

    var parsed = parsePseudoContent(rawContent);
    if (!parsed) return;

    var span = document.createElement('span');
    span.setAttribute('data-zenreader-pseudo', pseudoType);
    span.setAttribute('aria-hidden', 'true');

    if (parsed.type === 'text') {
      span.textContent = parsed.value;
    } else if (parsed.type === 'image') {
      var img = document.createElement('img');
      img.src = parsed.value;
      img.style.setProperty('max-width', '100%', 'important');
      img.style.setProperty('height', 'auto', 'important');
      span.appendChild(img);
    } else if (parsed.type === 'counter') {
      span.textContent = parsed.value;
    }

    copyPseudoStyles(span, pseudoStyle);

    if (pseudoType === '::before') {
      cloneEl.insertBefore(span, cloneEl.firstChild);
    } else {
      cloneEl.appendChild(span);
    }
  } catch (e) {
    console.debug('Could not materialize pseudo-element:', e);
  }
}

/**
 * Parses the raw CSS content property value into a typed result.
 * Handles quoted strings, url() references, counter() and attr() functions.
 * @param {String} rawContent - The raw content property value (e.g. '"Hello"', 'url(...)')
 * @returns {Object|null} - Parsed result with {type, value} or null if empty/unrecognized
 */
function parsePseudoContent(rawContent) {
  if (!rawContent || rawContent === 'none' || rawContent === 'normal') return null;

  var trimmed = rawContent.trim();

  var urlMatch = trimmed.match(/url\(["']?([^"')]+)["']?\)/);
  if (urlMatch) {
    return { type: 'image', value: urlMatch[1] };
  }

  var counterMatch = trimmed.match(/counter\(([^)]+)\)/);
  if (counterMatch) {
    return { type: 'counter', value: '' };
  }

  var attrMatch = trimmed.match(/attr\(([^)]+)\)/);
  if (attrMatch) {
    return { type: 'text', value: '' };
  }

  var stringMatch = trimmed.match(/^["'](.*)["']$/);
  if (stringMatch) {
    var value = stringMatch[1];
    if (value === '' || value === ' ') return null;
    value = value.replace(/\\a\s?/gi, '\n')
                 .replace(/\\2022\s?/g, '\u2022')
                 .replace(/\\00a0\s?/g, '\u00a0')
                 .replace(/\\e/gi, '')
                 .replace(/\\\\/g, '\\');
    return { type: 'text', value: value };
  }

  if (trimmed === '""' || trimmed === "''") return null;

  return null;
}

/**
 * Copies key visual CSS properties from a pseudo-element's computed style onto
 * a real <span> element that represents it.
 * @param {HTMLElement} pseudoSpan - The span element to style
 * @param {CSSStyleDeclaration} computedStyle - The computed style of the pseudo-element
 */
function copyPseudoStyles(pseudoSpan, computedStyle) {
  for (var i = 0; i < PSEUDO_STYLE_PROPERTIES.length; i++) {
    var prop = PSEUDO_STYLE_PROPERTIES[i];
    try {
      var value = computedStyle[prop];
      if (value && value !== 'none' && value !== 'normal' &&
          value !== '0px' && value !== 'rgba(0, 0, 0, 0)' &&
          value !== 'transparent' && value !== 'auto') {
        pseudoSpan.style[prop] = value;
      }
    } catch (e) {
      // skip unreadable properties
    }
  }
}
