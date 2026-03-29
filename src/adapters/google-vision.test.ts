import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleVisionAdapter } from "./google-vision.js";

const adapter = new GoogleVisionAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.GOOGLE_VISION_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.GOOGLE_VISION_API_KEY;
});

describe("GoogleVisionAdapter", () => {
  it("returns detected text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          responses: [{ fullTextAnnotation: { text: "Invoice #12345\nTotal: $99.00\n" } }],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com/invoice.png" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.text).toContain("Invoice #12345");
    expect(data.text).toContain("$99.00");
  });

  it("returns error when API key is missing", async () => {
    delete process.env.GOOGLE_VISION_API_KEY;

    const res = await adapter.execute({ url: "https://example.com/image.png" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/GOOGLE_VISION_API_KEY/);
  });

  it("returns error when no url or base64", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 403 }),
    );

    const res = await adapter.execute({ url: "https://example.com/image.png" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 403");
  });

  it("returns error when no text detected", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ responses: [{}] }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com/blank.png" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No text detected/);
  });
});
