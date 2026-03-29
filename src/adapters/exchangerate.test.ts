import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExchangeRateAdapter } from "./exchangerate.js";

const adapter = new ExchangeRateAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ExchangeRateAdapter", () => {
  it("converts USD to EUR", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", base_code: "USD", rates: { EUR: 0.92, GBP: 0.79 } }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ from: "USD", to: "EUR", amount: 100 });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.from).toBe("USD");
    expect(data.to).toBe("EUR");
    expect(data.rate).toBe(0.92);
    expect(data.converted).toBe(92);
  });

  it("returns all rates when no target specified", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", base_code: "USD", rates: { EUR: 0.92, GBP: 0.79 } }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ from: "USD" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.base).toBe("USD");
    expect(data.rates.EUR).toBe(0.92);
  });

  it("defaults to USD base", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", base_code: "USD", rates: { EUR: 0.92 } }),
        { status: 200 },
      ),
    );

    await adapter.execute({ to: "EUR" });

    expect(fetchSpy.mock.calls[0][0]).toContain("/USD");
  });

  it("returns error for unsupported currency", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ result: "success", base_code: "USD", rates: { EUR: 0.92 } }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ from: "USD", to: "FAKE" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not supported/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ from: "USD", to: "EUR" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });
});
