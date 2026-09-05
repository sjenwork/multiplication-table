# Multiplication Table

純靜態的 99 乘法表練習 PWA，部署在 Cloudflare Pages。

## 部署規則

本專案使用 Cloudflare Pages Direct Upload，不使用 GitHub Actions，也不是由 GitHub push 自動部署。GitHub 僅用於版本控制。部署內容固定為 `npm run build` 產生的 `dist/`，不部署 repository root。

部署前請確認 Cloudflare Wrangler 已登入，且目前分支內容已提交。執行：

```bash
./deploy.sh
```

部署腳本會先執行 `npm run build`，再依目前分支決定目標：

| Git 分支 | 部署環境 | 網址 |
| --- | --- | --- |
| `dev` | 測試版 | https://dev.multiplication-table.pages.dev |
| `main` | 正式版 | https://multiplication-table.maderaojen.me |

其他分支禁止部署。正式分支名稱是 `main`，不是 `master`。

## DNS

測試版使用 Cloudflare Pages branch alias，不需要新增 DNS、CNAME 或自訂網域設定。正式版目前使用既有的 `multiplication-table.maderaojen.me`。

不要把 `dev.multiplication-table.pages.dev` 設定成 `maderaojen.me` 的 DNS 紀錄。

## 開發流程

1. 從 `dev` 分支修改與測試。
2. 執行 `npm run check`、`npm test -- --run`、`npm run build` 驗證。
3. 執行 `git commit`；`.githooks/pre-commit` 以「日期＋時間」注入本次 build 的 Service Worker cache version，不修改 tracked source，也不把 `dist/` 加入 staging。
4. 執行 `./deploy.sh`；腳本只接受 `dev` 或 `main`，並部署最新 `dist/`。
5. 確認 `dev` 後再合併至 `main`，再從 `main` 部署正式版。

部署前不要直接使用沒有 `--branch` 的 Wrangler 指令，也不要從其他分支部署。

## Design System 與主題

共用視覺 token 集中在 `design-tokens.css`，包含畫布、表面、文字、品牌色、狀態色、邊框、陰影、圓角與間距。不要在新元件中新增散落的 raw color；優先使用 `--ds-*` token 或既有 `.ds-*` 語意 class。

主題使用 `data-theme="light|dark"`，由 `theme-init.js` 在頁面繪製前初始化，並由 `app.js` 將選擇保存到 localStorage。主題切換入口位於首頁「設定」。

## Svelte/Vite 與 PWA

新架構使用 Svelte 5 + Vite + TypeScript：

```bash
npm run dev
npm run check
npm test -- --run
npm run build
```

Vite 使用 `src/index.html` 與 `src/quiz.html` 多頁 entry，輸出 `dist/index.html`、`dist/quiz.html`。`src/pwa/` 是 manifest、Service Worker 與 icons 的新架構 source；Vite build plugin 會把它們輸出至 `dist/`，不依賴 legacy root 的 PWA 檔案。Service Worker cache name 使用 `YYYYMMDD-HHMMSS` 版本；偵測到 waiting worker 才顯示更新 capsule，使用者點擊後才送出 `SKIP_WAITING` 並由 controller change reload。

部署前必須確認 branch 為 `dev` 或 `main` 且 tracked changes clean；`node_modules/`、`dist/`、`coverage/` 與測試報告均不應阻擋 clean check。
