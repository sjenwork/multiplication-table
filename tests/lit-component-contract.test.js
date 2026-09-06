import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/components/settings-modal.js', 'utf8');
const completionSource = fs.readFileSync('app/components/completion-overlay.js', 'utf8');
const modalSource = fs.readFileSync('app/components/app-modal.js', 'utf8');
const buttonSource = fs.readFileSync('app/components/app-button.js', 'utf8');
const selectorSource = fs.readFileSync('app/components/multiplication-selector.js', 'utf8');
const keypadSource = fs.readFileSync('app/components/numeric-keypad.js', 'utf8');

test('multiplication selector owns the table rendering contract', () => {
    assert.match(selectorSource, /class MultiplicationSelector extends LitElement/);
    assert.match(selectorSource, /questions: \{ type: Array \}/);
    assert.match(selectorSource, /selection-change/);
    assert.match(selectorSource, /ds-layer-table-corner left-0 top-0/);
    assert.match(selectorSource, /customElements\.define\(['"]multiplication-selector['"]/);
});

test('app button exposes a reusable native-button contract', () => {
    assert.match(buttonSource, /class AppButton extends LitElement/);
    assert.match(buttonSource, /variant: \{ type: String/);
    assert.match(buttonSource, /disabled: \{ type: Boolean/);
    assert.match(buttonSource, /<button/);
    assert.match(buttonSource, /rounded-full/);
    assert.match(buttonSource, /customElements\.define\(['"]app-button['"]/);
});

test('numeric keypad owns the repeated quiz controls', () => {
    assert.match(keypadSource, /class NumericKeypad extends LitElement/);
    assert.match(keypadSource, /data-pad-value/);
    assert.match(keypadSource, /backspace/);
    assert.match(keypadSource, /customElements\.define\(['"]app-keypad['"]/);
});

test('app modal exposes a reusable dialog behavior contract', () => {
    assert.match(modalSource, /class AppModal extends LitElement/);
    assert.match(modalSource, /open: \{ type: Boolean/);
    assert.match(modalSource, /show\(\)/);
    assert.match(modalSource, /hide\(\)/);
    assert.match(modalSource, /shouldUpdate\(\)/);
    assert.match(modalSource, /setTimeout\(\(\) =>/);
    assert.match(modalSource, /data-modal-scrim/);
    assert.match(modalSource, /event\.key === ['"]Escape['"]/);
    assert.match(modalSource, /customElements\.define\(['"]app-modal['"]/);
});

test('settings modal is a Lit component with an explicit public contract', () => {
    assert.match(source, /from ['"]\.\.\/\.\.\/vendor\/lit-core\.min\.js['"]/);
    assert.match(source, /class SettingsModal extends LitElement/);
    assert.match(source, /createRenderRoot\(\)\s*\{\s*return this;/);
    assert.match(source, /customElements\.define\(['"]app-settings-modal['"]/);
    assert.match(source, /<app-modal \.open=\$\{this\.open\} size="md"/);
    assert.match(source, /<app-button data-modal-close/);
    assert.match(source, /<app-button data-theme-choice="\$\{theme\}" variant="secondary" full/);
    assert.match(source, /CustomEvent\(['"]theme-change['"]/);
});

test('completion overlay is a Lit component with reactive score inputs', () => {
    assert.match(completionSource, /class CompletionOverlay extends LitElement/);
    assert.match(completionSource, /correctCount: \{ type: Number \}/);
    assert.match(completionSource, /total: \{ type: Number \}/);
    assert.match(completionSource, /customElements\.define\(['"]app-completion-overlay['"]/);
});
