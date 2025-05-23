# ZenReader Specification

## 1. Introduction

ZenReader is a Chrome extension designed to provide a distraction-free reading experience while preserving the original styling of web content. It allows users to focus on specific sections of a webpage by creating an overlay that highlights only the content they want to read.

## 2. Core Functionality

### 2.1 Manual Focus Mode

The primary feature of ZenReader is its manual focus mode, which allows users to select specific content sections for focused reading.

#### Activation Methods

- **Browser Toolbar Icon**: Users can click the ZenReader icon in the Chrome toolbar to activate selection mode.
- **Context Menu**: Users can right-click anywhere on the page and select "Enter Focus Mode" from the context menu to activate selection mode.

#### Selection Mode

- **Visual Feedback**: When in selection mode, elements will be highlighted with a pink dashed border (3px) when hovered over, providing clear visual feedback.
- **Element Selection**: Users can click on any content element to select it for focus mode.
- **Cancellation**: Users can press the ESC key to exit selection mode without activating focus mode.

#### Focus Mode

- **Visual Presentation**: When focus mode is activated, the webpage is dimmed with a dark overlay (75% opacity), and the selected content is displayed in a centered container.
- **Style Preservation**: The extension preserves the original styling of the selected content, including fonts, colors, and layouts.
- **Content Width**: The focused content is displayed at 80% of the viewport width, ensuring a comfortable reading experience.
- **Color Adaptation**: The extension analyzes the selected content's colors and automatically adapts to match the website's theme (light or dark).
- **Special Element Handling**: Special handling for images, tables, code blocks, and other complex elements to ensure proper display.
- **Exit Methods**:
  - ESC key
  - Clicking the exit button in the top-right corner of the focus container
  - Clicking the browser toolbar icon again
  - Clicking outside the focus container on the overlay
  - Right-clicking and selecting "Exit Focus Mode" from the context menu

### 2.2 Extension Interface

- **Icon State**: The extension icon visually indicates whether ZenReader is active or inactive.
- **Context Menu**: The context menu displays "Enter Focus Mode" when inactive and "Exit Focus Mode" when active.
- **Toolbar**: Focus mode includes a toolbar displaying the page title, an About button ("?"), and an exit button.
- **About Page**: Users can access information about the extension through the About page, accessed via the "?" button in the toolbar or by right-clicking the extension icon and selecting "About ZenReader".

## 3. User Experience

### 3.1 Workflow

1. User activates ZenReader through the toolbar icon or context menu
2. User selects the content element they want to focus on
3. The selected content appears in focus mode with the rest of the page dimmed
4. User reads content without distractions
5. User exits focus mode when finished using any of the available exit methods

### 3.2 Visual Design

- **Selection Indicator**: Pink dashed border (3px) with 2px offset
- **Overlay**: Dark background (75% opacity) covering the entire page
- **Focus Container**: Clean, minimal design with subtle shadows and rounded corners
- **Toolbar**: Contains page title, About button ("?"), and Exit button ("X")
- **Exit Button**: Circular button with an "X" in the top-right corner
- **About Button**: Circular button with a "?" for accessing information about the extension
- **Context Menu**: Standard browser context menu with localized text

## 4. Compatibility and Performance

### 4.1 Browser Compatibility

- Designed for the latest stable version of Google Chrome
- Uses Manifest V3 for future compatibility
- Compatible with Chromium-based browsers (Edge, Brave, Vivaldi, etc.)

### 4.2 Performance Considerations

- Minimal resource usage when inactive
- Style caching system for optimized performance
- Fast activation and rendering times
- Smooth scrolling within the focus container
- Efficient handling of page styles
- Shadow DOM for style encapsulation and isolation

## 5. Internationalization

- Support for multiple languages including English, Chinese (Traditional and Simplified), French, German, Spanish, Japanese, Korean, Portuguese, and Arabic
- Localized user interface elements including context menu entries, toolbar items, and the About page
- Right-to-left (RTL) language support for Arabic and other RTL languages

## 6. Future Considerations (Out of Scope for MVP)

- Automatic content detection
- Per-site preferences storage
- Minimum font size settings
- Keyboard shortcut customization
- Additional customization options

## 7. Limitations

- Style preservation works on a "best effort" basis, prioritizing text styles, colors, backgrounds, and spacing
- Some complex interactive elements may have limited functionality in focus mode
- Cross-origin stylesheets may not be fully preserved due to browser security restrictions
