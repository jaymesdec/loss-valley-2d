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
  learningRate: number;
  color: string;
  expectedOutcome: 'converges' | 'overshoots';
}

const RUNS: RunConfig[] = [
  { label: 'Tiny (0.001)', learningRate: 0.001, color: '#4682B4', expectedOutcome: 'converges' },
  { label: 'Medium (0.01)', learningRate: 0.01, color: '#10B981', expectedOutcome: 'converges' },
  { label: 'Large (0.1)', learningRate: 0.1, color: '#EF4444', expectedOutcome: 'overshoots' },
];

type Prediction = 'converges' | 'overshoots' | null;

export function Level3({ onComplete, onEarnStar, existingStars }: Level3Props) {
  const dataset = useMemo(() => getSyntheticDataset(), []);

  // Current run index (0, 1, 2)
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

  // Which weight/bias to show on scatterplot (latest step of current run)
  const latestStep = currentSteps.length > 0 ? currentSteps[currentSteps.length - 1] : null;
  const displayWeight = latestStep?.weight ?? 0;
  const displayBias = latestStep?.bias ?? 20;

  // Run gradient descent for current learning rate
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
        loss: Math.min(loss, 10000), // Cap for display
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  const handlePrediction = useCallback(
    (prediction: 'converges' | 'overshoots') => {
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

  // Compute prediction accuracy
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

  // Check if run result was what they predicted
  const getResultLabel = useCallback(
    (runIndex: number): string | null => {
      const steps = runResults[runIndex];
      if (steps.length <= TRAINING_STEPS) return null;

      const finalLoss = steps[steps.length - 1].loss;
      const initialLoss = steps[0].loss;
      const didOvershoot = finalLoss > initialLoss * 0.8 || finalLoss > 500;
      const actualOutcome: 'converges' | 'overshoots' = didOvershoot
        ? 'overshoots'
        : 'converges';
      const predicted = predictions[runIndex];
      return predicted === actualOutcome ? 'Correct!' : 'Not quite';
    },
    [runResults, predictions]
  );

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
        text: 'The learning rate controls how big each step is during gradient descent. Think of it as your step size when walking downhill.',
      },
      {
        text: 'Too small (0.001): You inch toward the bottom, but it takes forever. The loss curve barely drops.',
        highlight: true,
      },
      {
        text: 'Just right (0.01): You walk at a good pace and reach the bottom smoothly. The loss curve drops and flattens.',
        highlight: true,
      },
      {
        text: 'Too large (0.1): You leap so far that you fly past the bottom and bounce around! The loss might even go UP.',
        highlight: true,
      },
      {
        text: 'This is why learning rate is one of the most important settings in machine learning. It\'s the tradeoff between speed and stability.',
      },
      {
        text: '"Gradient descent" literally means "walking downhill on the error surface." The gradient tells you which direction is downhill.',
        highlight: true,
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
                Watch gradient descent run with 3 different learning rates.
                Before each run, predict: will it converge smoothly or
                overshoot?
              </p>
            </div>

            {/* Current run info */}
            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Run {currentRunIndex + 1} of {RUNS.length}
              </h3>
              <p className="text-lg font-semibold" style={{ color: currentRun.color }}>
                Learning Rate: {currentRun.learningRate}
              </p>
              <p className="mt-1 text-xs text-warm-gray-500">
                {currentRun.learningRate === 0.001
                  ? 'Very tiny steps'
                  : currentRun.learningRate === 0.01
                    ? 'Medium steps'
                    : 'Very large steps'}
              </p>
            </div>

            {/* Prediction phase */}
            {currentPrediction === null && !isRunning && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-warm-gray-300">
                  What will happen with learning rate = {currentRun.learningRate}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrediction('converges')}
                    className="flex-1 rounded-lg border border-emerald bg-emerald/10 px-3 py-2 text-sm font-medium text-emerald transition-colors hover:bg-emerald/20"
                  >
                    Converges
                  </button>
                  <button
                    onClick={() => handlePrediction('overshoots')}
                    className="flex-1 rounded-lg border border-crimson bg-crimson/10 px-3 py-2 text-sm font-medium text-crimson transition-colors hover:bg-crimson/20"
                  >
                    Overshoots
                  </button>
                </div>
              </div>
            )}

            {/* Run button after prediction */}
            {currentPrediction !== null && !isRunning && !isCurrentRunDone && (
              <button
                onClick={startRun}
                className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
              >
                Run Gradient Descent
              </button>
            )}

            {/* Running status */}
            {isRunning && (
              <div className="rounded-lg bg-charcoal-light/50 p-3">
                <p className="text-sm text-warm-gray-300">
                  Running... Step {currentSteps.length - 1} / {TRAINING_STEPS}
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
                    You predicted: {currentPrediction}. Final loss:{' '}
                    {currentSteps[currentSteps.length - 1].loss.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleNextRun}
                  className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
                >
                  {currentRunIndex < RUNS.length - 1 ? 'Next Learning Rate' : 'See Results'}
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

            {/* Vocabulary */}
            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Key Terms
              </h3>
              <dl className="space-y-1 text-xs">
                <div>
                  <dt className="inline font-semibold text-amber">
                    Learning Rate:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    How big each step is during training
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">
                    Gradient Descent:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    Walking downhill on the error surface
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">
                    Convergence:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    When loss stops decreasing — you've reached the bottom
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
