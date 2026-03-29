import { describe, it, expect, vi, beforeEach } from "vitest";
import { OcrSpaceAdapter } from "./ocr-space.js";

const adapter = new OcrSpaceAdapter();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OcrSpaceAdapter", () => {
  it("returns parsed text from URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          OCRExitCode: 1,
          ParsedResults: [{ ParsedText: "Hello World\n", FileParseExitCode: 1 }],
          IsErroredOnProcessing: false,
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com/image.png" });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.text).toBe("Hello World");
    expect(data.source).toBe("https://example.com/image.png");
  });

  it("returns error when no url or base64", async () => {
    const res = await adapter.execute({});
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Missing/);
  });

  it("returns error on processing failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          OCRExitCode: 4,
          IsErroredOnProcessing: true,
          ErrorMessage: ["Invalid image"],
        }),
        { status: 200 },
      ),
    );

    const res = await adapter.execute({ url: "https://example.com/bad.png" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Invalid image/);
  });

  it("returns error on HTTP failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 500 }),
    );

    const res = await adapter.execute({ url: "https://example.com/image.png" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("HTTP 500");
  });

  it("uses default key when none set", async () => {
    delete process.env.OCR_SPACE_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          OCRExitCode: 1,
          ParsedResults: [{ ParsedText: "Test", FileParseExitCode: 1 }],
          IsErroredOnProcessing: false,
        }),
        { status: 200 },
      ),
    );

    await adapter.execute({ url: "https://example.com/image.png" });

    const body = fetchSpy.mock.calls[0][1]!.body as string;
    expect(body).toContain("helloworld");
  });
});
