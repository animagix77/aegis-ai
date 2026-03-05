import type { CatalogMatch, RightsCatalogEntry, MediaFingerprint } from "@/lib/types";
import { hammingDistanceHex } from "@/lib/hashing/hamming";
import { compareMultiHash, parseCatalogFingerprint } from "@/lib/hashing/multi-hash";

export type CatalogBuildInput = {
  catalog: RightsCatalogEntry[];
  rawCorpus: string;
  fileName: string | null;
  websiteHost: string;
  mediaFingerprints: MediaFingerprint[];
};

function normalizeLoose(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenizeLoose(corpus: string) {
  return normalizeLoose(corpus)
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 120);
}

function levenshteinDistanceLimited(left: string, right: string, limit: number) {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > limit) return limit + 1;

  const dp = new Array(right.length + 1).fill(0);
  for (let j = 0; j <= right.length; j += 1) dp[j] = j;

  for (let i = 1; i <= left.length; i += 1) {
    let prevDiagonal = dp[0];
    dp[0] = i;
    let rowMin = dp[0];
    for (let j = 1; j <= right.length; j += 1) {
      const prevAbove = dp[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prevDiagonal + cost);
      prevDiagonal = prevAbove;
      rowMin = Math.min(rowMin, dp[j]);
    }
    if (rowMin > limit) return limit + 1;
  }

  return dp[right.length];
}

function firstMatch(candidates: string[], corpus: string) {
  const normalizedCorpus = normalizeLoose(corpus);
  for (const candidate of candidates) {
    const raw = candidate.toLowerCase().trim();
    if (!raw) continue;
    if (corpus.includes(raw)) return candidate;
    const loose = normalizeLoose(raw);
    if (loose && normalizedCorpus.includes(loose)) return candidate;
  }
  return null;
}

function firstApproximateMatch(candidates: string[], corpusTokens: string[]) {
  for (const candidate of candidates) {
    const normalized = normalizeLoose(candidate);
    if (!normalized || normalized.includes(" ") || normalized.length < 6) continue;

    for (const token of corpusTokens) {
      if (Math.abs(token.length - normalized.length) > 1) continue;
      const distance = levenshteinDistanceLimited(token, normalized, 1);
      if (distance <= 1) return `${candidate} ~ ${token}`;
    }
  }
  return null;
}

