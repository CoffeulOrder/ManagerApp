export function isValidPin(value: string) {
  return /^\d{4}$/.test(value);
}

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
