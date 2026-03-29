// ---------------------------------------------------------------------------
// Adapter: DeepL Translation — PAID (BYOK)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class DeepLAdapter implements ServiceAdapter {
  readonly serviceId = "deepl";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const text = String(input.text ?? "");
    const targetLang = String(input.target ?? "EN").toUpperCase();
    const sourceLang = input.source ? String(input.source).toUpperCase() : undefined;

    if (!text) {
      return { success: false, data: null, error: "Missing text" };
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "DEEPL_API_KEY not set" };
    }

    // DeepL free keys use api-free.deepl.com, pro keys use api.deepl.com
    const host = apiKey.endsWith(":fx")
      ? "https://api-free.deepl.com"
      : "https://api.deepl.com";

    const params = new URLSearchParams();
    params.set("text", text);
    params.set("target_lang", targetLang);
    if (sourceLang && sourceLang !== "AUTO") {
      params.set("source_lang", sourceLang);
    }

    const res = await fetch(`${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      translations: Array<{
        detected_source_language: string;
        text: string;
      }>;
    };

    const top = body.translations[0];
    return {
      success: true,
      data: {
        translatedText: top.text,
        source: top.detected_source_language.toLowerCase(),
        target: targetLang.toLowerCase(),
      },
    };
  }
}
