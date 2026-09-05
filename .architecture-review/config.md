# config.md

## 核心目標／架構依據文件（依權威順序）

1. `docs/adr/0001-svelte-vite-architecture.md` —— Svelte/Vite 分層、ports/adapters、PWA 與狀態邊界。
2. `docs/specs/svelte-vite-migration.md` —— legacy parity、分階段移植與交付條件。
3. `docs/testing-strategy.md` —— Vitest、整合測試、Playwright 與 mobile/browser 驗證策略。
4. `index.html`, `app.js`, `design-tokens.css`, `pwa.css` —— legacy 可觀察 DOM、樣式與互動基準。

## 範圍樹

| 範圍 | 路徑 | 技術棧 | 與其他範圍的關係 |
|---|---|---|---|
| Legacy baseline | `index.html`, `app.js`, `design-tokens.css`, `pwa.css` | HTML/CSS/vanilla JS/Tailwind CDN | parity 的行為與 DOM 基準，不再作為新功能入口 |
| Home/selection | `src/routes/HomePage.svelte`, `src/components/SelectionGrid.svelte`, `src/components/ActionBar.svelte` | Svelte 5/CSS tokens | 使用 domain selection 與 storage/haptics/download/navigation ports |
| Quiz | `src/routes/QuizPage.svelte`, `src/components/QuizList.svelte`, `src/components/NumberKeypad.svelte` | Svelte 5/CSS tokens | 使用 quiz-session application 與 storage/navigation ports |
| Shared runtime | `src/App.svelte`, `src/components/UpdatePill.svelte`, `src/adapters/browser/*` | Svelte/Vite/browser APIs | 提供 PWA/update、theme、storage 與 navigation 邊界 |
| Domain/application | `src/domain/*`, `src/application/*`, `src/ports/*` | TypeScript | 不依賴 DOM；被 Home/Quiz 與 browser adapters 使用 |
| Verification | `tests/unit`, `tests/integration`, `tests/e2e` | Vitest/Testing Library/Playwright | 驗證 DOM、state、pointer/touch、responsive 與部署 build |

