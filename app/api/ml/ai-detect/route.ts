import { NextResponse } from "next/server";

const HF_MODEL = "umm-maybe/AI-image-detector";

export async function POST(request: Request) {
  const apiKey = process.env.HF_API_TOKEN;
  if (!apiKey) {
    return NextResponse.json({ error: "ml_not_configured", results: null });
  }

  try {
    const body = await request.json();
    const imageBase64: string = body.imageBase64 ?? "";

    if (!imageBase64) {
      return NextResponse.json({ error: "invalid_input", results: null });
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
        signal: AbortSignal.timeout(9000),
      }
    );

    if (response.status === 503) {
      return NextResponse.json({ error: "model_loading", results: null });
    }

    if (!response.ok) {
      return NextResponse.json({ error: "api_error", results: null });
    }

    const result = await response.json();
    return NextResponse.json({ error: null, results: result });
  } catch {
    return NextResponse.json({ error: "api_error", results: null });
  }
}
