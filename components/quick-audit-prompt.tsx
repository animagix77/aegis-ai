"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

export type QuickAuditPayload = {
  prompt: string;
  file: File | null;
  fileName: string | null;
  targetUrl: string | null;
  targetUrls: string[];
  distributionIntent: "internal" | "marketing" | "client" | "broadcast";
  urgencyLevel: "standard" | "priority" | "expedited";
};

type QuickAuditPromptProps = {
  onSubmitAudit?: (payload: QuickAuditPayload) => void | Promise<void>;
};

const BASE_ANALYSIS_DURATION_MS = 5600;

function scrollToElementWithEase(target: HTMLElement, offset = 0) {
  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY + offset;
  const distance = targetY - startY;
  const duration = Math.min(1180, Math.max(700, Math.abs(distance) * 0.78));
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);

    window.scrollTo({
      top: startY + distance * eased,
      left: 0,
      behavior: "auto"
    });

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

export function QuickAuditPrompt({ onSubmitAudit }: QuickAuditPromptProps) {
  const fileInputId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(""), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) {
      setFilePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }

    setShowProgress(true);
    setProgress((value) => (value > 6 ? value : 6));

    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 94) {
          return value;
        }
        return Math.min(94, value + Math.max(1, Math.floor(Math.random() * 4)));
      });
    }, 230);

    return () => window.clearInterval(timer);
  }, [isSubmitting]);

  useEffect(() => {
    if (!isSubmitting) {
      return;
    }

    if (progress < 16) {
      setStatus("Stage 1/5: ingesting prompt and assets...");
      return;
    }
    if (progress < 34) {
      setStatus("Stage 2/5: extracting file fingerprints and metadata...");
      return;
    }
    if (progress < 56) {
      setStatus("Stage 3/5: running cross-catalog similarity checks...");
      return;
    }
    if (progress < 80) {
      setStatus("Stage 4/5: corroborating internet source evidence...");
      return;
    }
    setStatus("Stage 5/5: finalizing legal risk decision...");
  }, [isSubmitting, progress]);

  function attachFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setFeedback("Unsupported file type");
      return;
    }

    setSelectedFile(file);
    setFeedback(`Attached: ${truncateFileName(file.name, 42)}`);
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setFeedback("Attachment removed");
  }

  function openFilePicker() {
    const input = fileInputRef.current;
    if (!input) {
      setFeedback("File picker unavailable");
      return;
    }

    input.value = "";
    input.click();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    const normalizedPrompt = trimmedPrompt || (selectedFile ? `Analyze ${selectedFile.name}` : "");
    const extractedUrls = extractUrls(trimmedPrompt);
    const extractedUrl = extractedUrls[0] ?? null;

    if (!normalizedPrompt) {
      setFeedback("Enter a prompt or attach a file");
      setStatus("");
      return;
    }

    setIsSubmitting(true);
    setProgress(6);
    setFeedback("Running audit...");
    setStatus("Stage 1/5: ingesting prompt and assets...");

    const startedAt = performance.now();
    try {
      await onSubmitAudit?.({
        prompt: normalizedPrompt,
        file: selectedFile,
        fileName: selectedFile?.name ?? null,
        targetUrl: extractedUrl,
        targetUrls: extractedUrls,
        distributionIntent: "internal",
        urgencyLevel: "standard"
      });
      const elapsed = performance.now() - startedAt;
      const minDuration = computeMinimumDurationMs(selectedFile, extractedUrls.length);
      const remaining = minDuration - elapsed;
      if (remaining > 0) {
        await sleep(remaining);
      }
      setProgress(100);
      setStatus("Stage 5/5: finalizing decision report...");
      await sleep(260);
    } catch (_error) {
      setFeedback("Audit failed. Try again.");
      setStatus("");
      setIsSubmitting(false);
      setShowProgress(false);
      setProgress(0);
      return;
    }

    const target = document.getElementById("review-desk");
    if (!target) {
      setIsSubmitting(false);
      return;
    }

    scrollToElementWithEase(target, -10);
    window.setTimeout(() => {
      const previousTransition = target.style.transition;
      const previousBoxShadow = target.style.boxShadow;
      target.style.transition = "box-shadow 260ms ease";
      target.style.boxShadow = "0 0 0 1px rgba(34, 211, 238, 0.45), 0 0 46px rgba(34, 211, 238, 0.2)";

      window.setTimeout(() => {
        target.style.boxShadow = previousBoxShadow;
        target.style.transition = previousTransition;
        setIsSubmitting(false);
        setShowProgress(false);
        setProgress(0);
        setStatus("Submission analyzed.");
      }, 760);
    }, 520);
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onDragEnter={() => setIsDragActive(true)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragActive(false);
        attachFile(event.dataTransfer.files?.[0] ?? null);
      }}
      className={`relative mx-auto mt-8 w-full max-w-4xl rounded-[2rem] border bg-white/5 px-4 pb-1 pt-3 text-left backdrop-blur-md md:px-5 md:pb-2 md:pt-4 ${
        isDragActive ? "border-cyan-300/40" : "border-white/10"
      }`}
    >
      <textarea
        rows={2}
        placeholder="Tell me what to examine in this asset..."
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
          }
          event.preventDefault();
          formRef.current?.requestSubmit();
        }}
        className="min-h-[124px] w-full resize-none border-0 bg-transparent px-1 py-1 text-base tracking-tight text-white outline-none placeholder:text-neutral-500 md:min-h-[150px] md:text-lg"
      />

      <p
        className={`pointer-events-none absolute right-6 top-5 text-[11px] uppercase tracking-[0.16em] text-cyan-200/70 transition-opacity ${
          isDragActive ? "opacity-100" : "opacity-0"
        }`}
      >
        Drop image or video
      </p>

      <p
        className={`pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-black/70 px-3 py-1 text-[11px] text-cyan-200 transition ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
      >
        {feedback || "Attached"}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={openFilePicker}
            className="cursor-pointer text-[30px] font-light leading-none text-neutral-400 transition hover:text-white"
            aria-label="Attach media"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => attachFile(event.target.files?.[0] ?? null)}
          />
          {selectedFile ? (
            <>
              <div className="h-9 w-9 overflow-hidden rounded-md border border-white/15 bg-black/35">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt={selectedFile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.14em] text-neutral-300">
                    Vid
                  </div>
                )}
              </div>
              <p className="truncate text-[11px] text-neutral-400 md:max-w-[320px]">
                {truncateFileName(selectedFile.name, 44)}
              </p>
              <button
                type="button"
                onClick={clearSelectedFile}
                className="h-6 w-6 rounded-full text-sm leading-none text-neutral-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Remove file"
              >
                ×
              </button>
            </>
          ) : (
            <p className="truncate text-[11px] uppercase tracking-[0.15em] text-neutral-500">
              No file attached
            </p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            type="submit"
            aria-label="Run audit"
            disabled={isSubmitting}
            className="h-9 w-9 rounded-full bg-white text-2xl leading-none text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ↑
          </button>
        </div>
      </div>

      {showProgress ? (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-cyan-200 to-white/80 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      {status ? <p className="mt-1 text-xs text-cyan-200/80">{status}</p> : null}
    </form>
  );
}

function extractUrls(value: string): string[] {
  if (!value) {
    return [];
  }

  const explicit = value.match(/\bhttps?:\/\/[^\s<>"')]+/gi) ?? [];
  const inferred = value.match(/\b(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>"')]+)?/gi) ?? [];
  const candidates = [...explicit, ...inferred];
  const unique = new Set<string>();

  for (const candidate of candidates) {
    const normalized = normalizeUrlCandidate(candidate);
    if (!normalized) {
      continue;
    }
    unique.add(normalized);
    if (unique.size >= 4) {
      break;
    }
  }

  return Array.from(unique);
}

function normalizeUrlCandidate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.href;
  } catch {
    return null;
  }
}

function computeMinimumDurationMs(file: File | null, urlCount: number) {
  let target = BASE_ANALYSIS_DURATION_MS;
  if (file) {
    target += file.type.startsWith("video/") ? 2600 : 1400;
  }
  target += Math.min(4, urlCount) * 900;
  return Math.min(12000, target);
}

function truncateFileName(value: string, maxChars = 44) {
  if (value.length <= maxChars) {
    return value;
  }

  const dotIndex = value.lastIndexOf(".");
  const extension = dotIndex > 0 ? value.slice(dotIndex) : "";
  const baseName = dotIndex > 0 ? value.slice(0, dotIndex) : value;
  const maxBase = Math.max(10, maxChars - extension.length - 3);
  const head = Math.max(6, Math.ceil(maxBase * 0.66));
  const tail = Math.max(4, maxBase - head);
  return `${baseName.slice(0, head)}...${baseName.slice(-tail)}${extension}`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
