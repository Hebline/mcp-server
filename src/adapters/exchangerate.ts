// ---------------------------------------------------------------------------
// Adapter: ExchangeRate-API — FREE (open access, no key)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class ExchangeRateAdapter implements ServiceAdapter {
  readonly serviceId = "exchangerate";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const from = String(input.from ?? input.base ?? "USD").toUpperCase();
    const to = input.to ? String(input.to).toUpperCase() : undefined;
    const amount = Number(input.amount ?? 1);

    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      result: string;
      base_code: string;
      rates: Record<string, number>;
    };

    if (body.result !== "success") {
      return { success: false, data: null, error: `API error: ${body.result}` };
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

    // Return all rates
    return {
      success: true,
      data: {
        base: from,
        rates: body.rates,
      },
    };
  }
}
