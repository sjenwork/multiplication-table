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
            <div class="study-equation-sheet ds-surface border rounded-2xl p-4 sm:p-5">
                <div class="study-equation-list" role="list" aria-label="${this.factor} 的乘法表">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => html`
                        <div class="study-equation" role="listitem">
                            <span class="ds-factor-one">${this.factor}</span>
                            <span aria-hidden="true">×</span>
                            <span class="ds-factor-two">${row}</span>
                            <span aria-hidden="true">=</span>
                            <strong class="study-answer">${this.factor * row}</strong>
                        </div>`)}
                </div>
            </div>`;
    }
}

customElements.define('multiplication-table', MultiplicationTable);
