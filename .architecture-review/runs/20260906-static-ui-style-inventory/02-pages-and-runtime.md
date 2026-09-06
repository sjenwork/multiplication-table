# Bin 02：Pages and runtime 逐檔盤點

## `index.html`

- 已檢視，設定 modal 與首頁 action buttons 已使用 semantic classes，無 modal scrim 問題。
- `REV-20260906-02`：settings modal 內的 export/clear controls 仍使用 raw blue/red palette（佐證：`index.html:84-89`）。
- `REV-20260906-04`：settings modal markup 與 `quiz.html:428-447` 重複。

## `quiz.html`

- 已檢視，modal scrim/surface 已與首頁統一，quiz-specific surface 也多數使用 token。
- `REV-20260906-01`：keypad、completion action bar、leave modal controls 仍大量使用 raw status palette（佐證：`quiz.html:391-424`）。
- `REV-20260906-02`：主要 action 與 action bar 未完全共用 semantic styles（佐證：`quiz.html:406-414`）。
- `REV-20260906-03`：頁面 inline CSS 同時包含 token 與 raw RGB/hex，視覺規則分散（佐證：`quiz.html:19-340`）。

## `app.js`

- 已檢視，動態產生 table cell、quiz card 與 quiz message 時直接組合 raw Tailwind color classes（佐證：`app.js:248-341`、`566-568`）。
- `REV-20260906-01`：這些 classes 依賴全域 dark override，沒有與 `.ds-*` semantic styles 對齊；新增狀態時容易再次分叉。
- `REV-20260906-04`：設定 modal 行為集中在 `initSettings`，但 markup 分散在兩個 HTML 頁面，缺少單一 markup source。
