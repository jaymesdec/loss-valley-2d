import { useEffect, useCallback } from 'react';
import { soundService } from '@/lib/sound';

type SoundName =
  | 'star_earn'
  | 'level_complete'
  | 'step_taken'
  | 'training_tick'
  | 'overshoot_bounce'
  | 'probe_place'
  | 'click';

export function useSound(muted: boolean) {
  useEffect(() => {
    soundService.setMuted(muted);
  }, [muted]);

  const play = useCallback((sound: SoundName) => {
    soundService.play(sound);
  }, []);

  return { play };
}
