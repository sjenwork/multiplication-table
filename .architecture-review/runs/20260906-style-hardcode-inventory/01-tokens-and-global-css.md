# Bin 01：Tokens、全域 CSS 與主題入口

## `design-tokens.css`

- 已檢視，這裡應繼續作為唯一的色彩／surface／status／focus／shadow token source。
- `REV-20260906-06`：`--ds-*` token 已相當完整，但 theme-color 的同一組 canvas 值仍散落在 `theme-init.js`、`app/settings.js`、兩頁 meta 與 manifest。
- `REV-20260906-09`：keypad shadow 仍在 `quiz.html:55` 使用 `rgb(15 23 42 / 0.14)` fallback，且 modal／focus 等 token 仍在部分元件旁直接補 raw 色值。
- 不建議把 token 本身視為問題；token 檔案中的 raw 顏色是集中管理的設計來源。

## `pwa.css`

- 已檢視，safe-area 與 layout 屬於合理的 CSS 固定值。
- `REV-20260906-06`：`var(--ds-canvas, #f4fbff)`、`var(--ds-surface-strong, rgb(...))`、`var(--ds-surface, rgb(...))` 重複了 token fallback；若 token CSS 必定載入，fallback 只會增加第二個真相來源。

## `theme-init.js`、`app/settings.js`

- 已檢視，兩者都正確負責在主題變更時同步 meta theme-color。
- `REV-20260906-06`：`#091a30` 與 `#f4fbff` 在兩個 JS 檔案各自重複，之後調整 canvas 顏色容易漏改。
- 建議下一輪抽出極小的 `theme-colors.js` 常數契約；不要讓 JS 直接讀 CSS computed style，避免初始化時序與透明色造成不穩定。
