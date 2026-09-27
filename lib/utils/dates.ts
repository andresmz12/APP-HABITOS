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

// Week key = YYYY-MM-DD of the Monday that starts this week, in Colombia time.
// e.g. week of Apr 14–20 → "2025-04-14"
export function getWeekKey(date?: Date): string {
  const d = date ?? getColombiaDate();
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday = 0, ..., Sunday = 6
  const monday = new Date(d.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  return getDayKey(monday);
}

// Backward-compat alias
export const getISOWeekKey = getWeekKey;

export function getCurrentWeekKey(): string {
  return getWeekKey();
}

// Return the 7 days (Mon–Sun) of a week as UTC-midnight Date objects
export function getWeekDays(weekKey: string): Date[] {
  const monday = new Date(weekKey + 'T00:00:00Z');
  return Array.from({ length: 7 }, (_, i) =>
    new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
  );
}

// "Apr 14 – Apr 20" from weekKey "2025-04-14"
export function formatWeekRange(weekKey: string): string {
  const monday = new Date(weekKey + 'T00:00:00Z');
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[monday.getUTCMonth()]} ${monday.getUTCDate()} – ${months[sunday.getUTCMonth()]} ${sunday.getUTCDate()}`;
}

// Is this dateKey equal to today in Colombia time?
export function isDayKey(dateKey: string): boolean {
  return dateKey === getCurrentDayKey();
}

// The dateKey for the day before the given one
export function getPrevDayKey(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00Z');
  return getDayKey(new Date(d.getTime() - 24 * 60 * 60 * 1000));
}

// Start and end of a week given its weekKey
export function getWeekStart(weekKey: string): Date {
  return new Date(weekKey + 'T00:00:00Z');
}

export function getWeekEnd(weekKey: string): Date {
  const sunday = new Date(weekKey + 'T00:00:00Z');
  return new Date(sunday.getTime() + 6 * 24 * 60 * 60 * 1000);
}

export function getPrevWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00Z');
  return getDayKey(new Date(d.getTime() - 7 * 24 * 60 * 60 * 1000));
}

export function getNextWeekKey(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00Z');
  return getDayKey(new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000));
}

// Month key = "YYYY-MM", in Colombia time
export function getMonthKey(date?: Date): string {
  const d = date ?? getColombiaDate();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKey();
}

export function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return getMonthKey(d);
}

export function getNextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return getMonthKey(d);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

// Full calendar grid (Mon–Sun rows) for a month, including the padding days
// from the previous/next month needed to fill complete weeks.
export function getMonthGridDays(monthKey: string): Date[] {
  const [y, m] = monthKey.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const lastOfMonth = new Date(Date.UTC(y, m, 0));

  const startOffset = (firstOfMonth.getUTCDay() + 6) % 7; // days since Monday
  const gridStart = new Date(firstOfMonth.getTime() - startOffset * 24 * 60 * 60 * 1000);

  const endOffset = (lastOfMonth.getUTCDay() + 6) % 7; // days since Monday
  const gridEnd = new Date(lastOfMonth.getTime() + (6 - endOffset) * 24 * 60 * 60 * 1000);

  const days: Date[] = [];
  for (let d = gridStart; d.getTime() <= gridEnd.getTime(); d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(d);
  }
  return days;
}
