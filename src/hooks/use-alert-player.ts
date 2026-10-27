import { useAudioPlayer } from 'expo-audio';
import { useCallback } from 'react';

import { ALERT_SOUNDS, type AlertSoundId } from '@/constants/alert-sounds';

export function useAlertPlayer(soundId: AlertSoundId) {
  const player = useAudioPlayer(ALERT_SOUNDS[soundId].source);

  return useCallback(async () => {
    try {
      // A finished clip does not restart on play() alone.
      await player.seekTo(0);
      player.play();
    } catch {
      // A missed chime must never break order handling.
    }
  }, [player]);
}
