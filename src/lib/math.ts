import type { DataPoint, LossFunction } from '@/types';

/** Compute Mean Absolute Error */
export function computeMAE(
  points: DataPoint[],
  weight: number,
  bias: number
): number {
  if (points.length === 0) return 0;
  const totalError = points.reduce((sum, point) => {
    const predicted = weight * point.x + bias;
    return sum + Math.abs(point.y - predicted);
  }, 0);
  return totalError / points.length;
}

/** Compute Mean Squared Error */
export function computeMSE(
  points: DataPoint[],
  weight: number,
  bias: number
): number {
  if (points.length === 0) return 0;
  const totalError = points.reduce((sum, point) => {
    const predicted = weight * point.x + bias;
    return sum + (point.y - predicted) ** 2;
  }, 0);
  return totalError / points.length;
}

/** Compute loss using specified function */
export function computeLoss(
  points: DataPoint[],
  weight: number,
  bias: number,
  lossFunction: LossFunction
): number {
  return lossFunction === 'mse'
    ? computeMSE(points, weight, bias)
    : computeMAE(points, weight, bias);
}

/** Compute per-point errors (signed) */
export function computeErrors(
  points: DataPoint[],
  weight: number,
  bias: number
): number[] {
  return points.map((point) => point.y - (weight * point.x + bias));
}

/** Compute gradient of loss w.r.t. weight and bias */
export function computeGradient(
  points: DataPoint[],
  weight: number,
  bias: number,
  lossFunction: LossFunction
): { dw: number; db: number } {
  if (points.length === 0) return { dw: 0, db: 0 };

  const numberOfPoints = points.length;

  if (lossFunction === 'mse') {
    let dw = 0;
    let db = 0;
    for (const point of points) {
      const predicted = weight * point.x + bias;
      const error = predicted - point.y;
      dw += 2 * error * point.x;
      db += 2 * error;
    }
    return { dw: dw / numberOfPoints, db: db / numberOfPoints };
  }

  // MAE: subgradient
  let dw = 0;
  let db = 0;
  for (const point of points) {
    const predicted = weight * point.x + bias;
    const error = predicted - point.y;
    const sign = error > 0 ? 1 : error < 0 ? -1 : 0;
    dw += sign * point.x;
    db += sign;
  }
  return { dw: dw / numberOfPoints, db: db / numberOfPoints };
}

/** Compute batch gradient using a subset of points */
export function computeBatchGradient(
  points: DataPoint[],
  batchIndices: number[],
  weight: number,
  bias: number,
  lossFunction: LossFunction = 'mse'
): { dw: number; db: number } {
  const batchPoints = batchIndices.map((i) => points[i]);
  return computeGradient(batchPoints, weight, bias, lossFunction);
}

/** Take one gradient descent step */
export function stepGradientDescent(
  weight: number,
  bias: number,
  gradient: { dw: number; db: number },
  learningRate: number
): { weight: number; bias: number } {
  return {
    weight: weight - learningRate * gradient.dw,
    bias: bias - learningRate * gradient.db,
  };
}

/** Select random batch indices */
export function selectBatchIndices(
  datasetSize: number,
  batchSize: number
): number[] {
  const indices = Array.from({ length: datasetSize }, (_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, batchSize);
}

/** Compute number of stars earned based on a score and thresholds (lower score is better) */
export function computeStars(
  score: number,
  thresholds: { one: number; two: number; three: number }
): number {
  if (score <= thresholds.three) return 3;
  if (score <= thresholds.two) return 2;
  if (score <= thresholds.one) return 1;
  return 0;
}
