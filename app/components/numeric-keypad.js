import { LitElement, html } from '../../vendor/lit-core.min.js';

const KEYS = [
    ['1', '1', 'secondary'],
    ['2', '2', 'secondary'],
    ['3', '3', 'secondary'],
    ['4', '4', 'secondary'],
    ['5', '5', 'secondary'],
    ['6', '6', 'secondary'],
    ['7', '7', 'secondary'],
    ['8', '8', 'secondary'],
    ['9', '9', 'secondary'],
    ['backspace', '⌫', 'accent', '刪除最後一個數字'],
    ['0', '0', 'secondary'],
    ['next', '↵', 'success', '前往下一題'],
];

const TONE_CLASSES = {
    secondary: 'ds-secondary',
    accent: 'ds-accent',
    success: 'ds-success',
};

export class NumericKeypad extends LitElement {
    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <button id="close-keypad" type="button" class="keypad-close" aria-label="關閉數字鍵盤">×</button>
            <div id="keypad-handle" class="floating-keypad-handle" aria-label="拖曳移動數字鍵盤">
                <span aria-hidden="true">⠿</span><span class="ml-2 text-xs font-semibold">拖曳鍵盤</span>
            </div>
            <div class="numeric-pad mx-auto max-w-2xl">
                ${KEYS.map(([value, label, tone, ariaLabel]) => html`
                    <button type="button" data-pad-value="${value}" class="${TONE_CLASSES[tone]} rounded-lg border py-1.5 text-base font-semibold transition active:scale-95" aria-label=${ariaLabel || null}>${label}</button>
                `)}
            </div>`;
    }
}

customElements.define('app-keypad', NumericKeypad);
