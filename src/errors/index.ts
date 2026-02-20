/**
 * @file src/errors/index.ts
 * @description Barrel export for all typed error classes.
 *
 * Import errors from this path rather than individual files:
 * ```ts
 * import { ValidationError } from "../errors";
 * ```
 * This keeps imports stable if error classes are reorganised into subdirectories later.
 */

export { ValidationError } from "./ValidationError";
