import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenAIAdapter } from "./openai.js";

const adapter = new OpenAIAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.OPENAI_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe("OpenAIAdapter", () => {
  it("returns completion on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Hello from GPT!" } }],
          model: "gpt-4o-mini",
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ prompt: "Say hello" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.text).toBe("Hello from GPT!");
    expect(data.model).toBe("gpt-4o-mini");
  });

  it("returns error when API key missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/OPENAI_API_KEY/);
  });

  it("returns error on empty prompt", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing prompt/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("", { status: 401 }));
    const res = await adapter.execute({ prompt: "test" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 401");
  });
});
