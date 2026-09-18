import { addMonths, format, getDaysInMonth, parseISO, setDate } from "date-fns";

// clamps to end of month if it's shorter than `day`
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

// if `anchorDateStr` is still upcoming, returns it as-is (so a due date that's
// genuinely 2 months out - e.g. a card's first statement - stays 2 months out);
// once it's passed, rolls forward to the next occurrence of that day-of-month
export function nextOccurrenceFromAnchor(anchorDateStr: string, from: Date = new Date()): string {
  const anchor = parseISO(anchorDateStr);
  const anchorDay = new Date(anchor);
  anchorDay.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  if (anchorDay >= today) {
    return format(anchor, "yyyy-MM-dd");
  }
  return nextOccurrenceOfDay(anchor.getDate(), from);
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  // parseISO, not new Date() - the latter parses "2026-09-17" as UTC and rolls back a day here
  const target = parseISO(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
