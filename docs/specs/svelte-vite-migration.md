# Spec：Svelte 5 + Vite 遷移

## Objective

將目前純 HTML/CSS/JS 的九九乘法練習 PWA 遷移為 Svelte 5 + Vite + TypeScript，維持 Web 版行為與 Cloudflare Pages 部署，同時讓同一套前端可由 Capacitor 建立 Android/iOS 應用。重構必須先建立 domain/application/port 邊界，避免把瀏覽器 API、DOM 操作與乘法規則混在元件內。

使用者成功標準：選題、答題、錯誤修正、紀錄、主題、鍵盤、PWA 更新等既有行為不退化；重新整理或切換頁面不遺失狀態；自動化測試能在未開啟瀏覽器手動檢查的情況下阻止主要回歸。

## Tech Stack and Commands

- Svelte 5、Vite、TypeScript、Capacitor；不使用 SvelteKit。
- Vitest：domain、application、adapter contract tests。
- Playwright：Chromium、WebKit、行動 viewport 的端到端流程。
- 建議 scripts：`npm run dev`、`npm run build`、`npm run preview`、`npm run check`、`npm run test`、`npm run test:coverage`、`npm run test:e2e`。
- Pull/commit gate：`npm run check && npm run test && npm run build`；UI 或 PWA 變更追加 `npm run test:e2e`。
- Capacitor smoke：`npm run build && npx cap sync`，再由 Android Studio/Xcode 執行原生 smoke；不可讓原生平台依賴未提交的 `dist`。

## Target Structure

```text
src/
  app.html
  main.ts
  routes/HomePage.svelte
  routes/QuizPage.svelte
  components/
    SelectionGrid.svelte
    QuizList.svelte
    NumberKeypad.svelte
    SettingsModal.svelte
    UpdatePill.svelte
    CompletionOverlay.svelte
    ActionBar.svelte
  domain/
    question.ts
    selection.ts
    quiz.ts
    records.ts
    state.ts
  application/
    practice-session.ts
    selection-session.ts
    settings-session.ts
    update-session.ts
  ports/
    storage.ts
    haptics.ts
    download.ts
    navigation.ts
    pwa-update.ts
    viewport.ts
  adapters/browser/
    local-storage.ts
    browser-haptics.ts
    csv-download.ts
    browser-navigation.ts
    service-worker-update.ts
  styles/
    design-tokens.css
    pwa.css
tests/unit/...
tests/integration/...
tests/e2e/...
capacitor.config.ts
```

每個 component 以 props/events 或明確的 callback contract 溝通；domain 函式以不可變輸入輸出為主。不要在 component 內呼叫 `localStorage`、`navigator.vibrate`、`URL.createObjectURL` 或 `window.location`。

## Domain and State Contract

`Question` 為 `{ row: 1..9, col: 1..9, answer: row * col, key: "rowxcol" }`；`rowxcol` 與反向題視為兩題。選題從 81 題中管理，支援單格、整列、整欄、全選、反選及長按拖曳批次選取；觸控選定時透過 `HapticsPort` 提供短震動，超出內滾輪邊界才允許自動捲動。

開始測驗從選取題目最多隨機 10 題且單輪不重複；不足 10 題就全部出題；隨機出題使用 81 題。答題順序隨機，刷新或離開後由保存的 quiz 恢復。答案輸入只允許數字鍵盤、backspace 與下一題／送出語意；固定鍵盤為底部 sheet，浮動鍵盤可由手柄拖出、在吸附範圍內預覽並記憶位置，兩模式共用 `KeypadState`。

提交時未填完禁止檢查；錯誤立即清除輸入並明確提示再次輸入。單題第三次錯誤直接顯示正確答案並標為已解決；同一輪的修正不重複累計，只在完成一輪時將每題 `attempts + 1`，有錯則 `errors + 1`。首頁每格顯示 `錯誤次數/作答次數`，無紀錄為 `0/0`。完成或有錯後顯示不自動消失的 banner／overlay，可關閉或滑動；有錯時自動定位第一題錯題。

## Persistence, PWA, and Deployment

`StoragePort` 使用 key `multiplication-practice-state`，以 versioned JSON 保存 selected、records、quiz、theme、keypadPosition。所有 migration 必須有舊 fixture 測試。主題在首繪前初始化，並同步安全區域背景與 `theme-color`。Service Worker 使用版本化 cache name，更新偵測只顯示膠囊；使用者點擊後才清除／切換快取並 reload，沒有新版本時不顯示膠囊。

Vite 產出需能在 Cloudflare Pages 以 `/`、`/quiz.html` 或等價 SPA entry 直接開啟，且 static asset URL 可被 Service Worker 快取。維持 `dev` → `https://dev.multiplication-table.pages.dev`、`main` → `https://multiplication-table.maderaojen.me`；部署由現有 `deploy.sh` 執行並檢查 clean branch。README 的部署規則需同步更新為 Vite build 後的部署流程。

## Complete Existing-Feature Acceptance Criteria

