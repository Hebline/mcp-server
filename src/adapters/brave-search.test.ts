import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BraveSearchAdapter } from "./brave-search.js";

const adapter = new BraveSearchAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.BRAVE_SEARCH_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.BRAVE_SEARCH_API_KEY;
});

describe("BraveSearchAdapter", () => {
  it("returns search results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          web: {
            results: [
              { title: "Hebline", url: "https://hebline.ai", description: "API broker for agents" },
              { title: "MCP", url: "https://modelcontextprotocol.io", description: "Model Context Protocol" },
            ],
          },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "hebline mcp" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.results).toHaveLength(2);
    expect(data.results[0].title).toBe("Hebline");
  });

  it("returns error when API key missing", async () => {
    delete process.env.BRAVE_SEARCH_API_KEY;
    const res = await adapter.execute({ query: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/BRAVE_SEARCH_API_KEY/);
  });

  it("returns error on empty query", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing query/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 429 }),
    );
    const res = await adapter.execute({ query: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 429");
  });
});
