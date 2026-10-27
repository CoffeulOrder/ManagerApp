import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { MOCK_ACCOUNTS, MOCK_MENU_ITEMS, MOCK_ORDERS, MOCK_STORES } from '@/data/mock';
import {
  DISCARD_MINUTES_MAX,
  DISCARD_MINUTES_MIN,
  ORDER_ACCEPT_TIMEOUT_MINUTES,
  UNDO_WINDOW_MS,
  type PauseReason,
  type RejectReason,
} from '@/constants/order';
import { activeLines, canTransition, discardAvailableAt, UNDO_TRANSITIONS } from '@/lib/order';
import { isValidPin } from '@/lib/validation';
import type { Account, MenuItem, Order, OrderStatus, Store, StoreStatus } from '@/types';

interface AppState {
  accountId: string | null;
  accounts: Account[];
  stores: Store[];
  menuItems: MenuItem[];
  orders: Order[];
}

const initialState: AppState = {
  accountId: null,
  accounts: MOCK_ACCOUNTS,
  stores: MOCK_STORES,
  menuItems: MOCK_MENU_ITEMS,
  orders: MOCK_ORDERS,
};

type MenuPatch = Partial<Pick<MenuItem, 'name' | 'description' | 'price'>>;

type Action =
  | { type: 'LOGIN'; accountId: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_PASSWORD'; accountId: string; password: string }
  | { type: 'SET_SECONDARY_PASSWORD'; accountId: string; secondaryPassword: string }
  | { type: 'SET_STORE_STATUS'; storeId: string; status: StoreStatus }
  | { type: 'PAUSE_STORE'; storeId: string; until?: number; reason: PauseReason }
  | { type: 'SET_STORE_HOURS'; storeId: string; openTime: string; closeTime: string }
  | { type: 'ADD_MENU_ITEM'; item: MenuItem }
  | { type: 'REMOVE_MENU_ITEM'; id: string }
  | { type: 'UPDATE_MENU_ITEM'; id: string; patch: MenuPatch }
  | { type: 'TOGGLE_SOLD_OUT'; id: string }
  | { type: 'SET_SOLD_OUT'; ids: string[]; soldOut: boolean }
  | { type: 'SET_ORDER_STATUS'; id: string; status: OrderStatus; reason?: RejectReason }
  | { type: 'SET_DISCARD_MINUTES'; storeId: string; minutes: number }
  | { type: 'UNDO_ORDER_STATUS'; id: string }
  | { type: 'CANCEL_ORDER_LINES'; id: string; lineIds: string[] }
  | { type: 'ADD_ORDER'; order: Order };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, accountId: action.accountId };
    case 'LOGOUT':
      return { ...state, accountId: null };
    case 'SET_PASSWORD':
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.accountId ? { ...a, password: action.password } : a)),
      };
    case 'SET_SECONDARY_PASSWORD':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.accountId ? { ...a, secondaryPassword: action.secondaryPassword } : a
        ),
      };
    case 'SET_STORE_STATUS':
      return {
        ...state,
        stores: state.stores.map((s) =>
          s.id === action.storeId
            ? { ...s, status: action.status, pausedUntil: undefined, pauseReason: undefined }
            : s
        ),
      };
    case 'PAUSE_STORE':
      return {
        ...state,
        stores: state.stores.map((s) =>
          s.id === action.storeId
            ? { ...s, status: 'PAUSED', pausedUntil: action.until, pauseReason: action.reason }
            : s
        ),
      };
    case 'SET_STORE_HOURS':
      return {
        ...state,
        stores: state.stores.map((s) =>
          s.id === action.storeId ? { ...s, openTime: action.openTime, closeTime: action.closeTime } : s
        ),
      };
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.item] };
    case 'REMOVE_MENU_ITEM':
      return { ...state, menuItems: state.menuItems.filter((m) => m.id !== action.id) };
    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      };
    case 'TOGGLE_SOLD_OUT':
      return {
        ...state,
        menuItems: state.menuItems.map((m) => (m.id === action.id ? { ...m, soldOut: !m.soldOut } : m)),
      };
    case 'SET_SOLD_OUT':
      return {
        ...state,
        menuItems: state.menuItems.map((m) => (action.ids.includes(m.id) ? { ...m, soldOut: action.soldOut } : m)),
      };
    case 'UNDO_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) => {
          const previous = UNDO_TRANSITIONS[o.status];
          if (o.id !== action.id || !previous) return o;
          return { ...o, status: previous, readyAt: previous === 'MAKING' ? undefined : o.readyAt, updatedAt: Date.now() };
        }),
      };
    case 'SET_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) => {
          // Ignores illegal or repeated transitions (double taps, cancel after acceptance).
          if (o.id !== action.id || !canTransition(o.status, action.status)) return o;
          const now = Date.now();
          return {
            ...o,
            status: action.status,
            rejectReason: action.reason ?? o.rejectReason,
            readyAt: action.status === 'READY' ? now : o.readyAt,
            updatedAt: now,
          };
        }),
      };
    case 'SET_DISCARD_MINUTES':
      return {
        ...state,
        stores: state.stores.map((s) => (s.id === action.storeId ? { ...s, discardAfterMinutes: action.minutes } : s)),
      };
    case 'CANCEL_ORDER_LINES':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id
            ? {
                ...o,
                lines: o.lines.map((l) => (action.lineIds.includes(l.id) ? { ...l, canceled: true } : l)),
                updatedAt: Date.now(),
              }
            : o
        ),
      };
    case 'ADD_ORDER':
      return { ...state, orders: [...state.orders, action.order] };
    default:
      return state;
  }
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

