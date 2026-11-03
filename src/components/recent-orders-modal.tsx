import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChip } from '@/components/choice-chip';
import { ThemedText } from '@/components/themed-text';
import { REJECT_REASON_LABEL } from '@/constants/order';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatTime } from '@/lib/date';
import { formatWon } from '@/lib/format';
import { activeLines, canRefund, hasRefund, lineLabel, netTotal, refundedAfterPickup, refundedQtyOf } from '@/lib/order';
import { isCancelled } from '@/lib/sales';
import type { Order } from '@/types';

type Filter = 'ALL' | 'DONE' | 'CANCELED' | 'UNCLAIMED';

const FILTERS: { key: Filter; label: string; match: (order: Order) => boolean }[] = [
  { key: 'ALL', label: '전체', match: () => true },
  { key: 'DONE', label: '픽업 완료', match: (order) => order.status === 'COMPLETED' },
  { key: 'CANCELED', label: '거절·취소', match: (order) => isCancelled(order) },
  { key: 'UNCLAIMED', label: '미수령', match: (order) => order.status === 'UNCLAIMED' },
];

function statusLabel(order: Order) {
  switch (order.status) {
    case 'COMPLETED':
      return '픽업 완료';
    case 'UNCLAIMED':
      return '미수령 폐기';
    case 'CANCELED':
      return '고객 취소';
    case 'REJECTED':
      return order.rejectReason === 'TIMEOUT'
        ? '자동 거절'
        : `거절${order.rejectReason ? ` · ${REJECT_REASON_LABEL[order.rejectReason]}` : ''}`;
    default:
      return '';
  }
}

interface RecentOrdersModalProps {
  visible: boolean;
  // Today's finished orders, newest first.
  orders: Order[];
  // Starts a refund for a picked-up order (the caller asks for the 2차 비밀번호 first).
  onRefund: (order: Order) => void;
  onClose: () => void;
}

export function RecentOrdersModal({ visible, orders, onRefund, onClose }: RecentOrdersModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <RecentOrdersCard orders={orders} onRefund={onRefund} onClose={onClose} />
      </View>
    </Modal>
  );
}

function RecentOrdersCard({
  orders,
  onRefund,
  onClose,
}: {
  orders: Order[];
  onRefund: (order: Order) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const match = FILTERS.find((item) => item.key === filter)?.match ?? (() => true);
    const needle = query.trim().toLowerCase();
    return orders.filter(
      (order) => match(order) && (needle === '' || order.orderNo.toLowerCase().includes(needle) || order.customerName.includes(needle))
    );
  }, [orders, filter, query]);

  return (
    <View style={styles.card}>
      <ThemedText type="subtitle">오늘 처리 내역</ThemedText>
      <ThemedText type="small" color="textSecondary">
        학생이 "음료가 안 왔어요" 하고 찾아올 때 확인하세요. 픽업 완료한 주문은 환불할 수 있습니다.
      </ThemedText>

      <TextInput
        style={styles.search}
        placeholder="주문번호 또는 이름 검색"
        placeholderTextColor={Colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.chips}>
        {FILTERS.map((item) => (
          <ChoiceChip
            key={item.key}
            label={`${item.label} ${orders.filter(item.match).length}`}
            selected={item.key === filter}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </View>

      <ScrollView style={styles.list}>
        {shown.length === 0 && (
          <ThemedText type="small" color="textMuted" style={styles.empty}>
            해당하는 주문이 없습니다
          </ThemedText>
        )}
        {shown.map((order) => {
          const cancelled = isCancelled(order);
          const lines = cancelled ? order.lines : activeLines(order);
          const refunded = hasRefund(order);
          return (
            <View key={order.id} style={styles.row}>
              <View style={styles.rowMain}>
                <ThemedText type="smallBold">
                  #{order.orderNo} · {order.customerName}
                </ThemedText>
                <ThemedText type="small" color="textSecondary" numberOfLines={2}>
                  {lines
                    .map((line) => {
                      const back = refundedQtyOf(line);
                      return `${lineLabel(line)} x${line.qty}${back > 0 ? ` (${back}개 환불)` : ''}`;
                    })
                    .join(', ')}
                </ThemedText>
              </View>
              <View style={styles.amountSide}>
                <ThemedText
                  type="smallBold"
                  color={cancelled ? 'textMuted' : 'text'}
                  style={cancelled && styles.strike}>
                  {formatWon(cancelled ? order.totalPrice : netTotal(order))}
                </ThemedText>
                {refunded && (
                  <ThemedText type="label" color="danger">
                    환불 -{formatWon(refundedAfterPickup(order))}
                  </ThemedText>
                )}
              </View>
              <View style={styles.rowSide}>
                <ThemedText type="label" color={isCancelled(order) || order.status === 'UNCLAIMED' ? 'danger' : 'success'}>
                  {statusLabel(order)}
                </ThemedText>
                <ThemedText type="small" color="textMuted">
                  {formatTime(order.updatedAt)}
                </ThemedText>
              </View>
              <View style={styles.refundSlot}>
                {canRefund(order) && (
                  <Button label="환불" variant="danger" size="small" style={styles.refundButton} onPress={() => onRefund(order)} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Button label="닫기" variant="secondary" onPress={onClose} />
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
    width: 680,
    maxHeight: '88%',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  search: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: Colors.text,
    fontSize: 15,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  list: {
    flexGrow: 0,
    maxHeight: 320,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowMain: {
    flex: 1,
    gap: Spacing.half,
  },
  amountSide: {
    alignItems: 'flex-end',
    gap: Spacing.half,
    minWidth: 76,
  },
  rowSide: {
    alignItems: 'flex-end',
    gap: Spacing.half,
    minWidth: 76,
  },
  refundSlot: {
    width: 76,
    alignItems: 'flex-end',
  },
  refundButton: {
    width: '100%',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
});
