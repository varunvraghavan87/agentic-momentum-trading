const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function nowIST(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

export function todayIST(): string {
  return formatDateIST(new Date());
}

export function formatDateIST(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().split('T')[0];
}

export function formatDateTimeIST(date: Date): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().replace('T', ' ').replace('Z', ' IST');
}

export function isMarketHours(date?: Date): boolean {
  const now = date ?? new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const day = ist.getUTCDay();

  if (day === 0 || day === 6) return false;

  const timeMinutes = hours * 60 + minutes;
  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
}

export function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
