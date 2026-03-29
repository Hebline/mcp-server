import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { route, routeBest } from "./router.js";

describe("Router", () => {
  // ── Constraint: free ──────────────────────────────────────────────
  describe("free constraint", () => {
    it("only returns free services", () => {
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "free",
      });

      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.service.free).toBe(true);
      }
    });

    it("excludes paid services even with key available", () => {
      process.env.GOOGLE_MAPS_API_KEY = "test";
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "free",
      });
      delete process.env.GOOGLE_MAPS_API_KEY;

      const ids = results.map((r) => r.service.id);
      expect(ids).not.toContain("google-maps");
      expect(ids).toContain("nominatim");
    });
  });

  // ── Constraint: any ───────────────────────────────────────────────
  describe("any constraint", () => {
    it("excludes paid services without API key", () => {
      delete process.env.GOOGLE_MAPS_API_KEY;
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "any",
      });

      const ids = results.map((r) => r.service.id);
      expect(ids).not.toContain("google-maps");
    });

    it("includes paid services when key is set", () => {
      process.env.GOOGLE_MAPS_API_KEY = "test";
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "any",
      });
      delete process.env.GOOGLE_MAPS_API_KEY;

      const ids = results.map((r) => r.service.id);
      expect(ids).toContain("google-maps");
      expect(ids).toContain("nominatim");
    });
  });

  // ── Scoring ───────────────────────────────────────────────────────
  describe("scoring", () => {
    it("returns results sorted by score (best first)", () => {
      process.env.GOOGLE_MAPS_API_KEY = "test";
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "any",
      });
      delete process.env.GOOGLE_MAPS_API_KEY;

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it("scores include quality, cost, latency, reliability breakdown", () => {
      const results = route({
        capability: "geocoding",
        input: {},
        constraint: "free",
      });

      const bd = results[0].breakdown;
      expect(bd).toHaveProperty("quality");
      expect(bd).toHaveProperty("cost");
      expect(bd).toHaveProperty("latency");
      expect(bd).toHaveProperty("reliability");
    });

    it("all scores are between 0 and 1", () => {
      process.env.GOOGLE_MAPS_API_KEY = "test";
      process.env.DEEPL_API_KEY = "test";
      const geocoding = route({ capability: "geocoding", input: {}, constraint: "any" });
      const translation = route({ capability: "translation", input: {}, constraint: "any" });
      delete process.env.GOOGLE_MAPS_API_KEY;
      delete process.env.DEEPL_API_KEY;

      for (const r of [...geocoding, ...translation]) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── Unknown capability ────────────────────────────────────────────
  describe("unknown capability", () => {
    it("returns empty array", () => {
      const results = route({
        capability: "nonexistent",
        input: {},
        constraint: "any",
      });

      expect(results).toEqual([]);
    });
  });

  // ── routeBest ─────────────────────────────────────────────────────
  describe("routeBest", () => {
    it("returns the top-scored service", () => {
      const best = routeBest({
        capability: "geocoding",
        input: {},
        constraint: "free",
      });

      expect(best).not.toBeNull();
      expect(best!.service.id).toBe("nominatim");
    });

    it("returns null for unknown capability", () => {
      const best = routeBest({
        capability: "nonexistent",
        input: {},
        constraint: "any",
      });

      expect(best).toBeNull();
    });
  });

  // ── Translation ───────────────────────────────────────────────────
  describe("translation routing", () => {
    it("routes to mymemory when free", () => {
      const best = routeBest({
        capability: "translation",
        input: {},
        constraint: "free",
      });

      expect(best!.service.id).toBe("mymemory");
    });

    it("prefers DeepL with key on 'any' constraint", () => {
      process.env.DEEPL_API_KEY = "test";
      const best = routeBest({
        capability: "translation",
        input: {},
        constraint: "any",
      });
      delete process.env.DEEPL_API_KEY;

      // DeepL has higher quality + speed, should win
      expect(best!.service.id).toBe("deepl");
    });
  });
});
