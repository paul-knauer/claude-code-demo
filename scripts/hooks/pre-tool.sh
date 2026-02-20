#!/bin/bash
# =============================================================================
# pre-tool.sh — Claude Code PreToolUse Hook Example
# =============================================================================
# This script runs BEFORE every tool call Claude makes.
# Claude Code passes hook context as JSON on stdin.
#
# Hook input structure:
#   {
#     "tool_name": "Write",
#     "tool_input": { "file_path": "/path/to/file", ... }
#   }
#
# Exit codes:
#   0  — allow the tool to proceed
#   2  — block the tool; stdout is shown to Claude as an error message
# =============================================================================

# Read the hook input JSON from stdin
HOOK_INPUT=$(cat)

# Extract tool name (python3 is available on most systems; jq is not guaranteed)
TOOL_NAME=$(echo "$HOOK_INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_name','unknown'))" \
  2>/dev/null || echo "unknown")

# Log the tool invocation for observability
echo "[pre-tool] Tool invoked: $TOOL_NAME at $(date '+%H:%M:%S')" >&2

# Guard: block writes to dist/ — it is managed by `npm run build`
if [[ "$TOOL_NAME" == "Write" || "$TOOL_NAME" == "Edit" ]]; then
  FILE_PATH=$(echo "$HOOK_INPUT" | python3 -c \
    "import sys,json; d=json.load(sys.stdin); i=d.get('tool_input',{}); print(i.get('file_path', i.get('path','')))" \
    2>/dev/null || echo "")

  if [[ "$FILE_PATH" == *"/dist/"* ]]; then
    echo "BLOCKED: Direct writes to dist/ are not allowed."
    echo "dist/ is managed by 'npm run build'. Edit source files in src/ instead."
    exit 2  # Exit code 2 blocks the tool and surfaces this message to Claude
  fi
fi

exit 0  # Allow all other tool calls
