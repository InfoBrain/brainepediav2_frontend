#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Re-install the post-commit hook (lost on environment resets since .git/ isn't versioned)
mkdir -p .git/hooks
cat > .git/hooks/post-commit << 'HOOK'
#!/bin/bash
GH_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-$GITHUB_TOKEN}"
if [ -n "$GH_TOKEN" ]; then
  echo "[post-commit] Pushing to GitHub: origin/main ($(git rev-parse --short HEAD))"
  git -c credential.helper='!f() { echo "username=x-access-token"; echo "password='"${GH_TOKEN}"'"; }; f' \
    push origin main --force 2>&1 || echo "[post-commit] WARN: GitHub push failed"
else
  echo "[post-commit] WARN: GITHUB_PERSONAL_ACCESS_TOKEN not set — GitHub sync skipped"
fi
HOOK
chmod +x .git/hooks/post-commit

# Push to GitHub after every merge
GH_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-$GITHUB_TOKEN}"
if [ -n "$GH_TOKEN" ]; then
  echo "Syncing to GitHub: remote=origin branch=main ($(git rev-parse --short HEAD))"
  git -c credential.helper='!f() { echo "username=x-access-token"; echo "password='"${GH_TOKEN}"'"; }; f' \
    push origin main --force
else
  echo "WARN: Neither GITHUB_PERSONAL_ACCESS_TOKEN nor GITHUB_TOKEN is set — GitHub sync skipped"
fi
