import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LevelLayout } from '@/components/layout/LevelLayout';
import { Scatterplot } from '@/components/canvas/Scatterplot';
import { LossCurve } from '@/components/canvas/LossCurve';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { RevealModal } from '@/components/ui/RevealModal';
import { getLevel5Dataset } from '@/lib/datasets';
import {
  computeLoss,
  computeBatchGradient,
  stepGradientDescent,
  selectBatchIndices,
  computeStars,
} from '@/lib/math';
import { STAR_THRESHOLDS, LEVEL5_TRAINING_STEPS, LEVEL5_ATTEMPTS, TIMING } from '@/lib/constants';
import type { LossFunction, TrainingStep } from '@/types';

interface Level5Props {
  onComplete: (stars: number, score: number) => void;
  onEarnStar: (stars: number) => void;
  existingStars: number;
}

interface AttemptResult {
  learningRate: number;
  batchSize: number;
  lossFunction: LossFunction;
  steps: TrainingStep[];
  finalLoss: number;
}

const ATTEMPT_COLORS = ['#F59E0B', '#EF4444', '#8B5CF6'];

export function Level5({ onComplete, onEarnStar, existingStars }: Level5Props) {
  const dataset = useMemo(() => getLevel5Dataset(), []);
  const datasetSize = dataset.points.length;

  // Configuration
  const [learningRate, setLearningRate] = useState(0.01);
  const [batchSize, setBatchSize] = useState(5);
  const [lossMode, setLossMode] = useState<'a' | 'b'>('b');
  const lossFunction: LossFunction = lossMode === 'a' ? 'mae' : 'mse';

  // Attempt state
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [currentSteps, setCurrentSteps] = useState<TrainingStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showVocabQuiz, setShowVocabQuiz] = useState(false);
  const [vocabScore, setVocabScore] = useState(0);
  const runningRef = useRef(false);

  const allAttemptsComplete = attemptIndex >= LEVEL5_ATTEMPTS && results.length >= LEVEL5_ATTEMPTS;

  const latestStep = currentSteps.length > 0 ? currentSteps[currentSteps.length - 1] : null;
  const displayWeight = latestStep?.weight ?? 0;
  const displayBias = latestStep?.bias ?? 20;

  // Run training
  const handleRun = useCallback(() => {
    if (isRunning || attemptIndex >= LEVEL5_ATTEMPTS) return;
    setIsRunning(true);
    runningRef.current = true;

    const currentLR = learningRate;
    const currentBS = Math.round(batchSize);
    const currentLF = lossFunction;
    let currentWeight = 0;
    let currentBias = 20;
    let stepCount = 0;

    const initialLoss = computeLoss(dataset.points, currentWeight, currentBias, currentLF);
    const initialStep: TrainingStep = {
      step: 0,
      weight: currentWeight,
      bias: currentBias,
      loss: initialLoss,
    };
    setCurrentSteps([initialStep]);

    const intervalId = setInterval(() => {
      if (!runningRef.current) {
        clearInterval(intervalId);
        return;
      }

      stepCount++;
      const batchIndices = selectBatchIndices(datasetSize, currentBS);
      const gradient = computeBatchGradient(
        dataset.points,
        batchIndices,
        currentWeight,
        currentBias,
        currentLF
      );
      const result = stepGradientDescent(currentWeight, currentBias, gradient, currentLR);
      currentWeight = result.weight;
      currentBias = result.bias;

      const loss = computeLoss(dataset.points, currentWeight, currentBias, currentLF);
      const newStep: TrainingStep = {
        step: stepCount,
        weight: currentWeight,
        bias: currentBias,
        loss: Math.min(loss, 10000),
      };

      setCurrentSteps((prev) => [...prev, newStep]);

      if (stepCount >= LEVEL5_TRAINING_STEPS) {
        clearInterval(intervalId);
        runningRef.current = false;
        setIsRunning(false);

        const attemptResult: AttemptResult = {
          learningRate: currentLR,
          batchSize: currentBS,
          lossFunction: currentLF,
          steps: [],  // Will be populated from state
          finalLoss: Math.min(loss, 10000),
        };

        setResults((prev) => [...prev, attemptResult]);
        setAttemptIndex((prev) => prev + 1);
      }
    }, TIMING.trainingStepInterval);

    return () => {
      clearInterval(intervalId);
      runningRef.current = false;
    };
  }, [isRunning, attemptIndex, learningRate, batchSize, lossFunction, dataset.points, datasetSize]);

  // Cleanup
  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  // Best loss across attempts
  const bestLoss = useMemo(() => {
    if (results.length === 0) return Infinity;
    return Math.min(...results.map((r) => r.finalLoss));
  }, [results]);

  const currentStars = useMemo(() => {
    if (!allAttemptsComplete) return 0;
    return computeStars(bestLoss, STAR_THRESHOLDS.level5);
  }, [allAttemptsComplete, bestLoss]);

  const displayStars = Math.max(currentStars, existingStars);

  useEffect(() => {
    if (displayStars > existingStars) {
      onEarnStar(displayStars);
    }
  }, [displayStars, existingStars, onEarnStar]);

  // Reset for next attempt
  const handleNextAttempt = useCallback(() => {
    setCurrentSteps([]);
  }, []);

  // Vocab quiz questions
  const vocabQuestions = useMemo(
    () => [
      {
        question: 'What does "stochastic" mean in SGD?',
        options: ['Fast', 'Randomly determined', 'Optimal', 'Sequential'],
        answer: 1,
      },
      {
        question: 'What does the learning rate control?',
        options: [
          'How much data to use',
          'Which loss function to pick',
          'How big each training step is',
          'How many epochs to run',
        ],
        answer: 2,
      },
      {
        question: 'What happens if the learning rate is too high?',
        options: [
          'Training is slow but stable',
          'The model overshoots and loss goes up',
          'Nothing changes',
          'The batch size increases',
        ],
        answer: 1,
      },
      {
        question: 'What is a "batch" in mini-batch gradient descent?',
        options: [
          'The entire dataset',
          'A random subset of data points',
          'The learning rate',
          'One training step',
        ],
        answer: 1,
      },
      {
        question: 'Why does MSE punish outliers more than MAE?',
        options: [
          'It uses more data',
          'Squaring big errors makes them much larger',
          'It runs more epochs',
          'It has a higher learning rate',
        ],
        answer: 1,
      },
    ],
    []
  );

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleQuizAnswer = useCallback(
    (answerIndex: number) => {
      if (quizAnswered) return;
      setSelectedAnswer(answerIndex);
      setQuizAnswered(true);
      if (answerIndex === vocabQuestions[quizIndex].answer) {
        setVocabScore((prev) => prev + 1);
      }
    },
    [quizAnswered, quizIndex, vocabQuestions]
  );

  const handleQuizNext = useCallback(() => {
    if (quizIndex < vocabQuestions.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setQuizAnswered(false);
      setSelectedAnswer(null);
    } else {
      setShowVocabQuiz(false);
      setShowReveal(true);
    }
  }, [quizIndex, vocabQuestions.length]);

  const handleComplete = useCallback(() => {
    setShowVocabQuiz(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    onComplete(displayStars, bestLoss);
  }, [onComplete, displayStars, bestLoss]);

  const revealItems = useMemo(
    () => [
      {
        text: `Vocabulary Score: ${vocabScore} / ${vocabQuestions.length}`,
        highlight: true,
      },
      {
        text: 'You just configured and ran a real training pipeline! You chose the loss function, learning rate, and batch size — the three key hyperparameters.',
      },
      {
        text: 'Loss function (MAE vs MSE) defines what "good" means. Learning rate controls step size. Batch size controls the noise-vs-speed tradeoff.',
        highlight: true,
      },
      {
        text: 'In real ML, finding the right combination of these settings is called "hyperparameter tuning." It\'s part art, part science.',
      },
      {
        text: 'The core loop: pick a random batch, compute the gradient, take a step. Repeat thousands of times. That\'s Stochastic Gradient Descent!',
        highlight: true,
      },
      {
        text: `Best loss across your ${LEVEL5_ATTEMPTS} attempts: ${bestLoss.toFixed(2)}. Congratulations — you've completed Loss Valley!`,
      },
    ],
    [vocabScore, vocabQuestions.length, bestLoss]
  );

  const isReadyForNextAttempt = !isRunning && attemptIndex < LEVEL5_ATTEMPTS && currentSteps.length > 0 && currentSteps.length > LEVEL5_TRAINING_STEPS;

  return (
    <>
      <LevelLayout
        levelName="Level 5: The Challenge"
        score={latestStep?.loss}
        scoreLabel="Current Loss"
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
                maxSteps={LEVEL5_TRAINING_STEPS}
                width={340}
                height={300}
              />
            </div>

            {/* Previous attempt results */}
            {results.length > 0 && (
              <div className="flex gap-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center"
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: ATTEMPT_COLORS[index] }}
                    >
                      Attempt {index + 1}
                    </p>
                    <p className="font-mono text-sm text-warm-gray-300">
                      {result.finalLoss.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-warm-gray-500">
                      LR:{result.learningRate} B:{result.batchSize}{' '}
                      {result.lossFunction.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        controlsContent={
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-charcoal/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Mission
              </h2>
              <p className="text-sm leading-relaxed text-warm-gray-300">
                Configure the learning rate, batch size, and loss function.
                You get {LEVEL5_ATTEMPTS} attempts of {LEVEL5_TRAINING_STEPS}{' '}
                steps each. Find the settings that minimize loss!
              </p>
            </div>

            {!allAttemptsComplete && (
              <>
                <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-2 text-center">
                  <span className="text-xs text-warm-gray-500">
                    Attempt {Math.min(attemptIndex + 1, LEVEL5_ATTEMPTS)} of{' '}
                    {LEVEL5_ATTEMPTS}
                  </span>
                </div>

                <Toggle
                  labelA="MAE"
                  labelB="MSE"
                  value={lossMode}
                  onChange={(val) => {
                    if (!isRunning) setLossMode(val);
                  }}
                  ariaLabel="Choose loss function"
                />

                <Slider
                  label="Learning Rate"
                  value={learningRate}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  onChange={(val) => {
                    if (!isRunning) setLearningRate(val);
                  }}
                  color="#10B981"
                />

                <Slider
                  label="Batch Size"
                  value={batchSize}
                  min={1}
                  max={datasetSize}
                  step={1}
                  onChange={(val) => {
                    if (!isRunning) setBatchSize(Math.round(val));
                  }}
                  color="#8B5CF6"
                />

                {/* Running status */}
                {isRunning && (
                  <div className="rounded-lg bg-charcoal-light/50 p-3">
                    <p className="text-sm text-warm-gray-300">
                      Training... Step {currentSteps.length - 1} /{' '}
                      {LEVEL5_TRAINING_STEPS}
                    </p>
                  </div>
                )}

                {/* Run button */}
                {!isRunning && currentSteps.length === 0 && attemptIndex < LEVEL5_ATTEMPTS && (
                  <button
                    onClick={handleRun}
                    className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
                  >
                    Run Training
                  </button>
                )}

                {/* Next attempt button */}
                {isReadyForNextAttempt && (
                  <button
                    onClick={handleNextAttempt}
                    className="rounded-lg bg-steel-blue px-4 py-3 font-semibold text-white transition-colors hover:bg-steel-blue-light"
                  >
                    Next Attempt
                  </button>
                )}
              </>
            )}

            {allAttemptsComplete && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg border border-emerald bg-emerald/10 p-3">
                  <p className="text-sm font-semibold text-emerald">
                    All attempts complete!
                  </p>
                  <p className="mt-1 text-xs text-warm-gray-400">
                    Best loss: {bestLoss.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  className="rounded-lg bg-emerald px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-dark focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-charcoal"
                >
                  Take Vocabulary Challenge
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Vocabulary Quiz Modal */}
      {showVocabQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-warm-gray-700 bg-charcoal-light p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-warm-gray-100">
              Vocabulary Challenge
            </h2>
            <p className="text-xs text-warm-gray-500">
              Question {quizIndex + 1} of {vocabQuestions.length}
            </p>

            <p className="text-lg text-warm-gray-200">
              {vocabQuestions[quizIndex].question}
            </p>

            <div className="flex flex-col gap-2">
              {vocabQuestions[quizIndex].options.map((option, optionIndex) => {
                const isCorrect = optionIndex === vocabQuestions[quizIndex].answer;
                const isSelected = selectedAnswer === optionIndex;

                let buttonStyle =
                  'border border-warm-gray-600 bg-charcoal text-warm-gray-300 hover:border-steel-blue';
                if (quizAnswered) {
                  if (isCorrect) {
                    buttonStyle =
                      'border border-emerald bg-emerald/20 text-emerald';
                  } else if (isSelected && !isCorrect) {
                    buttonStyle =
                      'border border-crimson bg-crimson/20 text-crimson';
                  } else {
                    buttonStyle =
                      'border border-warm-gray-700 bg-charcoal text-warm-gray-500';
                  }
                }

                return (
                  <button
                    key={optionIndex}
                    onClick={() => handleQuizAnswer(optionIndex)}
                    disabled={quizAnswered}
                    className={`rounded-lg px-4 py-2 text-left text-sm transition-colors ${buttonStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {quizAnswered && (
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-semibold ${
                    selectedAnswer === vocabQuestions[quizIndex].answer
                      ? 'text-emerald'
                      : 'text-crimson'
                  }`}
                >
                  {selectedAnswer === vocabQuestions[quizIndex].answer
                    ? 'Correct!'
                    : 'Not quite!'}
                </p>
                <button
                  onClick={handleQuizNext}
                  className="rounded-lg bg-steel-blue px-6 py-2 font-semibold text-white transition-colors hover:bg-steel-blue-light"
                >
                  {quizIndex < vocabQuestions.length - 1 ? 'Next' : 'See Results'}
                </button>
              </div>
            )}

            <p className="text-xs text-warm-gray-500">
              Score: {vocabScore} / {quizIndex + (quizAnswered ? 1 : 0)}
            </p>
          </div>
        </div>
      )}

      {showReveal && (
        <RevealModal
          title="Expedition Complete!"
          items={revealItems}
          onComplete={handleRevealComplete}
        />
      )}
    </>
  );
}