interface AppContextValue extends AppState {
  account: Account | null;
  currentStore: Store | null;
  login: (loginId: string, password: string) => ActionResult;
  logout: () => void;
  verifySecondaryPassword: (pin: string) => boolean;
  changePassword: (current: string, next: string) => ActionResult;
  changeSecondaryPassword: (current: string, next: string) => ActionResult;
  setStoreStatus: (storeId: string, status: StoreStatus) => void;
  pauseStore: (minutes: number | null, reason: PauseReason) => void;
  updateStoreHours: (openTime: string, closeTime: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'soldOut' | 'isHot'>) => void;
  removeMenuItem: (id: string) => void;
  updateMenuItem: (id: string, patch: MenuPatch) => void;
  toggleSoldOut: (id: string) => void;
  // Returns how many orders still waiting for acceptance contain one of these menus.
  setSoldOutMany: (ids: string[], soldOut: boolean) => { waitingOrders: number };
  acceptOrder: (id: string) => void;
  rejectOrder: (id: string, reason?: RejectReason) => void;
  cancelOrderLines: (id: string, lineIds: string[]) => ActionResult;
  markReady: (id: string) => void;
  completeOrder: (id: string) => void;
  discardUnclaimedOrder: (id: string) => ActionResult;
  undoOrderStatus: (id: string) => ActionResult;
  updateDiscardMinutes: (minutes: number) => ActionResult;
  // Dev only: stands in for an order arriving from the backend.
  simulateIncomingOrder: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Toast buttons run seconds after the tap, so they must read the latest orders, not the ones from when they were created.
  const ordersRef = useRef(state.orders);
  useEffect(() => {
    ordersRef.current = state.orders;
  }, [state.orders]);

  const account = useMemo(
    () => state.accounts.find((a) => a.id === state.accountId) ?? null,
    [state.accounts, state.accountId]
  );
  const currentStore = useMemo(
    () => state.stores.find((s) => s.id === account?.storeId) ?? null,
    [state.stores, account]
  );

