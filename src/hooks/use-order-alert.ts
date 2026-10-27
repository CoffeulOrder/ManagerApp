import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useApp } from '@/context/app-context';
import { useDeviceSettings } from '@/context/device-settings';
import { useAlertPlayer } from '@/hooks/use-alert-player';

// The chime is about 5s long, so a 7s repeat leaves a short gap.
const REPEAT_MS = 7000;

// A new order in 접수 대기 rings (and repeats) until staff acknowledge it or the order is handled.
// Orders already waiting at login stay silent.
export function useOrderAlert() {
  const { orders, currentStore } = useApp();
  const { soundEnabled, soundId, loaded } = useDeviceSettings();
  const play = useAlertPlayer(soundId);
  const known = useRef<Set<string> | null>(null);
  const [unacknowledged, setUnacknowledged] = useState<string[]>([]);

  const waitingIds = useMemo(
    () =>
      orders
        .filter((order) => order.storeId === currentStore?.id && order.status === 'REQUESTED')
        .map((order) => order.id),
    [orders, currentStore]
  );

  useEffect(() => {
    if (!currentStore) return;
    if (known.current === null) {
      known.current = new Set(waitingIds);
      return;
    }
    const seen = known.current;
    const fresh = waitingIds.filter((id) => !seen.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => seen.add(id));
    setUnacknowledged((prev) => [...prev, ...fresh]);
  }, [waitingIds, currentStore]);

  const pendingCount = unacknowledged.filter((id) => waitingIds.includes(id)).length;
  const ringing = pendingCount > 0 && loaded && soundEnabled;

  useEffect(() => {
    if (!ringing) return;
    void play();
    const timer = setInterval(() => void play(), REPEAT_MS);
    return () => clearInterval(timer);
  }, [ringing, play]);

  const acknowledge = useCallback(() => setUnacknowledged([]), []);

  return { pendingCount, acknowledge };
}
