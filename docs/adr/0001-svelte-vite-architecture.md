# ADR-0001：採用 Svelte 5 + Vite 重構前端架構

## Status

Accepted after architecture review on 2026-09-05.

## Date

2026-09-05

## Context

本專案目前是由 `index.html`、`quiz.html`、`app.js`、`pwa.css`、`design-tokens.css` 與 Service Worker 組成的純靜態 PWA。功能已包含選題、批次拖曳選取、隨機出題、答錯重試、累計紀錄、主題、雙模式數字鍵盤、PWA 更新提示及 Cloudflare Pages 分支部署，但互動狀態、DOM rendering、瀏覽器 API 與頁面初始化集中在 `app.js`，造成後續功能容易互相影響，且目前缺乏自動化測試。

重構的目標是維持現有 Web/PWA 行為，同時建立能被 Android/iOS 共用的前端核心。原生平台整合目前不是重寫 UI，而是保留 Web UI、以 Capacitor 提供原生容器與少量平台能力。

## Decision

採用 **Svelte 5 + Vite + TypeScript** 作為 Web 應用層，並以 **Capacitor** 作為 Android/iOS 邊界。部署仍是靜態產物部署到 Cloudflare Pages；PWA Service Worker 與版本更新仍由 Web 端負責。

### 邊界與分層

```text
src/routes or app shell
  └─ screens (Home / Quiz)
      └─ components (grid, keypad, modal, banner, action bars)
          └─ application services (selection, quiz, records, theme, update)
              └─ domain (question, quiz state, record rules, pure algorithms)
                  └─ ports (Storage, Haptics, Download, Navigation, PwaUpdate)
                      └─ adapters (localStorage, Browser APIs, Capacitor APIs)
```

- `domain` 只能包含純 TypeScript 規則與資料型別，不依賴 Svelte、DOM、`window` 或 Capacitor。
- `application` 組合 domain use case，負責狀態轉換與保存時機；不得直接讀寫 DOM。
- `components` 只處理呈現、事件與可存取性；不得自行修改 localStorage 或重複實作答題規則。
- `ports` 是可替換的介面。至少包含 `StoragePort`、`HapticsPort`、`DownloadPort`、`NavigationPort`、`PwaUpdatePort`、`ViewportPort`。
- `adapters` 提供瀏覽器實作；Capacitor 實作只能放在 adapter，不得滲入 domain/application。
- Svelte 5 component 使用 runes（`$state`、`$derived`、`$effect`）管理畫面區域狀態；跨畫面狀態由明確的 store/application service 提供，不建立無邊界的全域 reactive 變數。

### Capacitor 邊界

Capacitor 包裝 Vite `dist` 產物，Web 與原生共用 domain、application、components。只有下列能力可透過 port 替換：震動、檔案／分享下載、平台導覽、狀態列或安全區域、PWA 更新。若瀏覽器 API 已足夠，先使用 browser adapter；只有原生需求明確時才加入 Capacitor plugin。不上 SSR、不引入 SvelteKit，因為產品是本地狀態的純靜態 App。

### 資料相容性

保留 localStorage key `multiplication-practice-state` 及既有資料意義：`selected`、`records`、`quiz`、`theme`、`keypadPosition`。新增 schema version 與 migration 函式，但不得在首次重構時清除使用者資料。未知欄位忽略、缺少欄位補預設值、非法 theme/keypad position 安全降級。`errors/attempts` 的語意維持為累計錯誤次數／累計作答次數。

### 視覺與部署

既有 `--ds-*` design tokens、light/dark theme、safe-area、玻璃效果與固定／浮動鍵盤行為視為公開 UI 契約。Vite build 後的靜態資產仍由 `deploy.sh` 部署：`dev` 分支到 `dev.multiplication-table.pages.dev`，`main` 分支到正式網域。版本 query 與 Service Worker cache name 必須繼續由 commit hook 更新；不可使用沒有 branch 限制的部署指令。

## Alternatives Considered

### React + Vite

React 的 LLM 與套件資源最多，但需額外決定 router、state、form、effect 邊界，且本專案主要是本地互動狀態。資源量優勢不足以抵銷較高的架構選擇成本，因此不採用。

### Vue 3 + Vite

成熟且可行，但本次重構不以既有熟悉度作為決策依據；Svelte 的 component 邊界與編譯結果更適合這個小型、互動密集的靜態 App，因此不採用。

### SvelteKit

提供 routing、SSR 與 server features，但本產品不需要伺服器資料或 SSR；引入會增加部署與 runtime 邊界，故不採用。

### Vanilla TypeScript

依賴最少，但目前 `app.js` 已證明 DOM、狀態及事件耦合會持續膨脹。Svelte 提供較清楚的 component lifecycle，又可輸出靜態資產，因此不採用。

## Consequences

正面影響：domain 規則可在 Node/Vitest 中獨立驗證；畫面元件可拆分與維護；瀏覽器與 Capacitor adapter 可替換；既有 localStorage 與部署模型可延續；Playwright 可從使用者流程驗證 Web/PWA。

成本與風險：需要遷移兩個 HTML 頁面及大量 Tailwind/CSS class；Svelte 5 runes 與事件語法需固定專案慣例；Capacitor 建置需維護原生專案；Service Worker、快取與更新提示仍需瀏覽器測試。任何重構都必須以 legacy acceptance suite 與 migration data fixture 作為護欄。

## Open Questions

- 是否要在第一個原生版本加入檔案分享、狀態列控制或只保留 browser adapter，待 Capacitor smoke test 後決定。
- 是否將 Tailwind CDN 改為 Vite 內建 CSS pipeline；重構初期應優先保持既有 token 與視覺結果，再另立決策。
