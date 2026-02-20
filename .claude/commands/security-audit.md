# /security-audit — Security Posture Review

Invoke the `security-reviewer` agent to audit the full project security posture. Run this
before any release, after permissions changes, or when hook scripts are modified.

## Steps

The `security-reviewer` agent works through four audit areas in order:

### 1. Permissions Audit

Read `.claude/settings.json` and `.claude/settings.local.json` (if it exists). Check:

- No `allow` entry uses `Bash(*)` or an equivalently broad pattern
- `deny` list covers: `Bash(rm -rf *)`, `Bash(git push --force *)`, `Bash(curl * | bash)`
- `settings.local.json` overrides are no broader than the project-wide `settings.json`

### 2. Secrets Audit

```bash
# Verify .env is gitignored
grep -n "^\.env" .gitignore

# Scan for hardcoded credential patterns in committed files
grep -rn "password\|secret\|token\|api_key\|apikey" \
  src/ scripts/ .claude/ \
  --include="*.ts" --include="*.json" --include="*.sh" -i \
  | grep -v "\.env.example" \
  | grep -v "// " \
  | grep -v "node_modules"

# Check .env.example uses placeholders only (no real-looking values)
cat .env.example
```

### 3. Input Validation Audit

Read `src/api/index.ts` and verify:

- Every handler validates its input at the boundary before touching the data store
- No raw `new Error(...)` throws — typed classes from `src/errors/` are used throughout
- Whitespace-only strings are explicitly rejected (`.trim().length === 0`)
- Numeric limits (e.g., name length) are checked with explicit comparisons

### 4. Hook Script Safety Audit

```bash
ls -la scripts/hooks/    # verify scripts are executable (x bit set)
```

Read each hook script and check:
- Variables from external input are quoted: `"$VAR"` not `$VAR`
- No `curl`, `wget`, or other network calls inside hooks
- PreToolUse hook exits `2` (not `0`) when it intends to block a tool call
- No unbounded shell interpolation from stdin-derived values

## Output Format

Produce a report grouped by audit area. Each finding includes severity, file:line, and a
specific recommended fix:

```
## Security Audit Report — <date>

### 1. Permissions
- [PASS] settings.json — allow list uses scoped patterns only
- [BLOCKING] settings.local.json:4 — `Bash(*)` grants unrestricted shell access

### 2. Secrets
- [PASS] .env listed in .gitignore
- [PASS] No hardcoded credentials found in source or config

### 3. Input Validation
- [PASS] All handlers validate at boundary
- [ADVISORY] src/api/index.ts:88 — ValidationError thrown without field name parameter

### 4. Hook Safety
- [PASS] All hook scripts are executable
- [PASS] No network calls in hook scripts

### Summary
1 blocking finding. 1 advisory finding.
```

The `security-reviewer` agent surfaces findings only — it does not modify any files.
Fixes are delegated to the appropriate agent (devops-engineer for settings/hooks,
software-engineer for src/).
