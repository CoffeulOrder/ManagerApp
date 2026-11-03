import { toDateKey } from '@/lib/date';
import { activeLines, netTotal, paymentSplit, refundedQtyOf } from '@/lib/order';
import type { Order } from '@/types';

export function isCancelled(order: Order) {
  return order.status === 'CANCELED' || order.status === 'REJECTED';
}

// Orders that earned money: picked up, or paid but never collected (the store discarded the drink).
// An order refunded in full earned nothing, so it no longer counts.
export function revenueOrdersOf(orders: Order[]) {
  return orders.filter(
    (order) => (order.status === 'COMPLETED' || order.status === 'UNCLAIMED') && netTotal(order) > 0
  );
}

export function summarize(revenueOrders: Order[]) {
  let card = 0;
  let coupon = 0;
  for (const order of revenueOrders) {
    const split = paymentSplit(order);
    card += split.card;
    coupon += split.coupon;
  }
  const revenue = card + coupon;
  const count = revenueOrders.length;
  return { revenue, card, coupon, count, average: count > 0 ? Math.round(revenue / count) : 0 };
}

export function groupByDay(orders: Order[]) {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const key = toDateKey(new Date(order.createdAt));
    const list = map.get(key);
    if (list) list.push(order);
    else map.set(key, [order]);
  }
  return map;
}

export function menuSubtotals(revenueOrders: Order[]) {
  const map = new Map<string, { name: string; qty: number; amount: number }>();
  for (const order of revenueOrders) {
    for (const line of activeLines(order)) {
      const qty = line.qty - refundedQtyOf(line);
      if (qty <= 0) continue;
      const entry = map.get(line.name) ?? { name: line.name, qty: 0, amount: 0 };
      entry.qty += qty;
      entry.amount += line.price * qty;
      map.set(line.name, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));
}
