import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NewsApiAdapter } from "./newsapi.js";

const adapter = new NewsApiAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.NEWSAPI_KEY = "test-key";
});

afterEach(() => {
  delete process.env.NEWSAPI_KEY;
});

describe("NewsApiAdapter", () => {
  it("returns search results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "ok",
          totalResults: 1,
          articles: [{ title: "AI News", url: "https://example.com", source: { name: "TechCrunch" }, description: "Latest AI", publishedAt: "2026-03-29" }],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "AI agents" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.articles).toHaveLength(1);
    expect(data.articles[0].source).toBe("TechCrunch");
  });

  it("returns top headlines without query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ status: "ok", totalResults: 1, articles: [{ title: "Headlines", url: "https://example.com", source: { name: "BBC" }, description: "News", publishedAt: "2026-03-29" }] }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ country: "de" });
    expect(res.success).toBe(true);
  });

  it("returns error when API key missing", async () => {
    delete process.env.NEWSAPI_KEY;
    const res = await adapter.execute({ query: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/NEWSAPI_KEY/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 401 }));
    const res = await adapter.execute({ query: "test" });
    expect(res.success).toBe(false);
  });
});
