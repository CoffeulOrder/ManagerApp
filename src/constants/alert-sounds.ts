import type { AudioSource } from 'expo-audio';

export const ALERT_SOUND_IDS = ['CAFE_CHIME'] as const;

export type AlertSoundId = (typeof ALERT_SOUND_IDS)[number];

export const DEFAULT_ALERT_SOUND: AlertSoundId = 'CAFE_CHIME';

// To offer another sound: add the file under assets/sounds and one entry here and in ALERT_SOUND_IDS.
export const ALERT_SOUNDS: Record<AlertSoundId, { label: string; source: AudioSource }> = {
  CAFE_CHIME: {
    label: '카페 차임',
    source: require('@/assets/sounds/order-chime.wav'),
  },
};

export function isAlertSoundId(value: unknown): value is AlertSoundId {
  return typeof value === 'string' && (ALERT_SOUND_IDS as readonly string[]).includes(value);
}
