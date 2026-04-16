// Colombia is UTC-5, no DST
function getColombiaDate(): Date {
  const now = new Date();
  return new Date(now.getTime() - 5 * 60 * 60 * 1000);
}

// Format a Date as YYYY-MM-DD using its UTC fields.
// All dates passed here must be UTC-anchored (getWeekDays, getColombiaDate output).
export function getDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

// Today's date in Colombia time
export function getCurrentDayKey(): string {
  return getDayKey(getColombiaDate());
}

// Week key = YYYY-MM-DD of the Sunday that starts this week, in Colombia time.
// e.g. week of Apr 13–19 → "2025-04-13"
export function getWeekKey(date?: Date): string {
  const d = date ?? getColombiaDate();
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const sunday = new Date(d.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  return getDayKey(sunday);
}

// Backward-compat alias
export const getISOWeekKey = getWeekKey;

export function getCurrentWeekKey(): string {
  return getWeekKey();
}

// Return the 7 days (Sun–Sat) of a week as UTC-midnight Date objects
export function getWeekDays(weekKey: string): Date[] {
  const sunday = new Date(weekKey + 'T00:00:00Z');
  return Array.from({ length: 7 }, (_, i) =>
    new Date(sunday.getTime() + i * 24 * 60 * 60 * 1000)
  );
}

// "Apr 13 – Apr 19" from weekKey "2025-04-13"
export function formatWeekRange(weekKey: string): string {
  const sunday = new Date(weekKey + 'T00:00:00Z');
  const saturday = new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[sunday.getUTCMonth()]} ${sunday.getUTCDate()} – ${months[saturday.getUTCMonth()]} ${saturday.getUTCDate()}`;
}

// Is this dateKey equal to today in Colombia time?
export function isDayKey(dateKey: string): boolean {
  return dateKey === getCurrentDayKey();
}

// Start and end of a week given its weekKey
export function getWeekStart(weekKey: string): Date {
  return new Date(weekKey + 'T00:00:00Z');
}

export function getWeekEnd(weekKey: string): Date {
  const sunday = new Date(weekKey + 'T00:00:00Z');
  return new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
}
