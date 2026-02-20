# Prompting with Intent — Claude Code Guide

The difference between a mediocre result and a great one is almost always the quality of the prompt. This guide shows you how to prompt Claude Code effectively.

---

## The Core Principle: Give Claude the Context a Senior Developer Would Want

Before starting any task, a good developer would want to know:
1. **What** needs to be done
2. **Why** it matters
3. **Constraints** to work within
4. **Definition of done** — how to know it's complete

Your prompts should answer all four.

---

## Plan Mode — Think Before Acting

Always use plan mode for non-trivial tasks:

```bash
# In Claude Code session, prefix with "think about" or use --plan flag
claude --plan "Refactor the authentication module to use JWT"
```

Or inside a session:
```
> Before writing any code, create a detailed plan for how you'll refactor 
  the auth module to use JWT. Include what files change and what tests you'll need.
```

Claude will output its full approach before touching any code. **Review the plan first.**

---

## The Weak → Strong Prompt Pattern

### Fixing Bugs

```
# ❌ Weak
"Fix the login bug"

# ✅ Strong
"The POST /api/auth/login endpoint returns a 500 error when the user's email 
contains a + character (e.g. user+tag@email.com). This is causing support tickets.

Fix this in src/auth/loginHandler.ts without changing the API contract.
The existing login tests must still pass, and add a new test specifically 
for emails with + characters."
```

### Adding Features

```
# ❌ Weak
"Add pagination"

# ✅ Strong
"Add cursor-based pagination to GET /api/users. 

Requirements:
- Accept optional `cursor` and `limit` query params (limit default: 20, max: 100)
- Return `{ data: User[], nextCursor: string | null }` 
- Use the user's `id` as the cursor (encode as base64)
- Must be consistent even if new users are added mid-pagination

Follow the same pattern as GET /api/products which already has pagination.
Update the OpenAPI docs in docs/api.yaml. Tests required."
```

### Refactoring

```
# ❌ Weak
"Clean up the database code"

# ✅ Strong
"The database connection logic is duplicated across 6 files in src/repositories/.
Extract it into a shared ConnectionPool class in src/db/connectionPool.ts.

Constraints:
- Don't change any public interfaces
- All existing tests must still pass
- The pool should be a singleton
- Handle connection errors gracefully with retry logic (3 attempts, exponential backoff)

Don't refactor anything outside of src/repositories/ and src/db/ in this PR."
```

---

## Scoping — Preventing Scope Creep

Claude will sometimes try to be helpful by fixing adjacent issues. Control this:

```
"Only modify files in src/auth/. Do not touch anything else, even if you 
see improvements to make elsewhere. Note other improvements in a comment 
but don't implement them."
```

---

## Iterative Refinement

For complex features, break into stages:

```
Stage 1: "Add the data model and database migration. Don't add any endpoints yet."
Stage 2: "Add the repository layer with read/write methods. No endpoints yet."
Stage 3: "Add the service layer with business logic."
Stage 4: "Add the REST endpoints and wire everything together."
Stage 5: "Write comprehensive tests for the full flow."
```

---

## Using $ARGUMENTS in Skills/Commands

When creating reusable skills, use `$ARGUMENTS` as a placeholder:

```markdown
<!-- .claude/commands/fix-issue.md -->
Fix GitHub issue #$ARGUMENTS following our coding standards.

1. Read the issue description
2. Find the relevant code
3. Implement the fix with tests
4. Write a clear commit message referencing #$ARGUMENTS
```

Usage: `/fix-issue 142`

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Instead |
|-------------|-------------|---------|
| "Make it better" | No clear success criteria | Define what "better" means |
| "Fix all the bugs" | Unbounded scope | Fix one specific bug |
| "Rewrite this" | Nuclear option | Refactor incrementally |
| "You know what to do" | Claude doesn't | Always provide context |
| Long chat history as context | Context degrades | Use CLAUDE.md for persistent context |

---

## The Prompting Checklist

Before sending any non-trivial prompt, check:

- [ ] Did I describe **what** needs to happen?
- [ ] Did I explain **why** (even briefly)?
- [ ] Did I state **constraints** (files to touch, patterns to follow)?
- [ ] Did I define **done** (tests pass, docs updated, etc.)?
- [ ] Should I use **plan mode** first?
- [ ] Is this **small enough** to do in one prompt, or should I stage it?
