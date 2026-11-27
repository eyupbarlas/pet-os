// What Today shows for the streak (mobile.md 3.6). The server's last closed day is the base; every
// day it hasn't closed yet (up to yesterday) is walked with the same rules, and today adds one as
// soon as every streak-critical task due today is ticked.
import { addDays, daysBetween, isDue, type LocalDate, type TaskSchedule } from '../day';
import { walk, type DayInput, type StreakState } from './index';

export interface StreakTask extends TaskSchedule {
  id: string;
  streak_critical: boolean;
}

export interface ClosedDay {
  date: LocalDate;
  streak: number;
  passesUsedInMonth: number;
}

export interface StreakViewInput {
  tasks: StreakTask[];
  /** `${task_id}|${local_date}` for every slot-0 tick of this pet. */
  ticks: Set<string>;
  restDays: Set<LocalDate>;
  /** The pet's creation day in the household's time zone. */
  petFirstDay: LocalDate;
  /** Latest `streak_day` row, or null before the server closed any day. */
  lastClosed: ClosedDay | null;
  today: LocalDate;
  /** Safety cap on how many open days are walked on the phone. */
  maxOpenDays?: number;
}

export interface StreakView {
  /** Streak through yesterday (server value plus provisional open days). */
  base: number;
  /** Streak-critical tasks due today, and how many of them are ticked. */
  todayDue: number;
  todayDone: number;
  todayComplete: boolean;
  /** The number on the streak chip: base, plus one once today is complete. */
  shown: number;
}

export const tickKey = (taskId: string, date: LocalDate) => `${taskId}|${date}`;

export function dayInput(i: Pick<StreakViewInput, 'tasks' | 'ticks' | 'restDays' | 'petFirstDay'>, date: LocalDate): DayInput {
  const due = i.tasks.filter((t) => t.streak_critical && isDue(t, date));
  return {
    date,
    dueCount: due.length,
    tickedCount: due.filter((t) => i.ticks.has(tickKey(t.id, date))).length,
    hasRestDay: i.restDays.has(date),
    isFirstDayOfPet: date === i.petFirstDay,
  };
}

export function streakView(i: StreakViewInput): StreakView {
  const yesterday = addDays(i.today, -1);
  let start = i.lastClosed ? addDays(i.lastClosed.date, 1) : i.petFirstDay;
  const cap = i.maxOpenDays ?? 62;
  if (daysBetween(start, yesterday) >= cap) start = addDays(yesterday, -(cap - 1));

  const state: StreakState = i.lastClosed
    ? { streak: i.lastClosed.streak, passesUsedInMonth: i.lastClosed.passesUsedInMonth, month: i.lastClosed.date.slice(0, 7) }
    : { streak: 0, passesUsedInMonth: 0, month: start.slice(0, 7) };

  const open: DayInput[] = [];
  for (let d = start; d <= yesterday; d = addDays(d, 1)) open.push(dayInput(i, d));
  const walked = walk(state, open);
  const base = walked.length ? walked[walked.length - 1]!.streak : state.streak;

  const today = dayInput(i, i.today);
  const todayComplete = today.dueCount > 0 && today.tickedCount >= today.dueCount;
  return { base, todayDue: today.dueCount, todayDone: today.tickedCount, todayComplete, shown: base + (todayComplete ? 1 : 0) };
}
