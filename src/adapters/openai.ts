// ---------------------------------------------------------------------------
// Adapter: OpenAI — PAID (BYOK)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIAdapter implements ServiceAdapter {
  readonly serviceId = "openai";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const prompt = String(input.prompt ?? input.message ?? "");
    const systemPrompt = input.system ? String(input.system) : undefined;
    const model = String(input.model ?? DEFAULT_MODEL);
    const maxTokens = Number(input.maxTokens ?? input.max_tokens ?? 1024);

    if (!prompt) {
      return { success: false, data: null, error: "Missing prompt" };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "OPENAI_API_KEY not set" };
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
}
