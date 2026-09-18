import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import { MOCK_CATEGORIES, MOCK_MENU_ITEMS, MOCK_ORDERS, MOCK_STORES } from '@/data/mock';
import type { Category, Merchant, MenuItem, Order, OrderStatus, Store, StoreStatus } from '@/types';

interface AppState {
  merchant: Merchant | null;
  registeredMerchants: Merchant[];
  currentStoreId: string | null;
  stores: Store[];
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
}

const initialState: AppState = {
  merchant: null,
  registeredMerchants: [
    {
      id: 'merchant-demo',
      businessName: '커풀 을지대점',
      representative: '홍길동',
      email: 'brew@example.com',
      password: 'password',
    },
  ],
  currentStoreId: null,
  stores: MOCK_STORES,
  categories: MOCK_CATEGORIES,
  menuItems: MOCK_MENU_ITEMS,
  orders: MOCK_ORDERS,
};

type Action =
  | { type: 'LOGIN'; merchant: Merchant }
  | { type: 'SIGNUP'; merchant: Merchant }
  | { type: 'LOGOUT' }
  | { type: 'SELECT_STORE'; storeId: string }
  | { type: 'SET_STORE_STATUS'; storeId: string; status: StoreStatus }
  | { type: 'ADD_MENU_ITEM'; item: MenuItem }
  | { type: 'REMOVE_MENU_ITEM'; id: string }
  | { type: 'TOGGLE_SOLD_OUT'; id: string }
  | { type: 'SET_ORDER_STATUS'; id: string; status: OrderStatus; reason?: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SIGNUP':
      return {
        ...state,
        registeredMerchants: [...state.registeredMerchants, action.merchant],
        merchant: action.merchant,
      };
    case 'LOGIN':
      return { ...state, merchant: action.merchant };
    case 'LOGOUT':
      return { ...state, merchant: null, currentStoreId: null };
    case 'SELECT_STORE':
      return { ...state, currentStoreId: action.storeId };
    case 'SET_STORE_STATUS':
      return {
        ...state,
        stores: state.stores.map((s) => (s.id === action.storeId ? { ...s, status: action.status } : s)),
      };
    case 'ADD_MENU_ITEM':
      return { ...state, menuItems: [...state.menuItems, action.item] };
    case 'REMOVE_MENU_ITEM':
      return { ...state, menuItems: state.menuItems.filter((m) => m.id !== action.id) };
    case 'TOGGLE_SOLD_OUT':
      return {
        ...state,
        menuItems: state.menuItems.map((m) => (m.id === action.id ? { ...m, soldOut: !m.soldOut } : m)),
      };
    case 'SET_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id
            ? { ...o, status: action.status, rejectReason: action.reason ?? o.rejectReason, updatedAt: Date.now() }
            : o
        ),
      };
    default:
      return state;
  }
}

interface AppContextValue extends AppState {
  currentStore: Store | null;
  login: (email: string, password: string) => { ok: boolean; message?: string };
  signup: (input: { businessName: string; representative: string; email: string; password: string }) => {
    ok: boolean;
    message?: string;
  };
  logout: () => void;
  selectStore: (storeId: string) => void;
  setStoreStatus: (storeId: string, status: StoreStatus) => void;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'soldOut'>) => void;
  removeMenuItem: (id: string) => void;
  toggleSoldOut: (id: string) => void;
  acceptOrder: (id: string) => void;
  rejectOrder: (id: string, reason?: string) => void;
  markReady: (id: string) => void;
  completeOrder: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = useCallback<AppContextValue['login']>(
    (email, password) => {
      const found = state.registeredMerchants.find((m) => m.email === email);
      if (!found) return { ok: false, message: '등록되지 않은 이메일입니다.' };
      if (found.password !== password) return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
      dispatch({ type: 'LOGIN', merchant: found });
      return { ok: true };
    },
    [state.registeredMerchants]
  );

  const signup = useCallback<AppContextValue['signup']>(
    ({ businessName, representative, email, password }) => {
      if (!businessName || !representative || !email || !password) {
        return { ok: false, message: '모든 항목을 입력해 주세요.' };
      }
      if (state.registeredMerchants.some((m) => m.email === email)) {
        return { ok: false, message: '이미 가입된 이메일입니다.' };
      }
      dispatch({
        type: 'SIGNUP',
        merchant: { id: `merchant-${Date.now()}`, businessName, representative, email, password },
      });
      return { ok: true };
    },
    [state.registeredMerchants]
  );

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
  const selectStore = useCallback((storeId: string) => dispatch({ type: 'SELECT_STORE', storeId }), []);
  const setStoreStatus = useCallback(
    (storeId: string, status: StoreStatus) => dispatch({ type: 'SET_STORE_STATUS', storeId, status }),
    []
  );
  const addMenuItem = useCallback(
    (item: Omit<MenuItem, 'id' | 'soldOut'>) =>
      dispatch({ type: 'ADD_MENU_ITEM', item: { ...item, id: `menu-${Date.now()}`, soldOut: false } }),
    []
  );
  const removeMenuItem = useCallback((id: string) => dispatch({ type: 'REMOVE_MENU_ITEM', id }), []);
  const toggleSoldOut = useCallback((id: string) => dispatch({ type: 'TOGGLE_SOLD_OUT', id }), []);
  const acceptOrder = useCallback((id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'MAKING' }), []);
  const rejectOrder = useCallback(
    (id: string, reason?: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'REJECTED', reason }),
    []
  );
  const markReady = useCallback((id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'READY' }), []);
  const completeOrder = useCallback(
    (id: string) => dispatch({ type: 'SET_ORDER_STATUS', id, status: 'COMPLETED' }),
    []
  );

  const currentStore = useMemo(
    () => state.stores.find((s) => s.id === state.currentStoreId) ?? null,
    [state.stores, state.currentStoreId]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      currentStore,
      login,
      signup,
      logout,
      selectStore,
      setStoreStatus,
      addMenuItem,
      removeMenuItem,
      toggleSoldOut,
      acceptOrder,
      rejectOrder,
      markReady,
      completeOrder,
    }),
    [
      state,
      currentStore,
      login,
      signup,
      logout,
      selectStore,
      setStoreStatus,
      addMenuItem,
      removeMenuItem,
      toggleSoldOut,
      acceptOrder,
      rejectOrder,
      markReady,
      completeOrder,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
