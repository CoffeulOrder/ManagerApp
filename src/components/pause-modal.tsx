import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChip } from '@/components/choice-chip';
import { ThemedText } from '@/components/themed-text';
import {
  PAUSE_DURATIONS_MINUTES,
  PAUSE_REASONS,
  PAUSE_REASON_LABEL,
  type PauseReason,
} from '@/constants/order';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface PauseModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (minutes: number | null, reason: PauseReason) => void;
}

export function PauseModal({ visible, onCancel, onConfirm }: PauseModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <PauseCard onCancel={onCancel} onConfirm={onConfirm} />
      </View>
    </Modal>
  );
}

function PauseCard({ onCancel, onConfirm }: Omit<PauseModalProps, 'visible'>) {
  const [minutes, setMinutes] = useState<number | null>(10);
  const [reason, setReason] = useState<PauseReason>('BUSY');

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">일시정지</ThemedText>
      <ThemedText type="small" color="textSecondary">
        새 주문을 잠시 받지 않습니다. 이미 들어온 주문은 계속 처리해야 합니다.
      </ThemedText>

      <ThemedText type="smallBold" color="textSecondary" style={styles.sectionTitle}>
        재개 시간
      </ThemedText>
      <View style={styles.chips}>
        {PAUSE_DURATIONS_MINUTES.map((value) => (
          <ChoiceChip key={value} label={`${value}분`} selected={minutes === value} onPress={() => setMinutes(value)} />
        ))}
        <ChoiceChip label="직접 해제" selected={minutes === null} onPress={() => setMinutes(null)} />
      </View>

      <ThemedText type="smallBold" color="textSecondary" style={styles.sectionTitle}>
        사유
      </ThemedText>
      <View style={styles.chips}>
        {PAUSE_REASONS.map((value) => (
          <ChoiceChip key={value} label={PAUSE_REASON_LABEL[value]} selected={reason === value} onPress={() => setReason(value)} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="취소" variant="secondary" style={styles.button} onPress={onCancel} />
        <Button label="일시정지" style={styles.button} onPress={() => onConfirm(minutes, reason)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 420,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  button: {
    flex: 1,
  },
});
