import { grayscaleAt, bitsToHex } from "./canvas-utils";

export function dHashFromImageSource(
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
