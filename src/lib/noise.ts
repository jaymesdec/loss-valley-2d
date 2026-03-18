/**
 * Simple 1D Perlin-like noise for compass arrow jitter.
 * Uses a sine-based approach for simplicity.
 * Amplitude is proportional to 1/sqrt(batchSize).
 */

// Permutation table for noise
const PERM = new Uint8Array(256);
for (let i = 0; i < 256; i++) PERM[i] = i;
// Shuffle with fixed seed
let rngSeed = 42;
for (let i = 255; i > 0; i--) {
  rngSeed = (rngSeed * 16807) % 2147483647;
  const j = rngSeed % (i + 1);
  [PERM[i], PERM[j]] = [PERM[j], PERM[i]];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad1d(hash: number, x: number): number {
  return (hash & 1) === 0 ? x : -x;
}

/** 1D Perlin noise, returns value in [-1, 1] */
export function noise1d(x: number): number {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = fade(xf);

  const hashA = PERM[xi];
  const hashB = PERM[(xi + 1) & 255];

  return lerp(grad1d(hashA, xf), grad1d(hashB, xf - 1), u);
}

/**
 * Compute compass jitter angle based on time and batch size.
 * Amplitude = baseAmplitude / sqrt(batchSize)
 * At full batch: essentially 0. At batch=1: maximum jitter.
 */
export function computeCompassJitter(
  time: number,
  batchSize: number,
  datasetSize: number,
  baseAmplitude: number = 0.8
): number {
  if (batchSize >= datasetSize) return 0;

  const amplitude = baseAmplitude / Math.sqrt(batchSize);
  // Use multiple frequencies for organic-feeling noise
  const noiseValue =
    noise1d(time * 2) * 0.6 +
    noise1d(time * 5) * 0.3 +
    noise1d(time * 11) * 0.1;

  return noiseValue * amplitude;
}
