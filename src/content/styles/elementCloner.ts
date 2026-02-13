import { getStyleFromCache } from './styleCache';

const IMPORTANT_STYLE_PROPERTIES = [
  'color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'line-height', 'letter-spacing',
  'background-color', 'background-image', 'background-size', 'background-position',
  'display', 'position', 'margin', 'padding', 'border',
  'opacity', 'box-shadow', 'border-radius',
];

const EXTENDED_STYLE_PROPERTIES = [
  ...IMPORTANT_STYLE_PROPERTIES,
  'white-space', 'word-spacing', 'word-break', 'flex', 'flex-direction',
  'flex-wrap', 'flex-flow', 'justify-content', 'align-items', 'align-content',
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'column-gap', 'row-gap', 'gap',
];

export function isPossibleTagElement(element: Element): boolean {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const className = (
    typeof (element as HTMLElement).className === 'string'
      ? (element as HTMLElement).className
      : ((element as SVGElement).className?.baseVal || '')
  ).toLowerCase();
  const id = (element.id || '').toLowerCase();
  const innerText = (element as HTMLElement).innerText || '';

  const commonTagIdentifiers = [
    'tag', 'label', 'badge', 'pill', 'chip', 'hashtag', 'category',
  ];

  const hasTagClass = commonTagIdentifiers.some(ident => className.includes(ident));
  const hasTagId = commonTagIdentifiers.some(ident => id.includes(ident));

  const isShortText = innerText.length < 30;
  const hasSimpleStructure = element.children.length <= 1;

  const style = getStyleFromCache(element) || window.getComputedStyle(element);

  const hasBorderRadius = !!style.borderRadius && style.borderRadius !== '0px';
  const hasInlineDisplay = style.display === 'inline' ||
    style.display === 'inline-block' ||
    style.display === 'inline-flex';
  const hasBackground = !!style.backgroundColor &&
    style.backgroundColor !== 'transparent' &&
    style.backgroundColor !== 'rgba(0, 0, 0, 0)';
  const hasBorder = !!style.border && style.border !== 'none' && style.border !== '0px';

  const isHashtag = innerText.trim().startsWith('#');

  let hasTagContainer = false;
  if (element.parentElement) {
    const parentClass = (
      typeof element.parentElement.className === 'string'
        ? element.parentElement.className
        : ((element.parentElement as unknown as SVGElement).className?.baseVal || '')
    ).toLowerCase();
    const parentId = (element.parentElement.id || '').toLowerCase();
    hasTagContainer = commonTagIdentifiers.some(ident => parentClass.includes(ident) || parentId.includes(ident));
  }

  return (
    hasTagClass ||
    hasTagId ||
    isHashtag ||
    hasTagContainer ||
    (isShortText && hasSimpleStructure && (hasInlineDisplay || hasBorderRadius || hasBackground || hasBorder))
  );
}

