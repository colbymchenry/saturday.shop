#!/usr/bin/env bash
# Git context hook (SessionStart)
# Injects branch-aware git context at the start of every session.

echo "## Git Context"
echo ""

# Current branch
BRANCH=$(git branch --show-current 2>/dev/null)
echo "**Branch:** ${BRANCH:-detached HEAD}"

# Base branch detection
BASE="main"
if git rev-parse --verify origin/main &>/dev/null; then
  BASE="main"
elif git rev-parse --verify origin/master &>/dev/null; then
  BASE="master"
fi

# Recent commits on this branch
echo ""
echo "**Recent commits:**"
git log --oneline -10 2>/dev/null || echo "(no commits)"

# Branch diff from base (if on a feature branch)
if [ "$BRANCH" != "$BASE" ] && [ -n "$BRANCH" ]; then
  AHEAD=$(git rev-list --count "${BASE}..HEAD" 2>/dev/null || echo "0")
  if [ "$AHEAD" -gt 0 ]; then
    echo ""
    echo "**Branch diff from ${BASE}:** ${AHEAD} commits ahead"
    echo ""
    echo "**Changed files:**"
    git diff --name-only "${BASE}...HEAD" 2>/dev/null || echo "(none)"
  fi
fi

# Working directory state
echo ""
echo "**Working directory:**"
git status --short 2>/dev/null || echo "(clean)"
