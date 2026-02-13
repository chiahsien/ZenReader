import { describe, it, expect } from 'vitest';
import { parsePseudoContent } from '../src/content/styles/layoutFixer';

describe('parsePseudoContent', () => {
  it('returns null for "none"', () => {
    expect(parsePseudoContent('none')).toBeNull();
  });

  it('returns null for "normal"', () => {
    expect(parsePseudoContent('normal')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePseudoContent('')).toBeNull();
  });

  it('returns null for empty double quotes', () => {
    expect(parsePseudoContent('""')).toBeNull();
  });

  it('returns null for empty single quotes', () => {
    expect(parsePseudoContent("''")).toBeNull();
  });

  it('returns null for single space content', () => {
    expect(parsePseudoContent('" "')).toBeNull();
  });

  it('parses quoted string content', () => {
    const result = parsePseudoContent('"Hello"');
    expect(result).toEqual({ type: 'text', value: 'Hello' });
  });

  it('parses single-quoted string', () => {
    const result = parsePseudoContent("'Hello'");
    expect(result).toEqual({ type: 'text', value: 'Hello' });
  });

  it('parses url() as image', () => {
    const result = parsePseudoContent('url("https://example.com/icon.png")');
    expect(result).toEqual({ type: 'image', value: 'https://example.com/icon.png' });
  });

  it('parses url() without quotes', () => {
    const result = parsePseudoContent('url(https://example.com/icon.png)');
    expect(result).toEqual({ type: 'image', value: 'https://example.com/icon.png' });
  });

  it('parses counter() as counter', () => {
    const result = parsePseudoContent('counter(section)');
    expect(result).toEqual({ type: 'counter', value: '' });
  });

  it('parses attr() as text with empty value', () => {
    const result = parsePseudoContent('attr(data-label)');
    expect(result).toEqual({ type: 'text', value: '' });
  });

  it('handles CSS escape \\a (newline)', () => {
    const result = parsePseudoContent('"line1\\a line2"');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('text');
    expect(result!.value).toContain('\n');
  });

  it('handles CSS escape \\2022 (bullet)', () => {
    const result = parsePseudoContent('"\\2022 item"');
    expect(result).not.toBeNull();
    expect(result!.value).toContain('\u2022');
  });

  it('handles CSS escape \\00a0 (nbsp)', () => {
    const result = parsePseudoContent('"before\\00a0after"');
    expect(result).not.toBeNull();
    expect(result!.value).toContain('\u00a0');
  });

  it('handles escaped backslash', () => {
    const result = parsePseudoContent('"hello\\\\world"');
    expect(result).not.toBeNull();
    expect(result!.value).toBe('hello\\world');
  });

  it('returns null for unrecognized format', () => {
    expect(parsePseudoContent('something random')).toBeNull();
  });
});
