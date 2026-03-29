import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenMeteoAdapter } from "./open-meteo.js";

const adapter = new OpenMeteoAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OpenMeteoAdapter", () => {
  it("returns weather data for lat/lon", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          current: { temperature_2m: 18.5, relative_humidity_2m: 65, wind_speed_10m: 12, weather_code: 1 },
          daily: {
            time: ["2026-03-29", "2026-03-30"],
            temperature_2m_max: [20, 22],
            temperature_2m_min: [10, 12],
            precipitation_sum: [0, 2.5],
            weather_code: [1, 61],
          },
          timezone: "Europe/Berlin",
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ lat: 52.52, lon: 13.41 });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.current.temperature).toBe(18.5);
    expect(data.forecast).toHaveLength(2);
  });

  it("geocodes city name automatically", async () => {
    // First call: geocoding
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ results: [{ latitude: 48.85, longitude: 2.35, name: "Paris" }] }),
          { status: 200 },
        ),
      )
      // Second call: weather
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 15, relative_humidity_2m: 70, wind_speed_10m: 8, weather_code: 3 },
            daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [], weather_code: [] },
            timezone: "Europe/Paris",
          }),
          { status: 200 },
        ),
      );

    const res = await adapter.execute({ city: "Paris" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.location).toBe("Paris");
  });

  it("returns error when no location provided", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ lat: 52, lon: 13 });
    expect(res.success).toBe(false);
  });
});
