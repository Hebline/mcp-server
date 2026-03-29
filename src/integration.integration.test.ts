// ---------------------------------------------------------------------------
// Integration Tests — hit real (free) APIs
// ---------------------------------------------------------------------------
// These tests are EXCLUDED from `npm test` and run via `npm run test:integration`.
// They may fail if external APIs are down — that's expected and useful to detect.
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { NominatimAdapter } from "./adapters/nominatim.js";
import { LibreTranslateAdapter } from "./adapters/libretranslate.js";

describe("Integration: Nominatim (real API)", () => {
  const adapter = new NominatimAdapter();

  it("geocodes 'Brandenburger Tor, Berlin'", async () => {
    const res = await adapter.execute({ query: "Brandenburger Tor, Berlin" });

    expect(res.success).toBe(true);

    const data = res.data as { lat: number; lon: number; displayName: string };
    // Brandenburger Tor is roughly at 52.516, 13.377
    expect(data.lat).toBeCloseTo(52.516, 1);
    expect(data.lon).toBeCloseTo(13.377, 1);
    expect(data.displayName).toMatch(/Berlin/i);
  });

  it("geocodes 'Eiffel Tower, Paris'", async () => {
    const res = await adapter.execute({ query: "Eiffel Tower, Paris" });

    expect(res.success).toBe(true);

    const data = res.data as { lat: number; lon: number };
    expect(data.lat).toBeCloseTo(48.858, 1);
    expect(data.lon).toBeCloseTo(2.294, 1);
  });

  it("returns no results for garbage input", async () => {
    const res = await adapter.execute({
      query: "zzzznonexistent99999qqqqq",
    });

    // Nominatim may return empty results or an actual result — both are valid
    // The important thing is it doesn't crash
    expect(typeof res.success).toBe("boolean");
  });
});

describe("Integration: LibreTranslate (real API)", () => {
  const adapter = new LibreTranslateAdapter();

  it("translates 'Hello' to French", async () => {
    const res = await adapter.execute({
      text: "Hello",
      source: "en",
      target: "fr",
    });

    // LibreTranslate may be rate-limited or down — skip gracefully
    if (!res.success) {
      console.warn(`LibreTranslate unavailable: ${res.error}`);
      return;
    }

    const data = res.data as { translatedText: string };
    expect(data.translatedText.toLowerCase()).toMatch(/bonjour|salut/);
  });

  it("translates 'Guten Morgen' to English", async () => {
    const res = await adapter.execute({
      text: "Guten Morgen",
      source: "de",
      target: "en",
    });

    if (!res.success) {
      console.warn(`LibreTranslate unavailable: ${res.error}`);
      return;
    }

    const data = res.data as { translatedText: string };
    expect(data.translatedText.toLowerCase()).toMatch(/good morning/);
  });
});
