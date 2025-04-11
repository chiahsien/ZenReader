
**產品需求文件 (PRD) - [ZenReader] - MVP v1.0**

1.  **前言 (Introduction)**
    * 1.1. 文件目的 (Purpose)
    * 1.2. 產品願景與目標 (Vision & Goals) - *簡述解決干擾、保留風格的核心價值*
    * 1.3. 範圍 (Scope) - *明確說明此文件定義 MVP，僅包含手動專注模式*

2.  **目標與指標 (Goals & Metrics)**
    * 2.1. 產品目標 (Product Goals) - *例如：提供無干擾、風格保留的閱讀體驗*
    * 2.2. 使用者目標 (User Goals) - *例如：輕鬆選定網頁內文、沉浸閱讀*
    * 2.3. 成功指標 (Success Metrics) - *主要：Chrome Web Store 評分 > 4.5/5*

3.  **目標受眾 (Target Audience)**
    * 3.1. 主要用戶畫像 (Primary Persona) - *所有希望提升網頁閱讀專注度的使用者*

4.  **功能需求 (Functional Requirements) - MVP v1.0**
    * 4.1. **核心：手動專注模式 (Manual Focus Mode)**
        * FR1: 透過工具欄圖示啟動 (Activation via Toolbar Icon)
        * FR2: 透過右鍵選單啟動 (Activation via Context Menu - "專注在此區域" / "Focus on this section")
        * FR3: 進入手動選擇模式 (Entering Manual Selection Mode)
        * FR4: 選擇模式視覺回饋 (Selection Mode Visual Feedback - 桃紅色粗虛線框線 on hover)
        * FR5: 選擇內文元素 (Selecting Content Element - Click)
        * FR6: 取消選擇模式 (Cancelling Selection Mode - ESC key)
        * FR7: 進入專注模式視覺呈現 (Entering Focus Mode Visuals - Overlay + Cloned Content)
        * FR8: 專注模式樣式保留 (Focus Mode Style Preservation - Best effort, core styles prioritized)
        * FR9: 專注模式內容寬度 (Focus Mode Content Width - 80% viewport, max 1000px)
        * FR10: 退出專注模式 (Exiting Focus Mode - ESC, Icon Click, Corner Button)
        * FR11: 角落退出按鈕 (Corner Exit Button - Top-right, 'X' style)
    * 4.2. **擴充功能介面 (Extension Interface)**
        * FR12: 圖示狀態變化 (Icon State Change - Inactive vs. Active)

5.  **非功能需求 (Non-Functional Requirements) - MVP v1.0**
    * 5.1. 易用性 (Usability) - *直觀、易上手*
    * 5.2. 效能 (Performance) - *啟動/渲染快速，低閒置資源佔用*
    * 5.3. 相容性 (Compatibility) - *最新穩定版 Google Chrome*
    * 5.4. 樣式保真度 (Style Fidelity) - *明確 "Best Effort" 範圍 (文字/顏色/背景/間距優先)*

6.  **使用者體驗與介面設計 (UX/UI Considerations)**
    * 6.1. 主要流程 (Key Flow Summary)
    * 6.2. 設計細節 (Specific UI elements - border color, exit button)

7.  **未來版本 / 暫不包含 (Future Considerations / Out of Scope for MVP)**
    * 7.1. 自動內文偵測
    * 7.2. 記憶網站選擇
    * 7.3. 最小字體設定
    * 7.4. 主題化/自訂選項
    * 7.5. 增強互動元素支援

8.  **待解決問題 (Open Issues) - (目前應無)**
