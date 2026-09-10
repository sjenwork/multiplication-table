# Architecture Review State

最後更新：2026-09-06

## 範圍進度

| 範圍 | 狀態 | 最後執行 | 檔案數 | 產出 |
| --- | --- | --- | --- | --- |
| Static UI style consistency | completed | 2026-09-06 | 6 | `runs/20260906-static-ui-style-AUDIT.md` |
| `app.js` module boundaries | completed | 2026-09-06 | 1 | `runs/20260906-app-js-boundary-AUDIT.md` |
| Style hardcode and theme boundary | completed | 2026-09-06 | 10 | `runs/20260906-style-hardcode-AUDIT.md` |

## 下一步建議動作

1. 在 dev 做 light/dark、首頁／測驗頁的真實瀏覽器 smoke check。
2. 維持 style contract test，避免新元件重新引入 raw palette。
3. 之後若要繼續重構，優先處理 `REV-20260906-05` 的 state／question helper 邊界。

## 還沒修復的高優先發現（open findings）

- `REV-20260906-05`：`app.js` 應在下一個中型功能前分割；目前不要求立即重構。

## 已關閉（不需要動作）

- modal scrim 與 modal surface：已由 `474cf2b` 統一。
- `REV-20260906-01`：由 `cb4a82b` 修正 semantic status classes 與 theme tokens。
- `REV-20260906-02`：由 `3813ed4` 修正跨頁 action hierarchy 與 action bar visual duplication。
- `REV-20260906-03`：由 `adf2b7c` 抽出 interactive visual tokens。
- `REV-20260906-04`：由 `56f1f01` 將 settings modal markup 集中到 `app.js` template。
- `REV-20260906-06`：由 `c5e0f2f` 集中 theme-color runtime source，保留 metadata 的 light default。
- `REV-20260906-07`：由 `c5e0f2f` 遷移 theme-sensitive raw palette 至 semantic classes，並新增 style contract test。
- `REV-20260906-08`：由 `c5e0f2f` 將 confetti palette 移至 design tokens。
- `REV-20260906-09`：由 `c5e0f2f` 統一 scrim、keypad shadow 與 input/focus visual tokens。
- `REV-20260906-10`：由 `4e6e310` 命名 layer 與 blur tokens，移除頁面散落的 stacking/effect 數值。
