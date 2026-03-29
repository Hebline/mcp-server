import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenWeatherMapAdapter } from "./openweathermap.js";

const adapter = new OpenWeatherMapAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.OPENWEATHERMAP_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.OPENWEATHERMAP_API_KEY;
});

describe("OpenWeatherMapAdapter", () => {
  it("returns weather for city", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          name: "Berlin",
          main: { temp: 18, humidity: 60, temp_min: 14, temp_max: 21 },
          wind: { speed: 5.5 },
          weather: [{ main: "Clouds", description: "scattered clouds" }],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ city: "Berlin" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.location).toBe("Berlin");
    expect(data.current.temperature).toBe(18);
    expect(data.current.condition).toBe("scattered clouds");
  });

  it("returns error when API key missing", async () => {
    delete process.env.OPENWEATHERMAP_API_KEY;
    const res = await adapter.execute({ city: "Berlin" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/OPENWEATHERMAP_API_KEY/);
  });

  it("returns error when no location", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });
});
