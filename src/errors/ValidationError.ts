/**
 * @file src/errors/ValidationError.ts
 * @description Typed error for input validation failures.
 *
 * Why extend Error instead of using a plain string?
 * - Typed errors can be caught selectively with `instanceof` checks
 * - The `field` property tells callers *which* input was invalid without
 *   parsing the message string
 * - Stack traces are preserved for debugging
 *
 * CLAUDE.md requirement: "Error handling: always use typed errors from src/errors/"
 */

/**
 * Thrown when user-supplied input fails validation.
 *
 * @example
 * ```ts
 * throw new ValidationError("Item name is required.", "name");
 * // error.field === "name"
 * // error.message === "Item name is required."
 * // error instanceof ValidationError === true
 * // error instanceof Error === true
 * ```
 */
export class ValidationError extends Error {
  /**
   * @param message - Human-readable description of the validation failure.
   * @param field - Optional name of the input field that failed validation.
   */
  constructor(
    message: string,
    /** The input field that failed validation, if applicable. */
    public readonly field?: string
  ) {
    super(message);
    // Required when extending built-in classes in TypeScript with ES5 compilation target
    this.name = "ValidationError";
  }
}
