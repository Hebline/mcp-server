// ---------------------------------------------------------------------------
// Adapter: Fixer.io — PAID (BYOK)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class FixerAdapter implements ServiceAdapter {
  readonly serviceId = "fixer";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const from = String(input.from ?? input.base ?? "EUR").toUpperCase();
    const to = input.to ? String(input.to).toUpperCase() : undefined;
    const amount = Number(input.amount ?? 1);

    const apiKey = process.env.FIXER_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "FIXER_API_KEY not set" };
    }

    const url = new URL("https://data.fixer.io/api/latest");
    url.searchParams.set("access_key", apiKey);
    url.searchParams.set("base", from);
    if (to) url.searchParams.set("symbols", to);

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      success: boolean;
      error?: { type: string };
      base: string;
      rates: Record<string, number>;
    };

    if (!body.success) {
      return { success: false, data: null, error: `Fixer error: ${body.error?.type ?? "unknown"}` };
    }

    if (to) {
      const rate = body.rates[to];
      if (rate === undefined) {
        return { success: false, data: null, error: `Currency '${to}' not supported` };
      }
      return {
        success: true,
        data: {
          from,
          to,
          rate,
          amount,
          converted: Math.round(amount * rate * 100) / 100,
        },
      };
    }

    return {
      success: true,
      data: {
        base: from,
        rates: body.rates,
      },
    };
  }
}
