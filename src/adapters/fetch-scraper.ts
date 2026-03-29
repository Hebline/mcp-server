// ---------------------------------------------------------------------------
// Adapter: Fetch Scraper — FREE (basic HTTP GET)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class FetchScraperAdapter implements ServiceAdapter {
  readonly serviceId = "fetch-scraper";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const url = String(input.url ?? "");
    if (!url) {
      return { success: false, data: null, error: "Missing url" };
    }

    try {
      new URL(url);
    } catch {
      return { success: false, data: null, error: "Invalid url" };
    }

    const selector = input.selector ? String(input.selector) : undefined;
    const format = String(input.format ?? "text");

    const res = await fetch(url, {
      headers: {
        "User-Agent": "hebline-mcp/0.2 (compatible; bot)",
        Accept: "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    let body: string;

    if (contentType.includes("application/json")) {
      const json = await res.json();
      return {
        success: true,
        data: { content: json, format: "json", url, statusCode: res.status },
      };
    }

    body = await res.text();

    if (format === "text" || !contentType.includes("text/html")) {
      // Strip HTML tags for a rough text extraction
      const text = body
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return {
        success: true,
        data: { content: text.slice(0, 50_000), format: "text", url, statusCode: res.status },
      };
    }

    // Return raw HTML (truncated)
    return {
      success: true,
      data: { content: body.slice(0, 100_000), format: "html", url, statusCode: res.status },
    };
  }
}
