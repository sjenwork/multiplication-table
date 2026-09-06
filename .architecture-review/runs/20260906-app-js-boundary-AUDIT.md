# `app.js` Boundary Audit

## 1. 狀態／範圍／方法

- 分支：`dev`
- 檔案：`app.js`（961 行）
- 依據：`README.md`、`docs/multiplication-practice-spec.md`
- 方法：依 function 邊界、DOM ownership、頁面生命週期、跨頁共用程度與可測試性盤點；本輪只分析，不重構。

## 2. 結論

`app.js` 已經超過「單一應用入口」的合理責任範圍，但不是因為 961 行本身必然不可接受。真正的問題是同一個 IIFE 同時持有 shared state、首頁選題、測驗答題、數字鍵盤、設定／匯出、PWA update 與 bootstrap。

目前仍可運作，但下一個較大的功能若繼續堆入這個檔案，會讓 DOM 依賴、事件註冊與狀態修改互相纏繞；建議在下一個功能前分割，而不是等到出現 bug 才拆。

## 3. Finding

### REV-20260906-05：`app.js` 混合五個可獨立演進的責任邊界

- 共用 state／theme／question helpers：`app.js:32-116`
- 首頁 selection gesture、table rendering、quiz launch：`app.js:125-363`
- quiz rendering、answer flow、completion overlay：`app.js:364-376`、`app.js:586-778`、`app.js:866-880`
- keypad layout／drag／dock：`app.js:377-585`
- settings、export、service-worker update：`app.js:792-907`
- page bootstrap：`app.js:908-961`

這些區塊都直接讀寫 `document`，並透過同一個 IIFE 的私有函式互相呼叫；因此目前缺少可獨立替換或單元測試的 module boundary。`app.js` 也同時被 `index.html` 與 `quiz.html` 載入，但兩頁只各自使用其中一部分邏輯。

## 4. 建議拆分方式

不要把每個 function 拆成一個檔案；建議先做 5 個垂直邊界：

1. `app/state.js`：`newState`、`loadState`、`saveState`、`applyTheme`、`questionList`、`shuffled`。
2. `app/home.js`：selection gesture、table render、selection status 與進入 quiz。
3. `app/quiz.js`：quiz render、答題、完成提示與 quiz lifecycle。
4. `app/keypad.js`：keypad position、drag、dock、close 與 scroll reserve。
5. `app/settings.js` + `app/update.js`：settings template／匯出／主題選擇，以及 PWA update flow。

入口只保留 `bootstrap.js`：讀取 state、辨識頁面、呼叫對應 initializer。第一步應先抽不直接碰 DOM 的 state／question helpers，風險最低；之後再抽 keypad，因為它目前是最大的互動專區。

## 5. 不建議的做法

- 不要按 function 數量逐檔拆分。
- 不要為了拆檔引入新 framework；目前 static PWA 使用原生 ES modules 即可。
- 不要一開始同時重寫 state shape、DOM markup 與事件流程；拆分應保持行為不變。

## 6. 驗收標準

- 首頁與測驗頁仍可正常初始化，且只註冊各自需要的 listeners。
- 每個 module 的公開函式邊界清楚，bootstrap 不再依賴 IIFE 內的隱式共享。
- state／question helpers 可在沒有 DOM 的情況下測試。
- `sw.js` 與兩個 HTML 的 module URLs 都被 cache-busting／app shell 正確納入。

## 7. 優先級

中優先。不是立即生產阻塞，但應在下一個中型功能前處理；若只是修小型樣式或文字，不需要先拆完整。
