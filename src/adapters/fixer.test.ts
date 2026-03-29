import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FixerAdapter } from "./fixer.js";

const adapter = new FixerAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.FIXER_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.FIXER_API_KEY;
});

describe("FixerAdapter", () => {
  it("converts EUR to USD", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: true, base: "EUR", rates: { USD: 1.09 } }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ from: "EUR", to: "USD", amount: 50 });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.from).toBe("EUR");
    expect(data.to).toBe("USD");
    expect(data.rate).toBe(1.09);
    expect(data.converted).toBe(54.5);
  });

  it("returns error when API key is missing", async () => {
    delete process.env.FIXER_API_KEY;

    const res = await adapter.execute({ from: "EUR", to: "USD" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/FIXER_API_KEY/);
  });

  it("returns error on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: { type: "invalid_base_currency" } }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ from: "FAKE", to: "USD" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid_base_currency/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ from: "EUR", to: "USD" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });
});
