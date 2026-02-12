# AGENTS.md - ZenReader

## Project Overview

ZenReader is a Chrome extension (Manifest V3) that provides distraction-free reading by letting users select webpage elements and displaying them in a focused overlay with preserved original styling. It uses Shadow DOM for style encapsulation.

## Tech Stack

- **Language**: Vanilla JavaScript (ES5/ES6, no TypeScript, no modules)
- **Platform**: Chrome Extension (Manifest V3)
- **Build system**: None (no bundler, no npm, no package.json)
- **Module system**: Global scope via content script injection order (see `manifest.json` `content_scripts.js` array)
- **CSS**: Plain CSS with `!important` declarations for host-page override protection

## Build / Package / Test Commands

```bash
# Package for Chrome Web Store submission
chmod +x build.sh
./build.sh
# Produces: ZenReader_v{version}_{date}.zip

# Manual testing (no test framework)
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select the project root
# 4. Navigate to any webpage and click the extension icon
```

There is no linter, formatter, type checker, or test runner configured. All testing is manual via the browser.

## Architecture

### Script Loading Order (Critical)

Scripts are loaded as content scripts in this exact order (defined in `manifest.json`). Each script depends on globals from scripts loaded before it:

1. `content/utils/colorUtils.js` - Color analysis (pure utility, no deps)
2. `content/utils/domUtils.js` - DOM manipulation (pure utility, no deps)
3. `content/utils/messageHandler.js` - Chrome message listener (depends on state functions)
4. `content/styles/styleCache.js` - Style caching with `Map` (pure utility)
5. `content/styles/elementCloner.js` - Deep clone with inline styles (depends on styleCache)
6. `content/styles/shadowDomStyles.js` - Two-phase Shadow DOM CSS injection: sync (same-origin sheets, custom properties) + async (cross-origin fetch via background, @font-face recovery)
7. `content/styles/layoutFixer.js` - Pseudo-element materialization (::before/::after)
8. `content/styles/styleManager.js` - Coordinator stub (empty)
9. `content/selectionMode.js` - Hover/click selection (depends on state, focusMode)
10. `content/focusMode.js` - Overlay + Shadow DOM focus view (depends on state, styles, utils)
11. `content/state.js` - Background state sync (depends on `zenReaderState`)
12. `content/index.js` - Entry point, defines `zenReaderState` global, initializes modules

### Other Scripts

- `background.js` - Service worker: toolbar icon, context menus, tab state tracking, cross-origin CSS proxy fetch
- `about/about.js` - About page: i18n, version display

### Key Global Variables

- `zenReaderState` (defined in `content/index.js`) - Central state object shared across all content scripts
- `styleCache` (defined in `content/styles/styleCache.js`) - `Map` instance for computed style caching

### Communication Flow

```
background.js  <--chrome.runtime.sendMessage-->  content scripts
  (service worker)                                 (messageHandler.js, state.js)
```

Messages use `{ action: string, ... }` format. Actions: `"activate"`, `"stateChanged"`, `"openAboutPage"`, `"fetchCSS"`.

## Code Style Guidelines

### File Structure

Every JS file starts with a JSDoc block describing the module:

```javascript
/**
 * ZenReader - Module Name
 *
 * Description of what this script handles.
 */
```

### Functions

- **All functions are declared at the top level** using `function` declarations (not arrow functions, not `const`)
- Every function has a JSDoc comment with `@param` and `@returns` tags:

```javascript
/**
 * Description of what the function does
 * @param {HTMLElement} element - The element to process
 * @param {Boolean} isMainContent - Whether this is main content
 * @returns {HTMLElement} - The processed element
 */
function processElement(element, isMainContent) {
```

- Use `Boolean`, `String`, `Number`, `Object` (capitalized) in JSDoc types
- Parameter descriptions use `{Type} name - Description` format

### Naming Conventions

- **Functions**: `camelCase` verb phrases (`enterFocusMode`, `handleMouseOver`, `updateBackgroundState`)
- **Constants**: `UPPER_SNAKE_CASE` (`IMPORTANT_STYLE_PROPERTIES`, `MAX_DEPTH`)
- **Local variables**: `camelCase` (`colorSettings`, `contentWrapper`, `retryCount`)
- **CSS classes**: `zenreader-` prefix, kebab-case (`zenreader-focus-container`, `zenreader-overlay`)
- **Chrome message actions**: quoted camelCase strings (`"stateChanged"`, `"activate"`)
- **Context menu IDs**: `zenreader-` prefix, kebab-case (`"zenreader-toggle"`, `"zenreader-about"`)

### Error Handling

- Wrap Chrome API calls in try/catch with `chrome.runtime.lastError` checks in callbacks:

```javascript
try {
  chrome.contextMenus.update(id, { title }, () => {
    if (chrome.runtime.lastError) {
      console.log("Could not update:", chrome.runtime.lastError.message);
    }
  });
} catch (e) {
  console.log("Error updating:", e.message);
}
```

- Use `console.log()` for expected/handled errors, `console.error()` for unexpected errors
- Use `console.debug()` for low-level diagnostics (e.g., stylesheet access failures)
- Never throw errors that would break the extension; always fail gracefully

### CSS Conventions

- All extension-injected styles use `!important` to override host page styles
- Use max z-index values: `2147483647` (focus container), `2147483646` (overlay)
- Support `prefers-color-scheme: dark` media queries
- Support RTL via `html[dir="rtl"]` selectors
- All selectors scoped with `.zenreader-` prefix to avoid host page conflicts

### i18n

- User-visible strings come from `chrome.i18n.getMessage("key")`
- Locale files in `_locales/{locale}/messages.json`
- Supported locales: en, zh_TW, zh_CN, fr, de, es, ja, ko, pt_BR, ar
- Manifest uses `__MSG_key__` syntax for name/description

### Patterns to Follow

- **State management**: Mutate `zenReaderState` directly, then call `updateBackgroundState()` to sync with background
- **Guard clauses**: All mode entry/exit functions start with state guard (`if (zenReaderState.isFocusMode) return;`)
- **DOM cleanup**: Always null-check parent before `removeChild`; reset all state refs to `null` on exit
- **Event listeners**: Add on mode enter, remove on mode exit; use `{ capture: true }` for click interception
- **Retry logic**: State sync uses retry with exponential backoff (100ms * retryCount, max 3 retries)

### Things to Avoid

- Do NOT use ES modules (`import`/`export`) - scripts share globals via injection order
- Do NOT add npm dependencies or a build step
- Do NOT use arrow functions for top-level function declarations
- Do NOT use `async/await` in content scripts (used only in `about.js` and `background.js`)
- Do NOT add inline event handlers in HTML
- Do NOT use `querySelector` without considering Shadow DOM boundaries
