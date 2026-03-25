#!/usr/bin/env bash
#
# Verify script — uses codegraph (if available) to find affected test files,
# falls back to listing changed test files from the diff.
# Runs as a Stop hook to ensure test coverage for all changes.
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

# Strategy 1: Use codegraph if available and project is initialized
if command -v codegraph >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.codegraph" ]; then
  # Get source-only changes (exclude test files) for codegraph analysis
  SOURCE_FILES=$(echo "$ALL_CHANGED" | while IFS= read -r f; do
    is_test_file "$f" || echo "$f"
  done)

  if [ -n "$SOURCE_FILES" ]; then
    CG_RESULTS=$(echo "$SOURCE_FILES" | codegraph affected --stdin --quiet --path "$PROJECT_ROOT" 2>/dev/null || true)
    if [ -n "$CG_RESULTS" ]; then
      AFFECTED_TESTS="$CG_RESULTS"
    fi
  fi
fi

# Strategy 2: Include test files that are directly in the diff
CHANGED_TESTS=$(echo "$ALL_CHANGED" | while IFS= read -r f; do
  is_test_file "$f" && echo "$f"
done || true)

# Combine both sources
ALL_AFFECTED=$(printf '%s\n%s' "$AFFECTED_TESTS" "$CHANGED_TESTS" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_AFFECTED" ]; then
  echo "✅ No test files found in changes or dependency graph."
  echo ""
  echo "⚠️  If you changed routes or components, ensure relevant e2e tests exist and pass."
  echo ""
  echo "Checklist:"
  echo "  Run shopify theme check"
  echo "  Run affected e2e tests"
  exit 0
fi

# ── Check which affected test files were modified vs not ──
MODIFIED=""
NOT_MODIFIED=""

while IFS= read -r test_file; do
  [ -z "$test_file" ] && continue
  if echo "$ALL_CHANGED" | grep -qF "$test_file"; then
    MODIFIED="${MODIFIED}  ✅ ${test_file}"$'\n'
  else
    NOT_MODIFIED="${NOT_MODIFIED}  ❌ ${test_file}"$'\n'
  fi
done <<< "$ALL_AFFECTED"

echo "Affected test files:"
[ -n "$MODIFIED" ] && printf '%s' "$MODIFIED"
[ -n "$NOT_MODIFIED" ] && printf '%s' "$NOT_MODIFIED"
echo ""

if [ -n "$NOT_MODIFIED" ]; then
  echo "🛑 BLOCKED: The above ❌ test files are affected by your changes but were NOT updated."
  echo ""
  echo "You MUST either:"
  echo "  1. Update those test files to cover your changes, OR"
  echo "  2. Run them to confirm they still pass without changes"
  echo ""
  echo "Also run shopify theme check."
else
  echo "✅ All affected test files were modified."
  echo ""
  echo "Remaining checklist:"
  echo "  Run shopify theme check"
  echo "  Run affected e2e tests"
fi
