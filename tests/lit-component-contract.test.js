import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/components/settings-modal.js', 'utf8');
const completionSource = fs.readFileSync('app/components/completion-overlay.js', 'utf8');
const modalSource = fs.readFileSync('app/components/app-modal.js', 'utf8');
const buttonSource = fs.readFileSync('app/components/app-button.js', 'utf8');

test('app button exposes a reusable native-button contract', () => {
    assert.match(buttonSource, /class AppButton extends LitElement/);
    assert.match(buttonSource, /variant: \{ type: String/);
    assert.match(buttonSource, /disabled: \{ type: Boolean/);
    assert.match(buttonSource, /<button/);
    assert.match(buttonSource, /customElements\.define\(['"]app-button['"]/);
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
    assert.match(source, /CustomEvent\(['"]theme-change['"]/);
});

test('completion overlay is a Lit component with reactive score inputs', () => {
    assert.match(completionSource, /class CompletionOverlay extends LitElement/);
    assert.match(completionSource, /correctCount: \{ type: Number \}/);
    assert.match(completionSource, /total: \{ type: Number \}/);
    assert.match(completionSource, /customElements\.define\(['"]app-completion-overlay['"]/);
});
