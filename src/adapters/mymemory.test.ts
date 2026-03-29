import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyMemoryAdapter } from "./mymemory.js";

const adapter = new MyMemoryAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("MyMemoryAdapter", () => {
  it("returns translation on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: "Hallo" },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ text: "Hello", source: "en", target: "de" });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      translatedText: "Hallo",
      source: "en",
      target: "de",
    });
  });

  it("defaults source to en and target to de", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: "Hallo" },
        }),
        { status: 200 },
      ),
    );

    await adapter.execute({ text: "Hello" });

    const url = fetchSpy.mock.calls[0][0] as URL;
    expect(url.searchParams.get("langpair")).toBe("en|de");
  });

  it("returns error on empty text", async () => {
    const res = await adapter.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing text/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ text: "Hello" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });

  it("returns error on API error status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          responseStatus: 403,
          responseData: { translatedText: "" },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ text: "Hello" });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/403/);
  });
});
