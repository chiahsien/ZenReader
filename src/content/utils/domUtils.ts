import { isPossibleTagElement } from '../styles/elementCloner';

export function estimateTreeSize(element: Element, cap: number = 2000): number {
  if (!element) return 0;

  let count = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    count++;
    if (count >= cap) return cap;
  }
  return count;
}

export function modifyLinks(element: HTMLElement): void {
  const links = element.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('/') || !href.includes('://')) {
        const baseUrl = window.location.origin;
        link.setAttribute('href', baseUrl + (href.startsWith('/') ? href : '/' + href));
      }
    }
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  const possibleTagContainers = element.querySelectorAll(
    '[class*="tags"], [class*="labels"], [class*="badges"], ' +
    '[class*="pills"], [class*="chips"], [class*="hashtags"], ' +
    '[id*="tags"], [id*="labels"], [id*="badges"], ' +
    '[id*="pills"], [id*="chips"], [id*="hashtags"]',
  );

  possibleTagContainers.forEach(container => {
    const style = window.getComputedStyle(container);
    const htmlContainer = container as HTMLElement;
    if (style.display === 'flex' || style.display === 'inline-flex') {
      htmlContainer.style.setProperty('display', style.display, 'important');
      if (style.flexWrap) htmlContainer.style.setProperty('flex-wrap', style.flexWrap, 'important');
      if (style.flexDirection) htmlContainer.style.setProperty('flex-direction', style.flexDirection, 'important');
      if (style.justifyContent) htmlContainer.style.setProperty('justify-content', style.justifyContent, 'important');
      if (style.alignItems) htmlContainer.style.setProperty('align-items', style.alignItems, 'important');
      if (style.gap) htmlContainer.style.setProperty('gap', style.gap, 'important');
    } else {
      htmlContainer.style.setProperty('display', 'flex', 'important');
      htmlContainer.style.setProperty('flex-wrap', 'wrap', 'important');
      htmlContainer.style.setProperty('align-items', 'center', 'important');
      htmlContainer.style.setProperty('gap', '0.5em', 'important');
    }

    Array.from(container.children).forEach(child => {
      if (isPossibleTagElement(child)) {
        (child as HTMLElement).style.setProperty('display', 'inline-block', 'important');
        (child as HTMLElement).style.setProperty('width', 'auto', 'important');
        (child as HTMLElement).style.setProperty('max-width', 'none', 'important');
      }
    });
  });

  const floatElements = element.querySelectorAll('[style*="float:"], [style*="float :"]');
  floatElements.forEach(el => {
    if (!isPossibleTagElement(el)) {
      const tagNameLower = el.tagName.toLowerCase();
      if (tagNameLower !== 'img') {
        (el as HTMLElement).style.setProperty('float', 'none', 'important');
        (el as HTMLElement).style.setProperty('width', '100%', 'important');
      }
    }
  });

  const absElements = element.querySelectorAll('[style*="position:absolute"], [style*="position: absolute"]');
  absElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.setProperty('position', 'relative', 'important');
    htmlEl.style.setProperty('top', 'auto', 'important');
    htmlEl.style.setProperty('left', 'auto', 'important');
    htmlEl.style.setProperty('right', 'auto', 'important');
    htmlEl.style.setProperty('bottom', 'auto', 'important');
  });

  const colElements = element.querySelectorAll('[style*="column-count"], [style*="columns"]');
  colElements.forEach(el => {
    (el as HTMLElement).style.setProperty('column-count', '1', 'important');
    (el as HTMLElement).style.setProperty('columns', 'auto', 'important');
  });

  const containers = element.querySelectorAll('div, article, section, main');
  containers.forEach(container => {
    if (!container.className ||
      !(/tags|labels|badges|pills|chips|hashtags/i.test(container.className as string))) {
      const style = window.getComputedStyle(container);
      const widthValue = parseInt(style.width);

      if (!isNaN(widthValue) && !style.width.includes('%') && widthValue < 800) {
        (container as HTMLElement).style.setProperty('width', '100%', 'important');
        (container as HTMLElement).style.setProperty('max-width', '100%', 'important');
      }
    }
  });

  const sideElements = element.querySelectorAll('[class*="left"], [class*="right"], [class*="side"]');
  sideElements.forEach(el => {
    if (!isPossibleTagElement(el)) {
      const tagNameLower = el.tagName.toLowerCase();
      if (tagNameLower !== 'img' && tagNameLower !== 'span') {
        (el as HTMLElement).style.setProperty('float', 'none', 'important');
        (el as HTMLElement).style.setProperty('width', '100%', 'important');
        (el as HTMLElement).style.setProperty('margin-left', '0', 'important');
        (el as HTMLElement).style.setProperty('margin-right', '0', 'important');
      }
    }
  });
}

export function resolveLazyImages(cloneElement: HTMLElement): void {
  if (!cloneElement) return;

  const images = cloneElement.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    const lazySrc = img.getAttribute('data-src') ||
                    img.getAttribute('data-lazy-src') ||
                    img.getAttribute('data-original');
    if (lazySrc) {
      img.setAttribute('src', lazySrc);
    }

    const lazySrcset = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (lazySrcset) {
      img.setAttribute('srcset', lazySrcset);
    }

    const lazySizes = img.getAttribute('data-sizes');
    if (lazySizes) {
      img.setAttribute('sizes', lazySizes);
    }

    const currentSrc = img.getAttribute('src') || '';
    if (currentSrc.indexOf('data:image/') === 0 && img.getAttribute('data-src')) {
      img.setAttribute('src', img.getAttribute('data-src')!);
    }

    if (img.getAttribute('loading') === 'lazy') {
      img.removeAttribute('loading');
    }

    const className = img.className || '';
    if (typeof className === 'string') {
      img.className = className.replace(/\b(lazy|lazyload|lazyloaded|lazyloading)\b/g, '').trim();
    }
  }

  const sources = cloneElement.querySelectorAll('picture source[data-srcset]');
  for (let j = 0; j < sources.length; j++) {
    const source = sources[j];
    source.setAttribute('srcset', source.getAttribute('data-srcset')!);
  }

  // Handle <noscript> fallback images
  const noscripts = cloneElement.querySelectorAll('noscript');
  for (let k = 0; k < noscripts.length; k++) {
    const noscript = noscripts[k];
    const prevImg = noscript.previousElementSibling;
    if (prevImg && prevImg.tagName === 'IMG') {
      const noscriptContent = noscript.textContent || '';
      const srcMatch = noscriptContent.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        (prevImg as HTMLImageElement).setAttribute('src', srcMatch[1]);
      }
    }
  }
}
