const quickAuditForm = document.getElementById("quickAuditForm");
const addAssetBtn = document.getElementById("addAssetBtn");
const assetFileInput = document.getElementById("assetFile");
const assetMetaEl = document.getElementById("assetMeta");
const dropFeedbackEl = document.getElementById("dropFeedback");
const auditPromptInput = document.getElementById("quickPrompt");
const distributionIntentInput = document.getElementById("distributionIntent");
const urgencyLevelInput = document.getElementById("urgencyLevel");
const publicSafeModeInput = document.getElementById("publicSafeMode");
const rightsBasisInput = document.getElementById("rightsBasis");
const provenanceLevelInput = document.getElementById("provenanceLevel");
const cmiStatusInput = document.getElementById("cmiStatus");
const fairUsePurposeInput = document.getElementById("fairUsePurpose");
const fairUseNatureInput = document.getElementById("fairUseNature");
const fairUseAmountInput = document.getElementById("fairUseAmount");
const fairUseMarketEffectInput = document.getElementById("fairUseMarketEffect");
const compliancePanelEl = document.getElementById("compliancePanel");

const auditQueueEl = document.getElementById("auditQueue");
const queueCountEl = document.getElementById("queueCount");
const reportContentEl = document.getElementById("reportContent");
const reportStatusEl = document.getElementById("reportStatus");
const resultsSectionEl = document.getElementById("resultsSection");
const reportInteractEl = document.getElementById("reportInteract");
const qaFormEl = document.getElementById("qaForm");
const qaInputEl = document.getElementById("qaInput");
const qaThreadEl = document.getElementById("qaThread");
const certStatusEl = document.getElementById("certStatus");
const generateCertBtn = document.getElementById("generateCertBtn");
const downloadCertBtn = document.getElementById("downloadCertBtn");
const copySummaryBtn = document.getElementById("copySummaryBtn");

const SOURCE_RIGHTSHOLDERS = [
  {
    name: "The Walt Disney Company",
    aliases: ["disney", "walt disney", "disney+", "disney plus", "disney animation"]
  },
  { name: "Pixar", aliases: ["pixar", "pixar animation"] },
  { name: "Marvel Studios", aliases: ["marvel", "marvel studios", "mcu"] },
  { name: "Lucasfilm", aliases: ["lucasfilm", "star wars"] },
  {
    name: "Warner Bros. Discovery",
    aliases: ["warner bros", "warner brothers", "wb", "wbd"]
  },
  { name: "DC Studios", aliases: ["dc studios", "dc comics", "dc"] },
  { name: "HBO", aliases: ["hbo", "hbo max"] },
  { name: "Max", aliases: ["max originals", "max"] },
  {
    name: "Universal Pictures",
    aliases: ["universal pictures", "universal studios", "universal"]
  },
  { name: "DreamWorks Animation", aliases: ["dreamworks", "dreamworks animation"] },
  { name: "Illumination", aliases: ["illumination", "illumination studios"] },
  {
    name: "Paramount Pictures",
    aliases: ["paramount", "paramount pictures", "paramount+"]
  },
  { name: "Nickelodeon", aliases: ["nickelodeon", "nick"] },
  {
    name: "Sony Pictures",
    aliases: ["sony pictures", "columbia pictures", "tristar", "screen gems"]
  },
  { name: "Netflix", aliases: ["netflix", "netflex", "netflicks", "netflix originals"] },
  {
    name: "Amazon MGM Studios",
    aliases: ["amazon mgm", "mgm", "metro goldwyn mayer", "prime video"]
  },
  { name: "Apple TV+", aliases: ["apple tv+", "apple tv plus", "apple originals"] },
  { name: "Lionsgate", aliases: ["lionsgate"] },
  { name: "A24", aliases: ["a24"] },
  { name: "Legendary Entertainment", aliases: ["legendary", "legendary entertainment"] },
  { name: "BBC Studios", aliases: ["bbc studios", "bbc"] },
  { name: "AMC Networks", aliases: ["amc", "amc studios"] }
];

const SOURCE_IP_CATALOG = [
  { name: "Star Wars", aliases: ["star wars", "jedi", "sith", "darth vader"] },
  { name: "Marvel Avengers", aliases: ["avengers", "iron man", "captain america", "thor"] },
  { name: "Spider-Man", aliases: ["spider-man", "spiderman", "peter parker"] },
  { name: "Batman", aliases: ["batman", "bruce wayne", "gotham"] },
  { name: "Superman", aliases: ["superman", "clark kent", "krypton"] },
  { name: "Wonder Woman", aliases: ["wonder woman", "diana prince", "themyscira"] },
  { name: "Justice League", aliases: ["justice league"] },
  { name: "Harry Potter", aliases: ["harry potter", "hogwarts"] },
  { name: "Fantastic Beasts", aliases: ["fantastic beasts"] },
  { name: "The Lord of the Rings", aliases: ["lord of the rings", "middle earth"] },
  { name: "The Hobbit", aliases: ["the hobbit", "bilbo"] },
  { name: "Game of Thrones", aliases: ["game of thrones", "westeros"] },
  { name: "House of the Dragon", aliases: ["house of the dragon", "targaryen"] },
  { name: "Stranger Things", aliases: ["stranger things", "upside down"] },
  { name: "Squid Game", aliases: ["squid game"] },
  { name: "The Witcher", aliases: ["the witcher", "geralt"] },
  { name: "The Last of Us", aliases: ["the last of us", "joel and ellie"] },
  { name: "Jurassic Park/World", aliases: ["jurassic park", "jurassic world"] },
  { name: "Fast & Furious", aliases: ["fast and furious", "fast & furious"] },
  { name: "Mission: Impossible", aliases: ["mission impossible", "ethan hunt"] },
  { name: "Top Gun", aliases: ["top gun", "maverick"] },
  { name: "Transformers", aliases: ["transformers", "autobots", "decepticons"] },
  { name: "Star Trek", aliases: ["star trek", "enterprise"] },
  { name: "SpongeBob SquarePants", aliases: ["spongebob", "bikini bottom"] },
  { name: "South Park", aliases: ["south park"] },
  { name: "James Bond", aliases: ["james bond", "007"] },
  { name: "Rocky / Creed", aliases: ["rocky balboa", "creed"] },
  { name: "John Wick", aliases: ["john wick"] },
  { name: "The Hunger Games", aliases: ["hunger games", "katniss"] },
  { name: "Twilight", aliases: ["twilight saga", "bella swan"] },
  { name: "The Matrix", aliases: ["the matrix", "neo"] },
  { name: "Dune", aliases: ["dune", "arrakis"] },
  { name: "Barbie", aliases: ["barbie"] },
  { name: "Oppenheimer", aliases: ["oppenheimer"] },
  { name: "Avatar", aliases: ["avatar pandora", "na vi", "pandora"] },
  { name: "Frozen", aliases: ["frozen", "elsa", "anna"] },
  { name: "Toy Story", aliases: ["toy story", "buzz lightyear", "woody"] },
  { name: "Cars", aliases: ["lightning mcqueen", "radiator springs"] },
  { name: "Mickey Mouse", aliases: ["mickey mouse", "minnie mouse"] },
  { name: "The Simpsons", aliases: ["the simpsons", "springfield"] },
  { name: "Family Guy", aliases: ["family guy", "peter griffin"] },
  { name: "Shrek", aliases: ["shrek", "donkey"] },
  { name: "Minions / Despicable Me", aliases: ["minions", "despicable me", "gru"] },
  { name: "How to Train Your Dragon", aliases: ["how to train your dragon", "toothless"] },
  { name: "Kung Fu Panda", aliases: ["kung fu panda", "po panda"] }
];

