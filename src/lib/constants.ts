import type { LevelId, StarThresholds } from '@/types';

// Color palette
export const COLORS = {
  steelBlue: '#4682B4',
  steelBlueLight: '#6BA3D6',
  emerald: '#10B981',
  emeraldDark: '#059669',
  amber: '#F59E0B',
  amberDark: '#D97706',
  crimson: '#EF4444',
  crimsonDark: '#DC2626',
  warmGray: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  charcoal: '#1a1a2e',
  charcoalLight: '#24243e',
  purple: '#7C3AED',
  purpleLight: '#8B5CF6',
} as const;

// Canvas rendering colors
export const CANVAS_COLORS = {
  dataPoint: COLORS.steelBlue,
  dataPointOutlier: COLORS.crimson,
  modelLine: COLORS.crimson,
  whiskerLine: COLORS.amber,
  gridLine: 'rgba(255,255,255,0.08)',
  axisLabel: COLORS.warmGray[400],
  batchHighlight: COLORS.purpleLight,
} as const;

// Star thresholds per level (lower is better for loss-based scores)
// All marked // TUNING — require playtesting
export const STAR_THRESHOLDS: Record<LevelId, StarThresholds> = {
  level1: { one: 15, two: 8, three: 4 },    // TUNING — MSE, optimal ~ 1.7
  level2: { one: 80, two: 50, three: 30 },   // TUNING — combined MAE+MSE score
  level3: { one: 1, two: 2, three: 3 },      // TUNING — prediction accuracy out of 3
  level4: { one: 50, two: 30, three: 15 },    // TUNING — final loss
  level5: { one: 50, two: 25, three: 10 },    // TUNING — final loss
};

// Level 2 has separate thresholds per mode since MAE and MSE are on different scales
export const LEVEL2_THRESHOLDS = {
  mae: { one: 6, two: 4.5, three: 3.5 } as StarThresholds, // TUNING — optimal MAE ~ 3.0
  mse: { one: 60, two: 45, three: 36 } as StarThresholds,  // TUNING — optimal MSE ~ 33.7
};

// Animation timings (ms)
export const TIMING = {
  revealTypewriterDelay: 40,
  starPopDuration: 600,
  starGlowDuration: 1000,
  levelTransitionDuration: 300,
  scoreAnimationDuration: 400,
  clickDebounce: 300,
  trainingStepInterval: 500,
} as const;

// localStorage keys (all prefixed with 'lv2-' to avoid conflicts with original)
export const STORAGE_KEYS = {
  playerName: 'lv2-player-name',
  progress: 'lv2-progress',
  soundMuted: 'lv2-sound-muted',
  fieldReport: 'lv2-field-report',
} as const;

// Level metadata
export const LEVEL_ORDER: LevelId[] = [
  'level1',
  'level2',
  'level3',
  'level4',
  'level5',
];

export const LEVEL_NAMES: Record<LevelId, string> = {
  level1: 'Level 1: Fit the Line',
  level2: 'Level 2: The Measure',
  level3: 'Level 3: The Descent',
  level4: 'Level 4: The Batch',
  level5: 'Level 5: The Challenge',
};

// Gradient descent learning rates
export const LEARNING_RATES = {
  tiny: 0.001,
  small: 0.01,
  medium: 0.05,
  large: 0.1,
} as const;

// Level 4 budget
export const LEVEL4_BUDGET = 800;
export const LEVEL4_LEARNING_RATE = 0.01;

// Level 5
export const LEVEL5_TRAINING_STEPS = 50;
export const LEVEL5_ATTEMPTS = 3;

// Minimum viewport width
export const MIN_VIEWPORT_WIDTH = 1024;
