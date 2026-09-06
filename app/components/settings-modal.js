import { LitElement, html } from '../../vendor/lit-core.min.js';
import './app-modal.js?v=20260906-160835';
import './app-button.js?v=20260906-160835';

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
                        <h2 id="settings-title" class="ds-text-strong text-lg font-bold">設定</h2>
                        <app-button data-modal-close size="sm" class="ds-text-muted h-8 w-8 rounded-full px-0 text-xl" aria-label="關閉設定">×</app-button>
                    </div>
                    <p class="ds-text-muted mt-2 text-sm leading-6">管理你的練習資料與成績統計。</p>
                    <div class="mt-5 space-y-3">
                        <div>
                            <p class="ds-text mb-2 text-sm font-semibold">顯示主題</p>
                            <div class="grid grid-cols-2 gap-2" role="group" aria-label="選擇顯示主題">
                                ${this.themeButton('light', '☀️ 明亮')}
                                ${this.themeButton('dark', '🌙 深色')}
                            </div>
                        </div>
                        <app-button data-export variant="secondary" size="lg" full class="justify-start text-left">匯出成績統計紀錄（CSV）</app-button>
                        <app-button data-clear variant="danger" size="lg" full class="justify-start text-left">清除所有練習紀錄</app-button>
                    </div>
            </app-modal>`;
    }

    themeButton(theme, label) {
        return html`<app-button data-theme-choice="${theme}" variant="secondary" full aria-pressed="${this.theme === theme}" class="ds-theme-choice">${label}</app-button>`;
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
