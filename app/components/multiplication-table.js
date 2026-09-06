import { LitElement, html } from '../../vendor/lit-core.min.js';

export class MultiplicationTable extends LitElement {
    static properties = {
        factor: { type: Number },
    };

    constructor() {
        super();
        this.factor = 2;
    }

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <section class="study-table-card ds-surface rounded-2xl p-3 sm:p-4" aria-labelledby="study-table-title">
                <div class="mb-3 flex items-center justify-between gap-3 px-2">
                    <h2 id="study-table-title" class="ds-text-strong text-lg font-bold sm:text-xl">${this.factor} 的乘法表</h2>
                    <span class="ds-brand-text text-sm font-semibold">乘法表</span>
                </div>
                <div class="study-equation-list" role="list" aria-label="${this.factor} 的乘法表">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => html`
                        <div class="study-equation ds-surface-muted" role="listitem">
                            <span class="study-factor">${this.factor}</span>
                            <span aria-hidden="true">×</span>
                            <span>${row}</span>
                            <span aria-hidden="true">=</span>
                            <strong class="study-answer">${this.factor * row}</strong>
                        </div>`)}
                </div>
            </section>`;
    }
}

customElements.define('multiplication-table', MultiplicationTable);
