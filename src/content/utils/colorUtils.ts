/**
 * ZenReader - Color Utilities Module
 *
 * Provides utilities for working with colors,
 * including color analysis, brightness adjustment, and theme detection.
 */

import { getStyleFromCache } from '../styles/styleCache';
import { getState } from '../state';

export interface ColorSettings {
  textColor: string;
  bgColor: string;
  isDarkTheme: boolean;
}

export function analyzeDominantColors(): ColorSettings {
  const colorSettings: ColorSettings = {
    textColor: '#000000',
    bgColor: '#ffffff',
    isDarkTheme: false,
  };

  try {
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyBgColor = bodyStyle.backgroundColor;
    const bodyTextColor = bodyStyle.color;

    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
      colorSettings.bgColor = bodyBgColor;
      colorSettings.isDarkTheme = isColorDark(bodyBgColor);
    }

    if (bodyTextColor && bodyTextColor !== 'rgba(0, 0, 0, 0)') {
      colorSettings.textColor = bodyTextColor;
    }

    let element = getState().selectedElement;
    while (element && element !== document.body) {
      const style = getStyleFromCache(element) || window.getComputedStyle(element);
      const bgColor = style.backgroundColor;
      const textColor = style.color;

      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colorSettings.bgColor = bgColor;
        colorSettings.isDarkTheme = isColorDark(bgColor);
        break;
      }

      if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
        colorSettings.textColor = textColor;
      }

      element = element.parentElement;
    }

    if (colorSettings.isDarkTheme && !isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else if (!colorSettings.isDarkTheme && isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else {
      colorSettings.textColor = colorSettings.isDarkTheme ? '#ffffff' : '#000000';
    }
  } catch (e) {
    console.error('Error analyzing colors:', e);
  }

  return colorSettings;
}

export function isColorDark(color: string | null | undefined): boolean {
  let r: number, g: number, b: number;

  if (!color) return false;

  try {
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      const parts = color.match(/\d+/g)?.map(Number);
      if (!parts || parts.length < 3) return false;
      r = parts[0];
      g = parts[1];
      b = parts[2];
    } else {
      return false;
    }

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness < 128;
  } catch (e) {
    console.error('Error determining color brightness:', e);
    return false;
  }
}

export function adjustColorBrightness(color: string | null | undefined, percent: number): string {
  let r: number, g: number, b: number;
  let a = 1;

  if (!color) return 'rgb(255, 255, 255)';

  try {
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      const parts = color.match(/\d+/g)?.map(Number);
      if (!parts || parts.length < 3) return 'rgb(255, 255, 255)';
      r = parts[0];
      g = parts[1];
      b = parts[2];
      if (parts.length > 3) {
        a = parseFloat(String(parts[3]));
      }
    } else {
      return 'rgb(255, 255, 255)';
    }

    r = Math.max(0, Math.min(255, r + Math.floor(r * percent / 100)));
    g = Math.max(0, Math.min(255, g + Math.floor(g * percent / 100)));
    b = Math.max(0, Math.min(255, b + Math.floor(b * percent / 100)));

    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    console.error('Error adjusting color brightness:', e);
    return 'rgb(255, 255, 255)';
  }
}
