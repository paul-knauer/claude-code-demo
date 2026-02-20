# /commit — Conventional Commit Workflow

Guide a clean, conventional-commit through the following steps. Never commit automatically
without showing the user exactly what will be staged and what the commit message will be.

## Steps

1. Show the current working tree state:

```bash
git status
git diff --stat
```

2. Run the full lint check before staging anything — do not commit code with lint violations:

```bash
npm run lint
```

   If lint fails, stop and report the violations. Ask whether to run `npm run lint:fix` first.

3. Identify which files should be staged. Apply these rules:
   - **Include:** source files (`src/`), tests (`*.test.ts`), docs (`docs/`, `CLAUDE.md`,
     `README.md`), config changes (`.claude/`, `package.json`, `tsconfig.json`)
   - **Never include:** `.env`, `dist/`, `scripts/hooks/session.log`, any file containing
     secrets or credentials
   - Show the proposed staging list and ask for confirmation before running `git add`

4. Draft a commit message following the conventional commits format:
   - `feat:` — new feature or handler
   - `fix:` — bug fix
   - `test:` — adding or updating tests only
   - `docs:` — documentation changes only
   - `chore:` — tooling, config, dependencies
   - `refactor:` — code change with no behaviour change

   The message body should explain the *why*, not just the *what*:
   - Good: `feat: add delete-item handler to support client cleanup workflows`
   - Bad: `feat: update index.ts`

5. Show the full proposed commit (staged files + message) and ask for explicit confirmation.

6. Only after confirmation:

```bash
git add <specific files>
git commit -m "<message>"
```

7. Show the result of `git log --oneline -3` so the commit is visible.

## Branch Naming Reminder

If this is the first commit on a new branch, check the branch name follows the convention:
- `feature/short-description`
- `fix/short-description`
- `docs/short-description`
- `chore/short-description`

If the current branch is `main` or `HEAD`, warn before committing directly.
