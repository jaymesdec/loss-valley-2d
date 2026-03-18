import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LevelLayout } from '@/components/layout/LevelLayout';
import { Scatterplot } from '@/components/canvas/Scatterplot';
import { LossCurve } from '@/components/canvas/LossCurve';
import { RevealModal } from '@/components/ui/RevealModal';
import { getSyntheticDataset } from '@/lib/datasets';
import { computeMSE, computeGradient, stepGradientDescent, computeStars } from '@/lib/math';
import { STAR_THRESHOLDS, TIMING } from '@/lib/constants';
import type { TrainingStep } from '@/types';

interface Level3Props {
  onComplete: (stars: number, score: number) => void;
  onEarnStar: (stars: number) => void;
  existingStars: number;
}

const TRAINING_STEPS = 30;

interface RunConfig {
  label: string;
  description: string;
  learningRate: number;
  color: string;
  expectedOutcome: 'finds_fit' | 'goes_crazy';
}

const RUNS: RunConfig[] = [
  {
    label: 'Tiny Steps',
    description: 'The computer can only nudge the slope and intercept a tiny amount each try.',
    learningRate: 0.001,
    color: '#4682B4',
    expectedOutcome: 'finds_fit',
  },
  {
    label: 'Medium Steps',
    description: 'The computer can adjust the slope and intercept a moderate amount each try.',
    learningRate: 0.01,
    color: '#10B981',
    expectedOutcome: 'finds_fit',
  },
  {
    label: 'Huge Steps',
    description: 'The computer can make big jumps to the slope and intercept each try.',
    learningRate: 0.1,
    color: '#EF4444',
    expectedOutcome: 'goes_crazy',
  },
];

type Prediction = 'finds_fit' | 'goes_crazy' | null;

