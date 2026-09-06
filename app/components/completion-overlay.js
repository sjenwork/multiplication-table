import { LitElement, html } from '../../vendor/lit-core.min.js';

export class CompletionOverlay extends LitElement {
    static properties = {
        visible: { type: Boolean },
        correctCount: { type: Number },
        total: { type: Number },
    };

    constructor() {
        super();
        this.visible = false;
        this.correctCount = 0;
        this.total = 0;
        this.classList.add('completion-overlay', 'hidden');
    }

    createRenderRoot() {
        return this;
    }

    show(correctCount, total) {
        this.correctCount = correctCount;
        this.total = total;
        this.visible = true;
        this.classList.remove('hidden');
    }

    hide() {
        this.visible = false;
        this.classList.add('hidden');
    }

    render() {
        const ratio = this.total ? this.correctCount / this.total : 0;
        const result = ratio === 1
            ? { title: '你好棒！', detail: '全部答對，你做到了！', emoji: '🎉', tone: 'score-high' }
            : ratio >= 0.8
                ? { title: '太棒了！', detail: `答對 ${this.correctCount} 題，再把錯題練熟就更厲害！`, emoji: '🌟', tone: 'score-good' }
                : ratio >= 0.5
                    ? { title: '做得很好！', detail: `答對 ${this.correctCount} 題，錯題再挑戰一次！`, emoji: '💪', tone: 'score-steady' }
                    : { title: '繼續加油！', detail: `答對 ${this.correctCount} 題，一題一題來，你可以的！`, emoji: '🌱', tone: 'score-keep-going' };
        return html`
            <div class="completion-confetti" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="completion-card ${result.tone}">
                <button data-close type="button" class="completion-close" aria-label="關閉完成提示">×</button>
                <div class="completion-emoji" aria-hidden="true">${result.emoji}</div>
                <h2 class="mt-2 text-xl font-black text-blue-700">${result.title}</h2>
                <p class="mt-1 text-sm font-semibold text-slate-600">${result.detail}</p>
            </div>`;
    }

    firstUpdated() {
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-close]')) this.hide();
        });
        const card = this.querySelector('.completion-card');
        let startX = null;
        let startY = null;
        card?.addEventListener('pointerdown', (event) => { startX = event.clientX; startY = event.clientY; });
        card?.addEventListener('pointerup', (event) => {
            if (startX === null || startY === null) return;
            const distanceX = event.clientX - startX;
            const distanceY = event.clientY - startY;
            if (Math.abs(distanceX) >= 56 && Math.abs(distanceX) > Math.abs(distanceY)) this.hide();
            startX = null;
            startY = null;
        });
        card?.addEventListener('pointercancel', () => { startX = null; startY = null; });
    }
}

customElements.define('app-completion-overlay', CompletionOverlay);
