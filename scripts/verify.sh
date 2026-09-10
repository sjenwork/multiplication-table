#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

"$project_root/scripts/check-static.sh"
"$project_root/scripts/test.sh"
if [[ -n "${SMOKE_URL:-}" ]]; then
    "$project_root/scripts/browser-smoke.sh"
else
    echo "browser smoke skipped: set SMOKE_URL to enable it" >&2
fi
