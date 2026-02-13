# AGENTS.md - ZenReader

## Project Overview

ZenReader is a Chrome extension (Manifest V3) that provides distraction-free reading by letting users select webpage elements and displaying them in a focused overlay with preserved original styling. It uses Shadow DOM for style encapsulation.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Platform**: Chrome Extension (Manifest V3)
- **Build system**: Vite with `vite-plugin-web-extension`
- **Module system**: ES Modules, bundled into IIFE for content script injection
- **Test framework**: Vitest with `happy-dom` environment
- **CSS**: Plain CSS with `!important` declarations for host-page override protection
- **Type definitions**: `@types/chrome` for Chrome extension APIs

## Build / Test Commands

```bash
# Install dependencies
npm install

# Type-check and build for production (output in dist/)
npm run build

# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Start Vite dev server
npm run dev

# Package for Chrome Web Store submission
chmod +x build.sh
./build.sh
# Produces: ZenReader_v{version}_{date}.zip
```

`npm run build` runs `tsc --noEmit` (type check only) followed by `vite build` (compile + bundle).

`build.sh` wraps the full pipeline: dependency install → type check → Vite build → clean dist → create versioned zip.

### Manual Testing

1. Run `npm run build` to generate the `dist/` directory
2. Go to `chrome://extensions/` and enable Developer mode
3. Click "Load unpacked" and select the `dist/` directory
4. Navigate to any webpage and click the extension icon

## Architecture

### Module Graph

Content scripts use ES Modules (`import`/`export`). Vite bundles them into a single IIFE for injection.

```
src/content/index.ts          ← Entry point (imports all modules)
├── state.ts                  ← ZenReaderState interface, getState(), updateBackgroundState()
├── selectionMode.ts          ← Hover/click element selection
│   ├── state.ts
│   └── focusMode.ts
├── focusMode.ts              ← Overlay + Shadow DOM focus view
│   ├── state.ts
│   ├── styles/styleCache.ts
│   ├── styles/elementCloner.ts
│   ├── styles/shadowDomStyles.ts
│   ├── styles/layoutFixer.ts
│   ├── utils/colorUtils.ts
│   └── utils/domUtils.ts
└── utils/messageHandler.ts   ← Chrome message listener
    ├── state.ts
    ├── selectionMode.ts
    └── focusMode.ts
```

### Script Roles

| Script | Role |
|--------|------|
| `src/content/index.ts` | Entry point: re-injection guard, init style cache, init message handler, keydown listener |
| `src/content/state.ts` | Singleton state module: `ZenReaderState` interface, `getState()`, `resetFocusState()`, `updateBackgroundState()` with retry |
| `src/content/selectionMode.ts` | Hover highlight, click-to-select, guards for `<html>`/`<body>` |
| `src/content/focusMode.ts` | Creates overlay + focus container, deep clones selected element into Shadow DOM, exits on Escape/click-outside/button |
| `src/content/styles/styleCache.ts` | `Map`-based computed style cache, `captureStylesRecursively()` |
| `src/content/styles/elementCloner.ts` | Deep clone with inline styles, adaptive depth based on tree size |
| `src/content/styles/shadowDomStyles.ts` | Two-phase Shadow DOM CSS: sync (same-origin sheets, custom properties) + async (cross-origin fetch via background, @font-face recovery) |
| `src/content/styles/layoutFixer.ts` | Materializes `::before`/`::after` pseudo-elements into real DOM nodes |
| `src/content/utils/colorUtils.ts` | `analyzeDominantColors()` — detects light/dark theme from element styles |
| `src/content/utils/domUtils.ts` | `estimateTreeSize()`, `modifyLinks()`, `resolveLazyImages()` |
| `src/content/utils/messageHandler.ts` | Listens for `"activate"` messages from background |
| `src/background/index.ts` | Service worker: toolbar icon toggle, context menus, on-demand content script injection via `chrome.scripting`, tab state tracking, cross-origin CSS proxy fetch, about page navigation |
| `src/about/about.ts` | About page: i18n string injection, version display |

### State Management

State is a private singleton in `state.ts`. All modules access it via `getState()`:

```typescript
import { getState } from './state';

const state = getState();
if (state.isFocusMode) return;
```

The `ZenReaderState` interface defines all state properties:

```typescript
interface ZenReaderState {
  isSelectionMode: boolean;
  isFocusMode: boolean;
  selectedElement: HTMLElement | null;
  overlayElement: HTMLElement | null;
  focusContainer: HTMLElement | null;
  exitButton: HTMLElement | null;
  aboutButton: HTMLElement | null;
  shadowRoot: ShadowRoot | null;
  maxDepth: number | null;
  fetchedCSSTexts: string[] | null;
  currentStateActive: boolean;
}
```

State is mutated directly on the object returned by `getState()`, then `updateBackgroundState()` syncs with the background service worker via `chrome.runtime.sendMessage`.

### Communication Flow

```
background/index.ts  <-- chrome.runtime.sendMessage -->  content scripts
  (service worker)                                         (messageHandler.ts, state.ts)
```

Messages use `{ action: string, ... }` format. Actions:
- `"activate"` — background → content: enter selection mode
- `"stateChanged"` — content → background: sync focus mode state
- `"openAboutPage"` — content → background: open about page tab
- `"fetchCSS"` — content → background: proxy cross-origin stylesheet fetch (returns asynchronously via `sendResponse`)

### Content Script Injection

Content scripts are NOT declared in `manifest.json` `content_scripts`. Instead, the background service worker injects them on demand via `chrome.scripting.executeScript()` and `chrome.scripting.insertCSS()` when the user clicks the toolbar icon or context menu.

