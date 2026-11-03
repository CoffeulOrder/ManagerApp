import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmModal } from '@/components/confirm-modal';
import { OptionChips } from '@/components/option-chips';
import { PartialCancelModal } from '@/components/partial-cancel-modal';
import { RecentOrdersModal } from '@/components/recent-orders-modal';
import { RefundModal } from '@/components/refund-modal';
import { RejectModal } from '@/components/reject-modal';
import { ThemedText } from '@/components/themed-text';
import { COUPON_TYPE_LABEL, REJECT_REASON_LABEL } from '@/constants/order';
import { PARTIAL_CANCEL_POLICY_LABEL } from '@/constants/partial-cancel-policy';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useToast } from '@/context/toast';
import { useNow } from '@/hooks/use-now';
import { MODAL_SWAP_DELAY } from '@/hooks/use-pin-gate';
import { toDateKey, todayKey } from '@/lib/date';
import { formatCountdown, formatWon } from '@/lib/format';
import {
  activeLines,
  discardAvailableAt,
  isCouponOrder,
  lineAmount,
  netTotal,
  paymentSplit,
  refundAmount,
} from '@/lib/order';
import type { Order, OrderStatus } from '@/types';

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: 'REQUESTED', title: '접수 대기' },
  { status: 'MAKING', title: '제조중' },
  { status: 'READY', title: '픽업 대기' },
];

// Two minutes before auto-reject the countdown turns red.
const URGENT_MS = 2 * 60 * 1000;

function timeAgo(ts: number, now: number) {
  const min = Math.max(0, Math.floor((now - ts) / 60000));
  if (min < 1) return '방금 전';
  return `${min}분 전`;
}

function sortKey(order: Order) {
  return order.status === 'READY' ? (order.readyAt ?? order.createdAt) : order.createdAt;
}

