"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { QuickAuditPrompt, type QuickAuditPayload } from "@/components/quick-audit-prompt";

type RiskTier = "low" | "medium" | "high";

type SourceMarker = {
  source: string;
  matchType: "exact text";
  evidence: string;
  confidence: number;
  riskImpact: number;
  legalRationale: string;
  action: string;
};

type SourceData = {
  mimeType: string;
  extension: string;
  sizeBytes: number;
  lastModified: string;
  sha256: string;
  mimeExtensionMismatch: boolean;
};

type WebsiteForensics = {
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

type ExifEntry = {
  key: string;
  value: string;
};

type HallucinationSignal = {
  label: string;
  evidence: string;
  severity: "medium" | "high";
  confidence: number;
  riskImpact: number;
  rationale: string;
};

type SecondaryAnalysisSignal = {
  label: string;
  evidence: string;
  riskImpact: number;
  rationale: string;
};

type CatalogMatch = {
  entryId: string;
  owner: string;
  title: string;
  method: "text" | "filename" | "url-domain" | "visual-fingerprint";
  evidence: string;
  confidence: number;
  riskImpact: number;
};

type MediaFingerprint = {
  kind: "image-dhash" | "video-frame-dhash";
  value: string;
  frameLabel: string;
};

type RightsCatalogEntry = {
  id: string;
  owner: string;
  title: string;
  aliases: string[];
  keywords: string[];
  domainHints: string[];
  visualFingerprints: string[];
};

type RightsCatalogDocument = {
  version?: string;
  entries?: unknown;
};

type MlAssessment = {
  modelVersion: string;
  probabilityInfringement: number;
  confidence: number;
  classification: RiskTier;
  topSignals: string[];
};

type AuditRecord = {
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
  exifEntries: ExifEntry[];
  mediaFingerprints: MediaFingerprint[];
  catalogMatches: CatalogMatch[];
  hallucinationSignals: HallucinationSignal[];
  secondarySignals: SecondaryAnalysisSignal[];
  sourceMarkers: SourceMarker[];
  matchedSources: string[];
  createdAt: string;
};

const HIGH_RISK_PHRASES = [
  "in the style of",
  "copy",
  "recreate",
  "exact scene",
  "same as",
  "look like",
  "shot for shot",
  "frame by frame",
  "replica"
];

const MEDIUM_RISK_PHRASES = [
  "inspired by",
  "homage",
  "tribute",
  "franchise",
  "character",
  "movie poster",
  "cinematic style"
];

const PROTECTED_SOURCES = [
  "disney",
  "disney+",
  "moana",
  "pixar",
  "marvel",
  "star wars",
  "lucasfilm",
  "warner",
  "warner bros",
  "dc",
  "hbo",
  "max",
  "universal",
  "dreamworks",
  "illumination",
  "paramount",
  "paramount+",
  "sony",
  "netflix",
  "prime video",
  "amazon mgm",
  "apple tv",
  "peacock",
  "hulu",
  "spider-man",
  "batman",
  "superman",
  "harry potter",
  "lord of the rings",
  "jurassic",
  "minions",
  "shrek",
  "avatar",
  "frozen"
];

const CRITICAL_SOURCE_TERMS = [
  "moana",
  "disney",
  "pixar",
  "marvel",
  "star wars",
  "mickey",
  "spider-man",
  "batman",
  "harry potter",
  "jurassic park"
];

const PROTECTED_DOMAIN_HINTS = [
  "disney.",
  "pixar.",
  "marvel.",
  "starwars.",
  "lucasfilm.",
  "netflix.",
  "warnerbros.",
  "dc.",
  "hbo.",
  "universalpictures.",
  "dreamworks.",
  "paramount.",
  "sony.",
  "amzn.",
  "primevideo.",
  "appletv.",
  "hulu.",
  "peacocktv.",
  "paramountplus.",
  "max.",
  "spiderman.",
  "jurassic",
  "harrypotter",
  "lordoftherings"
];

const RIGHTS_EVIDENCE_TERMS = [
  "original",
  "owned",
  "licensed",
  "license",
  "commissioned",
  "client-owned",
  "created in-house"
];

const ML_MODEL_VERSION = "aegis-ml-lite-2026.02";

const RIGHTS_CATALOG_VERSION = "2026.02-global-core";

const DEFAULT_RIGHTS_CATALOG: RightsCatalogEntry[] = [
  {
    id: "disney-animation",
    owner: "Disney",
    title: "Disney Animated Catalog",
    aliases: ["disney", "walt disney animation", "frozen", "moana", "encanto", "zootopia"],
    keywords: ["princess", "elsa", "olaf", "arendelle", "moana", "maui"],
    domainHints: ["disney.", "disneyplus."],
    visualFingerprints: []
  },
  {
    id: "pixar",
    owner: "Pixar",
    title: "Pixar Features",
    aliases: ["pixar", "toy story", "inside out", "finding nemo", "cars", "incredibles"],
    keywords: ["buzz lightyear", "woody", "lightning mcqueen", "nemo"],
    domainHints: ["pixar."],
    visualFingerprints: []
  },
  {
    id: "marvel",
    owner: "Marvel Studios",
    title: "Marvel Cinematic Content",
    aliases: ["marvel", "avengers", "spider-man", "iron man", "captain america", "thor"],
    keywords: ["avengers", "peter parker", "web shooter", "vibranium"],
    domainHints: ["marvel.", "marvelstudios."],
    visualFingerprints: []
  },
  {
    id: "lucasfilm-starwars",
    owner: "Lucasfilm",
    title: "Star Wars",
    aliases: ["star wars", "lucasfilm", "jedi", "sith", "darth vader", "lightsaber"],
    keywords: ["millennium falcon", "skywalker", "stormtrooper", "death star"],
    domainHints: ["starwars.", "lucasfilm."],
    visualFingerprints: []
  },
  {
    id: "warner-dc",
    owner: "Warner Bros / DC",
    title: "DC + Warner Franchises",
    aliases: ["warner", "dc", "batman", "superman", "wonder woman", "joker"],
    keywords: ["gotham", "metropolis", "dark knight"],
    domainHints: ["warnerbros.", "dc."],
    visualFingerprints: []
  },
  {
    id: "universal",
    owner: "Universal",
    title: "Universal Pictures Catalog",
    aliases: ["universal", "jurassic park", "minions", "despicable me", "fast and furious"],
    keywords: ["t rex", "jurassic world", "minion"],
    domainHints: ["universalpictures.", "universal."],
    visualFingerprints: []
  },
  {
    id: "paramount",
    owner: "Paramount",
    title: "Paramount Franchises",
    aliases: ["paramount", "mission impossible", "transformers", "top gun", "spongebob"],
    keywords: ["ethan hunt", "autobot", "maverick"],
    domainHints: ["paramount.", "paramountplus."],
    visualFingerprints: []
  },
  {
    id: "sony",
    owner: "Sony Pictures",
    title: "Sony Motion Picture Content",
    aliases: ["sony pictures", "ghostbusters", "jumanji", "venom", "spider-verse"],
    keywords: ["spider verse", "miles morales", "ghostbusters"],
    domainHints: ["sonypictures.", "sony."],
    visualFingerprints: []
  },
  {
    id: "dreamworks",
    owner: "DreamWorks",
    title: "DreamWorks Animation",
    aliases: ["dreamworks", "shrek", "kung fu panda", "how to train your dragon"],
    keywords: ["shrek", "po", "toothless"],
    domainHints: ["dreamworks."],
    visualFingerprints: []
  },
  {
    id: "netflix-originals",
    owner: "Netflix",
    title: "Netflix Originals",
    aliases: ["netflix", "stranger things", "squid game", "wednesday", "the witcher"],
    keywords: ["eleven", "upside down", "vecna"],
    domainHints: ["netflix."],
    visualFingerprints: []
  },
  {
    id: "amazon-mgm",
    owner: "Amazon MGM",
    title: "Amazon Prime / MGM Content",
    aliases: ["amazon mgm", "prime video", "the boys", "rings of power", "james bond"],
    keywords: ["homelander", "middle-earth", "007"],
    domainHints: ["primevideo.", "mgm.", "amazon."],
    visualFingerprints: []
  },
  {
    id: "apple-tv",
    owner: "Apple TV+",
    title: "Apple TV+ Originals",
    aliases: ["apple tv", "apple tv+", "severance", "ted lasso", "foundation"],
    keywords: ["lumon", "innies", "outies"],
    domainHints: ["appletv.", "tv.apple."],
    visualFingerprints: []
  },
  {
    id: "hbo-max",
    owner: "HBO / Max",
    title: "HBO + Max Originals",
    aliases: ["hbo", "max", "game of thrones", "house of the dragon", "the last of us"],
    keywords: ["westeros", "targaryen", "clicker"],
    domainHints: ["hbo.", "max."],
    visualFingerprints: []
  },
  {
    id: "disney-live-action",
    owner: "Disney",
    title: "Disney Live Action and Franchise",
    aliases: ["disney", "pirates of the caribbean", "tron", "lion king", "beauty and the beast"],
    keywords: ["jack sparrow", "simba", "beast"],
    domainHints: ["disney.", "disneyplus.", "disneystudios."],
    visualFingerprints: []
  },
  {
    id: "warner-franchises",
    owner: "Warner Bros",
    title: "Warner Franchise Properties",
    aliases: ["warner bros", "harry potter", "dune", "matrix", "mad max"],
    keywords: ["hogwarts", "gryffindor", "neo", "arrakis"],
    domainHints: ["warnerbros.", "wizardingworld."],
    visualFingerprints: []
  },
  {
    id: "universal-illumination",
    owner: "Universal / Illumination",
    title: "Illumination and Universal Animation",
    aliases: ["illumination", "despicable me", "minions", "sing", "secret life of pets"],
    keywords: ["gru", "minion", "vector"],
    domainHints: ["illumination.", "universalpictures.", "universal."],
    visualFingerprints: []
  },
  {
    id: "lionsgate",
    owner: "Lionsgate",
    title: "Lionsgate Film Catalog",
    aliases: ["lionsgate", "john wick", "hunger games", "saw", "twilight"],
    keywords: ["katniss", "district 12", "continental hotel"],
    domainHints: ["lionsgate."],
    visualFingerprints: []
  },
  {
    id: "a24",
    owner: "A24",
    title: "A24 Feature Catalog",
    aliases: ["a24", "everything everywhere all at once", "civil war", "hereditary"],
    keywords: ["multiverse", "daniels", "midsommar"],
    domainHints: ["a24films.", "a24."],
    visualFingerprints: []
  },
  {
    id: "peacock-nbcu",
    owner: "NBCUniversal / Peacock",
    title: "Peacock and NBCUniversal Originals",
    aliases: ["peacock", "nbcuniversal", "the office", "parks and recreation"],
    keywords: ["dunder mifflin", "scranton", "pawnee"],
    domainHints: ["peacocktv.", "nbcuniversal.", "nbc."],
    visualFingerprints: []
  },
  {
    id: "hulu-fx",
    owner: "Hulu / FX",
    title: "Hulu and FX Originals",
    aliases: ["hulu", "fx", "the bear", "shogun", "only murders in the building"],
    keywords: ["carmy", "shogun", "arconia"],
    domainHints: ["hulu.", "fxnetworks."],
    visualFingerprints: []
  },
  {
    id: "getty-images",
    owner: "Getty Images",
    title: "Getty Rights-Managed and Editorial",
    aliases: ["getty", "getty images", "rights managed", "editorial photo"],
    keywords: ["gettyimages", "editorial only", "licensing"],
    domainHints: ["gettyimages.", "getty."],
    visualFingerprints: []
  },
  {
    id: "shutterstock",
    owner: "Shutterstock",
    title: "Shutterstock Licensed Assets",
    aliases: ["shutterstock", "shutterstock editorial", "stock photo"],
    keywords: ["shutterstock", "licensed stock"],
    domainHints: ["shutterstock."],
    visualFingerprints: []
  },
  {
    id: "adobe-stock",
    owner: "Adobe",
    title: "Adobe Stock",
    aliases: ["adobe stock", "adobe licensed", "fotolia"],
    keywords: ["adobestock", "licensed through adobe"],
    domainHints: ["stock.adobe.", "adobe."],
    visualFingerprints: []
  },
  {
    id: "reuters-ap",
    owner: "Reuters / AP",
    title: "Newswire Editorial Content",
    aliases: ["reuters", "associated press", "ap images", "ap photo"],
    keywords: ["wire photo", "newswire", "editorial rights"],
    domainHints: ["reuters.", "apnews.", "apimages."],
    visualFingerprints: []
  },
  {
    id: "nbc-cbs-fox-broadcast",
    owner: "US Broadcast Networks",
    title: "Major Broadcast TV Properties",
    aliases: ["nbc", "cbs", "fox", "abc"],
    keywords: ["broadcast network", "network tv"],
    domainHints: ["nbc.", "cbs.", "fox.", "abc."],
    visualFingerprints: []
  }
];

const HALLUCINATION_RULES = [
  {
    label: "False public-domain claim on protected IP",
    pattern: /public domain[^.]*\b(disney|pixar|marvel|star wars|moana|netflix)\b/i,
    severity: "high" as const,
    confidence: 96,
    riskImpact: 24,
    rationale:
      "Protected franchises are generally not public domain; this indicates likely fabricated legal status."
  },
  {
    label: "Unsupported legal-certainty statement",
    pattern:
      /\b(guaranteed|100%|fully|automatic(?:ally)?)\b[^.]{0,28}\b(copyright[- ]free|legal(?:ly)? safe|safe to publish)\b/i,
    severity: "high" as const,
    confidence: 90,
    riskImpact: 18,
    rationale:
      "Absolute legal certainty language without evidentiary support is a common model hallucination pattern."
  },
  {
    label: "Rights laundering via tool name",
    pattern:
      /\b(licensed|copyright cleared|rights cleared)\b[^.]{0,28}\b(by|through)\b[^.]{0,24}\b(chatgpt|openai|midjourney|dall[- ]?e|stable diffusion)\b/i,
    severity: "high" as const,
    confidence: 88,
    riskImpact: 16,
    rationale:
      "Model/tool usage does not automatically grant third-party IP rights; this claim is likely unreliable."
  },
  {
    label: "Contradictory ownership language",
    pattern:
      /\b(my original|owned by me|client-owned)\b[^.]{0,40}\b(in the style of|exactly like|same as|cop(y|ied)|recreate)\b/i,
    severity: "medium" as const,
    confidence: 82,
    riskImpact: 10,
    rationale:
      "Stating ownership while also requesting near-replication of protected expression indicates inconsistent provenance."
  }
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: "Step 01",
    title: "Ingest + Fingerprint",
    description:
      "Prompt, uploaded media, and URL signals are stitched into a deterministic forensic case record.",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80"
  },
  {
    step: "Step 02",
    title: "Cross-Source Similarity",
    description:
      "Text, visual metadata, and known rights-holder markers are compared for recognizable overlap across expanded catalogs.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80"
  },
  {
    step: "Step 03",
    title: "Statutory Risk Scoring",
    description:
      "Signals are mapped into explainable legal risk states with transparent evidence and rationale.",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80"
  },
  {
    step: "Step 04",
    title: "Attorney-Ready Report",
    description:
      "The decision, findings, and forensic trace data include multi-URL internet corroboration for downstream review.",
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80"
  }
] as const;

