import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/components/settings-modal.js', 'utf8');

test('settings modal is a Lit component with an explicit public contract', () => {
    assert.match(source, /from ['"]\.\.\/\.\.\/vendor\/lit-core\.min\.js['"]/);
    assert.match(source, /class SettingsModal extends LitElement/);
    assert.match(source, /createRenderRoot\(\)\s*\{\s*return this;/);
    assert.match(source, /customElements\.define\(['"]app-settings-modal['"]/);
    assert.match(source, /CustomEvent\(['"]theme-change['"]/);
});
