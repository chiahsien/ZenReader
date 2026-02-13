# ZenReader

![ZenReader Logo](public/icons/icon128.png)

ZenReader is a Chrome extension designed to provide a distraction-free reading experience while preserving the original styling of web content. It allows users to focus on specific sections of a webpage by creating an overlay that highlights only the content they want to read.

![screenshot](docs/assets/screenshots/1.png)

<a href="https://www.buymeacoffee.com/chiahsien" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Philosophy

While many Reader Mode extensions and browser features strip away original styling to create a standardized reading experience, ZenReader takes a different approach. 

Most reader modes extract the main content and apply their own CSS styles, which makes reading easier but sacrifices the website's original design and visual identity. ZenReader instead preserves the original styling while removing distractions, giving you the best of both worlds:

**Focus on what matters without losing the website's intended visual experience.**

This allows you to enjoy the content creator's design choices while still eliminating surrounding distractions that compete for your attention.

## Features

- **Multiple Activation Methods**:
  - Click the extension icon in the toolbar
  - Use the context menu (right-click on any webpage)
- **Manual Selection Mode**: Select any element on a webpage to focus on
- **Style Preservation**: Keeps original styling of content including fonts, colors, layouts, and pseudo-elements
- **Cross-Origin CSS Support**: Fetches and applies stylesheets from external CDNs and third-party domains
- **Lazy Image Handling**: Resolves lazy-loaded images so they display correctly in focus mode
- **Responsive Design**: Adjusts to different screen sizes and orientations
- **Multilingual Support**: Available in multiple languages
- **Dark Mode Compatible**: Adapts to system dark mode preferences
- **About Page**: Access information about the extension, provide feedback, and support development

## How to Use

1. **Activate ZenReader** by:
   - Clicking the extension icon in your browser toolbar, or
   - Right-clicking anywhere on the page and selecting "Enter Focus Mode"
2. **Select a section** on the webpage you want to focus on (elements will highlight when hovered)
3. **Read content** in distraction-free focus mode
4. **Exit focus mode** by:
   - Pressing the `ESC` key
   - Clicking the exit button in the top-right corner
   - Clicking outside the focus container
   - Clicking the browser toolbar icon again
   - Right-clicking and selecting "Exit Focus Mode"
5. **Access the About page** by:
   - Right-clicking the extension icon and selecting "About ZenReader"
   - Clicking the "?" button in the focus mode toolbar

## Installation

### From Chrome Web Store

<a href="https://chromewebstore.google.com/detail/zenreader/nmcailccifjhlckggldjfdbplcbealjp?ref=github" target="_blank"><img src="docs/assets/chrome_web_store_download_button.png" width="300"></a>

### Manual Installation (Developer Mode)

