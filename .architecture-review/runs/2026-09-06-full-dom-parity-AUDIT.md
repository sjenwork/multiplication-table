# 2026-09-06 Full DOM Parity Audit

## 1. 狀態／範圍／方法

本輪是一次完整 legacy-to-Svelte parity audit，沒有 commit 或部署。範圍包括：

- legacy `index.html`, `app.js`, `design-tokens.css`, `pwa.css`
- Svelte `src/index.html`, `src/App.svelte`, `src/routes/HomePage.svelte`, `src/routes/QuizPage.svelte`
- Svelte UI components：SelectionGrid、ActionBar、QuizList、NumberKeypad、UpdatePill
- application/domain/ports/adapters 對應的資料流與互動邊界
- unit/integration/E2E 測試與 browser runtime DOM/computed style/console

| Round | 方法 | 狀態 |
|---|---|---|
| A | 靜態 selector/DOM/樣式/token/ARIA inventory | complete：48 DOM + 15 behavior contracts |
| B | state、keyboard、mouse、pointer、touch、scroll、navigation | complete：15/15 interaction contracts |
| C | real Chromium 1440×900 / 390×844、light/dark、modal、PWA update | complete：48/48 DOM rows、17/17 E2E |
| D | test gap matrix、補 regression tests、全 quality gates | complete：15/15 contracts、all gates |

逐 DOM 明細位於：

- `runs/2026-09-06-full-dom-parity-inventory/01-home-pwa.md`
- `runs/2026-09-06-full-dom-parity-inventory/02-quiz.md`
- `runs/2026-09-06-full-dom-parity-inventory/03-state-interaction-tests.md`

## 2. Round A 結果與差異優先級

Round A 已完成；每一個首頁、quiz、PWA/update 主要 DOM contract 都已在 inventory 中有獨立列，沒有用 component summary 取代節點明細。視覺 PASS 只代表靜態 selector/token 對應，尚不代表 real browser computed style 已通過。

### P0：功能或導航風險

目前沒有未關閉的 P0。

### P1：DOM/可達性/樣式風險

- quiz 返回確認保留 native `dialog`、設定共用 role-dialog；Round C 已驗證 X/取消/確認/safe-area runtime，focus trap 未列為本輪阻擋項。

目前唯一 open finding 是 `REV-20260906-05`：本環境未跑 WebKit/iOS Safari 原生 runtime。

## 3. 目前保留的架構強項

- selection、quiz、records、state migration 已抽到 domain/application，UI 不直接重寫題庫規則。
- browser localStorage/download/haptics/navigation/PWA update 以 ports/adapters 隔離。
- 首頁的 selection drag 已由 table 層集中處理 pointer capture、350ms long press、release-click suppression 與 auto-scroll。
- token 與 legacy `design-tokens.css` 仍是共用視覺來源，沒有在 component 內另造一套主題系統。

## 4. Round B 結果（2026-09-06）

Round B 已完成 implementation 與可執行的 state/interaction tests，未 commit、未部署。

### 完成數

- 15/15 behavior contracts：selection（含 350ms long press、桌機 drag、反向選取）、selected/random/wrong-first navigation、settings/export/clear、quiz answer、fixed/floating keypad、wrong/completion feedback。
- 48/48 DOM inventory rows 已更新 Round B 狀態，並已在各 inventory 的 Round C evidence table 補上 result/time/evidence。
- 7/7 targeted Chromium E2E scenarios passed；其中包含首頁真實 click flow、selected quiz navigation、wrong-first/random navigation、fixed keypad completion、floating keypad pointer drag、desktop/mobile home parity。

### 測試結果

| Gate | 結果 |
|---|---|
| `npm run check` | PASS，0 errors / 0 warnings |
| `npm test -- --run` | PASS，46 tests / 12 files |
| `npm run build` | PASS，產出 `dist/index.html`、`dist/quiz.html`、`dist/sw.js` |
| `npx tsc --noEmit` | PASS |
| targeted Playwright Chromium | PASS，7/7 |
| `git diff --check` | PASS |

### Round B 修復內容

1. 首頁選題 grid 恢復 hidden checkbox + label DOM，移除 visible「全選」文字，補 all/row/column indeterminate 與桌機 drag／手機 long-press selection tests。
2. 首頁開始挑戰建立 fresh selected quiz session，避免 stale quiz state 造成導航後沒有題目。
3. Quiz list 改為 inline expression + answer input；固定鍵盤避開底部 action bar，浮動鍵盤修正拖曳參考框、關閉 X 與位置保存。
4. 共用設定 modal 對齊首頁/答題頁的內容、theme、export、clear、safe-area 與 close control。
5. 補 wrong feedback banner、第一個錯題自動定位與完成狀態的 regression coverage。

