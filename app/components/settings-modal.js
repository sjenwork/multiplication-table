import { LitElement, html } from '../../vendor/lit-core.min.js';
import './app-modal.js?v=20260906-112744';

export class SettingsModal extends LitElement {
    static properties = {
        open: { type: Boolean },
        theme: { type: String },
    };

    constructor() {
        super();
        this.open = false;
        this.theme = 'light';
    }

    createRenderRoot() {
        return this;
    }

    show() {
        this.open = true;
    }

    hide() {
        this.open = false;
    }

    chooseTheme(theme) {
        this.theme = theme;
        this.dispatchEvent(new CustomEvent('theme-change', { detail: { theme }, bubbles: true }));
    }

    render() {
        return html`
            <app-modal .open=${this.open} size="md" labelledby="settings-title">
                    <div class="flex items-center justify-between gap-4">
                        <h2 id="settings-title" class="text-lg font-bold text-slate-800">設定</h2>
                        <button data-modal-close type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100" aria-label="關閉設定">×</button>
                    </div>
                    <p class="mt-2 text-sm leading-6 text-slate-600">管理你的練習資料與成績統計。</p>
                    <div class="mt-5 space-y-3">
                        <div>
                            <p class="mb-2 text-sm font-semibold text-slate-700">顯示主題</p>
                            <div class="grid grid-cols-2 gap-2" role="group" aria-label="選擇顯示主題">
                                ${this.themeButton('light', '☀️ 明亮')}
                                ${this.themeButton('dark', '🌙 深色')}
                            </div>
                        </div>
                        <button data-export type="button" class="ds-secondary w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition">匯出成績統計紀錄（CSV）</button>
                        <button data-clear type="button" class="ds-danger w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition">清除所有練習紀錄</button>
                    </div>
            </app-modal>`;
    }

    themeButton(theme, label) {
        return html`<button type="button" data-theme-choice="${theme}" aria-pressed="${this.theme === theme}" class="ds-theme-choice ds-secondary rounded-lg border px-4 py-3 text-sm font-semibold transition">${label}</button>`;
    }

    firstUpdated() {
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-theme-choice]')) this.chooseTheme(event.target.closest('[data-theme-choice]').dataset.themeChoice);
            if (event.target.closest('[data-export]')) this.dispatchEvent(new CustomEvent('export-records', { bubbles: true }));
            if (event.target.closest('[data-clear]')) this.dispatchEvent(new CustomEvent('clear-records', { bubbles: true }));
        });
        this.addEventListener('modal-close', () => { this.open = false; });
    }
}

customElements.define('app-settings-modal', SettingsModal);
