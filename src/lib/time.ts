export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function isWithinHours(openTime: string, closeTime: string, date: Date) {
  const minutes = minutesOfDay(date);
  return minutes >= toMinutes(openTime) && minutes < toMinutes(closeTime);
}
