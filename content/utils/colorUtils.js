/**
 * ZenReader - Color Utilities Module
 *
 * This script provides utilities for working with colors,
 * including color analysis, brightness adjustment, and theme detection.
 */

/**
 * Analyzes the whole page to determine dominant text and background colors
 * @returns {Object} - Object containing dominant colors
 */
function analyzeDominantColors() {
  // Create default color settings
  const colorSettings = {
    textColor: '#000000',
    bgColor: '#ffffff',
    isDarkTheme: false
  };

  try {
    // Get body computed style
    const bodyStyle = window.getComputedStyle(document.body);

    // Try to determine if the page uses a dark theme
    const bodyBgColor = bodyStyle.backgroundColor;
    const bodyTextColor = bodyStyle.color;

    // If we have valid colors from the body
    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
      colorSettings.bgColor = bodyBgColor;
      colorSettings.isDarkTheme = isColorDark(bodyBgColor);
    }

    if (bodyTextColor && bodyTextColor !== 'rgba(0, 0, 0, 0)') {
      colorSettings.textColor = bodyTextColor;
    }

    // Now check our selected element and its parents
    let element = zenReaderState.selectedElement;
    while (element && element !== document.body) {
      const style = getStyleFromCache(element) || window.getComputedStyle(element);

      const bgColor = style.backgroundColor;
      const textColor = style.color;

      // If element has non-transparent background, use it
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        colorSettings.bgColor = bgColor;
        colorSettings.isDarkTheme = isColorDark(bgColor);
        break; // Found a definitive background color
      }

      // Update text color if it's defined
      if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
        colorSettings.textColor = textColor;
      }

      element = element.parentElement;
    }

    // Sanity check for color contrast
    if (colorSettings.isDarkTheme && !isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else if (!colorSettings.isDarkTheme && isColorDark(colorSettings.textColor)) {
      // Good contrast
    } else {
      // Poor contrast, force better colors
      colorSettings.textColor = colorSettings.isDarkTheme ? '#ffffff' : '#000000';
    }
  } catch (e) {
    console.error('Error analyzing colors:', e);
    // Fallback to defaults if there's an error
  }

  return colorSettings;
}

/**
 * Determines if a color is dark based on its brightness
 * @param {String} color - The color to check (hex, rgb, or rgba)
 * @returns {Boolean} - True if the color is dark
 */
function isColorDark(color) {
  // Parse the color to get RGB values
  let r, g, b;

  if (!color) return false;

  try {
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      // RGB or RGBA color
      const parts = color.match(/\d+/g).map(Number);
      r = parts[0];
      g = parts[1];
      b = parts[2];
    } else {
      // Unknown color format
      return false;
    }

    // Calculate perceived brightness using the formula:
    // (0.299*R + 0.587*G + 0.114*B)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

    // Return true if the color is dark (brightness < 128)
    return brightness < 128;
  } catch (e) {
    console.error('Error determining color brightness:', e);
    return false;
  }
}

/**
 * Adjusts a color's brightness by a percentage
 * @param {String} color - The color to adjust (hex, rgb, or rgba)
 * @param {Number} percent - The percentage to adjust (-100 to 100)
 * @returns {String} - The adjusted color in rgb format
 */
function adjustColorBrightness(color, percent) {
  let r, g, b, a = 1;

  if (!color) return 'rgb(255, 255, 255)';

  try {
    if (color.startsWith('#')) {
      // Hex color
      const hex = color.substring(1);
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      // RGB or RGBA color
      const parts = color.match(/\d+/g).map(Number);
      r = parts[0];
      g = parts[1];
      b = parts[2];
      if (parts.length > 3) {
        a = parseFloat(parts[3]);
      }
    } else {
      // Default to white
      return 'rgb(255, 255, 255)';
    }

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + Math.floor(r * percent / 100)));
    g = Math.max(0, Math.min(255, g + Math.floor(g * percent / 100)));
    b = Math.max(0, Math.min(255, b + Math.floor(b * percent / 100)));

    // Return adjusted color
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    console.error('Error adjusting color brightness:', e);
    return 'rgb(255, 255, 255)';
  }
}
