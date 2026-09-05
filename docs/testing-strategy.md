# 測試策略

## 目的與原則

測試不是只驗證新元件能渲染，而是保護「乘法規則、使用者資料、跨裝置互動、PWA 更新」在重構後不改變。測試應優先測試可決定性的 domain/application，再以少量真實瀏覽器流程驗證元件整合；不要用大量 mock 取代真正的 storage、Service Worker 或 pointer interaction。

測試分層：

```text
Vitest unit ──> domain/application/adapter contracts
Vitest integration ──> Svelte components + state services
Playwright E2E ──> browser、viewport、PWA、user journeys
Capacitor smoke ──> Android/iOS webview 啟動與關鍵 native ports
```

## 工具與執行門檻

- Vitest + Testing Library for Svelte：快速驗證純函式與元件互動。
- Playwright：Chromium、WebKit、mobile Chromium；WebKit 用來捕捉 iOS Safari 類型的 layout／safe-area 問題。
- `npm run check`：Svelte check、TypeScript、必要的 lint。
- `npm run test`：Vitest 全量。
- `npm run test:coverage`：domain/application 行為至少 90% statement/branch；adapter 至少 80%；UI component 以關鍵互動覆蓋，不用單純追求行數。
- `npm run test:e2e`：由 `playwright.config.ts` 啟動 `npm run build` 與本地 `vite preview` 後執行 Chromium critical flows；CI 不依賴 Cloudflare 網路環境。
- 首次在開發機或 CI 執行需先安裝 browser：`npx playwright install chromium`（Linux CI 可用 `npx playwright install --with-deps chromium`）。若 browser binary 未安裝，E2E 會明確失敗，不視為通過。
- 每次 commit 至少執行 `npm run check && npm run test && npm run build`；selection、quiz、PWA、CSS layout 變更追加 E2E。

## Unit Tests（Vitest）

### Domain

`question.test.ts`：產生完整 1..9 × 1..9 題庫、key 格式、反向題獨立、答案正確。`selection.test.ts`：單格 toggle、整列／欄／全選、部分選取 indeterminate、批次選取與反向選取、重複 key 去重。`quiz.test.ts`：最多 10 題、不重複、少於 10 題全出、隨機順序使用 injectable RNG、輸入更新、backspace、下一題、未完成禁止提交、錯誤清除與三次顯示答案。`records.test.ts`：一輪只增加一次 attempts；有錯只增加一次 errors；跨輪累計；空白為 `0/0`。

### State 與 migration

以 fixtures 測試空 state、完整舊 state、缺少欄位、未知欄位、非法 theme、非法 keypad position、損壞 JSON。確認 migration 保留 selected、records、未完成 quiz 與 keypad position，且不清除資料。測試 round-trip：save → load → save 的語意一致。

### Application services

用 memory `StoragePort` 測試開始測驗、返回首頁、完成保存、重新測驗、錯題優先排序、主題保存、匯出資料組合。使用 fake clock/RNG，禁止測試依賴 `Math.random()` 或實際時間的非決定結果。

## Integration Tests（Vitest + Svelte Testing Library）

- `HomePage`：首欄／首列色彩與 `被＼乘`、單格選取、全選、行列 toggle、status text、按鈕 disabled 狀態。
- `SelectionGrid`：pointer gesture 狀態、拖曳經過多格的選取／反選、haptics port 呼叫、scroll port／邊界行為；只 mock port，不 mock selection domain。
- `QuizPage`：每題一排、輸入框 active、固定／浮動 keypad 切換、backspace／enter、完成後鍵盤關閉、錯題 focus、completion overlay close。
- `SettingsModal`：focus、escape／close、light/dark、clear storage confirmation、CSV download port。
- `UpdatePill`：沒有 waiting worker 不顯示；發現新版本才顯示；點擊後呼叫 update port 並清除顯示；reload／controller change 後不重複顯示。

元件測試應優先使用 role、label、text、data-testid（僅在沒有語意 selector 時）尋找元素，避免依賴 Tailwind class 或 DOM 深度。

## E2E Tests（Playwright）

目前可執行的最小交付套件位於 `tests/e2e/critical-flow.spec.ts`，實際命令為 `npm run test:e2e`。它只驗證本地 preview 的首頁選題／開始、`quiz.html` deep link、固定鍵盤輸入與完成 banner；不使用外網或脆弱 screenshot。WebKit、mobile viewport、PWA waiting-worker 與完整 pointer layout suite 仍是後續擴充項目，不能以目前 Chromium critical flow 代替。

