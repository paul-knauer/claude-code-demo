#!/bin/bash
# =============================================================================
# Ralph Loop — Autonomous Claude Code Execution
# =============================================================================
# 
# USAGE:
#   ./ralph.sh "claude --dangerously-skip-permissions" [max_iterations]
#
# WHAT IT DOES:
#   1. Reads prd.json for the task backlog
#   2. Passes context + tasks to Claude in a fresh session
#   3. Claude picks a task, implements it, runs tests, commits
#   4. Loop restarts until all tasks complete or max iterations hit
#
# PHILOSOPHY (by Geoffrey Huntley):
#   "A deterministic loop operating in a non-deterministic environment —
#    letting repeated attempts converge on a working solution over time."
#
# =============================================================================

set -e

CLAUDE_COMMAND="${1:-claude --dangerously-skip-permissions}"
MAX_ITERATIONS="${2:-10}"
PRD_FILE="scripts/ralph/prd.json"
PROGRESS_FILE="scripts/ralph/progress.txt"
CLAUDE_MD="scripts/ralph/CLAUDE.md"
DONE_MARKER="TASK_LIST_COMPLETE"

# Colours for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

echo -e "${BLUE}🔄 Ralph Loop Starting${NC}"
echo -e "   Command: ${CLAUDE_COMMAND}"
echo -e "   Max iterations: ${MAX_ITERATIONS}"
echo -e "   PRD: ${PRD_FILE}"
echo ""

# Validate prerequisites
if [ ! -f "$PRD_FILE" ]; then
    echo -e "${RED}❌ prd.json not found at ${PRD_FILE}${NC}"
    echo "   Run /prd and /prd-convert first to generate your task list."
    exit 1
fi

if [ ! -f "$CLAUDE_MD" ]; then
    echo -e "${RED}❌ ralph CLAUDE.md not found at ${CLAUDE_MD}${NC}"
    exit 1
fi

# Initialise progress log
echo "Ralph Loop started: $(date)" >> "$PROGRESS_FILE"
echo "Max iterations: ${MAX_ITERATIONS}" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

iteration=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    
    echo -e "${YELLOW}🔄 Iteration ${iteration}/${MAX_ITERATIONS}${NC}"
    echo "Iteration ${iteration}: $(date)" >> "$PROGRESS_FILE"
    
    # Check if all tasks are done
    remaining=$(python3 -c "
import json
with open('${PRD_FILE}') as f:
    prd = json.load(f)
incomplete = [s for s in prd.get('stories', []) if not s.get('passes', False)]
print(len(incomplete))
" 2>/dev/null || echo "unknown")
    
    if [ "$remaining" = "0" ]; then
        echo -e "${GREEN}✅ All tasks complete! Loop exiting early.${NC}"
        echo "COMPLETE: All tasks done at iteration ${iteration}" >> "$PROGRESS_FILE"
        break
    fi
    
    echo -e "   Tasks remaining: ${remaining}"
    
    # Build the context prompt
    CONTEXT=$(cat << EOF
$(cat "$CLAUDE_MD")

---

## Current Task List (prd.json)

$(cat "$PRD_FILE")

---

## Progress Log

$(tail -50 "$PROGRESS_FILE" 2>/dev/null || echo "No progress yet.")

---

## Your Job This Iteration

1. Read the task list above
2. Pick the FIRST incomplete story (passes: false or missing)
3. Implement it following the standards in CLAUDE.md
4. Run the test suite: npm test
5. If tests pass: 
   - Update prd.json to mark the story passes: true
   - Commit: git add -A && git commit -m "feat: [story title]"
   - Append to scripts/ralph/progress.txt what you did and any learnings
6. If tests fail: Fix the failures, then commit

When ALL stories are complete, output exactly: ${DONE_MARKER}
EOF
)
    
    # Run Claude with the context
    output=$(echo "$CONTEXT" | $CLAUDE_COMMAND -p 2>&1)
    exit_code=$?
    
    # Log output summary
    echo "--- Iteration ${iteration} output (last 10 lines) ---" >> "$PROGRESS_FILE"
    echo "$output" | tail -10 >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    
    # Check for completion marker
    if echo "$output" | grep -q "$DONE_MARKER"; then
        echo -e "${GREEN}🎉 Claude signalled completion: ${DONE_MARKER}${NC}"
        echo "DONE MARKER received at iteration ${iteration}" >> "$PROGRESS_FILE"
        break
    fi
    
    if [ $exit_code -ne 0 ]; then
        echo -e "${RED}⚠️  Claude exited with code ${exit_code} — retrying next iteration${NC}"
        echo "ERROR: exit code ${exit_code} at iteration ${iteration}" >> "$PROGRESS_FILE"
    fi
    
    echo -e "   ✓ Iteration complete\n"
    
    # Small delay between iterations
    sleep 2
done

# Final summary
echo ""
echo -e "${BLUE}═══════════════════════════════${NC}"
echo -e "${BLUE}   Ralph Loop Complete${NC}"
echo -e "${BLUE}═══════════════════════════════${NC}"
echo -e "   Iterations run: ${iteration}"
echo -e "   Check scripts/ralph/progress.txt for full log"
echo -e "   Check git log for all commits made"
echo ""

# Show final PRD status
echo -e "${GREEN}Final task status:${NC}"
python3 -c "
import json
with open('scripts/ralph/prd.json') as f:
    prd = json.load(f)
stories = prd.get('stories', [])
done = [s for s in stories if s.get('passes', False)]
print(f'  ✅ Complete: {len(done)}/{len(stories)}')
for s in done:
    print(f'     - {s[\"title\"]}')
incomplete = [s for s in stories if not s.get('passes', False)]
if incomplete:
    print(f'  ⏳ Remaining: {len(incomplete)}/{len(stories)}')
    for s in incomplete:
        print(f'     - {s[\"title\"]}')
" 2>/dev/null || echo "  (could not parse prd.json)"
