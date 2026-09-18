import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Order, OrderStatus } from '@/types';

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: 'REQUESTED', title: '접수 대기' },
  { status: 'MAKING', title: '제조중' },
  { status: 'READY', title: '픽업 대기' },
];

function timeAgo(ts: number) {
  const min = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (min < 1) return '방금 전';
  return `${min}분 전`;
}

export default function OrdersScreen() {
  const { orders, currentStore, acceptOrder, rejectOrder, markReady, completeOrder } = useApp();

  const storeOrders = useMemo(
    () => orders.filter((o) => o.storeId === currentStore?.id),
    [orders, currentStore]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.columns}>
        {COLUMNS.map((col) => {
          const items = storeOrders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.createdAt - b.createdAt);
          return (
            <View key={col.status} style={styles.column}>
              <View style={styles.columnHeader}>
                <ThemedText type="subtitle">{col.title}</ThemedText>
                <View style={styles.countBadge}>
                  <ThemedText type="smallBold" color="accentText">
                    {items.length}
                  </ThemedText>
                </View>
              </View>
              <ScrollView style={styles.columnList} contentContainerStyle={styles.columnListContent}>
                {items.length === 0 && (
                  <ThemedText type="small" color="textMuted" style={styles.emptyText}>
                    대기 중인 주문이 없습니다
                  </ThemedText>
                )}
                {items.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAccept={() => acceptOrder(order.id)}
                    onReject={() => rejectOrder(order.id, '매장 사정으로 거절')}
                    onReady={() => markReady(order.id)}
                    onComplete={() => completeOrder(order.id)}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OrderCard({
  order,
  onAccept,
  onReject,
  onReady,
  onComplete,
}: {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  onReady: () => void;
  onComplete: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold">#{order.orderNo}</ThemedText>
        <ThemedText type="small" color="textMuted">
          {timeAgo(order.createdAt)}
        </ThemedText>
      </View>
      <ThemedText type="small" color="textSecondary">
        {order.customerName}
      </ThemedText>

      <View style={styles.lines}>
        {order.lines.map((line) => (
          <View key={line.id} style={styles.lineRow}>
            <ThemedText type="small">
              {line.name} x{line.qty}
            </ThemedText>
            <ThemedText type="small" color="textSecondary">
              {(line.price * line.qty).toLocaleString()}원
            </ThemedText>
          </View>
        ))}
      </View>

      {order.requestMemo && (
        <ThemedText type="small" color="warning" style={styles.memo}>
          "{order.requestMemo}"
        </ThemedText>
      )}

      <View style={styles.cardFooter}>
        <ThemedText type="price" color="accent">
          {order.totalPrice.toLocaleString()}원
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {order.status === 'REQUESTED' && (
          <>
            <Button label="거절" variant="danger" size="small" style={styles.actionButton} onPress={onReject} />
            <Button label="수락" variant="primary" size="small" style={styles.actionButton} onPress={onAccept} />
          </>
        )}
        {order.status === 'MAKING' && (
          <Button label="조리 완료" variant="primary" size="small" style={styles.fullButton} onPress={onReady} />
        )}
        {order.status === 'READY' && (
          <Button label="픽업 완료" variant="secondary" size="small" style={styles.fullButton} onPress={onComplete} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.four,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.four,
  },
  column: {
    flex: 1,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  countBadge: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  columnList: {
    flex: 1,
  },
  columnListContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  card: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lines: {
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memo: {
    fontStyle: 'italic',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.two,
    marginTop: Spacing.half,
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
});
