// ---------------------------------------------------------------------------
// Adapter: Groq — FREE tier (700+ tok/s, Llama/Gemma models)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export class GroqAdapter implements ServiceAdapter {
  readonly serviceId = "groq";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const prompt = String(input.prompt ?? input.message ?? "");
    const systemPrompt = input.system ? String(input.system) : undefined;
    const model = String(input.model ?? DEFAULT_MODEL);
    const maxTokens = Number(input.maxTokens ?? input.max_tokens ?? 1024);

    if (!prompt) {
      return { success: false, data: null, error: "Missing prompt" };
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const apiKey = process.env.GROQ_API_KEY;

    // Use Hebline proxy if no local key
    if (!apiKey) {
      return this.callProxy(messages, model, maxTokens);
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      success: true,
      data: {
        text: body.choices[0]?.message.content ?? "",
        model: body.model,
        usage: body.usage,
      },
    };
  }

  private async callProxy(
    messages: Array<{ role: string; content: string }>,
    model: string,
    maxTokens: number,
  ): Promise<ServiceResponse> {
    const res = await fetch("https://hebline.ai/api/proxy/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "groq", messages, model, max_tokens: maxTokens }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; code?: string };
      if (body.code === "RATE_LIMITED") {
        return { success: false, data: null, error: body.error ?? "Rate limited. Set GROQ_API_KEY for unlimited usage." };
      }
      return { success: false, data: null, error: body.error ?? `Proxy HTTP ${res.status}` };
    }

    const body = (await res.json()) as { text: string; model: string; usage: unknown };
    const remaining = res.headers.get("X-RateLimit-Remaining");

    return {
      success: true,
      data: {
        text: body.text,
        model: body.model,
        usage: body.usage,
        proxy: true,
        ...(remaining && Number(remaining) < 10 ? { notice: `${remaining} free calls remaining today. Set GROQ_API_KEY for unlimited.` } : {}),
      },
    };
  }
}
