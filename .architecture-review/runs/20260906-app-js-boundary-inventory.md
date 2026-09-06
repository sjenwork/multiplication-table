# `app.js` Boundary Inventory

## `app.js`

- 已檢視，961 行、約 40 個主要 function／初始化區塊。
- `REV-20260906-05`：shared state、首頁、quiz、keypad、settings/update、bootstrap 混在單一 IIFE；具體區段與拆分建議見 `20260906-app-js-boundary-AUDIT.md`。
- 優點：目前沒有額外 framework 或跨檔案循環依賴，單檔部署簡單；拆分時應保留這個低依賴特性。
