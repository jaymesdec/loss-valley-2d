import { useCallback } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { NameEntry } from '@/components/NameEntry';
import { Level1 } from '@/components/levels/Level1';
import { Level2 } from '@/components/levels/Level2';
import { Level3 } from '@/components/levels/Level3';
import { Level4 } from '@/components/levels/Level4';
import { Level5 } from '@/components/levels/Level5';
import { FieldReport } from '@/components/FieldReport';
import { Results } from '@/components/Results';
import { MuteButton } from '@/components/ui/MuteButton';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { LEVEL_ORDER, LEVEL_NAMES, MIN_VIEWPORT_WIDTH } from '@/lib/constants';
import type { LevelId, PlayerProgress, Screen } from '@/types';

function useViewportWidth() {
  return typeof window !== 'undefined' ? window.innerWidth : 1024;
}

function WelcomeBack({
  progress,
  onContinue,
  onSelectLevel,
}: {
  progress: PlayerProgress;
  onContinue: () => void;
  onSelectLevel: (levelId: LevelId) => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold text-warm-gray-100">
          Welcome Back, {progress.playerName}!
        </h1>
        <p className="mb-8 text-warm-gray-400">
          Ready to continue your expedition?
        </p>

        <div className="mb-6 flex flex-col gap-2">
          {LEVEL_ORDER.map((levelId) => {
            const level = progress.levels[levelId];
            const levelIndex = LEVEL_ORDER.indexOf(levelId);
            const isUnlocked =
              levelIndex === 0 ||
              progress.levels[LEVEL_ORDER[levelIndex - 1]]?.completed;

            return (
              <button
                key={levelId}
                onClick={() => onSelectLevel(levelId)}
                disabled={!isUnlocked}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  isUnlocked
                    ? 'border-warm-gray-700 bg-charcoal-light text-warm-gray-200 hover:border-steel-blue'
                    : 'cursor-not-allowed border-warm-gray-800 bg-charcoal text-warm-gray-600'
                }`}
              >
                <span className="text-sm font-medium">
                  {LEVEL_NAMES[levelId]}
                </span>
                <span className="text-xs">
                  {level.completed ? (
                    <StarDisplay earned={level.stars} />
                  ) : isUnlocked ? (
                    <span className="text-steel-blue">Play</span>
                  ) : (
                    <span className="text-warm-gray-600">Locked</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onContinue}
          className="rounded-lg bg-steel-blue px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-steel-blue-light focus:outline-none focus:ring-2 focus:ring-steel-blue focus:ring-offset-2 focus:ring-offset-charcoal"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { state, startGame, setScreen, completeLevel, earnStar, submitFieldReport, toggleSound } =
    useGameState();
  const viewportWidth = useViewportWidth();

  const handleContinue = useCallback(() => {
    const nextLevel = LEVEL_ORDER.find(
      (id) => !state.progress.levels[id].completed
    );
    if (nextLevel) {
      setScreen(nextLevel as Screen);
    } else {
      setScreen('results');
    }
  }, [state.progress.levels, setScreen]);

  const handleSelectLevel = useCallback(
    (levelId: LevelId) => {
      setScreen(levelId as Screen);
    },
    [setScreen]
  );

  if (viewportWidth < MIN_VIEWPORT_WIDTH) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal p-8 text-center">
        <p className="text-lg text-warm-gray-300">
          Please expand this window to at least {MIN_VIEWPORT_WIDTH}px wide to
          play Loss Valley.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {state.screen !== 'nameEntry' && (
        <MuteButton muted={state.soundMuted} onToggle={toggleSound} />
      )}

      {state.screen === 'nameEntry' && <NameEntry onStart={startGame} />}

      {state.screen === 'welcomeBack' && (
        <WelcomeBack
          progress={state.progress}
          onContinue={handleContinue}
          onSelectLevel={handleSelectLevel}
        />
      )}

      {state.screen === 'level1' && (
        <Level1
          onComplete={(stars, score) => completeLevel('level1', stars, score)}
          onEarnStar={(stars) => earnStar('level1', stars)}
          existingStars={state.progress.levels.level1.stars}
        />
      )}

      {state.screen === 'level2' && (
        <Level2
          onComplete={(stars, score) => completeLevel('level2', stars, score)}
          onEarnStar={(stars) => earnStar('level2', stars)}
          existingStars={state.progress.levels.level2.stars}
        />
      )}

      {state.screen === 'level3' && (
        <Level3
          onComplete={(stars, score) => completeLevel('level3', stars, score)}
          onEarnStar={(stars) => earnStar('level3', stars)}
          existingStars={state.progress.levels.level3.stars}
        />
      )}

      {state.screen === 'level4' && (
        <Level4
          onComplete={(stars, score) => completeLevel('level4', stars, score)}
          onEarnStar={(stars) => earnStar('level4', stars)}
          existingStars={state.progress.levels.level4.stars}
        />
      )}

      {state.screen === 'level5' && (
        <Level5
          onComplete={(stars, score) => completeLevel('level5', stars, score)}
          onEarnStar={(stars) => earnStar('level5', stars)}
          existingStars={state.progress.levels.level5.stars}
        />
      )}

      {state.screen === 'fieldReport' && (
        <FieldReport
          progress={state.progress}
          onComplete={submitFieldReport}
        />
      )}

      {state.screen === 'results' && (
        <Results
          progress={state.progress}
          onPlayAgain={() => setScreen('nameEntry')}
        />
      )}
    </div>
  );
}
