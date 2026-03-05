import { NextResponse } from "next/server";

const ML_MODEL_VERSION = "aegis-ml-lite-2026.03";
const SERVICE_TIMEOUT_MS = 4200;

type RiskTier = "low" | "medium" | "high";

type MlFeatures = {
  highHitsCount?: number;
  mediumHitsCount?: number;
  sourceHitsCount?: number;
  criticalHitsCount?: number;
  catalogMatchesCount?: number;
  highConfidenceCatalogHits?: number;
  visualFingerprintCollision?: boolean;
  hallucinationSignalsCount?: number;
  secondarySignalsCount?: number;
  websiteCheckedCount?: number;
  websiteFetchedCount?: number;
  websiteUnreachableCount?: number;
  websiteInvalidCount?: number;
  websiteMarkersCount?: number;
  mimeExtensionMismatch?: boolean;
  missingExifImage?: boolean;
  missingMediaFingerprint?: boolean;
  hasRightsEvidence?: boolean;
  hasOriginalCaptureSignals?: boolean;
  isMarketingOrBroadcast?: boolean;
  isExpedited?: boolean;
};

type MlRiskResponse = {
  modelVersion: string;
  probabilityInfringement: number;
  confidence: number;
  classification: RiskTier;
  topSignals: string[];
  provider: "local-heuristic" | "service-inference";
  inferenceMode: "feature-risk" | "service-model";
};

export async function POST(request: Request) {
  const body = (await safeJson(request)) as { features?: MlFeatures } | null;
  const features = body?.features ?? {};
  const remoteEndpoint = process.env.ML_INFERENCE_ENDPOINT?.trim();

  if (remoteEndpoint) {
    const serviceResult = await queryRemoteInference(remoteEndpoint, features);
    if (serviceResult) {
      return NextResponse.json(serviceResult, { status: 200 });
    }
  }

  return NextResponse.json(inferLocal(features), { status: 200 });
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function queryRemoteInference(endpoint: string, features: MlFeatures): Promise<MlRiskResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ features }),
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) {
      return null;
    }

    const raw = (await response.json()) as Partial<MlRiskResponse>;
    if (typeof raw.probabilityInfringement !== "number") {
      return null;
    }

    const probabilityInfringement = clamp01(raw.probabilityInfringement);
    const confidence = normalizeConfidence(raw.confidence, probabilityInfringement);
    const classification = normalizeClassification(raw.classification, probabilityInfringement);
    const topSignals = normalizeSignals(raw.topSignals);

    return {
      modelVersion:
        typeof raw.modelVersion === "string" && raw.modelVersion.trim()
          ? raw.modelVersion.trim()
          : ML_MODEL_VERSION,
      probabilityInfringement,
      confidence,
      classification,
      topSignals,
      provider: "service-inference",
      inferenceMode: "service-model"
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function inferLocal(features: MlFeatures): MlRiskResponse {
  const normalizeCount = (value: number | undefined, max: number) => Math.min(1, Math.max(0, value ?? 0) / max);

  const normalized = {
    highHits: normalizeCount(features.highHitsCount, 3),
    mediumHits: normalizeCount(features.mediumHitsCount, 4),
    sourceHits: normalizeCount(features.sourceHitsCount, 5),
    criticalHits: normalizeCount(features.criticalHitsCount, 2),
    catalogMatches: normalizeCount(features.catalogMatchesCount, 8),
    catalogHighConfidence: normalizeCount(features.highConfidenceCatalogHits, 3),
    hallucinations: normalizeCount(features.hallucinationSignalsCount, 3),
    secondary: normalizeCount(features.secondarySignalsCount, 4),
    websiteMarkers: normalizeCount(features.websiteMarkersCount, 8),
    websiteUnreachable: normalizeCount(features.websiteUnreachableCount, 3),
    websiteInvalid: normalizeCount(features.websiteInvalidCount, 2),
    websiteChecked: normalizeCount(features.websiteCheckedCount, 4)
  };

  const contributions = [
    { label: "imitation-language", value: 1.28 * normalized.highHits },
    { label: "derivative-intent", value: 0.84 * normalized.mediumHits },
    { label: "protected-source-markers", value: 1.12 * normalized.sourceHits },
    { label: "critical-ip-markers", value: 1.74 * normalized.criticalHits },
    { label: "catalog-overlap", value: 1.18 * normalized.catalogMatches },
    { label: "high-confidence-collisions", value: 1.41 * normalized.catalogHighConfidence },
    {
      label: "visual-fingerprint-collision",
      value: features.visualFingerprintCollision ? 1.56 : 0
    },
    { label: "hallucination-signals", value: 0.67 * normalized.hallucinations },
    { label: "cross-signal-correlation", value: 0.72 * normalized.secondary },
    { label: "website-rights-markers", value: 0.58 * normalized.websiteMarkers },
    { label: "website-unreachable", value: 0.44 * normalized.websiteUnreachable },
    { label: "website-invalid", value: 0.51 * normalized.websiteInvalid },
    { label: "website-coverage", value: 0.16 * normalized.websiteChecked },
    { label: "metadata-mismatch", value: features.mimeExtensionMismatch ? 0.92 : 0 },
    { label: "missing-exif", value: features.missingExifImage ? 0.5 : 0 },
    { label: "missing-fingerprint", value: features.missingMediaFingerprint ? 0.46 : 0 },
    { label: "public-distribution", value: features.isMarketingOrBroadcast ? 0.38 : 0 },
    { label: "expedited-review", value: features.isExpedited ? 0.22 : 0 },
    { label: "rights-evidence", value: features.hasRightsEvidence ? -0.64 : 0 },
    { label: "first-party-capture", value: features.hasOriginalCaptureSignals ? -0.88 : 0 }
  ];

  let logit = -1.92;
  for (const contribution of contributions) {
    logit += contribution.value;
  }

  const probabilityInfringement = clamp01(1 / (1 + Math.exp(-logit)));
  const confidence = Math.max(
    56,
    Math.min(99, Math.round(56 + Math.abs(probabilityInfringement - 0.5) * 88))
  );
  const classification: RiskTier =
    probabilityInfringement >= 0.72 ? "high" : probabilityInfringement >= 0.45 ? "medium" : "low";
  const topSignals = contributions
    .filter((item) => Math.abs(item.value) >= 0.14)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4)
    .map((item) => `${item.label}:${item.value >= 0 ? "+" : ""}${item.value.toFixed(2)}`);

  return {
    modelVersion: ML_MODEL_VERSION,
    probabilityInfringement,
    confidence,
    classification,
    topSignals,
    provider: "local-heuristic",
    inferenceMode: "feature-risk"
  };
}

function normalizeConfidence(confidence: number | undefined, probability: number) {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return Math.max(56, Math.min(99, Math.round(56 + Math.abs(probability - 0.5) * 88)));
  }
  return Math.max(1, Math.min(99, Math.round(confidence)));
}

function normalizeClassification(
  classification: RiskTier | undefined,
  probability: number
): RiskTier {
  if (classification === "low" || classification === "medium" || classification === "high") {
    return classification;
  }
  if (probability >= 0.72) {
    return "high";
  }
  if (probability >= 0.45) {
    return "medium";
  }
  return "low";
}

function normalizeSignals(signals: string[] | undefined) {
  if (!Array.isArray(signals)) {
    return [];
  }
  return signals.filter((signal): signal is string => typeof signal === "string").slice(0, 8);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