export function applyComputedStylesToElement(
  targetElement: HTMLElement,
  sourceElement: HTMLElement,
  isMainContent: boolean,
  isTopLevel: boolean,
): void {
  if (!targetElement || !sourceElement || targetElement.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const computedStyle = getStyleFromCache(sourceElement) || window.getComputedStyle(sourceElement);

  if (!computedStyle.color) {
    return;
  }

  const isPossibleTag = isPossibleTagElement(sourceElement);

  if (isTopLevel) {
    targetElement.style.setProperty('width', '100%', 'important');
    targetElement.style.setProperty('max-width', '100%', 'important');
    targetElement.style.setProperty('box-sizing', 'border-box', 'important');
    targetElement.style.setProperty('padding-left', '0', 'important');
    targetElement.style.setProperty('padding-right', '0', 'important');

    if (computedStyle.float && computedStyle.float !== 'none') {
      targetElement.style.setProperty('float', 'none', 'important');
    }

    if (computedStyle.position === 'fixed' || computedStyle.position === 'absolute') {
      targetElement.style.setProperty('position', 'relative', 'important');
    }

    targetElement.style.setProperty('margin-left', '0', 'important');
    targetElement.style.setProperty('margin-right', '0', 'important');

    if (computedStyle.columnCount && computedStyle.columnCount !== 'auto') {
      targetElement.style.setProperty('column-count', '1', 'important');
    }

    if (computedStyle.transform && computedStyle.transform !== 'none') {
      targetElement.style.setProperty('transform', 'none', 'important');
    }
  } else {
    if (isPossibleTag) {
      if (computedStyle.display) {
        targetElement.style.setProperty('display', computedStyle.display, 'important');
      }
      if (computedStyle.float && computedStyle.float !== 'none') {
        targetElement.style.setProperty('float', computedStyle.float, 'important');
      }
      if (computedStyle.flex) {
        targetElement.style.setProperty('flex', computedStyle.flex, 'important');
      }
      targetElement.style.removeProperty('width');
      if (computedStyle.marginLeft) {
        targetElement.style.setProperty('margin-left', computedStyle.marginLeft);
      }
      if (computedStyle.marginRight) {
        targetElement.style.setProperty('margin-right', computedStyle.marginRight);
      }
      if (computedStyle.whiteSpace) {
        targetElement.style.setProperty('white-space', computedStyle.whiteSpace, 'important');
      }
    } else {
      const tagName = targetElement.tagName.toLowerCase();
      const shouldBeFull = ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside'];
      if (shouldBeFull.includes(tagName)) {
        if (sourceElement.children.length > 0 || sourceElement.innerText.trim().length > 0) {
          targetElement.style.setProperty('width', '100%', 'important');
        }
      }

      if (['img', 'video', 'iframe', 'canvas', 'svg'].includes(tagName)) {
        targetElement.style.setProperty('max-width', '100%', 'important');
        targetElement.style.setProperty('height', 'auto', 'important');
        if (tagName === 'img' || tagName === 'video') {
          if (sourceElement.parentElement && sourceElement.parentElement.children.length === 1) {
            targetElement.style.setProperty('display', 'block', 'important');
            targetElement.style.setProperty('margin-left', 'auto', 'important');
            targetElement.style.setProperty('margin-right', 'auto', 'important');
          }
        }
      }

      if (tagName === 'table') {
        targetElement.style.setProperty('width', '100%', 'important');
        targetElement.style.setProperty('max-width', '100%', 'important');
        if (sourceElement.offsetWidth > 500) {
          targetElement.style.setProperty('display', 'block', 'important');
          targetElement.style.setProperty('overflow-x', 'auto', 'important');
        }
      }

      if (tagName === 'div') {
        const hasParagraphs = sourceElement.querySelectorAll('p').length > 0;
        const hasHeadings = sourceElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
        const hasMultipleChildren = sourceElement.children.length > 2;

        if (hasParagraphs || hasHeadings || hasMultipleChildren) {
          targetElement.style.setProperty('width', '100%', 'important');
          const className = targetElement.className || '';
          const containsContentClass = /content|article|post|main|body|text/i.test(className);
          if (containsContentClass) {
            targetElement.style.setProperty('max-width', '100%', 'important');
            targetElement.style.setProperty('margin-left', '0', 'important');
            targetElement.style.setProperty('margin-right', '0', 'important');
          }
        }
      }
    }
  }

  const displayValue = computedStyle.display;
  if (displayValue !== 'none') {
    targetElement.style.setProperty('display', displayValue, 'important');
  }

  const bgColor = computedStyle.backgroundColor;
  if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
    targetElement.style.setProperty('background-color', bgColor, 'important');
  }

  const textColor = computedStyle.color;
  if (textColor) {
    targetElement.style.setProperty('color', textColor, 'important');
  }

  if (computedStyle.background && computedStyle.background !== 'none' && computedStyle.background !== 'rgba(0, 0, 0, 0)') {
    targetElement.style.setProperty('background', computedStyle.background, 'important');
  } else {
    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
      targetElement.style.setProperty('background-image', computedStyle.backgroundImage);
    }
    if (computedStyle.backgroundPosition) {
      targetElement.style.setProperty('background-position', computedStyle.backgroundPosition);
    }
    if (computedStyle.backgroundRepeat) {
      targetElement.style.setProperty('background-repeat', computedStyle.backgroundRepeat);
    }
    if (computedStyle.backgroundSize && computedStyle.backgroundSize !== 'auto') {
      targetElement.style.setProperty('background-size', computedStyle.backgroundSize);
    }
    if (computedStyle.backgroundOrigin) {
      targetElement.style.setProperty('background-origin', computedStyle.backgroundOrigin);
    }
    if (computedStyle.backgroundClip) {
      targetElement.style.setProperty('background-clip', computedStyle.backgroundClip);
    }
    if (computedStyle.backgroundAttachment) {
      targetElement.style.setProperty('background-attachment', computedStyle.backgroundAttachment);
    }
  }

  EXTENDED_STYLE_PROPERTIES.forEach(prop => {
    const camelProp = prop.replace(/-([a-z])/g, (_g, letter: string) => letter.toUpperCase());

    if (isTopLevel && (prop === 'width' || prop === 'max-width')) {
      return;
    }
    if (prop.startsWith('background')) {
      return;
    }

    const value = computedStyle[camelProp as keyof CSSStyleDeclaration] as string;
    if (value && value !== 'none' && value !== 'normal' && value !== '0px' &&
      value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
      targetElement.style.setProperty(prop, value);
    }
  });

  if (targetElement.tagName.toLowerCase() === 'a') {
    targetElement.style.color = computedStyle.color;
    targetElement.style.textDecoration = computedStyle.textDecoration;
  }

  if (targetElement.tagName.toLowerCase() === 'img') {
    targetElement.style.maxWidth = '100%';
    targetElement.style.height = 'auto';
    targetElement.style.display = 'inline-block';
  }

  const tagNameUpper = targetElement.tagName.toUpperCase();
  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagNameUpper)) {
    targetElement.style.fontWeight = computedStyle.fontWeight || 'bold';
    targetElement.style.margin = computedStyle.margin || '0.5em 0';
    targetElement.style.lineHeight = computedStyle.lineHeight || '1.2';
  }

  if (tagNameUpper === 'P') {
    targetElement.style.margin = computedStyle.margin || '1em 0';
  }

  if (['UL', 'OL'].includes(tagNameUpper)) {
    targetElement.style.paddingLeft = computedStyle.paddingLeft || '40px';
    targetElement.style.marginTop = computedStyle.marginTop || '1em';
    targetElement.style.marginBottom = computedStyle.marginBottom || '1em';
  }

  if (tagNameUpper === 'PRE' || tagNameUpper === 'CODE') {
    targetElement.style.fontFamily = 'monospace';
    targetElement.style.whiteSpace = 'pre-wrap';
    targetElement.style.backgroundColor = computedStyle.backgroundColor || '#f5f5f5';
    targetElement.style.padding = computedStyle.padding || '0.2em 0.4em';
    targetElement.style.width = '100%';
    targetElement.style.overflow = 'auto';
  }

  targetElement.setAttribute('data-zenreader-styled', 'true');
}

export function cloneElementWithStyles(
  element: HTMLElement,
  isMainContent: boolean,
  maxDepth: number = 20,
): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  applyComputedStylesToElement(clone, element, isMainContent, true);
  processChildrenWithStyles(clone, element, isMainContent, 0, maxDepth);
  return clone;
}

function processChildrenWithStyles(
  targetElement: HTMLElement,
  sourceElement: HTMLElement,
  isMainContent: boolean,
  depth: number,
  maxDepth: number,
): void {
  if (depth > maxDepth) return;

  const sourceChildren = sourceElement.children;
  const targetChildren = targetElement.children;

  for (let i = 0; i < sourceChildren.length; i++) {
    if (i < targetChildren.length && sourceChildren[i].nodeType === Node.ELEMENT_NODE) {
      applyComputedStylesToElement(
        targetChildren[i] as HTMLElement,
        sourceChildren[i] as HTMLElement,
        isMainContent,
        false,
      );

      if (sourceChildren[i].children.length > 0) {
        processChildrenWithStyles(
          targetChildren[i] as HTMLElement,
          sourceChildren[i] as HTMLElement,
          isMainContent,
          depth + 1,
          maxDepth,
        );
      }
    }
  }
}
