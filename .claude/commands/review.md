# /review — Full Quality Gate

Run a complete pre-merge review on all files changed since `main`. This ties together the
automated build pipeline and the `code-reviewer` agent into a single repeatable gate.

## Steps

1. Identify changed files:

```bash
git diff --name-only main...HEAD
```

2. Run the automated pipeline in order — stop and report if any step fails:

```bash
npm run typecheck
npm run lint
npm test
```

3. Invoke the `code-reviewer` agent on every changed `src/**/*.ts` file. For each file, work
   through the full CLAUDE.md compliance checklist:
   - No `any` types without justification
   - JSDoc on all exported functions, interfaces, and types
   - No `console.log` — `logger` utility used instead
   - No function body exceeds 50 lines
   - All throws use typed error classes from `src/errors/`
   - Input validation occurs at the handler boundary, not in helpers
   - A colocated `*.test.ts` file exists for every new source file

4. Produce a structured findings report with severity ratings (`[BLOCKING]` / `[ADVISORY]`)
   and `file:line` citations for every issue found.

5. Summarise: count of blocking findings, count of advisory findings, and whether the branch
   is merge-ready.

## Output Format

```
## Review Summary — <branch name>

### Automated Checks
- typecheck: PASSED / FAILED
- lint:      PASSED / FAILED
- tests:     PASSED / FAILED (coverage: X%)

### Manual Findings
1. [BLOCKING] src/api/index.ts:42 — <description>
2. [ADVISORY] src/api/index.ts:87 — <description>

### Verdict
MERGE-READY / BLOCKED (N blocking findings must be resolved)
```

If there are no changed `src/` files, report that and skip the manual checklist.