export function buildCatalogMatches(input: CatalogBuildInput): CatalogMatch[] {
  const textCorpus = input.rawCorpus.toLowerCase();
  const filename = (input.fileName ?? "").toLowerCase();
  const host = (input.websiteHost ?? "").toLowerCase();
  const corpusTokens = tokenizeLoose(textCorpus);
  const matches: CatalogMatch[] = [];
  const seen = new Set<string>();

  for (const entry of input.catalog) {
    // Alias text match
    const aliasHit = firstMatch(entry.aliases, textCorpus);
    if (aliasHit) {
      const key = `${entry.id}:text:${aliasHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id, owner: entry.owner, title: entry.title,
          method: "text", evidence: aliasHit, confidence: 78, riskImpact: 10,
        });
      }
    }

    // Keyword text match
    const keywordHit = firstMatch(entry.keywords, textCorpus);
    if (keywordHit) {
      const key = `${entry.id}:text:${keywordHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id, owner: entry.owner, title: entry.title,
          method: "text", evidence: keywordHit, confidence: 73, riskImpact: 8,
        });
      }
    }

    // Approximate token match
    const approximateHit = firstApproximateMatch([...entry.aliases, ...entry.keywords], corpusTokens);
    if (approximateHit) {
      const key = `${entry.id}:approx:${approximateHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id, owner: entry.owner, title: entry.title,
          method: "text", evidence: `${approximateHit} (approximate token match)`,
          confidence: 66, riskImpact: 7,
        });
      }
    }

    // Filename match
    const filenameHit = firstMatch([...entry.aliases, ...entry.keywords], filename);
    if (filenameHit) {
      const key = `${entry.id}:filename:${filenameHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id, owner: entry.owner, title: entry.title,
          method: "filename", evidence: filenameHit, confidence: 84, riskImpact: 12,
        });
      }
    }

    // Domain hint match
    const domainHit = entry.domainHints.find((hint) => host.includes(hint.toLowerCase()));
    if (domainHit) {
      const key = `${entry.id}:domain:${domainHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id, owner: entry.owner, title: entry.title,
          method: "url-domain", evidence: domainHit, confidence: 90, riskImpact: 16,
        });
      }
    }

    // Visual fingerprint match — multi-hash ensemble
    if (entry.visualFingerprints.length && input.mediaFingerprints.length) {
      let bestConfidence = 0;
      let bestMatch: CatalogMatch | null = null;

      for (const mediaFp of input.mediaFingerprints) {
        for (const catalogFp of entry.visualFingerprints) {
          const catalogHashes = parseCatalogFingerprint(catalogFp);
          if (!catalogHashes.length) continue;

          const comparison = compareMultiHash(mediaFp.hashes, catalogHashes);
          if (comparison.compositeConfidence > bestConfidence) {
            bestConfidence = comparison.compositeConfidence;

            const matchingAlgs = comparison.matches.filter((m) => m.isMatch);
            const isMultiHash = matchingAlgs.length > 1;
            const method: CatalogMatch["method"] = isMultiHash ? "multi-hash-ensemble" : "visual-fingerprint";

            const evidenceParts = matchingAlgs.map(
              (m) => `${m.algorithm}:d=${m.distance}`
            );
            const evidence = `${mediaFp.frameLabel} [${evidenceParts.join(", ")}]`;

            bestMatch = {
              entryId: entry.id,
              owner: entry.owner,
              title: entry.title,
              method,
              evidence,
              confidence: Math.round(comparison.compositeConfidence),
              riskImpact: 26,
              hashDetails: matchingAlgs[0]
                ? { algorithm: matchingAlgs[0].algorithm, distance: matchingAlgs[0].distance, threshold: matchingAlgs[0].threshold }
                : undefined,
            };
          }

          // Also check legacy single-hash for backward compat
          if (catalogHashes.length === 1 && catalogHashes[0].algorithm === "dhash") {
            for (const ph of mediaFp.hashes) {
              if (ph.algorithm !== "dhash") continue;
              const distance = hammingDistanceHex(ph.value, catalogHashes[0].value);
              if (Number.isFinite(distance) && distance <= 8) {
                const confidence = Math.max(78, 100 - distance * 3);
                if (confidence > bestConfidence) {
                  bestConfidence = confidence;
                  bestMatch = {
                    entryId: entry.id, owner: entry.owner, title: entry.title,
                    method: "visual-fingerprint",
                    evidence: `${mediaFp.frameLabel} fingerprint distance ${distance}`,
                    confidence, riskImpact: 26,
                    hashDetails: { algorithm: "dhash", distance, threshold: 8 },
                  };
                }
              }
            }
          }
        }
      }

      if (bestMatch && bestConfidence >= 70) {
        const key = `${entry.id}:visual`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push(bestMatch);
        }
      }
    }
  }

  return compactCatalogMatches(matches);
}

function compactCatalogMatches(matches: CatalogMatch[]) {
  const sorted = [...matches].sort(
    (a, b) => b.riskImpact - a.riskImpact || b.confidence - a.confidence
  );

  const bestByEntry = new Map<string, CatalogMatch>();
  for (const match of sorted) {
    const existing = bestByEntry.get(match.entryId);
    if (
      !existing ||
      match.riskImpact > existing.riskImpact ||
      (match.riskImpact === existing.riskImpact && match.confidence > existing.confidence)
    ) {
      bestByEntry.set(match.entryId, match);
    }
  }

  const dedupedByEntry = Array.from(bestByEntry.values()).sort(
    (a, b) => b.riskImpact - a.riskImpact || b.confidence - a.confidence
  );

  const ownerCounts = new Map<string, number>();
  const compact: CatalogMatch[] = [];
  for (const match of dedupedByEntry) {
    const count = ownerCounts.get(match.owner) ?? 0;
    if (count >= 2) continue;
    ownerCounts.set(match.owner, count + 1);
    compact.push(match);
    if (compact.length >= 20) break;
  }

  return compact;
}
