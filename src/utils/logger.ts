/**
 * @file src/utils/logger.ts
 * @description Structured JSON logger utility for the demo project.
 *
 * Why structured logging?
 * - Machine-readable JSON output integrates with log aggregation tools (Datadog, CloudWatch, etc.)
 * - Consistent format makes grepping and filtering predictable
 * - The `meta` parameter allows attaching arbitrary context (request IDs, item IDs, etc.)
 *   without polluting the message string itself
 *
 * Why a singleton object instead of a class?
 * - For a demo project, a plain object export is the simplest correct solution
 * - No instantiation needed; import and use directly
 */

/** Supported log levels, in increasing severity order. */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Writes a structured JSON log entry to stdout (debug/info/warn) or stderr (error).
 *
 * @param level - Severity level of the log entry.
 * @param message - Human-readable description of the event.
 * @param meta - Optional key-value pairs providing additional context.
 */
function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ?? {}),
  });

  // Errors go to stderr so they can be captured separately by log collectors
  if (level === "error") {
    process.stderr.write(entry + "\n");
  } else {
    process.stdout.write(entry + "\n");
  }
}

/**
 * Singleton logger instance.
 *
 * Usage:
 * ```ts
 * import { logger } from "../utils/logger";
 * logger.info("Item created", { id: newItem.id });
 * logger.error("Unexpected failure", { error: err.message });
 * ```
 */
export const logger = {
  /** Log a debug-level message (development diagnostics). */
  debug: (message: string, meta?: Record<string, unknown>) => writeLog("debug", message, meta),

  /** Log an informational message (normal operations). */
  info: (message: string, meta?: Record<string, unknown>) => writeLog("info", message, meta),

  /** Log a warning (unexpected but recoverable condition). */
  warn: (message: string, meta?: Record<string, unknown>) => writeLog("warn", message, meta),

  /** Log an error (operation failed; requires attention). */
  error: (message: string, meta?: Record<string, unknown>) => writeLog("error", message, meta),
};
