import { createResizedCanvas, getGrayscaleMatrix, bitsToHex } from "./canvas-utils";

const DCT_SIZE = 32;
const HASH_SIZE = 8;

function dct1d(signal: number[], n: number): number[] {
  const result = new Array<number>(n);
  for (let k = 0; k < n; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += signal[i] * Math.cos((Math.PI * (2 * i + 1) * k) / (2 * n));
    }
    result[k] = sum;
  }
  return result;
}

function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const result: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = 0; r < rows; r++) {
      row.push(matrix[r][c]);
    }
    result.push(row);
  }
  return result;
}

function dct2d(matrix: number[][], n: number): number[][] {
  const rowsDct = matrix.map((row) => dct1d(row, n));
  const transposed = transpose(rowsDct);
  const colsDct = transposed.map((col) => dct1d(col, n));
  return transpose(colsDct);
}

export function computePHash(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  hashSize = HASH_SIZE
): string | null {
  const result = createResizedCanvas(source, sourceWidth, sourceHeight, DCT_SIZE, DCT_SIZE);
  if (!result) return null;

  const { imageData } = result;
  const gray = getGrayscaleMatrix(imageData, DCT_SIZE, DCT_SIZE);
  const dctResult = dct2d(gray, DCT_SIZE);

  const lowFreq: number[] = [];
  for (let y = 0; y < hashSize; y++) {
    for (let x = 0; x < hashSize; x++) {
      if (x === 0 && y === 0) continue;
      lowFreq.push(dctResult[y][x]);
    }
  }

  const sorted = [...lowFreq].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const bits = lowFreq.map((v) => (v >= median ? 1 : 0));
  // pad to 64 bits (we have 63 from skipping DC)
  bits.push(0);
  return bitsToHex(bits);
}
