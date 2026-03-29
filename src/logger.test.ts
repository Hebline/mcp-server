import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// We need to override the log path for tests. The simplest way is to
// re-mock the module internals. Instead we test the logger through its
// public API after pointing HOME to a temp dir.

describe("Logger", () => {
  const origHome = process.env.HOME;
  let tempHome: string;

  beforeEach(async () => {
    tempHome = join(tmpdir(), `hebline-test-${Date.now()}`);
    await mkdir(tempHome, { recursive: true });
    process.env.HOME = tempHome;

    // Force re-import so the module picks up the new HOME
    vi.resetModules();
  });

  afterEach(async () => {
    process.env.HOME = origHome;
    await rm(tempHome, { recursive: true, force: true });
  });

  it("creates ~/.hebline/ and writes valid JSONL", async () => {
    const { logCall } = await import("./logger.js");

    await logCall({
      timestamp: "2026-03-29T10:00:00.000Z",
      capability: "geocoding",
      serviceId: "nominatim",
      latencyMs: 200,
      success: true,
      costUsd: 0,
    });

    const logPath = join(tempHome, ".hebline", "calls.jsonl");
    const content = await readFile(logPath, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines).toHaveLength(1);

    const entry = JSON.parse(lines[0]);
    expect(entry.capability).toBe("geocoding");
    expect(entry.serviceId).toBe("nominatim");
    expect(entry.success).toBe(true);
  });

  it("appends multiple entries", async () => {
    const { logCall } = await import("./logger.js");

    await logCall({
      timestamp: "2026-03-29T10:00:00.000Z",
      capability: "geocoding",
      serviceId: "nominatim",
      latencyMs: 200,
      success: true,
      costUsd: 0,
    });

    await logCall({
      timestamp: "2026-03-29T10:00:01.000Z",
      capability: "translation",
      serviceId: "libretranslate",
      latencyMs: 500,
      success: false,
      costUsd: 0,
    });

    const logPath = join(tempHome, ".hebline", "calls.jsonl");
    const content = await readFile(logPath, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).capability).toBe("geocoding");
    expect(JSON.parse(lines[1]).capability).toBe("translation");
    expect(JSON.parse(lines[1]).success).toBe(false);
  });
});
