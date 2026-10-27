import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import { PauseModal } from '@/components/pause-modal';
import { ThemedText } from '@/components/themed-text';
import { PAUSE_REASON_LABEL } from '@/constants/order';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useToast } from '@/context/toast';
import { useNow } from '@/hooks/use-now';
import { formatCountdown } from '@/lib/format';
import type { StoreStatus } from '@/types';

const STATUS_OPTIONS: { status: StoreStatus; label: string }[] = [
  { status: 'OPEN', label: '영업중' },
  { status: 'PAUSED', label: '일시정지' },
  { status: 'CLOSED', label: '마감' },
];

export function StoreStatusControl() {
  const { currentStore, orders, setStoreStatus, pauseStore } = useApp();
  const { showToast } = useToast();
  const now = useNow(1000);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  if (!currentStore) return null;

  const storeOrders = orders.filter((order) => order.storeId === currentStore.id);
  const waiting = storeOrders.filter((order) => order.status === 'REQUESTED').length;
  const making = storeOrders.filter((order) => order.status === 'MAKING').length;
  const ready = storeOrders.filter((order) => order.status === 'READY').length;
  const unfinished = waiting + making + ready;

  function close() {
    if (!currentStore) return;
    setStoreStatus(currentStore.id, 'CLOSED');
    showToast('마감 처리했습니다');
  }

  function select(status: StoreStatus) {
    if (!currentStore) return;
    if (status === 'PAUSED') {
      setPauseOpen(true);
    } else if (status === 'CLOSED') {
      if (currentStore.status === 'CLOSED') return;
      if (unfinished > 0) setCloseConfirmOpen(true);
      else close();
    } else if (currentStore.status !== 'OPEN') {
      setStoreStatus(currentStore.id, 'OPEN');
      showToast(currentStore.status === 'PAUSED' ? '영업을 재개했습니다' : '영업을 시작했습니다');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        {STATUS_OPTIONS.map((option) => {
          const active = currentStore.status === option.status;
          return (
            <Pressable
              key={option.status}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => select(option.status)}>
              <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {currentStore.status === 'PAUSED' && (
        <ThemedText type="small" color="warning">
          {currentStore.pauseReason ? `${PAUSE_REASON_LABEL[currentStore.pauseReason]} · ` : ''}
          {currentStore.pausedUntil
            ? `${formatCountdown(currentStore.pausedUntil - now)} 후 자동 재개`
            : '직접 해제할 때까지 일시정지'}
        </ThemedText>
      )}

      <PauseModal
        visible={pauseOpen}
        onCancel={() => setPauseOpen(false)}
        onConfirm={(minutes, reason) => {
          pauseStore(minutes, reason);
          setPauseOpen(false);
          showToast(minutes === null ? '일시정지했습니다 · 직접 해제할 때까지' : `일시정지했습니다 · ${minutes}분 후 자동 재개`);
        }}
      />

      <ConfirmModal
        visible={closeConfirmOpen}
        title="처리하지 않은 주문이 있습니다"
        message={`접수 대기 ${waiting}건 · 제조중 ${making}건 · 픽업 대기 ${ready}건이 남아 있습니다. 마감하면 새 주문은 받지 않지만, 이 주문들은 계속 처리해야 합니다.`}
        confirmLabel="마감하기"
        cancelLabel="돌아가기"
        destructive
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={() => {
          setCloseConfirmOpen(false);
          close();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  group: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  optionActive: {
    backgroundColor: Colors.accent,
  },
});