- [ ] 首頁可在桌機與手機顯示 9×9 選題表；首欄／首列固定、表格區內滾動，格子不因題目少而拉高。
- [ ] 左上角保留全選並顯示 `被＼乘`；左側首欄使用被乘數色、上方首列使用乘數色；選取格、列、欄、全選狀態有清楚 active 顏色。
- [ ] 點擊單格可選取／取消；桌機滑鼠拖曳、手機長按拖曳可批次選取／反向選取，內滾輪與邊界自動捲動正常，選取時有震動或 fallback feedback。
- [ ] 首頁有清楚但精簡的選題說明；開始挑戰、隨機出題、錯題優先按鈕排列不換行且按鈕不超出窄螢幕。
- [ ] 開始挑戰只從已選題目出題；隨機出題可從全部題目出題；錯題優先依錯誤次數排序且最多 10 題；每輪題目不重複、少於 10 題全部出題。
- [ ] 答題頁 header 固定且返回在標題左側、設定在右側；返回需確認 Modal；設定可切換主題、清除 localStorage、匯出 CSV。
- [ ] 題目頁 header、題目清單、固定／浮動鍵盤、操作列版面適應 iOS Safari、Android、窄手機與桌機；安全區域不遮住內容，題目內滾輪不觸發整頁捲動。
- [ ] 答案輸入使用自製數字鍵盤，固定模式不遮住最後一題；浮動模式不超出 viewport，可拖曳、手柄、關閉、回到底部吸附，位置保存並在下一次載入恢復。
- [ ] 未完成所有未解決題目時檢查按鈕 disabled／防呆；提交後鍵盤關閉。正確標記、錯誤清除、再次輸入提示、第三次錯誤顯示答案均正確。
- [ ] 全對與部分答對都有短暫但可關閉的鼓勵 overlay/banner；全對停留答題頁；有錯自動捲到第一個錯題，按鈕變為對答案。
- [ ] 完成後可返回首頁、依已選題庫再次隨機出題、重新測驗；完成提示可用 X 或左右滑動關閉。
- [ ] localStorage 在刷新、返回、重新開啟 quiz 頁後恢復；資料格式錯誤或缺欄位不會讓 App 白屏。
- [ ] light/dark 主題的 canvas、header、table headers/cells、cards、Modal、keypad、safe-area 與文字都有足夠對比，Modal 邊界可辨識。
- [ ] PWA manifest、icon、Service Worker、版本更新膠囊與 cache busting 正常；部署後 dev/main 網址都取得同一版 build 資產。

## Phased Tasks

### Phase 0：基線與護欄

- 建立 Vite/Svelte/TypeScript 專案骨架與測試 runner，不改 legacy 行為。
- 把現有 state JSON、81 題、代表性 localStorage、答題歷程建立 fixtures。
- 先讓 legacy acceptance checklist 對應到 Playwright 測試名稱。

成功標準：新專案可 build、Vitest/Playwright 可執行，fixtures 可讀，現有 branch/deploy files 未被破壞。

### Phase 1：Domain 與 ports

- 實作 question、selection、shuffle、quiz retry、record aggregation、state migration 純函式。
- 定義 ports 與 browser adapters；先用 memory storage 完成 application tests。

成功標準：所有核心規則有 unit tests，無 domain 對 DOM／瀏覽器依賴，舊資料 fixture migration 通過。

### Phase 2：首頁遷移

- 建立 HomePage、SelectionGrid、說明與 action bar。
- 還原 sticky table、active colors、桌機拖曳與手機長按批次選取。

成功標準：首頁 acceptance criteria 全部通過，桌機／手機 Playwright smoke 通過。

### Phase 3：答題頁與設定

- 建立 QuizPage、QuizList、NumberKeypad、CompletionOverlay、SettingsModal。
- 接上 quiz application service、storage、theme、haptics、download、navigation ports。

成功標準：完整答題、錯誤、重試、紀錄、設定與鍵盤 acceptance criteria 通過。

### Phase 4：PWA、Capacitor 與部署

- 遷移 manifest、Service Worker、update pill、safe-area CSS；加入 Capacitor config 與原生 sync smoke。
- 更新 deploy script／README，使 build artifact、dev/main branch 與版本流程一致。

成功標準：`npm run check && npm run test && npm run build && npm run test:e2e` 全部通過；dev 部署可開啟、更新膠囊行為正確；Capacitor Android/iOS 可啟動並完成核心流程。

### Phase 5：Review 與切換

- 進行 code review、accessibility review、bundle/runtime review；比較 legacy 與新版本的 localStorage、畫面與行為。
- 先在新分支驗收，再合併；保留可回退的 legacy commit，不直接刪除資料相容程式。

成功標準：無未解決 high severity review finding、覆蓋率門檻達成、production deploy 前 dev smoke 通過。

## Boundaries

- Always：先寫 domain/application tests；所有變更跑 typecheck、test、build；維持 localStorage compatibility；使用 design tokens；不在 component 直接呼叫 browser API。
- Ask first：新增 Capacitor plugin、變更資料語意、改 production DNS／部署流程、刪除 legacy compatibility、改動公開 UI 行為。
- Never：commit secrets、刪除使用者 localStorage、以 `any` 繞過型別錯誤、關閉失敗測試、從非 `dev`／`main` 部署。

## Open Items

- [Deferred] 先不決定是否導入 router；兩個 entry 可先由 Vite multi-page 或單一 shell + navigation adapter 實作，Phase 0 依 build/deep-link smoke 選定。
- [Deferred] Capacitor 原生分享與震動的 plugin 清單，待 Web 版 port contract 穩定後決定。
- [Known Gap] 目前 legacy 沒有現成測試；Phase 0 必須以 fixtures 與新測試補上行為基線。

