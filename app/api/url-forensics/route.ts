import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const MAX_HTML_CHARS = 220_000;
const FETCH_TIMEOUT_MS = 9_000;

const BASE_COPYRIGHT_PATTERNS = [
  /\bcopyright\b/gi,
  /©/g,
  /\ball rights reserved\b/gi,
  /\blicensed\b/gi,
  /\blicensing\b/gi,
  /\btrademark\b/gi,
  /\bterms of use\b/gi,
  /\bcontent usage\b/gi
];

const RIGHTSHOLDER_TERMS = [
  "disney",
  "pixar",
  "marvel",
  "lucasfilm",
  "star wars",
  "warner",
  "dc",
  "hbo",
  "max",
  "universal",
  "illumination",
  "dreamworks",
  "paramount",
  "sony",
  "netflix",
  "prime video",
  "amazon mgm",
  "apple tv",
  "hulu",
  "peacock",
  "lionsgate",
  "a24",
  "getty images",
  "shutterstock",
  "adobe stock",
  "pond5",
  "alamy",
  "reuters",
  "associated press",
  "ap images"
];

const COPYRIGHT_PATTERNS = [
  ...BASE_COPYRIGHT_PATTERNS,
  ...RIGHTSHOLDER_TERMS.map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "gi"))
];

type ForensicsResponse = {
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

export async function POST(request: Request) {
  const body = (await safeJson(request)) as { url?: unknown };
  const requestedUrl = typeof body?.url === "string" ? body.url.trim() : "";
  const base: ForensicsResponse = {
    requestedUrl,
    normalizedUrl: requestedUrl,
    hostname: "",
    status: "invalid_url",
    statusNote: "invalid_url",
    httpStatus: null,
    contentType: "unknown",
    title: "",
    description: "",
    sha256: "unavailable",
    copyrightMarkers: [],
    fetchedAt: new Date().toISOString()
  };

  if (!requestedUrl) {
    return NextResponse.json(base, { status: 200 });
  }

  const normalized = normalizeUrl(requestedUrl);
  if (!normalized) {
    return NextResponse.json(base, { status: 200 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(normalized.href, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "AegisForensicsBot/1.0 (+internal-audit)",
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5"
      },
      cache: "no-store"
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() || "unknown";
    const bodyText = (await response.text()).slice(0, MAX_HTML_CHARS);
    const title = extractTitle(bodyText);
    const description = extractMetaDescription(bodyText);
    const plainText = htmlToText(bodyText);
    const combinedCorpus = [normalized.href, normalized.hostname, title, description, plainText]
      .filter(Boolean)
      .join(" ");

    const result: ForensicsResponse = {
      requestedUrl,
      normalizedUrl: normalized.href,
      hostname: normalized.hostname.toLowerCase(),
      status: "fetched",
      statusNote: response.ok ? "fetched" : `http_${response.status}`,
      httpStatus: response.status,
      contentType,
      title,
      description,
      sha256: sha256Text(bodyText),
      copyrightMarkers: findCopyrightMarkers(combinedCorpus),
      fetchedAt: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    clearTimeout(timeoutId);
    const result: ForensicsResponse = {
      requestedUrl,
      normalizedUrl: normalized.href,
      hostname: normalized.hostname.toLowerCase(),
      status: "unreachable",
      statusNote: error instanceof Error ? normalizeErrorName(error.name) : "request_failed",
      httpStatus: null,
      contentType: "unknown",
      title: "",
      description: "",
      sha256: "unavailable",
      copyrightMarkers: [],
      fetchedAt: new Date().toISOString()
    };

    return NextResponse.json(result, { status: 200 });
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeUrl(input: string) {
  try {
    return new URL(input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`);
  } catch {
    return null;
  }
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtmlEntity(match[1]).trim().replace(/\s+/g, " ") : "";
}

function extractMetaDescription(html: string) {
  const attrMatch = html.match(
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
  );
  if (attrMatch?.[1]) {
    return decodeHtmlEntity(attrMatch[1]).trim().replace(/\s+/g, " ");
  }

  const reverseAttrMatch = html.match(
    /<meta\s+[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i
  );
  return reverseAttrMatch?.[1]
    ? decodeHtmlEntity(reverseAttrMatch[1]).trim().replace(/\s+/g, " ")
    : "";
}

function htmlToText(html: string) {
  return decodeHtmlEntity(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function findCopyrightMarkers(text: string) {
  const hits = new Set<string>();
  for (const pattern of COPYRIGHT_PATTERNS) {
    const matches = text.match(pattern);
    matches?.forEach((match) => hits.add(match.toLowerCase()));
  }
  return Array.from(hits).slice(0, 20);
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeHtmlEntity(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeErrorName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 48) || "request_failed";
}
