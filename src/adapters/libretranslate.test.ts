import { describe, it, expect, vi, beforeEach } from "vitest";
import { LibreTranslateAdapter } from "./libretranslate.js";

const adapter = new LibreTranslateAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
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

  it("defaults source to auto and target to en", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ translatedText: "Hello" }),
        { status: 200 },
      ),
    );

    await adapter.execute({ text: "Hallo" });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.source).toBe("auto");
    expect(body.target).toBe("en");
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

  it("uses custom host from env", async () => {
    process.env.LIBRETRANSLATE_HOST = "http://localhost:5000";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ translatedText: "Hola" }), { status: 200 }),
    );

    await adapter.execute({ text: "Hello", target: "es" });

    expect(fetchSpy.mock.calls[0][0]).toBe("http://localhost:5000/translate");
    delete process.env.LIBRETRANSLATE_HOST;
  });
});
