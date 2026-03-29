// ---------------------------------------------------------------------------
// Adapter: OCR.space — FREE (Hebline provides default key)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

// Hebline's default key — users can override with their own via OCR_SPACE_API_KEY
const DEFAULT_KEY = "helloworld";

export class OcrSpaceAdapter implements ServiceAdapter {
  readonly serviceId = "ocr-space";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const url = input.url ? String(input.url) : undefined;
    const base64 = input.base64 ? String(input.base64) : undefined;
    const language = String(input.language ?? "eng");
    const engine = Number(input.engine ?? 1);

    if (!url && !base64) {
      return { success: false, data: null, error: "Missing url or base64 image" };
    }

    const apiKey = process.env.OCR_SPACE_API_KEY ?? DEFAULT_KEY;

    const formData = new URLSearchParams();
    formData.set("apikey", apiKey);
    formData.set("language", language);
    formData.set("OCREngine", String(engine));
    formData.set("isTable", "true");

    if (url) {
      formData.set("url", url);
    } else if (base64) {
      formData.set("base64Image", base64);
    }

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      OCRExitCode: number;
      ParsedResults?: Array<{
        ParsedText: string;
        FileParseExitCode: number;
        ErrorMessage?: string;
      }>;
      IsErroredOnProcessing: boolean;
      ErrorMessage?: string[];
    };

    if (body.IsErroredOnProcessing || body.OCRExitCode >= 3) {
      return {
        success: false,
        data: null,
        error: body.ErrorMessage?.join(", ") ?? "OCR processing failed",
      };
    }

    const results = (body.ParsedResults ?? [])
      .filter((r) => r.FileParseExitCode === 1)
      .map((r) => r.ParsedText)
      .join("\n");

    if (!results) {
      return { success: false, data: null, error: "No text detected" };
    }

    return {
      success: true,
      data: {
        text: results.trim(),
        language,
        engine,
        source: url ?? "base64",
      },
    };
  }
}
