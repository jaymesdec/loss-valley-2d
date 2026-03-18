import type { PlayerProgress } from '@/types';
import { STORAGE_KEYS } from './constants';

/** Save player progress to localStorage */
export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
    localStorage.setItem(STORAGE_KEYS.playerName, progress.playerName);
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/** Load player progress from localStorage */
export function loadProgress(): PlayerProgress | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.progress);
    if (!stored) return null;
    return JSON.parse(stored) as PlayerProgress;
  } catch {
    return null;
  }
}

/** Save sound mute preference */
export function saveSoundPreference(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.soundMuted, JSON.stringify(muted));
  } catch {
    // Silently fail
  }
}

/** Load sound mute preference */
export function loadSoundPreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.soundMuted);
    return stored ? JSON.parse(stored) === true : false;
  } catch {
    return false;
  }
}
