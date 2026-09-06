import { LitElement, html } from '../../vendor/lit-core.min.js';

export class FactorLegend extends LitElement {
    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <div class="factor-legend flex items-center justify-center gap-1.5" aria-label="題目順序：被乘數乘以乘數">
                <span class="ds-factor-one">被乘數</span>
                <span aria-hidden="true">×</span>
                <span class="ds-factor-two">乘數</span>
            </div>`;
    }
}

customElements.define('factor-legend', FactorLegend);
