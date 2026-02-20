# /new-handler — Scaffold a New API Handler

Guided scaffolding for adding a new route handler to `src/api/index.ts`. Invoke the
`software-engineer` agent to implement the handler and its colocated test following the
patterns established in the existing codebase.

## Steps

### 1. Gather Requirements

Ask for (or infer from context):
- **HTTP method** — GET, POST, PUT, DELETE, PATCH
- **Route** — e.g., `/items/:id`
- **Handler name** — e.g., `handleDeleteItem` (follow the `handle<Verb><Resource>` convention)
- **Request shape** — what inputs does it accept? (path params, body fields, query params)
- **Response shape** — what does it return on success? On each error case?

### 2. Read Existing Source First

Before writing anything, read `src/api/index.ts` to understand:
- The existing `ApiResponse<T>` envelope — all handlers must return this shape
- The `ValidationError` import from `src/errors/` — use this for all input errors
- The `logger` import from `src/utils/logger` — use this instead of `console.log`
- The naming conventions, comment style, and section structure

### 3. Implement the Handler

Invoke the `software-engineer` agent to add the handler to `src/api/index.ts` following
this pattern exactly:

```typescript
/**
 * DELETE /items/:id
 * [One-line description of what this handler does and why it exists.]
 *
 * @param id - [Description of the parameter and its constraints.]
 * @returns ApiResponse<[ReturnType]> — [What the data field contains on success.]
 */
export function handleDeleteItem(id: string): ApiResponse<void> {
  // Validate at the boundary — before any store access or business logic
  if (!id || id.trim().length === 0) {
    const err = new ValidationError("Item id is required.", "id");
    return { success: false, error: err.message };
  }

  if (!items.has(id)) {
    return { success: false, error: `Item with id '${id}' not found.` };
  }

  items.delete(id);
  logger.info("Item deleted", { id });
  return { success: true };
}
```

Rules the implementation must satisfy:
- JSDoc block present with `@param` and `@returns` tags
- All input validated at the top of the function before any other logic
- `ValidationError` (not raw `Error`) used for input errors
- `logger.info` (not `console.log`) for observability
- Function body under 50 lines — decompose into helpers if needed

### 4. Write the Colocated Test

Invoke the `quality-assurance-engineer` agent to add test cases to `src/api/index.test.ts`.
Minimum required coverage for the new handler:

| Scenario | What to assert |
|----------|---------------|
| Valid input | `success: true`, `data` field present with correct shape |
| Missing / empty required field | `success: false`, exact error message string |
| Resource not found (if applicable) | `success: false`, correct not-found message |
| Boundary conditions | One test per numeric or length limit |

### 5. Verify the Build

```bash
npm run typecheck    # Catch TypeScript errors before running tests
npm run lint         # Verify ESLint and Prettier compliance
npm test             # Confirm coverage stays above 80% and all tests pass
```

All three must pass before the handler is considered done.

### 6. Update Docs

Invoke the `technical-writer` agent to add the new handler to `docs/prompting/intent-guide.md`
(or whichever doc covers the available API handlers). The entry should document the handler's
purpose, parameters, and response shape — not just list the function name.
