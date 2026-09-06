# Static UI Style Consistency Audit

## 1. 狀態／範圍／方法

- 分支：`dev`
- 依據：`README.md`、`docs/multiplication-practice-spec.md`
- 範圍：`design-tokens.css`、`pwa.css`、`index.html`、`quiz.html`、`app.js`、`theme-init.js`
- 方法：逐檔比對 semantic token 定義與使用位置、跨頁重複 markup/class、dark mode override、raw color 與 surface/action pattern。
- 本輪只盤點，不修改產品程式碼。

## 2. 總體評估

目前已建立可用的視覺基礎：兩頁共用 `design-tokens.css`，modal scrim/surface 已統一，canvas、surface、brand、status、border、shadow 與 theme tokens 也已有集中定義。

主要剩餘問題是 token 與頁面 markup 並存兩套做法：部分控制項使用 `.ds-*` semantic class，另一部分仍直接使用 Tailwind palette 或 inline RGB。這在 light mode 不一定明顯，但會讓 dark mode、hover/disabled 狀態與跨頁視覺逐步分叉。

## 3. 高優先發現

### REV-20260906-01：dark mode 對 raw status colors 覆蓋不完整

- 現況：`design-tokens.css` 只覆蓋部分 `.bg-white`、`.bg-slate-*`、`.border-slate-*`、`.bg-blue-50` 與 `.text-blue-*`；但測驗頁的 keypad、完成後操作列與離開 modal action controls 仍直接使用 `bg-amber-50`、`bg-emerald-50`、`bg-red-50`、`border-*-200`、`text-emerald-700` 等 raw palette。
- 佐證：`quiz.html:391-410`、`quiz.html:417-424`、`index.html:84-89`、`design-tokens.css:221-250`。
- 風險：dark mode 下同一種 semantic state 會混用深色 token 與偏亮的 light palette；文字與背景的對比及視覺層級可能不一致。
- 建議：優先把這些 controls 改成 `.ds-primary`、`.ds-secondary`、`.ds-danger` 或新增明確的 keypad/status semantic classes；不要繼續擴大 selector-by-selector 的 dark override。

### REV-20260906-02：跨頁 action bar 與主要 action 沒有共用 semantic styles

- 現況：首頁 action bar 使用 `ds-surface-strong`，按鈕使用 `ds-primary`／`ds-accent`；測驗頁 action bar 額外使用 `shadow-lg backdrop-blur-md`，主要「對答案」與「返回選題」仍使用 raw `bg-blue-600`，完成操作列使用 raw slate/blue/emerald palette。
- 佐證：`index.html:58-69`、`quiz.html:406-414`、`quiz.html:408-410`、`quiz.html:422-423`。
- 風險：同為主要操作的按鈕在兩頁的背景、陰影、hover、disabled 與 dark mode 行為不由同一個 contract 控制。
- 建議：先定義 action hierarchy（primary、secondary、accent、danger），再讓兩頁只組合 semantic class + layout utilities；同時移除測驗頁 action bar 額外重複的 shadow/backdrop utility，除非有明確的浮層需求。

## 4. 中優先發現

### REV-20260906-03：測驗頁 inline visual CSS 分散了 design system 邊界

- 現況：`quiz.html:19-340` 直接定義 header、keypad、dock、completion card、confetti 與多組 raw RGB/hex 顏色；其中部分已使用 token，部分仍是頁面專屬 raw color。
- 佐證：`quiz.html:81-115`、`quiz.html:135-152`、`quiz.html:299-308`；共用 token 定義在 `design-tokens.css:1-84`。
- 風險：未來調整 brand、focus、surface 或 status color 時，容易只改到一側；頁面 CSS 也難以檢查是否符合 token 規範。
- 建議：下一輪先把可共用的 focus、drag/dock、keypad-close、completion status 色彩抽成 token/class；不要一次性重構全部 inline CSS。

### REV-20260906-04：settings modal markup 在兩個頁面重複

- 現況：`index.html:73-92` 與 `quiz.html:428-447` 幾乎完整複製 settings modal markup。
- 風險：新增一個 modal control、修正文字色或 dark mode class 時，容易只改到一頁。
- 建議：若維持純靜態頁面，至少建立一致性檢查；若未來已有模板／build step，再考慮抽成 partial。當前不建議為此引入新框架。

## 5. 值得沿用的架構強項

- `design-tokens.css` 已集中管理 light/dark token，且 `theme-init.js` 在初始繪製前設定 `data-theme`，降低主題閃爍。
- modal scrim/surface 已在 `474cf2b` 統一，兩頁共用相同的 modal contract。
- table 與 quiz card 已使用 `ds-table-*`、`ds-success-soft`、`ds-danger-soft` 等語意 class，而不是完全依賴 raw palette。
- `README.md` 已明確規定新元件優先使用 `--ds-*` token 或 `.ds-*` 語意 class，方向清楚。

## 6. 建議新增的追蹤項目

- 建立一個靜態 style contract check，至少檢查所有 modal、主要 action button 與 theme-sensitive control 是否使用 semantic class。
- 將 `ds-secondary` 與 `ds-danger` 的使用場景補進頁面，避免 token 定義存在但實際 markup 仍繞過它。

## 7. 下一輪排程備註

下一輪建議以 dev 的 light/dark runtime smoke check 為第一個驗證 slice，確認 semantic colors、action hierarchy 與動態注入的 settings modal 在實際瀏覽器中一致。

## 8. 本輪修復結果

本輪已依序修復 `REV-20260906-01` 至 `REV-20260906-04`，對應 commits 為 `cb4a82b`、`3813ed4`、`adf2b7c`、`56f1f01`。部署前仍需做 dev 的 light/dark runtime smoke check。
