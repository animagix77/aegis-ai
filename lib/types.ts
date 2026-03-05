import type { QuickAuditPayload } from "@/components/quick-audit-prompt";

export type RiskTier = "low" | "medium" | "high";

export type HashAlgorithm = "dhash" | "phash" | "ahash" | "color-histogram";

export type PerceptualHash = {
  algorithm: HashAlgorithm;
  value: string;
  bitLength: number;
};

export type SourceMarker = {
  source: string;
  matchType: "exact text";
  evidence: string;
  confidence: number;
  riskImpact: number;
  legalRationale: string;
  action: string;
};

export type SourceData = {
  mimeType: string;
  extension: string;
  sizeBytes: number;
  lastModified: string;
  sha256: string;
  mimeExtensionMismatch: boolean;
};

export type WebsiteForensics = {
  requestedUrl: string;
  normalizedUrl: string;
  hostname: string;
  status: "fetched" | "invalid_url" | "unreachable";
  statusNote: string;
  httpStatus: number | null;
  contentType: string;
  title: string;
  description: string;
  sha256: string;
  copyrightMarkers: string[];
  fetchedAt: string;
};

export type ExifEntry = {
  key: string;
  value: string;
};

export type HallucinationSignal = {
  label: string;
  evidence: string;
  severity: "medium" | "high";
  confidence: number;
  riskImpact: number;
  rationale: string;
};

export type SecondaryAnalysisSignal = {
  label: string;
  evidence: string;
  riskImpact: number;
  rationale: string;
};

export type CatalogMatch = {
  entryId: string;
  owner: string;
  title: string;
  method: "text" | "filename" | "url-domain" | "visual-fingerprint" | "clip-similarity" | "multi-hash-ensemble";
  evidence: string;
  confidence: number;
  riskImpact: number;
  hashDetails?: {
    algorithm: HashAlgorithm;
    distance: number;
    threshold: number;
  };
};

export type MediaFingerprint = {
  kind: "image" | "video-frame";
  frameLabel: string;
  frameTimestamp?: number;
  hashes: PerceptualHash[];
  isSceneChange?: boolean;
  isBlankFrame?: boolean;
  rotationVariants?: PerceptualHash[];
  quadrantHashes?: PerceptualHash[];
};

export type CatalogVisualFingerprint = {
  dhash: string;
  phash?: string;
  ahash?: string;
  colorHistogram?: string;
  label?: string;
};

export type RightsCatalogEntry = {
  id: string;
  owner: string;
  title: string;
  aliases: string[];
  keywords: string[];
  domainHints: string[];
  visualFingerprints: (string | CatalogVisualFingerprint)[];
  clipDescriptions?: string[];
};

export type RightsCatalogDocument = {
  version?: string;
  entries?: unknown;
};

export type ClipSimilarityResult = {
  queryDescription: string;
  topMatchScore: number;
  topMatchCatalogEntryId: string | null;
};

export type AiDetectionResult = {
  model: string;
  aiGeneratedProbability: number;
  humanProbability: number;
  label: "ai-generated" | "human" | "uncertain";
};

export type WatermarkResult = {
  hasC2pa: boolean;
  c2paManifest: Record<string, unknown> | null;
  generator: string | null;
  signerInfo: string | null;
  isValid: boolean | null;
};

export type MlAssessment = {
  modelVersion: string;
  probabilityInfringement: number;
  confidence: number;
  classification: RiskTier;
  topSignals: string[];
  clipSimilarity: ClipSimilarityResult | null;
  aiDetection: AiDetectionResult | null;
  watermark: WatermarkResult | null;
  externalApiStatus: "all-ok" | "partial-failure" | "all-unavailable" | "skipped";
};

export type IpPrivacySummary = {
  detectedModels: string[];
  overallIpRisk: "high" | "medium" | "low" | "unknown";
  findings: string[];
  hasTrainingExposure: boolean;
  hasMarketingExposure: boolean;
};

export type AuditRecord = {
  id: string;
  prompt: string;
  fileName: string | null;
  targetUrl: string | null;
  distributionIntent: QuickAuditPayload["distributionIntent"];
  urgencyLevel: QuickAuditPayload["urgencyLevel"];
  riskScore: number;
  riskTier: RiskTier;
  decision: string;
  summary: string;
  findings: string[];
  sourceData: SourceData;
  websiteForensics: WebsiteForensics | null;
  websiteForensicsList: WebsiteForensics[];
  mlAssessment: MlAssessment;
  ipPrivacy: IpPrivacySummary;
  exifEntries: ExifEntry[];
  mediaFingerprints: MediaFingerprint[];
  catalogMatches: CatalogMatch[];
  hallucinationSignals: HallucinationSignal[];
  secondarySignals: SecondaryAnalysisSignal[];
  sourceMarkers: SourceMarker[];
  matchedSources: string[];
  createdAt: string;
};

export type MlModelFeatures = {
  highHitsCount: number;
  mediumHitsCount: number;
  sourceHitsCount: number;
  criticalHitsCount: number;
  catalogMatchesCount: number;
  highConfidenceCatalogHits: number;
  visualFingerprintCollision: boolean;
  hallucinationSignalsCount: number;
  secondarySignalsCount: number;
  websiteCheckedCount: number;
  websiteFetchedCount: number;
  websiteUnreachableCount: number;
  websiteInvalidCount: number;
  websiteMarkersCount: number;
  mimeExtensionMismatch: boolean;
  missingExifImage: boolean;
  missingMediaFingerprint: boolean;
  hasRightsEvidence: boolean;
  hasOriginalCaptureSignals: boolean;
  isMarketingOrBroadcast: boolean;
  isExpedited: boolean;
  clipTopMatchScore: number;
  aiGeneratedProbability: number;
  hasC2paManifest: boolean;
  c2paGeneratorIsAi: boolean;
  multiHashEnsembleHits: number;
  externalApisAvailable: boolean;
};
