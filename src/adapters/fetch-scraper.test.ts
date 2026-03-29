import { describe, it, expect, vi, beforeEach } from "vitest";
import { FetchScraperAdapter } from "./fetch-scraper.js";

const adapter = new FetchScraperAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("FetchScraperAdapter", () => {
  it("returns text content from HTML page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html><body><h1>Hello World</h1><p>Some text</p></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const res = await adapter.execute({ url: "https://example.com", format: "text" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.content).toContain("Hello World");
    expect(data.content).toContain("Some text");
    expect(data.format).toBe("text");
  });

  it("returns JSON content directly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ key: "value" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const res = await adapter.execute({ url: "https://api.example.com/data" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.content).toEqual({ key: "value" });
    expect(data.format).toBe("json");
  });

  it("strips script and style tags", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        "<html><head><style>body{color:red}</style></head><body><script>alert(1)</script><p>Clean text</p></body></html>",
        { status: 200, headers: { "content-type": "text/html" } },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com", format: "text" });
    const data = res.data as any;
    expect(data.content).toContain("Clean text");
    expect(data.content).not.toContain("alert");
    expect(data.content).not.toContain("color:red");
  });

  it("returns error on empty url", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing url/);
  });

  it("returns error on invalid url", async () => {
    const res = await adapter.execute({ url: "not-a-url" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Invalid url/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 403 }),
    );

    const res = await adapter.execute({ url: "https://example.com" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 403");
  });
});
