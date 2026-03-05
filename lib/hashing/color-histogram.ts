import { createResizedCanvas, bitsToHex } from "./canvas-utils";

const HIST_SIZE = 64;
const BINS_PER_CHANNEL = 16;
const TOTAL_BINS = BINS_PER_CHANNEL * 3; // 48 bins for R, G, B

export function computeColorHistogramHash(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
): string | null {
  const result = createResizedCanvas(source, sourceWidth, sourceHeight, HIST_SIZE, HIST_SIZE);
  if (!result) return null;

  const { imageData } = result;
  const data = imageData.data;
  const bins = new Float64Array(TOTAL_BINS);
  const pixelCount = HIST_SIZE * HIST_SIZE;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    bins[Math.min(Math.floor(r / 16), BINS_PER_CHANNEL - 1)] += 1;
    bins[BINS_PER_CHANNEL + Math.min(Math.floor(g / 16), BINS_PER_CHANNEL - 1)] += 1;
    bins[2 * BINS_PER_CHANNEL + Math.min(Math.floor(b / 16), BINS_PER_CHANNEL - 1)] += 1;
  }

  // normalize
  for (let i = 0; i < TOTAL_BINS; i++) {
    bins[i] /= pixelCount;
  }

  // compute median
  const sorted = [...bins].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // generate bits (48 bits, pad to 64)
  const bits: number[] = [];
  for (let i = 0; i < TOTAL_BINS; i++) {
    bits.push(bins[i] >= median ? 1 : 0);
  }
  // pad to 64 bits
  while (bits.length < 64) {
    bits.push(0);
  }

  return bitsToHex(bits);
}
