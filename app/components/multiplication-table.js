import { LitElement, html } from '../../vendor/lit-core.min.js';

export class MultiplicationTable extends LitElement {
    static properties = {
        factor: { type: Number },
        gender: { type: String },
        activeRow: { type: Number },
        isPlaying: { type: Boolean },
        playbackMode: { type: String },
        isPaused: { type: Boolean },
        autoPlay: { type: Boolean },
    };

    constructor() {
        super();
        this.factor = 2;
        this.gender = 'female';
        this.activeRow = null;
        this.isPlaying = false;
        this.playbackMode = 'idle';
        this.isPaused = false;
        this.autoPlay = true;
        this.stackAnimation = null;
        this.stackAnimationTimer = null;
        this.stackAnimationToken = 0;
    }

    willUpdate(changedProperties) {
        if (!changedProperties.has('factor')) return;
        const previousFactor = changedProperties.get('factor');
        if (previousFactor === undefined || previousFactor === this.factor) return;
        this.startStackAnimation(previousFactor, this.factor);
    }

    startStackAnimation(previousFactor, nextFactor) {
        if (this.stackAnimationTimer) window.clearTimeout(this.stackAnimationTimer);
        const direction = nextFactor > previousFactor ? 'forward' : 'backward';
        const factors = direction === 'forward'
            ? Array.from({ length: nextFactor - previousFactor }, (_, index) => previousFactor + index)
            : Array.from({ length: previousFactor - nextFactor }, (_, index) => nextFactor + index);
        const token = ++this.stackAnimationToken;
        this.stackAnimation = { direction, factors };
        this.requestUpdate();
        this.stackAnimationTimer = window.setTimeout(() => {
            if (token !== this.stackAnimationToken) return;
            this.stackAnimation = null;
            this.stackAnimationTimer = null;
            this.requestUpdate();
        }, 390);
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
            if (event.target.closest('[data-auto-play]')) {
                this.dispatchEvent(new CustomEvent('toggle-auto-play', { bubbles: true }));
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

    renderEquationPage(factor, interactive) {
        return html`
            <div class="study-equation-page study-equation-list" role="list" aria-label="${factor} 的乘法表" ?aria-hidden=${!interactive}>
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => html`
                    <div class="study-equation ${interactive && this.activeRow === row ? 'study-equation-active' : ''}" role="listitem">
                        <span class="ds-factor-one">${factor}</span>
                        <span aria-hidden="true">×</span>
                        <span class="ds-factor-two">${row}</span>
                        <span aria-hidden="true">=</span>
                        <strong class="study-answer">${factor * row}</strong>
                        <button type="button" class="study-play-button study-question-play" data-play-question="${row}" aria-label="${interactive && this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? '繼續播放' : '暫停播放') : `播放${factor}乘${row}`}" title="${interactive && this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? '繼續播放' : '暫停播放') : `播放${factor}乘${row}`}" ?disabled=${!interactive} tabindex=${interactive ? '0' : '-1'}>${interactive && this.playbackMode === 'question' && this.activeRow === row ? (this.isPaused ? playIcon() : pauseIcon()) : playIcon()}</button>
                    </div>`)}
            </div>`;
    }

    render() {
        return html`
            <div class="study-equation-sheet ds-surface border rounded-2xl p-4 sm:p-5">
                <div class="study-table-heading">
                    <span class="ds-text-muted text-sm font-semibold">${this.factor} 的乘法表</span>
                    <div class="study-table-actions" role="group" aria-label="播放控制">
                        ${this.playbackMode === 'factor' ? toggleButton(this.isPaused) : html`<button type="button" class="study-play-button" data-play-factor aria-label="播放${this.factor}的乘法表" title="播放${this.factor}的乘法表">${playIcon()}</button>`}
                        ${this.playbackMode === 'all' ? toggleButton(this.isPaused) : html`<button type="button" class="study-play-button study-play-all" data-play-all aria-label="全部播放" title="全部播放">${playAllIcon()}</button>`}
                        <button type="button" class="study-play-button study-stop-button" data-stop-playback aria-label="停止播放" title="停止播放" ?disabled=${this.playbackMode === 'idle'}>${stopIcon()}</button>
                        <button type="button" class="study-auto-play-button ${this.autoPlay ? 'study-auto-play-active' : ''}" data-auto-play aria-label="自動播放${this.autoPlay ? '已開啟' : '已關閉'}" title="自動播放${this.autoPlay ? '已開啟' : '已關閉'}" aria-pressed="${this.autoPlay}"><span aria-hidden="true">↻</span><span>自動</span></button>
                    </div>
                </div>
                <div class="study-equation-stage">
                    <div class="study-equation-stack" data-current-factor="${this.factor}">
                        ${[2, 3, 4, 5, 6, 7, 8, 9].map((factor) => html`
                            <div class="study-stack-card ${factor === this.factor ? 'study-stack-card-current' : ''} ${factor < this.factor ? 'study-stack-card-extracted' : ''} ${this.stackAnimation?.factors.includes(factor) ? 'study-stack-card-moving' : ''}" data-stack-factor="${factor}" style="--stack-factor: ${factor};">
                                ${this.renderEquationPage(factor, factor === this.factor)}
                            </div>`)}
                    </div>
                    ${this.stackAnimation ? html`
                        <div class="study-moving-stack study-moving-stack-${this.stackAnimation.direction}" aria-hidden="true">
                            ${this.stackAnimation.factors.map((factor) => html`
                                <div class="study-moving-card" data-moving-factor="${factor}" style="--stack-factor: ${factor};">
                                    ${this.renderEquationPage(factor, false)}
                                </div>`)}
                        </div>` : ''}
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
