import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useApp } from '@/context/app-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Order } from '@/types';

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
];

function withinPeriod(ts: number, period: Period) {
  const now = new Date();
  const date = new Date(ts);
  if (period === 'today') {
    return date.toDateString() === now.toDateString();
  }
  const diffDays = (now.getTime() - ts) / (1000 * 60 * 60 * 24);
  if (period === 'week') return diffDays <= 7;
  return diffDays <= 31;
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function SalesScreen() {
  const { orders, currentStore } = useApp();
  const [period, setPeriod] = useState<Period>('today');

  const completed = useMemo(
    () =>
      orders.filter(
        (o) => o.storeId === currentStore?.id && o.status === 'COMPLETED' && withinPeriod(o.createdAt, period)
      ),
    [orders, currentStore, period]
  );

  const totalRevenue = completed.reduce((sum, o) => sum + o.totalPrice, 0);
  const orderCount = completed.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  const bestSellers = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; amount: number }>();
    for (const order of completed) {
      for (const line of order.lines) {
        const prev = map.get(line.name) ?? { name: line.name, qty: 0, amount: 0 };
        prev.qty += line.qty;
        prev.amount += line.qty * line.price;
        map.set(line.name, prev);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [completed]);

  const sortedOrders = useMemo(() => [...completed].sort((a, b) => b.createdAt - a.createdAt), [completed]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.periodRow}>
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <Pressable
              key={p.key}
              style={[styles.periodPill, active && styles.periodPillActive]}
              onPress={() => setPeriod(p.key)}>
              <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                {p.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statRow}>
        <StatCard label="총 매출" value={`${totalRevenue.toLocaleString()}원`} />
        <StatCard label="주문 건수" value={`${orderCount}건`} />
        <StatCard label="평균 객단가" value={`${avgOrderValue.toLocaleString()}원`} />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          베스트 메뉴
        </ThemedText>
        {bestSellers.length === 0 ? (
          <ThemedText type="small" color="textMuted">
            해당 기간의 판매 데이터가 없습니다
          </ThemedText>
        ) : (
          <View style={styles.tableCard}>
            {bestSellers.map((item, index) => (
              <View key={item.name} style={styles.tableRow}>
                <ThemedText type="small" color="textSecondary" style={styles.rank}>
                  {index + 1}
                </ThemedText>
                <ThemedText type="default" style={styles.tableCell}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" color="textSecondary">
                  {item.qty}개
                </ThemedText>
                <ThemedText type="smallBold" color="accent" style={styles.tableAmount}>
                  {item.amount.toLocaleString()}원
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          주문 내역
        </ThemedText>
        {sortedOrders.length === 0 ? (
          <ThemedText type="small" color="textMuted">
            완료된 주문이 없습니다
          </ThemedText>
        ) : (
          <View style={styles.tableCard}>
            {sortedOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <ThemedText type="small" color="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="title" style={styles.statValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemSummary = order.lines.map((l) => `${l.name} x${l.qty}`).join(', ');
  return (
    <View style={styles.tableRow}>
      <ThemedText type="small" color="textSecondary" style={styles.orderNo}>
        #{order.orderNo}
      </ThemedText>
      <ThemedText type="small" style={styles.tableCell} numberOfLines={1}>
        {itemSummary}
      </ThemedText>
      <ThemedText type="small" color="textMuted">
        {formatDateTime(order.createdAt)}
      </ThemedText>
      <ThemedText type="smallBold" color="accent" style={styles.tableAmount}>
        {order.totalPrice.toLocaleString()}원
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  periodRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.pill,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  periodPill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  periodPillActive: {
    backgroundColor: Colors.accent,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  statValue: {
    marginTop: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    marginBottom: Spacing.one,
  },
  tableCard: {
    backgroundColor: Colors.backgroundElement,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rank: {
    width: 20,
  },
  tableCell: {
    flex: 1,
  },
  tableAmount: {
    minWidth: 80,
    textAlign: 'right',
  },
  orderNo: {
    width: 96,
  },
});
