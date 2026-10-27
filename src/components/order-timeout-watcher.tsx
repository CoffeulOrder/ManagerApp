import { useEffect, useRef } from 'react';

import { ORDER_ACCEPT_TIMEOUT_MINUTES } from '@/constants/order';
import { useApp } from '@/context/app-context';
import { useToast } from '@/context/toast';

// Mock only: the backend auto-rejects (and refunds) orders left unaccepted past expiresAt.
// Once it does, the app just receives the REJECTED status and this component goes away.
export function OrderTimeoutWatcher() {
  const { orders, currentStore, rejectOrder } = useApp();
  const { showToast } = useToast();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    function check() {
      const now = Date.now();
      for (const order of orders) {
        if (order.storeId !== currentStore?.id || order.status !== 'REQUESTED') continue;
        if (order.expiresAt > now || handled.current.has(order.id)) continue;
        handled.current.add(order.id);
        rejectOrder(order.id, 'TIMEOUT');
        showToast(`#${order.orderNo} 주문이 접수 시간(${ORDER_ACCEPT_TIMEOUT_MINUTES}분) 초과로 자동 거절되었습니다`);
      }
    }
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, [orders, currentStore, rejectOrder, showToast]);

  return null;
}
