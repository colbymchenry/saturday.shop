#!/usr/bin/env bash
# Agent-reminder hook (UserPromptSubmit)
# Reminds Claude to delegate to the right agent instead of doing work directly.

cat <<'REMINDER'
## Agent Workflow Reminder

Before responding, check if this task should be delegated:

- **Feature, fix, or UI change** → `@orchestrator` (runs full pipeline: architect → coder → tester → reviewer → design-qa)
- **Shopify-specific question** → `@shopify-expert`
- **SEO or performance audit** → `@seo-performance`
- **Quick question / git ops / explaining code** → handle directly (no delegation needed)

Do NOT implement features, write code, or run tests directly in the main session. Delegate to the orchestrator.
REMINDER
