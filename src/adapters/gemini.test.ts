import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GeminiAdapter } from "./gemini.js";

const adapter = new GeminiAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.GOOGLE_AI_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.GOOGLE_AI_API_KEY;
});

describe("GeminiAdapter", () => {
  it("returns completion on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Hello from Gemini!" }] } }],
          usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 4, totalTokenCount: 12 },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ prompt: "Say hello" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.text).toBe("Hello from Gemini!");
    expect(data.usage.total_tokens).toBe(12);
  });

  it("falls back to proxy when API key missing", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ text: "Proxy response", model: "gemini-2.5-flash", usage: {} }),
        { status: 200, headers: { "X-RateLimit-Remaining": "49" } },
      ),
    );
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.proxy).toBe(true);
  });

  it("returns error on empty prompt", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing prompt/);
  });

  it("returns error when no response from model", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No response/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 500 }));
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });
});
