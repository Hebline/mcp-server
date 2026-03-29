import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleMapsAdapter } from "./google-maps.js";

const adapter = new GoogleMapsAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.GOOGLE_MAPS_API_KEY = "test-key-123";
});

afterEach(() => {
  delete process.env.GOOGLE_MAPS_API_KEY;
});

describe("GoogleMapsAdapter", () => {
  it("returns geocoding result on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "OK",
          results: [
            {
              geometry: { location: { lat: 52.516, lng: 13.377 } },
              formatted_address: "Brandenburger Tor, Berlin, Germany",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "Brandenburger Tor" });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      lat: 52.516,
      lon: 13.377,
      displayName: "Brandenburger Tor, Berlin, Germany",
    });
  });

  it("returns error when API key is missing", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;

    const res = await adapter.execute({ query: "Berlin" });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/GOOGLE_MAPS_API_KEY/);
  });

  it("returns error on empty input", async () => {
    const res = await adapter.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });

  it("returns error on ZERO_RESULTS status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ status: "ZERO_RESULTS", results: [] }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "xyznonexistent" });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/ZERO_RESULTS/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ query: "Berlin" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });
});
