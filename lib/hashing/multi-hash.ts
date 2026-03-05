import type { HashAlgorithm, PerceptualHash, CatalogVisualFingerprint } from "@/lib/types";
import { dHashFromImageSource } from "./dhash";
import { computeAHash } from "./ahash";
import { computePHash } from "./phash";
import { computeColorHistogramHash } from "./color-histogram";
import { computeRotationVariants } from "./rotation";
import { computeQuadrantHashes } from "./crop-region";
import { hammingDistanceHex } from "./hamming";

type HashFn = (source: CanvasImageSource, w: number, h: number) => string | null;

const HASH_FNS: Record<HashAlgorithm, HashFn> = {
  dhash: dHashFromImageSource,
  ahash: computeAHash,
  phash: computePHash,
  "color-histogram": computeColorHistogramHash,
};

const BIT_LENGTHS: Record<HashAlgorithm, number> = {
  dhash: 64,
  phash: 64,
  ahash: 64,
  "color-histogram": 64,
};

const DEFAULT_THRESHOLDS: Record<HashAlgorithm, number> = {
  dhash: 8,
  phash: 10,
  ahash: 6,
  "color-histogram": 12,
};

const DEFAULT_WEIGHTS: Record<HashAlgorithm, number> = {
  dhash: 0.30,
  phash: 0.35,
  ahash: 0.10,
  "color-histogram": 0.25,
};

const MAX_DISTANCES: Record<HashAlgorithm, number> = {
  dhash: 32,
  phash: 32,
  ahash: 32,
  "color-histogram": 32,
};

export type MultiHashConfig = {
  algorithms: HashAlgorithm[];
  includeRotations?: boolean;
  includeQuadrants?: boolean;
};

export type MultiHashResult = {
  primary: PerceptualHash[];
  rotationVariants: PerceptualHash[];
  quadrantHashes: PerceptualHash[];
};

export type HashComparisonResult = {
  algorithm: HashAlgorithm;
  distance: number;
  threshold: number;
  isMatch: boolean;
  weight: number;
};

export type MultiHashComparison = {
  matches: HashComparisonResult[];
  compositeConfidence: number;
};

const DEFAULT_CONFIG: MultiHashConfig = {
  algorithms: ["dhash", "phash", "ahash", "color-histogram"],
  includeRotations: false,
  includeQuadrants: false,
};

export function computeMultiHash(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  config: MultiHashConfig = DEFAULT_CONFIG
): MultiHashResult {
  const primary: PerceptualHash[] = [];

  for (const alg of config.algorithms) {
    const fn = HASH_FNS[alg];
    const hash = fn(source, sourceWidth, sourceHeight);
    if (hash) {
      primary.push({ algorithm: alg, value: hash, bitLength: BIT_LENGTHS[alg] });
    }
  }

  const rotationVariants = config.includeRotations
    ? computeRotationVariants(source, sourceWidth, sourceHeight, config.algorithms)
    : [];

  const quadrantHashes = config.includeQuadrants
    ? computeQuadrantHashes(source, sourceWidth, sourceHeight, config.algorithms)
    : [];

  return { primary, rotationVariants, quadrantHashes };
}

export function compareMultiHash(
  a: PerceptualHash[],
  b: PerceptualHash[],
  thresholds: Record<HashAlgorithm, number> = DEFAULT_THRESHOLDS
): MultiHashComparison {
  const matches: HashComparisonResult[] = [];

  for (const hashA of a) {
    const hashB = b.find((h) => h.algorithm === hashA.algorithm);
    if (!hashB) continue;

    const distance = hammingDistanceHex(hashA.value, hashB.value);
    const threshold = thresholds[hashA.algorithm] ?? 8;
    const weight = DEFAULT_WEIGHTS[hashA.algorithm] ?? 0.25;

    matches.push({
      algorithm: hashA.algorithm,
      distance,
      threshold,
      isMatch: Number.isFinite(distance) && distance <= threshold,
      weight,
    });
  }

  const matchingResults = matches.filter((m) => m.isMatch);
  if (matchingResults.length === 0) {
    return { matches, compositeConfidence: 0 };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const m of matches) {
    if (!m.isMatch) continue;
    const maxDist = MAX_DISTANCES[m.algorithm] ?? 32;
    const similarity = 1 - m.distance / maxDist;
    weightedSum += m.weight * similarity;
    totalWeight += m.weight;
  }

  const compositeConfidence = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  return { matches, compositeConfidence };
}

export function parseCatalogFingerprint(
  fp: string | CatalogVisualFingerprint
): PerceptualHash[] {
  if (typeof fp === "string") {
    return fp ? [{ algorithm: "dhash", value: fp, bitLength: 64 }] : [];
  }

  const hashes: PerceptualHash[] = [];
  if (fp.dhash) hashes.push({ algorithm: "dhash", value: fp.dhash, bitLength: 64 });
  if (fp.phash) hashes.push({ algorithm: "phash", value: fp.phash, bitLength: 64 });
  if (fp.ahash) hashes.push({ algorithm: "ahash", value: fp.ahash, bitLength: 64 });
  if (fp.colorHistogram) hashes.push({ algorithm: "color-histogram", value: fp.colorHistogram, bitLength: 64 });
  return hashes;
}
