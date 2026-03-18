import type { PlayerProgress } from '@/types';
import { LEVEL_ORDER, LEVEL_NAMES } from '@/lib/constants';
import { StarDisplay } from '@/components/ui/StarDisplay';

interface ResultsProps {
  progress: PlayerProgress;
  onPlayAgain: () => void;
}

export function Results({ progress, onPlayAgain }: ResultsProps) {
  const totalStars = LEVEL_ORDER.reduce(
    (sum, levelId) => sum + progress.levels[levelId].stars,
    0
  );
  const maxStars = LEVEL_ORDER.length * 3;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal p-6">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-2 text-4xl font-bold text-warm-gray-100">
          Expedition Complete!
        </h1>
        <p className="mb-8 text-warm-gray-400">
          Well done, {progress.playerName}. You've conquered Loss Valley.
        </p>

        <div className="mb-8 rounded-2xl bg-charcoal-light border border-warm-gray-700 p-6">
          <div className="mb-4 text-center">
            <span className="text-6xl font-bold text-amber">
              {totalStars}
            </span>
            <span className="text-2xl text-warm-gray-500"> / {maxStars}</span>
            <p className="mt-1 text-sm text-warm-gray-500">Total Stars</p>
          </div>

          <div className="flex flex-col gap-2">
            {LEVEL_ORDER.map((levelId) => (
              <div
                key={levelId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-warm-gray-300">
                  {LEVEL_NAMES[levelId]}
                </span>
                <StarDisplay earned={progress.levels[levelId].stars} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onPlayAgain}
          className="rounded-lg bg-steel-blue px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-steel-blue-light focus:outline-none focus:ring-2 focus:ring-steel-blue focus:ring-offset-2 focus:ring-offset-charcoal"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
