import type { Dataset, DataPoint } from '@/types';
import carDataRaw from '@/data/car-data.json';

/** Level 1 dataset: Car weight vs MPG (30 points, no outliers) */
export const carDataset: Dataset = {
  points: carDataRaw.points as DataPoint[],
  xLabel: carDataRaw.xLabel,
  yLabel: carDataRaw.yLabel,
  xRange: carDataRaw.xRange as [number, number],
  yRange: carDataRaw.yRange as [number, number],
};

/** Level 2 dataset: Car data + 3 outlier points (heavy cars with unusually high MPG) */
export function getLevel2Dataset(): Dataset {
  const outliers: DataPoint[] = [
    { x: 4.6, y: 32, isOutlier: true },
    { x: 4.8, y: 28, isOutlier: true },
    { x: 4.3, y: 30, isOutlier: true },
  ];

  return {
    ...carDataset,
    points: [...carDataset.points, ...outliers],
  };
}

/**
 * Deterministic synthetic dataset for Levels 3-5.
 * Single-valley landscape with known minimum.
 */
export function getSyntheticDataset(seed: number = 42): Dataset {
  const points: DataPoint[] = [];
  const trueWeight = -8;
  const trueBias = 45;

  // Deterministic pseudo-random using seed
  let rngState = seed;
  function nextRandom(): number {
    rngState = (rngState * 16807 + 0) % 2147483647;
    return rngState / 2147483647;
  }

  for (let i = 0; i < 25; i++) {
    const x = 1.5 + (i / 24) * 4;
    const noise = (nextRandom() - 0.5) * 6;
    const y = trueWeight * x + trueBias + noise;
    points.push({ x: Math.round(x * 100) / 100, y: Math.round(y * 10) / 10 });
  }

  return {
    points,
    xLabel: 'X',
    yLabel: 'Y',
    xRange: [1, 6],
    yRange: [0, 45],
  };
}

/** Level 5 dataset: Different from Level 3/4, deterministic */
export function getLevel5Dataset(): Dataset {
  return getSyntheticDataset(123);
}
