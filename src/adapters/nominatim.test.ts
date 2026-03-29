import { describe, it, expect, vi, beforeEach } from "vitest";
import { NominatimAdapter } from "./nominatim.js";

const adapter = new NominatimAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("NominatimAdapter", () => {
  it("returns geocoding result on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { lat: "52.516", lon: "13.377", display_name: "Brandenburger Tor, Berlin" },
        ]),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "Brandenburger Tor" });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      lat: 52.516,
      lon: 13.377,
      displayName: "Brandenburger Tor, Berlin",
    });
  });

  it("returns error when no results found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const res = await adapter.execute({ query: "xyznonexistent12345" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("No results found");
  });

  it("returns error on empty input", async () => {
    const res = await adapter.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 503 }),
    );

    const res = await adapter.execute({ query: "Berlin" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 503");
  });

  it("accepts address field as alias for query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ lat: "48.8", lon: "2.3", display_name: "Paris" }]),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ address: "Paris" });

    expect(res.success).toBe(true);
  });
});
