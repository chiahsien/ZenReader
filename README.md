# ZenReader

![ZenReader Logo](icons/icon128.png)

ZenReader is a Chrome extension designed to provide a distraction-free reading experience while preserving the original styling of web content. It allows users to focus on specific sections of a webpage by creating an overlay that highlights only the content they want to read.

## Features

- **Manual Selection Mode**: Select any element on a webpage to focus on
- **Style Preservation**: Keeps original styling of content including fonts, colors, and layouts
- **Responsive Design**: Adjusts to different screen sizes and orientations
- **Multilingual Support**: Available in multiple languages
- **Dark Mode Compatible**: Adapts to system dark mode preferences

## How to Use

1. **Activate ZenReader** by clicking the extension icon in your browser toolbar
2. **Select a section** on the webpage you want to focus on (elements will highlight when hovered)
3. **Read content** in distraction-free focus mode
4. **Exit focus mode** by:
   - Pressing the ESC key
   - Clicking the exit button in the top-right corner
   - Clicking outside the focus container
   - Clicking the browser toolbar icon again

## Installation

### From Chrome Web Store

*(Coming soon)*

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the ZenReader directory
5. The extension should now be installed and visible in your toolbar

## Technical Details

ZenReader uses Shadow DOM for style encapsulation, ensuring that the original styling of selected content is preserved while preventing style leakage between the webpage and the focus mode interface.

Key technical features:
- **Shadow DOM** for style isolation
- **Event propagation management** for proper scrolling behavior
- **Computed style preservation** to maintain the look and feel of original content
- **Responsive container sizing** using viewport units
- **RTL language support** for multilingual compatibility

## Browser Compatibility

- Google Chrome (latest version)
- Chromium-based browsers (Edge, Brave, etc.)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Feel free to submit issues or pull requests.

## Roadmap

Future enhancements being considered:
- Automatic content detection
- Site preference memory
- Minimum font size settings
- Theming and customization options
- Enhanced interactive element support
