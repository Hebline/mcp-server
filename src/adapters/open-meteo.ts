// ---------------------------------------------------------------------------
// Adapter: Open-Meteo — FREE (no key required)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class OpenMeteoAdapter implements ServiceAdapter {
  readonly serviceId = "open-meteo";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const lat = input.lat !== undefined ? Number(input.lat) : undefined;
    const lon = input.lon !== undefined ? Number(input.lon) : undefined;
    const city = input.city ? String(input.city) : undefined;

    let latitude = lat;
    let longitude = lon;

    // If city provided, geocode it first
    if (city && (latitude === undefined || longitude === undefined)) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      );
      if (geoRes.ok) {
        const geoBody = (await geoRes.json()) as {
          results?: Array<{ latitude: number; longitude: number; name: string }>;
        };
        if (geoBody.results?.[0]) {
          latitude = geoBody.results[0].latitude;
          longitude = geoBody.results[0].longitude;
        }
      }
    }

    if (latitude === undefined || longitude === undefined) {
      return { success: false, data: null, error: "Missing lat/lon or city" };
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "3");

    const res = await fetch(url);

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      current?: {
        temperature_2m: number;
        relative_humidity_2m: number;
        wind_speed_10m: number;
        weather_code: number;
      };
      daily?: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        weather_code: number[];
      };
      timezone: string;
    };

    return {
      success: true,
      data: {
        location: city ?? `${latitude},${longitude}`,
        timezone: body.timezone,
        current: body.current
          ? {
              temperature: body.current.temperature_2m,
              humidity: body.current.relative_humidity_2m,
              windSpeed: body.current.wind_speed_10m,
              weatherCode: body.current.weather_code,
            }
          : null,
        forecast: body.daily
          ? body.daily.time.map((date, i) => ({
              date,
              maxTemp: body.daily!.temperature_2m_max[i],
              minTemp: body.daily!.temperature_2m_min[i],
              precipitation: body.daily!.precipitation_sum[i],
              weatherCode: body.daily!.weather_code[i],
            }))
          : [],
      },
    };
  }
}
