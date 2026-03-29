// ---------------------------------------------------------------------------
// Adapter: Brave Search — FREE tier (2000 req/mo, key required)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

// Hebline provides a default key for basic usage
const DEFAULT_KEY = process.env.BRAVE_SEARCH_API_KEY;

export class BraveSearchAdapter implements ServiceAdapter {
  readonly serviceId = "brave-search";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const query = String(input.query ?? input.q ?? "");
    if (!query) {
      return { success: false, data: null, error: "Missing query" };
    }

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "BRAVE_SEARCH_API_KEY not set" };
    }

    const count = Math.min(Number(input.count ?? 5), 20);

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(count));

    const res = await fetch(url, {
      headers: {
        "X-Subscription-Token": apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      web?: {
        results: Array<{
          title: string;
          url: string;
          description: string;
        }>;
      };
    };

    const results = (body.web?.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    return {
      success: true,
      data: {
        query,
        results,
        totalResults: results.length,
      },
    };
  }
}
