#!/bin/bash
# =============================================================================
# post-write.sh — Claude Code PostToolUse Hook Example (Write / Edit tools)
# =============================================================================
# This script runs AFTER Claude uses the Write or Edit tool.
# Claude Code passes hook context as JSON on stdin.
#
# Hook input structure:
#   {
#     "tool_name": "Write",
#     "tool_input": { "file_path": "/path/to/file", ... },
#     "tool_response": { ... }
#   }
# =============================================================================

HOOK_INPUT=$(cat)

# Extract the path that was written
FILE_PATH=$(echo "$HOOK_INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); i=d.get('tool_input',{}); print(i.get('file_path', i.get('path','(unknown)')))" \
  2>/dev/null || echo "(unknown)")

echo "[post-write] File written: $FILE_PATH" >&2

# Prompt Claude to typecheck after modifying TypeScript source files.
# This nudges it to verify type correctness without being prescriptive.
if [[ "$FILE_PATH" == *.ts && "$FILE_PATH" != *.d.ts ]]; then
  echo "[post-write] TypeScript file modified — consider running: npm run typecheck" >&2
fi

exit 0
