# ZenReader Chrome Extension Development Guide

## Setup Phase

- [X] Create project folder structure
  - [X] Create a new folder named `ZenReader`
  - [X] Initialize Git repository: `git init`
  - [X] Add `.gitignore` file (as provided earlier)
- [X] Create `manifest.json` (Extension configuration file)
  - [X] Define basic information (name, version, description)
  - [X] Define permissions needed (tabs, activeTab)
  - [X] Configure icon paths
  - [X] Set up content scripts and background scripts

## Implementation Phase

- [ ] Create core assets
  - [ ] Design and create extension icon in multiple sizes (16x16, 48x48, 128x128)
  - [ ] Create popup HTML interface (if needed)
  - [ ] Create CSS for styling the focus mode
- [ ] Implement core extension functionality
  - [ ] Create background script for extension management
  - [ ] Implement content script for webpage interaction
  - [ ] Build manual selection mode logic
    - [ ] Toolbar icon activation (FR1)
    - [ ] Context menu activation (FR2)
    - [ ] Selection mode visual feedback (FR4)
    - [ ] Element selection handler (FR5)
    - [ ] ESC key for cancelling selection (FR6)
- [ ] Implement focus mode
  - [ ] Create overlay mechanism
  - [ ] Clone and display selected content
  - [ ] Style preservation logic (FR8)
  - [ ] Content width management (FR9)
  - [ ] Exit mechanisms (FR10)
  - [ ] Corner exit button implementation (FR11)
- [ ] Implement extension interface
  - [ ] Icon state changes (FR12)
  - [ ] Any popup UI (if needed)

## Testing Phase

- [ ] Manual testing on various websites
  - [ ] News sites
  - [ ] Blog platforms
  - [ ] Documentation sites
  - [ ] E-commerce sites
  - [ ] Social media
- [ ] Bug fixing and refinement
  - [ ] Fix any style preservation issues
  - [ ] Ensure proper focus mode behavior
  - [ ] Test exit mechanisms

## Packaging and Publication

- [ ] Prepare for Chrome Web Store
  - [ ] Create promotional images
  - [ ] Write detailed description
  - [ ] Prepare privacy policy
- [ ] Build and package extension
  - [ ] Create production-ready zip file
- [ ] Submit to Chrome Web Store
  - [ ] Upload package
  - [ ] Fill in store listing details
  - [ ] Submit for review

## Knowledge Resources

### Official Documentation

- [ ] Read through [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [ ] Study [Content Scripts Guide](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [ ] Review [Manifest File Format](https://developer.chrome.com/docs/extensions/mv3/manifest/)

### Tutorials and Examples

- [ ] Follow basic Chrome Extension tutorial
- [ ] Look for similar extensions for inspiration (reader modes, content isolators)

## Development Steps Breakdown

### Step 1: Create Basic Extension Structure

```
ZenReader/
├── manifest.json
├── background.js
├── content.js
├── popup.html (if needed)
├── popup.js (if needed)
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 2: Create Manifest.json

Create a basic manifest file that describes your extension:

```json
{
  "manifest_version": 3,
  "name": "ZenReader",
  "version": "1.0",
  "description": "Focus on what matters - A distraction-free reading experience",
  "permissions": ["activeTab", "contextMenus"],
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "ZenReader"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Step 3: Implement Basic Functionality

Start with creating the necessary JavaScript files and implementing basic functionality before moving to more complex features.

### Step 4: Testing in Chrome

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" (toggle in the top-right corner)
- Click "Load unpacked" and select your extension folder
- Test your extension and make iterative improvements

### Step 5: Refinement and Polish

After basic functionality works, focus on improving the user experience, visual design, and handling edge cases.
