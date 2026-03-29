import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FirecrawlAdapter } from "./firecrawl.js";

const adapter = new FirecrawlAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.FIRECRAWL_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.FIRECRAWL_API_KEY;
});

describe("FirecrawlAdapter", () => {
  it("returns markdown content on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            markdown: "# Hello World\n\nSome content here.",
            metadata: { title: "Hello", statusCode: 200 },
          },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.content).toContain("# Hello World");
    expect(data.format).toBe("markdown");
    expect(data.title).toBe("Hello");
  });

  it("returns error when API key is missing", async () => {
    delete process.env.FIRECRAWL_API_KEY;

    const res = await adapter.execute({ url: "https://example.com" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/FIRECRAWL_API_KEY/);
  });

  it("returns error on empty url", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing url/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ url: "https://example.com" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });

  it("returns error when scrape fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: "Page not reachable" }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("Page not reachable");
  });
});
