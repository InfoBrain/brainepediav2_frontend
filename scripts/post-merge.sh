#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Push to GitHub after every merge
GH_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-$GITHUB_TOKEN}"
if [ -n "$GH_TOKEN" ]; then
  echo "Syncing to GitHub: remote=origin branch=main ($(git rev-parse --short HEAD))"
  git -c credential.helper='!f() { echo "username=x-access-token"; echo "password='"${GH_TOKEN}"'"; }; f' \
    push origin main --force
else
  echo "ERROR: Neither GITHUB_PERSONAL_ACCESS_TOKEN nor GITHUB_TOKEN is set — GitHub sync skipped" >&2
fi
