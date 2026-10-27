// An unaccepted order is rejected automatically after this long (the backend enforces it too).
export const ORDER_ACCEPT_TIMEOUT_MINUTES = 10;

// "자체 폐기": minutes after 조리 완료 before the store may discard an unclaimed order.
export const DISCARD_MINUTES_MIN = 10;
export const DISCARD_MINUTES_MAX = 180;
export const DISCARD_MINUTES_DEFAULT = 30;

export const REJECT_REASONS = ['OUT_OF_STOCK', 'BUSY', 'STORE_CIRCUMSTANCES', 'TIMEOUT'] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];
export const REJECT_REASON_LABEL: Record<RejectReason, string> = {
  OUT_OF_STOCK: '재료 소진',
  BUSY: '주문 폭주',
  STORE_CIRCUMSTANCES: '매장 사정',
  TIMEOUT: '접수 시간 초과',
};
// TIMEOUT is set by the system only.
export const SELECTABLE_REJECT_REASONS: RejectReason[] = ['OUT_OF_STOCK', 'BUSY', 'STORE_CIRCUMSTANCES'];

// Moving back a step (픽업 완료/조리 완료) is only possible for a short time after the tap.
export const UNDO_WINDOW_MS = 15 * 1000;

export const PAUSE_REASONS = ['BUSY', 'PREP', 'BREAK'] as const;
export type PauseReason = (typeof PAUSE_REASONS)[number];
export const PAUSE_REASON_LABEL: Record<PauseReason, string> = {
  BUSY: '주문 혼잡',
  PREP: '재료 준비',
  BREAK: '휴식',
};
export const PAUSE_DURATIONS_MINUTES = [10, 20, 30, 60] as const;

export const COUPON_TYPES = ['DRINK_VOUCHER', 'AMOUNT_VOUCHER'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];
export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  DRINK_VOUCHER: '음료 교환권',
  AMOUNT_VOUCHER: '금액권',
};

export const OPTION_GROUPS = ['TEMPERATURE', 'SIZE'] as const;
export type OptionGroup = (typeof OPTION_GROUPS)[number];
export const OPTION_GROUP_LABEL: Record<OptionGroup, string> = {
  TEMPERATURE: '온도',
  SIZE: '사이즈',
};
