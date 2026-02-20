# Ralph Loop — Philosophy

> "A deterministic loop operating in a non-deterministic environment —
> letting repeated attempts converge on a working solution over time."
>
> — Geoffrey Huntley

---

## What Is the Ralph Loop?

Ralph is an autonomous iteration loop for Claude Code. Rather than waiting for a human to review each step, Ralph repeatedly invokes Claude in a fresh session, hands it a task list (`prd.json`), and lets it pick up where the previous iteration left off — implementing, testing, and committing — until all tasks are done or the iteration limit is reached.

The script lives at `scripts/ralph/ralph.sh`. It drives a while-loop that:

1. Reads `scripts/ralph/prd.json` for the task backlog
2. Checks how many stories are still incomplete
3. Builds a context prompt combining the CLAUDE.md instructions, the full task list, and the progress log
4. Passes that context to Claude via `claude -p`
5. Claude picks the first incomplete story, implements it, runs `npm test`, and commits
6. The loop checks for a completion marker or exhausts `MAX_ITERATIONS`

Each iteration is a fresh Claude session with full context reconstructed from the progress file. This is what makes it resilient: if Claude makes a mistake, the next iteration sees the current repo state and can course-correct.

---

## The Philosophy

### Convergence Over Perfection

No single Claude invocation is guaranteed to succeed. Networks time out, tests fail on first attempt, edge cases surface late. The Ralph Loop doesn't demand perfection from any one pass — it bets that *repeated attempts with full context converge on a correct solution*.

This mirrors how humans work on hard problems: iterate, check, adjust, repeat.

### Determinism as a Container for Non-Determinism

The loop itself is deterministic bash: fixed iteration count, explicit exit conditions, append-only progress log, structured task file. Claude's output is non-deterministic. Ralph uses the deterministic shell as a container that gives non-deterministic AI behaviour a stable structure to work within.

### The Progress Log as Memory

Claude Code sessions are stateless. The progress log (`scripts/ralph/progress.txt`) is how Ralph creates continuity across sessions. Each iteration appends what was done and any learnings. The next iteration reads it. Over time, the log becomes a compact audit trail of the entire autonomous run.

---

## When to Use Ralph

Ralph is well-suited to tasks that are:

- **Well-specified** — the `prd.json` stories have clear acceptance criteria
- **Test-driven** — `npm test` gives Claude an objective signal of success or failure
- **Recoverable** — mistakes in one iteration can be corrected in the next
- **Batch in nature** — a list of independent stories to implement one by one

Good examples:
- Implementing a set of API endpoints from a spec
- Generating test coverage for existing code
- Applying a consistent refactor across many files
- Scaffolding a new feature from a detailed PRD

---

## When Not to Use Ralph

Avoid Ralph for tasks that require human judgment at each step:

- **Irreversible operations** — production deployments, database migrations on live data
- **Ambiguous requirements** — stories that need clarification before implementation
- **External side effects** — tasks that send emails, charge cards, or modify shared infrastructure
- **Security-sensitive changes** — auth systems, secrets management, access control

The `--dangerously-skip-permissions` flag used by default means Claude will not prompt for confirmation. Only use this in environments where the consequences of an unexpected action are acceptable.

---

## Safety Considerations

1. **Always set a MAX_ITERATIONS cap** (default: 10). An unbounded loop with a runaway Claude session can exhaust API quota or make an unexpectedly large number of commits.

2. **Use a dedicated branch**. Run Ralph on a feature branch, not main. Review the commits before merging.

3. **Keep `prd.json` stories small and independent**. Large, interdependent stories increase the chance of iteration failure cascading.

4. **Review `progress.txt` after each run**. It tells you exactly what Claude did and why.

---

## Related Reading

- `scripts/ralph/ralph.sh` — the loop implementation
- `docs/prompting/intent-guide.md` — how to write clear task descriptions that Claude can act on reliably
