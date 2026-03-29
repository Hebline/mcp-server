// ---------------------------------------------------------------------------
// Adapter: LibreTranslate — FREE
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

const DEFAULT_HOST = "https://libretranslate.com";

export class LibreTranslateAdapter implements ServiceAdapter {
  readonly serviceId = "libretranslate";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const text = String(input.text ?? "");
    const source = String(input.source ?? "auto");
    const target = String(input.target ?? "en");

    if (!text) {
      return { success: false, data: null, error: "Missing text" };
    }

    const host = process.env.LIBRETRANSLATE_HOST ?? DEFAULT_HOST;

    const res = await fetch(`${host}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as { translatedText: string };

    return {
      success: true,
      data: {
        translatedText: body.translatedText,
        source,
        target,
      },
    };
  }
}
