import { getStyleFromCache } from '../styles/styleCache';

const PSEUDO_STYLE_PROPERTIES = [
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'float', 'clear', 'width', 'height', 'minWidth', 'minHeight',
  'maxWidth', 'maxHeight', 'margin', 'padding', 'border',
  'borderRadius', 'color', 'backgroundColor', 'backgroundImage',
  'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
  'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
  'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
  'textTransform', 'verticalAlign', 'whiteSpace', 'opacity',
  'boxShadow', 'zIndex', 'overflow', 'listStyleType',
] as const;

export function materializePseudoElements(sourceRoot: HTMLElement, cloneRoot: HTMLElement): void {
  if (!sourceRoot || !cloneRoot) return;

  const sourceWalker = document.createTreeWalker(sourceRoot, NodeFilter.SHOW_ELEMENT);
  const cloneWalker = document.createTreeWalker(cloneRoot, NodeFilter.SHOW_ELEMENT);

  materializeSinglePseudo(sourceRoot, cloneRoot, '::before');
  materializeSinglePseudo(sourceRoot, cloneRoot, '::after');

  let sourceNode = sourceWalker.nextNode() as HTMLElement | null;
  let cloneNode = cloneWalker.nextNode() as HTMLElement | null;

  while (sourceNode && cloneNode) {
    materializeSinglePseudo(sourceNode, cloneNode, '::before');
    materializeSinglePseudo(sourceNode, cloneNode, '::after');
    sourceNode = sourceWalker.nextNode() as HTMLElement | null;
    cloneNode = cloneWalker.nextNode() as HTMLElement | null;
  }
}

function materializeSinglePseudo(
  sourceEl: HTMLElement,
  cloneEl: HTMLElement,
  pseudoType: '::before' | '::after',
): void {
  try {
    const pseudoStyle = window.getComputedStyle(sourceEl, pseudoType);

    const rawContent = pseudoStyle.getPropertyValue('content');
    if (!rawContent || rawContent === 'none' || rawContent === 'normal') return;

    const display = pseudoStyle.getPropertyValue('display');
    if (display === 'none') return;

    const parsed = parsePseudoContent(rawContent);
    if (!parsed) return;

    const span = document.createElement('span');
    span.setAttribute('data-zenreader-pseudo', pseudoType);
    span.setAttribute('aria-hidden', 'true');

    if (parsed.type === 'text') {
      span.textContent = parsed.value;
    } else if (parsed.type === 'image') {
      const img = document.createElement('img');
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

interface ParsedPseudoContent {
  type: 'text' | 'image' | 'counter';
  value: string;
}

/**
 * Parses CSS `content` property values into typed results.
 * Handles quoted strings, url() references, counter() and attr() functions.
 * Regex patterns match CSS content syntax: url("..."), counter(...), attr(...), "string"
 */
export function parsePseudoContent(rawContent: string): ParsedPseudoContent | null {
  if (!rawContent || rawContent === 'none' || rawContent === 'normal') return null;

  const trimmed = rawContent.trim();

  const urlMatch = trimmed.match(/url\(["']?([^"')]+)["']?\)/);
  if (urlMatch) {
    return { type: 'image', value: urlMatch[1] };
  }

  const counterMatch = trimmed.match(/counter\(([^)]+)\)/);
  if (counterMatch) {
    return { type: 'counter', value: '' };
  }

  const attrMatch = trimmed.match(/attr\(([^)]+)\)/);
  if (attrMatch) {
    return { type: 'text', value: '' };
  }

  const stringMatch = trimmed.match(/^["'](.*)["']$/);
  if (stringMatch) {
    let value = stringMatch[1];
    if (value === '' || value === ' ') return null;
    // CSS escape sequences: \a = newline, \2022 = bullet, \00a0 = nbsp
    value = value.replace(/\\a\s?/gi, '\n')
                 .replace(/\\2022\s?/g, '\u2022')
                 .replace(/\\00a0\s?/g, '\u00a0')
                 .replace(/\\e/gi, '')
                 .replace(/\\\\/g, '\\');
    return { type: 'text', value };
  }

  if (trimmed === '""' || trimmed === "''") return null;

  return null;
}

function copyPseudoStyles(pseudoSpan: HTMLElement, computedStyle: CSSStyleDeclaration): void {
  for (let i = 0; i < PSEUDO_STYLE_PROPERTIES.length; i++) {
    const prop = PSEUDO_STYLE_PROPERTIES[i];
    try {
      const value = computedStyle[prop as keyof CSSStyleDeclaration] as string;
      if (value && value !== 'none' && value !== 'normal' &&
          value !== '0px' && value !== 'rgba(0, 0, 0, 0)' &&
          value !== 'transparent' && value !== 'auto') {
        pseudoSpan.style[prop as unknown as number] = value;
      }
    } catch (_e) {
      // skip unreadable properties
    }
  }
}