### 刻意延後到 Round C/D

- 390×844 真實 touch pointer/scroll boundary runtime proof。
- quiz full-page computed style、light/dark contrast、safe-area 與所有 modal runtime proof。
- PWA waiting/update/reload 真實 browser flow。
- completion/wrong banner 動畫、swipe 與全 action matrix。

## 5. Round A 修復計畫

1. 完成每個 legacy/Svelte DOM node 的 selector、role/text、visual、interaction、data flow、test status 明細。
2. 對 P1 DOM contract 差異決定是否要保留可觀察行為或補 ARIA/hidden control；不可只用 screenshot 判定。
3. 先新增會失敗的 regression tests，再修實作。

## 6. 後續輪次

- Round B：每個 control 寫狀態轉移矩陣，涵蓋 selection、navigation、settings、answer、keypad。
- Round C：real browser DOM/computed style/screenshot/console，保存結果與 open findings。
- Round D：依 coverage gap 補測試，執行 check/test/build/tsc/e2e/diff-check。

## 6. Round C 結果（2026-09-06 05:51 CST）

- completed count：48/48 DOM inventory rows 已補 Round C result/time/evidence；15/15 behavior contracts 在 real Chromium 或既有 integration contract 中有對應驗證。
- real browser：17/17 Playwright Chromium scenarios passed：runtime parity 10、critical flow 5、home parity 2。
- viewport：desktop 1440×900、mobile 390×844；涵蓋首頁、quiz、light/dark、settings/return modal、fixed/floating keypad、touch long-press、scroll obstruction、wrong/completion banner。
- evidence：產生 desktop light/dark screenshots；測試收集 console/pageerror，相關場景均為空；computed style 驗證 sticky、overflow、modal border/background、theme 與 keypad/action-bar 幾何。
- PWA：使用隔離 Chromium context 驗證 hidden → waiting worker → visible pill → click/SKIP_WAITING → reload/hidden；同時修正初次 install 被誤判更新的 race。

## 7. Round D 結果（2026-09-06 05:52 CST）

- completed count：15/15 behavior contracts 對應 `04-test-gap-matrix.md`；所有 Round B open findings 已轉成 runtime/regression evidence。
- full gates：`npm run check` PASS（0 errors/0 warnings）、`npm test -- --run` PASS（47/47）、`npm run build` PASS、`npx tsc --noEmit` PASS、`npm run test:e2e` PASS（17/17）、`git diff --check` PASS。
- test total：47 Vitest + 17 Chromium Playwright = 64 cases；本次 review 新增 1 個 Quiz export integration、1 個 settings parity E2E，並補 Q-08/Q-15/Q-16/Q-19 assertions。
- code fixes：quiz inner scroll reserved keyboard clearance；floating keypad dock；pointer capture guard；PWA waiting state controller guard；isolated test worker assets。

## 9. 主 agent review 修正（2026-09-06 06:00 CST）

- export parity：新增 `src/application/export-records.ts`，HomePage/QuizPage 共用同一 CSV contract；Quiz integration 與 real E2E download 已驗證四欄、quoted row×col、正確次數、timestamp filename。
- settings parity：`SettingsModal.svelte` 控件改用 `.ds-theme-choice`、`.ds-export-action`、`.ds-clear-action` token styles；Home/Quiz light/dark computed style equality E2E 通過。
- dedicated parity assertions：Q-08 question number、Q-14 drag handle、Q-15 10 numeric keys、Q-16 backspace/enter、Q-19 三個 completion actions 均有對應測試；不再只依報告文字。
- E2E worker isolation：Vite 只有 `E2E_PWA=1` 才 emit `e2e-sw-one.js/e2e-sw-two.js`；production `npm run build` 已驗證 `dist` 不含兩個 worker，Playwright webServer 明確帶 flag。

## 8. Remaining open findings

- `REV-20260906-05`：目前環境只執行 Chromium，未執行 WebKit/iOS Safari 原生 safe-area、IME、viewport runtime validation。這不是 Round C/D 卡住，而是明確的環境限制；其餘 Round C/D 項目已完成。
