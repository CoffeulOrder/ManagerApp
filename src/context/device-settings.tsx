import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { DEFAULT_ALERT_SOUND, isAlertSoundId, type AlertSoundId } from '@/constants/alert-sounds';

// Settings that belong to this tablet, not to the store account, so they stay local.
interface DeviceSettings {
  soundEnabled: boolean;
  soundId: AlertSoundId;
}

const STORAGE_KEY = 'ormo.device-settings.v1';

const DEFAULT_SETTINGS: DeviceSettings = {
  soundEnabled: true,
  soundId: DEFAULT_ALERT_SOUND,
};

function parseSettings(raw: string | null): DeviceSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof DeviceSettings, unknown>>;
    return {
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
      soundId: isAlertSoundId(parsed.soundId) ? parsed.soundId : DEFAULT_SETTINGS.soundId,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface DeviceSettingsValue extends DeviceSettings {
  loaded: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundId: (id: AlertSoundId) => void;
}

const DeviceSettingsContext = createContext<DeviceSettingsValue | null>(null);

export function DeviceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<DeviceSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSettings(parseSettings(raw)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const setSoundEnabled = useCallback(
    (soundEnabled: boolean) => setSettings((prev) => ({ ...prev, soundEnabled })),
    []
  );
  const setSoundId = useCallback((soundId: AlertSoundId) => setSettings((prev) => ({ ...prev, soundId })), []);

  const value = useMemo(
    () => ({ ...settings, loaded, setSoundEnabled, setSoundId }),
    [settings, loaded, setSoundEnabled, setSoundId]
  );

  return <DeviceSettingsContext.Provider value={value}>{children}</DeviceSettingsContext.Provider>;
}

export function useDeviceSettings() {
  const ctx = useContext(DeviceSettingsContext);
  if (!ctx) throw new Error('useDeviceSettings must be used within DeviceSettingsProvider');
  return ctx;
}
