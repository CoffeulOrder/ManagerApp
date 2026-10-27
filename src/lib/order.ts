import type { Order, OrderLine, OrderStatus } from '@/types';

// Orders only ever move forward. After acceptance nobody can cancel (REQUESTED is the last cancelable state).
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  REQUESTED: ['MAKING', 'REJECTED', 'CANCELED'],
  MAKING: ['READY'],
  READY: ['COMPLETED', 'UNCLAIMED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELED: [],
  UNCLAIMED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

// Only the two step-completing taps can be taken back. Acceptance, rejection and discard never can.
export const UNDO_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  READY: 'MAKING',
  COMPLETED: 'READY',
};

export function rejectConsequence(order: Order) {
  const effect = !isCouponOrder(order)
    ? '결제가 전액 취소되며'
    : order.couponAmount >= order.totalPrice
      ? '사용한 쿠폰이 복원되며'
      : '카드 결제는 환불되고 사용한 쿠폰은 복원되며';
  return `주문을 거절하면 ${effect} 되돌릴 수 없습니다.`;
}

export function lineAmount(line: OrderLine) {
  return line.price * line.qty;
}

export function activeLines(order: Order) {
  return order.lines.filter((line) => !line.canceled);
}

export function refundAmount(order: Order) {
  return order.lines.filter((line) => line.canceled).reduce((sum, line) => sum + lineAmount(line), 0);
}

export function netTotal(order: Order) {
  return order.totalPrice - refundAmount(order);
}

export function hasPartialCancel(order: Order) {
  return order.lines.some((line) => line.canceled);
}

export function isCouponOrder(order: Order) {
  return order.couponAmount > 0;
}

// Pro-rata split of what is left after partial cancels; the backend should send the exact split.
export function paymentSplit(order: Order) {
  const net = netTotal(order);
  const coupon = order.totalPrice > 0 ? Math.round((order.couponAmount * net) / order.totalPrice) : 0;
  return { coupon, card: net - coupon };
}

export function lineLabel(line: OrderLine) {
  const options = line.options.map((option) => option.name).join('/');
  return options ? `${line.name}(${options})` : line.name;
}

export function discardAvailableAt(order: Order, discardAfterMinutes: number) {
  return (order.readyAt ?? order.updatedAt) + discardAfterMinutes * 60 * 1000;
}
