export function formatNumber(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatWon(value: number) {
  return `${formatNumber(value)}원`;
}

export function formatShortWon(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
  return formatNumber(value);
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
