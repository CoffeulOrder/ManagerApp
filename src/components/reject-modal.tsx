import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { REJECT_REASON_LABEL, SELECTABLE_REJECT_REASONS, type RejectReason } from '@/constants/order';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { activeLines, rejectConsequence } from '@/lib/order';
import type { Order } from '@/types';

interface RejectModalProps {
  order: Order | null;
  onCancel: () => void;
  // soldOutMenuIds: menus the staff also marked sold out because of the rejection.
  onConfirm: (reason: RejectReason, soldOutMenuIds: string[]) => void;
}

export function RejectModal({ order, onCancel, onConfirm }: RejectModalProps) {
  return (
    <Modal visible={order !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        {order && <RejectCard key={order.id} order={order} onCancel={onCancel} onConfirm={onConfirm} />}
      </View>
    </Modal>
  );
}

function RejectCard({ order, onCancel, onConfirm }: { order: Order } & Omit<RejectModalProps, 'order'>) {
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [soldOutIds, setSoldOutIds] = useState<string[]>([]);
  const lines = activeLines(order);

  function toggleSoldOut(menuItemId: string) {
    setSoldOutIds((prev) => (prev.includes(menuItemId) ? prev.filter((id) => id !== menuItemId) : [...prev, menuItemId]));
  }

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">주문을 거절할까요?</ThemedText>
      <ThemedText type="small" color="textSecondary">
        #{order.orderNo} · {order.customerName}
      </ThemedText>
      <ThemedText type="small" color="danger">
        {rejectConsequence(order)}
      </ThemedText>

      <ThemedText type="smallBold" color="textSecondary" style={styles.sectionTitle}>
        거절 사유
      </ThemedText>
      <View style={styles.list}>
        {SELECTABLE_REJECT_REASONS.map((value) => {
          const selected = reason === value;
          return (
            <Pressable key={value} style={[styles.row, selected && styles.rowSelected]} onPress={() => setReason(value)}>
              <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
              <ThemedText type="default">{REJECT_REASON_LABEL[value]}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {reason === 'OUT_OF_STOCK' && (
        <>
          <ThemedText type="smallBold" color="textSecondary" style={styles.sectionTitle}>
            함께 품절 처리할 메뉴 (선택)
          </ThemedText>
          <View style={styles.list}>
            {lines.map((line) => {
              const checked = soldOutIds.includes(line.menuItemId);
              return (
                <Pressable
                  key={line.id}
                  style={[styles.row, checked && styles.rowSelected]}
                  onPress={() => toggleSoldOut(line.menuItemId)}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        tintColor={Colors.accentText}
                        size={14}
                      />
                    )}
                  </View>
                  <ThemedText type="default">{line.name}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button label="돌아가기" variant="secondary" style={styles.button} onPress={onCancel} />
        <Button
          label="거절하기"
          variant="danger"
          style={styles.button}
          disabled={reason === null}
          onPress={() => reason && onConfirm(reason, reason === 'OUT_OF_STOCK' ? soldOutIds : [])}
        />
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
    maxHeight: '90%',
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
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  rowSelected: {
    borderColor: Colors.accent,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.small - 4,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
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
