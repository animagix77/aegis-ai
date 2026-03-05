import type { MediaFingerprint } from "@/lib/types";
import { dHashFromImageSource } from "@/lib/hashing/dhash";
import { computeMultiHash, type MultiHashConfig } from "@/lib/hashing/multi-hash";
import { isBlankFrame } from "@/lib/hashing/canvas-utils";
import { hammingDistanceHex } from "@/lib/hashing/hamming";

export type FrameExtractionConfig = {
  mode: "fixed-interval" | "adaptive" | "scene-change";
  framesPerSecond?: number;
  maxFrames?: number;
  skipBlankFrames?: boolean;
  blankThreshold?: number;
  sceneChangeThreshold?: number;
  onProgress?: (extracted: number, total: number, currentTimeSec: number) => void;
};

export type ExtractedFrame = {
  timeSec: number;
  imageData: ImageData;
  isSceneChange: boolean;
  isBlank: boolean;
  index: number;
};

const DEFAULT_CONFIG: FrameExtractionConfig = {
  mode: "adaptive",
  framesPerSecond: 1,
  maxFrames: 120,
  skipBlankFrames: true,
  blankThreshold: 5,
  sceneChangeThreshold: 12,
};

function seekVideo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error("video_seek_failed")); };
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
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error(`video_${eventName}_timeout`)); }, timeoutMs);
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error(`video_${eventName}_error`)); };
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener("error", onError);
    };
    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function computeSeekPoints(duration: number, config: FrameExtractionConfig): number[] {
  const fps = config.framesPerSecond ?? 1;
  const maxFrames = config.maxFrames ?? 120;

  let effectiveFps = fps;
  if (duration > 900) {
    effectiveFps = Math.min(fps, 0.25);
  } else if (duration > 300) {
    effectiveFps = Math.min(fps, 0.5);
  }

  const interval = 1 / effectiveFps;
  const points: number[] = [];

  for (let t = 0.1; t < duration - 0.1; t += interval) {
    points.push(t);
    if (points.length >= maxFrames) break;
  }

  return points;
}

export async function extractVideoFrames(
  file: File,
  config: Partial<FrameExtractionConfig> = {}
): Promise<ExtractedFrame[]> {
  if (typeof document === "undefined") return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  const url = URL.createObjectURL(file);
  const frames: ExtractedFrame[] = [];

  try {
    video.src = url;
    await waitForVideoEvent(video, "loadedmetadata", 6000);

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) return [];

    const seekPoints = computeSeekPoints(duration, cfg);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    let previousHash: string | null = null;
    let frameIndex = 0;

    for (let i = 0; i < seekPoints.length; i++) {
      const timeSec = seekPoints[i];

      try {
        await seekVideo(video, timeSec);
      } catch {
        continue;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Blank detection
      const blank = isBlankFrame(imageData, cfg.blankThreshold);
      if (blank && cfg.skipBlankFrames) {
        cfg.onProgress?.(i + 1, seekPoints.length, timeSec);
        continue;
      }

      // Scene change detection via dHash comparison
      const currentHash = dHashFromImageSource(video, video.videoWidth, video.videoHeight);
      let isScene = false;

      if (currentHash && previousHash) {
        const distance = hammingDistanceHex(currentHash, previousHash);
        isScene = Number.isFinite(distance) && distance > (cfg.sceneChangeThreshold ?? 12);
      }

      if (cfg.mode === "scene-change" && !isScene && previousHash !== null) {
        previousHash = currentHash;
        cfg.onProgress?.(i + 1, seekPoints.length, timeSec);
        continue;
      }

      previousHash = currentHash;

      frames.push({
        timeSec,
        imageData,
        isSceneChange: isScene,
        isBlank: blank,
        index: frameIndex++,
      });

      cfg.onProgress?.(i + 1, seekPoints.length, timeSec);

      // Yield to prevent UI blocking every 20 frames
      if (frameIndex % 20 === 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }

      if (frames.length >= (cfg.maxFrames ?? 120)) break;
    }
  } catch {
    return frames;
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
  }

  return frames;
}

export async function extractVideoFingerprints(
  file: File,
  onProgress?: (extracted: number, total: number) => void
): Promise<MediaFingerprint[]> {
  const hashConfig: MultiHashConfig = {
    algorithms: ["dhash", "phash", "ahash", "color-histogram"],
    includeRotations: false,
    includeQuadrants: false,
  };

  const frames = await extractVideoFrames(file, {
    mode: "adaptive",
    framesPerSecond: 1,
    maxFrames: 120,
    skipBlankFrames: true,
    sceneChangeThreshold: 12,
    onProgress: onProgress
      ? (extracted, total) => onProgress(extracted, total)
      : undefined,
  });

  if (typeof document === "undefined") return [];

  const fingerprints: MediaFingerprint[] = [];
  const canvas = document.createElement("canvas");

  for (const frame of frames) {
    canvas.width = frame.imageData.width;
    canvas.height = frame.imageData.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    ctx.putImageData(frame.imageData, 0, 0);

    const result = computeMultiHash(canvas, canvas.width, canvas.height, hashConfig);

    const label = frame.isSceneChange
      ? `video-scene-${frame.timeSec.toFixed(1)}s`
      : `video-${frame.timeSec.toFixed(1)}s`;

    fingerprints.push({
      kind: "video-frame",
      frameLabel: label,
      frameTimestamp: frame.timeSec,
      hashes: result.primary,
      isSceneChange: frame.isSceneChange,
      isBlankFrame: frame.isBlank,
    });
  }

  return fingerprints;
}

/** Legacy 4-frame extraction for backward compatibility */
export async function computeVideoFrameDHashesLegacy(file: File): Promise<MediaFingerprint[]> {
  if (typeof document === "undefined") return [];

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
    if (duration <= 0) return [];

    const checkpoints = [0.08, 0.3, 0.58, 0.86];
    for (const ratio of checkpoints) {
      const at = Math.min(Math.max(0.01, duration * ratio), Math.max(0.02, duration - 0.02));
      await seekVideo(video, at);
      const hash = dHashFromImageSource(video, video.videoWidth, video.videoHeight);
      if (!hash) continue;
      fingerprints.push({
        kind: "video-frame",
        frameLabel: `video-${Math.round(ratio * 100)}%`,
        hashes: [{ algorithm: "dhash", value: hash, bitLength: 64 }],
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
