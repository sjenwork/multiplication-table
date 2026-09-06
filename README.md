# Multiplication Table

純靜態的 99 乘法表練習 PWA，部署在 Cloudflare Pages。

## 部署規則

本專案使用 Cloudflare Pages Direct Upload，不使用 GitHub Actions，也不是由 GitHub push 自動部署。GitHub 僅用於版本控制。

部署前請確認 Cloudflare Wrangler 已登入，且目前分支內容已提交。執行：

```bash
./deploy.sh
```

部署腳本會依目前分支決定目標：

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
2. 執行 `git commit`；`.githooks/pre-commit` 會自動以「日期＋時間」同步更新所有前端 CSS/JS 資源的版本 query，以及 Service Worker cache name。新版本會先等待使用者按下更新膠囊，確認後才切換。
3. 執行 `./deploy.sh` 部署測試版。
4. 確認測試版無誤後，將 `dev` 合併到 `main`。
5. 在 `main` 執行 `./deploy.sh`，才會更新正式版。

部署前不要直接使用沒有 `--branch` 的 Wrangler 指令，也不要從其他分支部署。

### 驗證防線

Git hooks 位於 `.githooks/`，目前的 `core.hooksPath` 指向這個目錄：

- `pre-commit`：同步前端資源版本，檢查所有 JavaScript 語法、相對 import、Service Worker app shell 與 whitespace diff。
- `pre-push`：重跑靜態檢查與 Node 行為測試；設定 `SMOKE_URL` 時，另外用 headless Chrome 驗證首頁選題、設定 modal 與 quiz 啟動。
- `deploy.sh`：部署前一定執行靜態檢查；部署後可用 `RUN_BROWSER_SMOKE=1 ./deploy.sh` 執行實際網址 smoke test。

測試可單獨執行：

```bash
./scripts/test.sh
```

若 Git 沒有套用 hooks，可執行：

```bash
git config core.hooksPath .githooks
```

## Design System 與主題

共用視覺 token 集中在 `design-tokens.css`，包含畫布、表面、文字、品牌色、狀態色、邊框、陰影、圓角與間距。不要在新元件中新增散落的 raw color；優先使用 `--ds-*` token 或既有 `.ds-*` 語意 class。

主題使用 `data-theme="light|dark"`，由 `theme-init.js` 在頁面繪製前初始化，並由 `app.js` 將選擇保存到 localStorage。主題切換入口位於首頁「設定」。
