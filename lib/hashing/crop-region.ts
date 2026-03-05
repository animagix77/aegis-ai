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

const QUADRANTS = ["TL", "TR", "BL", "BR"] as const;

export function computeQuadrantHashes(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  algorithms: HashAlgorithm[]
): PerceptualHash[] {
  if (typeof document === "undefined" || !sourceWidth || !sourceHeight) {
    return [];
  }

  const halfW = Math.floor(sourceWidth / 2);
  const halfH = Math.floor(sourceHeight / 2);
  if (halfW < 8 || halfH < 8) return [];

  const offsets: [number, number][] = [
    [0, 0],
    [halfW, 0],
    [0, halfH],
    [halfW, halfH],
  ];

  const results: PerceptualHash[] = [];

  for (let q = 0; q < 4; q++) {
    const [sx, sy] = offsets[q];
    const canvas = document.createElement("canvas");
    canvas.width = halfW;
    canvas.height = halfH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    ctx.drawImage(source, sx, sy, halfW, halfH, 0, 0, halfW, halfH);

    for (const alg of algorithms) {
      const fn = HASH_FNS[alg];
      const hash = fn(canvas, halfW, halfH);
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
