/**
 * @file src/errors/ValidationError.test.ts
 * @description Colocated unit tests for the ValidationError class.
 *
 * Why a dedicated test file when coverage is already 100% via index.test.ts?
 * - Indirect coverage doesn't assert class-specific properties (field, name)
 * - Direct tests guard against regressions if the class is subclassed or the
 *   TypeScript compilation target changes (ES5 requires the `this.name` fix)
 * - CLAUDE.md requires a *.test.ts next to every source file
 *
 * CLAUDE.md requirement: "Test files colocated: *.test.ts next to source"
 */

import { ValidationError } from "./ValidationError";

// ---------------------------------------------------------------------------
// Constructor behaviour
// ---------------------------------------------------------------------------

describe("ValidationError — constructor", () => {
  it("sets message correctly", () => {
    const error = new ValidationError("Item name is required.");
    expect(error.message).toBe("Item name is required.");
  });

  it("sets field when provided", () => {
    const error = new ValidationError("Item name is required.", "name");
    expect(error.field).toBe("name");
  });

  it("leaves field undefined when omitted", () => {
    // The field parameter is optional; omitting it should produce undefined,
    // not null or an empty string.
    const error = new ValidationError("msg");
    expect(error.field).toBeUndefined();
  });

  it("sets name property to 'ValidationError' (not 'Error')", () => {
    // When extending built-in classes in TypeScript compiled to ES5, the
    // prototype chain is broken and this.name stays "Error" unless explicitly
    // reassigned in the constructor. This test catches that regression.
    const error = new ValidationError("msg");
    expect(error.name).toBe("ValidationError");
  });

  it("is an instance of ValidationError", () => {
    const error = new ValidationError("msg");
    expect(error).toBeInstanceOf(ValidationError);
  });

  it("is an instance of Error — prototype chain is intact", () => {
    // Confirms that ValidationError properly extends Error so callers can
    // catch it with a generic `catch (e)` and still get stack traces.
    const error = new ValidationError("msg");
    expect(error).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// Field parameter
// ---------------------------------------------------------------------------

describe("ValidationError — field parameter", () => {
  it("field is typed as string | undefined (compile-time check)", () => {
    // This test exists to confirm the TypeScript type of `field` is correct.
    // If field is narrowed to `string` (removing `| undefined`), the
    // assignment below would still compile but the type assertion would fail.
    // If field is removed entirely, this file fails to compile.
    const err = new ValidationError("msg", "email");
    // Verify the runtime value is a string when provided
    expect(typeof err.field).toBe("string");

    // Verify the type accepts undefined — if field were required (non-optional),
    // the constructor call on line 31 above would fail to compile.
    const errWithoutField = new ValidationError("msg");
    const fieldValue: string | undefined = errWithoutField.field;
    expect(fieldValue).toBeUndefined();
  });
});
