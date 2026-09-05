# Bin 03：State、Ports、PWA、Interaction/Test Matrix

| ID | Legacy behavior/source | Svelte boundary | Required verification | Current result |
|---|---|---|---|---|
| T-01 | `localStorage[multiplication-practice-state]` selection/records/theme/quiz/keypad | `StoragePort` + `state.ts` migration | state restore, invalid state, versioned persistence | unit/integration pass |
| T-02 | single cell toggles selected and history remains `errors/attempts` | `toggleKey` + SelectionGrid | click/tap and persisted selection | pass |
| T-03 | row/column/all controls update 9/9/81 keys | selection domain + hidden checkbox headers | each control and all-selected/indeterminate state | integration + E2E contract pass |
| T-04 | mouse drag selects cells; release click not reverse | grid pointer capture/delegation | real pointerdown/move/up/click | integration + E2E pass |
| T-05 | long press 350ms then drag selects/reverses | grid timer + pointerenter | touch pointer sequence, scroll boundary | integration pass; real mobile runtime deferred C |
| T-06 | start selected quiz | `loadOrCreateQuiz` + NavigationPort | one selection → quiz.html and at least one article | integration + Playwright pass |
| T-07 | random quiz | `random=1` + full question bank | navigate, 10 unique questions | integration + targeted E2E pass |
| T-08 | wrong-first quiz | `startWrongQuiz` records errors | button enable/order/navigation | integration + targeted E2E pass |
| T-09 | settings light/dark | HomePage state + tokens | modal, close X, theme DOM and contrast | integration; desktop runtime partial |
| T-10 | export/clear | DownloadPort/StoragePort | CSV content, clear reset/confirm policy | integration export/clear; confirmation policy open |
| T-11 | update pill | `PwaUpdatePort` + UpdatePill | hidden/no waiting, visible/waiting, click skip/reload | unit/integration pass; real waiting runtime deferred C |
| T-12 | fixed keypad | NumberKeypad + quiz-session | no IME, input sequence, bottom safe-area, next question | integration + targeted E2E basic pass |
| T-13 | floating keypad | KeypadPosition + pointer drag | detach, drag, preview dock, restore, persistence | integration + targeted E2E real pointer pass; touch/dock deferred C/D |
| T-14 | completion/wrong flow | QuizPage + quiz-session | correct, 3 errors reveal, wrong banner, completion actions | integration + targeted E2E core pass |
| T-15 | responsive/accessibility | tokens/pwa.css/Svelte ARIA | 1440×900, 390×844, dark/light, role/name/focus | home E2E pass; quiz/PWA gaps |

## Review follow-up contracts（2026-09-06 06:00 CST）

| ID | Contract | Test evidence | Result |
|---|---|---|---|
| T-16 | Home/Quiz export is one four-column quoted CSV contract | `QuizPage.test.ts` + runtime download filename/content assertion | PASS |
| T-17 | Home/Quiz settings controls use identical tokenized computed styles in light/dark | runtime parity computed-style equality E2E | PASS |
| T-18 | Production build excludes E2E worker fixtures; E2E preview includes them only with flag | production `npm run build` + `test ! -e dist/e2e-sw-one.js`/two; Playwright webServer flag | PASS |
