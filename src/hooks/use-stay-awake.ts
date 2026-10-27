import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

const TAG = 'ormo-stay-awake';

// useKeepAwake() lets an exception escape when the lock is released before the (web) wake lock was granted,
// e.g. while the page is hidden. Failing to keep the screen on must never crash the app.
export function useStayAwake() {
  useEffect(() => {
    activateKeepAwakeAsync(TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(TAG).catch(() => {});
    };
  }, []);
}
