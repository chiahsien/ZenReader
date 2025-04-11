# ZenReader Chrome Extension Development Guide

## Setup Phase

- [x] Create project folder structure
  - [x] Create a new folder named `ZenReader`
  - [x] Initialize Git repository: `git init`
  - [x] Add `.gitignore` file (as provided earlier)
- [x] Create `manifest.json` (Extension configuration file)
  - [x] Define basic information (name, version, description)
  - [x] Define permissions needed (tabs, activeTab)
  - [x] Configure icon paths
  - [x] Set up content scripts and background scripts
- [x] Set up internationalization (i18n)
  - [x] Create `_locales` folder structure
  - [x] Add support for English and Traditional Chinese

## Implementation Phase

- [x] Create core assets
  - [x] Design and create extension icon in multiple sizes (16x16, 48x48, 128x128)
  - [x] Create CSS for styling the focus mode
- [x] Implement core extension functionality
  - [x] Create background script for extension management
  - [x] Implement content script for webpage interaction
  - [x] Build manual selection mode logic
    - [x] Toolbar icon activation (FR1)
    - [x] Context menu activation (FR2)
    - [x] Selection mode visual feedback (FR4)
    - [x] Element selection handler (FR5)
    - [x] ESC key for cancelling selection (FR6)
- [x] Implement focus mode
  - [x] Create overlay mechanism
  - [x] Clone and display selected content
  - [x] Style preservation logic (FR8)
  - [x] Content width management (FR9)
  - [x] Exit mechanisms (FR10)
  - [x] Corner exit button implementation (FR11)
- [x] Implement extension interface
  - [x] Icon state changes (FR12)

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

## Next Steps

- [ ] Consider future features (as listed in PRD section 7)
  - [ ] 自動內文偵測
  - [ ] 記憶網站選擇
  - [ ] 最小字體設定
  - [ ] 主題化/自訂選項
  - [ ] 增強互動元素支援
