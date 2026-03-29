import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeepLAdapter } from "./deepl.js";

const adapter = new DeepLAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.DEEPL_API_KEY = "test-pro-key";
});

afterEach(() => {
  delete process.env.DEEPL_API_KEY;
});

describe("DeepLAdapter", () => {
  it("returns translation on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          translations: [{ detected_source_language: "EN", text: "Hallo" }],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ text: "Hello", target: "de" });

    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      translatedText: "Hallo",
      source: "en",
      target: "de",
    });
  });

  it("returns error when API key is missing", async () => {
    delete process.env.DEEPL_API_KEY;

    const res = await adapter.execute({ text: "Hello", target: "de" });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/DEEPL_API_KEY/);
  });

  it("returns error on empty text", async () => {
    const res = await adapter.execute({});

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing text/);
  });

  it("uses free API host for :fx keys", async () => {
    process.env.DEEPL_API_KEY = "free-key:fx";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          translations: [{ detected_source_language: "EN", text: "Bonjour" }],
        }),
        { status: 200 },
      ),
    );

    await adapter.execute({ text: "Hello", target: "fr" });

    expect(fetchSpy.mock.calls[0][0]).toMatch(/api-free\.deepl\.com/);
  });

  it("uses pro API host for normal keys", async () => {
    process.env.DEEPL_API_KEY = "pro-key-abc";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          translations: [{ detected_source_language: "EN", text: "Bonjour" }],
        }),
        { status: 200 },
      ),
    );

    await adapter.execute({ text: "Hello", target: "fr" });

    expect(fetchSpy.mock.calls[0][0]).toMatch(/api\.deepl\.com\/v2/);
    expect(fetchSpy.mock.calls[0][0]).not.toMatch(/api-free/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 456 }),
    );

    const res = await adapter.execute({ text: "Hello", target: "de" });

    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 456");
  });

  it("uppercases target language", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          translations: [{ detected_source_language: "EN", text: "Hola" }],
        }),
        { status: 200 },
      ),
    );

    await adapter.execute({ text: "Hello", target: "es" });

    const body = fetchSpy.mock.calls[0][1]!.body as string;
    expect(body).toContain("target_lang=ES");
  });
});
