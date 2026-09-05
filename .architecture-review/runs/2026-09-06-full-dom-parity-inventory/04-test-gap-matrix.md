# Round D Test Gap Matrix

完成時間：2026-09-06 05:51 CST  
範圍：Round C 後的 48 DOM rows、15 behavior contracts、目前 open findings。所有 browser rows 使用 Chromium/Playwright；不以 jsdom 作為 runtime 證據。

| Finding/contract | Existing test evidence | Round D action | Result |
|---|---|---|---|
| `REV-20260906-01` quiz header/back/settings/modal | `runtime-parity.spec.ts` quiz return + settings flows | 保留 desktop/mobile runtime assertions | PASS |
| `REV-20260906-03` update hidden/waiting/click/reload | `runtime-parity.spec.ts` isolated real SW context | 補 e2e one/two worker fixtures與 adapter race fix | PASS |
| `REV-20260906-04` keypad/banner matrix | `runtime-parity.spec.ts` fixed/floating/wrong/completion | 補 dock/close/full layout/action flow | PASS |
| T-01 persistence/migration | state/application Vitest | 檢查既有 unit coverage | PASS |
| T-02 single cell/history | `HomePage.test.ts`, critical flow | real selected cell flow | PASS |
| T-03 row/column/all/indeterminate | `HomePage.test.ts` + hidden checkbox E2E | assert no visible 全選文字 and controls | PASS |
| T-04 desktop pointer drag | `HomePage.test.ts` + critical flow | real pointer drag retained | PASS |
| T-05 350ms touch long press/reverse | `HomePage.test.ts` + runtime parity | real pointer touch dispatch and no console error | PASS |
| T-06 selected navigation | `critical-flow.spec.ts` | real click to quiz/article | PASS |
| T-07 random 10 unique | critical flow | real random navigation/count | PASS |
| T-08 wrong-first | critical flow | real wrong-first navigation | PASS |
| T-09 light/dark modal | `UpdatePill.test.ts`/Home integration + runtime parity | computed boundary/screenshot | PASS |
| T-10 export/clear confirm | Home integration + runtime parity | real download/dialog/storage removal | PASS |
| T-11 update pill | `UpdatePill.test.ts` + real PWA E2E | hidden/waiting/update/reload | PASS |
| T-12 fixed keypad | Quiz integration + runtime parity | 0–9/backspace/enter/obstruction | PASS |
| T-13 floating keypad | critical flow + runtime parity | real drag/dock/persistence/close | PASS |
| T-14 completion/wrong | Quiz integration + runtime parity | banner close/action/wrong feedback | PASS |
| T-15 responsive/a11y | home parity + runtime parity | roles, names, 1440×900, 390×844, console | PASS |

## Coverage totals

- DOM inventory：48/48 rows 有 Round C result/time/evidence。
- Behavior matrix：15/15 contracts mapped to tests。
- Round C browser scenarios：17/17 passed（runtime parity 10、critical flow 5、home parity 2）。
- Review follow-up：export contract、settings computed-style equality、Q-08/Q-14/Q-15/Q-16/Q-19 均已補 dedicated evidence；production build negative assertion 確認不輸出 E2E worker。
- Round D additions：6 個 real-browser scenarios（touch、scroll obstruction、dock、wrong/completion、PWA、desktop dark computed style）；既有 test files 也同步納入 full suite。
- Intentional limitation：未執行 WebKit/iOS Safari 原生引擎；`H-27` 只證明 Chromium safe-area/overscroll CSS，Safari device runtime 是 open validation item，不宣稱 PASS。
