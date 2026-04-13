import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  format,
  isToday,
  parseISO,
} from 'date-fns';

export function getISOWeekKey(date: Date): string {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getWeekStart(date: Date): Date {
  return startOfISOWeek(date);
}

export function getWeekEnd(date: Date): Date {
  return endOfISOWeek(date);
}

export function isDayKey(dateKey: string): boolean {
  return isToday(parseISO(dateKey));
}

export function formatWeekRange(weekKey: string): string {
  // weekKey = "2025-W15"
  const [year, weekPart] = weekKey.split('-W');
  const week = parseInt(weekPart, 10);
  // Find Monday of that ISO week
  const jan4 = new Date(parseInt(year), 0, 4);
  const startOfYear = startOfISOWeek(jan4);
  const monday = new Date(startOfYear);
  monday.setDate(startOfYear.getDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d')}`;
}

export function getWeekDays(weekKey: string): Date[] {
  const [year, weekPart] = weekKey.split('-W');
  const week = parseInt(weekPart, 10);
  const jan4 = new Date(parseInt(year), 0, 4);
  const startOfYear = startOfISOWeek(jan4);
  const monday = new Date(startOfYear);
  monday.setDate(startOfYear.getDate() + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getCurrentDayKey(): string {
  return getDayKey(new Date());
}

export function getCurrentWeekKey(): string {
  return getISOWeekKey(new Date());
}