A re-injection guard in `src/content/index.ts` prevents double initialization:

```typescript
if (!window.__zenReaderInjected) {
  window.__zenReaderInjected = true;
  // ... init
}
```

The `__zenReaderInjected` property is declared in `src/global.d.ts`.

### Build Output

Vite builds to `dist/`. The `vite-plugin-web-extension` plugin:
1. Processes `src/manifest.json` as the extension manifest entry point
2. Bundles `src/background/index.ts` as the service worker
3. Bundles `src/content/index.ts` as an IIFE content script (listed under `additionalInputs`)
4. Copies `src/content/content.css` (listed under `additionalInputs`)
5. Processes `src/about/about.html` and its referenced assets (listed under `additionalInputs`)
6. Copies everything in `public/` (`_locales/`, `icons/`) to `dist/` root

## Code Style Guidelines

### File Structure

Every TypeScript file starts with a JSDoc block describing the module:

```typescript
/**
 * ZenReader - Module Name
 *
 * Description of what this script handles.
 */
```

### Functions

- Top-level functions use `function` declarations (not arrow functions, not `const`)
- Exported functions have explicit return types
- Every function has a JSDoc comment with `@param` and `@returns` tags when non-trivial:

```typescript
/**
 * Description of what the function does
 * @param element - The element to process
 * @param isMainContent - Whether this is main content
 * @returns The processed element
 */
function processElement(element: HTMLElement, isMainContent: boolean): HTMLElement {
```

### Naming Conventions

- **Functions**: `camelCase` verb phrases (`enterFocusMode`, `handleMouseOver`, `updateBackgroundState`)
- **Interfaces**: `PascalCase` nouns (`ZenReaderState`, `ColorSettings`)
- **Constants**: `UPPER_SNAKE_CASE` (`IMPORTANT_STYLE_PROPERTIES`, `MAX_DEPTH`)
- **Local variables**: `camelCase` (`colorSettings`, `contentWrapper`, `retryCount`)
- **CSS classes**: `zenreader-` prefix, kebab-case (`zenreader-focus-container`, `zenreader-overlay`)
- **Chrome message actions**: quoted camelCase strings (`"stateChanged"`, `"activate"`)
- **Context menu IDs**: `zenreader-` prefix, kebab-case (`"zenreader-toggle"`, `"zenreader-about"`)

### Error Handling

- Wrap Chrome API calls in try/catch with `chrome.runtime.lastError` checks in callbacks:

```typescript
try {
  chrome.contextMenus.update(id, { title }, function () {
    if (chrome.runtime.lastError) {
      console.log('Could not update:', chrome.runtime.lastError.message);
    }
  });
} catch (e) {
  console.log('Error updating:', (e as Error).message);
}
```

- Use `console.log()` for expected/handled errors, `console.error()` for unexpected errors
- Use `console.debug()` for low-level diagnostics (e.g., stylesheet access failures)
- Cast caught errors with `(e as Error).message`
- Never throw errors that would break the extension; always fail gracefully

### CSS Conventions

- All extension-injected styles use `!important` to override host page styles
- Use max z-index values: `2147483647` (focus container), `2147483646` (overlay)
- Support `prefers-color-scheme: dark` media queries
- Support RTL via `html[dir="rtl"]` selectors
- All selectors scoped with `.zenreader-` prefix to avoid host page conflicts

### i18n

- User-visible strings come from `chrome.i18n.getMessage("key")`
- Locale files in `public/_locales/{locale}/messages.json` (copied to `dist/_locales/` at build)
- Supported locales: en, zh_TW, zh_CN, fr, de, es, ja, ko, pt_BR, ar
- Manifest uses `__MSG_key__` syntax for name/description

### Patterns to Follow

- **State access**: Always use `getState()` to access state — never import the state object directly
- **Guard clauses**: All mode entry/exit functions start with state guard (`if (state.isFocusMode) return;`)
- **DOM cleanup**: Always null-check parent before `removeChild`; call `resetFocusState()` on exit to set all DOM refs to `null`
- **Event listeners**: Add on mode enter, remove on mode exit; use `{ capture: true }` for click interception
- **Retry logic**: `updateBackgroundState()` uses retry with exponential backoff (100ms × retryCount, max 3 retries)
- **Re-injection guard**: `window.__zenReaderInjected` flag prevents double initialization (declared in `global.d.ts`)
- **Callback style in Chrome APIs**: Use `function` keyword (not arrow functions) for Chrome API callbacks to match existing patterns

### Things to Avoid

- Do NOT use `as any` or `@ts-ignore` or `@ts-expect-error` — fix the type properly
- Do NOT add inline event handlers in HTML
- Do NOT use `querySelector` without considering Shadow DOM boundaries
- Do NOT declare content scripts in `manifest.json` `content_scripts` — injection is on-demand via background
- Do NOT use arrow functions for top-level function declarations
- Do NOT add dependencies without evaluating if vanilla TypeScript can solve the problem

## Testing

### Structure

Tests mirror the source tree under `test/`:

```
test/
└── content/
    ├── styles/
    │   ├── layoutFixer.test.ts
    │   └── shadowDomStyles.test.ts
    └── utils/
        ├── colorUtils.test.ts
        └── domUtils.test.ts
```

### Conventions

- Test runner: Vitest with `globals: true` (no explicit imports of `describe`, `it`, `expect`)
- DOM environment: `happy-dom`
- Test only pure/semi-pure functions that don't depend on Chrome APIs
- No E2E or integration tests — manual browser testing for UI behavior
