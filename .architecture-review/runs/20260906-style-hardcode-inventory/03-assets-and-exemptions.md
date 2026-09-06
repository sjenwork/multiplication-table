# Bin 03：Assets、metadata 與合理例外

## `manifest.webmanifest`、HTML `meta[name="theme-color"]`

- `#f4fbff` 是 PWA metadata 的 light default，屬於必要的靜態 fallback；但應在文件中明確標示它必須與 theme-color contract 同步。
- manifest 無法隨使用者主題即時切換，因此不應為了消除字面值而引入複雜 build step。

## `icons/icon.svg`

- SVG logo 中的品牌色是資產本身的繪圖資料，不應硬抽成 CSS token；若品牌色變更，應以 asset review 處理。

## Tailwind spacing、尺寸與動畫數值

- `p-*`、`gap-*`、`rounded-*`、responsive width 與 confetti animation delay/position 不全部視為問題。這些是布局或動畫參數，抽成 token 只有在跨元件重複或需要主題化時才有價值。
- 建議清洗規則：先消除重複的色彩／surface／border／shadow／focus；保留單一元件內有意義的幾何與動畫參數。
