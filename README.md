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
2. 執行 `git commit`；`.githooks/pre-commit` 會自動更新 `app.js` 的版本 query 與 Service Worker cache name。
3. 執行 `./deploy.sh` 部署測試版。
4. 確認測試版無誤後，將 `dev` 合併到 `main`。
5. 在 `main` 執行 `./deploy.sh`，才會更新正式版。

部署前不要直接使用沒有 `--branch` 的 Wrangler 指令，也不要從其他分支部署。
