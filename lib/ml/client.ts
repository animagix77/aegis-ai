import type { ClipSimilarityResult, AiDetectionResult, WatermarkResult } from "@/lib/types";

export type MlApiConfig = {
  timeoutMs?: number;
  skipClip?: boolean;
  skipAiDetect?: boolean;
  skipWatermark?: boolean;
};

export type MlApiResults = {
  clipSimilarity: ClipSimilarityResult | null;
  aiDetection: AiDetectionResult | null;
  watermark: WatermarkResult | null;
  status: "all-ok" | "partial-failure" | "all-unavailable" | "skipped";
};

async function fileToResizedBase64(file: File, maxSize = 512): Promise<string | null> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return null;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0, w, h);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return dataUrl.replace(/^data:image\/\w+;base64,/, "");
  } catch {
    return null;
  }
}

async function callClipEmbed(
  imageBase64: string,
  textQueries: string[],
  timeoutMs: number
): Promise<ClipSimilarityResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("/api/ml/clip-embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, textQueries }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.error || !data.results) return null;

    const scores: { label: string; score: number }[] = Array.isArray(data.results)
      ? data.results
      : [];
    if (!scores.length) return null;

    const top = scores.reduce((best, s) => (s.score > best.score ? s : best), scores[0]);
    return {
      queryDescription: top.label,
      topMatchScore: top.score,
      topMatchCatalogEntryId: null,
    };
  } catch {
    return null;
  }
}

async function callAiDetect(
  imageBase64: string,
  timeoutMs: number
): Promise<AiDetectionResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch("/api/ml/ai-detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.error || !data.results) return null;

    const labels: { label: string; score: number }[] = Array.isArray(data.results)
      ? data.results
      : [];
    const aiLabel = labels.find((l) => l.label === "artificial" || l.label === "ai");
    const humanLabel = labels.find((l) => l.label === "human" || l.label === "real");

    const aiProb = aiLabel?.score ?? 0;
    const humanProb = humanLabel?.score ?? 1 - aiProb;

    return {
      model: "umm-maybe/AI-image-detector",
      aiGeneratedProbability: aiProb,
      humanProbability: humanProb,
      label: aiProb > 0.7 ? "ai-generated" : aiProb > 0.4 ? "uncertain" : "human",
    };
  } catch {
    return null;
  }
}

async function checkWatermark(file: File): Promise<WatermarkResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/ml/watermark", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.error) return null;
    return data.results ?? null;
  } catch {
    return null;
  }
}

const AI_GENERATOR_PATTERNS = /\b(midjourney|dall[- ]?e|stable diffusion|firefly|runway|ideogram|leonardo|flux)\b/i;

export function isAiGenerator(generator: string | null): boolean {
  if (!generator) return false;
  return AI_GENERATOR_PATTERNS.test(generator);
}

export async function runMlAnalysis(
  file: File | null,
  catalogDescriptions: string[],
  config: MlApiConfig = {}
): Promise<MlApiResults> {
  if (!file || !file.type.startsWith("image/")) {
    return { clipSimilarity: null, aiDetection: null, watermark: null, status: "skipped" };
  }

  const timeoutMs = config.timeoutMs ?? 12000;
  const imageBase64 = await fileToResizedBase64(file);
  if (!imageBase64) {
    return { clipSimilarity: null, aiDetection: null, watermark: null, status: "all-unavailable" };
  }

  const textQueries = catalogDescriptions.slice(0, 20);
  if (!textQueries.length) {
    textQueries.push("copyrighted character", "stock photo watermark", "original artwork");
  }

  const [clipResult, aiResult, watermarkResult] = await Promise.allSettled([
    config.skipClip ? Promise.resolve(null) : callClipEmbed(imageBase64, textQueries, timeoutMs),
    config.skipAiDetect ? Promise.resolve(null) : callAiDetect(imageBase64, timeoutMs),
    config.skipWatermark ? Promise.resolve(null) : checkWatermark(file),
  ]);

  const clip = clipResult.status === "fulfilled" ? clipResult.value : null;
  const ai = aiResult.status === "fulfilled" ? aiResult.value : null;
  const wm = watermarkResult.status === "fulfilled" ? watermarkResult.value : null;

  let successCount = 0;
  let totalCount = 0;
  if (!config.skipClip) { totalCount++; if (clip) successCount++; }
  if (!config.skipAiDetect) { totalCount++; if (ai) successCount++; }
  if (!config.skipWatermark) { totalCount++; if (wm) successCount++; }

  let status: MlApiResults["status"];
  if (totalCount === 0) status = "skipped";
  else if (successCount === totalCount) status = "all-ok";
  else if (successCount > 0) status = "partial-failure";
  else status = "all-unavailable";

  return { clipSimilarity: clip, aiDetection: ai, watermark: wm, status };
}