1. Go to [Releases](https://github.com/chiahsien/ZenReader/releases) page to download latest version's zip file, then decompress it.
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable `Developer mode` by toggling the switch in the top-right corner
4. Click `Load unpacked` and select the decompressed directory
5. The extension should now be installed and visible in your toolbar

## Development

### Project Structure

```
ZenReader/
├── src/                                # Source code
│   ├── manifest.json                   # Extension configuration (Manifest V3)
│   ├── global.d.ts                     # TypeScript global type declarations
│   ├── background/
│   │   └── index.ts                    # Service worker: icon, context menus, on-demand injection
│   ├── content/
│   │   ├── index.ts                    # Content script entry point
│   │   ├── state.ts                    # State management with background sync
│   │   ├── selectionMode.ts            # Element hover/click selection
│   │   ├── focusMode.ts                # Focus overlay with Shadow DOM
│   │   ├── content.css                 # Content script styles
│   │   ├── styles/                     # Style processing modules
│   │   │   ├── styleCache.ts           # Computed style caching
│   │   │   ├── elementCloner.ts        # Deep clone with inline styles
│   │   │   ├── shadowDomStyles.ts      # Shadow DOM CSS injection
│   │   │   └── layoutFixer.ts          # Pseudo-element materialization
│   │   └── utils/                      # Utility modules
│   │       ├── colorUtils.ts           # Color analysis and manipulation
│   │       ├── domUtils.ts             # DOM helpers and lazy image resolution
│   │       └── messageHandler.ts       # Chrome message listener
│   └── about/                          # About page
│       ├── about.html
│       ├── about.ts
│       └── about.css
├── public/                             # Static assets (copied to dist as-is)
│   ├── _locales/                       # i18n message files (10 locales)
│   └── icons/                          # Extension icons
├── test/                               # Unit tests (mirrors src/ structure)
│   └── content/
│       ├── styles/                     # Tests for style modules
│       └── utils/                      # Tests for utility modules
├── docs/                               # Documentation and GitHub assets
│   ├── PrivacyPolicies.md
│   └── assets/                         # Screenshots and store images
├── package.json                        # npm dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
├── vite.config.ts                      # Vite build configuration
├── vitest.config.ts                    # Vitest test configuration
└── build.sh                            # Production packaging script
```

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later) — includes npm

  If you don't have Node.js installed, pick one of the following methods:

  **macOS (Homebrew)**
  ```bash
  brew install node
  ```

  **Windows / macOS / Linux (official installer)**

  Download and run the installer from [https://nodejs.org/](https://nodejs.org/) (LTS version recommended).

  **Verify installation**
  ```bash
  node -v    # should print v18.x.x or later
  npm -v     # should print 9.x.x or later
  ```

### Setup

```bash
# Clone the repository
git clone https://github.com/chiahsien/ZenReader.git
cd ZenReader

# Install dependencies
npm install
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and build for production (output in `dist/`) |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run dev` | Start Vite dev server |

### Loading in Chrome (Development)

1. Run `npm run build` to generate the `dist/` directory
2. Open `chrome://extensions/` and enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory
4. After making code changes, run `npm run build` again and click the reload button on the extension card

### Building for Chrome Web Store

A build script is included to create a production-ready zip package:

```bash
chmod +x build.sh
./build.sh
```

The script will:

1. Run TypeScript type checking (`tsc --noEmit`)
2. Build with Vite (compiles TypeScript, bundles modules, copies static assets to `dist/`)
3. Clean development artifacts from `dist/`
4. Create a versioned zip file (e.g., `ZenReader_v2.0.0_20260213.zip`) ready for submission

## Technical Details

ZenReader is built with **TypeScript** and bundled by **Vite** into a Chrome Manifest V3 extension. It uses Shadow DOM for style encapsulation, ensuring that the original styling of selected content is preserved while preventing style leakage between the webpage and the focus mode interface.

### Architecture

- **On-demand content script injection** — scripts are injected only when the user activates the extension (via `chrome.scripting` API), instead of being loaded on every page
- **ES Modules + Vite bundling** — TypeScript source modules are bundled into a single IIFE for content script injection, with tree-shaking for minimal bundle size
- **Type-safe codebase** — strict TypeScript with interfaces for state management and message passing

### Style Preservation

- **Shadow DOM** for style isolation
- **Two-phase CSS injection** — same-origin styles applied synchronously, cross-origin stylesheets fetched asynchronously via the background service worker
- **CSS custom property propagation** — `:root`/`html`/`body` custom properties (`--var`) are collected and re-injected into the Shadow DOM
- **@font-face recovery** — font declarations from both same-origin and cross-origin stylesheets are injected into the document and Shadow DOM so web fonts render correctly
- **Pseudo-element materialization** — `::before` and `::after` pseudo-elements are converted to real DOM nodes with their computed styles preserved
- **Lazy image resolution** — `data-src`, `data-srcset`, `<noscript>` fallbacks, and placeholder data-URIs are resolved so images display in focus mode
- **Adaptive clone depth** — tree size is estimated at runtime to choose an appropriate cloning depth, balancing fidelity and performance
- **Style caching system** for performance optimization
- **Color analysis** for adapting to page themes (light/dark)
- **Event propagation management** for proper scrolling behavior
- **Computed style preservation** to maintain the look and feel of original content
- **Special element handling** for images, tables, and code blocks
- **Responsive container sizing** using viewport units
- **RTL language support** for multilingual compatibility

## Browser Compatibility

- Google Chrome (latest version)
- Chromium-based browsers (Edge, Brave, Vivaldi, etc.)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Privacy Policies

See the [Privacy Policies](docs/PrivacyPolicies.md) file for details.

## Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## Roadmap

Future enhancements being considered:

- Minimum font size settings
- Keyboard shortcut customization
- Additional customization options
