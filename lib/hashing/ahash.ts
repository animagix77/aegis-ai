import { createResizedCanvas, grayscaleAt, bitsToHex } from "./canvas-utils";

export function computeAHash(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  size = 8
): string | null {
  const result = createResizedCanvas(source, sourceWidth, sourceHeight, size, size);
  if (!result) return null;

  const { imageData } = result;
  const data = imageData.data;
  const values: number[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      values.push(grayscaleAt(data, size, x, y));
    }
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const bits = values.map((v) => (v >= mean ? 1 : 0));
  return bitsToHex(bits);
}
