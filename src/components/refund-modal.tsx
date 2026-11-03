import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { OptionChips } from '@/components/option-chips';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ActionResult, RefundItem } from '@/context/app-context';
import { formatWon } from '@/lib/format';
import { isCouponOrder, netTotal, refundableLines, refundableQty, refundSplit } from '@/lib/order';
import type { Order } from '@/types';

interface RefundModalProps {
  order: Order | null;
  onCancel: () => void;
  onConfirm: (items: RefundItem[]) => ActionResult;
}

export function RefundModal({ order, onCancel, onConfirm }: RefundModalProps) {
  return (
    <Modal visible={order !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        {order && <RefundCard key={order.id} order={order} onCancel={onCancel} onConfirm={onConfirm} />}
      </View>
    </Modal>
  );
}

function RefundCard({
  order,
  onCancel,
  onConfirm,
}: {
  order: Order;
  onCancel: () => void;
  onConfirm: (items: RefundItem[]) => ActionResult;
}) {
  const lines = refundableLines(order);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items: RefundItem[] = lines
    .map((line) => ({ lineId: line.id, qty: qtys[line.id] ?? 0 }))
    .filter((item) => item.qty > 0);
  const refund = items.reduce((sum, item) => {
    const line = lines.find((l) => l.id === item.lineId);
    return sum + (line ? line.price * item.qty : 0);
  }, 0);
  const remaining = netTotal(order) - refund;
  const everything = lines.every((line) => (qtys[line.id] ?? 0) === refundableQty(line));
  const coupon = isCouponOrder(order);
  const split = refundSplit(order, refund);

  function setQty(lineId: string, qty: number) {
    setError(null);
    setQtys((prev) => ({ ...prev, [lineId]: qty }));
  }

  function toggleAll() {
    setError(null);
    setQtys(
      everything ? {} : Object.fromEntries(lines.map((line) => [line.id, refundableQty(line)]))
    );
  }

  function handleConfirm() {
    const result = onConfirm(items);
    if (!result.ok) {
      setError(result.message ?? '환불하지 못했습니다.');
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.centered}>
          {formatWon(refund)}을 환불할까요?
        </ThemedText>
        <ThemedText type="small" color="textSecondary" style={styles.centered}>
          {items
            .map((item) => {
              const line = lines.find((l) => l.id === item.lineId);
              return line ? `${line.name} ${item.qty}개` : '';
            })
            .join(', ')}
          {coupon
            ? ` 환불 시 카드 ${formatWon(split.card)}은 환불되고 쿠폰 ${formatWon(split.coupon)}은 복원됩니다.`
            : ' 환불 시 결제 금액이 환불됩니다.'}{' '}
          되돌릴 수 없습니다.
        </ThemedText>
        <View style={styles.actions}>
          <Button label="이전" variant="secondary" style={styles.button} onPress={() => setConfirming(false)} />
          <Button label="환불하기" variant="danger" style={styles.button} onPress={handleConfirm} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">환불</ThemedText>
        <Pressable onPress={toggleAll} hitSlop={8}>
          <ThemedText type="smallBold" color="accent">
            {everything ? '선택 해제' : '전체 선택'}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" color="textSecondary">
        #{order.orderNo} · {order.customerName} · 환불할 메뉴와 수량을 선택해 주세요
      </ThemedText>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {lines.map((line) => {
          const max = refundableQty(line);
          const qty = qtys[line.id] ?? 0;
          return (
            <View key={line.id} style={[styles.row, qty > 0 && styles.rowSelected]}>
              <View style={styles.rowName}>
                <ThemedText type="default" style={styles.menuName}>
                  {line.name}
                </ThemedText>
                <OptionChips options={line.options} />
                <ThemedText type="small" color="textMuted">
                  {formatWon(line.price)} · 환불 가능 {max}개
                </ThemedText>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepButton, qty === 0 && styles.stepDisabled]}
                  disabled={qty === 0}
                  onPress={() => setQty(line.id, qty - 1)}>
                  <SymbolView
                    name={{ ios: 'minus', android: 'remove', web: 'remove' }}
                    tintColor={Colors.text}
                    size={18}
                  />
                </Pressable>
                <ThemedText type="subtitle" style={styles.qty}>
                  {qty}
                </ThemedText>
                <Pressable
                  style={[styles.stepButton, qty >= max && styles.stepDisabled]}
                  disabled={qty >= max}
                  onPress={() => setQty(line.id, qty + 1)}>
                  <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={Colors.text} size={18} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <ThemedText type="small" color="textSecondary">
            {coupon ? '환불 · 쿠폰 복원 금액' : '환불 금액'}
          </ThemedText>
          <ThemedText type="smallBold" color={refund > 0 ? 'danger' : 'textMuted'}>
            {formatWon(refund)}
          </ThemedText>
        </View>
        {coupon && refund > 0 && (
          <View style={styles.summaryRow}>
            <ThemedText type="small" color="textMuted">
              카드 {formatWon(split.card)} · 쿠폰 {formatWon(split.coupon)}
            </ThemedText>
          </View>
        )}
        <View style={styles.summaryRow}>
          <ThemedText type="small" color="textSecondary">
            환불 후 주문 금액
          </ThemedText>
          <ThemedText type="smallBold">{formatWon(remaining)}</ThemedText>
        </View>
      </View>

      {error && (
        <ThemedText type="small" color="danger">
          {error}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Button label="돌아가기" variant="secondary" style={styles.button} onPress={onCancel} />
        <Button label="다음" style={styles.button} disabled={items.length === 0} onPress={() => setConfirming(true)} />
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
    width: 440,
    maxHeight: '90%',
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    marginTop: Spacing.two,
  },
  listContent: {
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
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
  },
  rowName: {
    flex: 1,
  },
  menuName: {
    fontSize: 17,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: {
    opacity: 0.35,
  },
  qty: {
    minWidth: 24,
    textAlign: 'center',
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
