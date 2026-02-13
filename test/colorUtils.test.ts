import { describe, it, expect } from 'vitest';
import { isColorDark, adjustColorBrightness } from '../src/content/utils/colorUtils';

describe('isColorDark', () => {
  it('returns true for black hex', () => {
    expect(isColorDark('#000000')).toBe(true);
  });

  it('returns false for white hex', () => {
    expect(isColorDark('#ffffff')).toBe(false);
  });

  it('returns true for dark hex color', () => {
    expect(isColorDark('#1a1a2e')).toBe(true);
  });

  it('returns false for light hex color', () => {
    expect(isColorDark('#f0f0f0')).toBe(false);
  });

  it('returns true for rgb black', () => {
    expect(isColorDark('rgb(0, 0, 0)')).toBe(true);
  });

  it('returns false for rgb white', () => {
    expect(isColorDark('rgb(255, 255, 255)')).toBe(false);
  });

  it('returns true for dark rgba', () => {
    expect(isColorDark('rgba(10, 10, 10, 0.5)')).toBe(true);
  });

  it('returns false for light rgba', () => {
    expect(isColorDark('rgba(200, 200, 200, 1)')).toBe(false);
  });

  it('returns false for bright gray', () => {
    expect(isColorDark('rgb(200, 200, 200)')).toBe(false);
  });

  it('returns true for dark gray', () => {
    expect(isColorDark('rgb(50, 50, 50)')).toBe(true);
  });

  it('returns false for null', () => {
    expect(isColorDark(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isColorDark(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isColorDark('')).toBe(false);
  });

  it('returns false for unsupported color format', () => {
    expect(isColorDark('hsl(0, 0%, 0%)')).toBe(false);
    expect(isColorDark('red')).toBe(false);
  });
});

describe('adjustColorBrightness', () => {
  it('brightens a hex color', () => {
    // r=100, g=100, b=100, +50% → r=150, g=150, b=150
    expect(adjustColorBrightness('#646464', 50)).toBe('rgb(150, 150, 150)');
  });

  it('darkens a hex color', () => {
    // r=200, g=200, b=200, -50% → r=100, g=100, b=100
    expect(adjustColorBrightness('#c8c8c8', -50)).toBe('rgb(100, 100, 100)');
  });

  it('clamps to 255 on overflow', () => {
    expect(adjustColorBrightness('#ffffff', 50)).toBe('rgb(255, 255, 255)');
  });

  it('clamps to 0 on underflow', () => {
    expect(adjustColorBrightness('#000000', -50)).toBe('rgb(0, 0, 0)');
  });

  it('handles rgb input', () => {
    expect(adjustColorBrightness('rgb(100, 100, 100)', 10)).toBe('rgb(110, 110, 110)');
  });

  it('preserves alpha in rgba', () => {
    const result = adjustColorBrightness('rgba(100, 100, 100, 0)', 10);
    expect(result).toContain('rgba');
    expect(result).toContain('0');
  });

  it('returns default for null', () => {
    expect(adjustColorBrightness(null, 10)).toBe('rgb(255, 255, 255)');
  });

  it('returns default for undefined', () => {
    expect(adjustColorBrightness(undefined, 10)).toBe('rgb(255, 255, 255)');
  });

  it('returns default for invalid input', () => {
    expect(adjustColorBrightness('not-a-color', 10)).toBe('rgb(255, 255, 255)');
  });

  it('handles 0% adjustment (no change)', () => {
    expect(adjustColorBrightness('#646464', 0)).toBe('rgb(100, 100, 100)');
  });
});
