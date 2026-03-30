import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GroqAdapter } from "./groq.js";

const adapter = new GroqAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.GROQ_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.GROQ_API_KEY;
});

describe("GroqAdapter", () => {
  it("returns completion on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "The answer is 42." } }],
          model: "llama-3.3-70b-versatile",
          usage: { prompt_tokens: 10, completion_tokens: 6, total_tokens: 16 },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ prompt: "What is the answer?" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.text).toBe("The answer is 42.");
    expect(data.usage.total_tokens).toBe(16);
  });

  it("returns error when API key missing", async () => {
    delete process.env.GROQ_API_KEY;
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/GROQ_API_KEY/);
  });

  it("returns error on empty prompt", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing prompt/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 429 }));
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 429");
  });

  it("sends system prompt when provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "ok" } }], model: "llama", usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 } }),
        { status: 200 },
      ),
    );

    await adapter.execute({ prompt: "hi", system: "You are helpful" });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toBe("You are helpful");
  });
});