const COMPLIANCE_PANELS = [
  {
    title: "Compliance Lens",
    subtitle: "Built for agency and counsel workflows.",
    body:
      "Flags high-risk imitation language, major franchise markers, provenance gaps, and metadata anomalies before publication.",
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80"
  },
  {
    title: "Forensic Research",
    subtitle: "Evidence-first risk reasoning.",
    body:
      "Combines prompt analysis, source marker extraction, EXIF parsing, cryptographic signatures, and website signal inspection.",
    image:
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=80"
  }
] as const;

const UNDER_THE_HOOD = [
  {
    title: "Forensic Intelligence Core",
    body:
      "A hybrid deterministic + machine-learning risk engine fuses linguistic intent, source markers, provenance integrity, and similarity signals into one defensible risk profile."
  },
  {
    title: "Multi-Source Evidence Fusion",
    body:
      "Prompt semantics, file hashes, EXIF traces, MIME checks, perceptual fingerprints, and multi-URL web evidence are cross-referenced before any verdict is issued."
  },
  {
    title: "Explainable Release Signal",
    body:
      "Every output includes an explicit risk state, score, and evidence chain so legal teams can audit the reasoning, not just accept a black-box answer."
  }
] as const;

function scrollToElementWithEase(target: HTMLElement, offset = 0) {
  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY + offset;
  const distance = targetY - startY;
  const duration = Math.min(1250, Math.max(650, Math.abs(distance) * 0.8));
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    window.scrollTo({ top: startY + distance * eased, left: 0, behavior: "auto" });

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

export function LandingPage() {
  const [latestAudit, setLatestAudit] = useState<AuditRecord | null>(null);
  const [rightsCatalog, setRightsCatalog] = useState<RightsCatalogEntry[]>(DEFAULT_RIGHTS_CATALOG);
  const [catalogVersion, setCatalogVersion] = useState(RIGHTS_CATALOG_VERSION);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const navEntry = performance.getEntriesByType?.("navigation")?.[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload = navEntry?.type === "reload";
    if (!isReload) {
      return;
    }

    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadCatalog = async () => {
      try {
        const response = await fetch("/rights-catalog.json", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const document = (await response.json()) as RightsCatalogDocument;
        const normalized = normalizeCatalogEntries(document.entries);
        if (!normalized.length) {
          return;
        }

        if (!isCancelled) {
          const merged = mergeCatalogs(DEFAULT_RIGHTS_CATALOG, normalized);
          setRightsCatalog(merged);
          if (typeof document.version === "string" && document.version.trim()) {
            setCatalogVersion(document.version.trim());
          }
        }
      } catch {
        // Continue with built-in catalog when external catalog is unavailable.
      }
    };

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-build]"));
    if (!elements.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add("is-built"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const target = entry.target as HTMLElement;
          const delay = Number(target.dataset.buildDelay ?? "0");
          window.setTimeout(() => target.classList.add("is-built"), delay);
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    elements.forEach((element) => {
      if (!element.classList.contains("is-built")) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [latestAudit?.id]);

  useEffect(() => {
    if (!shareStatus) {
      return;
    }
    const timer = window.setTimeout(() => setShareStatus(""), 2200);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);

  async function onSubmitAudit(payload: QuickAuditPayload) {
    const nextAudit = await evaluateAudit(payload, rightsCatalog);
    setLatestAudit(nextAudit);
  }

  function onAnchorClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    scrollToElementWithEase(target, -10);
    history.replaceState(null, "", `#${id}`);
  }

  function onExportAuditImage() {
    if (!latestAudit) {
      return;
    }
    const saved = exportAuditAsImage(latestAudit);
    setShareStatus(saved ? "Saved PNG snapshot." : "Export unavailable in this browser.");
  }

  return (
    <main className="relative overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="hero-noise h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-8 md:px-8 md:pt-10">
        <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
          <div className="text-sm font-medium tracking-tight text-white">Aegis AI</div>
          <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.16em] text-neutral-400 md:flex">
            <a
              href="#review-desk"
              onClick={(event) => onAnchorClick(event, "review-desk")}
              className="transition hover:text-white"
            >
              Result
            </a>
            <a
              href="#how-it-works"
              onClick={(event) => onAnchorClick(event, "how-it-works")}
              className="transition hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#compliance"
              onClick={(event) => onAnchorClick(event, "compliance")}
              className="transition hover:text-white"
            >
              Compliance
            </a>
          </nav>
        </header>

        <section className="relative scroll-build" data-build data-build-delay="0">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 pb-8 pt-10 backdrop-blur-md md:px-10 md:pb-10 md:pt-12">
            <h1 className="text-center text-5xl font-semibold tracking-tight md:text-7xl">
              <span className="text-neutral-300">AI Media</span>{" "}
              <span className="text-white">Copyright Audit</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-neutral-400 md:text-base">
              Submit media or a website URL and get one clear verdict: safe to use or risky, with
              detailed forensic evidence.
            </p>
            <QuickAuditPrompt onSubmitAudit={onSubmitAudit} />
          </div>
        </section>

        <section
          id="review-desk"
          className={
            latestAudit
              ? "mt-8 scroll-build"
              : "max-h-0 overflow-hidden opacity-0 pointer-events-none"
          }
          data-build
          data-build-delay="80"
        >
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  Audit Result
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  One decision first. Detailed evidence second.
                </p>
              </div>
              {latestAudit ? (
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <button
                    type="button"
                    onClick={onExportAuditImage}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white transition hover:bg-white/20"
                  >
                    Export PNG
                  </button>
                  {shareStatus ? <p className="text-xs text-cyan-200/80">{shareStatus}</p> : null}
                </div>
              ) : null}
            </div>

            {latestAudit ? (
              <>
                <div className={`mt-5 rounded-xl border p-4 ${riskPanelClass(latestAudit.riskTier)}`}>
                  <p className="text-xs uppercase tracking-[0.18em]">Verdict</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-white">
                    {latestAudit.riskTier === "low" ? "Safe to use" : "Risky"}
                  </p>
                  <p className="mt-2 text-sm text-neutral-300">
                    {latestAudit.decision} · Risk score {latestAudit.riskScore}/99
                  </p>
                  <p className="mt-2 text-sm text-neutral-300">{latestAudit.summary}</p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">Detailed Feedback</p>
                    <ul className="mt-3 space-y-2">
                      {latestAudit.findings.map((item) => (
                        <li key={item} className="text-sm text-neutral-300">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">Source Markers</p>
                    {latestAudit.sourceMarkers.length ? (
                      <div className="mt-3 space-y-2">
                        {latestAudit.sourceMarkers.map((marker) => (
                          <div
                            key={`${latestAudit.id}-${marker.source}-${marker.evidence}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-sm text-white">{toTitleCase(marker.source)}</p>
                            <p className="mt-1 text-xs text-neutral-400">Evidence: "{marker.evidence}"</p>
                            <p className="mt-1 text-xs text-neutral-400">
                              Confidence {marker.confidence}% · Impact +{marker.riskImpact}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">No explicit copyright markers found.</p>
                    )}
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Rights Catalog Matches
                    </p>
                    {latestAudit.catalogMatches.length ? (
                      <div className="mt-3 space-y-2">
                        {latestAudit.catalogMatches.slice(0, 6).map((match) => (
                          <div
                            key={`${latestAudit.id}-${match.entryId}-${match.method}-${match.evidence}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-sm text-white">
                              {match.owner} · {match.title}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              Method: {match.method} · Confidence {match.confidence}%
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">Evidence: {match.evidence}</p>
                            <p className="mt-1 text-xs text-neutral-400">Impact +{match.riskImpact}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">
                        No direct matches from the current rights catalog snapshot.
                      </p>
                    )}
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">Hallucination Checks</p>
                    {latestAudit.hallucinationSignals.length ? (
                      <div className="mt-3 space-y-2">
                        {latestAudit.hallucinationSignals.map((signal) => (
                          <div
                            key={`${latestAudit.id}-${signal.label}-${signal.evidence}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-sm text-white">{signal.label}</p>
                            <p className="mt-1 text-xs text-neutral-400">Evidence: "{signal.evidence}"</p>
                            <p className="mt-1 text-xs text-neutral-400">
                              Severity {signal.severity} · Confidence {signal.confidence}% · Impact +{signal.riskImpact}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">
                        No obvious legal-hallucination patterns detected in submitted text.
                      </p>
                    )}
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">
                      Deep Correlation Layer
                    </p>
                    {latestAudit.secondarySignals.length ? (
                      <div className="mt-3 space-y-2">
                        {latestAudit.secondarySignals.map((signal) => (
                          <div
                            key={`${latestAudit.id}-${signal.label}-${signal.evidence}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3"
                          >
                            <p className="text-sm text-white">{signal.label}</p>
                            <p className="mt-1 text-xs text-neutral-400">Evidence: {signal.evidence}</p>
                            <p className="mt-1 text-xs text-neutral-400">
                              Impact +{signal.riskImpact} · {signal.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-neutral-400">
                        No amplified multi-signal correlation risk detected in second pass.
                      </p>
                    )}
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">ML Risk Model</p>
                    <div className="mt-3 space-y-2 text-sm text-neutral-300">
                      <p>
                        Model{" "}
                        <span className="text-white">{latestAudit.mlAssessment.modelVersion}</span>
                      </p>
                      <p>
                        Infringement likelihood{" "}
                        <span className="text-white">
                          {Math.round(latestAudit.mlAssessment.probabilityInfringement * 100)}%
                        </span>
                      </p>
                      <p>
                        Confidence{" "}
                        <span className="text-white">{latestAudit.mlAssessment.confidence}%</span>
                      </p>
                      <p>
                        Classification{" "}
                        <span className="text-white">
                          {latestAudit.mlAssessment.classification.toUpperCase()}
                        </span>
                      </p>
                      <p>
                        Top signals{" "}
                        <span className="text-white">
                          {latestAudit.mlAssessment.topSignals.join(" · ") || "none"}
                        </span>
                      </p>
                    </div>
                  </article>

                  <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-widest text-neutral-500">Forensics</p>
                    <div className="mt-3 space-y-2 text-sm text-neutral-300">
                      <p>
                        MIME <span className="text-white">{latestAudit.sourceData.mimeType}</span>
                      </p>
                      <p>
                        Extension <span className="text-white">{latestAudit.sourceData.extension || "unknown"}</span>
                      </p>
                      <p>
                        Size <span className="text-white">{formatBytes(latestAudit.sourceData.sizeBytes)}</span>
                      </p>
                      <p>
                        Integrity{" "}
                        <span
                          className={
                            latestAudit.sourceData.mimeExtensionMismatch
                              ? "text-red-200"
                              : "text-emerald-200"
                          }
                        >
                          {latestAudit.sourceData.mimeExtensionMismatch
                            ? "MIME/extension mismatch"
                            : "MIME and extension consistent"}
                        </span>
                      </p>
                      {latestAudit.websiteForensicsList.length ? (
                        <>
                          <p>
                            URLs checked{" "}
                            <span className="text-white">{latestAudit.websiteForensicsList.length}</span>
                          </p>
                          <p>
                            URL hosts{" "}
                            <span className="text-white">
                              {latestAudit.websiteForensicsList
                                .map((entry) => entry.hostname)
                                .filter(Boolean)
                                .slice(0, 3)
                                .join(" · ") || "unknown"}
                            </span>
                          </p>
                        </>
                      ) : null}
                      {latestAudit.exifEntries.length ? (
                        <p>
                          EXIF sample{" "}
                          <span className="text-white">
                            {latestAudit.exifEntries
                              .slice(0, 2)
                              .map((entry) => `${entry.key}: ${entry.value}`)
                              .join(" · ")}
                          </span>
                        </p>
                      ) : (
                        <p>
                          EXIF sample <span className="text-neutral-500">none found</span>
                        </p>
                      )}
                      <p>
                        Fingerprints{" "}
                        <span className="text-white">
                          {latestAudit.mediaFingerprints.length} extracted
                        </span>
                      </p>
                      <p>
                        Catalog scope{" "}
                        <span className="text-white">{rightsCatalog.length} rights clusters</span>
                      </p>
                    </div>
                  </article>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mt-20 scroll-build"
          data-build
          data-build-delay="120"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 max-w-2xl text-neutral-400">
              A multi-stage forensic pipeline for legal screening and release decisions.
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Under The Hood</p>
              <p className="mt-2 max-w-3xl text-sm text-neutral-400">
                Built for agency and counsel workflows, this stack is engineered to surface high-confidence
                rights risk early, with transparent evidence at each stage.
              </p>
              <p className="mt-2 max-w-3xl text-sm text-neutral-500">
                It is a decision-support system for legal triage and escalation, not legal advice.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                Rights catalog snapshot: {catalogVersion} · {rightsCatalog.length} clusters
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {UNDER_THE_HOOD.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-black/25 p-4 scroll-build"
                  data-build
                  data-build-delay={String(130 + index * 70)}
                >
                  <h3 className="text-lg tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{item.body}</p>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Process Flow</p>
              <p className="mt-2 text-sm text-neutral-400">
                A readable step-by-step view of what happens from submission to verdict.
              </p>
              <div className="mt-5 max-w-4xl space-y-8">
                {HOW_IT_WORKS_STEPS.map((item, index) => (
                  <article
                    key={item.step}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-4 md:p-6 scroll-build"
                    data-build
                    data-build-delay={String(150 + index * 70)}
                  >
                    <div className="flex flex-col gap-4 md:gap-6 sm:flex-row sm:items-center">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-40 w-full shrink-0 rounded-xl border border-white/10 object-cover sm:h-40 sm:w-56 md:h-44 md:w-72"
                      />
                      <div className="min-w-0 sm:pr-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{item.step}</p>
                        <h3 className="mt-1 text-xl tracking-tight text-white">{item.title}</h3>
                        <p className="mt-2 max-w-xl text-sm text-neutral-400">{item.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="compliance" className="mt-20 scroll-build" data-build data-build-delay="130">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Compliance + Research
            </h2>
            <p className="mt-3 max-w-2xl text-neutral-400">
              Purpose-built for internal agency review and attorney escalation workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {COMPLIANCE_PANELS.map((panel, index) => (
              <article
                key={panel.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md scroll-build"
                data-build
                data-build-delay={String(170 + index * 80)}
              >
                <img
                  src={panel.image}
                  alt={panel.title}
                  className="h-52 w-full rounded-xl border border-white/10 object-cover"
                />
                <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {panel.subtitle}
                </p>
                <h3 className="mt-1 text-2xl tracking-tight text-white">{panel.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{panel.body}</p>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

async function evaluateAudit(
  payload: QuickAuditPayload,
  rightsCatalog: RightsCatalogEntry[]
): Promise<AuditRecord> {
  try {
    const targetUrls = normalizeTargetUrls(payload.targetUrls, payload.targetUrl);
    const websiteForensicsList = (
      await Promise.all(targetUrls.map((url) => analyzeWebsiteForensics(url)))
    ).filter((entry): entry is WebsiteForensics => Boolean(entry));
    const websiteForensics = websiteForensicsList[0] ?? null;
    const websiteCorpus = websiteForensicsList
      .map((entry) =>
        [
          entry.normalizedUrl,
          entry.hostname,
          entry.title,
          entry.description,
          entry.copyrightMarkers.join(" ")
        ]
          .join(" ")
          .trim()
      )
      .join(" ")
      .trim();
    const rawCorpus = `${payload.prompt} ${payload.fileName ?? ""} ${targetUrls.join(" ")} ${websiteCorpus}`.trim();
    const corpus = rawCorpus.toLowerCase();
    const forensic = await analyzeMediaForensics(payload.file, payload.fileName);
    const catalogMatches = buildCatalogMatches({
      catalog: rightsCatalog,
      rawCorpus,
      fileName: payload.fileName,
      websiteHost: websiteForensicsList.map((entry) => entry.hostname).join(" "),
      mediaFingerprints: forensic.mediaFingerprints
    });

    const highHits = HIGH_RISK_PHRASES.filter((term) => corpus.includes(term));
    const mediumHits = MEDIUM_RISK_PHRASES.filter((term) => corpus.includes(term));
    const sourceHits = PROTECTED_SOURCES.filter((term) => corpus.includes(term));
    const criticalHits = CRITICAL_SOURCE_TERMS.filter((term) => corpus.includes(term));
    const sourceMarkers = buildSourceMarkers(rawCorpus, sourceHits, criticalHits);
    const hallucinationSignals = buildHallucinationSignals(rawCorpus);
    const hasRightsEvidence = RIGHTS_EVIDENCE_TERMS.some((term) => corpus.includes(term));
    const hasAssetInput = Boolean(payload.file || targetUrls.length);
    const catalogDomainHints = collectCatalogDomainHints(rightsCatalog);
    const highConfidenceCatalogHits = catalogMatches.filter((match) => match.confidence >= 85).length;
    const hasVisualFingerprintCollision = catalogMatches.some(
      (match) => match.method === "visual-fingerprint" && match.confidence >= 86
    );
    const websiteMarkersCount = websiteForensicsList.reduce(
      (sum, entry) => sum + entry.copyrightMarkers.length,
      0
    );
    const websiteUnreachableCount = websiteForensicsList.filter(
      (entry) => entry.status === "unreachable"
    ).length;
    const websiteInvalidCount = websiteForensicsList.filter(
      (entry) => entry.status === "invalid_url"
    ).length;
    const websiteFetchedCount = websiteForensicsList.filter(
      (entry) => entry.status === "fetched"
    ).length;
    const hasDerivativeSignals = Boolean(
      highHits.length ||
        mediumHits.length ||
        sourceHits.length ||
        criticalHits.length ||
        catalogMatches.length ||
        hallucinationSignals.length
    );
    const hasOriginalCaptureSignals = hasStrongOriginalCaptureSignals(
      payload.file,
      forensic.exifEntries,
      forensic.sourceData.mimeExtensionMismatch
    );

    const findings: string[] = [];
    let score = 22;

    if (highHits.length) {
      score += highHits.length * 18;
      findings.push(`High-risk imitation language detected (${highHits.slice(0, 3).join(", ")}).`);
    }

    if (mediumHits.length) {
      score += mediumHits.length * 10;
      findings.push(`Potential derivative intent markers detected (${mediumHits.slice(0, 3).join(", ")}).`);
    }

    if (sourceHits.length) {
      score += sourceHits.length * 14;
      findings.push(`Protected source references detected (${sourceHits.slice(0, 4).join(", ")}).`);
    }

    if (catalogMatches.length) {
      const catalogRisk = catalogMatches.reduce((sum, match) => sum + match.riskImpact, 0);
      score += Math.min(42, catalogRisk);
      const uniqueCatalogOwners = Array.from(new Set(catalogMatches.map((match) => match.owner)));
      findings.push(
        `${catalogMatches.length} corroborated rights-catalog match(es) across ${uniqueCatalogOwners.length} owner cluster(s) (${uniqueCatalogOwners
          .slice(0, 4)
          .join(", ")}).`
      );

      if (hasVisualFingerprintCollision) {
        score = Math.max(score, 88);
        findings.push("Visual fingerprint collision with rights catalog; forced legal escalation.");
      }

      if (highConfidenceCatalogHits >= 2) {
        score = Math.max(score, 84);
        findings.push(
          `${highConfidenceCatalogHits} high-confidence catalog collisions found; escalating to attorney review.`
        );
      }
    }

    if (criticalHits.length) {
      score = Math.max(score, 82);
      findings.push(
        `Critical copyrighted IP marker detected (${criticalHits.slice(0, 3).join(", ")}). Forced legal escalation.`
      );
    }

    if (hallucinationSignals.length) {
      const addedRisk = hallucinationSignals.reduce((sum, signal) => sum + signal.riskImpact, 0);
      score += addedRisk;
      findings.push(
        `${hallucinationSignals.length} obvious legal-hallucination signal(s) detected in submission text.`
      );
    }

    if (payload.distributionIntent === "marketing") {
      score += 8;
      findings.push("Public-facing marketing distribution increases legal exposure.");
    }

    if (payload.distributionIntent === "broadcast") {
      score += 12;
      findings.push("Broadcast distribution raises release threshold.");
    }

    if (payload.urgencyLevel === "priority") {
      score += 4;
    }

    if (payload.urgencyLevel === "expedited") {
      score += 7;
      findings.push("Expedited timeline may reduce manual legal verification depth.");
    }

    if (!payload.fileName && !targetUrls.length) {
      score += 6;
      findings.push("No asset metadata attached for source provenance correlation.");
    }

    if (websiteForensicsList.length) {
      let websiteRisk = 0;
      const websiteFindings: string[] = [];

      for (const websiteSignal of websiteForensicsList) {
        if (websiteSignal.status === "invalid_url") {
          websiteRisk += 8;
          websiteFindings.push("At least one submitted URL is invalid and could not be verified.");
          continue;
        }

        if (websiteSignal.status === "unreachable") {
          websiteRisk += 6;
          websiteFindings.push(
            `Website source was unreachable (${websiteSignal.hostname || websiteSignal.normalizedUrl}).`
          );
          continue;
        }

        websiteFindings.push(
          `Website evidence fetched from ${websiteSignal.hostname || websiteSignal.normalizedUrl}.`
        );
        if (websiteSignal.copyrightMarkers.length) {
          websiteRisk += Math.min(8, websiteSignal.copyrightMarkers.length * 2);
          websiteFindings.push(
            `Website markers found on ${websiteSignal.hostname || "source"} (${websiteSignal.copyrightMarkers
              .slice(0, 3)
              .join(", ")}).`
          );
        }
        if (websiteSignal.httpStatus && websiteSignal.httpStatus >= 400) {
          websiteRisk += 4;
          websiteFindings.push(
            `Website responded with HTTP ${websiteSignal.httpStatus}; evidence quality may be incomplete.`
          );
        }

        if (
          websiteSignal.hostname &&
          [...PROTECTED_DOMAIN_HINTS, ...catalogDomainHints].some((hint) =>
            websiteSignal.hostname.includes(hint)
          )
        ) {
          score = Math.max(score, 80);
          websiteFindings.push(
            `URL host appears associated with a major rightsholder (${websiteSignal.hostname}); forced legal escalation.`
          );
        }
      }

      score += Math.min(26, websiteRisk);
      findings.push(...websiteFindings.slice(0, 6));
      if (websiteForensicsList.length > 1) {
        findings.push(`Internet corroboration sweep completed across ${websiteForensicsList.length} submitted URLs.`);
      }
    }

    if (forensic.sourceData.mimeExtensionMismatch) {
      score += 12;
      findings.push("MIME type does not match file extension; possible metadata tamper or renamed asset.");
    }

    if (payload.file?.type.startsWith("image/") && !forensic.exifEntries.length) {
      score += 8;
      findings.push("No EXIF capture metadata present; source provenance cannot be independently validated.");
    }

    if (payload.file && !forensic.mediaFingerprints.length) {
      score += 8;
      findings.push("No perceptual fingerprints extracted from media; similarity confidence is reduced.");
    }

    const exifSoftware = forensic.exifEntries.find((entry) => entry.key === "Software")?.value ?? "";
    if (/\b(midjourney|stable diffusion|dall[- ]?e|firefly|runway)\b/i.test(exifSoftware)) {
      score += 5;
      findings.push("EXIF software tag indicates generative pipeline; rights provenance must be verified.");
    }

    if (hasOriginalCaptureSignals && !hasDerivativeSignals) {
      score = Math.max(8, score - 8);
      findings.push("Camera-origin EXIF markers indicate likely first-party capture.");
    }

    const secondarySignals = buildSecondaryAnalysisSignals({
      highHits,
      mediumHits,
      sourceHits,
      hasRightsEvidence,
      hallucinationSignals,
      mimeExtensionMismatch: forensic.sourceData.mimeExtensionMismatch,
      missingExifImage: Boolean(payload.file?.type.startsWith("image/") && !forensic.exifEntries.length),
      websiteForensics,
      catalogMatchesCount: catalogMatches.length
    });
    if (secondarySignals.length) {
      const extraRisk = secondarySignals.reduce((sum, signal) => sum + signal.riskImpact, 0);
      score += extraRisk;
      findings.push(
        `${secondarySignals.length} second-pass multi-signal correlation(s) increased risk confidence.`
      );
    }

    if (!hasRightsEvidence) {
      if (hasDerivativeSignals) {
        score = Math.max(score, 56);
        findings.push("No explicit rights basis provided while derivative/IP signals are present.");
      } else if (hasOriginalCaptureSignals) {
        findings.push(
          "Ownership text is missing, but first-party capture signals were detected. Add rights notes for records."
        );
      } else {
        score = Math.max(score, hasAssetInput ? 38 : 46);
        findings.push("No explicit rights basis provided; add ownership/licensing context for defensibility.");
      }
    } else {
      findings.push("Rights-basis language detected, but independent verification is still required.");
    }

    const mlAssessment = inferMlRiskAssessment({
      highHitsCount: highHits.length,
      mediumHitsCount: mediumHits.length,
      sourceHitsCount: sourceHits.length,
      criticalHitsCount: criticalHits.length,
      catalogMatchesCount: catalogMatches.length,
      highConfidenceCatalogHits,
      visualFingerprintCollision: hasVisualFingerprintCollision,
      hallucinationSignalsCount: hallucinationSignals.length,
      secondarySignalsCount: secondarySignals.length,
      websiteCheckedCount: websiteForensicsList.length,
      websiteFetchedCount,
      websiteUnreachableCount,
      websiteInvalidCount,
      websiteMarkersCount,
      mimeExtensionMismatch: forensic.sourceData.mimeExtensionMismatch,
      missingExifImage: Boolean(payload.file?.type.startsWith("image/") && !forensic.exifEntries.length),
      missingMediaFingerprint: Boolean(payload.file && !forensic.mediaFingerprints.length),
      hasRightsEvidence,
      hasOriginalCaptureSignals,
      isMarketingOrBroadcast:
        payload.distributionIntent === "marketing" || payload.distributionIntent === "broadcast",
      isExpedited: payload.urgencyLevel === "expedited"
    });

    const mlScore = Math.round(mlAssessment.probabilityInfringement * 99);
    score = Math.round(score * 0.7 + mlScore * 0.3);
    findings.push(
      `ML model estimate: ${Math.round(
        mlAssessment.probabilityInfringement * 100
      )}% infringement likelihood (${mlAssessment.classification.toUpperCase()} band, confidence ${
        mlAssessment.confidence
      }%).`
    );

    if (hasVisualFingerprintCollision) {
      score = Math.max(score, 88);
    }
    if (criticalHits.length) {
      score = Math.max(score, 82);
    }
    if (highConfidenceCatalogHits >= 2) {
      score = Math.max(score, 84);
    }
    if (!hasRightsEvidence && hasDerivativeSignals) {
      score = Math.max(score, 56);
    }

    score = Math.max(1, Math.min(99, score));

    const riskTier: RiskTier = score >= 72 ? "high" : score >= 45 ? "medium" : "low";

    let decision = "Conditional Proceed";
    let summary =
      "No immediate blockers detected, but retain full logs and complete legal sign-off before release.";

    if (riskTier === "medium") {
      decision = "Legal Review Required";
      summary =
        "Potential infringement or documentation gaps detected. Hold release pending legal review and remediation.";
    }

    if (riskTier === "high") {
      decision = "Escalation Recommended";
      summary =
        "Significant source-similarity and/or imitation signals detected. Do not publish until counsel clears.";
    }

    return {
      id: createAuditId(),
      prompt: payload.prompt,
      fileName: payload.fileName,
      targetUrl: payload.targetUrl,
      distributionIntent: payload.distributionIntent,
      urgencyLevel: payload.urgencyLevel,
      riskScore: score,
      riskTier,
      decision,
      summary,
      findings,
      sourceData: forensic.sourceData,
      websiteForensics,
      websiteForensicsList,
      mlAssessment,
      exifEntries: forensic.exifEntries,
      mediaFingerprints: forensic.mediaFingerprints,
      catalogMatches,
      hallucinationSignals,
      secondarySignals,
      sourceMarkers,
      matchedSources: Array.from(
        new Set([...sourceHits, ...catalogMatches.map((match) => match.owner.toLowerCase())])
      ),
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      id: createAuditId(),
      prompt: payload.prompt,
      fileName: payload.fileName,
      targetUrl: payload.targetUrl,
      distributionIntent: payload.distributionIntent,
      urgencyLevel: payload.urgencyLevel,
      riskScore: 72,
      riskTier: "high",
      decision: "Escalation Recommended",
      summary: "Audit pipeline error detected. Treat as risky until rerun completes successfully.",
      findings: [
        "Forensic runtime error prevented a complete analysis.",
        error instanceof Error ? `Error detail: ${error.message}` : "Error detail: unknown runtime error."
      ],
      sourceData: {
        mimeType: "unknown",
        extension: extensionFromName(payload.fileName),
        sizeBytes: payload.file?.size ?? 0,
        lastModified: "unknown",
        sha256: "unavailable",
        mimeExtensionMismatch: false
      },
      websiteForensics: payload.targetUrl
        ? {
            requestedUrl: payload.targetUrl,
            normalizedUrl: payload.targetUrl,
            hostname: hostnameFromUrl(payload.targetUrl),
            status: "unreachable",
            statusNote: "runtime_error",
            httpStatus: null,
            contentType: "unknown",
            title: "",
            description: "",
            sha256: "unavailable",
            copyrightMarkers: [],
            fetchedAt: new Date().toISOString()
          }
        : null,
      websiteForensicsList: payload.targetUrl
        ? [
            {
              requestedUrl: payload.targetUrl,
              normalizedUrl: payload.targetUrl,
              hostname: hostnameFromUrl(payload.targetUrl),
              status: "unreachable",
              statusNote: "runtime_error",
              httpStatus: null,
              contentType: "unknown",
              title: "",
              description: "",
              sha256: "unavailable",
              copyrightMarkers: [],
              fetchedAt: new Date().toISOString()
            }
          ]
        : [],
      mlAssessment: {
        modelVersion: ML_MODEL_VERSION,
        probabilityInfringement: 0.82,
        confidence: 86,
        classification: "high",
        topSignals: ["runtime_error", "forensic_incomplete", "conservative_fallback"]
      },
      exifEntries: [],
      mediaFingerprints: [],
      catalogMatches: [],
      hallucinationSignals: [],
      secondarySignals: [],
      sourceMarkers: [],
      matchedSources: [],
      createdAt: new Date().toISOString()
    };
  }
}

function createAuditId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function riskPanelClass(riskTier: RiskTier) {
  if (riskTier === "high") {
    return "border-red-400/25 bg-red-500/10 text-red-200";
  }

  if (riskTier === "medium") {
    return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
}

function buildSourceMarkers(
  rawCorpus: string,
  sourceHits: string[],
  criticalHits: string[]
): SourceMarker[] {
  const criticalSet = new Set(criticalHits);
  return sourceHits.map((source) => {
    const isCritical = criticalSet.has(source);
    return {
      source,
      matchType: "exact text",
      evidence: extractEvidenceSnippet(rawCorpus, source),
      confidence: isCritical ? 97 : 84,
      riskImpact: isCritical ? 28 : 14,
      legalRationale: isCritical
        ? "Direct reference to a flagship protected property indicates high infringement exposure."
        : "Recognized rightsholder/IP marker increases likelihood of derivative use risk.",
      action: isCritical
        ? "Immediate legal escalation and release hold."
        : "Require rights documentation or remove marker before release."
    };
  });
}

function extractEvidenceSnippet(rawCorpus: string, term: string) {
  const normalized = rawCorpus.toLowerCase();
  const idx = normalized.indexOf(term.toLowerCase());
  if (idx < 0) {
    return term;
  }

  const start = Math.max(0, idx - 18);
  const end = Math.min(rawCorpus.length, idx + term.length + 18);
  return rawCorpus.slice(start, end).trim().replace(/\s+/g, " ");
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function buildHallucinationSignals(rawCorpus: string): HallucinationSignal[] {
  return HALLUCINATION_RULES.filter((rule) => rule.pattern.test(rawCorpus)).map((rule) => ({
    label: rule.label,
    evidence: extractMatch(rawCorpus, rule.pattern) ?? rule.label,
    severity: rule.severity,
    confidence: rule.confidence,
    riskImpact: rule.riskImpact,
    rationale: rule.rationale
  }));
}

function hasStrongOriginalCaptureSignals(
  file: File | null,
  exifEntries: ExifEntry[],
  mimeExtensionMismatch: boolean
) {
  if (!file || !file.type.startsWith("image/") || mimeExtensionMismatch || !exifEntries.length) {
    return false;
  }

  const make = exifEntries.find((entry) => entry.key.toLowerCase() === "make")?.value ?? "";
  const model = exifEntries.find((entry) => entry.key.toLowerCase() === "model")?.value ?? "";
  const dateTimeOriginal =
    exifEntries.find((entry) => entry.key.toLowerCase() === "datetimeoriginal")?.value ?? "";
  const dateTime = exifEntries.find((entry) => entry.key.toLowerCase() === "datetime")?.value ?? "";
  const software = exifEntries.find((entry) => entry.key.toLowerCase() === "software")?.value ?? "";

  const hasCameraIdentity = Boolean(make.trim() || model.trim());
  const hasCaptureTime = Boolean(dateTimeOriginal.trim() || dateTime.trim());
  const generativeSoftwarePattern =
    /\b(midjourney|stable diffusion|dall[- ]?e|firefly|runway|comfyui|automatic1111|sdxl)\b/i;

  return hasCameraIdentity && hasCaptureTime && !generativeSoftwarePattern.test(software);
}

type MlModelFeatures = {
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
};

function inferMlRiskAssessment(features: MlModelFeatures): MlAssessment {
  const normalizeCount = (value: number, max: number) => Math.min(1, Math.max(0, value) / max);
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

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
    websiteFetched: normalizeCount(features.websiteFetchedCount, 4),
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
    { label: "first-party-capture", value: features.hasOriginalCaptureSignals ? -0.88 : 0 },
    { label: "web-fetched-evidence", value: features.websiteFetchedCount > 0 ? -0.22 : 0 }
  ];

  let logit = -1.92;
  for (const contribution of contributions) {
    logit += contribution.value;
  }

  const probability = clamp01(1 / (1 + Math.exp(-logit)));
  const confidence = Math.max(56, Math.min(99, Math.round(56 + Math.abs(probability - 0.5) * 88)));
  const classification: RiskTier = probability >= 0.72 ? "high" : probability >= 0.45 ? "medium" : "low";
  const topSignals = contributions
    .filter((item) => Math.abs(item.value) >= 0.14)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4)
    .map((item) => `${item.label}:${item.value >= 0 ? "+" : ""}${item.value.toFixed(2)}`);

  return {
    modelVersion: ML_MODEL_VERSION,
    probabilityInfringement: probability,
    confidence,
    classification,
    topSignals
  };
}

type SecondaryAnalysisInput = {
  highHits: string[];
  mediumHits: string[];
  sourceHits: string[];
  hasRightsEvidence: boolean;
  hallucinationSignals: HallucinationSignal[];
  mimeExtensionMismatch: boolean;
  missingExifImage: boolean;
  websiteForensics: WebsiteForensics | null;
  catalogMatchesCount: number;
};

function buildSecondaryAnalysisSignals(input: SecondaryAnalysisInput): SecondaryAnalysisSignal[] {
  const signals: SecondaryAnalysisSignal[] = [];

  if (input.highHits.length && input.sourceHits.length) {
    signals.push({
      label: "Imitation + protected IP convergence",
      evidence: `${input.highHits[0]} + ${input.sourceHits[0]}`,
      riskImpact: 12,
      rationale: "Style imitation language and protected source markers jointly raise infringement likelihood."
    });
  }

  if (input.sourceHits.length >= 3) {
    signals.push({
      label: "Franchise density cluster",
      evidence: input.sourceHits.slice(0, 4).join(", "),
      riskImpact: 10,
      rationale: "Multiple protected franchise hits in one submission indicate concentrated rights exposure."
    });
  }

  if (!input.hasRightsEvidence && (input.highHits.length || input.sourceHits.length)) {
    signals.push({
      label: "Rights-basis contradiction",
      evidence: "protected markers without ownership/licensing basis",
      riskImpact: 9,
      rationale: "Potentially derivative intent is present while rights documentation signals are missing."
    });
  }

  if (input.mimeExtensionMismatch && input.missingExifImage) {
    signals.push({
      label: "Forensic provenance anomaly",
      evidence: "MIME mismatch + missing EXIF",
      riskImpact: 8,
      rationale: "Combined metadata inconsistencies reduce confidence in source authenticity."
    });
  }

  if (
    input.websiteForensics?.status === "fetched" &&
    input.websiteForensics.copyrightMarkers.length >= 3
  ) {
    signals.push({
      label: "External rights footprint overlap",
      evidence: input.websiteForensics.copyrightMarkers.slice(0, 4).join(", "),
      riskImpact: 7,
      rationale: "Website evidence contains multiple rights markers that may indicate protected material context."
    });
  }

  if (
    input.hallucinationSignals.some((signal) => signal.severity === "high") &&
    (input.mediumHits.length || input.sourceHits.length)
  ) {
    signals.push({
      label: "Hallucination-amplified legal risk",
      evidence: "high-severity legal hallucination + derivative/IP markers",
      riskImpact: 8,
      rationale: "Unreliable legal claims paired with IP signals increase escalation urgency."
    });
  }

  if (input.catalogMatchesCount >= 2 && (input.highHits.length || input.sourceHits.length)) {
    signals.push({
      label: "Catalog corroboration escalation",
      evidence: `${input.catalogMatchesCount} catalog matches corroborate submitted signals`,
      riskImpact: 10,
      rationale: "Independent catalog matches reinforce infringement likelihood across multiple evidence channels."
    });
  }

  return signals;
}

function extractMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match) {
    return null;
  }

  return match[0].trim().replace(/\s+/g, " ");
}

type CatalogBuildInput = {
  catalog: RightsCatalogEntry[];
  rawCorpus: string;
  fileName: string | null;
  websiteHost: string;
  mediaFingerprints: MediaFingerprint[];
};

function buildCatalogMatches(input: CatalogBuildInput): CatalogMatch[] {
  const textCorpus = input.rawCorpus.toLowerCase();
  const filename = (input.fileName ?? "").toLowerCase();
  const host = (input.websiteHost ?? "").toLowerCase();
  const corpusTokens = tokenizeLoose(textCorpus);
  const matches: CatalogMatch[] = [];
  const seen = new Set<string>();

  for (const entry of input.catalog) {
    const aliasHit = firstMatch(entry.aliases, textCorpus);
    if (aliasHit) {
      const key = `${entry.id}:text:${aliasHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id,
          owner: entry.owner,
          title: entry.title,
          method: "text",
          evidence: aliasHit,
          confidence: 78,
          riskImpact: 10
        });
      }
    }

    const keywordHit = firstMatch(entry.keywords, textCorpus);
    if (keywordHit) {
      const key = `${entry.id}:text:${keywordHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id,
          owner: entry.owner,
          title: entry.title,
          method: "text",
          evidence: keywordHit,
          confidence: 73,
          riskImpact: 8
        });
      }
    }

    const approximateHit = firstApproximateMatch([...entry.aliases, ...entry.keywords], corpusTokens);
    if (approximateHit) {
      const key = `${entry.id}:approx:${approximateHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id,
          owner: entry.owner,
          title: entry.title,
          method: "text",
          evidence: `${approximateHit} (approximate token match)`,
          confidence: 66,
          riskImpact: 7
        });
      }
    }

    const filenameHit = firstMatch([...entry.aliases, ...entry.keywords], filename);
    if (filenameHit) {
      const key = `${entry.id}:filename:${filenameHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id,
          owner: entry.owner,
          title: entry.title,
          method: "filename",
          evidence: filenameHit,
          confidence: 84,
          riskImpact: 12
        });
      }
    }

    const domainHit = entry.domainHints.find((hint) => host.includes(hint.toLowerCase()));
    if (domainHit) {
      const key = `${entry.id}:domain:${domainHit}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          entryId: entry.id,
          owner: entry.owner,
          title: entry.title,
          method: "url-domain",
          evidence: domainHit,
          confidence: 90,
          riskImpact: 16
        });
      }
    }

    if (entry.visualFingerprints.length && input.mediaFingerprints.length) {
      let bestDistance = Number.POSITIVE_INFINITY;
      let bestFingerprint: MediaFingerprint | null = null;
      for (const mediaFp of input.mediaFingerprints) {
        for (const entryFp of entry.visualFingerprints) {
          const distance = hammingDistanceHex(mediaFp.value, entryFp);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestFingerprint = mediaFp;
          }
        }
      }
      if (bestFingerprint && Number.isFinite(bestDistance) && bestDistance <= 8) {
        const confidence = Math.max(78, 100 - bestDistance * 3);
        const key = `${entry.id}:visual:${bestFingerprint.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            entryId: entry.id,
            owner: entry.owner,
            title: entry.title,
            method: "visual-fingerprint",
            evidence: `${bestFingerprint.frameLabel} fingerprint distance ${bestDistance}`,
            confidence,
            riskImpact: 26
          });
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
    if (count >= 2) {
      continue;
    }
    ownerCounts.set(match.owner, count + 1);
    compact.push(match);
    if (compact.length >= 20) {
      break;
    }
  }

  return compact;
}

function firstMatch(candidates: string[], corpus: string) {
  const normalizedCorpus = normalizeLoose(corpus);
  for (const candidate of candidates) {
    const raw = candidate.toLowerCase().trim();
    if (!raw) {
      continue;
    }
    if (corpus.includes(raw)) {
      return candidate;
    }
    const loose = normalizeLoose(raw);
    if (loose && normalizedCorpus.includes(loose)) {
      return candidate;
    }
  }
  return null;
}

function firstApproximateMatch(candidates: string[], corpusTokens: string[]) {
  for (const candidate of candidates) {
    const normalized = normalizeLoose(candidate);
    if (!normalized || normalized.includes(" ") || normalized.length < 6) {
      continue;
    }

    for (const token of corpusTokens) {
      if (Math.abs(token.length - normalized.length) > 1) {
        continue;
      }

      const distance = levenshteinDistanceLimited(token, normalized, 1);
      if (distance <= 1) {
        return `${candidate} ~ ${token}`;
      }
    }
  }

  return null;
}

function tokenizeLoose(corpus: string) {
  return normalizeLoose(corpus)
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 120);
}

function levenshteinDistanceLimited(left: string, right: string, limit: number) {
  if (left === right) {
    return 0;
  }

  if (Math.abs(left.length - right.length) > limit) {
    return limit + 1;
  }

  const dp = new Array(right.length + 1).fill(0);
  for (let j = 0; j <= right.length; j += 1) {
    dp[j] = j;
  }

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

    if (rowMin > limit) {
      return limit + 1;
    }
  }

  return dp[right.length];
}

function normalizeLoose(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hammingDistanceHex(left: string, right: string) {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (a.length !== b.length || !a.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    const nibbleA = Number.parseInt(a[i], 16);
    const nibbleB = Number.parseInt(b[i], 16);
    if (Number.isNaN(nibbleA) || Number.isNaN(nibbleB)) {
      return Number.POSITIVE_INFINITY;
    }
    let x = nibbleA ^ nibbleB;
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}

function mergeCatalogs(
  fallbackCatalog: RightsCatalogEntry[],
  externalCatalog: RightsCatalogEntry[]
): RightsCatalogEntry[] {
  const merged = new Map<string, RightsCatalogEntry>();

  for (const entry of [...fallbackCatalog, ...externalCatalog]) {
    if (!entry.id) {
      continue;
    }
    merged.set(entry.id, entry);
  }

  return Array.from(merged.values());
}

function normalizeCatalogEntries(entries: unknown): RightsCatalogEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const normalized: RightsCatalogEntry[] = [];
  const seen = new Set<string>();

  for (const candidate of entries) {
    const parsed = normalizeCatalogEntry(candidate);
    if (!parsed || seen.has(parsed.id)) {
      continue;
    }
    seen.add(parsed.id);
    normalized.push(parsed);
  }

  return normalized;
}

function normalizeCatalogEntry(candidate: unknown): RightsCatalogEntry | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const owner = typeof candidate.owner === "string" ? candidate.owner.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  if (!id || !owner || !title) {
    return null;
  }

  return {
    id,
    owner,
    title,
    aliases: toStringArray(candidate.aliases),
    keywords: toStringArray(candidate.keywords),
    domainHints: toStringArray(candidate.domainHints),
    visualFingerprints: toStringArray(candidate.visualFingerprints)
  };
}

function collectCatalogDomainHints(catalog: RightsCatalogEntry[]) {
  const dedup = new Set<string>();
  for (const entry of catalog) {
    for (const hint of entry.domainHints) {
      const normalized = hint.trim().toLowerCase();
      if (normalized) {
        dedup.add(normalized);
      }
    }
  }
  return Array.from(dedup);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 80);
}

type UrlForensicsApiResponse = {
  requestedUrl: string;
  normalizedUrl: string;
  hostname: string;
  status: WebsiteForensics["status"];
  statusNote: string;
  httpStatus: number | null;
  contentType: string;
  title: string;
  description: string;
  sha256: string;
  copyrightMarkers: string[];
  fetchedAt: string;
};

async function analyzeWebsiteForensics(targetUrl: string | null): Promise<WebsiteForensics | null> {
  const normalizedInput = targetUrl?.trim();
  if (!normalizedInput) {
    return null;
  }

  try {
    const response = await fetch("/api/url-forensics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: normalizedInput })
    });

    if (!response.ok) {
      return {
        requestedUrl: normalizedInput,
        normalizedUrl: normalizedInput,
        hostname: hostnameFromUrl(normalizedInput),
        status: "unreachable",
        statusNote: `service_error_${response.status}`,
        httpStatus: response.status,
        contentType: "unknown",
        title: "",
        description: "",
        sha256: "unavailable",
        copyrightMarkers: [],
        fetchedAt: new Date().toISOString()
      };
    }

    const data = (await response.json()) as UrlForensicsApiResponse;
    return {
      requestedUrl: data.requestedUrl,
      normalizedUrl: data.normalizedUrl,
      hostname: data.hostname,
      status: data.status,
      statusNote: data.statusNote,
      httpStatus: data.httpStatus,
      contentType: data.contentType,
      title: data.title,
      description: data.description,
      sha256: data.sha256,
      copyrightMarkers: data.copyrightMarkers,
      fetchedAt: data.fetchedAt
    };
  } catch {
    return {
      requestedUrl: normalizedInput,
      normalizedUrl: normalizedInput,
      hostname: hostnameFromUrl(normalizedInput),
      status: "unreachable",
      statusNote: "request_failed",
      httpStatus: null,
      contentType: "unknown",
      title: "",
      description: "",
      sha256: "unavailable",
      copyrightMarkers: [],
      fetchedAt: new Date().toISOString()
    };
  }
}

function hostnameFromUrl(value: string) {
  try {
    const parsed = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function normalizeTargetUrls(targetUrls: string[] | undefined, fallbackTargetUrl: string | null) {
  const candidates = Array.isArray(targetUrls) ? targetUrls : [];
  const unique = new Set<string>();

  for (const candidate of candidates) {
    const normalized = normalizeUrlForAudit(candidate);
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
    if (unique.size >= 4) {
      break;
    }
  }

  if (!unique.size) {
    const normalizedFallback = normalizeUrlForAudit(fallbackTargetUrl);
    if (normalizedFallback) {
      unique.add(normalizedFallback);
    }
  }

  return Array.from(unique);
}

function normalizeUrlForAudit(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const input = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(input).href;
  } catch {
    return null;
  }
}

async function analyzeMediaForensics(file: File | null, fallbackName: string | null) {
  if (!file) {
    return {
      sourceData: {
        mimeType: "unknown",
        extension: extensionFromName(fallbackName),
        sizeBytes: 0,
        lastModified: "unknown",
        sha256: "unavailable",
        mimeExtensionMismatch: false
      },
      exifEntries: [] as ExifEntry[],
      mediaFingerprints: [] as MediaFingerprint[]
    };
  }

  const extension = extensionFromName(file.name);
  const mimeType = file.type || "unknown";
  const sha256 = await sha256File(file);
  const exifMap = await extractExifMap(file);
  const exifEntries = Object.entries(exifMap).map(([key, value]) => ({ key, value }));
  const mediaFingerprints = await extractPerceptualFingerprints(file);

  return {
    sourceData: {
      mimeType,
      extension,
      sizeBytes: file.size,
      lastModified: Number.isFinite(file.lastModified)
        ? new Date(file.lastModified).toISOString()
        : "unknown",
      sha256,
      mimeExtensionMismatch: detectMimeMismatch(extension, mimeType)
    },
    exifEntries,
    mediaFingerprints
  };
}

async function extractPerceptualFingerprints(file: File): Promise<MediaFingerprint[]> {
  try {
    if (file.type.startsWith("image/")) {
      const hash = await computeImageDHash(file);
      if (!hash) {
        return [];
      }
      return [
        {
          kind: "image-dhash",
          value: hash,
          frameLabel: "image-main"
        }
      ];
    }

    if (file.type.startsWith("video/")) {
      return await computeVideoFrameDHashes(file);
    }
  } catch {
    return [];
  }

  return [];
}

async function computeImageDHash(file: File): Promise<string | null> {
  if (typeof createImageBitmap === "undefined") {
    return null;
  }

  const bitmap = await createImageBitmap(file);
  try {
    return dHashFromImageSource(bitmap, bitmap.width, bitmap.height);
  } finally {
    if ("close" in bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
  }
}

async function computeVideoFrameDHashes(file: File): Promise<MediaFingerprint[]> {
  if (typeof document === "undefined") {
    return [];
  }

  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  const url = URL.createObjectURL(file);
  const fingerprints: MediaFingerprint[] = [];

  try {
    video.src = url;
    await waitForVideoEvent(video, "loadedmetadata", 4000);

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) {
      return [];
    }

    const checkpoints = [0.08, 0.3, 0.58, 0.86];
    for (const ratio of checkpoints) {
      const at = Math.min(Math.max(0.01, duration * ratio), Math.max(0.02, duration - 0.02));
      await seekVideo(video, at);
      const hash = dHashFromImageSource(video, video.videoWidth, video.videoHeight);
      if (!hash) {
        continue;
      }
      fingerprints.push({
        kind: "video-frame-dhash",
        value: hash,
        frameLabel: `video-${Math.round(ratio * 100)}%`
      });
    }
  } catch {
    return fingerprints;
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
  }

  return fingerprints;
}

function dHashFromImageSource(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
): string | null {
  if (typeof document === "undefined" || !sourceWidth || !sourceHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, 9, 8);
  const imageData = ctx.getImageData(0, 0, 9, 8);
  const data = imageData.data;
  const bits: number[] = [];

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = grayscaleAt(data, 9, x, y);
      const right = grayscaleAt(data, 9, x + 1, y);
      bits.push(left > right ? 1 : 0);
    }
  }

  return bitsToHex(bits);
}

function grayscaleAt(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const idx = (y * width + x) * 4;
  const r = data[idx] ?? 0;
  const g = data[idx + 1] ?? 0;
  const b = data[idx + 2] ?? 0;
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function bitsToHex(bits: number[]) {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += nibble.toString(16);
  }
  return hex;
}

function seekVideo(video: HTMLVideoElement, timeSec: number) {
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("video_seek_failed"));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = timeSec;
  });
}

function waitForVideoEvent(
  video: HTMLVideoElement,
  eventName: "loadedmetadata",
  timeoutMs: number
) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`video_${eventName}_timeout`));
    }, timeoutMs);

    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`video_${eventName}_error`));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener("error", onError);
    };

    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function extensionFromName(name: string | null) {
  if (!name || !name.includes(".")) {
    return "";
  }
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function detectMimeMismatch(extension: string, mimeType: string) {
  if (!extension || !mimeType || mimeType === "unknown") {
    return false;
  }

  const allowed: Record<string, string[]> = {
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
    gif: ["image/gif"],
    mp4: ["video/mp4"],
    mov: ["video/quicktime"],
    webm: ["video/webm"]
  };

  const expected = allowed[extension];
  if (!expected) {
    return false;
  }

  return !expected.includes(mimeType.toLowerCase());
}

async function sha256File(file: File) {
  if (!globalThis.crypto?.subtle) {
    return "unavailable";
  }

  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function extractExifMap(file: File): Promise<Record<string, string>> {
  if (!file.type.startsWith("image/jpeg")) {
    return {};
  }

  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return {};
  }

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;

    if ((marker & 0xff00) !== 0xff00 || offset + 2 > view.byteLength) {
      break;
    }

    const segmentLength = view.getUint16(offset);
    offset += 2;
    if (segmentLength < 2 || offset + segmentLength - 2 > view.byteLength) {
      break;
    }

    if (marker === 0xffe1 && segmentLength >= 8) {
      if (view.getUint32(offset, false) === 0x45786966) {
        return parseExifTiff(view, offset + 6);
      }
    }

    offset += segmentLength - 2;
  }

  return {};
}

function parseExifTiff(view: DataView, tiffStart: number): Record<string, string> {
  if (tiffStart + 8 > view.byteLength) {
    return {};
  }

  const byteOrder = view.getUint16(tiffStart, false);
  const littleEndian = byteOrder === 0x4949;
  if (!littleEndian && byteOrder !== 0x4d4d) {
    return {};
  }

  const readU16 = (position: number) => view.getUint16(position, littleEndian);
  const readU32 = (position: number) => view.getUint32(position, littleEndian);

  if (readU16(tiffStart + 2) !== 42) {
    return {};
  }

  const tags: Record<number, string> = {
    0x010f: "Make",
    0x0110: "Model",
    0x0131: "Software",
    0x0132: "DateTime",
    0x8827: "ISO",
    0x9003: "DateTimeOriginal",
    0x829a: "ExposureTime",
    0x829d: "FNumber",
    0x920a: "FocalLength",
    0xa002: "PixelXDimension",
    0xa003: "PixelYDimension"
  };

  const results: Record<string, string> = {};
  const visitedOffsets = new Set<number>();

  const parseIfd = (relativeOffset: number) => {
    const ifdStart = tiffStart + relativeOffset;
    if (visitedOffsets.has(ifdStart) || ifdStart + 2 > view.byteLength) {
      return;
    }
    visitedOffsets.add(ifdStart);

    const entryCount = readU16(ifdStart);
    for (let i = 0; i < entryCount; i += 1) {
      const entryOffset = ifdStart + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) {
        break;
      }

      const tag = readU16(entryOffset);
      const type = readU16(entryOffset + 2);
      const count = readU32(entryOffset + 4);
      const valueOffset = entryOffset + 8;

      if (tag === 0x8769 || tag === 0x8825) {
        const pointer = readU32(valueOffset);
        if (pointer > 0) {
          parseIfd(pointer);
        }
        continue;
      }

      const tagName = tags[tag];
      if (!tagName) {
        continue;
      }

      const parsed = readExifValue(view, tiffStart, littleEndian, type, count, valueOffset);
      if (parsed) {
        results[tagName] = parsed;
      }
    }
  };

  parseIfd(readU32(tiffStart + 4));
  return results;
}

function readExifValue(
  view: DataView,
  tiffStart: number,
  littleEndian: boolean,
  type: number,
  count: number,
  valueOffset: number
) {
  const typeSize: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    7: 1,
    9: 4,
    10: 8
  };
  const unitSize = typeSize[type];
  if (!unitSize || count < 1) {
    return null;
  }

  const totalSize = unitSize * count;
  const dataOffset =
    totalSize <= 4 ? valueOffset : tiffStart + view.getUint32(valueOffset, littleEndian);

  if (dataOffset + totalSize > view.byteLength) {
    return null;
  }

  if (type === 2) {
    const bytes = new Uint8Array(view.buffer, dataOffset, count);
    const text = new TextDecoder().decode(bytes).replace(/\0/g, "").trim();
    return text || null;
  }

  if (type === 3) {
    return String(view.getUint16(dataOffset, littleEndian));
  }

  if (type === 4) {
    return String(view.getUint32(dataOffset, littleEndian));
  }

  if (type === 5) {
    const numerator = view.getUint32(dataOffset, littleEndian);
    const denominator = view.getUint32(dataOffset + 4, littleEndian) || 1;
    return (numerator / denominator).toFixed(2);
  }

  if (type === 9) {
    return String(view.getInt32(dataOffset, littleEndian));
  }

  if (type === 10) {
    const numerator = view.getInt32(dataOffset, littleEndian);
    const denominator = view.getInt32(dataOffset + 4, littleEndian) || 1;
    return (numerator / denominator).toFixed(2);
  }

  return null;
}

function exportAuditAsImage(audit: AuditRecord) {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1060;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#04070d");
  gradient.addColorStop(1, "#0b111c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRoundedRect(ctx, 56, 56, canvas.width - 112, canvas.height - 112, 28, "rgba(255,255,255,0.05)");
  drawRoundedRect(ctx, 90, 140, canvas.width - 180, 160, 20, "rgba(255,255,255,0.04)");

  const riskColor =
    audit.riskTier === "high"
      ? "#ef4444"
      : audit.riskTier === "medium"
        ? "#f59e0b"
        : "#10b981";
  const fontStack = '"SF Pro Display", "Inter", "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

  ctx.fillStyle = "#f8fafc";
  ctx.font = `500 44px ${fontStack}`;
  ctx.fillText("AI Media Copyright Audit", 106, 118);
  ctx.font = `300 20px ${fontStack}`;
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Share Snapshot", 1330, 118);

  ctx.fillStyle = riskColor;
  ctx.font = `500 17px ${fontStack}`;
  ctx.fillText(audit.riskTier.toUpperCase(), 118, 188);
  ctx.fillStyle = "#f8fafc";
  ctx.font = `500 42px ${fontStack}`;
  ctx.fillText(audit.riskTier === "low" ? "Safe to use" : "Risky", 118, 240);
  ctx.font = `400 21px ${fontStack}`;
  ctx.fillStyle = "#c5ceda";
  ctx.fillText(`${audit.decision}  |  Risk ${audit.riskScore}/99`, 118, 276);

  ctx.fillStyle = "#d6deea";
  ctx.font = `350 18px ${fontStack}`;
  let y = drawWrappedText(ctx, audit.summary, 118, 320, 1280, 30);

  y += 34;
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 14px ${fontStack}`;
  ctx.fillText("TOP FINDINGS", 118, y);
  y += 26;

  ctx.font = `350 17px ${fontStack}`;
  ctx.fillStyle = "#d9e0ea";
  const topFindings = audit.findings.slice(0, 5);
  for (const finding of topFindings) {
    y = drawWrappedText(ctx, `• ${finding}`, 118, y, 980, 28);
    y += 6;
  }

  drawRoundedRect(ctx, 1060, 340, 430, 430, 18, "rgba(15, 23, 42, 0.82)");
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 13px ${fontStack}`;
  ctx.fillText("MODEL", 1084, 380);
  ctx.fillStyle = "#f8fafc";
  ctx.font = `400 18px ${fontStack}`;
  ctx.fillText(audit.mlAssessment.modelVersion, 1084, 408);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 13px ${fontStack}`;
  ctx.fillText("INFRINGEMENT LIKELIHOOD", 1084, 452);
  ctx.fillStyle = "#f8fafc";
  ctx.font = `500 34px ${fontStack}`;
  ctx.fillText(`${Math.round(audit.mlAssessment.probabilityInfringement * 100)}%`, 1084, 492);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 13px ${fontStack}`;
  ctx.fillText("CONFIDENCE", 1084, 530);
  ctx.fillStyle = "#f8fafc";
  ctx.font = `450 23px ${fontStack}`;
  ctx.fillText(`${audit.mlAssessment.confidence}%`, 1084, 560);
  ctx.fillStyle = "#94a3b8";
  ctx.font = `500 13px ${fontStack}`;
  ctx.fillText("TOP SIGNALS", 1084, 602);
  ctx.fillStyle = "#cfd8e3";
  ctx.font = `350 16px ${fontStack}`;
  drawWrappedText(ctx, audit.mlAssessment.topSignals.join(" • "), 1084, 628, 380, 25);

  ctx.fillStyle = "#94a3b8";
  ctx.font = `350 15px ${fontStack}`;
  ctx.fillText(
    `Catalog matches: ${audit.catalogMatches.length}  |  URLs checked: ${audit.websiteForensicsList.length}  |  Fingerprints: ${audit.mediaFingerprints.length}`,
    118,
    880
  );
  ctx.fillText(
    `Generated ${formatAuditDate(audit.createdAt)} · Aegis AI forensic decision-support`,
    118,
    914
  );

  try {
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-${audit.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
    }
    line = word;
  }

  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function formatAuditDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "unknown date";
  }
  return date.toLocaleString();
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
