#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Push to GitHub after every merge
if [ -n "$GITHUB_TOKEN" ]; then
  echo "Syncing to GitHub: remote=origin branch=main ($(git rev-parse --short HEAD))"
  git -c credential.helper='!f() { echo "username=x-access-token"; echo "password='"${GITHUB_TOKEN}"'"; }; f' \
    push origin main
else
  echo "ERROR: GITHUB_TOKEN is not set — GitHub sync failed" >&2
  exit 1
fi
