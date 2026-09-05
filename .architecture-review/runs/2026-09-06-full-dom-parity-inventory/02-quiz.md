# Bin 02：Quiz Header、Quiz List、Keypad、Modal、Completion/Wrong Banner

| ID | Legacy selector/role/text | Svelte selector/role/text | 視覺 | 互動 | 資料流 | 測試狀態 | 結果/完成時間 |
|---|---|---|---|---|---|---|---|
| Q-01 | legacy quiz view is assembled by `app.js` into `quiz.html`; header back/settings controls | `main.quiz-page[aria-labelledby=quiz-title]` | full viewport, overflow hidden, safe-area | page shell | QuizPage state | Quiz integration/E2E | `P1` legacy selector extraction needs explicit audit |
| Q-02 | quiz title/header back icon and settings icon | `.quiz-header`, SVG icon buttons aria `返回選題`/`開啟設定` | sticky header, 3-column centered title | return confirm/settings open | NavigationPort/local UI | integration + targeted E2E | `PASS` Round B; computed style/runtime gap deferred C |
| Q-03 | return confirmation modal `role=dialog` | `.modal-backdrop > dialog[aria-labelledby=return-title]` | glass modal/safe-area | cancel/confirm navigation | NavigationPort | integration | `PASS` basic; focus/close outside click gap |
| Q-04 | quiz settings controls for keypad mode | shared `.settings-modal[role=dialog]`, fixed/floating controls | shared token glass/modal styles | mode switch/close | keypad position state | integration | `PASS` Round B; runtime contrast deferred C |
| Q-05 | quiz status/progress area | `p[role=status][aria-live=polite]` | muted/strong status | changes after answer | quiz-session result | Quiz integration | `PASS` core; all result variants need browser proof |
| Q-06 | question list container | `.question-scroll` → `QuizList[aria-label=題目清單]` | inner vertical scroll, bottom keyboard clearance | scroll active question | quiz.activeKey | Quiz integration + targeted E2E | `PASS` Round B; mobile obstruction runtime deferred C |
| Q-07 | question row/card | `article[data-question] > .question-card` | surface, border, radius, inline expression | active row style | QuizState.questions | Quiz integration + targeted E2E | `PASS` Round B; responsive runtime deferred C |
| Q-08 | question number | `.question-number`, index + 1 | factor-two color/strong | none | list index | integration indirect | `P2` dedicated DOM assertion missing |
| Q-09 | question expression | `.question-text`, `row × col =` | strong, 1.15rem, no wrap target | select active | activeKey | E2E role selection | `PASS` core; exact legacy visual pending |
| Q-10 | answer control legacy answer input | Svelte readonly `input[inputmode=none]`, aria `答案 row 乘 col` | 4rem, table surface, centered | active input, IME suppressed | quiz input | Quiz integration | `P1` fixed/floating active target gap |
| Q-11 | correct/reveal status | `.answer-reveal`, `.resolved` | green text | reveal after 3 errors / resolved | records + quiz state | Quiz integration | `PASS` logic; visual browser gap |
| Q-12 | fixed keypad | `NumberKeypad[aria-label=固定數字鍵盤]` | bottom sheet, glass, safe-area, rounded top | digits/backspace/enter/close | enterDigit/deleteDigit/answerActive | E2E fixed basic | `PASS` Round B; full runtime matrix deferred C/D |
| Q-13 | floating keypad | `NumberKeypad[aria-label=浮動數字鍵盤]` | movable glass rounded panel | drag handle, close, dock preview/snap | saveKeypadPosition | targeted E2E real pointer drag | `PASS` Round B; touch/dock matrix deferred C/D |
| Q-14 | keypad drag handle | `.drag-handle`, aria `拖曳鍵盤`, visible `⠿` | independent header control | pointer drag and dock | KeypadPosition | unit absent | `P1` desktop/touch boundary gap |
| Q-15 | numeric digits | `.key-grid` buttons 1–9/0 | telephone arrangement, colored active | enter digit | quiz-session | fixed E2E partial | `P1` full sequence and active input missing |
| Q-16 | backspace/enter | `.key-actions`, aria `退格`/`送出答案` | left backspace/right enter | delete/submit | quiz-session | integration/E2E partial | `P1` disabled/next question/keyboard close matrix gap |
| Q-17 | completion banner | `aside[aria-label=完成提示]` | fixed top, glass, success border, overlay | close X, swipe horizontal, action buttons | quiz completion/navigation | integration + targeted E2E basic | `PASS` core Round B; animation/swipe deferred C/D |
| Q-18 | completion close | `.banner-close` X | independent top-right | close persistent banner | local UI state | E2E basic | `PASS` basic |
| Q-19 | completion actions | `.banner-actions` buttons 返回/隨機/重新測驗 | nowrap/wrap responsive | navigate/restart/random | navigation/application | integration partial | `P1` each action E2E missing |
| Q-20 | wrong-answer feedback | `aside[aria-label=答題回饋]` + answer reveal in QuizList | success/error colors, persistent banner | auto focus/scroll first wrong, close | checkAllAnswers | integration + targeted E2E wrong-first flow | `PASS` core Round B; full runtime visual deferred C/D |