const SOURCE_MARKERS = [
  { name: "Disney Castle Logo", aliases: ["disney castle"] },
  { name: "Netflix N Mark", aliases: ["netflix n"] },
  { name: "Marvel Logo", aliases: ["marvel logo"] },
  { name: "Pixar Lamp", aliases: ["pixar lamp"] },
  { name: "WB Shield", aliases: ["wb shield", "warner shield"] },
  { name: "Paramount Mountain", aliases: ["paramount mountain"] }
];

const styleImitationPatterns = [
  /in the style of\s+[a-z0-9 .'-]+/i,
  /look like\s+[a-z0-9 .'-]+/i,
  /copy\s+(the\s+)?scene\s+from/i,
  /recreate\s+(the\s+)?logo/i,
  /same\s+as\s+(the\s+)?movie/i
];

const state = {
  audits: [],
  activeAuditId: null,
  isGeneratingCertificate: false,
  selectedFile: null,
  dragDepth: 0,
  dropFeedbackTimer: null
};
let revealObserver = null;

addAssetBtn.addEventListener("click", () => assetFileInput.click());
assetFileInput.addEventListener("change", updateAssetMeta);
publicSafeModeInput.addEventListener("change", syncPublicSafeMode);
qaFormEl.addEventListener("submit", onSubmitQuestion);
generateCertBtn.addEventListener("click", onGenerateCertificate);
downloadCertBtn.addEventListener("click", onDownloadCertificate);
copySummaryBtn.addEventListener("click", onCopySummary);
quickAuditForm.addEventListener("dragenter", onDragEnter);
quickAuditForm.addEventListener("dragover", onDragOver);
quickAuditForm.addEventListener("dragleave", onDragLeave);
quickAuditForm.addEventListener("drop", onDropMedia);
window.addEventListener("dragover", preventFileNavigation);
window.addEventListener("drop", preventFileNavigation);
syncPublicSafeMode();

quickAuditForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = state.selectedFile || assetFileInput.files[0];
  const prompt = auditPromptInput.value.trim();

  if (!file) {
    assetMetaEl.textContent = "Select an asset first";
    assetMetaEl.classList.add("error");
    addAssetBtn.classList.add("error");
    addAssetBtn.classList.remove("has-file");
    return;
  }

  if (!prompt) {
    auditPromptInput.focus();
    return;
  }

  const audit = {
    id: crypto.randomUUID(),
    file,
    prompt,
    distributionIntent: distributionIntentInput.value,
    urgency: urgencyLevelInput.value,
    publicSafeMode: publicSafeModeInput.checked,
    rightsBasis: rightsBasisInput.value,
    provenanceLevel: provenanceLevelInput.value,
    cmiStatus: cmiStatusInput.value,
    fairUsePurpose: fairUsePurposeInput.value,
    fairUseNature: fairUseNatureInput.value,
    fairUseAmount: fairUseAmountInput.value,
    fairUseMarketEffect: fairUseMarketEffectInput.value,
    status: "queued",
    createdAt: new Date(),
    progress: 0,
    totalFrames: 0,
    scannedFrames: 0,
    report: null,
    qa: [],
    qaPending: false,
    certificate: null
  };

  state.audits.unshift(audit);
  state.activeAuditId = audit.id;

  renderQueue();
  renderReport();
  scrollToResultsSection();

  quickAuditForm.reset();
  clearSelectedFile();

  await runForensicAudit(audit);
});

function updateAssetMeta() {
  const file = assetFileInput.files[0];
  if (!file) {
    clearSelectedFile();
    return;
  }

  setSelectedFile(file, "picker");
}

function preventFileNavigation(event) {
  if (event.dataTransfer?.types && Array.from(event.dataTransfer.types).includes("Files")) {
    event.preventDefault();
  }
}

function onDragEnter(event) {
  if (!hasFileDrag(event)) {
    return;
  }

  event.preventDefault();
  state.dragDepth += 1;
  quickAuditForm.classList.add("drag-active");
}

