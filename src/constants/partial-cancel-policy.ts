export const PARTIAL_CANCEL_POLICIES = ['ALLOW_PARTIAL', 'CANCEL_ALL'] as const;

export type PartialCancelPolicy = (typeof PARTIAL_CANCEL_POLICIES)[number];

export const PARTIAL_CANCEL_POLICY_LABEL: Record<PartialCancelPolicy, string> = {
  ALLOW_PARTIAL: '부분 취소 허용',
  CANCEL_ALL: '부분 취소 시 전체 취소',
};
