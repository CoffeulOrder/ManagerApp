import type { MenuCategory } from '@/constants/menu-category';
import {
  DISCARD_MINUTES_DEFAULT,
  ORDER_ACCEPT_TIMEOUT_MINUTES,
  type CouponType,
  type RejectReason,
} from '@/constants/order';
import type { PartialCancelPolicy } from '@/constants/partial-cancel-policy';
import type { Account, MenuItem, Order, OrderLine, OrderLineOption, OrderStatus, Store } from '@/types';

export const MOCK_STORES: Store[] = [
  {
    id: 'store-beomseok',
    name: '범석관',
    school: '을지대학교',
    status: 'OPEN',
    openTime: '09:00',
    closeTime: '18:00',
    commissionRate: 0.05,
    discardAfterMinutes: DISCARD_MINUTES_DEFAULT,
  },
  {
    id: 'store-newmill',
    name: '뉴밀레니엄관',
    school: '을지대학교',
    status: 'OPEN',
    openTime: '08:30',
    closeTime: '17:30',
    commissionRate: 0.05,
    discardAfterMinutes: DISCARD_MINUTES_DEFAULT,
  },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc-beomseok', loginId: 'beomseok', password: 'password', secondaryPassword: '1234', storeId: 'store-beomseok' },
  { id: 'acc-newmill', loginId: 'newmill', password: 'password', secondaryPassword: '5678', storeId: 'store-newmill' },
];

interface MenuSeed {
  key: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  isHot?: boolean;
  isNew?: boolean;
}

const MENU_SEEDS: MenuSeed[] = [
  { key: 'espresso', category: 'ESPRESSO', name: '에스프레소', description: '진하고 풍부한 에스프레소 샷', price: 3500 },
  { key: 'americano', category: 'ESPRESSO', name: '아메리카노', description: '에스프레소에 물을 더해 깔끔하게', price: 4000, isHot: true },
  { key: 'cappuccino', category: 'ESPRESSO', name: '카푸치노', description: '에스프레소, 스팀밀크, 우유 거품의 조화', price: 5000 },
  { key: 'cafelatte', category: 'ESPRESSO', name: '카페 라떼', description: '부드러운 스팀밀크와 에스프레소', price: 5000, isHot: true },
  { key: 'vanillalatte', category: 'ESPRESSO', name: '바닐라 라떼', description: '달콤한 바닐라 시럽이 어우러진 라떼', price: 5500, isNew: true },
  { key: 'chocolatte', category: 'NON_COFFEE', name: '초코 라떼', description: '진한 초콜릿과 부드러운 우유', price: 5000 },
  { key: 'strawberry', category: 'NON_COFFEE', name: '딸기 스무디', description: '생딸기를 갈아 만든 상큼한 스무디', price: 5500 },
  { key: 'chamomile', category: 'TEA', name: '캐모마일', description: '은은한 향의 허브티', price: 4000 },
  { key: 'earlgrey', category: 'TEA', name: '얼그레이', description: '베르가못 향이 가득한 홍차', price: 4000 },
  { key: 'cheesecake', category: 'DESSERT', name: '치즈케이크', description: '꾸덕한 뉴욕식 치즈케이크', price: 6000 },
  { key: 'croffle', category: 'DESSERT', name: '크로플', description: '바삭한 크루아상 와플', price: 4500 },
];

const STORE_SUFFIX: Record<string, string> = { 'store-beomseok': 'a', 'store-newmill': 'b' };

export const MOCK_MENU_ITEMS: MenuItem[] = MOCK_STORES.flatMap((store) =>
  MENU_SEEDS.map((seed) => ({
    id: `menu-${seed.key}-${STORE_SUFFIX[store.id]}`,
    storeId: store.id,
    category: seed.category,
    name: seed.name,
    description: seed.description,
    price: seed.price,
    soldOut: false,
    isHot: seed.isHot ?? false,
    isNew: seed.isNew,
  }))
);

const HOT: OrderLineOption = { group: 'TEMPERATURE', name: 'HOT' };
const ICE: OrderLineOption = { group: 'TEMPERATURE', name: 'ICE' };
const SIZE_R: OrderLineOption = { group: 'SIZE', name: 'R' };
const SIZE_L: OrderLineOption = { group: 'SIZE', name: 'L' };

function minutesAgo(min: number) {
  return Date.now() - min * 60 * 1000;
}

function expiresAfter(createdAt: number) {
  return createdAt + ORDER_ACCEPT_TIMEOUT_MINUTES * 60 * 1000;
}