function onDragOver(event) {
  if (!hasFileDrag(event)) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function onDragLeave(event) {
  if (!hasFileDrag(event)) {
    return;
  }

  event.preventDefault();
  state.dragDepth = Math.max(0, state.dragDepth - 1);
  if (state.dragDepth === 0) {
    quickAuditForm.classList.remove("drag-active");
  }
}

function onDropMedia(event) {
  if (!hasFileDrag(event)) {
    return;
  }

  event.preventDefault();
  state.dragDepth = 0;
  quickAuditForm.classList.remove("drag-active");

  const file = pickSupportedMediaFile(event.dataTransfer?.files);
  if (!file) {
    assetMetaEl.textContent = "Unsupported file type";
    assetMetaEl.classList.add("error");
    addAssetBtn.classList.add("error");
    addAssetBtn.classList.remove("has-file");
    return;
  }

  setSelectedFile(file, "drop");
}

function hasFileDrag(event) {
  return Boolean(
    event.dataTransfer?.types && Array.from(event.dataTransfer.types).includes("Files")
  );
}

function pickSupportedMediaFile(fileList) {
  if (!fileList?.length) {
    return null;
  }

  return (
    Array.from(fileList).find((file) => file.type.startsWith("image/") || file.type.startsWith("video/")) ||
    null
  );
}

function setSelectedFile(file, source = "picker") {
  state.selectedFile = file;
  assetMetaEl.textContent = `${file.name} (${formatFileSize(file.size)})`;
  assetMetaEl.classList.remove("error");
  addAssetBtn.classList.remove("error");
  addAssetBtn.classList.add("has-file");
  showDropFeedback(
    source === "drop" ? `Attached from drop: ${file.name}` : `Attached: ${file.name}`
  );

  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    assetFileInput.files = dt.files;
  } catch (_error) {
    // Some browsers block programmatic file list assignment.
  }
}

function showDropFeedback(message) {
  if (!dropFeedbackEl) {
    return;
  }

  if (state.dropFeedbackTimer) {
    clearTimeout(state.dropFeedbackTimer);
  }

  dropFeedbackEl.textContent = message;
  dropFeedbackEl.classList.add("show");

  state.dropFeedbackTimer = setTimeout(() => {
    dropFeedbackEl.classList.remove("show");
  }, 2200);
}

function clearSelectedFile() {
  state.selectedFile = null;
  assetMetaEl.textContent = "";
  assetMetaEl.classList.remove("error");
  addAssetBtn.classList.remove("error");
  addAssetBtn.classList.remove("has-file");
  assetFileInput.value = "";
}

function scrollToResultsSection() {
  const target = resultsSectionEl || document.getElementById("attorney-desk");
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  });
}

function syncPublicSafeMode() {
  if (!compliancePanelEl) {
    return;
  }

  compliancePanelEl.open = !publicSafeModeInput.checked;
}

async function runForensicAudit(audit) {
  audit.status = "analyzing";
  renderQueue();
  renderReport();

  const mediaInfo = await getMediaInfo(audit.file);
  audit.totalFrames = mediaInfo.frames;

  await simulateFrameScan(audit);

  audit.report = buildForensicsReport(audit, mediaInfo);
  audit.status = "completed";
  audit.progress = 100;
  audit.scannedFrames = audit.totalFrames;

  renderQueue();
  renderReport();
}

async function getMediaInfo(file) {
  const type = file.type || "application/octet-stream";

  if (type.startsWith("video/")) {
    const duration = await readVideoDuration(file);
    const assumedFps = 30;
    const frames = Math.max(1, Math.round(duration * assumedFps));
    return {
      type: "video",
      duration,
      frames,
      fps: assumedFps
    };
  }

  return {
    type: "image",
    duration: 0,
    frames: 1,
    fps: null
  };
}

function readVideoDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.max(1, duration));
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(4);
    };
  });
}

async function simulateFrameScan(audit) {
  const total = audit.totalFrames;
  let scanned = 0;

  while (scanned < total) {
    const chunk = Math.max(1, Math.floor(total / 80));
    scanned = Math.min(total, scanned + chunk);
    audit.scannedFrames = scanned;
    audit.progress = Math.round((scanned / total) * 100);

    renderQueue();
    renderReport();

    await delay(24);
  }
}

