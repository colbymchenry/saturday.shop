#!/usr/bin/env bash
#
# Stop hook — shows what changed, finds affected tests via codegraph,
# and runs only those Playwright tests.
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Gather changed files ──
CHANGED=$(git -C "$PROJECT_ROOT" diff --name-only HEAD 2>/dev/null || true)
STAGED=$(git -C "$PROJECT_ROOT" diff --name-only --cached 2>/dev/null || true)
ALL_CHANGED=$(printf '%s\n%s' "$CHANGED" "$STAGED" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_CHANGED" ]; then
  echo "verify: no changes detected, skipping"
  exit 0
fi

# ── Show the diff ──
echo "═══ Git Diff ═══"
git -C "$PROJECT_ROOT" diff --stat HEAD 2>/dev/null || true
echo ""

echo "Changed files:"
echo "$ALL_CHANGED" | sed 's/^/  /'
echo ""

# ── Common test file patterns ──
is_test_file() {
  case "$1" in
    *.spec.*|*.test.*|e2e/*|*/__tests__/*|*/tests/*|*/test/*|*/spec/*)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

# ── Find affected test files ──
AFFECTED_TESTS=""

# Get source-only changes (exclude test files) for dependency analysis
SOURCE_FILES=$(echo "$ALL_CHANGED" | while IFS= read -r f; do
  is_test_file "$f" || echo "$f"
done)

# Strategy 1: codegraph affected (preferred — traces import dependencies)
if command -v codegraph >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.codegraph" ]; then
  if [ -n "$SOURCE_FILES" ]; then
    CG_RESULTS=$(echo "$SOURCE_FILES" | codegraph affected --stdin --filter "e2e/*" --quiet --path "$PROJECT_ROOT" 2>/dev/null || true)
    if [ -n "$CG_RESULTS" ]; then
      AFFECTED_TESTS="$CG_RESULTS"
      echo "codegraph affected test files:"
      echo "$CG_RESULTS" | sed 's/^/  /'
      echo ""
    fi
  fi
fi

# Strategy 2: test files directly in the diff
CHANGED_TESTS=$(echo "$ALL_CHANGED" | while IFS= read -r f; do
  is_test_file "$f" && echo "$f"
done || true)

# Combine both sources
ALL_AFFECTED=$(printf '%s\n%s' "$AFFECTED_TESTS" "$CHANGED_TESTS" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_AFFECTED" ]; then
  echo "No affected test files found."
  echo ""
  echo "Checklist:"
  echo "  Run shopify theme check"
  exit 0
fi

# ── Show affected tests and their status ──
MODIFIED=""
NOT_MODIFIED=""

while IFS= read -r test_file; do
  [ -z "$test_file" ] && continue
  if echo "$ALL_CHANGED" | grep -qF "$test_file"; then
    MODIFIED="${MODIFIED}  ✅ ${test_file}"$'\n'
  else
    NOT_MODIFIED="${NOT_MODIFIED}  ⚠️  ${test_file}"$'\n'
  fi
done <<< "$ALL_AFFECTED"

echo "Affected test files:"
[ -n "$MODIFIED" ] && printf '%s' "$MODIFIED"
[ -n "$NOT_MODIFIED" ] && printf '%s' "$NOT_MODIFIED"
echo ""

# ── Run only affected Playwright tests ──
SPEC_FILES=$(echo "$ALL_AFFECTED" | grep '\.spec\.' | tr '\n' ' ')

if [ -n "$SPEC_FILES" ]; then
  echo "═══ Running affected Playwright tests ═══"
  cd "$PROJECT_ROOT"
  npx playwright test $SPEC_FILES 2>&1
  TEST_EXIT=$?
  echo ""

  if [ $TEST_EXIT -ne 0 ]; then
    echo "🛑 BLOCKED: Playwright tests failed for affected files."
    echo "Fix the failing tests before completing your task."
  else
    echo "✅ All affected tests passed."
  fi
else
  echo "No Playwright spec files to run."
fi

echo ""
echo "Remaining checklist:"
echo "  Run shopify theme check"
