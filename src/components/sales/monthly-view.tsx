import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Calendar } from '@/components/calendar';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { formatDateKey, todayKey, toDateKey } from '@/lib/date';
import { formatShortWon, formatWon } from '@/lib/format';
import { revenueOrdersOf, summarize } from '@/lib/sales';
import type { Order } from '@/types';

const CALENDAR_CELL_HEIGHT = 84;

interface MonthlyViewProps {
  ordersByDay: Map<string, Order[]>;
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: string | null;
  onSelect: (dateKey: string | null) => void;
  onOpenDay: (dateKey: string) => void;
  commissionRate: number;
}

export function MonthlyView({
  ordersByDay,
  month,
  onMonthChange,
  selected,
  onSelect,
  onOpenDay,
  commissionRate,
}: MonthlyViewProps) {
  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    ordersByDay.forEach((orders, key) => map.set(key, summarize(revenueOrdersOf(orders)).revenue));
    return map;
  }, [ordersByDay]);

  const monthStats = useMemo(() => {
    const prefix = toDateKey(month).slice(0, 7);
    const revenueOrders: Order[] = [];
    ordersByDay.forEach((orders, key) => {
      if (key.startsWith(prefix)) revenueOrders.push(...revenueOrdersOf(orders));
    });
    const stats = summarize(revenueOrders);
    // Coupon sales carry the same commission but are listed on their own line.
    const cardCommission = Math.round(stats.card * commissionRate);
    const couponCommission = Math.round(stats.coupon * commissionRate);
    const commission = cardCommission + couponCommission;
    return { ...stats, cardCommission, couponCommission, commission, settlement: stats.revenue - commission };
  }, [ordersByDay, month, commissionRate]);

  const selectedStats = selected ? summarize(revenueOrdersOf(ordersByDay.get(selected) ?? [])) : null;
  const ratePercent = Math.round(commissionRate * 1000) / 10;

  return (
    <View style={styles.root}>
      <View style={styles.statRow}>
        <StatCard
          label="월간 총 매출"
          value={formatWon(monthStats.revenue)}
          caption={`카드 ${formatWon(monthStats.card)} · 쿠폰 ${formatWon(monthStats.coupon)}`}
        />
        <StatCard label="주문 건수" value={`${monthStats.count}건`} />
        <StatCard label="평균 객단가" value={formatWon(monthStats.average)} />
      </View>
      <View style={styles.statRow}>
        <StatCard
          label={`수수료 (${ratePercent}%)`}
          value={formatWon(monthStats.commission)}
          caption={`카드분 ${formatWon(monthStats.cardCommission)} · 쿠폰분 ${formatWon(monthStats.couponCommission)}`}
        />
        <StatCard
          emphasis
          label="예상 정산 금액"
          value={formatWon(monthStats.settlement)}
          style={styles.settlementCard}
        />
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          month={month}
          onMonthChange={onMonthChange}
          selected={selected}
          maxDate={todayKey()}
          cellHeight={CALENDAR_CELL_HEIGHT}
          onSelect={onSelect}
          renderCaption={(key) => {
            const revenue = revenueByDay.get(key) ?? 0;
            return revenue > 0 ? formatShortWon(revenue) : undefined;
          }}
        />
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => onSelect(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => onSelect(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selected && selectedStats && (
              <>
                <ThemedText type="subtitle">{formatDateKey(selected)}</ThemedText>
                <View style={styles.modalStats}>
                  <StatCard
                    compact
                    label="총 매출"
                    value={formatWon(selectedStats.revenue)}
                    caption={`카드 ${formatWon(selectedStats.card)} · 쿠폰 ${formatWon(selectedStats.coupon)}`}
                  />
                  <StatCard compact label="주문 건수" value={`${selectedStats.count}건`} />
                  <StatCard compact label="평균 객단가" value={formatWon(selectedStats.average)} />
                </View>
                <View style={styles.modalActions}>
                  <Button label="닫기" variant="secondary" style={styles.modalButton} onPress={() => onSelect(null)} />
                  <Button label="자세히 보기" style={styles.modalButton} onPress={() => onOpenDay(selected)} />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  settlementCard: {
    flex: 2,
  },
  calendarCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 400,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  modalStats: {
    gap: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalButton: {
    flex: 1,
  },
});
