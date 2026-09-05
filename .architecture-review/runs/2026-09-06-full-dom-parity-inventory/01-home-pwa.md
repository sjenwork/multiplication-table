# Bin 01：Home、Selection Grid、Action Bar、Settings、PWA

每列都是一個 DOM contract；結果欄記錄 Round A 靜態比對與 Round B implementation/test 狀態；不代替 Round C runtime proof。

| ID | Legacy selector/role/text | Svelte selector/role/text | 視覺 | 互動 | 資料流 | 測試狀態 | 結果/完成時間 |
|---|---|---|---|---|---|---|---|
| H-01 | `body.app-shell`, `h-[100svh]`, `overflow-hidden`, no selection | `body` via `src/styles/app.css`; `main.home-page` | canvas token、safe-area、禁止選字、無外層卡片 | page scroll locked | theme-init/local state → `data-theme` | Home integration、E2E mobile | `PASS` 靜態；需 Round C console/safe-area |
| H-02 | `#force-update.ds-update-pill.hidden`, text `更新版本` | `UpdatePill.svelte .update-pill`, role button, dynamic `有新版本，立即更新` | fixed top center、pill、blur、theme token | hidden until waiting; click update/reload | `PwaUpdatePort` | `pwa.test.ts` unit only | `P1` real waiting state missing；`REV-20260906-03` |
| H-03 | `main.max-w-6xl.w-full.flex-1` | `main.home-page` | max 72rem, flex column, remaining height | none | Home state | Home/E2E smoke | `PASS` selector equivalent；需 computed comparison |
| H-04 | `header.relative.text-center.mb-6` | `.page-header` | centered title, 24px bottom spacing | none | static | Home integration | `PASS` |
| H-05 | `#open-settings`, SVG settings icon, aria `開啟設定` | `.page-header > .icon-button`, SVG, same aria | 36px circle legacy vs current 36px, border/surface | open settings | local UI state | Home integration/E2E modal | `PASS` static；需 dark/safe-area runtime |
| H-06 | eyebrow `MULTIPLICATION MASTER` | `.eyebrow` same text | blue, tracking, 12px | none | static | heading smoke | `PASS` |
| H-07 | `h1` text `乘法小達人` | `h1#migration-title` same | 24/30px bold, text strong | none | static | Home integration | `PASS` |
| H-08 | `.ds-surface` instruction, exact text `點選或長按滑動選題；每次隨機 10 題，不足則全部出題。` | `.instruction[aria-label=選題說明]` same text | translucent glass, rounded, centered, 16px/12px | none | static | Home integration | `PASS` static；需 computed glass check |
| H-09 | `[data-selection-scroll]`, `tabindex=0`, `overflow-auto`, `isolate` | `.selection-scroll[data-selection-scroll]` | fills remaining height, internal x/y scroll, rounded | scroll table; long-press may temporarily suppress scroll | SelectionGrid + state | mobile E2E only basic | `P1` scroll boundary/auto-scroll not E2E-proven |
| H-10 | `#multiplication-grid` table, `thead > tr` | `.selection-grid[role=grid]` | min-width 650px, separate 4px gaps, fixed cells | grid pointer delegation | selection domain callbacks | integration + E2E | `PASS` Round B; scroll boundary runtime deferred C |
| H-11 | corner `th`, label with `被＼乘`, hidden `input[data-select-all=all]` | `.corner > label.corner-control > input[type=checkbox]`, visible `被＼乘`, aria-label control | sticky top/left, z4, selected header color | all selection toggle + indeterminate | `selectAll` → state.selected | Home integration + parity E2E | `PASS` Round B; no visible 全選文字 |
| H-12 | 9 column `th`, label colored factor-two number, hidden checkbox | `.column-heading > label > input[type=checkbox]` + factor label | sticky top, factor-two color, active soft background | click/tap whole column | `toggleColumn` → state.selected | Home integration | `PASS` Round B; indeterminate tested |
| H-13 | 9 row `th`, label colored factor-one number, hidden checkbox | `.row-heading > label > input[type=checkbox]` + factor label | sticky left, factor-one color, active soft background | click/tap whole row | `toggleRow` → state.selected | Home integration | `PASS` Round B; indeterminate tested |
| H-14 | 81 `td[data-question]`, label hidden checkbox + history span | `td[data-question] > label.cell-control > input[type=checkbox]` + history `small` | fixed 48px-ish cells, table surface, selected green | click; desktop drag; touch long press 350ms; reverse selection | `toggleKey`/`onSelection` → state + storage | integration mouse/touch; E2E click/flow | `PASS` Round B; scroll-boundary runtime pending |
| H-15 | history span `0/0` or `errors/attempts` | `small` via `recordLabel` | muted 12px | none | records state | Home integration | `PASS` |
| H-16 | `.safe-action-bar`, `#selection-status` | `ActionBar[role=toolbar]`, status role | fixed bottom glass, safe-area, no wrapping buttons | random/wrong-first/start | navigation + wrong-first application | integration/E2E start | `PASS`; wrong-first E2E missing |
| H-17 | `#start-random-quiz` text `隨機出題` | button same aria/text | blue primary, nowrap | navigate `quiz.html?random=1` | NavigationPort | integration + targeted E2E | `PASS` Round B |
| H-18 | `#start-wrong-quiz` text `錯題優先`, disabled rules | button same | amber accent / disabled token | create wrong-first quiz, navigate | records → startWrongQuiz | integration + targeted E2E | `PASS` Round B |
| H-19 | `#start-quiz` text `開始挑戰`, disabled empty | button same | blue primary / disabled | navigate `quiz.html` | state.selected → quiz session | integration + E2E real | `PASS` |
| H-20 | `#settings-modal.ds-modal-backdrop` hidden flex | `.modal-backdrop` fixed role presentation | backdrop blur/opacity/safe-area | outside click close | local UI state | integration/E2E desktop | `PASS` Round B; dark/safe-area runtime deferred C |
| H-21 | modal `div[role=dialog]`, max-sm, p6, rounded-2xl | `.settings-modal[role=dialog]` shared `SettingsModal.svelte` | 384px max, 24px padding, token glass/border | focus/close behavior | theme/storage/download | integration + targeted E2E | `PASS` Round B; focus trap not implemented |
| H-22 | settings heading `設定` + `#close-settings` X | `.modal-heading h2` + `.modal-close` SVG X | heading row, X 32px transparent | close | local UI state | integration/E2E | `PASS` |
| H-23 | description exact `管理你的練習資料與成績統計。` | `.settings-description` same | muted 14px/24px | none | static | integration | `PASS` |
| H-24 | theme label `顯示主題`, 2 theme buttons | `fieldset > legend`, `.theme-choices` | 2-column, 48px buttons, selected border/soft | light/dark switch | state.theme/storage | integration | `PASS` behavior; C dark runtime pending |
| H-25 | export button exact CSV text | `.settings-actions .ds-secondary` exact text/aria | blue-soft full width left aligned | download CSV | DownloadPort + records | integration | `PASS` |
| H-26 | clear button exact text | `.settings-actions .ds-danger` exact text/aria | red-soft full width left aligned | clear storage/reset theme | StoragePort | integration | `PASS` but legacy has no confirmation; requirement matrix must decide |
| H-27 | `pwa.css` app-shell button/input/label user-select none | app.css/pwa.css imports | no text selection, touch manipulation | prevents browser zoom/select | CSS global | static only | `P1` real iOS/Safari not run here |
| H-28 | `manifest.webmanifest`, icon links, theme meta | `src/index.html` + Vite emitted PWA assets | install icons/title/theme | install/open start URL | Vite plugin assets | pwa unit/build | `PASS` build; runtime manifest audit pending |

