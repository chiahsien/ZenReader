let styleCache: Map<Element, CSSStyleDeclaration> | null = null;

export function initStyleCache(): void {
  styleCache = new Map();
}

export function clearStyleCache(): void {
  if (styleCache) {
    styleCache.clear();
  }
}

export function getStyleFromCache(element: Element): CSSStyleDeclaration | null {
  if (!styleCache) return null;
  return styleCache.get(element) || null;
}

export function setStyleInCache(element: Element, style: CSSStyleDeclaration): void {
  if (!styleCache || !element || !style) return;
  styleCache.set(element, style);
}

export function captureStylesRecursively(
  element: Element,
  depth: number = 0,
  maxDepth?: number,
): void {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
  if (maxDepth !== undefined && depth > maxDepth) return;
  if (!styleCache) return;

  if (!styleCache.has(element)) {
    styleCache.set(element, window.getComputedStyle(element));
  }

  Array.from(element.children).forEach(function (child) {
    captureStylesRecursively(child, depth + 1, maxDepth);
  });
}
