/**
 * @file src/api/index.ts
 * @description Sample REST API demonstrating TypeScript best practices.
 *
 * This file is a teaching example for Claude Code demos, showing:
 * - TypeScript interfaces for typed request/response shapes
 * - JSDoc on all exported members (required by CLAUDE.md)
 * - Input validation at system boundaries
 * - Clean separation of handler logic from routing
 */

import { logger } from "../utils/logger";
import { ValidationError } from "../errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents a single item in the demo collection. */
export interface Item {
  id: string;
  name: string;
  createdAt: Date;
}

/** Request body shape for creating an item. */
export interface CreateItemRequest {
  name: string;
}

/** Standard API response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// In-memory store (demo only — resets on process restart)
// ---------------------------------------------------------------------------

const items: Map<string, Item> = new Map();

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * GET /health
 * Returns service health status. Used by load balancers and CI checks.
 *
 * @returns ApiResponse with a status string.
 */
export function handleHealthCheck(): ApiResponse<{ status: string }> {
  return { success: true, data: { status: "ok" } };
}

/**
 * GET /items
 * Returns all items currently in the collection.
 *
 * @returns ApiResponse containing an array of items.
 */
export function handleGetItems(): ApiResponse<Item[]> {
  return { success: true, data: Array.from(items.values()) };
}

/**
 * POST /items
 * Validates the request body and creates a new item.
 *
 * @param body - Request body containing the item name. May be null/undefined at runtime
 *               if called from an untyped HTTP layer, so we guard before accessing properties.
 * @returns ApiResponse with the newly created item, or an error message.
 */
export function handleCreateItem(body: CreateItemRequest | null | undefined): ApiResponse<Item> {
  // Guard against a missing body entirely — possible when called from an untyped HTTP layer
  if (!body) {
    const err = new ValidationError("Request body is required.", "body");
    return { success: false, error: err.message };
  }

  // Validate at the system boundary — never trust external input
  if (!body.name || body.name.trim().length === 0) {
    const err = new ValidationError("Item name is required.", "name");
    return { success: false, error: err.message };
  }

  // Use trimmed length so leading/trailing whitespace doesn't silently inflate the count
  if (body.name.trim().length > 100) {
    const err = new ValidationError("Item name must not exceed 100 characters.", "name");
    return { success: false, error: err.message };
  }

  const newItem: Item = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    createdAt: new Date(),
  };

  items.set(newItem.id, newItem);

  // Structured log so every item creation is observable in production logs
  logger.info("Item created", { id: newItem.id });

  return { success: true, data: newItem };
}

/**
 * Clears all items from the in-memory store.
 *
 * Exported for test isolation — call this in `beforeEach` to start each test
 * with a clean slate rather than relying on unique names to avoid collisions.
 */
export function clearItems(): void {
  items.clear();
}
