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
    if (!apiKey) {
      return { success: false, data: null, error: "GOOGLE_AI_API_KEY not set" };
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
}
