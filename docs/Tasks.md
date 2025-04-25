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
- [X] Set up internationalization (i18n)
  - [X] Create `_locales` folder structure
  - [X] Add support for English and Traditional Chinese

## Implementation Phase

- [X] Create core assets
  - [X] Design and create extension icon in multiple sizes (16x16, 48x48, 128x128)
  - [X] Create CSS for styling the focus mode
- [X] Implement core extension functionality
  - [X] Create background script for extension management
  - [X] Implement content script for webpage interaction
  - [X] Build manual selection mode logic
    - [X] Toolbar icon activation (FR1)
    - [X] Context menu activation (FR2)
    - [X] Selection mode visual feedback (FR4)
    - [X] Element selection handler (FR5)
    - [X] ESC key for cancelling selection (FR6)
- [X] Implement focus mode
  - [X] Create overlay mechanism
  - [X] Clone and display selected content
  - [X] Style preservation logic (FR8)
  - [X] Content width management (FR9)
  - [X] Exit mechanisms (FR10)
  - [X] Corner exit button implementation (FR11)
- [X] Implement extension interface
  - [X] Icon state changes (FR12)

## Testing Phase

- [X] Manual testing on various websites
- [X] Bug fixing and refinement
  - [X] Fix any style preservation issues
  - [X] Ensure proper focus mode behavior
  - [X] Test exit mechanisms

## Packaging and Publication

- [ ] Prepare for Chrome Web Store
  - [ ] Create promotional images
  - [ ] Write detailed description
  - [ ] Prepare privacy policy
- [ ] Build and package extension
  - [X] Create production-ready zip file
- [ ] Submit to Chrome Web Store
  - [ ] Upload package
  - [ ] Fill in store listing details
  - [ ] Submit for review

## Next Steps

- [ ] Consider future features (as listed in PRD section 7)
  - [ ] 自動內文偵測
  - [ ] 記憶網站選擇
  - [ ] 最小字體設定
  - [ ] 主題化/自訂選項
  - [ ] 增強互動元素支援
