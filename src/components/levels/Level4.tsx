import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LevelLayout } from '@/components/layout/LevelLayout';
import { Scatterplot } from '@/components/canvas/Scatterplot';
import { LossCurve } from '@/components/canvas/LossCurve';
import { BatchScatterplot } from '@/components/canvas/BatchScatterplot';
import { Slider } from '@/components/ui/Slider';
import { RevealModal } from '@/components/ui/RevealModal';
import { getSyntheticDataset } from '@/lib/datasets';
import {
  computeMSE,
  computeBatchGradient,
  stepGradientDescent,
  selectBatchIndices,
  computeStars,
} from '@/lib/math';
import { STAR_THRESHOLDS, LEVEL4_BUDGET, LEVEL4_LEARNING_RATE } from '@/lib/constants';
import type { TrainingStep } from '@/types';

interface Level4Props {
  onComplete: (stars: number, score: number) => void;
  onEarnStar: (stars: number) => void;
  existingStars: number;
}

function getCompassLabel(batchSize: number): { label: string; color: string } {
  if (batchSize <= 3) return { label: 'Very Noisy', color: '#EF4444' };
  if (batchSize <= 8) return { label: 'Noisy', color: '#F59E0B' };
  if (batchSize <= 15) return { label: 'Moderate', color: '#EAB308' };
  return { label: 'Reliable', color: '#10B981' };
}

