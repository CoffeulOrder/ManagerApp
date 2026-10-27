import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/button';
import { Calendar } from '@/components/calendar';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addDays, formatDateKey, formatTime, fromDateKey, startOfMonth, todayKey } from '@/lib/date';
import { formatNumber, formatWon } from '@/lib/format';
import { activeLines, hasPartialCancel, isCouponOrder, lineLabel, netTotal } from '@/lib/order';
import { isCancelled, menuSubtotals, revenueOrdersOf, summarize } from '@/lib/sales';
import type { Order } from '@/types';

type Filter = 'DONE' | 'CANCELED' | 'UNCLAIMED' | 'ALL';

const PAGE_SIZE = 10;

interface DailyViewProps {
  ordersByDay: Map<string, Order[]>;
  dateKey: string;
  onChangeDate: (dateKey: string) => void;
}

export function DailyView({ ordersByDay, dateKey, onChangeDate }: DailyViewProps) {
  const today = todayKey();
  const [filter, setFilter] = useState<Filter>('DONE');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(fromDateKey(dateKey)));

  const dayOrders = ordersByDay.get(dateKey) ?? [];
  const revenueOrders = useMemo(() => revenueOrdersOf(dayOrders), [dayOrders]);
  const stats = summarize(revenueOrders);
  const subtotals = useMemo(() => menuSubtotals(revenueOrders), [revenueOrders]);

  const history = useMemo(
    () =>
      dayOrders
        .filter((order) => order.status === 'COMPLETED' || order.status === 'UNCLAIMED' || isCancelled(order))
        .sort((a, b) => b.createdAt - a.createdAt),
    [dayOrders]
  );
  const matches: Record<Filter, (order: Order) => boolean> = {
    DONE: (order) => order.status === 'COMPLETED',
    CANCELED: (order) => isCancelled(order),
    UNCLAIMED: (order) => order.status === 'UNCLAIMED',
    ALL: () => true,
  };
  const filtered = history.filter(matches[filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'DONE', label: '처리 완료' },
    { key: 'CANCELED', label: '취소' },
    { key: 'UNCLAIMED', label: '미수령' },
    { key: 'ALL', label: '전체보기' },
  ];

  function openCalendar() {
    setCalendarMonth(startOfMonth(fromDateKey(dateKey)));
    setCalendarOpen(true);
  }

  return (
    <View style={styles.root}>
      <View style={styles.dateRow}>
        <Pressable style={styles.arrowButton} onPress={() => onChangeDate(addDays(dateKey, -1))} hitSlop={8}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={Colors.text}
            size={18}
          />
        </Pressable>
        <Pressable style={styles.dateLabel} onPress={openCalendar}>
          <ThemedText type="subtitle">{formatDateKey(dateKey)}</ThemedText>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            tintColor={Colors.accent}
            size={20}
          />
          {dateKey === today && (
            <View style={styles.todayBadge}>
              <ThemedText type="label" color="accentText">
                오늘
              </ThemedText>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.arrowButton, dateKey >= today && styles.arrowDisabled]}
          disabled={dateKey >= today}
          onPress={() => onChangeDate(addDays(dateKey, 1))}
          hitSlop={8}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={Colors.text}
            size={18}
          />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <StatCard
          label="총 매출"
          value={formatWon(stats.revenue)}
          caption={`카드 ${formatWon(stats.card)} · 쿠폰 ${formatWon(stats.coupon)}`}
        />
        <StatCard label="주문 건수" value={`${stats.count}건`} />
        <StatCard label="평균 객단가" value={formatWon(stats.average)} />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">주문내역</ThemedText>
        <View style={styles.filterRow}>
          {filters.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilter(item.key)}>
                <ThemedText type="smallBold" color={active ? 'accentText' : 'textSecondary'}>
                  {item.label} {history.filter(matches[item.key]).length}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <OrderHistory key={`${dateKey}-${filter}`} orders={filtered} />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">메뉴별 소계</ThemedText>
        {subtotals.length === 0 ? (
          <ThemedText type="small" color="textMuted">
            판매된 메뉴가 없습니다
          </ThemedText>
        ) : (
          <View style={styles.tableCard}>
            {subtotals.map((item) => (
              <View key={item.name} style={styles.tableRow}>
                <ThemedText type="default" style={styles.flex}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" color="textSecondary">
                  {formatNumber(item.qty)}개
                </ThemedText>
                <ThemedText type="smallBold" color="accent" style={styles.amount}>
                  {formatWon(item.amount)}
                </ThemedText>
              </View>
            ))}
            <View style={[styles.tableRow, styles.totalRow]}>
              <ThemedText type="smallBold" style={styles.flex}>
                합계
              </ThemedText>
              <ThemedText type="smallBold" color="textSecondary">
                {formatNumber(subtotals.reduce((sum, item) => sum + item.qty, 0))}개
              </ThemedText>
              <ThemedText type="smallBold" color="accent" style={styles.amount}>
                {formatWon(stats.revenue)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation()}>
            <Calendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selected={dateKey}
              maxDate={today}
              onSelect={(key) => {
                onChangeDate(key);
                setCalendarOpen(false);
              }}
            />
            <Button label="닫기" variant="secondary" size="small" onPress={() => setCalendarOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OrderHistory({ orders }: { orders: Order[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <ThemedText type="small" color="textMuted">
        해당하는 주문이 없습니다
      </ThemedText>
    );
  }

  const remaining = orders.length - visible;

  return (
    <View style={styles.tableCard}>
      {orders.slice(0, visible).map((order) => {
        const cancelled = isCancelled(order);
        const partial = !cancelled && hasPartialCancel(order);
        const shownLines = cancelled ? order.lines : activeLines(order);
        return (
          <View key={order.id} style={styles.tableRow}>
            <ThemedText type="small" color="textSecondary" style={styles.orderNo}>
              #{order.orderNo}
            </ThemedText>
            <ThemedText type="small" style={styles.flex} numberOfLines={1}>
              {shownLines.map((line) => `${lineLabel(line)} x${line.qty}`).join(', ')}
            </ThemedText>
            <ThemedText type="small" color="textMuted">
              {formatTime(order.createdAt)}
            </ThemedText>
            <View style={styles.couponSlot}>
              {isCouponOrder(order) && (
                <View style={styles.couponBadge}>
                  <ThemedText type="label" color="accent">
                    쿠폰
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={styles.statusSlot}>
              {cancelled && (
                <View style={styles.cancelBadge}>
                  <ThemedText type="label" color="danger">
                    {order.status === 'CANCELED'
                      ? '고객 취소'
                      : order.rejectReason === 'TIMEOUT'
                        ? '자동 거절'
                        : '매장 거절'}
                  </ThemedText>
                </View>
              )}
              {order.status === 'UNCLAIMED' && (
                <View style={styles.partialBadge}>
                  <ThemedText type="label" color="warning">
                    미수령 폐기
                  </ThemedText>
                </View>
              )}
              {partial && (
                <View style={styles.partialBadge}>
                  <ThemedText type="label" color="warning">
                    부분 취소
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText
              type="smallBold"
              color={cancelled ? 'textMuted' : 'accent'}
              style={[styles.amount, cancelled && styles.strike]}>
              {formatWon(cancelled ? order.totalPrice : netTotal(order))}
            </ThemedText>
          </View>
        );
      })}
      {remaining > 0 && (
        <Pressable style={styles.moreButton} onPress={() => setVisible(visible + PAGE_SIZE)}>
          <ThemedText type="smallBold" color="accent">
            더보기 ({remaining}건 남음)
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  dateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  todayBadge: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  filterPill: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
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
  totalRow: {
    backgroundColor: Colors.backgroundSelected,
    borderBottomWidth: 0,
  },
  orderNo: {
    width: 96,
  },
  statusSlot: {
    width: 88,
    alignItems: 'center',
  },
  couponSlot: {
    width: 48,
    alignItems: 'center',
  },
  couponBadge: {
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  partialBadge: {
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  cancelBadge: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  amount: {
    minWidth: 84,
    textAlign: 'right',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  moreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCard: {
    width: 440,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
