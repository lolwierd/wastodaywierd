export function toISODate(d: Date, tzOffsetMinutes?: number): string {
  const date = tzOffsetMinutes != null ? new Date(d.getTime() + tzOffsetMinutes * 60_000) : d;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function wrapDayOfYear(n: number): number {
  // 1..366
  if (n < 1) return 365 + n;
  if (n > 365) return n - 365;
  return n;
}

