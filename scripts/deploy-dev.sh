#!/usr/bin/env bash
set -euo pipefail

project_name="multiplication-table"
target_url="https://dev.multiplication-table.pages.dev"
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
    echo "dev deployment failed: detached HEAD is not allowed" >&2
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "dev deployment failed: commit tracked and untracked changes first" >&2
    git status --short >&2
    exit 1
fi

scripts/verify.sh

echo "deploying branch ${branch} to Cloudflare Pages dev alias" >&2
npx --yes wrangler pages deploy . \
    --project-name "$project_name" \
    --branch dev

curl -fsSI "$target_url" | head -5

if [[ "${RUN_BROWSER_SMOKE:-0}" == "1" ]]; then
    SMOKE_URL="${target_url}/index.html" scripts/browser-smoke.sh
else
    echo "dev deployment browser smoke skipped: set RUN_BROWSER_SMOKE=1 to enable it" >&2
fi
