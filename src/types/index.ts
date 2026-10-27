import type { MenuCategory } from '@/constants/menu-category';
import type { CouponType, OptionGroup, PauseReason, RejectReason } from '@/constants/order';
import type { PartialCancelPolicy } from '@/constants/partial-cancel-policy';

export type StoreStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export interface Store {
  id: string;
  name: string;
  school: string;
  status: StoreStatus;
  // Set while PAUSED. No pausedUntil means the store resumes only when staff say so.
  pausedUntil?: number;
  pauseReason?: PauseReason;
  openTime: string;
  closeTime: string;
  // Fraction of sales kept by the platform (0.05 = 5%); will come from the backend.
  commissionRate: number;
  // Minutes after 조리 완료 before an unclaimed order may be discarded. Only editable while CLOSED.
  discardAfterMinutes: number;
}

// One account per store, issued by the platform admin (no self sign-up).
export interface Account {
  id: string;
  loginId: string;
  password: string;
  secondaryPassword: string;
  storeId: string;
}

export interface MenuItem {
  id: string;
  storeId: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  isHot: boolean;
  isNew?: boolean;
}

export type OrderStatus =
  | 'REQUESTED'
  | 'MAKING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELED'
  | 'UNCLAIMED';

export interface OrderLineOption {
  group: OptionGroup;
  name: string;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  options: OrderLineOption[];
  canceled: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  storeId: string;
  customerName: string;
  status: OrderStatus;
  lines: OrderLine[];
  // Amount originally paid. Lines canceled later are refunded, see lib/order.ts.
  totalPrice: number;
  // Part of totalPrice paid with a coupon; the rest was paid by card.
  couponAmount: number;
  couponType?: CouponType;
  // Chosen by the customer: what to do if the store can't make some of the items.
  partialCancelPolicy: PartialCancelPolicy;
  rejectReason?: RejectReason;
  createdAt: number;
  // The backend auto-rejects an order still REQUESTED at this time.
  expiresAt: number;
  readyAt?: number;
  updatedAt: number;
}
