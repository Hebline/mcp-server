// ---------------------------------------------------------------------------
// Adapter: NewsAPI.org — PAID (BYOK, 100 req/day free for dev)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class NewsApiAdapter implements ServiceAdapter {
  readonly serviceId = "newsapi";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "NEWSAPI_KEY not set" };
    }

    const query = input.query ? String(input.query) : undefined;
    const category = input.category ? String(input.category) : undefined;
    const country = String(input.country ?? "us");
    const count = Math.min(Number(input.count ?? 5), 100);

    let url: URL;

    if (query) {
      url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", query);
      url.searchParams.set("pageSize", String(count));
      url.searchParams.set("sortBy", "publishedAt");
    } else {
      url = new URL("https://newsapi.org/v2/top-headlines");
      url.searchParams.set("country", country);
      url.searchParams.set("pageSize", String(count));
      if (category) url.searchParams.set("category", category);
    }

    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      status: string;
      totalResults: number;
      articles: Array<{
        title: string;
        url: string;
        source: { name: string };
        description: string;
        publishedAt: string;
      }>;
    };

    if (body.status !== "ok") {
      return { success: false, data: null, error: "NewsAPI error" };
    }

    const articles = body.articles.map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source.name,
      description: a.description,
      date: a.publishedAt,
    }));

    return {
      success: true,
      data: {
        query: query ?? `top-headlines/${country}`,
        articles,
        totalResults: body.totalResults,
      },
    };
  }
}
