────────────────────────────────────────────────────────────────────────────────
  Settings Error

  /Users/colby/GitKraken/Personal/saturday.shop/.claude/settings.local.json
   └ hooks
     ├ SessionStart
     │ └ 0
     │   └ hooks: Expected array, but received undefined
     └ UserPromptSubmit
       └ 0
         └ hooks: Expected array, but received undefined

  Hooks use a matcher + hooks array. The matcher is a string: a tool name
  ("Bash"), pipe-separated list ("Edit|Write"), or empty to match all.
  Example: {"PostToolUse": [{"matcher": "Edit|Write", "hooks": [{"type":
  "command", "command": "echo Done"}]}]}
  Learn more: https://code.claude.com/docs/en/hooks


  Files with errors are skipped entirely, not just the invalid settings.