// ---------------------------------------------------------------------------
// Adapter: Nominatim (OpenStreetMap Geocoding) — FREE
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class NominatimAdapter implements ServiceAdapter {
  readonly serviceId = "nominatim";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const query = String(input.query ?? input.address ?? "");
    if (!query) {
      return { success: false, data: null, error: "Missing query or address" };
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url, {
      headers: { "User-Agent": "hebline-mcp/0.1" },
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const results = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;

    if (results.length === 0) {
      return { success: false, data: null, error: "No results found" };
    }

    const top = results[0];
    return {
      success: true,
      data: {
        lat: parseFloat(top.lat),
        lon: parseFloat(top.lon),
        displayName: top.display_name,
      },
    };
  }
}
