# /docs-sync — Documentation Drift Check

Invoke the `technical-writer` agent to audit documentation against source changes. Run this
before opening a PR to catch stale examples, missing handler coverage, and outdated references.

## Steps

1. Identify which `src/` files changed since `main`:

```bash
git diff --name-only main...HEAD -- src/
```

2. For each changed source file, invoke the `technical-writer` agent to:

   a. Read the source file and extract all exported functions, interfaces, types, and their
      JSDoc descriptions — these are the ground truth.

   b. Search `docs/` for any reference to the changed file or the symbols it exports:

   ```bash
   grep -rn "<function_or_type_name>" docs/
   grep -rn "<function_or_type_name>" README.md
   grep -rn "<function_or_type_name>" CLAUDE.md
   ```

   c. Compare what the source exports now against what the docs describe. Flag any of:
      - A doc references a function or type that no longer exists (stale reference)
      - A new exported symbol has no coverage anywhere in `docs/`
      - A code example in a doc uses an old signature, old field name, or old behaviour
      - A doc says "all handlers are X" but a new handler breaks that claim

3. For each drift found, update the relevant doc — don't just list the gaps, fix them.
   Match the existing tone and heading structure of the file being updated.

4. After all updates, verify no doc example uses `console.log` (should use `logger`) and
   all referenced file paths still exist:

```bash
grep -rn "console\.log" docs/
```

5. Produce a summary of what was checked, what drift was found, and what was updated.

## Output Format

```
## Docs Sync Report

### Files checked (changed since main)
- src/api/index.ts

### Drift found
- docs/prompting/intent-guide.md:34 — references `handleCreateItem` with old signature (missing null guard)
- README.md — no coverage of new `handleDeleteItem` handler

### Updates made
- Updated docs/prompting/intent-guide.md:34 — corrected signature example
- Added handleDeleteItem section to README.md

### No drift found in
- CLAUDE.md
- docs/guides/
```

If no `src/` files changed, report that and exit — nothing to sync.
