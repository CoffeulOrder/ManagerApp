import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useToast } from '@/context/toast';
import { useNow } from '@/hooks/use-now';
import { isWithinHours, minutesOfDay, toMinutes } from '@/lib/time';

// Keeps the store status in line with the business hours and with a timed pause:
//  - closes automatically when the closing time passes (a manual status change afterwards is respected)
//  - resumes automatically when a timed pause ends
//  - asks staff to start business when opening time comes (it never opens by itself, a person must be there)
// The backend should enforce the same rules; this is the on-device side.
export function StoreSchedule() {
  const { currentStore, setStoreStatus } = useApp();
  const { showToast } = useToast();
  const now = useNow(5000);
  const previousMinutes = useRef<number | null>(null);
  const checkedOnStart = useRef(false);
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (!currentStore || checkedOnStart.current) return;
    checkedOnStart.current = true;
    if (currentStore.status === 'CLOSED' && isWithinHours(currentStore.openTime, currentStore.closeTime, new Date())) {
      setPromptOpen(true);
    }
  }, [currentStore]);

  useEffect(() => {
    if (!currentStore) return;
    const minutes = minutesOfDay(new Date(now));
    const previous = previousMinutes.current;
    previousMinutes.current = minutes;

    if (currentStore.status === 'PAUSED' && currentStore.pausedUntil && now >= currentStore.pausedUntil) {
      setStoreStatus(currentStore.id, 'OPEN');
      showToast('일시정지 시간이 끝나 영업을 재개했습니다');
    }

    // Only a crossing counts, so staff can still open or close by hand outside the hours.
    if (previous === null || minutes < previous) return;
    const open = toMinutes(currentStore.openTime);
    const close = toMinutes(currentStore.closeTime);

    if (previous < close && close <= minutes && currentStore.status !== 'CLOSED') {
      setStoreStatus(currentStore.id, 'CLOSED');
      setPromptOpen(false);
      showToast(`영업시간(${currentStore.closeTime})이 끝나 자동으로 마감했습니다`);
    }
    if (previous < open && open <= minutes && currentStore.status === 'CLOSED') {
      setPromptOpen(true);
    }
  }, [now, currentStore, setStoreStatus, showToast]);

  if (!currentStore || !promptOpen || currentStore.status !== 'CLOSED') return null;

  return (
    <View style={styles.banner}>
      <ThemedText type="smallBold" style={styles.message}>
        영업 시작 시간입니다 ({currentStore.openTime}). 영업을 시작할까요?
      </ThemedText>
      <Pressable style={styles.later} onPress={() => setPromptOpen(false)}>
        <ThemedText type="smallBold" color="textSecondary">
          나중에
        </ThemedText>
      </Pressable>
      <Button
        label="영업 시작"
        size="small"
        onPress={() => {
          setStoreStatus(currentStore.id, 'OPEN');
          setPromptOpen(false);
          showToast('영업을 시작했습니다');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    backgroundColor: Colors.backgroundSelected,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  message: {
    flex: 1,
  },
  later: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
});