const LIVE_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderNo: 'BW-114067',
    storeId: 'store-beomseok',
    customerName: '김태완',
    status: 'REQUESTED',
    lines: [
      { id: 'ol-1', menuItemId: 'menu-espresso-a', name: '에스프레소', price: 3500, qty: 3, options: [], canceled: false },
      { id: 'ol-2', menuItemId: 'menu-americano-a', name: '아메리카노', price: 4000, qty: 2, options: [ICE, SIZE_L], canceled: false },
    ],
    totalPrice: 18500,
    couponAmount: 0,
    partialCancelPolicy: 'ALLOW_PARTIAL',
    createdAt: minutesAgo(2),
    expiresAt: expiresAfter(minutesAgo(2)),
    updatedAt: minutesAgo(2),
  },
  {
    id: 'order-6',
    orderNo: 'BW-114068',
    storeId: 'store-beomseok',
    customerName: '오세린',
    status: 'REQUESTED',
    lines: [
      { id: 'ol-7', menuItemId: 'menu-cafelatte-a', name: '카페 라떼', price: 5000, qty: 1, options: [HOT, SIZE_R], canceled: false },
      { id: 'ol-8', menuItemId: 'menu-vanillalatte-a', name: '바닐라 라떼', price: 5500, qty: 1, options: [ICE, SIZE_L], canceled: false },
    ],
    totalPrice: 10500,
    couponAmount: 5000,
    couponType: 'DRINK_VOUCHER',
    partialCancelPolicy: 'CANCEL_ALL',
    createdAt: minutesAgo(1),
    expiresAt: expiresAfter(minutesAgo(1)),
    updatedAt: minutesAgo(1),
  },
  {
    id: 'order-2',
    orderNo: 'BW-114066',
    storeId: 'store-beomseok',
    customerName: '이서연',
    status: 'MAKING',
    lines: [
      { id: 'ol-3', menuItemId: 'menu-vanillalatte-a', name: '바닐라 라떼', price: 5500, qty: 1, options: [ICE, SIZE_R], canceled: false },
    ],
    totalPrice: 5500,
    couponAmount: 0,
    partialCancelPolicy: 'ALLOW_PARTIAL',
    createdAt: minutesAgo(6),
    expiresAt: expiresAfter(minutesAgo(6)),
    updatedAt: minutesAgo(4),
  },
  {
    id: 'order-3',
    orderNo: 'BW-114065',
    storeId: 'store-beomseok',
    customerName: '박준호',
    status: 'READY',
    lines: [
      { id: 'ol-4', menuItemId: 'menu-cafelatte-a', name: '카페 라떼', price: 5000, qty: 2, options: [HOT, SIZE_L], canceled: false },
    ],
    totalPrice: 10000,
    couponAmount: 0,
    partialCancelPolicy: 'CANCEL_ALL',
    createdAt: minutesAgo(15),
    expiresAt: expiresAfter(minutesAgo(15)),
    readyAt: minutesAgo(9),
    updatedAt: minutesAgo(9),
  },
  {
    id: 'order-7',
    orderNo: 'BW-114050',
    storeId: 'store-beomseok',
    customerName: '한지우',
    status: 'READY',
    lines: [
      { id: 'ol-9', menuItemId: 'menu-americano-a', name: '아메리카노', price: 4000, qty: 1, options: [HOT, SIZE_R], canceled: false },
      { id: 'ol-10', menuItemId: 'menu-croffle-a', name: '크로플', price: 4500, qty: 1, options: [], canceled: false },
    ],
    totalPrice: 8500,
    couponAmount: 0,
    partialCancelPolicy: 'ALLOW_PARTIAL',
    createdAt: minutesAgo(62),
    expiresAt: expiresAfter(minutesAgo(62)),
    readyAt: minutesAgo(45),
    updatedAt: minutesAgo(45),
  },
  {
    id: 'order-4',
    orderNo: 'BW-114060',
    storeId: 'store-beomseok',
    customerName: '최민아',
    status: 'COMPLETED',
    lines: [
      { id: 'ol-5', menuItemId: 'menu-cappuccino-a', name: '카푸치노', price: 5000, qty: 1, options: [HOT, SIZE_R], canceled: false },
    ],
    totalPrice: 5000,
    couponAmount: 5000,
    couponType: 'DRINK_VOUCHER',
    partialCancelPolicy: 'ALLOW_PARTIAL',
    createdAt: minutesAgo(90),
    expiresAt: expiresAfter(minutesAgo(90)),
    updatedAt: minutesAgo(80),
  },
  {
    id: 'order-5',
    orderNo: 'BW-114058',
    storeId: 'store-beomseok',
    customerName: '정하늘',
    status: 'COMPLETED',
    lines: [
      { id: 'ol-6', menuItemId: 'menu-americano-a', name: '아메리카노', price: 4000, qty: 4, options: [ICE, SIZE_L], canceled: false },
    ],
    totalPrice: 16000,
    couponAmount: 0,
    partialCancelPolicy: 'CANCEL_ALL',
    createdAt: minutesAgo(180),
    expiresAt: expiresAfter(minutesAgo(180)),
    updatedAt: minutesAgo(170),
  },
];

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUSTOMER_NAMES = ['김민준', '이서연', '박지호', '최유나', '정하늘', '강도윤', '윤서아', '임태현', '한지우', '오세린'];

