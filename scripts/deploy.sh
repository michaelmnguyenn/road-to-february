#!/usr/bin/env bash
# Publish the site to GitHub Pages as <user>.github.io/road-to-february.
# Safe to re-run: it creates the repo the first time and pushes updates after that.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="${1:-road-to-february}"
USER="$(gh api user -q .login)"

if [ ! -d .git ]; then
  git init -q -b main
fi
# New cache name on every deploy so phones pick up the update on their next visit.
perl -pi -e 's/const CACHE = "rtf-[^"]*"/const CACHE = "rtf-'"$(date +%Y%m%d%H%M%S)"'"/' sw.js
git add -A
git commit -q -m "${2:-Update Road to February}" || echo "Nothing new to commit"

if ! gh repo view "$USER/$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --public --source . --remote origin --push \
    --description "22-week plan for IB, capital markets and MBB, with progress tracking"
else
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$USER/$REPO.git"
  git push -q -u origin main
fi

# Turn on Pages from the root of main (no build step needed).
if ! gh api "repos/$USER/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null
fi

URL="https://$USER.github.io/$REPO/"
echo "Waiting for GitHub Pages to build..."
for i in $(seq 1 40); do
  STATUS="$(gh api "repos/$USER/$REPO/pages" -q .status 2>/dev/null || echo pending)"
  if [ "$STATUS" = "built" ]; then echo "Live at $URL"; exit 0; fi
  sleep 6
done
echo "Pages is still building. It will be live shortly at $URL"
