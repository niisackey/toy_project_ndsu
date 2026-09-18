import { addMonths, format, getDaysInMonth, parseISO, setDate } from "date-fns";

/**
 * Given a day-of-month (1-28) and a reference date, returns the next date
 * (today or later) that falls on that day-of-month, as "yyyy-MM-dd". Clamps
 * to the last day of a month if that month is shorter than requested.
 */
export function nextOccurrenceOfDay(day: number, from: Date = new Date()): string {
  const clampedThisMonth = Math.min(day, getDaysInMonth(from));
  let candidate = setDate(from, clampedThisMonth);
  candidate.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  if (candidate < today) {
    const nextMonth = addMonths(from, 1);
    const clampedNextMonth = Math.min(day, getDaysInMonth(nextMonth));
    candidate = setDate(nextMonth, clampedNextMonth);
  }
  return format(candidate, "yyyy-MM-dd");
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  // parseISO (not `new Date(...)`) so a date-only string like "2026-09-17" is
  // read as local midnight, matching how `from` is normalized below - the
  // native Date constructor instead reads date-only strings as UTC midnight,
  // which silently shifts the result by a day in most US timezones.
  const target = parseISO(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
