import { describe, it, expect } from 'vitest';
import { extractFontFaceRules } from '../../../src/content/styles/shadowDomStyles';

describe('extractFontFaceRules', () => {
  it('returns empty array for empty string', () => {
    expect(extractFontFaceRules('')).toEqual([]);
  });

  it('returns empty array for CSS with no @font-face', () => {
    expect(extractFontFaceRules('body { color: red; }')).toEqual([]);
  });

  it('extracts a single @font-face rule', () => {
    const css = `
      body { color: red; }
      @font-face { font-family: "MyFont"; src: url("font.woff2"); }
      p { margin: 0; }
    `;
    const result = extractFontFaceRules(css);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@font-face');
    expect(result[0]).toContain('MyFont');
  });

  it('extracts multiple @font-face rules', () => {
    const css = `
      @font-face { font-family: "Font1"; src: url("f1.woff2"); }
      body { color: red; }
      @font-face { font-family: "Font2"; src: url("f2.woff2"); }
    `;
    const result = extractFontFaceRules(css);
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('Font1');
    expect(result[1]).toContain('Font2');
  });

  it('is case-insensitive', () => {
    const css = '@FONT-FACE { font-family: "Test"; src: url("t.woff"); }';
    const result = extractFontFaceRules(css);
    expect(result).toHaveLength(1);
  });

  it('handles @font-face with extra whitespace', () => {
    const css = '@font-face   {  font-family: "Spaced";  src: url("s.woff");  }';
    const result = extractFontFaceRules(css);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Spaced');
  });
});
