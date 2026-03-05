export function grayscaleAt(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const idx = (y * width + x) * 4;
  const r = data[idx] ?? 0;
  const g = data[idx + 1] ?? 0;
  const b = data[idx + 2] ?? 0;
  return r * 0.299 + g * 0.587 + b * 0.114;
}

export function bitsToHex(bits: number[]) {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    const nibble =
      ((bits[i] ?? 0) << 3) |
      ((bits[i + 1] ?? 0) << 2) |
      ((bits[i + 2] ?? 0) << 1) |
      (bits[i + 3] ?? 0);
    hex += nibble.toString(16);
  }
  return hex;
}

export function createResizedCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; imageData: ImageData } | null {
  if (typeof document === "undefined" || !sourceWidth || !sourceHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  return { canvas, ctx, imageData };
}

export function getGrayscaleMatrix(imageData: ImageData, width: number, height: number): number[][] {
  const data = imageData.data;
  const matrix: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(grayscaleAt(data, width, x, y));
    }
    matrix.push(row);
  }
  return matrix;
}

export function isBlankFrame(imageData: ImageData, threshold = 5): boolean {
  const data = imageData.data;
  const pixelCount = imageData.width * imageData.height;
  if (pixelCount === 0) return true;

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] ?? 0) * 0.299 + (data[i + 1] ?? 0) * 0.587 + (data[i + 2] ?? 0) * 0.114;
    sum += gray;
    sumSq += gray * gray;
  }

  const mean = sum / pixelCount;
  const variance = sumSq / pixelCount - mean * mean;
  return variance < threshold;
}