export default function OrdersScreen() {
  const {
    orders,
    currentStore,
    acceptOrder,
    rejectOrder,
    cancelOrderLines,
    refundOrder,
    markReady,
    completeOrder,
    discardUnclaimedOrder,
    undoOrderStatus,
    setSoldOutMany,
  } = useApp();
  const { showToast } = useToast();
  const now = useNow(1000);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [discardTarget, setDiscardTarget] = useState<Order | null>(null);
  const [partialTargetId, setPartialTargetId] = useState<string | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);

  const storeOrders = useMemo(
    () => orders.filter((o) => o.storeId === currentStore?.id),
    [orders, currentStore]
  );

  const partialTarget = storeOrders.find((o) => o.id === partialTargetId) ?? null;
  const refundTarget = storeOrders.find((o) => o.id === refundTargetId) ?? null;
  const finishedToday = useMemo(
    () =>
      storeOrders
        .filter(
          (o) =>
            ['COMPLETED', 'UNCLAIMED', 'REJECTED', 'CANCELED'].includes(o.status) &&
            toDateKey(new Date(o.createdAt)) === todayKey()
        )
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [storeOrders]
  );

  function undo(orderId: string, doneMessage: string) {
    const result = undoOrderStatus(orderId);
    showToast(result.ok ? doneMessage : (result.message ?? '되돌리지 못했습니다'));
  }
  const discardAfterMinutes = currentStore?.discardAfterMinutes ?? 0;

  // The history list steps aside while the refund modal is up (native can't stack two modals).
  function startRefund(order: Order) {
    setRecentOpen(false);
    setTimeout(() => setRefundTargetId(order.id), MODAL_SWAP_DELAY);
  }

  function closeRefund() {
    setRefundTargetId(null);
    setTimeout(() => setRecentOpen(true), MODAL_SWAP_DELAY);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <Button label={`오늘 처리 내역 ${finishedToday.length}`} variant="secondary" size="small" onPress={() => setRecentOpen(true)} />
      </View>
      <View style={styles.columns}>
        {COLUMNS.map((col) => {
          const items = storeOrders.filter((o) => o.status === col.status).sort((a, b) => sortKey(a) - sortKey(b));
          return (
            <View key={col.status} style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={styles.columnTitleRow}>
                  <ThemedText type="subtitle">{col.title}</ThemedText>
                  <View style={styles.countBadge}>
                    <ThemedText type="smallBold" color="accentText">
                      {items.length}
                    </ThemedText>
                  </View>
                </View>
                {col.status === 'READY' && (
                  <ThemedText type="small" color="textMuted">
                    자체 폐기 기준 · 준비 완료 후 {discardAfterMinutes}분
                  </ThemedText>
                )}
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
                    now={now}
                    discardAfterMinutes={discardAfterMinutes}
                    onAccept={() => {
                      acceptOrder(order.id);
                      showToast(`#${order.orderNo} 주문을 수락했습니다`);
                    }}
                    onReject={() => setRejectTarget(order)}
                    onPartialCancel={() => setPartialTargetId(order.id)}
                    onReady={() => {
                      markReady(order.id);
                      showToast(`#${order.orderNo} 조리 완료 · 픽업 대기로 이동했습니다`, {
                        actionLabel: '실행 취소',
                        durationMs: 5000,
                        onAction: () => undo(order.id, `#${order.orderNo} 조리 완료를 취소했습니다`),
                      });
                    }}
                    onComplete={() => {
                      completeOrder(order.id);
                      showToast(`#${order.orderNo} 픽업 완료 처리했습니다`, {
                        actionLabel: '실행 취소',
                        durationMs: 5000,
                        onAction: () => undo(order.id, `#${order.orderNo} 픽업 완료를 취소했습니다`),
                      });
                    }}
                    onDiscard={() => setDiscardTarget(order)}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>

      <RejectModal
        order={rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={(reason, soldOutMenuIds) => {
          if (!rejectTarget) return;
          rejectOrder(rejectTarget.id, reason);
          if (soldOutMenuIds.length > 0) setSoldOutMany(soldOutMenuIds, true);
          showToast(
            `#${rejectTarget.orderNo} 주문을 거절했습니다 · ${REJECT_REASON_LABEL[reason]}` +
              (soldOutMenuIds.length > 0 ? ` · 메뉴 ${soldOutMenuIds.length}개 품절 처리` : '')
          );
          setRejectTarget(null);
        }}
      />

      <RecentOrdersModal
        visible={recentOpen}
        orders={finishedToday}
        onRefund={startRefund}
        onClose={() => setRecentOpen(false)}
      />

      <RefundModal
        order={refundTarget}
        onCancel={closeRefund}
        onConfirm={(items) => {
          const result = refundOrder(refundTarget?.id ?? '', items);
          if (result.ok) {
            showToast(`#${refundTarget?.orderNo} 환불 처리했습니다`);
            closeRefund();
          }
          return result;
        }}
      />


      <ConfirmModal
        visible={discardTarget !== null}
        title="미수령 주문을 폐기할까요?"
        message={
          discardTarget
            ? `#${discardTarget.orderNo} (${discardTarget.customerName}) 주문을 폐기 처리합니다. 찾아가지 않은 음료를 폐기한 것으로 기록되며 되돌릴 수 없습니다.`
            : undefined
        }
        confirmLabel="폐기하기"
        cancelLabel="돌아가기"
        destructive
        onCancel={() => setDiscardTarget(null)}
        onConfirm={() => {
          if (discardTarget) {
            const result = discardUnclaimedOrder(discardTarget.id);
            showToast(
              result.ok ? `#${discardTarget.orderNo} 미수령 주문을 폐기 처리했습니다` : (result.message ?? '폐기하지 못했습니다')
            );
          }
          setDiscardTarget(null);
        }}
      />

      <PartialCancelModal
        order={partialTarget}
        onCancel={() => setPartialTargetId(null)}
        onConfirm={(lineIds) => {
          const result = cancelOrderLines(partialTarget?.id ?? '', lineIds);
          if (result.ok) setPartialTargetId(null);
          return result;
        }}
      />
    </View>
  );
}

function OrderCard({
  order,
  now,
  discardAfterMinutes,
  onAccept,
  onReject,
  onPartialCancel,
  onReady,
  onComplete,
  onDiscard,
}: {
  order: Order;
  now: number;
  discardAfterMinutes: number;
  onAccept: () => void;
  onReject: () => void;
  onPartialCancel: () => void;
  onReady: () => void;
  onComplete: () => void;
  onDiscard: () => void;
}) {
  const allowPartial = order.partialCancelPolicy === 'ALLOW_PARTIAL';
  const canPartialCancel = order.status === 'REQUESTED' && allowPartial && activeLines(order).length >= 2;
  const refund = refundAmount(order);
  const coupon = isCouponOrder(order);
  const split = paymentSplit(order);

  const remainingMs = order.expiresAt - now;
  const urgent = order.status === 'REQUESTED' && remainingMs <= URGENT_MS;

  const readyAt = order.readyAt ?? order.updatedAt;
  const discardAt = discardAvailableAt(order, discardAfterMinutes);
  const discardable = now >= discardAt;
  const readyMinutes = Math.max(0, Math.floor((now - readyAt) / 60000));
  const discardInMinutes = Math.ceil((discardAt - now) / 60000);

  return (
    <View style={[styles.card, urgent && styles.cardUrgent, order.status === 'READY' && discardable && styles.cardOverdue]}>
      <View style={styles.cardHeader}>
        <ThemedText type="default" style={styles.orderNo}>
          #{order.orderNo}
        </ThemedText>
        <ThemedText type="default" color="textMuted" style={styles.timeAgo}>
          {timeAgo(order.createdAt, now)}
        </ThemedText>
      </View>
      <ThemedText type="default" color="textSecondary">
        {order.customerName}
      </ThemedText>

      {order.status === 'REQUESTED' && (
        <ThemedText type="smallBold" color={urgent ? 'danger' : 'textSecondary'} style={styles.statusLine}>
          자동 거절까지 {formatCountdown(remainingMs)}
        </ThemedText>
      )}
      {order.status === 'READY' && (
        <ThemedText type="smallBold" color={discardable ? 'danger' : 'textSecondary'} style={styles.statusLine}>
          {discardable
            ? `준비 완료 후 ${readyMinutes}분 경과 · 자체 폐기 가능`
            : `준비 완료 후 ${readyMinutes}분 · 자체 폐기까지 ${discardInMinutes}분`}
        </ThemedText>
      )}

      <View style={styles.badgeRow}>
        {order.status === 'REQUESTED' && (
          <View style={[styles.badge, allowPartial && styles.badgeAllow]}>
            <ThemedText type="label" color={allowPartial ? 'success' : 'textSecondary'}>
              {PARTIAL_CANCEL_POLICY_LABEL[order.partialCancelPolicy]}
            </ThemedText>
          </View>
        )}
        {coupon && order.couponType && (
          <View style={[styles.badge, styles.badgeCoupon]}>
            <ThemedText type="label" color="accent">
              {COUPON_TYPE_LABEL[order.couponType]} 사용
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.lines}>
        {order.lines.map((line) => {
          const multiple = line.qty >= 2 && !line.canceled;
          return (
            <View key={line.id} style={styles.lineRow}>
              <View style={[styles.qtyBadge, multiple && styles.qtyBadgeMultiple, line.canceled && styles.qtyBadgeCanceled]}>
                <ThemedText
                  type="subtitle"
                  color={multiple ? 'white' : line.canceled ? 'textMuted' : 'text'}
                  style={styles.qtyText}>
                  {line.qty}
                </ThemedText>
              </View>
              <View style={styles.lineName}>
                <ThemedText
                  type="subtitle"
                  color={line.canceled ? 'textMuted' : 'text'}
                  style={[styles.menuName, line.canceled && styles.strike]}>
                  {line.name}
                </ThemedText>
                <View style={styles.lineMeta}>
                  <View style={styles.lineOptions}>
                    <OptionChips options={line.options} size="large" />
                  </View>
                  <ThemedText type="small" color="textMuted" style={[styles.linePrice, line.canceled && styles.strike]}>
                    {formatWon(lineAmount(line))}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.cardFooter}>
        {refund > 0 && (
          <ThemedText type="small" color="danger">
            {coupon ? '부분 취소 환불·복원' : '부분 취소 환불'} {formatWon(refund)}
          </ThemedText>
        )}
        {coupon && (
          <ThemedText type="small" color="textMuted">
            카드 {formatWon(split.card)} · 쿠폰 {formatWon(split.coupon)}
          </ThemedText>
        )}
        <ThemedText type="price" color="accent">
          {formatWon(netTotal(order))}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {order.status === 'REQUESTED' && (
          <View style={styles.requestedActions}>
            <View style={styles.actionRow}>
              <Button label="거절" variant="danger" size="small" style={styles.actionButton} onPress={onReject} />
              <Button label="수락" variant="primary" size="small" style={styles.actionButton} onPress={onAccept} />
            </View>
            {canPartialCancel && (
              <Button label="일부 메뉴만 취소" variant="secondary" size="small" onPress={onPartialCancel} />
            )}
            {!allowPartial && (
              <ThemedText type="small" color="textMuted" style={styles.hint}>
                일부 메뉴를 만들 수 없으면 거절(전체 취소)해 주세요.
              </ThemedText>
            )}
          </View>
        )}
        {order.status === 'MAKING' && (
          <Button label="조리 완료" variant="primary" size="small" style={styles.fullButton} onPress={onReady} />
        )}
        {order.status === 'READY' && (
          <View style={styles.readyActions}>
            <Button label="픽업 완료" variant="secondary" size="small" style={styles.actionButton} onPress={onComplete} />
            <Button
              label="자체 폐기"
              variant="danger"
              size="small"
              style={styles.actionButton}
              disabled={!discardable}
              onPress={onDiscard}
            />
          </View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.three,
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
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.one,
    gap: Spacing.half,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
  cardUrgent: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  cardOverdue: {
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  orderNo: {
    fontWeight: '800',
    fontSize: 17,
  },
  timeAgo: {
    fontSize: 14,
  },
  statusLine: {
    fontSize: 14,
  },
  lines: {
    marginTop: Spacing.one,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSelected,
  },
  lineName: {
    flex: 1,
  },
  lineMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  lineOptions: {
    flex: 1,
  },
  linePrice: {
    marginLeft: 'auto',
    fontSize: 14,
  },
  menuName: {
    fontSize: 19,
    lineHeight: 25,
    paddingTop: 3,
  },
  qtyBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: Radius.small,
    backgroundColor: Colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  qtyBadgeMultiple: {
    backgroundColor: Colors.accent,
  },
  qtyBadgeCanceled: {
    backgroundColor: Colors.backgroundElevated,
  },
  qtyText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundSelected,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  badgeAllow: {
    backgroundColor: Colors.successBg,
  },
  badgeCoupon: {
    backgroundColor: Colors.backgroundElevated,
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
  requestedActions: {
    flex: 1,
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  readyActions: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  hint: {
    textAlign: 'center',
  },
  actionButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
});
