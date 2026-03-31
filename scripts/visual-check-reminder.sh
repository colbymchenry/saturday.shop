#!/bin/bash
# PostToolUse hook: remind Claude to screenshot after visual file changes
FILE=$(jq -r '.tool_input.file_path' 2>/dev/null)
if echo "$FILE" | grep -qE '\.(liquid|css)$'; then
  cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Visual file changed (.liquid/.css) — take a kommandr screenshot (capture_screen or screenshot with appName Google Chrome) to verify the change looks correct before reporting back to the user."}}
EOF
fi
