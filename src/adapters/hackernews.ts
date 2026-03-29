// ---------------------------------------------------------------------------
// Adapter: HackerNews (Algolia API) — FREE (no key)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class HackerNewsAdapter implements ServiceAdapter {
  readonly serviceId = "hackernews";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const query = input.query ? String(input.query) : undefined;
    const topic = String(input.topic ?? "front_page");
    const count = Math.min(Number(input.count ?? 5), 20);

    let url: string;

    if (query) {
      // Search mode
      const u = new URL("https://hn.algolia.com/api/v1/search");
      u.searchParams.set("query", query);
      u.searchParams.set("hitsPerPage", String(count));
      u.searchParams.set("tags", "story");
      url = u.toString();
    } else {
      // Top stories mode
      url = `https://hn.algolia.com/api/v1/search?tags=${topic}&hitsPerPage=${count}`;
    }

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      hits: Array<{
        title: string;
        url: string;
        author: string;
        points: number;
        num_comments: number;
        created_at: string;
        objectID: string;
      }>;
      nbHits: number;
    };

    const articles = body.hits.map((h) => ({
      title: h.title,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      author: h.author,
      points: h.points,
      comments: h.num_comments,
      date: h.created_at,
    }));

    return {
      success: true,
      data: {
        query: query ?? topic,
        articles,
        totalResults: body.nbHits,
      },
    };
  }
}