  const login = useCallback<AppContextValue['login']>(
    (loginId, password) => {
      const found = state.accounts.find((a) => a.loginId === loginId);
      if (!found || found.password !== password) {
        return { ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
      }
      dispatch({ type: 'LOGIN', accountId: found.id });
      return { ok: true };
    },
    [state.accounts]
  );

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const verifySecondaryPassword = useCallback(
    (pin: string) => account !== null && account.secondaryPassword === pin,
    [account]
  );

  const changePassword = useCallback<AppContextValue['changePassword']>(
    (current, next) => {
      if (!account) return { ok: false, message: '로그인이 필요합니다.' };
      if (account.password !== current) return { ok: false, message: '현재 비밀번호가 일치하지 않습니다.' };
      if (next.length < 6) return { ok: false, message: '새 비밀번호는 6자 이상이어야 합니다.' };
      dispatch({ type: 'SET_PASSWORD', accountId: account.id, password: next });
      return { ok: true };
    },
    [account]
  );

  const changeSecondaryPassword = useCallback<AppContextValue['changeSecondaryPassword']>(
    (current, next) => {
      if (!account) return { ok: false, message: '로그인이 필요합니다.' };
      if (account.secondaryPassword !== current) {
        return { ok: false, message: '현재 2차 비밀번호가 일치하지 않습니다.' };
      }
      if (!isValidPin(next)) return { ok: false, message: '2차 비밀번호는 숫자 4자리여야 합니다.' };
      dispatch({ type: 'SET_SECONDARY_PASSWORD', accountId: account.id, secondaryPassword: next });
      return { ok: true };
    },
    [account]
  );

  const setStoreStatus = useCallback(
    (storeId: string, status: StoreStatus) => dispatch({ type: 'SET_STORE_STATUS', storeId, status }),
    []
  );
  const pauseStore = useCallback(
    (minutes: number | null, reason: PauseReason) => {
      if (!currentStore) return;
      const until = minutes === null ? undefined : Date.now() + minutes * 60 * 1000;
      dispatch({ type: 'PAUSE_STORE', storeId: currentStore.id, until, reason });
    },
    [currentStore]
  );
  const updateStoreHours = useCallback(
    (openTime: string, closeTime: string) => {
      if (!currentStore) return;
      dispatch({ type: 'SET_STORE_HOURS', storeId: currentStore.id, openTime, closeTime });
    },
    [currentStore]
  );
  const addMenuItem = useCallback(
    (item: Omit<MenuItem, 'id' | 'soldOut' | 'isHot'>) =>
      dispatch({ type: 'ADD_MENU_ITEM', item: { ...item, id: `menu-${Date.now()}`, soldOut: false, isHot: false } }),
    []
  );
  const removeMenuItem = useCallback((id: string) => dispatch({ type: 'REMOVE_MENU_ITEM', id }), []);
  const updateMenuItem = useCallback(
    (id: string, patch: MenuPatch) => dispatch({ type: 'UPDATE_MENU_ITEM', id, patch }),
    []
  );
  const toggleSoldOut = useCallback((id: string) => dispatch({ type: 'TOGGLE_SOLD_OUT', id }), []);
  const setSoldOutMany = useCallback<AppContextValue['setSoldOutMany']>(
    (ids, soldOut) => {
      dispatch({ type: 'SET_SOLD_OUT', ids, soldOut });
      if (!soldOut || !currentStore) return { waitingOrders: 0 };
      const waitingOrders = state.orders.filter(
        (o) =>
          o.storeId === currentStore.id &&
          o.status === 'REQUESTED' &&
          activeLines(o).some((line) => ids.includes(line.menuItemId))
      ).length;
      return { waitingOrders };
    },
    [currentStore, state.orders]
  );
  const acceptOrder = useCallback((id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'MAKING' }), []);
  const rejectOrder = useCallback(
    (id: string, reason: RejectReason = 'STORE_CIRCUMSTANCES') =>
      dispatch({ type: 'SET_ORDER_STATUS', id, status: 'REJECTED', reason }),
    []
  );
  const cancelOrderLines = useCallback<AppContextValue['cancelOrderLines']>(
    (id, lineIds) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order) return { ok: false, message: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'REQUESTED') {
        return { ok: false, message: '수락 전 주문만 취소할 수 있습니다.' };
      }
      if (order.partialCancelPolicy !== 'ALLOW_PARTIAL') {
        return { ok: false, message: '부분 취소가 허용되지 않은 주문입니다. 전체 취소(거절)만 가능합니다.' };
      }
      const remaining = order.lines.filter((l) => !l.canceled && !lineIds.includes(l.id));
      if (remaining.length === 0) {
        return { ok: false, message: '모든 메뉴를 취소하려면 주문 거절을 사용해 주세요.' };
      }
      dispatch({ type: 'CANCEL_ORDER_LINES', id, lineIds });
      return { ok: true };
    },
    [state.orders]
  );
  const discardUnclaimedOrder = useCallback<AppContextValue['discardUnclaimedOrder']>(
    (id) => {
      const order = state.orders.find((o) => o.id === id);
      if (!order || !currentStore) return { ok: false, message: '주문을 찾을 수 없습니다.' };
      if (order.status !== 'READY') return { ok: false, message: '픽업 대기 중인 주문만 폐기할 수 있습니다.' };
      if (Date.now() < discardAvailableAt(order, currentStore.discardAfterMinutes)) {
        return { ok: false, message: '자체 폐기 기준 시간이 지나지 않았습니다.' };
      }
      dispatch({ type: 'SET_ORDER_STATUS', id, status: 'UNCLAIMED' });
      return { ok: true };
    },
    [state.orders, currentStore]
  );

  const undoOrderStatus = useCallback<AppContextValue['undoOrderStatus']>(
    (id) => {
      const order = ordersRef.current.find((o) => o.id === id);
      if (!order || !UNDO_TRANSITIONS[order.status]) {
        return { ok: false, message: '되돌릴 수 없는 상태입니다.' };
      }
      if (Date.now() - order.updatedAt > UNDO_WINDOW_MS) {
        return { ok: false, message: '되돌릴 수 있는 시간이 지났습니다.' };
      }
      dispatch({ type: 'UNDO_ORDER_STATUS', id });
      return { ok: true };
    },
    []
  );

  const updateDiscardMinutes = useCallback<AppContextValue['updateDiscardMinutes']>(
    (minutes) => {
      if (!currentStore) return { ok: false, message: '로그인이 필요합니다.' };
      if (currentStore.status !== 'CLOSED') {
        return { ok: false, message: '영업 종료(마감) 상태에서만 수정할 수 있습니다.' };
      }
      if (!Number.isInteger(minutes) || minutes < DISCARD_MINUTES_MIN || minutes > DISCARD_MINUTES_MAX) {
        return { ok: false, message: `${DISCARD_MINUTES_MIN}분 이상 ${DISCARD_MINUTES_MAX}분 이하로 입력해 주세요.` };
      }
      dispatch({ type: 'SET_DISCARD_MINUTES', storeId: currentStore.id, minutes });
      return { ok: true };
    },
    [currentStore]
  );

  const simulateIncomingOrder = useCallback(() => {
    if (!currentStore) return;
    const menu = state.menuItems.filter((m) => m.storeId === currentStore.id && !m.soldOut).slice(0, 2);
    if (menu.length === 0) return;
    const now = Date.now();
    const lines = menu.map((item, index) => ({
      id: `test-line-${now}-${index}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      options: item.category === 'DESSERT' ? [] : [{ group: 'TEMPERATURE' as const, name: 'ICE' }],
      canceled: false,
    }));
    dispatch({
      type: 'ADD_ORDER',
      order: {
        id: `test-${now}`,
        orderNo: `BW-${String(now).slice(-6)}`,
        storeId: currentStore.id,
        customerName: '테스트 고객',
        status: 'REQUESTED',
        lines,
        totalPrice: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
        couponAmount: 0,
        partialCancelPolicy: 'ALLOW_PARTIAL',
        createdAt: now,
        expiresAt: now + ORDER_ACCEPT_TIMEOUT_MINUTES * 60 * 1000,
        updatedAt: now,
      },
    });
  }, [currentStore, state.menuItems]);
  const markReady = useCallback((id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'READY' }), []);
  const completeOrder = useCallback(
    (id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'COMPLETED' }),
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      account,
      currentStore,
      login,
      logout,
      verifySecondaryPassword,
      changePassword,
      changeSecondaryPassword,
      setStoreStatus,
      pauseStore,
      updateStoreHours,
      addMenuItem,
      removeMenuItem,
      updateMenuItem,
      toggleSoldOut,
      setSoldOutMany,
      acceptOrder,
      rejectOrder,
      cancelOrderLines,
      markReady,
      completeOrder,
      discardUnclaimedOrder,
      undoOrderStatus,
      updateDiscardMinutes,
      simulateIncomingOrder,
    }),
    [
      state,
      account,
      currentStore,
      login,
      logout,
      verifySecondaryPassword,
      changePassword,
      changeSecondaryPassword,
      setStoreStatus,
      pauseStore,
      updateStoreHours,
      addMenuItem,
      removeMenuItem,
      updateMenuItem,
      toggleSoldOut,
      setSoldOutMany,
      acceptOrder,
      rejectOrder,
      cancelOrderLines,
      markReady,
      completeOrder,
      discardUnclaimedOrder,
      undoOrderStatus,
      updateDiscardMinutes,
      simulateIncomingOrder,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