export function Level4({ onComplete, onEarnStar, existingStars }: Level4Props) {
  const dataset = useMemo(() => getSyntheticDataset(), []);
  const datasetSize = dataset.points.length;

  const [batchSize, setBatchSize] = useState(5);
  const [weight, setWeight] = useState(0);
  const [bias, setBias] = useState(20);
  const [coinsLeft, setCoinsLeft] = useState(LEVEL4_BUDGET);
  const [steps, setSteps] = useState<TrainingStep[]>([]);
  const [activeBatchIndices, setActiveBatchIndices] = useState<number[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [epochCount, setEpochCount] = useState(0);
  const [stepsThisEpoch, setStepsThisEpoch] = useState(0);

  const currentLoss = useMemo(
    () => computeMSE(dataset.points, weight, bias),
    [dataset.points, weight, bias]
  );

  const stepsRemaining = Math.floor(coinsLeft / batchSize);
  const stepsPerEpoch = Math.ceil(datasetSize / batchSize);

  const currentStars = useMemo(
    () => computeStars(currentLoss, STAR_THRESHOLDS.level4),
    [currentLoss]
  );

  const displayStars = Math.max(currentStars, existingStars);

  const previousStarsRef = useRef(existingStars);
  useEffect(() => {
    if (displayStars > previousStarsRef.current) {
      previousStarsRef.current = displayStars;
      onEarnStar(displayStars);
    }
  }, [displayStars, onEarnStar]);

  const compassInfo = useMemo(() => getCompassLabel(batchSize), [batchSize]);

  const handleStep = useCallback(() => {
    if (coinsLeft < batchSize || levelComplete) return;

    // Select random batch
    const batchIndices = selectBatchIndices(datasetSize, batchSize);
    setActiveBatchIndices(batchIndices);

    // Compute batch gradient and step
    const gradient = computeBatchGradient(
      dataset.points,
      batchIndices,
      weight,
      bias,
      'mse'
    );
    const result = stepGradientDescent(weight, bias, gradient, LEVEL4_LEARNING_RATE);
    const newWeight = result.weight;
    const newBias = result.bias;

    setWeight(newWeight);
    setBias(newBias);
    setCoinsLeft((prev) => prev - batchSize);

    const newStepCount = stepCount + 1;
    setStepCount(newStepCount);

    const newStepsThisEpoch = stepsThisEpoch + 1;
    if (newStepsThisEpoch >= stepsPerEpoch) {
      setEpochCount((prev) => prev + 1);
      setStepsThisEpoch(0);
    } else {
      setStepsThisEpoch(newStepsThisEpoch);
    }

    const newLoss = computeMSE(dataset.points, newWeight, newBias);
    const newStep: TrainingStep = {
      step: newStepCount,
      weight: newWeight,
      bias: newBias,
      loss: newLoss,
    };
    setSteps((prev) => [...prev, newStep]);

    // Check if budget exhausted
    if (coinsLeft - batchSize < batchSize) {
      setLevelComplete(true);
    }
  }, [
    coinsLeft,
    batchSize,
    levelComplete,
    datasetSize,
    dataset.points,
    weight,
    bias,
    stepCount,
    stepsThisEpoch,
    stepsPerEpoch,
  ]);

  const handleComplete = useCallback(() => {
    setShowReveal(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    onComplete(displayStars, currentLoss);
  }, [onComplete, displayStars, currentLoss]);

  const revealItems = useMemo(
    () => [
      {
        text: 'You just trained a model using batches — the same way real machine learning works!',
      },
      {
        text: '"Batch size" is how many data points you look at in each step. It\'s a random subset of the full dataset.',
        highlight: true,
      },
      {
        text: 'Small batches (1-3 points): Each step is fast and cheap, but the gradient direction is noisy — like a shaky compass. You can take many steps, but they zigzag.',
      },
      {
        text: 'Large batches (15+ points): Each step gives a reliable gradient direction, but costs more compute. You can take fewer total steps.',
        highlight: true,
      },
      {
        text: '"Stochastic" in SGD means "randomly determined" — each batch is a random sample, so each gradient is slightly different.',
        highlight: true,
      },
      {
        text: 'A "data pass" (epoch) means you\'ve looked at every data point once. With batch size 5 and 25 points, 1 pass = 5 steps.',
      },
      {
        text: 'The tradeoff: small batches let you take more steps but each step is noisier. Big batches give better direction but you can take fewer steps. Finding the sweet spot is key!',
        highlight: true,
      },
    ],
    []
  );

  return (
    <>
      <LevelLayout
        levelName="Level 4: The Batch"
        score={currentLoss}
        scoreLabel="Loss (MSE)"
        stars={displayStars}
        mainContent={
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Scatterplot
                points={dataset.points}
                weight={weight}
                bias={bias}
                xRange={dataset.xRange}
                yRange={dataset.yRange}
                xLabel={dataset.xLabel}
                yLabel={dataset.yLabel}
                width={340}
                height={300}
                showWhiskers={false}
              />
              <LossCurve
                steps={steps}
                maxSteps={Math.max(50, steps.length + 10)}
                width={340}
                height={300}
              />
            </div>
          </div>
        }
        controlsContent={
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-charcoal/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Mission
              </h2>
              <p className="text-sm leading-relaxed text-warm-gray-300">
                You have a compute budget. Each step uses your batch to
                compute a gradient. Bigger batches give better direction but
                you can take fewer total steps. Minimize the loss!
              </p>
            </div>

            <Slider
              label="Batch Size"
              value={batchSize}
              min={1}
              max={datasetSize}
              step={1}
              onChange={(value) => {
                if (!levelComplete) setBatchSize(Math.round(value));
              }}
              color="#8B5CF6"
            />

            {/* Compass reliability badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-warm-gray-500">
                Gradient Quality:
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  color: compassInfo.color,
                  backgroundColor: `${compassInfo.color}20`,
                  border: `1px solid ${compassInfo.color}40`,
                }}
              >
                {compassInfo.label}
              </span>
            </div>

            {/* Batch scatterplot */}
            <BatchScatterplot
              points={dataset.points}
              activeBatchIndices={activeBatchIndices}
              batchSize={batchSize}
              width={260}
              height={140}
            />

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center">
                <p className="text-xs text-warm-gray-500">Steps Remaining</p>
                <p className="font-mono text-lg font-bold text-warm-gray-200">
                  {stepsRemaining}
                </p>
              </div>
              <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center">
                <p className="text-xs text-warm-gray-500">Steps Taken</p>
                <p className="font-mono text-lg font-bold text-warm-gray-200">
                  {stepCount}
                </p>
              </div>
              <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center">
                <p className="text-xs text-warm-gray-500">Data Passes</p>
                <p className="font-mono text-lg font-bold text-warm-gray-200">
                  {epochCount}
                </p>
                <p className="text-[10px] text-warm-gray-600">
                  1 pass = {stepsPerEpoch} steps
                </p>
              </div>
              <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center">
                <p className="text-xs text-warm-gray-500">Batch Size</p>
                <p className="font-mono text-lg font-bold text-purple">
                  {batchSize} / {datasetSize}
                </p>
              </div>
            </div>

            {!levelComplete && (
              <button
                onClick={handleStep}
                disabled={coinsLeft < batchSize}
                className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                Step
              </button>
            )}

            {levelComplete && (
              <button
                onClick={handleComplete}
                className="rounded-lg bg-emerald px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-dark focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-charcoal"
              >
                Complete Level
              </button>
            )}

            {/* Vocabulary */}
            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Key Terms
              </h3>
              <dl className="space-y-1 text-xs">
                <div>
                  <dt className="inline font-semibold text-amber">
                    Batch:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    A random subset of the data used for one gradient step
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">
                    Epoch:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    One full pass through every data point
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">
                    Stochastic:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    Randomly determined — each batch is random
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        }
      />

      {showReveal && (
        <RevealModal
          title="The Reveal"
          items={revealItems}
          onComplete={handleRevealComplete}
        />
      )}
    </>
  );
}
