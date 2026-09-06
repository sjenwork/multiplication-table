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

node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = fs.readdirSync(path.join(root, 'app')).filter((file) => file.endsWith('.js'));
const knownFiles = new Set(['app.js', ...files.map((file) => `app/${file}`), 'sw.js', 'theme-init.js']);
const importPattern = /(?:from\s+|import\s*\()(['"])([^'"]+)\1/g;
const errors = [];

for (const relativeFile of ['app.js', ...files.map((file) => `app/${file}`), 'sw.js']) {
    const source = fs.readFileSync(path.join(root, relativeFile), 'utf8');
    for (const match of source.matchAll(importPattern)) {
        const specifier = match[2].split('?')[0];
        if (!specifier.startsWith('.')) continue;
        const resolved = path.normalize(path.join(path.dirname(relativeFile), specifier));
        if (!knownFiles.has(resolved)) errors.push(`${relativeFile}: missing import ${specifier}`);
    }
}

const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
for (const file of files) {
    if (!serviceWorker.includes(`/app/${file}`)) errors.push(`sw.js: app/${file} is missing from APP_SHELL`);
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`static checks passed (${files.length + 2} JavaScript files)`);
NODE

git diff --check