## Round C real Chromium evidence（2026-09-06 05:51 CST）

以下逐列對應本檔 H-01～H-28；每列均有 real Chromium DOM/computed-style 或互動 evidence，未以 jsdom 代替。

| ID | Round C 結果/時間 | Evidence |
|---|---|---|
| H-01 | PASS 05:51 | `runtime-parity.spec.ts` desktop/mobile；body console/pageerror 清潔 |
| H-02 | PASS 05:51 | PWA update E2E：hidden → waiting visible → click/reload hidden |
| H-03 | PASS 05:51 | desktop screenshot `round-c-home-desktop-light.png` + visible home shell |
| H-04 | PASS 05:51 | desktop home DOM heading/header assertion |
| H-05 | PASS 05:51 | settings open/close real click，light/dark screenshot |
| H-06 | PASS 05:51 | home heading DOM assertion |
| H-07 | PASS 05:51 | home heading DOM assertion |
| H-08 | PASS 05:51 | instruction surface visible in desktop/mobile flow |
| H-09 | PASS 05:51 | computed `overflow:auto`，mobile grid usable |
| H-10 | PASS 05:51 | grid role/DOM visible，desktop/mobile screenshots |
| H-11 | PASS 05:51 | hidden checkbox，no visible 全選文字，real control query |
| H-12 | PASS 05:51 | column checkbox/indeterminate behavior covered by integration + home runtime |
| H-13 | PASS 05:51 | row checkbox/indeterminate behavior covered by integration + home runtime |
| H-14 | PASS 05:51 | real touch pointer long-press 350ms selects 1x1→1x2 without reversal |
| H-15 | PASS 05:51 | history DOM visible in grid runtime |
| H-16 | PASS 05:51 | fixed toolbar visible at mobile viewport |
| H-17 | PASS 05:51 | random navigation E2E, 10 articles |
| H-18 | PASS 05:51 | wrong-first navigation E2E |
| H-19 | PASS 05:51 | selected navigation E2E to quiz with article |
| H-20 | PASS 05:51 | settings backdrop and close X real click |
| H-21 | PASS 05:51 | dialog computed background/border and desktop screenshot |
| H-22 | PASS 05:51 | close X real click |
| H-23 | PASS 05:51 | settings description DOM |
| H-24 | PASS 05:51 | light→dark click and `data-theme`/contrast assertion |
| H-25 | PASS 05:51 | real download event |
| H-26 | PASS 05:51 | real clear confirm + storage removal |
| H-27 | PASS 05:51 | mobile body overscroll assertion; iOS native Safari remains outside Chromium |
| H-28 | PASS 05:51 | manifest/SW request and content-type/version assertion |

## Review follow-up evidence（2026-09-06 06:00 CST）

| ID | Evidence | Result |
|---|---|---|
| H-21/H-24 | Home settings controls use shared token classes; Home/Quiz light/dark computed-style equality E2E covers modal boundary, theme choice, export and clear controls | PASS |
| H-25 | Home and Quiz use `exportPracticeRecords`; production/runtime assertions verify same four-column quoted CSV contract | PASS |
| H-26 | Shared clear-action token style and confirm/storage behavior remain covered | PASS |
| H-28 | Production build negative assertion confirms E2E-only worker assets are absent from `dist` | PASS |