export function Level3({ onComplete, onEarnStar, existingStars }: Level3Props) {
  const dataset = useMemo(() => getSyntheticDataset(), []);

  const [currentRunIndex, setCurrentRunIndex] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([null, null, null]);
  const [runResults, setRunResults] = useState<TrainingStep[][]>([[], [], []]);
  const [isRunning, setIsRunning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [allRunsComplete, setAllRunsComplete] = useState(false);
  const runningRef = useRef(false);

  const currentRun = RUNS[currentRunIndex];
  const currentPrediction = predictions[currentRunIndex];
  const currentSteps = runResults[currentRunIndex];

  const latestStep = currentSteps.length > 0 ? currentSteps[currentSteps.length - 1] : null;
  const displayWeight = latestStep?.weight ?? 0;
  const displayBias = latestStep?.bias ?? 20;

  const startRun = useCallback(() => {
    if (isRunning || currentPrediction === null) return;
    setIsRunning(true);
    runningRef.current = true;

    const learningRate = currentRun.learningRate;
    let currentWeight = 0;
    let currentBias = 20;
    let stepCount = 0;

    const initialLoss = computeMSE(dataset.points, currentWeight, currentBias);
    const initialStep: TrainingStep = {
      step: 0,
      weight: currentWeight,
      bias: currentBias,
      loss: initialLoss,
    };

    setRunResults((prev) => {
      const updated = [...prev];
      updated[currentRunIndex] = [initialStep];
      return updated;
    });

    const intervalId = setInterval(() => {
      if (!runningRef.current) {
        clearInterval(intervalId);
        return;
      }

      stepCount++;
      const gradient = computeGradient(dataset.points, currentWeight, currentBias, 'mse');
      const result = stepGradientDescent(currentWeight, currentBias, gradient, learningRate);
      currentWeight = result.weight;
      currentBias = result.bias;

      const loss = computeMSE(dataset.points, currentWeight, currentBias);
      const newStep: TrainingStep = {
        step: stepCount,
        weight: currentWeight,
        bias: currentBias,
        loss: Math.min(loss, 10000),
      };

      setRunResults((prev) => {
        const updated = [...prev];
        updated[currentRunIndex] = [...updated[currentRunIndex], newStep];
        return updated;
      });

      if (stepCount >= TRAINING_STEPS) {
        clearInterval(intervalId);
        runningRef.current = false;
        setIsRunning(false);
      }
    }, TIMING.trainingStepInterval);

    return () => {
      clearInterval(intervalId);
      runningRef.current = false;
    };
  }, [isRunning, currentPrediction, currentRun.learningRate, currentRunIndex, dataset.points]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  const handlePrediction = useCallback(
    (prediction: 'finds_fit' | 'goes_crazy') => {
      setPredictions((prev) => {
        const updated = [...prev];
        updated[currentRunIndex] = prediction;
        return updated;
      });
    },
    [currentRunIndex]
  );

  const handleNextRun = useCallback(() => {
    if (currentRunIndex < RUNS.length - 1) {
      setCurrentRunIndex((prev) => prev + 1);
    } else {
      setAllRunsComplete(true);
    }
  }, [currentRunIndex]);

  const correctPredictions = useMemo(() => {
    if (!allRunsComplete) return 0;
    return RUNS.reduce((count, run, index) => {
      return predictions[index] === run.expectedOutcome ? count + 1 : count;
    }, 0);
  }, [allRunsComplete, predictions]);

  const currentStars = useMemo(() => {
    if (!allRunsComplete) return 0;
    return computeStars(4 - correctPredictions, STAR_THRESHOLDS.level3);
  }, [allRunsComplete, correctPredictions]);

  const displayStars = Math.max(currentStars, existingStars);

  useEffect(() => {
    if (displayStars > existingStars) {
      onEarnStar(displayStars);
    }
  }, [displayStars, existingStars, onEarnStar]);

  const isCurrentRunDone = currentSteps.length > TRAINING_STEPS;

  const getResultLabel = useCallback(
    (runIndex: number): string | null => {
      const steps = runResults[runIndex];
      if (steps.length <= TRAINING_STEPS) return null;

      const finalLoss = steps[steps.length - 1].loss;
      const initialLoss = steps[0].loss;
      const didGoCrazy = finalLoss > initialLoss * 0.8 || finalLoss > 500;
      const actualOutcome: 'finds_fit' | 'goes_crazy' = didGoCrazy
        ? 'goes_crazy'
        : 'finds_fit';
      const predicted = predictions[runIndex];
      return predicted === actualOutcome ? 'Correct!' : 'Not quite';
    },
    [runResults, predictions]
  );

  const getPredictionDisplayText = (prediction: Prediction): string => {
    if (prediction === 'finds_fit') return 'finds a good fit';
    if (prediction === 'goes_crazy') return 'goes crazy';
    return '';
  };

  const handleComplete = useCallback(() => {
    setShowReveal(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    onComplete(displayStars, correctPredictions);
  }, [onComplete, displayStars, correctPredictions]);

  const revealItems = useMemo(
    () => [
      {
        text: `You predicted ${correctPredictions} out of 3 correctly!`,
        highlight: true,
      },
      {
        text: 'That "step size" setting is actually called the learning rate. It controls how much the slope and intercept can change on each try.',
        highlight: true,
      },
      {
        text: 'Tiny step size (0.001): The line barely moves each try. It will eventually get there, but it takes forever.',
      },
      {
        text: 'Good step size (0.01): The line adjusts at a nice pace and settles into a good fit.',
      },
      {
        text: 'Huge step size (0.1): The line jumps so far that it flies right past the best fit and bounces around! The loss goes UP instead of down.',
      },
      {
        text: 'This process — automatically adjusting the line step-by-step to reduce error — is called gradient descent. "Gradient" means "which direction reduces the error."',
        highlight: true,
      },
      {
        text: 'Picking the right learning rate is one of the most important decisions in machine learning. Too small = slow. Too big = chaos.',
      },
    ],
    [correctPredictions]
  );

  return (
    <>
      <LevelLayout
        levelName="Level 3: The Descent"
        stars={displayStars}
        mainContent={
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Scatterplot
                points={dataset.points}
                weight={displayWeight}
                bias={displayBias}
                xRange={dataset.xRange}
                yRange={dataset.yRange}
                xLabel={dataset.xLabel}
                yLabel={dataset.yLabel}
                width={340}
                height={300}
                showWhiskers={false}
              />
              <LossCurve
                steps={currentSteps}
                maxSteps={TRAINING_STEPS}
                width={340}
                height={300}
              />
            </div>

            {/* Mini loss curves from completed runs */}
            {currentRunIndex > 0 && (
              <div className="flex gap-3">
                {RUNS.slice(0, currentRunIndex).map((run, index) => (
                  <div key={run.label} className="text-center">
                    <p className="mb-1 text-xs" style={{ color: run.color }}>
                      {run.label}
                    </p>
                    <LossCurve
                      steps={runResults[index]}
                      maxSteps={TRAINING_STEPS}
                      width={160}
                      height={100}
                    />
                    {getResultLabel(index) && (
                      <p
                        className={`mt-1 text-xs font-semibold ${
                          getResultLabel(index) === 'Correct!'
                            ? 'text-emerald'
                            : 'text-crimson'
                        }`}
                      >
                        {getResultLabel(index)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        controlsContent={
          <div className="flex flex-col gap-5">
            <div className="rounded-lg bg-charcoal/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Mission
              </h2>
              <p className="text-sm leading-relaxed text-warm-gray-300">
                In Level 1 you moved the line by hand. Now the computer will
                adjust the line automatically — but you control the{' '}
                <strong className="text-warm-gray-100">step size</strong>:
                how much the slope and intercept can change on each try.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray-300">
                Watch 3 different step sizes. Before each run, predict what
                will happen!
              </p>
            </div>

            {/* Current run info */}
            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Run {currentRunIndex + 1} of {RUNS.length}
              </h3>
              <p className="text-lg font-semibold" style={{ color: currentRun.color }}>
                {currentRun.label}
              </p>
              <p className="mt-1 text-xs text-warm-gray-400">
                {currentRun.description}
              </p>
            </div>

            {/* Prediction phase */}
            {currentPrediction === null && !isRunning && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-warm-gray-300">
                  With {currentRun.label.toLowerCase()}, will the line...
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrediction('finds_fit')}
                    className="flex-1 rounded-lg border border-emerald bg-emerald/10 px-3 py-2 text-sm font-medium text-emerald transition-colors hover:bg-emerald/20"
                  >
                    Find a good fit
                  </button>
                  <button
                    onClick={() => handlePrediction('goes_crazy')}
                    className="flex-1 rounded-lg border border-crimson bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson transition-colors hover:bg-crimson/20"
                  >
                    Go crazy
                  </button>
                </div>
              </div>
            )}

            {/* Run button */}
            {currentPrediction !== null && !isRunning && !isCurrentRunDone && (
              <button
                onClick={startRun}
                className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
              >
                Let It Run!
              </button>
            )}

            {/* Running status */}
            {isRunning && (
              <div className="rounded-lg bg-charcoal-light/50 p-3">
                <p className="text-sm text-warm-gray-300">
                  Adjusting the line... Step {currentSteps.length - 1} / {TRAINING_STEPS}
                </p>
                {currentSteps.length > 0 && (
                  <p className="mt-1 font-mono text-xs text-amber">
                    Loss: {currentSteps[currentSteps.length - 1].loss.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Result after run */}
            {isCurrentRunDone && !allRunsComplete && (
              <div className="flex flex-col gap-3">
                <div
                  className={`rounded-lg p-3 ${
                    getResultLabel(currentRunIndex) === 'Correct!'
                      ? 'bg-emerald/20'
                      : 'bg-crimson/20'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      getResultLabel(currentRunIndex) === 'Correct!'
                        ? 'text-emerald'
                        : 'text-crimson'
                    }`}
                  >
                    {getResultLabel(currentRunIndex)}
                  </p>
                  <p className="mt-1 text-xs text-warm-gray-400">
                    You predicted: {getPredictionDisplayText(currentPrediction)}.
                    Final loss:{' '}
                    {currentSteps[currentSteps.length - 1].loss.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleNextRun}
                  className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
                >
                  {currentRunIndex < RUNS.length - 1 ? 'Try Next Step Size' : 'See Results'}
                </button>
              </div>
            )}

            {/* All runs complete */}
            {allRunsComplete && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
                  <p className="text-sm font-semibold text-warm-gray-200">
                    Results: {correctPredictions} / {RUNS.length} correct
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  className="rounded-lg bg-emerald px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-dark focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-charcoal"
                >
                  Complete Level
                </button>
              </div>
            )}
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
