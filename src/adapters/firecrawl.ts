// ---------------------------------------------------------------------------
// Adapter: Firecrawl — PAID (BYOK), returns clean Markdown
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class FirecrawlAdapter implements ServiceAdapter {
  readonly serviceId = "firecrawl";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const url = String(input.url ?? "");
    if (!url) {
      return { success: false, data: null, error: "Missing url" };
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "FIRECRAWL_API_KEY not set" };
    }

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      success: boolean;
      data?: {
        markdown?: string;
        metadata?: {
          title?: string;
          description?: string;
          statusCode?: number;
        };
      };
      error?: string;
    };

    if (!body.success || !body.data) {
      return { success: false, data: null, error: body.error ?? "Scrape failed" };
    }

    return {
      success: true,
      data: {
        content: body.data.markdown ?? "",
        format: "markdown",
        url,
        title: body.data.metadata?.title,
        description: body.data.metadata?.description,
        statusCode: body.data.metadata?.statusCode,
      },
    };
  }
}
