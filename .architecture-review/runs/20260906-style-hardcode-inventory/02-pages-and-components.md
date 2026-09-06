# Bin 02：頁面與 Lit 元件

## `index.html`

- `bg-slate-50`、`text-blue-600`、`text-slate-800`、`border-slate-300`、`bg-white` 等仍是 raw Tailwind palette；目前靠 `design-tokens.css` 的 dark override 維持可用。
- `REV-20260906-07`：header icon button 與 action bar button 同時混用 raw palette、layout utility、`.ds-*` semantic class，未來會形成第三套 button 視覺 contract。
- 版面 spacing／responsive utility 不應為了抽象而全部 token 化；優先處理 color、border、shadow、focus、disabled。

## `quiz.html`

- `REV-20260906-07`：返回／設定按鈕、quiz header、keypad、leave modal 文案與部分 input 仍使用 raw slate/blue palette。
- `REV-20260906-08`：completion confetti 的 10 組 hex 顏色是刻意的裝飾 palette，不是業務色，但目前直接寫在頁面 CSS，無法集中調整或替換主題。
- `REV-20260906-09`：keypad box-shadow 使用 raw RGB fallback；應改成專用 semantic token。
- `z-50`、`z-[60]`、`z-80` 與多組 backdrop blur 是跨元件的 layer／effect contract，現階段未集中命名；可列入第二階段，不要和色彩清洗混在同一個 commit。

## `app/quiz-view.js`

- `REV-20260906-07`：動態 quiz card 使用 `bg-blue-100`、`text-blue-700`、`bg-white`、`border-slate-300`、`focus:ring-blue-500`、`ring-blue-300`。
- 這些值應改成 quiz input／question index 的 semantic classes，讓 light/dark 行為由 design tokens 控制，而不是繼續擴充 dark-mode selector override。

## `app/components/multiplication-selector.js`

- `REV-20260906-07`：表格 header、label focus 與 history text 仍直接使用 slate/blue palette；元件已抽出，正適合下一輪改成 `.ds-*` contract。
- `ds-table-header`、`ds-table-cell` 與 `ds-factor-*` 已是可沿用的正確方向。

## `app/components/app-modal.js`、`app/components/completion-overlay.js`、`app/components/app-button.js`

- `app-modal.js` 的 `bg-slate-900/40` 是 scrim raw palette，應改成 `.ds-modal-backdrop` 自己提供背景 token，避免 primitive 帶著 Tailwind 色彩。
- `completion-overlay.js` 的標題／內容仍是 `text-blue-700`、`text-slate-600`；應改成 semantic text classes。
- `app-button.js` 已集中 variant contract，尺寸與 layout utility 屬元件內部合理固定值；後續只需確保 variant 完全由 `.ds-*` 控制，不要再讓呼叫端傳 raw color class。
