import type { HashAlgorithm, PerceptualHash } from "@/lib/types";
import { dHashFromImageSource } from "./dhash";
import { computeAHash } from "./ahash";
import { computePHash } from "./phash";
import { computeColorHistogramHash } from "./color-histogram";

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

export function computeRotationVariants(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  algorithms: HashAlgorithm[]
): PerceptualHash[] {
  if (typeof document === "undefined" || !sourceWidth || !sourceHeight) {
    return [];
  }

  const results: PerceptualHash[] = [];
  const rotations = [90, 180, 270] as const;

  for (const degrees of rotations) {
    const radians = (degrees * Math.PI) / 180;
    const isSwapped = degrees === 90 || degrees === 270;
    const canvasW = isSwapped ? sourceHeight : sourceWidth;
    const canvasH = isSwapped ? sourceWidth : sourceHeight;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(radians);
    ctx.drawImage(source, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);

    for (const alg of algorithms) {
      const fn = HASH_FNS[alg];
      const hash = fn(canvas, canvasW, canvasH);
      if (hash) {
        results.push({
          algorithm: alg,
          value: hash,
          bitLength: BIT_LENGTHS[alg],
        });
      }
    }
  }

  return results;
}
