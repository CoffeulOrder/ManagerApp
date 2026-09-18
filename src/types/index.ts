export type StoreStatus = 'OPEN' | 'PAUSED' | 'CLOSED';

export interface Store {
  id: string;
  name: string;
  school: string;
  status: StoreStatus;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
  isNew?: boolean;
}

export type OrderStatus = 'REQUESTED' | 'MAKING' | 'READY' | 'COMPLETED' | 'REJECTED' | 'CANCELED';

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  orderNo: string;
  storeId: string;
  customerName: string;
  status: OrderStatus;
  lines: OrderLine[];
  totalPrice: number;
  requestMemo?: string;
  rejectReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Merchant {
  id: string;
  businessName: string;
  representative: string;
  email: string;
  password: string;
}
