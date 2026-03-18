import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LevelLayout } from '@/components/layout/LevelLayout';
import { Scatterplot } from '@/components/canvas/Scatterplot';
import { Histogram } from '@/components/canvas/Histogram';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { RevealModal } from '@/components/ui/RevealModal';
import { getLevel2Dataset } from '@/lib/datasets';
import { computeLoss, computeErrors, computeStars } from '@/lib/math';
import { LEVEL2_THRESHOLDS } from '@/lib/constants';
import type { LossFunction } from '@/types';

interface Level2Props {
  onComplete: (stars: number, score: number) => void;
  onEarnStar: (stars: number) => void;
  existingStars: number;
}

export function Level2({ onComplete, onEarnStar, existingStars }: Level2Props) {
  const dataset = useMemo(() => getLevel2Dataset(), []);

  const [weight, setWeight] = useState(0);
  const [bias, setBias] = useState(25);
  const [mode, setMode] = useState<'a' | 'b'>('a');
  const [showReveal, setShowReveal] = useState(false);

  const [bestStarsModeA, setBestStarsModeA] = useState(0);
  const [bestStarsModeB, setBestStarsModeB] = useState(0);

  const lossFunction: LossFunction = mode === 'a' ? 'mae' : 'mse';

  const currentLoss = useMemo(
    () => computeLoss(dataset.points, weight, bias, lossFunction),
    [dataset.points, weight, bias, lossFunction]
  );

  const errors = useMemo(
    () => computeErrors(dataset.points, weight, bias),
    [dataset.points, weight, bias]
  );

  const isOutlierArray = useMemo(
    () => dataset.points.map((point) => !!point.isOutlier),
    [dataset.points]
  );

  const currentStars = useMemo(
    () =>
      computeStars(
        currentLoss,
        lossFunction === 'mae' ? LEVEL2_THRESHOLDS.mae : LEVEL2_THRESHOLDS.mse
      ),
    [currentLoss, lossFunction]
  );

  const bestStarsModeARef = useRef(0);
  const bestStarsModeBRef = useRef(0);

  useEffect(() => {
    if (mode === 'a' && currentStars > bestStarsModeARef.current) {
      bestStarsModeARef.current = currentStars;
      setBestStarsModeA(currentStars);
    }
    if (mode === 'b' && currentStars > bestStarsModeBRef.current) {
      bestStarsModeBRef.current = currentStars;
      setBestStarsModeB(currentStars);
    }
  }, [mode, currentStars]);

  const overallStars = Math.min(bestStarsModeA, bestStarsModeB);
  const displayStars = Math.max(overallStars, existingStars);

  useEffect(() => {
    if (displayStars > existingStars) {
      onEarnStar(displayStars);
    }
  }, [displayStars, existingStars, onEarnStar]);

  const canComplete = bestStarsModeA >= 3 && bestStarsModeB >= 3;

  const handleComplete = useCallback(() => {
    setShowReveal(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    onComplete(displayStars, currentLoss);
  }, [onComplete, displayStars, currentLoss]);

  const weightRange: [number, number] = [-20, 5];
  const biasRange: [number, number] = [0, 80];

  const revealItems = useMemo(
    () => [
      {
        text: 'You discovered something key: HOW you measure error changes what counts as the "best" line!',
      },
      {
        text: '"Mode A" is MAE — Mean Absolute Error. It takes the absolute value of each error (ignores +/-) and averages them. Every error counts equally.',
        highlight: true,
      },
      {
        text: '"Mode B" is MSE — Mean Squared Error. It squares each error, then averages. Squaring does two things: removes negatives AND makes big errors count WAY more.',
        highlight: true,
      },
      {
        text: 'Did you notice the red outlier points? MSE gets pulled toward them because squaring a big error (like 15) gives 225, while a small error (like 3) only gives 9.',
      },
      {
        text: 'MAE and MSE are called "loss functions" — they define what "good" means for your model. Different loss functions, different answers!',
        highlight: true,
      },
      {
        text: 'The bar chart shows each point\'s contribution to the total loss. See how outliers dominate under MSE?',
      },
    ],
    []
  );

  return (
    <>
      <LevelLayout
        levelName="Level 2: The Measure"
        score={currentLoss}
        scoreLabel={lossFunction === 'mae' ? 'MAE' : 'MSE'}
        stars={displayStars}
        headerExtra={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-gray-500">Mode A</span>
              <StarDisplay earned={bestStarsModeA} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-gray-500">Mode B</span>
              <StarDisplay earned={bestStarsModeB} />
            </div>
          </div>
        }
        mainContent={
          <div className="flex flex-col items-center gap-4">
            <Scatterplot
              points={dataset.points}
              weight={weight}
              bias={bias}
              xRange={dataset.xRange}
              yRange={dataset.yRange}
              xLabel={dataset.xLabel}
              yLabel={dataset.yLabel}
              width={500}
              height={340}
              showWhiskers={true}
            />
            <Histogram
              errors={errors}
              isOutlier={isOutlierArray}
              lossFunction={lossFunction}
              width={500}
              height={120}
            />
          </div>
        }
        controlsContent={
          <div className="flex flex-col gap-5">
            <div className="rounded-lg bg-charcoal/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Mission
              </h2>
              <p className="text-sm leading-relaxed text-warm-gray-300">
                Earn 3 stars in BOTH modes. The red dots are outliers — watch
                how they affect each error measure differently!
              </p>
            </div>

            <Toggle
              labelA="Mode A"
              labelB="Mode B"
              value={mode}
              onChange={setMode}
              ariaLabel="Switch between error measurement modes"
            />

            <Slider
              label="Weight (slope)"
              value={weight}
              min={weightRange[0]}
              max={weightRange[1]}
              step={0.1}
              onChange={setWeight}
              color="#EF4444"
            />
            <Slider
              label="Bias (intercept)"
              value={bias}
              min={biasRange[0]}
              max={biasRange[1]}
              step={0.5}
              onChange={setBias}
              color="#8B5CF6"
            />

            <div className="rounded-lg bg-charcoal-light/50 p-3">
              <p className="font-mono text-xs text-warm-gray-400">
                y = {weight.toFixed(2)}x + {bias.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-warm-gray-500">
                {lossFunction === 'mae'
                  ? 'Mode A: Average of |error| — treats all errors equally'
                  : 'Mode B: Average of error² — big errors count way more'}
              </p>
            </div>

            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Key Terms
              </h3>
              <dl className="space-y-1 text-xs">
                <div>
                  <dt className="inline font-semibold text-amber">
                    Loss Function:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    The formula that defines "how wrong" your model is
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">Outlier:</dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    A data point far from the pattern (red dots)
                  </dd>
                </div>
              </dl>
            </div>

            {canComplete && (
              <button
                onClick={handleComplete}
                className="rounded-lg bg-emerald px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-dark focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-2 focus:ring-offset-charcoal"
              >
                Complete Level
              </button>
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
