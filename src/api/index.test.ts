/**
 * @file src/api/index.test.ts
 * @description Jest tests for the demo API handlers.
 *
 * Testing strategy:
 * - Each handler gets its own describe() block for clarity
 * - State isolation: clearItems() is called in beforeEach so every test starts
 *   with a clean in-memory store — no cross-test collisions.
 * - Happy-path and error-path cases are both covered to hit >80% lines/branches/functions.
 */

import {
  handleHealthCheck,
  handleGetItems,
  handleCreateItem,
  clearItems,
  Item,
  ApiResponse,
  CreateItemRequest,
} from "./index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a name that is exactly `length` characters long.
 * Useful for boundary tests on the 100-char limit.
 */
function nameOfLength(length: number): string {
  return "a".repeat(length);
}

// ---------------------------------------------------------------------------
// State isolation
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset the in-memory store before each test so tests are fully independent.
  // Without this, items created in one test leak into later tests.
  clearItems();
});

// ---------------------------------------------------------------------------
// handleHealthCheck
// ---------------------------------------------------------------------------

describe("handleHealthCheck", () => {
  it("returns success: true", () => {
    const response = handleHealthCheck();
    expect(response.success).toBe(true);
  });

  it("returns data.status of 'ok'", () => {
    const response = handleHealthCheck();
    expect(response.data?.status).toBe("ok");
  });

  it("does not include an error field", () => {
    const response = handleHealthCheck();
    expect(response.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// handleGetItems
// ---------------------------------------------------------------------------

describe("handleGetItems", () => {
  it("returns success: true", () => {
    const response = handleGetItems();
    expect(response.success).toBe(true);
  });

  it("returns an array in data", () => {
    const response = handleGetItems();
    expect(Array.isArray(response.data)).toBe(true);
  });

  it("includes items that were previously created", () => {
    // Create a uniquely named item so we can find it among any existing items
    const uniqueName = `getItems-test-${Date.now()}`;
    handleCreateItem({ name: uniqueName });

    const response = handleGetItems();
    const found = response.data?.find((item: Item) => item.name === uniqueName);
    expect(found).toBeDefined();
  });

  it("does not include an error field", () => {
    const response = handleGetItems();
    expect(response.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// handleCreateItem — happy paths
// ---------------------------------------------------------------------------

describe("handleCreateItem — valid input", () => {
  it("returns success: true for a valid name", () => {
    const response = handleCreateItem({ name: "My Item" });
    expect(response.success).toBe(true);
  });

  it("returns the created item in data", () => {
    const response = handleCreateItem({ name: "Demo Item" });
    expect(response.data).toBeDefined();
  });

  it("assigns a non-empty string id to the new item", () => {
    const response = handleCreateItem({ name: "Has ID" });
    expect(typeof response.data?.id).toBe("string");
    expect(response.data?.id.length).toBeGreaterThan(0);
  });

  it("generates a UUID-formatted id", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const response = handleCreateItem({ name: "UUID Check" });
    expect(response.data?.id).toMatch(uuidRegex);
  });

  it("stores the trimmed name on the item", () => {
    const response = handleCreateItem({ name: "  Trimmed  " });
    expect(response.data?.name).toBe("Trimmed");
  });

  it("sets createdAt to a Date instance", () => {
    const response = handleCreateItem({ name: "Has Date" });
    expect(response.data?.createdAt).toBeInstanceOf(Date);
  });

  it("sets createdAt to approximately the current time", () => {
    const before = new Date();
    const response = handleCreateItem({ name: "Timestamp" });
    const after = new Date();

    const createdAt = response.data?.createdAt as Date;
    expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("does not include an error field on success", () => {
    const response = handleCreateItem({ name: "No Error" });
    expect(response.error).toBeUndefined();
  });

  it("accepts a name that is exactly 100 characters (boundary)", () => {
    const response = handleCreateItem({ name: nameOfLength(100) });
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.error).toBeUndefined();
  });

  it("accepts a name that is exactly 99 characters (limit - 1 boundary)", () => {
    // Verifies the boundary is exclusive: 99 chars is safely within the limit
    const response = handleCreateItem({ name: nameOfLength(99) });
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.error).toBeUndefined();
  });

  it("accepts a padded name whose trimmed length is 99 characters", () => {
    // Raw length = 101 (spaces included), trimmed length = 99 (within limit).
    // Validates that the length check operates on the trimmed value, not the raw input.
    const paddedName = " " + nameOfLength(99) + " ";
    const response = handleCreateItem({ name: paddedName });
    expect(response.success).toBe(true);
    expect(response.data?.name).toBe(nameOfLength(99));
  });

  it("generates unique ids for separate items", () => {
    const r1 = handleCreateItem({ name: "Unique 1" });
    const r2 = handleCreateItem({ name: "Unique 2" });
    expect(r1.data?.id).not.toBe(r2.data?.id);
  });

  it("makes the new item retrievable via handleGetItems", () => {
    const uniqueName = `retrievable-${Date.now()}`;
    const createResponse = handleCreateItem({ name: uniqueName });
    const createdId = createResponse.data?.id;

    const listResponse = handleGetItems();
    const found = listResponse.data?.find((item: Item) => item.id === createdId);
    expect(found).toBeDefined();
    expect(found?.name).toBe(uniqueName);
  });

  it("allows two items with the same name (no uniqueness constraint)", () => {
    // Documents intentional behaviour: the store is keyed by UUID, not by name,
    // so duplicate names are permitted. This is a deliberate demo simplification.
    const r1 = handleCreateItem({ name: "Duplicate Name" });
    const r2 = handleCreateItem({ name: "Duplicate Name" });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.data?.id).not.toBe(r2.data?.id);
  });
});

// ---------------------------------------------------------------------------
// handleCreateItem — validation errors
// ---------------------------------------------------------------------------

describe("handleCreateItem — invalid input", () => {
  it("rejects an empty string name", () => {
    const response = handleCreateItem({ name: "" });
    expect(response.success).toBe(false);
  });

  it("returns the 'name required' error message for an empty name", () => {
    const response = handleCreateItem({ name: "" });
    expect(response.error).toBe("Item name is required.");
  });

  it("rejects a whitespace-only name", () => {
    const response = handleCreateItem({ name: "   " });
    expect(response.success).toBe(false);
    expect(response.error).toBe("Item name is required.");
  });

  it("returns no data when name is empty", () => {
    const response: ApiResponse<Item> = handleCreateItem({ name: "" });
    expect(response.data).toBeUndefined();
  });

  it("rejects a name that is 101 characters (one over the limit)", () => {
    const response = handleCreateItem({ name: nameOfLength(101) });
    expect(response.success).toBe(false);
  });

  it("returns the 'exceeds 100 characters' error message for a long name", () => {
    const response = handleCreateItem({ name: nameOfLength(101) });
    expect(response.error).toBe("Item name must not exceed 100 characters.");
  });

  it("rejects a very long name", () => {
    const response = handleCreateItem({ name: nameOfLength(500) });
    expect(response.success).toBe(false);
    expect(response.error).toBe("Item name must not exceed 100 characters.");
  });

  it("returns no data when name is too long", () => {
    const response: ApiResponse<Item> = handleCreateItem({ name: nameOfLength(101) });
    expect(response.data).toBeUndefined();
  });

  it("rejects a null body", () => {
    // Documents the null-guard added in Step 3: the function signature accepts null
    // at runtime (HTTP layers may pass nothing) and returns a graceful error.
    const response = handleCreateItem(null);
    expect(response.success).toBe(false);
    expect(response.error).toBe("Request body is required.");
  });
});

// ---------------------------------------------------------------------------
// Type usage verification (compile-time check)
// ---------------------------------------------------------------------------

describe("exported types", () => {
  it("CreateItemRequest is usable as a typed object", () => {
    // This test exists to confirm the type is exported correctly.
    // If CreateItemRequest is removed or renamed, this line fails to compile.
    const req: CreateItemRequest = { name: "Type Check" };
    expect(req.name).toBe("Type Check");
  });
});
