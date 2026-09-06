# config.md

## 核心目標／架構依據文件（依權威順序）

1. `README.md` —— 專案部署流程、分支規則與 Design System 使用原則。
2. `docs/multiplication-practice-spec.md` —— 產品行為與靜態 PWA 的驗收範圍。

## 範圍樹

| 範圍 | 路徑 | 技術棧 | 與其他範圍的關係 |
| --- | --- | --- | --- |
| Style system | `design-tokens.css`, `pwa.css` | CSS custom properties + Tailwind utility classes | 提供兩頁共用的視覺 token 與 PWA layout 基礎 |
| Selection page | `index.html`, `app.js` | Static HTML + vanilla JS | 使用 style system 呈現選題頁與設定 modal |
| Quiz page | `quiz.html`, `app.js` | Static HTML + inline page CSS + vanilla JS | 使用 style system 呈現測驗、鍵盤、完成提示與 modal |

## 本輪範圍

本輪只盤點兩個使用者頁面的樣式一致性、token 使用、dark mode 覆蓋與重複 markup；不改動行為邏輯、不盤點部署基礎設施。
