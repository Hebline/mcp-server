// ---------------------------------------------------------------------------
// Adapter: Google Maps Geocoding — PAID (BYOK)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class GoogleMapsAdapter implements ServiceAdapter {
  readonly serviceId = "google-maps";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const query = String(input.query ?? input.address ?? "");
    if (!query) {
      return { success: false, data: null, error: "Missing query or address" };
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "GOOGLE_MAPS_API_KEY not set" };
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      status: string;
      results: Array<{
        geometry: { location: { lat: number; lng: number } };
        formatted_address: string;
      }>;
    };

    if (body.status !== "OK" || body.results.length === 0) {
      return { success: false, data: null, error: `Google status: ${body.status}` };
    }

    const top = body.results[0];
    return {
      success: true,
      data: {
        lat: top.geometry.location.lat,
        lon: top.geometry.location.lng,
        displayName: top.formatted_address,
      },
    };
  }
}