function normalizeForMatch(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeForMatch(value) {
  const normalized = normalizeForMatch(value);
  if (!normalized) {
    return [];
  }

  return normalized.split(" ").filter((token) => token.length > 1);
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    dp[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

function isNearToken(token, aliasToken) {
  if (token === aliasToken) {
    return true;
  }

  if (aliasToken.length < 5) {
    return false;
  }

  if (Math.abs(token.length - aliasToken.length) > 1) {
    return false;
  }

  return levenshteinDistance(token, aliasToken) <= 1;
}

function aliasMatchType(corpus, tokens, alias) {
  const normalizedAlias = normalizeForMatch(alias);
  if (!normalizedAlias) {
    return null;
  }

  if (` ${corpus} `.includes(` ${normalizedAlias} `)) {
    return "exact";
  }

  const aliasTokens = normalizedAlias.split(" ").filter((token) => token.length > 1);
  if (!aliasTokens.length) {
    return null;
  }

  const fuzzyPhraseMatch = aliasTokens.every((aliasToken) => {
    if (aliasToken.length <= 3) {
      return tokens.includes(aliasToken);
    }

    return tokens.some((token) => isNearToken(token, aliasToken));
  });

  return fuzzyPhraseMatch ? "fuzzy" : null;
}

function findCatalogMatches(corpus, tokens, catalog) {
  const matches = [];

  for (const item of catalog) {
    let bestMode = null;
    let matchedAlias = null;

    for (const alias of item.aliases) {
      const mode = aliasMatchType(corpus, tokens, alias);
      if (!mode) {
        continue;
      }

      if (!bestMode || (bestMode === "fuzzy" && mode === "exact")) {
        bestMode = mode;
        matchedAlias = alias;
      }

      if (mode === "exact") {
        break;
      }
    }

    if (bestMode) {
      matches.push({
        name: item.name,
        alias: matchedAlias,
        mode: bestMode
      });
    }
  }

  return matches;
}

function summarizeMatches(matches, limit = 4) {
  if (!matches.length) {
    return "";
  }

  const names = matches.slice(0, limit).map((item) => item.name);
  if (matches.length <= limit) {
    return names.join(", ");
  }

  return `${names.join(", ")}, +${matches.length - limit} more`;
}

function buildSourceIntelligence(audit) {
  const corpus = normalizeForMatch(`${audit.prompt} ${audit.file.name}`);
  const tokens = Array.from(new Set(tokenizeForMatch(corpus)));

  const rightsholderMatches = findCatalogMatches(corpus, tokens, SOURCE_RIGHTSHOLDERS);
  const ipMatches = findCatalogMatches(corpus, tokens, SOURCE_IP_CATALOG);
  const markerMatches = findCatalogMatches(corpus, tokens, SOURCE_MARKERS);

  const findings = [];
  const exactRightsholders = rightsholderMatches.filter((item) => item.mode === "exact");
  const fuzzyMatches = [...rightsholderMatches, ...ipMatches, ...markerMatches].filter(
    (item) => item.mode === "fuzzy"
  );

  if (exactRightsholders.length) {
    findings.push({
      level: "high",
      title: "Major rightsholder reference detected",
      detail: `Matched rightsholder terms: ${summarizeMatches(exactRightsholders)}.`
    });
  }

  if (ipMatches.length) {
    findings.push({
      level: "high",
      title: "Franchise or character similarity detected",
      detail: `Matched film/TV IP references: ${summarizeMatches(ipMatches)}.`
    });
  }

  if (markerMatches.length) {
    findings.push({
      level: "high",
      title: "Branded visual marker reference detected",
      detail: `Matched brand marker terms: ${summarizeMatches(markerMatches)}.`
    });
  }

  if (fuzzyMatches.length) {
    findings.push({
      level: "medium",
      title: "Possible misspelled source references",
      detail: `Fuzzy alias matches found (example: ${summarizeMatches(fuzzyMatches, 3)}).`
    });
  }

  return {
    comparedRightsholders: SOURCE_RIGHTSHOLDERS.length,
    comparedIPs: SOURCE_IP_CATALOG.length,
    comparedMarkers: SOURCE_MARKERS.length,
    rightsholderMatches,
    ipMatches,
    markerMatches,
    findings
  };
}

function buildForensicsReport(audit, mediaInfo) {
  const sourceIntel = buildSourceIntelligence(audit);
  const findings = [...sourceIntel.findings];

  for (const pattern of styleImitationPatterns) {
    if (audit.prompt.match(pattern)) {
      findings.push({
        level: "medium",
        title: "Potential style imitation intent",
        detail:
          "Prompt language suggests imitation of a specific creator, franchise, or branded work."
      });
    }
  }

  if (audit.distributionIntent === "broadcast" || audit.distributionIntent === "marketing") {
    findings.push({
      level: "medium",
      title: "High exposure distribution",
      detail:
        "Public-facing use case increases legal scrutiny and raises the threshold for acceptable uncertainty."
    });
  }

  const legalGateFindings = buildComplianceFindings(audit);
  const uniqueFindings = dedupeFindings([...findings, ...legalGateFindings]);
  const fairUse = evaluateFairUse(audit);
  const compliance = evaluateCompliance(audit, uniqueFindings, fairUse);
  const riskScore = scoreRisk(uniqueFindings, audit.urgency, compliance);
  const riskTier = toTier(riskScore);

  const reasoning = [
    `Scanned ${audit.scannedFrames.toLocaleString()} / ${audit.totalFrames.toLocaleString()} frames (${audit.progress}%).`,
    mediaInfo.type === "video"
      ? `Video analyzed at assumed ${mediaInfo.fps} fps over ${Math.round(mediaInfo.duration)} seconds.`
      : "Single-frame image fingerprint and prompt correlation completed.",
    uniqueFindings.length
      ? `Detected ${uniqueFindings.length} risk signal(s) across prompt intent, file naming, distribution profile, and legal metadata.`
      : "No direct protected-term or imitation-language signal detected in provided prompt and metadata.",
    "Compared all available in-app sources: user prompt, asset filename metadata, distribution context, and legal declarations.",
    `Compared against ${sourceIntel.comparedRightsholders} major rightsholder sources, ${sourceIntel.comparedIPs} film/TV IP markers, and ${sourceIntel.comparedMarkers} brand markers.`,
    `Compliance check stack returned status: ${compliance.shortStatus}.`,
    "Interpret this as a decision-support result; final publishing authority should remain with a qualified human reviewer."
  ];

  const recommendation =
    compliance.overall === "non-compliant"
      ? "Block release. Escalate to counsel with chain-of-title evidence, model/source logs, and remediation plan before any publication."
      : compliance.overall === "review-required"
      ? "Hold for attorney review. Resolve licensing/provenance/fair-use uncertainty prior to external distribution."
      : riskTier === "high"
      ? "Pause release due to elevated source-similarity signals even with complete legal declarations."
      : "Proceed with controlled publication, maintain provenance records, and retain review artifacts.";

  const publicSafe = evaluatePublicSafe({
    compliance,
    riskTier,
    sourceIntel,
    distributionIntent: audit.distributionIntent
  });

  return {
    riskScore,
    riskTier,
    findings: uniqueFindings,
    reasoning,
    recommendation,
    compliance,
    fairUse,
    sourceIntel,
    publicSafe
  };
}

function evaluatePublicSafe({ compliance, riskTier, sourceIntel, distributionIntent }) {
  const highSourceSignal =
    sourceIntel.ipMatches.length > 0 || sourceIntel.markerMatches.length > 0;
  const exactMajorStudioSignal = sourceIntel.rightsholderMatches.some((item) => item.mode === "exact");

  if (
    compliance.overall === "non-compliant" ||
    riskTier === "high" ||
    (highSourceSignal && ["marketing", "broadcast"].includes(distributionIntent))
  ) {
    return {
      level: "red",
      label: "Public Safe: Do Not Publish",
      summary:
        "High legal risk indicators are present. Do not publish externally until legal review resolves all blockers."
    };
  }

  if (
    compliance.overall === "review-required" ||
    riskTier === "medium" ||
    exactMajorStudioSignal
  ) {
    return {
      level: "yellow",
      label: "Public Safe: Needs Review",
      summary:
        "Potential legal concerns exist. Treat as advisory-only until attorney or rights-holder review is complete."
    };
  }

  return {
    level: "green",
    label: "Public Safe: Low Risk",
    summary:
      "No critical legal blockers detected in this pass, but retain provenance and complete final human review before publication."
  };
}

function buildComplianceFindings(audit) {
  const findings = [];

  if (audit.rightsBasis === "unknown") {
    findings.push({
      level: "high",
      title: "Missing rights basis",
      detail: "No ownership, license, or fair-use basis documented for the asset."
    });
  }

  if (audit.provenanceLevel === "none") {
    findings.push({
      level: "high",
      title: "No provenance documentation",
      detail: "Model, prompt, and generation logs are missing, preventing chain-of-title validation."
    });
  }

  if (audit.provenanceLevel === "partial") {
    findings.push({
      level: "medium",
      title: "Partial provenance documentation",
      detail: "Logs are incomplete and should be finalized before release authorization."
    });
  }

  if (audit.cmiStatus === "altered") {
    findings.push({
      level: "high",
      title: "CMI alteration risk",
      detail: "Copyright management information is marked as altered or removed."
    });
  }

  if (audit.cmiStatus === "unknown") {
    findings.push({
      level: "low",
      title: "CMI verification incomplete",
      detail: "Unable to confirm whether copyright notices and attribution metadata are intact."
    });
  }

  if (audit.rightsBasis === "fairuse" && audit.fairUsePurpose === "commercial") {
    findings.push({
      level: "high",
      title: "High-risk fair use posture",
      detail: "Commercial replication intent weakens fair-use defensibility."
    });
  }

  return findings;
}

function evaluateFairUse(audit) {
  if (audit.rightsBasis !== "fairuse") {
    return {
      applicable: false,
      score: null,
      status: "pass",
      detail: "Fair use is not the declared rights basis for this asset."
    };
  }

  let score = 0;

  if (["commentary", "research", "transformative"].includes(audit.fairUsePurpose)) {
    score += 1;
  }

  if (audit.fairUsePurpose === "commercial") {
    score -= 1;
  }

  if (audit.fairUseNature === "factual") {
    score += 1;
  }

  if (audit.fairUseNature === "creative" || audit.fairUseNature === "unpublished") {
    score -= 1;
  }

  if (audit.fairUseAmount === "minimal") {
    score += 1;
  }

  if (audit.fairUseAmount === "substantial") {
    score -= 1;
  }

  if (audit.fairUseAmount === "entire") {
    score -= 2;
  }

  if (audit.fairUseMarketEffect === "none") {
    score += 1;
  }

  if (audit.fairUseMarketEffect === "possible") {
    score -= 1;
  }

  if (audit.fairUseMarketEffect === "direct") {
    score -= 2;
  }

  if (audit.distributionIntent === "marketing" || audit.distributionIntent === "broadcast") {
    score -= 1;
  }

  if (score >= 2) {
    return {
      applicable: true,
      score,
      status: "pass",
      detail: "Fair-use factors trend favorable but still require attorney confirmation."
    };
  }

  if (score >= 0) {
    return {
      applicable: true,
      score,
      status: "review",
      detail: "Fair-use factors are mixed and require legal interpretation before release."
    };
  }

  return {
    applicable: true,
    score,
    status: "fail",
    detail: "Fair-use factors trend unfavorable for deployment in current form."
  };
}

function evaluateCompliance(audit, findings, fairUse) {
  const checks = [];
  let blockers = 0;
  let reviewFlags = 0;

  const hasHighFinding = findings.some((item) => item.level === "high");

  let rightsStatus = "pass";
  let rightsDetail = "Ownership or license basis documented for exclusive-rights analysis.";

  if (audit.rightsBasis === "fairuse") {
    rightsStatus = fairUse.status === "fail" ? "fail" : "review";
    rightsDetail = "Release relies on fair use; attorney analysis is required before distribution.";
  }

  if (audit.rightsBasis === "unknown") {
    rightsStatus = "fail";
    rightsDetail = "No chain-of-title basis provided for reproduction/distribution rights.";
  }

  checks.push({
    law: "17 U.S.C. §§106, 501 (exclusive rights / infringement risk)",
    status: rightsStatus,
    detail: rightsDetail
  });

  checks.push({
    law: "17 U.S.C. §107 (fair use factors)",
    status: fairUse.status,
    detail: fairUse.detail
  });

  let cmiStatus = "pass";
  let cmiDetail = "No CMI alteration declared.";

  if (audit.cmiStatus === "unknown") {
    cmiStatus = "review";
    cmiDetail = "CMI integrity is unknown and should be verified before publication.";
  }

  if (audit.cmiStatus === "altered") {
    cmiStatus = "fail";
    cmiDetail = "CMI marked removed or altered. Investigate before any release.";
  }

  checks.push({
    law: "17 U.S.C. §1202 (copyright management information)",
    status: cmiStatus,
    detail: cmiDetail
  });

  let provenanceStatus = "pass";
  let provenanceDetail = "Provenance package supports audit traceability.";

  if (audit.provenanceLevel === "partial") {
    provenanceStatus = "review";
    provenanceDetail = "Provenance records are incomplete and require completion.";
  }

  if (audit.provenanceLevel === "none") {
    provenanceStatus = "fail";
    provenanceDetail = "No provenance records attached for chain-of-title review.";
  }

  checks.push({
    law: "Compliance policy (chain-of-title documentation)",
    status: provenanceStatus,
    detail: provenanceDetail
  });

  if (hasHighFinding && ["marketing", "broadcast"].includes(audit.distributionIntent)) {
    checks.push({
      law: "Release threshold (public distribution control)",
      status: "fail",
      detail:
        "High-risk signals plus public distribution intent require release block pending counsel sign-off."
    });
  }

  for (const check of checks) {
    if (check.status === "fail") {
      blockers += 1;
    }

    if (check.status === "review") {
      reviewFlags += 1;
    }
  }

  const overall = blockers > 0 ? "non-compliant" : reviewFlags > 0 ? "review-required" : "compliant";

  return {
    overall,
    shortStatus: overall === "compliant" ? "CLEAR" : overall === "review-required" ? "REVIEW" : "BLOCK",
    blockers,
    reviewFlags,
    checks
  };
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((item) => {
    const key = `${item.title}|${item.detail}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function scoreRisk(findings, urgency, compliance) {
  let score = 12;

  for (const finding of findings) {
    if (finding.level === "high") {
      score += 26;
    }
    if (finding.level === "medium") {
      score += 14;
    }
    if (finding.level === "low") {
      score += 6;
    }
  }

  if (urgency === "expedited") {
    score += 6;
  }

  if (urgency === "priority") {
    score += 3;
  }

  if (compliance.overall === "review-required") {
    score += 10;
  }

  if (compliance.overall === "non-compliant") {
    score += 22;
  }

  score += compliance.blockers * 3;

  return Math.max(1, Math.min(99, score));
}

function toTier(score) {
  if (score >= 67) {
    return "high";
  }

  if (score >= 35) {
    return "medium";
  }

  return "low";
}

function renderQueue() {
  const audits = state.audits;
  queueCountEl.textContent = `${audits.length} ${audits.length === 1 ? "Asset" : "Assets"}`;

  if (!audits.length) {
    auditQueueEl.className = "audit-queue empty-state";
    auditQueueEl.innerHTML = "<p>No submissions yet. Add media and run a review from the prompt panel.</p>";
    return;
  }

  auditQueueEl.className = "audit-queue";
  auditQueueEl.innerHTML = "";

  for (const audit of audits) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `queue-item ${audit.id === state.activeAuditId ? "active" : ""}`;

    item.innerHTML = `
      <p class="queue-title">${escapeHtml(audit.file.name)}</p>
      <p class="queue-meta">${prettyType(audit.file.type)} | ${formatFileSize(audit.file.size)}</p>
      <p class="queue-status">${statusText(audit)}</p>
      <div class="progress-track"><div class="progress-value" style="width:${audit.progress}%"></div></div>
    `;

    item.addEventListener("click", () => {
      state.activeAuditId = audit.id;
      renderQueue();
      renderReport();
    });

    auditQueueEl.appendChild(item);
  }
}

function renderReport() {
  const audit = state.audits.find((item) => item.id === state.activeAuditId);

  if (!audit) {
    reportStatusEl.textContent = "Idle";
    reportContentEl.className = "report-content empty-state";
    reportInteractEl.classList.add("hidden");
    reportContentEl.innerHTML =
      "<p>Decision reports appear here with source matches, risk logic, and next-step guidance.</p>";
    observeBuildTargets(reportContentEl);
    return;
  }

  if (audit.status !== "completed") {
    reportStatusEl.textContent = "Scanning";
    reportContentEl.className = "report-content";
    reportInteractEl.classList.add("hidden");
    reportContentEl.innerHTML = `
      <div class="report-head card scroll-build">
        <h4>${escapeHtml(audit.file.name)}</h4>
        <p>Analysis in progress. ${audit.scannedFrames.toLocaleString()} / ${audit.totalFrames.toLocaleString()} frames processed.</p>
        <div class="progress-track"><div class="progress-value" style="width:${audit.progress}%"></div></div>
      </div>
      <div class="card scroll-build">
        <h5>Detection Pipeline</h5>
        <p>Evaluating prompt semantics, media metadata, source-library similarity, declared legal posture, and frame-level anomaly signatures.</p>
      </div>
    `;
    observeBuildTargets(reportContentEl);
    return;
  }

  const report = audit.report;
  reportStatusEl.textContent = audit.publicSafeMode
    ? report.publicSafe.level.toUpperCase()
    : report.compliance.shortStatus;
  reportContentEl.className = "report-content";
  reportInteractEl.classList.remove("hidden");

  const sourceMatches = [
    ...report.sourceIntel.rightsholderMatches.slice(0, 5),
    ...report.sourceIntel.ipMatches.slice(0, 6),
    ...report.sourceIntel.markerMatches.slice(0, 4)
  ];

  reportContentEl.innerHTML = `
    <div class="report-infographic">
      <section class="report-intro card span-2 scroll-build">
        <h4>${escapeHtml(audit.file.name)}</h4>
        <p>
          ${
            audit.publicSafeMode
              ? `<span class="status-inline ${toPublicSafeClass(report.publicSafe.level)}">${escapeHtml(
                  report.publicSafe.label
                )}</span>`
              : ""
          }
          <span class="status-inline ${complianceClass(report.compliance.overall)}">${report.compliance.shortStatus}</span>
          <span class="status-inline ${report.riskTier}">${report.riskTier} risk</span>
        </p>
        ${audit.publicSafeMode ? `<p>${escapeHtml(report.publicSafe.summary)}</p>` : ""}
        <div class="risk-meter"><div class="risk-fill" style="width:${report.riskScore}%"></div></div>
        <div class="metric-grid">
          <div class="metric">
            <p class="metric-label">Risk Score</p>
            <p class="metric-value">${report.riskScore}/99</p>
          </div>
          <div class="metric">
            <p class="metric-label">Scanned Frames</p>
            <p class="metric-value">${audit.scannedFrames.toLocaleString()}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Source Signals</p>
            <p class="metric-value">${report.findings.length}</p>
          </div>
        </div>
      </section>

      <section class="card scroll-build">
        <h5>Source Intelligence</h5>
        <p>
          Checked prompt and filename against
          <strong>${report.sourceIntel.comparedRightsholders}</strong> rightsholder entities,
          <strong>${report.sourceIntel.comparedIPs}</strong> IP markers, and
          <strong>${report.sourceIntel.comparedMarkers}</strong> brand markers.
        </p>
        ${
          sourceMatches.length
            ? `<ul class="compliance-list">
                ${sourceMatches
                  .map(
                    (match) =>
                      `<li><span class="status-inline ${match.mode === "exact" ? "high" : "review"}">${escapeHtml(match.mode)}</span><p><strong>${escapeHtml(match.name)}</strong> via "${escapeHtml(match.alias)}".</p></li>`
                  )
                  .join("")}
              </ul>`
            : "<p>No explicit studio, franchise, or visual marker match was detected.</p>"
        }
      </section>

      <section class="card scroll-build">
        <h5>Compliance Stack (U.S.)</h5>
        <ul class="compliance-list">
          ${report.compliance.checks
            .map(
              (check) =>
                `<li><span class="status-inline ${check.status}">${escapeHtml(check.status.toUpperCase())}</span><p><strong>${escapeHtml(check.law)}</strong> ${escapeHtml(check.detail)}</p></li>`
            )
            .join("")}
        </ul>
      </section>

      <section class="card scroll-build">
        <h5>Findings</h5>
        ${
          report.findings.length
            ? `<ul class="split-list">${report.findings
                .map(
                  (finding) =>
                    `<li><strong>${escapeHtml(finding.title)}.</strong> ${escapeHtml(finding.detail)}</li>`
                )
                .join("")}</ul>`
            : "<p>No direct infringement indicators were detected in the provided inputs.</p>"
        }
      </section>

      <section class="card scroll-build">
        <h5>Reasoning Trail</h5>
        <ul class="split-list">${report.reasoning
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>
      </section>

      <section class="card span-2 scroll-build">
        <h5>Recommendation</h5>
        <p>${escapeHtml(report.recommendation)}</p>
        <p style="margin-top:8px;color:rgba(255,255,255,0.66);">Decision support only. Final legal determination should remain with qualified counsel.</p>
      </section>
    </div>
  `;

  observeBuildTargets(reportContentEl);
  renderFollowUpTools(audit);
}

function statusText(audit) {
  if (audit.status === "completed") {
    const publicText = audit.publicSafeMode
      ? ` | ${audit.report.publicSafe.level.toUpperCase()} public`
      : "";
    return `Completed${publicText} | ${audit.report.compliance.shortStatus} | ${audit.report.riskTier.toUpperCase()} risk`;
  }

  if (audit.status === "analyzing") {
    return `Scanning | ${audit.progress}%`;
  }

  return "Queued";
}

function complianceClass(overall) {
  if (overall === "compliant") {
    return "pass";
  }

  if (overall === "review-required") {
    return "review";
  }

  return "fail";
}

function toPublicSafeClass(level) {
  if (level === "green") {
    return "pass";
  }

  if (level === "yellow") {
    return "review";
  }

  return "fail";
}

function getActiveAudit() {
  return state.audits.find((item) => item.id === state.activeAuditId) || null;
}

function renderFollowUpTools(audit) {
  renderQAThread(audit);
  qaInputEl.disabled = Boolean(audit.qaPending);

  const hasCertificate = Boolean(audit.certificate);
  downloadCertBtn.disabled = !hasCertificate;
  generateCertBtn.disabled = state.isGeneratingCertificate;

  if (state.isGeneratingCertificate) {
    certStatusEl.textContent = "Generating certificate fingerprint...";
    return;
  }

  if (!hasCertificate) {
    certStatusEl.textContent = "Generate a verification packet with a cryptographic fingerprint.";
    return;
  }

  certStatusEl.textContent = `Certificate ${audit.certificate.certificateId} generated at ${audit.certificate.generatedAt}.`;
}

function renderQAThread(audit) {
  if (!audit.qa.length) {
    qaThreadEl.innerHTML =
      "<p style=\"margin:0;color:rgba(228,239,255,0.76);font-size:0.8rem;\">Forensics Agent is ready. Ask for evidence, risk rationale, or exact remediation steps.</p>";
    return;
  }

  qaThreadEl.innerHTML = audit.qa
    .slice(-12)
    .map((item) => {
      const roleLabel = item.role === "user" ? "You" : "Forensics Agent";
      const roleClass = item.role === "user" ? "qa-user" : "qa-agent";
      const typingClass = item.pending ? "typing" : "";
      return `<div class="qa-item ${roleClass} ${typingClass}"><strong>${roleLabel}:</strong> ${escapeHtml(item.text)}</div>`;
    })
    .join("");

  qaThreadEl.scrollTop = qaThreadEl.scrollHeight;
}

async function onSubmitQuestion(event) {
  event.preventDefault();
  const audit = getActiveAudit();
  const question = qaInputEl.value.trim();

  if (!audit || !audit.report || !question || audit.qaPending) {
    return;
  }

  audit.qa.push({
    role: "user",
    text: question,
    createdAt: new Date().toISOString()
  });
  audit.qaPending = true;
  audit.qa.push({
    role: "assistant",
    text: "Reviewing the forensic trail...",
    pending: true,
    createdAt: new Date().toISOString()
  });

  qaInputEl.value = "";
  renderFollowUpTools(audit);

  await delay(460 + Math.floor(Math.random() * 380));

  const answer = answerQuestionFromReport(audit, question);
  const pending = [...audit.qa].reverse().find((item) => item.pending);
  if (pending) {
    pending.pending = false;
    pending.text = answer;
  }

  audit.qaPending = false;
  renderFollowUpTools(audit);
  qaInputEl.focus();
}

function answerQuestionFromReport(audit, question) {
  const q = question.toLowerCase();
  const report = audit.report;
  const failingChecks = report.compliance.checks.filter((item) => item.status === "fail");
  const reviewChecks = report.compliance.checks.filter((item) => item.status === "review");
  const matchedStudios = report.sourceIntel.rightsholderMatches.map((item) => item.name);
  const matchedIPs = report.sourceIntel.ipMatches.map((item) => item.name);
  const evidenceMatches = [...new Set([...matchedStudios, ...matchedIPs])];

  if (q.includes("why") || q.includes("reason")) {
    if (failingChecks.length) {
      return `Primary legal blockers are ${failingChecks
        .slice(0, 2)
        .map((item) => item.law)
        .join("; ")}. Based on those blockers, the case recommendation is: ${report.recommendation}`;
    }

    if (reviewChecks.length) {
      return `This case is in review because of ${reviewChecks
        .slice(0, 2)
        .map((item) => item.law)
        .join("; ")}.`;
    }
  }

  if (q.includes("frame") || q.includes("evidence") || q.includes("proof")) {
    return `Frame coverage: ${audit.scannedFrames.toLocaleString()} / ${audit.totalFrames.toLocaleString()} processed. Source comparison included ${report.sourceIntel.comparedRightsholders} rightsholder sources and ${report.sourceIntel.comparedIPs} IP markers.`;
  }

  if (
    q.includes("safe") ||
    q.includes("publish") ||
    q.includes("release") ||
    q.includes("go live")
  ) {
    return `Current release posture: ${audit.publicSafeMode ? report.publicSafe.label : report.compliance.shortStatus}. ${report.publicSafe.summary}`;
  }

  if (q.includes("disney") || q.includes("netflix") || q.includes("studio") || q.includes("source")) {
    if (evidenceMatches.length) {
      return `Detected source overlap markers: ${evidenceMatches.slice(0, 8).join(", ")}.`;
    }

    return "No explicit major studio or franchise markers were matched in the current prompt and filename inputs.";
  }

  if (q.includes("fix") || q.includes("improve") || q.includes("next step")) {
    if (failingChecks.length) {
      return "Recommended remediation: document rights basis, complete provenance records, remove studio/IP references, and re-run the audit.";
    }

    return "Recommended remediation: preserve provenance records, avoid style-imitative wording, and secure final attorney sign-off before distribution.";
  }

  if (q.includes("law") || q.includes("copyright") || q.includes("dmca")) {
    const cited = report.compliance.checks.slice(0, 3).map((item) => item.law);
    return `This run evaluated: ${cited.join("; ")}. For binding legal interpretation, route this report to counsel.`;
  }

  if (q.includes("certificate") || q.includes("share")) {
    return audit.certificate
      ? `Certificate ready: ${audit.certificate.certificateId} with SHA-256 fingerprint ${audit.certificate.fingerprint.slice(
          0,
          16
        )}...`
      : "Generate certificate to create a shareable report package with integrity fingerprint.";
  }

  return `Case summary: ${report.recommendation} Current risk score is ${report.riskScore}/99 with ${report.findings.length} finding(s).`;
}

async function onGenerateCertificate() {
  const audit = getActiveAudit();
  if (!audit || !audit.report || state.isGeneratingCertificate) {
    return;
  }

  state.isGeneratingCertificate = true;
  renderFollowUpTools(audit);

  try {
    audit.certificate = await buildCertificate(audit);
  } catch (_error) {
    certStatusEl.textContent = "Certificate generation failed in this browser context.";
  } finally {
    state.isGeneratingCertificate = false;
    renderFollowUpTools(audit);
  }
}

async function buildCertificate(audit) {
  const generatedAt = new Date().toISOString();
  const base = {
    version: "1.0",
    generatedAt,
    asset: {
      name: audit.file.name,
      type: audit.file.type || "unknown",
      sizeBytes: audit.file.size
    },
    verdict: {
      publicSafe: audit.report.publicSafe,
      compliance: audit.report.compliance.shortStatus,
      riskTier: audit.report.riskTier,
      riskScore: audit.report.riskScore
    },
    findings: audit.report.findings.map((item) => ({
      level: item.level,
      title: item.title
    })),
    statutoryChecks: audit.report.compliance.checks.map((item) => ({
      law: item.law,
      status: item.status
    })),
    sourceCoverage: {
      rightsholders: audit.report.sourceIntel.comparedRightsholders,
      ipMarkers: audit.report.sourceIntel.comparedIPs,
      brandMarkers: audit.report.sourceIntel.comparedMarkers
    }
  };

  const payload = JSON.stringify(base);
  const fingerprint = await sha256Hex(payload);
  const day = generatedAt.slice(0, 10).replaceAll("-", "");
  const certificateId = `AF-${day}-${fingerprint.slice(0, 12).toUpperCase()}`;

  return {
    ...base,
    certificateId,
    fingerprint
  };
}

async function sha256Hex(value) {
  if (!crypto?.subtle) {
    throw new Error("Web Crypto unavailable");
  }

  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function onDownloadCertificate() {
  const audit = getActiveAudit();
  if (!audit?.certificate) {
    return;
  }

  const blob = new Blob([JSON.stringify(audit.certificate, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${audit.file.name.replace(/\.[^.]+$/, "") || "audit"}-certificate.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function onCopySummary() {
  const audit = getActiveAudit();
  if (!audit?.report) {
    return;
  }

  const summary = [
    `Asset: ${audit.file.name}`,
    `Public Safe Verdict: ${audit.report.publicSafe.label}`,
    `Compliance Status: ${audit.report.compliance.shortStatus}`,
    `Risk: ${audit.report.riskTier.toUpperCase()} (${audit.report.riskScore}/99)`,
    `Recommendation: ${audit.report.recommendation}`,
    audit.certificate ? `Certificate: ${audit.certificate.certificateId}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await navigator.clipboard.writeText(summary);
    certStatusEl.textContent = "Summary copied to clipboard.";
  } catch (_error) {
    certStatusEl.textContent = "Clipboard copy blocked by browser permissions.";
  }
}

function prettyType(type) {
  if (!type) {
    return "Unknown";
  }

  if (type.startsWith("video/")) {
    return "Video";
  }

  if (type.startsWith("image/")) {
    return "Image";
  }

  return type;
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIdx = 0;

  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }

  return `${value.toFixed(value >= 10 || unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initializePagePosition() {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const navEntry = performance.getEntriesByType?.("navigation")?.[0];
  const legacyReload =
    typeof performance.navigation !== "undefined" && performance.navigation.type === 1;
  const isReload = (navEntry && navEntry.type === "reload") || legacyReload;

  if (!isReload) {
    return;
  }

  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function initScrollBuild() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    document.querySelectorAll(".reveal, .scroll-build").forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  observeBuildTargets(document);
}

function observeBuildTargets(scope = document) {
  const targets = scope.querySelectorAll(".reveal, .scroll-build");
  if (!targets.length) {
    return;
  }

  targets.forEach((element, index) => {
    if (element.dataset.buildBound === "true") {
      return;
    }

    element.dataset.buildBound = "true";
    element.style.setProperty("--build-delay", `${Math.min(index * 60, 280)}ms`);

    if (!revealObserver) {
      element.classList.add("is-visible");
      return;
    }

    revealObserver.observe(element);
  });
}

initScrollBuild();
initializePagePosition();
renderQueue();
renderReport();
