#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

mapfile -t javascript_files < <(find . -path './.git' -prune -o -path './node_modules' -prune -o -name '*.js' -print | sort)
if ((${#javascript_files[@]} == 0)); then
    echo "static check failed: no JavaScript files found" >&2
    exit 1
fi

for file in "${javascript_files[@]}"; do
    node --check "$file"
done

bash -n .githooks/pre-commit .githooks/pre-push scripts/*.sh deploy.sh

node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function javascriptFiles(directory) {
    const output = [];
    const visit = (relativeDirectory) => {
        for (const entry of fs.readdirSync(path.join(root, relativeDirectory), { withFileTypes: true })) {
            const relativePath = path.join(relativeDirectory, entry.name);
            if (entry.isDirectory()) visit(relativePath);
            else if (entry.name.endsWith('.js')) output.push(relativePath);
        }
    };
    if (fs.existsSync(path.join(root, directory))) visit(directory);
    return output;
}

const files = javascriptFiles('app');
const vendorFiles = javascriptFiles('vendor');
const runtimeFiles = ['app.js', ...files, ...vendorFiles, 'sw.js', 'theme-init.js'];
const knownFiles = new Set(runtimeFiles);
const importPattern = /(?:from\s+|import\s*\()(['"])([^'"]+)\1/g;
const errors = [];

for (const relativeFile of ['app.js', ...files, ...vendorFiles, 'sw.js']) {
    const source = fs.readFileSync(path.join(root, relativeFile), 'utf8');
    for (const match of source.matchAll(importPattern)) {
        const specifier = match[2].split('?')[0];
        if (!specifier.startsWith('.')) continue;
        const resolved = path.normalize(path.join(path.dirname(relativeFile), specifier));
        if (!knownFiles.has(resolved)) errors.push(`${relativeFile}: missing import ${specifier}`);
    }
}

const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const file of [...files, ...vendorFiles]) {
    const shellPath = `/${file}`;
    if (!serviceWorker.includes(shellPath)) errors.push(`sw.js: ${shellPath} is missing from APP_SHELL`);
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`static checks passed (${runtimeFiles.length} runtime JavaScript files)`);
NODE

git diff --check
