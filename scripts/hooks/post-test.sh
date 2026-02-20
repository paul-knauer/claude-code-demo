#!/bin/bash
# =============================================================================
# post-test.sh — Claude Code PostToolUse Hook: Coverage Gate
# =============================================================================
# Runs after Claude executes `npm test` via the Bash tool.
# Parses the Jest output for the global line coverage percentage and warns
# Claude if coverage has dropped below the 80% threshold defined in package.json.
#
# Exit codes:
#   0  — always; this hook is advisory only (it nudges, it does not block)
#
# Why advisory and not blocking?
#   PostToolUse hooks cannot undo a tool call that already ran. Blocking here
#   would prevent Claude from reading the output it needs to diagnose the
#   failure. We surface the warning clearly so Claude acts on it.
# =============================================================================

HOOK_INPUT=$(cat)

# Only act when the Bash command was `npm test` (or a variant)
COMMAND=$(echo "$HOOK_INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" \
  2>/dev/null || echo "")

if [[ "$COMMAND" != *"npm test"* ]]; then
  exit 0
fi

# Extract the coverage percentage from the tool response output.
# Jest prints a line like: "All files  |   87.5 | ..." in the coverage table.
# We look for the summary "All files" row and pull the Lines column (4th field).
RESPONSE=$(echo "$HOOK_INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_response',''))" \
  2>/dev/null || echo "")

COVERAGE=$(echo "$RESPONSE" | grep -E "^All files" | awk -F'|' '{gsub(/ /,"",$4); print $4}' | head -1)

echo "[post-test] npm test completed." >&2

if [[ -z "$COVERAGE" ]]; then
  # Coverage table not found in output — tests may have failed before generating it
  echo "[post-test] Could not parse coverage from output. Check test results above." >&2
  exit 0
fi

echo "[post-test] Global line coverage: ${COVERAGE}%" >&2

# Warn if coverage has dropped below the 80% threshold
THRESHOLD=80
BELOW=$(python3 -c "print('yes' if float('${COVERAGE}') < ${THRESHOLD} else 'no')" 2>/dev/null || echo "unknown")

if [[ "$BELOW" == "yes" ]]; then
  echo "" >&2
  echo "[post-test] WARNING: Coverage is ${COVERAGE}% — below the required ${THRESHOLD}% threshold." >&2
  echo "[post-test] Invoke the quality-assurance-engineer agent to add tests for uncovered branches." >&2
  echo "[post-test] Do not lower the coverageThreshold in package.json to work around this." >&2
fi

exit 0
