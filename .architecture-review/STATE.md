# Architecture Review State

最後更新：2026-09-06

## 範圍進度

| 範圍 | 狀態 | 最後執行 | 檔案數 | 產出 |
|---|---|---:|---:|---|
| Round A 靜態 DOM/樣式 | complete | 2026-09-06 | 48 DOM + 15 behavior contracts | `runs/2026-09-06-full-dom-parity-AUDIT.md`、inventory |
| Round B 功能/狀態/輸入 | complete | 2026-09-06 | 15/15 interaction contracts | regression tests + fixes |
| Round C real Chromium/runtime | complete | 2026-09-06 05:51 CST | 48/48 DOM rows | runtime-parity evidence + screenshots |
| Round D test gap matrix | complete | 2026-09-06 05:52 CST | 15/15 behavior contracts | gap matrix + full quality gates |

## Round B 完成摘要

- implementation：15/15 interaction contracts 完成；selection、navigation、settings、answer、keypad、wrong/completion state 已納入目前 Svelte 邊界。
- automated verification：46 Vitest tests / 12 files 全數通過；7 個 targeted Chromium E2E 全數通過。
- quality gates：`npm run check`、`npm run build`、`npx tsc --noEmit`、`git diff --check` 全數通過。
- Round B runtime proof：目前已驗證 desktop home/quiz flow、fixed/floating keypad flow；mobile touch runtime、dark/light computed style、PWA waiting runtime 刻意延後到 Round C。

## 主 agent review 修正（2026-09-06 06:00 CST）

- export contract：Home/Quiz 共用 `src/application/export-records.ts`，統一四欄、row×col、CSV quote、正確次數與 timestamp filename。
- settings parity：共用 `SettingsModal` 改用 design-token classes；Home/Quiz light/dark computed-style E2E 相等。
- Q-08/Q-14/Q-15/Q-16/Q-19：補 dedicated question number、drag handle、10-key layout、backspace/enter、completion action assertions。
- E2E fixture isolation：`e2e-sw-one/two.js` 僅在 `E2E_PWA=1` emit；production build 已確認 dist 不含測試 worker。
- latest verification：47 Vitest、17 Chromium Playwright 全數通過。

## 下一步建議動作

1. 由主 agent review working tree；本次不 commit、不部署。
2. 若要消除最後 open finding，補 WebKit/iOS Safari 實機或 WebKit runtime validation。

## 還沒修復的高優先發現

- `REV-20260906-05`：本環境只執行 Chromium；尚未執行 WebKit/iOS Safari 原生 safe-area、IME、viewport runtime validation。

## 已關閉（不需要動作）

- 首頁單格 → 開始挑戰 → `quiz.html`：已有 integration + Playwright coverage，Round B 已通過；Round C 只需做 runtime/responsive 重驗。
- 開發模式不註冊 production Service Worker：已在 `src/App.svelte` guard，需在 Round C 驗證 console clean。
- `REV-20260906-02`：已關閉；selection grid 已恢復 hidden checkbox + label、all/row/column 控制與 indeterminate 行為，並由 integration/E2E contract 覆蓋。
- `REV-20260906-01`：已關閉；quiz header/back/settings/keypad、return modal 已完成 Round C real Chromium proof。
- `REV-20260906-03`：已關閉；isolated real service-worker waiting/update/reload E2E 已通過，並修正初次 install race。
- `REV-20260906-04`：已關閉；fixed/floating keypad、dock/close、wrong/completion banner matrix 已通過 Round C/D。
