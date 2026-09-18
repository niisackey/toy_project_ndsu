import { addMonths, format, getDaysInMonth, parseISO, setDate } from "date-fns";

// next date >= `from` that falls on the given day-of-month, as yyyy-MM-dd.
// clamps to the last day of the month if it's shorter than `day`.
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
  // parseISO, not new Date() - new Date("2026-09-17") parses as UTC midnight
  // and rolls back a day once we zero the local hours below (bit me once already)
  const target = parseISO(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
