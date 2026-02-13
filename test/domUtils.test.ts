import { describe, it, expect } from 'vitest';
import { resolveLazyImages, estimateTreeSize } from '../src/content/utils/domUtils';

describe('resolveLazyImages', () => {
  it('sets src from data-src', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-src', 'https://example.com/photo.jpg');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });

  it('sets src from data-lazy-src', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-lazy-src', 'https://example.com/lazy.jpg');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('src')).toBe('https://example.com/lazy.jpg');
  });

  it('sets src from data-original', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-original', 'https://example.com/original.jpg');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('src')).toBe('https://example.com/original.jpg');
  });

  it('sets srcset from data-srcset', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-srcset', 'img-1x.jpg 1x, img-2x.jpg 2x');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('srcset')).toBe('img-1x.jpg 1x, img-2x.jpg 2x');
  });

  it('sets sizes from data-sizes', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('data-sizes', '(max-width: 600px) 100vw');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('sizes')).toBe('(max-width: 600px) 100vw');
  });

  it('replaces placeholder data:image src with data-src', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    img.setAttribute('data-src', 'https://example.com/real.jpg');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.getAttribute('src')).toBe('https://example.com/real.jpg');
  });

  it('removes loading="lazy" attribute', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('loading', 'lazy');
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.hasAttribute('loading')).toBe(false);
  });

  it('strips lazy CSS classes', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.className = 'photo lazy lazyload';
    container.appendChild(img);

    resolveLazyImages(container);

    expect(img.className).not.toContain('lazy');
    expect(img.className).not.toContain('lazyload');
    expect(img.className).toContain('photo');
  });

  it('resolves picture source data-srcset', () => {
    const container = document.createElement('div');
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute('data-srcset', 'image.webp');
    picture.appendChild(source);
    container.appendChild(picture);

    resolveLazyImages(container);

    expect(source.getAttribute('srcset')).toBe('image.webp');
  });

  it('extracts src from noscript fallback for preceding img', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    img.setAttribute('src', 'placeholder.gif');
    container.appendChild(img);

    const noscript = document.createElement('noscript');
    noscript.textContent = '<img src="https://example.com/real.jpg" alt="photo">';
    container.appendChild(noscript);

    resolveLazyImages(container);

    expect(img.getAttribute('src')).toBe('https://example.com/real.jpg');
  });

  it('does nothing for null input', () => {
    expect(() => resolveLazyImages(null as unknown as HTMLElement)).not.toThrow();
  });
});

describe('estimateTreeSize', () => {
  it('returns 0 for element with no children', () => {
    const div = document.createElement('div');
    expect(estimateTreeSize(div)).toBe(0);
  });

  it('counts direct children', () => {
    const div = document.createElement('div');
    div.appendChild(document.createElement('p'));
    div.appendChild(document.createElement('p'));
    div.appendChild(document.createElement('p'));

    expect(estimateTreeSize(div)).toBe(3);
  });

  it('counts nested elements', () => {
    const div = document.createElement('div');
    const child = document.createElement('div');
    child.appendChild(document.createElement('span'));
    child.appendChild(document.createElement('span'));
    div.appendChild(child);

    // child + 2 spans = 3
    expect(estimateTreeSize(div)).toBe(3);
  });

  it('caps at provided limit', () => {
    const div = document.createElement('div');
    for (let i = 0; i < 10; i++) {
      div.appendChild(document.createElement('p'));
    }

    expect(estimateTreeSize(div, 5)).toBe(5);
  });

  it('returns 0 for null input', () => {
    expect(estimateTreeSize(null as unknown as Element)).toBe(0);
  });
});