每個測試先建立隔離 browser context 與空的 localStorage，必要時注入 fixture；不得依賴前一個測試的資料。至少包含：

1. 首頁在 desktop viewport 顯示完整表格；點選單格、整列、整欄、全選，確認 active colors 與狀態。
2. desktop mouse drag 與 mobile long-press drag 可多選／反選；表格內 scroll、sticky 首行首列仍可見。
3. 從選題進入 quiz；驗證 10 題上限、不重複、少於 10 題全部出題、刷新後恢復相同未完成狀態。
4. 使用自製 keypad 完成一題；驗證 `1 2 3 / 4 5 6 / 7 8 9 / 0` 排列、backspace、下一題、submit 防呆與輸入不觸發 OS IME。
5. 錯誤答案三次流程：每次輸入清除、顯示再次輸入、第三次顯示答案；一輪完成後首頁紀錄正確累計為 `錯誤/作答`，重試不重複累計。
6. 部分錯誤時自動定位第一題錯誤、按鈕改成對答案、完成 overlay 不自動消失且可 X／左右滑動關閉；全對時停留答題頁並顯示鼓勵訊息。
7. 返回確認 Modal、設定 Modal、主題切換、Modal 邊界／文字對比、清除資料與 CSV export。
8. fixed keypad 與 floating keypad：拖曳、吸附預覽、回到底部恢復尺寸、位置記憶；題目不被鍵盤遮住，鍵盤右上角 X 有效。
9. 375×812、390×844、768×1024、1440×900 viewport 與 WebKit 執行；檢查 safe-area、header 固定、題目內滾輪、不可雙擊放大／選字等既有契約。
10. PWA：manifest／icon 載入，Service Worker 註冊；模擬新 waiting worker 顯示更新膠囊，按下更新後重新載入最新版且膠囊消失；無新版本不得顯示。

E2E 應使用 `page.clock` 或 stubbed RNG/Service Worker 事件控制不穩定因素；截圖只作為 layout regression 輔助，功能判斷仍以語意 locator 與狀態結果為準。

## Capacitor Smoke Tests

在 Android emulator 與 iOS simulator 各執行：啟動、safe-area、選題、答題、震動 port 不崩潰、返回與設定 Modal、localStorage 重啟後保留。若使用原生分享／下載 adapter，再增加匯出檔案可被分享的測試；Web-only browser adapter 不應因 Capacitor plugin 不存在而白屏。

## Test Data and Fixtures

集中於 `tests/fixtures/`：empty state、selected 2、selected 10、selected 81、in-progress quiz、third-error quiz、records with 0/0 and accumulated errors、legacy state versions、light/dark preferences。每份 fixture 標記 schema version 與預期 migration result。隨機題目測試使用固定 RNG 或驗證集合／數量／唯一性，不驗證偶然順序。

## Failure Triage and Review Gates

- domain test failure：停止遷移，先判斷規格或實作是否改變既有語意。
- integration failure：檢查 port contract、元件事件與 store subscription，不直接在測試中增加 mock。
- WebKit/mobile failure：先檢查 viewport、safe-area、`position: fixed`、`overflow`、pointer/touch 行為，再修改 layout。
- PWA failure：檢查資產 query version、Service Worker cache name、`updateViaCache: 'none'`、waiting/controller 狀態與更新膠囊條件。

合併前 reviewer 必須確認：測試描述對應 spec acceptance criteria；新增行為先有 failing test 或 fixture；沒有刪除／skip 失敗測試；`npm run check && npm run test && npm run build` 通過；相關 E2E 在 Chromium 與 WebKit 通過；部署只在 dev branch 驗證後才允許進 main。

## Success Criteria

- 所有 domain/application 核心規則均有可重複的 Vitest 測試。
- 所有高風險使用者流程均有 Playwright E2E，至少涵蓋 desktop、mobile Chromium、WebKit。
- 舊 localStorage fixtures 全部成功載入，測試證明不清除既有紀錄。
- 新舊版本在選題、答題、紀錄、主題、鍵盤、更新提示上的 acceptance suite 結果一致。
- CI／本地品質 gate 可在不依賴正式 Cloudflare 網站的情況下通過；dev 部署後再做一次公開網址 smoke。
