import { useReducer, useEffect, useCallback } from 'react';
import type { GameState, GameAction, PlayerProgress, LevelId, LevelProgress } from '@/types';
import { saveProgress, loadProgress, saveSoundPreference, loadSoundPreference } from '@/lib/storage';
import { LEVEL_ORDER } from '@/lib/constants';

function createInitialLevelProgress(): Record<LevelId, LevelProgress> {
  const levels = {} as Record<LevelId, LevelProgress>;
  for (const levelId of LEVEL_ORDER) {
    levels[levelId] = { completed: false, stars: 0 };
  }
  return levels;
}

function createInitialProgress(playerName: string): PlayerProgress {
  return {
    playerName,
    currentLevel: 'level1',
    levels: createInitialLevelProgress(),
  };
}

const initialState: GameState = {
  screen: 'nameEntry',
  progress: createInitialProgress(''),
  soundMuted: false,
};

function getNextLevel(currentLevel: LevelId): LevelId | null {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  if (currentIndex < 0 || currentIndex >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[currentIndex + 1];
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const progress = createInitialProgress(action.playerName);
      return {
        ...state,
        screen: 'level1',
        progress,
      };
    }

    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'COMPLETE_LEVEL': {
      const { levelId, stars, score } = action;
      const updatedLevels = { ...state.progress.levels };
      const existing = updatedLevels[levelId];

      // Stars only go up, never down
      const bestStars = Math.max(existing.stars, stars);
      const bestScore =
        score !== undefined
          ? existing.bestScore !== undefined
            ? Math.min(existing.bestScore, score)
            : score
          : existing.bestScore;

      updatedLevels[levelId] = {
        completed: true,
        stars: bestStars,
        bestScore,
      };

      const nextLevel = getNextLevel(levelId);
      const nextScreen = nextLevel ?? 'results';

      return {
        ...state,
        screen: nextScreen as GameState['screen'],
        progress: {
          ...state.progress,
          currentLevel: nextLevel ?? levelId,
          levels: updatedLevels,
        },
      };
    }

    case 'EARN_STAR': {
      const updatedLevels = { ...state.progress.levels };
      const existing = updatedLevels[action.levelId];
      updatedLevels[action.levelId] = {
        ...existing,
        stars: Math.max(existing.stars, action.stars),
      };
      return {
        ...state,
        progress: { ...state.progress, levels: updatedLevels },
      };
    }

    case 'LOAD_SAVED':
      return {
        ...state,
        screen: 'welcomeBack',
        progress: action.progress,
        soundMuted: action.soundMuted,
      };

    case 'TOGGLE_SOUND':
      return { ...state, soundMuted: !state.soundMuted };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // On mount, check for saved progress
  useEffect(() => {
    const savedProgress = loadProgress();
    const savedMuted = loadSoundPreference();
    if (savedProgress?.playerName) {
      dispatch({
        type: 'LOAD_SAVED',
        progress: savedProgress,
        soundMuted: savedMuted,
      });
    }
  }, []);

  // Auto-save progress on every state change
  useEffect(() => {
    if (state.progress.playerName) {
      saveProgress(state.progress);
    }
  }, [state.progress]);

  // Auto-save sound preference
  useEffect(() => {
    saveSoundPreference(state.soundMuted);
  }, [state.soundMuted]);

  const startGame = useCallback(
    (playerName: string) => dispatch({ type: 'START_GAME', playerName }),
    []
  );

  const setScreen = useCallback(
    (screen: GameState['screen']) => dispatch({ type: 'SET_SCREEN', screen }),
    []
  );

  const completeLevel = useCallback(
    (levelId: LevelId, stars: number, score?: number) =>
      dispatch({ type: 'COMPLETE_LEVEL', levelId, stars, score }),
    []
  );

  const earnStar = useCallback(
    (levelId: LevelId, stars: number) =>
      dispatch({ type: 'EARN_STAR', levelId, stars }),
    []
  );

  const toggleSound = useCallback(() => dispatch({ type: 'TOGGLE_SOUND' }), []);

  return {
    state,
    dispatch,
    startGame,
    setScreen,
    completeLevel,
    earnStar,
    toggleSound,
  };
}
