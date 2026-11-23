// Household local date (ADR 0015). The household's time zone decides the day, never the phone's.
import { DateTime } from 'luxon';

export type LocalDate = string; // 'yyyy-MM-dd'

export function localDate(now: Date | number, timezone: string): LocalDate {
  const dt = DateTime.fromMillis(typeof now === 'number' ? now : now.getTime(), { zone: timezone });
  if (!dt.isValid) throw new Error(`invalid time zone: ${timezone}`);
  return dt.toFormat('yyyy-MM-dd');
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toFormat('yyyy-MM-dd');
}

export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round(DateTime.fromISO(to, { zone: 'utc' }).diff(DateTime.fromISO(from, { zone: 'utc' }), 'days').days);
}

/** Epoch ms of the next household midnight after `now` (for re-evaluating "today"). */
export function nextMidnight(now: Date | number, timezone: string): number {
  const dt = DateTime.fromMillis(typeof now === 'number' ? now : now.getTime(), { zone: timezone });
  return dt.plus({ days: 1 }).startOf('day').toMillis();
}

export interface TaskSchedule {
  anchor_date: LocalDate;
  ends_on: LocalDate | null;
  paused: boolean;
  every_n_days: number;
}

/** Due on local date d (backend-sync.md 3.1). */
export function isDue(t: TaskSchedule, d: LocalDate): boolean {
  if (t.paused) return false;
  if (t.anchor_date > d) return false;
  if (t.ends_on !== null && t.ends_on < d) return false;
  return daysBetween(t.anchor_date, d) % t.every_n_days === 0;
}

/** Tick undo window: today and yesterday (ADR 0014). */
export const canUndo = (tickDate: LocalDate, today: LocalDate) => tickDate >= addDays(today, -1) && tickDate <= today;
