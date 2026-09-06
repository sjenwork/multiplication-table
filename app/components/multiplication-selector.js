import { LitElement, html } from '../../vendor/lit-core.min.js';

export class MultiplicationSelector extends LitElement {
    static properties = {
        questions: { type: Array },
        selected: { type: Array },
        records: { type: Object },
    };

    constructor() {
        super();
        this.questions = [];
        this.selected = [];
        this.records = {};
    }

    createRenderRoot() {
        return this;
    }

    render() {
        const selected = new Set(this.selected);
        const keys = this.questions.map((question) => question.key);
        const keysFor = (type, value) => type === 'row'
            ? keys.filter((key) => key.startsWith(`${value}x`))
            : keys.filter((key) => key.endsWith(`x${value}`));
        const headerTone = (groupKeys) => groupKeys.some((key) => selected.has(key)) ? 'ds-table-header is-selected' : 'ds-table-header';
        const selector = (type, value, label, tone, content) => html`
            <th class="ds-text-strong sticky ${type === 'row' ? 'ds-layer-table-row left-0' : 'ds-layer-table-header top-0'} p-2 font-bold border ${tone} rounded-lg text-sm md:text-base" scope="${type === 'row' ? 'row' : 'col'}">
                <label class="ds-focusable flex flex-col items-center justify-center gap-1 cursor-pointer rounded">
                    <span>${content}</span>
                    <input type="checkbox" class="sr-only" data-select-all="${type}" data-${type === 'all' ? 'all' : type}="${value || ''}" aria-label="${label}">
                </label>
            </th>`;
        return html`
            <table class="w-full min-w-[650px] table-fixed border-separate border-spacing-1 text-center">
                <thead><tr>
                    ${selector('all', '', '全選所有題目', headerTone(keys), html`<span class="text-[0.65rem] leading-none"><span class="ds-factor-one">被</span><span aria-hidden="true">＼</span><span class="ds-factor-two">乘</span></span>`)}
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => selector('column', col, `選擇第 ${col} 欄`, headerTone(keysFor('column', col)), html`<span class="ds-factor-two">${col}</span>`))}
                </tr></thead>
                <tbody>
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => html`
                        <tr>
                            ${selector('row', row, `選擇第 ${row} 列`, headerTone(keysFor('row', row)), html`<span class="ds-factor-one">${row}</span>`)}
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
                                const key = `${row}x${col}`;
                                const record = this.records[key];
                                return html`<td data-question="${key}" class="p-2 rounded-lg transition border ${selected.has(key) ? 'ds-table-cell is-selected' : 'ds-table-cell'} relative text-xs md:text-sm">
                                    <label class="ds-focusable flex flex-col items-center justify-center cursor-pointer rounded">
                                        <input type="checkbox" class="sr-only" data-question="${key}" .checked=${selected.has(key)} aria-label="選擇 ${row} 乘 ${col}">
                                        <span class="ds-text-muted mt-1 min-h-4 text-xs font-semibold">${record?.errors || 0}/${record?.attempts || 0}</span>
                                    </label>
                                </td>`;
                            })}
                        </tr>`)}
                </tbody>
            </table>`;
    }

    firstUpdated() {
        this.addEventListener('change', (event) => {
            const input = event.target.closest('input');
            if (!input) return;
            const type = input.dataset.selectAll;
            const keys = type === 'all'
                ? this.questions.map((question) => question.key)
                : type === 'row'
                    ? this.questions.filter((question) => question.row === Number(input.dataset.row)).map((question) => question.key)
                    : type === 'column'
                        ? this.questions.filter((question) => question.col === Number(input.dataset.column)).map((question) => question.key)
                        : [input.dataset.question];
            this.dispatchEvent(new CustomEvent('selection-change', { detail: { keys, checked: input.checked }, bubbles: true }));
        });
    }

    updated() {
        const selected = new Set(this.selected);
        const allKeys = this.questions.map((question) => question.key);
        this.querySelectorAll('input[data-question]').forEach((input) => { input.checked = selected.has(input.dataset.question); });
        this.syncGroup('all', allKeys);
        this.querySelectorAll('input[data-select-all="row"]').forEach((input) => this.syncGroup('row', allKeys.filter((key) => key.startsWith(`${input.dataset.row}x`)), input));
        this.querySelectorAll('input[data-select-all="column"]').forEach((input) => this.syncGroup('column', allKeys.filter((key) => key.endsWith(`x${input.dataset.column}`)), input));
    }

    syncGroup(type, keys, input = this.querySelector(`input[data-select-all="${type}"]`)) {
        if (!input) return;
        const selected = new Set(this.selected);
        const count = keys.filter((key) => selected.has(key)).length;
        input.checked = count === keys.length;
        input.indeterminate = count > 0 && count < keys.length;
    }
}

customElements.define('multiplication-selector', MultiplicationSelector);
