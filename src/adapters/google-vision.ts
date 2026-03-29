// ---------------------------------------------------------------------------
// Adapter: Google Cloud Vision OCR — PAID (BYOK)
// ---------------------------------------------------------------------------

import type { ServiceAdapter, ServiceResponse } from "../types.js";

export class GoogleVisionAdapter implements ServiceAdapter {
  readonly serviceId = "google-vision";

  async execute(input: Record<string, unknown>): Promise<ServiceResponse> {
    const url = input.url ? String(input.url) : undefined;
    const base64 = input.base64 ? String(input.base64) : undefined;

    if (!url && !base64) {
      return { success: false, data: null, error: "Missing url or base64 image" };
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return { success: false, data: null, error: "GOOGLE_VISION_API_KEY not set" };
    }

    // Build the request
    const image: Record<string, string> = {};
    if (url) {
      image.source = JSON.stringify({ imageUri: url });
    }
    if (base64) {
      image.content = base64;
    }

    const requestBody = {
      requests: [
        {
          image: url ? { source: { imageUri: url } } : { content: base64 },
          features: [{ type: "TEXT_DETECTION" }],
        },
      ],
    };

    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    if (!res.ok) {
      return { success: false, data: null, error: `HTTP ${res.status}` };
    }

    const body = (await res.json()) as {
      responses: Array<{
        fullTextAnnotation?: { text: string };
        error?: { message: string };
      }>;
    };

    const response = body.responses[0];
    if (response.error) {
      return { success: false, data: null, error: response.error.message };
    }

    const text = response.fullTextAnnotation?.text;
    if (!text) {
      return { success: false, data: null, error: "No text detected" };
    }

    return {
      success: true,
      data: {
        text: text.trim(),
        source: url ?? "base64",
      },
    };
  }
}
