# Bin 01：Style system 逐檔盤點

## `design-tokens.css`

- 已檢視，已集中定義 canvas、surface、modal、brand、status、border、shadow、radius、spacing 與 light/dark values。
- `REV-20260906-01`：dark mode override 只覆蓋部分 raw Tailwind classes；semantic token 尚未完全成為頁面唯一入口（佐證：`design-tokens.css:221-250`）。
- `REV-20260906-03`：部分頁面專屬 RGB/hex 狀態色沒有對應 token/class（對照 `quiz.html:81-115`、`299-308`）。

## `pwa.css`

- 已檢視，提供 app shell 與 safe-area layout；`safe-action-bar`／`safe-keypad` 使用共用 surface token。
- `REV-20260906-02`：測驗頁 action bar 另外疊加 visual utilities，與 `pwa.css`／首頁 action bar 的視覺 contract 不完全一致（佐證：`pwa.css:29-37`、`index.html:58`、`quiz.html:406`）。

## `theme-init.js`

- 已檢視，主題初始化集中且與 `data-theme` contract 一致，無顯著問題。
