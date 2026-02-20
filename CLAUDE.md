# Claude Code Showcase — Project Context

## Purpose
This repository is a **teaching tool** demonstrating Claude Code features. When working here:
- Prioritise clarity and explanation over brevity
- Add comments explaining *why*, not just *what*
- Every file should serve as a learning example

---

## Architecture

This is a **demonstration project** — not production code. Structure reflects Claude Code feature categories:

```
.claude/     → Claude Code configuration (skills, commands, agents, hooks)
scripts/     → Automation scripts (ralph loop, hooks)
docs/        → Learning guides and documentation
src/         → Sample API code used as a demonstration target
```

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Testing:** Jest with >80% coverage requirement
- **Linting:** ESLint + Prettier (enforced via hooks)
- **Package manager:** npm

---

## Coding Standards

- TypeScript strict mode — no `any` types without justification
- All exported functions require JSDoc comments
- Test files colocated: `*.test.ts` next to source
- No `console.log` — use the `logger` utility from `src/utils/logger.ts`
- Maximum function length: 50 lines (split if longer)
- Error handling: always use typed errors from `src/errors/`

---

## Commands

```bash
npm run build       # TypeScript compile
npm test            # Jest (with coverage)
npm run lint        # ESLint + Prettier check
npm run lint:fix    # Auto-fix lint issues
npm run typecheck   # tsc --noEmit
```

---

## Important Constraints

- **Never** modify files in `dist/` — these are build outputs
- **Never** commit secrets or API keys — use environment variables
- **Always** run `npm test` before considering a task complete
- **Always** update relevant docs when changing behaviour

---

## Feature Demonstrations

When Claude is explaining or demonstrating features:
1. Use this codebase as the example target
2. Reference actual files that exist in the repo
3. Show before/after when making changes
4. Explain the Claude Code concept being demonstrated

---

## Git Conventions

- Branch: `feature/description`, `fix/description`, `docs/description`
- Commits: conventional commits format (`feat:`, `fix:`, `docs:`, `chore:`)
- PR titles should explain the *why* not just the *what*
