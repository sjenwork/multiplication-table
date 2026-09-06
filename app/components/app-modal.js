import { LitElement, html, nothing } from '../../vendor/lit-core.min.js';

const SIZE_CLASSES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

export class AppModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        size: { type: String },
        labelledby: { type: String },
    };

    constructor() {
        super();
        this.open = false;
        this.size = 'md';
        this.labelledby = '';
        this.previousFocus = null;
        this.contentNodes = null;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        setTimeout(() => {
            this.contentNodes = Array.from(this.childNodes);
            this.requestUpdate();
        }, 0);
        this.addEventListener('click', (event) => {
            if (event.target.closest('[data-modal-close]') || event.target === this.querySelector('[data-modal-scrim]')) this.hide();
        });
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.open) {
                event.stopPropagation();
                this.hide();
            }
        });
    }

    firstUpdated() {
        const content = this.querySelector('[data-modal-content]');
        if (content && this.contentNodes) content.replaceChildren(...this.contentNodes);
        if (this.open) this.focusInitialControl();
    }

    shouldUpdate() {
        return this.contentNodes !== null;
    }

    updated(changed) {
        if (changed.has('open')) {
            if (this.open) {
                if (!this.previousFocus) this.previousFocus = document.activeElement;
                this.focusInitialControl();
            }
            else if (this.previousFocus?.focus) this.previousFocus.focus();
        }
    }

    show() {
        if (!this.open) this.previousFocus = document.activeElement;
        this.open = true;
        this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
    }

    hide() {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
    }

    focusInitialControl() {
        this.updateComplete.then(() => {
            if (!this.open) return;
            this.querySelector('[autofocus], [data-modal-close], button, input, select, textarea')?.focus();
        });
    }

    render() {
        const sizeClass = SIZE_CLASSES[this.size] || SIZE_CLASSES.md;
        return html`
            <div data-modal-scrim class="ds-modal-backdrop fixed inset-0 z-[60] ${this.open ? 'flex' : 'hidden'} items-center justify-center bg-slate-900/40 p-4" role="presentation">
                <div class="ds-surface-strong ds-modal-surface w-full ${sizeClass} rounded-2xl p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby=${this.labelledby || nothing}>
                    <div data-modal-content></div>
                </div>
            </div>`;
    }
}

customElements.define('app-modal', AppModal);
