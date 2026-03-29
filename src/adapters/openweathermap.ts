// ---------------------------------------------------------------------------
// Adapter: OpenWeatherMap — PAID (BYOK, free tier 1000 calls/day)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class OpenWeatherMapAdapter implements ServiceAdapter {
  readonly serviceId = "openweathermap";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "OPENWEATHERMAP_API_KEY not set" };
    }

    const city = input.city ? String(input.city) : undefined;
    const lat = input.lat !== undefined ? Number(input.lat) : undefined;
    const lon = input.lon !== undefined ? Number(input.lon) : undefined;

    if (!city && (lat === undefined || lon === undefined)) {
      return { success: false, data: null, error: "Missing city or lat/lon" };
    }

    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric");

    if (city) {
      url.searchParams.set("q", city);
    } else {
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
    }

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      name: string;
      main: { temp: number; humidity: number; temp_min: number; temp_max: number };
      wind: { speed: number };
      weather: Array<{ main: string; description: string }>;
    };

    return {
      success: true,
      data: {
        location: body.name,
        current: {
          temperature: body.main.temp,
          humidity: body.main.humidity,
          windSpeed: body.wind.speed,
          condition: body.weather[0]?.description ?? "unknown",
        },
        minTemp: body.main.temp_min,
        maxTemp: body.main.temp_max,
      },
    };
  }
}
