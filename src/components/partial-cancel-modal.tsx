import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { OptionChips } from '@/components/option-chips';
import { ThemedText } from '@/components/themed-text';
import type { ActionResult } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatWon } from '@/lib/format';
import { activeLines, isCouponOrder, lineAmount, netTotal } from '@/lib/order';
import type { Order } from '@/types';

interface PartialCancelModalProps {
  order: Order | null;
  onCancel: () => void;
  onConfirm: (lineIds: string[]) => ActionResult;
}

export function PartialCancelModal({ order, onCancel, onConfirm }: PartialCancelModalProps) {
  return (
    <Modal visible={order !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        {order && <PartialCancelCard key={order.id} order={order} onCancel={onCancel} onConfirm={onConfirm} />}
      </View>
    </Modal>
  );
}

function PartialCancelCard({
  order,
  onCancel,
  onConfirm,
}: {
  order: Order;
  onCancel: () => void;
  onConfirm: (lineIds: string[]) => ActionResult;
}) {
  const lines = activeLines(order);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLines = lines.filter((line) => selected.includes(line.id));
  const refund = selectedLines.reduce((sum, line) => sum + lineAmount(line), 0);
  const remaining = netTotal(order) - refund;
  const cancelsEverything = selectedLines.length === lines.length;
  const coupon = isCouponOrder(order);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function handleConfirm() {
    const result = onConfirm(selected);
    if (!result.ok) {
      setError(result.message ?? '부분 취소에 실패했습니다.');
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.centered}>
          선택한 메뉴를 취소할까요?
        </ThemedText>
        <ThemedText type="small" color="textSecondary" style={styles.centered}>
          {selectedLines.map((line) => `${line.name} x${line.qty}`).join(', ')} 취소 시 {formatWon(refund)}이{' '}
          {coupon ? '환불되거나 쿠폰으로 복원되고' : '환불되고'}, 나머지 메뉴로 주문을 진행할 수 있습니다. 되돌릴 수 없습니다.
        </ThemedText>
        <View style={styles.actions}>
          <Button label="이전" variant="secondary" style={styles.button} onPress={() => setConfirming(false)} />
          <Button label="취소하기" variant="danger" style={styles.button} onPress={handleConfirm} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">부분 취소</ThemedText>
      <ThemedText type="small" color="textSecondary">
        #{order.orderNo} · {order.customerName} · 취소할 메뉴를 선택해 주세요
      </ThemedText>

      <View style={styles.list}>
        {lines.map((line) => {
          const checked = selected.includes(line.id);
          return (
            <Pressable
              key={line.id}
              style={[styles.row, checked && styles.rowChecked]}
              onPress={() => {
                setError(null);
                toggle(line.id);
              }}>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    tintColor={Colors.accentText}
                    size={14}
                  />
                )}
              </View>
              <View style={styles.rowName}>
                <ThemedText type="default">
                  {line.name} x{line.qty}
                </ThemedText>
                <OptionChips options={line.options} />
              </View>
              <ThemedText type="small" color="textSecondary">
                {formatWon(lineAmount(line))}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <ThemedText type="small" color="textSecondary">
            {coupon ? '환불 · 쿠폰 복원 금액' : '환불 금액'}
          </ThemedText>
          <ThemedText type="smallBold" color={refund > 0 ? 'danger' : 'textMuted'}>
            {formatWon(refund)}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="small" color="textSecondary">
            남는 주문 금액
          </ThemedText>
          <ThemedText type="smallBold">{formatWon(remaining)}</ThemedText>
        </View>
      </View>

      {cancelsEverything && selectedLines.length > 0 && (
        <ThemedText type="small" color="danger">
          모든 메뉴를 취소하려면 주문 거절을 사용해 주세요.
        </ThemedText>
      )}
      {error && (
        <ThemedText type="small" color="danger">
          {error}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Button label="돌아가기" variant="secondary" style={styles.button} onPress={onCancel} />
        <Button
          label="다음"
          style={styles.button}
          disabled={selectedLines.length === 0 || cancelsEverything}
          onPress={() => setConfirming(true)}
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
    width: 400,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    gap: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
  list: {
    gap: Spacing.two,
    marginTop: Spacing.two,
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
  rowChecked: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  rowName: {
    flex: 1,
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
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  summary: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElevated,
    marginTop: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    flex: 1,
  },
});
