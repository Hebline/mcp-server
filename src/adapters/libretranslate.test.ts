import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LibreTranslateAdapter } from "./libretranslate.js";

const adapter = new LibreTranslateAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.LIBRETRANSLATE_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.LIBRETRANSLATE_API_KEY;
  delete process.env.LIBRETRANSLATE_HOST;
});

describe("LibreTranslateAdapter", () => {
  it("returns translation on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ translatedText: "Bonjour" }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ text: "Hello", target: "fr" });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      translatedText: "Bonjour",
      source: "auto",
      target: "fr",
    });
  });

  it("returns error when API key is missing", async () => {
    delete process.env.LIBRETRANSLATE_API_KEY;

    const res = await adapter.execute({ text: "Hello", target: "de" });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/LIBRETRANSLATE_API_KEY/);
  });

  it("returns error on empty text", async () => {
    const res = await adapter.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing text/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 429 }),
    );

    const res = await adapter.execute({ text: "Hello", target: "de" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 429");
  });

  it("sends api_key in body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ translatedText: "Hola" }), { status: 200 }),
    );

    await adapter.execute({ text: "Hello", target: "es" });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.api_key).toBe("test-key");
  });
});
