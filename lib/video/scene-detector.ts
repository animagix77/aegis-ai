import { hammingDistanceHex } from "@/lib/hashing/hamming";

export type SceneChange = {
  timeSec: number;
  hammingDistance: number;
  confidence: number;
};

export function detectSceneChange(
  currentHash: string,
  previousHash: string,
  timeSec: number,
  threshold = 12
): SceneChange | null {
  const distance = hammingDistanceHex(currentHash, previousHash);
  if (!Number.isFinite(distance) || distance <= threshold) {
    return null;
  }

  const confidence = Math.min(100, Math.round(50 + (distance - threshold) * 5));
  return { timeSec, hammingDistance: distance, confidence };
}

export function findSceneBoundaries(
  hashes: { timeSec: number; hash: string }[],
  threshold = 12
): SceneChange[] {
  const boundaries: SceneChange[] = [];

  for (let i = 1; i < hashes.length; i++) {
    const change = detectSceneChange(
      hashes[i].hash,
      hashes[i - 1].hash,
      hashes[i].timeSec,
      threshold
    );
    if (change) {
      boundaries.push(change);
    }
  }

  return boundaries;
}
