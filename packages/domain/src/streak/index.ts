// Streak rules (ADR 0016, backend-sync.md 5.1). The server is authoritative; this module gives
// the provisional value the phone shows and is run against the same fixtures as the SQL.
import { addDays, type LocalDate } from '../day';

export type DayOutcome = 'complete' | 'rest' | 'neutral' | 'missed' | 'paw_pass';
export const MAX_PASSES_PER_MONTH = 2;

export interface DayInput {
  date: LocalDate;
  dueCount: number;        // streak-critical tasks due that day
  tickedCount: number;     // of those, how many have a tick
  hasRestDay: boolean;
  isFirstDayOfPet: boolean;
}

export function dayOutcome(d: DayInput): 'complete' | 'rest' | 'neutral' | 'missed' {
  if (d.dueCount === 0) return 'neutral';
  if (d.tickedCount >= d.dueCount) return 'complete';
  if (d.hasRestDay) return 'rest';
  if (d.isFirstDayOfPet) return 'neutral';
  return 'missed';
}

export interface StreakState {
  streak: number;
  passesUsedInMonth: number;
  month: string; // 'yyyy-MM' of the last processed day
}

export interface StreakDay extends StreakState {
  date: LocalDate;
  outcome: DayOutcome;
}

export function step(prev: StreakState, d: DayInput): StreakDay {
  const month = d.date.slice(0, 7);
  const passes = prev.month === month ? prev.passesUsedInMonth : 0; // reset on the 1st
  const base = dayOutcome(d);
  if (base === 'complete') return { date: d.date, outcome: 'complete', streak: prev.streak + 1, passesUsedInMonth: passes, month };
  if (base === 'rest' || base === 'neutral') return { date: d.date, outcome: base, streak: prev.streak, passesUsedInMonth: passes, month };
  if (passes < MAX_PASSES_PER_MONTH) return { date: d.date, outcome: 'paw_pass', streak: prev.streak, passesUsedInMonth: passes + 1, month };
  return { date: d.date, outcome: 'missed', streak: 0, passesUsedInMonth: passes, month };
}

/** Walks consecutive days from `from`; `days` must be sorted and gapless. */
export function walk(start: StreakState, days: DayInput[]): StreakDay[] {
  const out: StreakDay[] = [];
  let state = start;
  let expected = days[0]?.date;
  for (const d of days) {
    if (d.date !== expected) throw new Error(`gap before ${d.date}`);
    const r = step(state, d);
    out.push(r);
    state = r;
    expected = addDays(d.date, 1);
  }
  return out;
}

/** Provisional value: last confirmed streak plus every open day up to (not including) today. */
export function provisionalStreak(confirmed: StreakState, openDays: DayInput[]): number {
  const walked = walk(confirmed, openDays);
  return walked.length ? walked[walked.length - 1]!.streak : confirmed.streak;
}
