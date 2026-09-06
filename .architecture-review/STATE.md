# Architecture Review State

最後更新：2026-09-06

## 範圍進度

| 範圍 | 狀態 | 最後執行 | 檔案數 | 產出 |
| --- | --- | --- | --- | --- |
| Static UI style consistency | completed | 2026-09-06 | 6 | `runs/20260906-static-ui-style-AUDIT.md` |
| `app.js` module boundaries | completed | 2026-09-06 | 1 | `runs/20260906-app-js-boundary-AUDIT.md` |
| Style hardcode and theme boundary | completed | 2026-09-06 | 10 | `runs/20260906-style-hardcode-AUDIT.md` |

## 下一步建議動作

1. 先依 `REV-20260906-07` 建立 semantic text/input/focus classes，並分批遷移 theme-sensitive raw palette。
2. 獨立處理 `REV-20260906-08` confetti palette 與 `REV-20260906-09` scrim/shadow fallback。
3. 清洗後在 dev 做 light/dark、首頁／測驗頁 smoke check，再處理 `REV-20260906-06` theme-color source consolidation。

## 還沒修復的高優先發現（open findings）

- `REV-20260906-05`：`app.js` 應在下一個中型功能前分割；目前不要求立即重構。
- `REV-20260906-06`：theme-color source 重複，尚未清洗。
- `REV-20260906-07`：theme-sensitive raw palette，尚未清洗。
- `REV-20260906-08`：confetti palette，尚未清洗。
- `REV-20260906-09`：scrim/shadow fallback，尚未清洗。
- `REV-20260906-10`：layer/effect 數值，排在色彩清洗後。

## 已關閉（不需要動作）

- modal scrim 與 modal surface：已由 `474cf2b` 統一。
- `REV-20260906-01`：由 `cb4a82b` 修正 semantic status classes 與 theme tokens。
- `REV-20260906-02`：由 `3813ed4` 修正跨頁 action hierarchy 與 action bar visual duplication。
- `REV-20260906-03`：由 `adf2b7c` 抽出 interactive visual tokens。
- `REV-20260906-04`：由 `56f1f01` 將 settings modal markup 集中到 `app.js` template。
