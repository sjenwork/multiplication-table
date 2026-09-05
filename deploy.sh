#!/usr/bin/env bash
set -euo pipefail

project_name="multiplication-table"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$repo_root"

branch="$(git branch --show-current)"

if [[ -z "$branch" ]]; then
  echo "部署失敗：目前不在任何 Git 分支上。" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "部署失敗：請先提交目前的 tracked 變更。" >&2
  exit 1
fi

case "$branch" in
  dev)
    target_url="https://dev.multiplication-table.pages.dev"
    ;;
  main)
    target_url="https://multiplication-table.maderaojen.me"
    ;;
  *)
    echo "部署失敗：只允許從 dev 或 main 分支部署（目前：$branch）。" >&2
    exit 1
    ;;
esac

echo "部署分支：$branch" >&2
echo "部署網址：$target_url" >&2

exec npx --yes wrangler pages deploy . \
  --project-name "$project_name" \
  --branch "$branch"
