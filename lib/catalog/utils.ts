import type { RightsCatalogEntry } from "@/lib/types";

export function mergeCatalogs(
  fallbackCatalog: RightsCatalogEntry[],
  externalCatalog: RightsCatalogEntry[]
): RightsCatalogEntry[] {
  const merged = new Map<string, RightsCatalogEntry>();

  for (const entry of [...fallbackCatalog, ...externalCatalog]) {
    if (!entry.id) continue;
    merged.set(entry.id, entry);
  }

  return Array.from(merged.values());
}

export function normalizeCatalogEntries(entries: unknown): RightsCatalogEntry[] {
  if (!Array.isArray(entries)) return [];

  const normalized: RightsCatalogEntry[] = [];
  const seen = new Set<string>();

  for (const candidate of entries) {
    const parsed = normalizeCatalogEntry(candidate);
    if (!parsed || seen.has(parsed.id)) continue;
    seen.add(parsed.id);
    normalized.push(parsed);
  }

  return normalized;
}

function normalizeCatalogEntry(candidate: unknown): RightsCatalogEntry | null {
  if (!isRecord(candidate)) return null;

  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const owner = typeof candidate.owner === "string" ? candidate.owner.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  if (!id || !owner || !title) return null;

  return {
    id,
    owner,
    title,
    aliases: toStringArray(candidate.aliases),
    keywords: toStringArray(candidate.keywords),
    domainHints: toStringArray(candidate.domainHints),
    visualFingerprints: toFingerprintArray(candidate.visualFingerprints),
    clipDescriptions: toStringArray(candidate.clipDescriptions),
  };
}

export function collectCatalogDomainHints(catalog: RightsCatalogEntry[]) {
  const dedup = new Set<string>();
  for (const entry of catalog) {
    for (const hint of entry.domainHints) {
      const normalized = hint.trim().toLowerCase();
      if (normalized) dedup.add(normalized);
    }
  }
  return Array.from(dedup);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 80);
}

function toFingerprintArray(value: unknown): RightsCatalogEntry["visualFingerprints"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isRecord(item) && typeof item.dhash === "string") return item as RightsCatalogEntry["visualFingerprints"][number];
      return "";
    })
    .filter((item) => item !== "")
    .slice(0, 80);
}
