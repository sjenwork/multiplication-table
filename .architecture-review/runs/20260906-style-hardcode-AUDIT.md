# Style Hardcode and Theme Boundary Audit

## 1. 狀態／範圍／方法

- 分支：`refactor/lit-migration`
- 依據：`README.md`、`docs/multiplication-practice-spec.md`、既有 style audit
- 範圍：`design-tokens.css`、`pwa.css`、`theme-init.js`、`app/settings.js`、`index.html`、`quiz.html`、`app/quiz-view.js`、`app/components/*.js`、PWA metadata/assets
- 方法：掃描 raw hex/rgb/hsl、Tailwind palette utility、semantic class 使用與 light/dark token 覆蓋，並區分色彩主題值、元件 visual contract、layout/animation 固定值與資產資料。
- 本輪只盤點與排程，不修改產品樣式。

## 2. 總體評估

專案已經有一套可用的 `--ds-*` token 與 `.ds-*` semantic class，但目前仍存在平行的 raw palette layer。問題不在於所有數字都 hardcode，而在於 theme-sensitive 的色彩、surface、border、shadow、focus 與 disabled 狀態仍可從頁面 markup／動態 HTML 直接繞過 design system。

最適合的下一步不是把所有 Tailwind utility 消滅，而是先收斂 theme-sensitive values；layout 與單一動畫參數保留在元件附近，避免過度 token 化。

## 3. 高優先發現

### REV-20260906-06：theme-color 的來源重複

- 現況：`#f4fbff`／`#091a30` 同時出現在 `theme-init.js`、`app/settings.js`、兩頁 meta 與 manifest；CSS/PWA 也有同值 fallback。
- 風險：調整畫布色時必須手動同步多個 runtime 與 metadata 入口。
- 建議：建立小型 `theme-colors.js` 供 runtime 共用；保留 HTML/manifest light default，但以註解與 style contract test 保護同步關係。

### REV-20260906-07：theme-sensitive raw palette 尚未收斂

- 現況：`index.html`、`quiz.html`、`app/quiz-view.js`、`app/components/multiplication-selector.js`、`app/components/completion-overlay.js` 仍大量使用 `text-slate-*`、`bg-white`、`border-slate-*`、`text-blue-*`、`focus:ring-blue-*`。
- 風險：dark mode 依賴 selector override；新增元件或新狀態時容易忘記加 override，造成視覺與對比分叉。
- 建議：先建立 `ds-text-*`、`ds-control-*`、`ds-input-*`、`ds-focus-*` 等最小 semantic classes，再分批遷移 dynamic quiz card、selector、navigation controls 與 modal primitive。

### REV-20260906-08：completion confetti palette 直接寫在頁面

- 現況：`quiz.html:305-314` 直接放 10 組 hex 顏色。
- 風險：裝飾色和主題／品牌色無法集中調整；日後移動 completion component 時需要重新搬運 CSS。
- 建議：移至 `design-tokens.css` 的 `--ds-confetti-*` palette 或 component stylesheet；這是低風險、可獨立提交的清洗。

## 4. 中優先發現

### REV-20260906-09：shadow fallback 與 scrim 仍帶 raw color

- `pwa.css:3,31,36`、`quiz.html:55`、`app/components/app-modal.js:84` 仍包含 raw color fallback／palette。
- 建議：由 `.ds-modal-backdrop`、`.safe-keypad` 與 `--ds-keypad-shadow` 統一提供視覺值；不要再在 component template 裡傳 `bg-slate-900/40`。

### REV-20260906-10：layer／effect 數值缺少命名邊界

- `z-50`、`z-[60]`、`z-80`、不同 backdrop blur 值散落在 pages/components。
- 建議：在色彩清洗後另開一輪，建立 `--ds-layer-*` 與必要的 effect class；避免同一 commit 同時改色彩與 stacking 行為。

## 5. 值得沿用的架構強項

- `design-tokens.css` 已有 light/dark 成對 token，並集中管理大部分 surface/status/focus/shadow。
- `.ds-table-*`、`.ds-primary`、`.ds-secondary`、`.ds-success`、`.ds-danger` 與 `app-button` 已提供正確的 semantic 方向。
- completion 的 confetti 屬於可識別的獨立視覺效果，適合單獨封裝，不應硬套 blocking modal 或一般 status token。
- metadata 與 icon 的 raw 色值有平台／資產語意，清洗時應保留合理例外。

## 6. 建議下一步排程

1. 先建立 semantic text/input/focus token classes 與 style contract tests。
2. 優先遷移 `app-modal`、`quiz-view`、`multiplication-selector` 與 navigation controls。
3. 將 confetti palette 與 keypad shadow fallback 各自獨立清洗。
4. 最後處理 theme-color runtime 常數集中與 layer/effect tokens。
5. 每一批都跑 light/dark dev smoke，避免只靠 source grep 判斷。
