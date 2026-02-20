/**
 * @file src/utils/logger.test.ts
 * @description Tests for the structured JSON logger utility.
 *
 * Testing strategy:
 * - Spy on process.stdout.write and process.stderr.write to capture output
 *   without actually printing to the terminal during the test run.
 * - Verify each log level writes to the correct stream and produces valid JSON
 *   with the expected `level`, `message`, and `timestamp` fields.
 * - The `meta` spread is verified by checking that extra keys appear in output.
 */

import { logger } from "./logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses the first JSON line written to the spied stream.
 * Throws if the output is not valid JSON — which counts as a test failure.
 */
function parseOutput(spy: jest.SpyInstance): Record<string, unknown> {
  const raw = (spy.mock.calls[0][0] as string).trim();
  return JSON.parse(raw) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("logger", () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress actual output during tests while capturing what was written
    stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe("logger.info", () => {
    it("writes to stdout", () => {
      logger.info("hello");
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("outputs valid JSON with level 'info'", () => {
      logger.info("test message");
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe("info");
      expect(entry.message).toBe("test message");
      expect(typeof entry.timestamp).toBe("string");
    });

    it("spreads meta fields into the JSON entry", () => {
      logger.info("with meta", { requestId: "abc-123", userId: 42 });
      const entry = parseOutput(stdoutSpy);
      expect(entry.requestId).toBe("abc-123");
      expect(entry.userId).toBe(42);
    });
  });

  describe("logger.warn", () => {
    it("writes to stdout", () => {
      logger.warn("warning message");
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    it("outputs valid JSON with level 'warn'", () => {
      logger.warn("something unexpected");
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe("warn");
      expect(entry.message).toBe("something unexpected");
    });
  });

  describe("logger.error", () => {
    it("writes to stderr (not stdout)", () => {
      logger.error("failure");
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("outputs valid JSON with level 'error'", () => {
      logger.error("something broke", { code: 500 });
      const entry = parseOutput(stderrSpy);
      expect(entry.level).toBe("error");
      expect(entry.message).toBe("something broke");
      expect(entry.code).toBe(500);
    });
  });

  describe("logger.debug", () => {
    it("writes to stdout", () => {
      logger.debug("debug detail");
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    it("outputs valid JSON with level 'debug'", () => {
      logger.debug("diagnostic info");
      const entry = parseOutput(stdoutSpy);
      expect(entry.level).toBe("debug");
      expect(entry.message).toBe("diagnostic info");
    });
  });
});