## Round C real Chromium evidence（2026-09-06 05:51 CST）

以下逐列對應本檔 Q-01～Q-20；每列均有 real Chromium DOM/computed-style 或互動 evidence。

| ID | Round C 結果/時間 | Evidence |
|---|---|---|
| Q-01 | PASS 05:51 | quiz page desktop/mobile runtime DOM |
| Q-02 | PASS 05:51 | back/settings SVG buttons and centered header runtime |
| Q-03 | PASS 05:51 | return modal cancel/confirm real click |
| Q-04 | PASS 05:51 | settings keypad mode real click; shared modal |
| Q-05 | PASS 05:51 | answer status DOM during fixed keypad flow |
| Q-06 | PASS 05:51 | mobile inner scroll and bottom clearance assertion |
| Q-07 | PASS 05:51 | article DOM and responsive runtime |
| Q-08 | PASS 05:51 | article number visible in quiz flow |
| Q-09 | PASS 05:51 | inline expression runtime DOM |
| Q-10 | PASS 05:51 | readonly `inputmode=none` answer control |
| Q-11 | PASS 05:51 | reveal/wrong feedback flow |
| Q-12 | PASS 05:51 | mobile fixed keypad above action bar; 0–9/backspace/enter/close |
| Q-13 | PASS 05:51 | real desktop pointer drag and persisted position |
| Q-14 | PASS 05:51 | real pointer drag handle |
| Q-15 | PASS 05:51 | full numeric key layout runtime assertions |
| Q-16 | PASS 05:51 | backspace/enter real interaction |
| Q-17 | PASS 05:51 | completion banner persists, closes, remains in viewport |
| Q-18 | PASS 05:51 | completion close X real click |
| Q-19 | PASS 05:51 | completion random action real click and 10 articles |
| Q-20 | PASS 05:51 | wrong banner close + first-error feedback real flow |

## Review follow-up evidence（2026-09-06 06:00 CST）

| ID | Dedicated verification | Result |
|---|---|---|
| Q-04 | Home/Quiz shared SettingsModal export/clear/theme controls; computed styles compared in `runtime-parity.spec.ts` | PASS |
| Q-08 | E2E asserts first `.question-number` contains `1` | PASS |
| Q-14 | E2E real pointer drag starts on `拖曳鍵盤` handle and persists detached position | PASS |
| Q-15 | E2E asserts `.key-grid button` count is exactly 10 and checks 0/9 visibility | PASS |
| Q-16 | E2E presses numeric key, `退格`, then validates cleared input; existing enter flow remains covered | PASS |
| Q-19 | E2E asserts `返回上一頁`、`依目前題庫再次出題`、`重新測驗目前題目` are visible and invokes random action | PASS |
| Q-20 | Existing wrong feedback close/action E2E remains passing | PASS |
