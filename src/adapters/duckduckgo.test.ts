import { describe, it, expect, vi, beforeEach } from "vitest";
import { DuckDuckGoAdapter } from "./duckduckgo.js";

const adapter = new DuckDuckGoAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("DuckDuckGoAdapter", () => {
  it("returns instant answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          Abstract: "Berlin is the capital of Germany.",
          AbstractSource: "Wikipedia",
          AbstractURL: "https://en.wikipedia.org/wiki/Berlin",
          Heading: "Berlin",
          Answer: "",
          AnswerType: "",
          RelatedTopics: [{ Text: "Berlin Wall", FirstURL: "https://duckduckgo.com/Berlin_Wall" }],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "Berlin" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.answer).toContain("capital of Germany");
    expect(data.source).toBe("Wikipedia");
  });

  it("returns error on empty query", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing query/);
  });

  it("returns error when no answer available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ Abstract: "", Answer: "", RelatedTopics: [] }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ query: "asdfghjkl" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No instant answer/);
  });
});
