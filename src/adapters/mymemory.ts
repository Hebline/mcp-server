// ---------------------------------------------------------------------------
// Adapter: MyMemory Translation — FREE (no key required)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class MyMemoryAdapter implements ServiceAdapter {
  readonly serviceId = "mymemory";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const text = String(input.text ?? "");
    const source = String(input.source ?? "en");
    const target = String(input.target ?? "de");

    if (!text) {
      return { success: false, data: null, error: "Missing text" };
    }

    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `${source}|${target}`);

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      responseStatus: number;
      responseData: { translatedText: string };
    };

    if (body.responseStatus !== 200) {
      return { success: false, data: null, error: `API status: ${body.responseStatus}` };
    }

    return {
      success: true,
      data: {
        translatedText: body.responseData.translatedText,
        source,
        target,
      },
    };
  }
}