function optionsFor(category: MenuCategory, rand: () => number): OrderLineOption[] {
  const size = rand() < 0.5 ? SIZE_R : SIZE_L;
  if (category === 'DESSERT') return [];
  if (category === 'NON_COFFEE') return [size];
  return [rand() < 0.55 ? ICE : HOT, size];
}

// Deterministic past orders (completed / canceled / rejected / unclaimed) so the sales screens have data to browse.
function generateHistory(): Order[] {
  const orders: Order[] = [];
  let seq = 100000;

  MOCK_STORES.forEach((store, storeIndex) => {
    const rand = mulberry32(1000 + storeIndex);
    const menu = MOCK_MENU_ITEMS.filter((item) => item.storeId === store.id);

    for (let offset = 1; offset <= 75; offset++) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);
      const weekend = day.getDay() === 0 || day.getDay() === 6;
      const count = weekend ? Math.floor(rand() * 3) : 5 + Math.floor(rand() * 10);

      for (let i = 0; i < count; i++) {
        const lineCount = 1 + Math.floor(rand() * 3);
        const used = new Set<number>();
        const lines: OrderLine[] = [];
        for (let l = 0; l < lineCount; l++) {
          const index = Math.floor(rand() * menu.length);
          if (used.has(index)) continue;
          used.add(index);
          const item = menu[index];
          lines.push({
            id: `hist-line-${seq}-${l}`,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            qty: 1 + Math.floor(rand() * 3),
            options: optionsFor(item.category, rand),
            canceled: false,
          });
        }

        const roll = rand();
        const status: OrderStatus =
          roll < 0.07 ? 'CANCELED' : roll < 0.11 ? 'REJECTED' : roll < 0.13 ? 'UNCLAIMED' : 'COMPLETED';
        const createdAt = day.getTime() + (9 * 60 + Math.floor(rand() * 9 * 60)) * 60 * 1000;
        const partialCancelPolicy: PartialCancelPolicy = rand() < 0.6 ? 'ALLOW_PARTIAL' : 'CANCEL_ALL';
        const totalPrice = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

        let couponAmount = 0;
        let couponType: CouponType | undefined;
        const couponRoll = rand();
        const drinkLine = lines.find((line) => line.options.length > 0);
        if (couponRoll < 0.15 && drinkLine) {
          couponAmount = Math.min(drinkLine.price, totalPrice);
          couponType = 'DRINK_VOUCHER';
        } else if (couponRoll < 0.2) {
          couponAmount = Math.min(totalPrice, 3000);
          couponType = 'AMOUNT_VOUCHER';
        }

        if (status === 'COMPLETED' && partialCancelPolicy === 'ALLOW_PARTIAL' && lines.length >= 2 && rand() < 0.15) {
          lines[lines.length - 1].canceled = true;
        }

        let rejectReason: RejectReason | undefined;
        if (status === 'REJECTED') {
          const reasonRoll = rand();
          rejectReason = reasonRoll < 0.5 ? 'OUT_OF_STOCK' : reasonRoll < 0.8 ? 'STORE_CIRCUMSTANCES' : 'TIMEOUT';
        }

        orders.push({
          id: `hist-${seq}`,
          orderNo: `BW-${seq}`,
          storeId: store.id,
          customerName: CUSTOMER_NAMES[Math.floor(rand() * CUSTOMER_NAMES.length)],
          status,
          lines,
          totalPrice,
          couponAmount,
          couponType,
          partialCancelPolicy,
          rejectReason,
          createdAt,
          expiresAt: expiresAfter(createdAt),
          updatedAt: createdAt + (8 + Math.floor(rand() * 8)) * 60 * 1000,
        });
        seq += 1;
      }
    }
  });

  return orders;
}

export const MOCK_ORDERS: Order[] = [...LIVE_ORDERS, ...generateHistory()];
