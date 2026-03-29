// ---------------------------------------------------------------------------
// Adapter: DuckDuckGo Instant Answer — FREE (no key)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class DuckDuckGoAdapter implements ServiceAdapter {
  readonly serviceId = "duckduckgo";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const query = String(input.query ?? input.q ?? "");
    if (!query) {
      return { success: false, data: null, error: "Missing query" };
    }

    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("skip_disambig", "1");

    const res = await fetch(url, {
      headers: { "User-Agent": "hebline-mcp/0.5 (API broker)" },
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      Abstract: string;
      AbstractSource: string;
      AbstractURL: string;
      Heading: string;
      Answer: string;
      AnswerType: string;
      RelatedTopics: Array<{ Text: string; FirstURL: string }>;
    };

    // DuckDuckGo returns instant answers — may be empty for general searches
    const answer = body.Answer || body.Abstract || null;
    const results = (body.RelatedTopics ?? [])
      .filter((t) => t.Text && t.FirstURL)
      .slice(0, 5)
      .map((t) => ({
        text: t.Text,
        url: t.FirstURL,
      }));

    if (!answer && results.length === 0) {
      return {
        success: false,
        data: null,
        error: "No instant answer available. Try a more specific query or use a full web search service.",
      };
    }

    return {
      success: true,
      data: {
        query,
        answer,
        source: body.AbstractSource || null,
        sourceUrl: body.AbstractURL || null,
        relatedTopics: results,
      },
    };
  }
}
