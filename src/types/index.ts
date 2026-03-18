export interface DataPoint {
  x: number;
  y: number;
  isOutlier?: boolean;
}

export interface Dataset {
  points: DataPoint[];
  xLabel: string;
  yLabel: string;
  xRange: [number, number];
  yRange: [number, number];
}

export interface ModelParams {
  weight: number;
  bias: number;
}

export interface StarThresholds {
  one: number;
  two: number;
  three: number;
}

export type LossFunction = 'mae' | 'mse';

export type LevelId =
  | 'level1'
  | 'level2'
  | 'level3'
  | 'level4'
  | 'level5';

export type Screen =
  | 'nameEntry'
  | 'welcomeBack'
  | 'level1'
  | 'level2'
  | 'level3'
  | 'level4'
  | 'level5'
  | 'results';

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestScore?: number;
}

export interface PlayerProgress {
  playerName: string;
  currentLevel: LevelId;
  levels: Record<LevelId, LevelProgress>;
}

export interface GameState {
  screen: Screen;
  progress: PlayerProgress;
  soundMuted: boolean;
}

export type GameAction =
  | { type: 'START_GAME'; playerName: string }
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'COMPLETE_LEVEL'; levelId: LevelId; stars: number; score?: number }
  | { type: 'EARN_STAR'; levelId: LevelId; stars: number }
  | { type: 'LOAD_SAVED'; progress: PlayerProgress; soundMuted: boolean }
  | { type: 'TOGGLE_SOUND' };

export interface TrainingStep {
  step: number;
  weight: number;
  bias: number;
  loss: number;
}
