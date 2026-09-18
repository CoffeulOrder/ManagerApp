import type { Category, MenuItem, Order, Store } from '@/types';

export const MOCK_STORES: Store[] = [
  { id: 'store-beomseok', name: '범석관', school: '을지대학교', status: 'OPEN' },
  { id: 'store-newmill', name: '뉴밀레니엄관', school: '을지대학교', status: 'OPEN' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-espresso', storeId: 'store-beomseok', name: '에스프레소', sortOrder: 0 },
  { id: 'cat-noncoffee', storeId: 'store-beomseok', name: '논커피', sortOrder: 1 },
  { id: 'cat-tea', storeId: 'store-beomseok', name: '티', sortOrder: 2 },
  { id: 'cat-dessert', storeId: 'store-beomseok', name: '디저트', sortOrder: 3 },
  { id: 'cat-espresso-2', storeId: 'store-newmill', name: '에스프레소', sortOrder: 0 },
  { id: 'cat-noncoffee-2', storeId: 'store-newmill', name: '논커피', sortOrder: 1 },
  { id: 'cat-tea-2', storeId: 'store-newmill', name: '티', sortOrder: 2 },
  { id: 'cat-dessert-2', storeId: 'store-newmill', name: '디저트', sortOrder: 3 },
];

function menuFor(storeId: string, categoryId: string): MenuItem[] {
  const suffix = storeId === 'store-beomseok' ? 'a' : 'b';
  return [
    {
      id: `menu-espresso-${suffix}`,
      storeId,
      categoryId,
      name: '에스프레소',
      description: '진하고 풍부한 에스프레소 샷',
      price: 3500,
      soldOut: false,
    },
    {
      id: `menu-americano-${suffix}`,
      storeId,
      categoryId,
      name: '아메리카노',
      description: '에스프레소에 물을 더해 깔끔하게',
      price: 4000,
      soldOut: false,
    },
    {
      id: `menu-cappuccino-${suffix}`,
      storeId,
      categoryId,
      name: '카푸치노',
      description: '에스프레소, 스팀밀크, 우유 거품의 조화',
      price: 5000,
      soldOut: false,
    },
    {
      id: `menu-cafelatte-${suffix}`,
      storeId,
      categoryId,
      name: '카페 라떼',
      description: '부드러운 스팀밀크와 에스프레소',
      price: 5000,
      soldOut: false,
    },
    {
      id: `menu-vanillalatte-${suffix}`,
      storeId,
      categoryId,
      name: '바닐라 라떼',
      description: '달콤한 바닐라 시럽이 어우러진 라떼',
      price: 5500,
      soldOut: false,
      isNew: true,
    },
  ];
}

export const MOCK_MENU_ITEMS: MenuItem[] = [
  ...menuFor('store-beomseok', 'cat-espresso'),
  ...menuFor('store-newmill', 'cat-espresso-2'),
];

function minutesAgo(min: number) {
  return Date.now() - min * 60 * 1000;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderNo: 'BW-114067',
    storeId: 'store-beomseok',
    customerName: '김태완',
    status: 'REQUESTED',
    lines: [
      { id: 'ol-1', menuItemId: 'menu-espresso-a', name: '에스프레소', price: 3500, qty: 3 },
      { id: 'ol-2', menuItemId: 'menu-americano-a', name: '아메리카노', price: 4000, qty: 2 },
    ],
    totalPrice: 18500,
    requestMemo: '얼음 적게 주세요',
    createdAt: minutesAgo(2),
    updatedAt: minutesAgo(2),
  },
  {
    id: 'order-2',
    orderNo: 'BW-114066',
    storeId: 'store-beomseok',
    customerName: '이서연',
    status: 'MAKING',
    lines: [{ id: 'ol-3', menuItemId: 'menu-vanillalatte-a', name: '바닐라 라떼', price: 5500, qty: 1 }],
    totalPrice: 5500,
    createdAt: minutesAgo(6),
    updatedAt: minutesAgo(4),
  },
  {
    id: 'order-3',
    orderNo: 'BW-114065',
    storeId: 'store-beomseok',
    customerName: '박준호',
    status: 'READY',
    lines: [
      { id: 'ol-4', menuItemId: 'menu-cafelatte-a', name: '카페 라떼', price: 5000, qty: 2 },
    ],
    totalPrice: 10000,
    createdAt: minutesAgo(15),
    updatedAt: minutesAgo(9),
  },
  {
    id: 'order-4',
    orderNo: 'BW-114060',
    storeId: 'store-beomseok',
    customerName: '최민아',
    status: 'COMPLETED',
    lines: [{ id: 'ol-5', menuItemId: 'menu-cappuccino-a', name: '카푸치노', price: 5000, qty: 1 }],
    totalPrice: 5000,
    createdAt: minutesAgo(90),
    updatedAt: minutesAgo(80),
  },
  {
    id: 'order-5',
    orderNo: 'BW-114058',
    storeId: 'store-beomseok',
    customerName: '정하늘',
    status: 'COMPLETED',
    lines: [
      { id: 'ol-6', menuItemId: 'menu-americano-a', name: '아메리카노', price: 4000, qty: 4 },
    ],
    totalPrice: 16000,
    createdAt: minutesAgo(180),
    updatedAt: minutesAgo(170),
  },
];
