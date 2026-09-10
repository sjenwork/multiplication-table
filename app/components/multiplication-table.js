import { LitElement, html, nothing } from '../../vendor/lit-core.min.js';

export class MultiplicationTable extends LitElement {
    static properties = {
        factor: { type: Number },
        gender: { type: String },
        activeRow: { type: Number },
        isPlaying: { type: Boolean },
        playbackMode: { type: String },
        isPaused: { type: Boolean },
    };

    constructor() {
        super();
        this.factor = 2;
        this.gender = 'female';
        this.activeRow = null;
        this.isPlaying = false;
        this.playbackMode = 'idle';
        this.isPaused = false;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-toggle-playback]')) {
                this.dispatchEvent(new CustomEvent('toggle-playback', { bubbles: true }));
                return;
            }
            const questionButton = event.target.closest('[data-play-question]');
            if (questionButton) {
                const multiplier = Number(questionButton.dataset.playQuestion);
                const eventName = this.playbackMode === 'question' && this.activeRow === multiplier ? 'toggle-playback' : 'play-question';
                this.dispatchEvent(new CustomEvent(eventName, { detail: { factor: this.factor, multiplier }, bubbles: true }));
                return;
            }
            if (event.target.closest('[data-play-factor]')) {
                const eventName = this.playbackMode === 'factor' ? 'toggle-playback' : 'play-factor';
                this.dispatchEvent(new CustomEvent(eventName, { detail: { factor: this.factor }, bubbles: true }));
                return;
            }
            if (event.target.closest('[data-play-all]')) {
                const eventName = this.playbackMode === 'all' ? 'toggle-playback' : 'play-all';
                this.dispatchEvent(new CustomEvent(eventName, { bubbles: true }));
                return;
            }
            if (event.target.closest('[data-stop-playback]')) this.dispatchEvent(new CustomEvent('stop-playback', { bubbles: true }));
        });
    }

    render() {
        return html`
            <div class="study-equation-sheet ds-surface border rounded-2xl p-4 sm:p-5">
                <div class="study-table-heading">
                    <span class="ds-text-muted text-sm font-semibold">${this.factor} 的乘法表</span>
                    <div class="study-table-actions" role="group" aria-label="播放控制">
                        ${this.playbackMode === 'factor' ? toggleButton(this.isPaused) : html`<button type="button" class="study-play-button" data-play-factor aria-label="播放${this.factor}的乘法表" title="播放${this.factor}的乘法表">${playIcon()}</button>`}
                        ${this.playbackMode === 'all' ? toggleButton(this.isPaused) : html`<button type="button" class="study-play-button study-play-all" data-play-all aria-label="全部播放" title="全部播放">${playAllIcon()}</button>`}
                        ${this.playbackMode !== 'idle' ? html`<button type="button" class="study-play-button study-stop-button" data-stop-playback aria-label="停止播放" title="停止播放">${stopIcon()}</button>` : nothing}
                    </div>
                </div>
                <div class="study-equation-list" role="list" aria-label="${this.factor} 的乘法表">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => html`
                        <div class="study-equation ${this.activeRow === row ? 'study-equation-active' : ''}" role="listitem">
                            <span class="ds-factor-one">${this.factor}</span>
                            <span aria-hidden="true">×</span>
                            <span class="ds-factor-two">${row}</span>
                            <span aria-hidden="true">=</span>
                            <strong class="study-answer">${this.factor * row}</strong>
                            <button type="button" class="study-play-button study-question-play" data-play-question="${row}" aria-label="${this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? '繼續播放' : '暫停播放') : `播放${this.factor}乘${row}`}" title="${this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? '繼續播放' : '暫停播放') : `播放${this.factor}乘${row}`}" >${this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? playIcon() : pauseIcon()) : playIcon()}</button>
                        </div>`)}
                </div>
            </div>`;
    }
}

function playIcon() {
    return html`<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
}

function playAllIcon() {
    return html`<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`;
}

function pauseIcon() {
    return html`<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
}

function stopIcon() {
    return html`<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"></rect></svg>`;
}

function toggleButton(isPaused) {
    const text = isPaused ? '繼續播放' : '暫停播放';
    return html`<button type="button" class="study-play-button" data-toggle-playback aria-label="${text}" title="${text}">${isPaused ? playIcon() : pauseIcon()}</button>`;
}

customElements.define('multiplication-table', MultiplicationTable);
