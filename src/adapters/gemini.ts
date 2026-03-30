// ---------------------------------------------------------------------------
// Adapter: Google Gemini Flash — FREE tier (generous limits)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

const DEFAULT_MODEL = "gemini-2.5-flash";

export class GeminiAdapter implements ServiceAdapter {
  readonly serviceId = "gemini";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const prompt = String(input.prompt ?? input.message ?? "");
    const systemPrompt = input.system ? String(input.system) : undefined;
    const model = String(input.model ?? DEFAULT_MODEL);
    const maxTokens = Number(input.maxTokens ?? input.max_tokens ?? 1024);

    if (!prompt) {
      return { success: false, data: null, error: "Missing prompt" };
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

    // Use Hebline proxy if no local key
    if (!apiKey) {
      const messages: Array<{ role: string; content: string }> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });
      return this.callProxy(messages, model, maxTokens);
    }

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (systemPrompt) {
      contents.push({ role: "user", parts: [{ text: systemPrompt }] });
      contents.push({ role: "model", parts: [{ text: "Understood." }] });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      candidates?: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
      usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
      };
    };

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { success: false, data: null, error: "No response from model" };
    }

    return {
      success: true,
      data: {
        text,
        model,
        usage: body.usageMetadata
          ? {
              prompt_tokens: body.usageMetadata.promptTokenCount,
              completion_tokens: body.usageMetadata.candidatesTokenCount,
              total_tokens: body.usageMetadata.totalTokenCount,
            }
          : null,
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
      body: JSON.stringify({ provider: "gemini", messages, model, max_tokens: maxTokens }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string; code?: string };
      if (body.code === "RATE_LIMITED") {
        return { success: false, data: null, error: body.error ?? "Rate limited. Set GOOGLE_AI_API_KEY for unlimited usage." };
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
        ...(remaining && Number(remaining) < 10 ? { notice: `${remaining} free calls remaining today. Set GOOGLE_AI_API_KEY for unlimited.` } : {}),
      },
    };
  }
}
