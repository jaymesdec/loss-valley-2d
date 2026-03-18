import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LevelLayout } from '@/components/layout/LevelLayout';
import { Scatterplot } from '@/components/canvas/Scatterplot';
import { Slider } from '@/components/ui/Slider';
import { RevealModal } from '@/components/ui/RevealModal';
import { carDataset } from '@/lib/datasets';
import { computeMSE, computeStars } from '@/lib/math';
import { STAR_THRESHOLDS } from '@/lib/constants';

interface Level1Props {
  onComplete: (stars: number, score: number) => void;
  onEarnStar: (stars: number) => void;
  existingStars: number;
}

export function Level1({ onComplete, onEarnStar, existingStars }: Level1Props) {
  const dataset = carDataset;

  const [weight, setWeight] = useState(0);
  const [bias, setBias] = useState(25);
  const [showReveal, setShowReveal] = useState(false);
  const [labelsRevealed, setLabelsRevealed] = useState(false);

  const weightRange: [number, number] = [-20, 5];
  const biasRange: [number, number] = [0, 80];

  const currentLoss = useMemo(
    () => computeMSE(dataset.points, weight, bias),
    [dataset.points, weight, bias]
  );

  const currentStars = useMemo(
    () => computeStars(currentLoss, STAR_THRESHOLDS.level1),
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

  const canComplete = displayStars >= 1;

  const handleComplete = useCallback(() => {
    setShowReveal(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setShowReveal(false);
    setLabelsRevealed(true);
    onComplete(displayStars, currentLoss);
  }, [onComplete, displayStars, currentLoss]);

  const revealItems = useMemo(
    () => [
      {
        text: "Nice work! You just did what machine learning does: find the line that best fits the data.",
      },
      {
        text: `"Knob A" is the weight (slope). It controls how steeply the line tilts.`,
        highlight: true,
      },
      {
        text: `"Knob B" is the bias (y-intercept). It shifts the line up or down.`,
        highlight: true,
      },
      {
        text: `Your model: y = ${weight.toFixed(2)}x + ${bias.toFixed(2)}`,
        highlight: true,
      },
      {
        text: `The yellow whiskers show "errors" — how far each prediction misses the real data. "Total Error" is MSE: the average of every error, squared.`,
        highlight: true,
      },
      {
        text: 'Why square the errors? Two reasons: it makes all errors positive (no canceling out!), and it punishes big misses way more than small ones.',
      },
      {
        text: 'In ML, this error score is called "loss." Lower loss = better model. Next, you\'ll see a different way to measure it!',
      },
    ],
    [weight, bias]
  );

  const knobALabel = labelsRevealed ? 'Weight (slope)' : 'Knob A';
  const knobBLabel = labelsRevealed ? 'Bias (intercept)' : 'Knob B';
  const scoreLabel = labelsRevealed ? 'MSE Loss' : 'Total Error';

  return (
    <>
      <LevelLayout
        levelName="Level 1: Fit the Line"
        score={currentLoss}
        scoreLabel={scoreLabel}
        stars={displayStars}
        mainContent={
          <Scatterplot
            points={dataset.points}
            weight={weight}
            bias={bias}
            xRange={dataset.xRange}
            yRange={dataset.yRange}
            xLabel={dataset.xLabel}
            yLabel={dataset.yLabel}
            width={560}
            height={420}
            showWhiskers={true}
          />
        }
        controlsContent={
          <div className="flex flex-col gap-5">
            <div className="rounded-lg bg-charcoal/50 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Mission
              </h2>
              <p className="text-sm leading-relaxed text-warm-gray-300">
                Drag the sliders to move the red line. Get it as close to the
                blue data points as possible. The yellow whiskers show your
                errors — make them short!
              </p>
            </div>

            <Slider
              label={knobALabel}
              value={weight}
              min={weightRange[0]}
              max={weightRange[1]}
              step={0.1}
              onChange={setWeight}
              color="#EF4444"
            />
            <Slider
              label={knobBLabel}
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
            </div>

            <div className="rounded-lg border border-warm-gray-700 bg-charcoal-light p-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray-500">
                Key Terms
              </h3>
              <dl className="space-y-1 text-xs">
                <div>
                  <dt className="inline font-semibold text-amber">Error:</dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    How far your prediction misses the real value
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-amber">
                    Prediction:
                  </dt>
                  <dd className="inline text-warm-gray-400">
                    {' '}
                    Where the line says a point should be
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
