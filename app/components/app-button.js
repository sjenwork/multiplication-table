import { LitElement, html, nothing } from '../../vendor/lit-core.min.js';

const VARIANT_CLASSES = {
    primary: 'ds-primary',
    secondary: 'ds-secondary',
    success: 'ds-success',
    danger: 'ds-danger',
    accent: 'ds-accent',
};

const SIZE_CLASSES = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
};

export class AppButton extends LitElement {
    static properties = {
        variant: { type: String },
        size: { type: String },
        disabled: { type: Boolean, reflect: true },
        type: { type: String },
        full: { type: Boolean },
    };

    constructor() {
        super();
        this.variant = 'secondary';
        this.size = 'md';
        this.disabled = false;
        this.type = 'button';
        this.full = false;
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
    }

    shouldUpdate() {
        return this.contentNodes !== null;
    }

    firstUpdated() {
        const content = this.querySelector('[data-button-content]');
        if (content && this.contentNodes) content.replaceChildren(...this.contentNodes);
    }

    focus(options) {
        this.querySelector('button')?.focus(options);
    }

    render() {
        const hostClasses = this.getAttribute('class') || '';
        const classes = [
            'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition active:scale-95',
            VARIANT_CLASSES[this.variant] || VARIANT_CLASSES.secondary,
            SIZE_CLASSES[this.size] || SIZE_CLASSES.md,
            this.full ? 'w-full' : '',
            hostClasses,
        ].filter(Boolean).join(' ');
        return html`
            <button type=${this.type} class=${classes} ?disabled=${this.disabled} aria-label=${this.getAttribute('aria-label') || nothing} aria-pressed=${this.getAttribute('aria-pressed') || nothing}>
                <span data-button-content></span>
            </button>`;
    }
}

customElements.define('app-button', AppButton);
