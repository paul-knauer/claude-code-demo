#!/bin/bash
# =============================================================================
# pre-commit.sh — Claude Code PreToolUse Hook: Lint Gate on git commit
# =============================================================================
# Runs before Claude executes any `git commit` Bash command.
# Blocks the commit and runs `npm run lint` if it hasn't been run yet in
# this session, ensuring no commit lands with lint violations.
#
# Exit codes:
#   0  — allow the commit to proceed (lint passed)
#   2  — block the commit; stdout is shown to Claude as an error message
#
# Why block on lint rather than just nudge?
#   A post-commit nudge is too late — the commit already exists and would need
#   an amend. Blocking here keeps the git history clean by design.
# =============================================================================

HOOK_INPUT=$(cat)

# Extract the Bash command being run
COMMAND=$(echo "$HOOK_INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" \
  2>/dev/null || echo "")

# Only intercept git commit commands (not git status, git diff, etc.)
if [[ "$COMMAND" != *"git commit"* ]]; then
  exit 0
fi

echo "[pre-commit] git commit detected — running lint check before allowing commit..." >&2

# Run lint and capture the exit code
npm run lint >&2 2>&1
LINT_EXIT=$?

if [[ $LINT_EXIT -ne 0 ]]; then
  # Block the commit and explain exactly what to do next
  echo "BLOCKED: Lint violations must be fixed before committing."
  echo ""
  echo "Run 'npm run lint:fix' to auto-fix formatting and simple rule violations."
  echo "Then re-run your commit command."
  echo ""
  echo "Do not use --no-verify to skip this check — fix the violations instead."
  exit 2
fi

echo "[pre-commit] Lint passed — proceeding with commit." >&2
exit 0
