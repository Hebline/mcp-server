import { describe, it, expect, vi, beforeEach } from "vitest";
import { HackerNewsAdapter } from "./hackernews.js";

const adapter = new HackerNewsAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("HackerNewsAdapter", () => {
  it("returns search results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          hits: [
            { title: "AI Agents", url: "https://example.com", author: "test", points: 100, num_comments: 50, created_at: "2026-03-29", objectID: "123" },
          ],
          nbHits: 1,
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "AI agents" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.articles).toHaveLength(1);
    expect(data.articles[0].title).toBe("AI Agents");
    expect(data.articles[0].points).toBe(100);
  });

  it("returns front page when no query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ hits: [{ title: "Top Story", url: "https://example.com", author: "a", points: 200, num_comments: 80, created_at: "2026-03-29", objectID: "456" }], nbHits: 1 }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({});
    expect(res.success).toBe(true);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 500 }));
    const res = await adapter.execute({ query: "test" });
    expect(res.success).toBe(false);
  });
});
