import { describe, expect, it } from 'vitest';
import { streakView, tickKey, type StreakTask } from './view';

const task = (id: string, critical = true, extra: Partial<StreakTask> = {}): StreakTask => ({
  id, streak_critical: critical, anchor_date: '2027-03-01', ends_on: null, paused: false, every_n_days: 1, ...extra,
});
const tasks = [task('meal'), task('walk'), task('litter', false)];
const ticks = (...pairs: Array<[string, string]>) => new Set(pairs.map(([t, d]) => tickKey(t, d)));

describe('streakView', () => {
  it('first day: nothing ticked shows 0, completing today shows 1', () => {
    const base = { tasks, restDays: new Set<string>(), petFirstDay: '2027-03-01', lastClosed: null, today: '2027-03-01' };
    expect(streakView({ ...base, ticks: ticks() })).toMatchObject({ shown: 0, todayDue: 2, todayDone: 0, todayComplete: false });
    expect(streakView({ ...base, ticks: ticks(['meal', '2027-03-01']) })).toMatchObject({ shown: 0, todayDone: 1 });
    expect(streakView({ ...base, ticks: ticks(['meal', '2027-03-01'], ['walk', '2027-03-01']) })).toMatchObject({ shown: 1, todayComplete: true });
  });

  it('non-critical tasks never count', () => {
    const v = streakView({ tasks, ticks: ticks(['litter', '2027-03-01']), restDays: new Set(), petFirstDay: '2027-03-01', lastClosed: null, today: '2027-03-01' });
    expect(v.todayDone).toBe(0);
  });

  it('walks open days the server has not closed yet', () => {
    const v = streakView({
      tasks, restDays: new Set(), petFirstDay: '2027-03-01', today: '2027-03-04',
      lastClosed: { date: '2027-03-02', streak: 2, passesUsedInMonth: 0 },
      ticks: ticks(['meal', '2027-03-03'], ['walk', '2027-03-03']),
    });
    expect(v).toMatchObject({ base: 3, shown: 3, todayComplete: false });
  });

  it('a missed open day uses a paw pass and keeps the streak', () => {
    const v = streakView({
      tasks, restDays: new Set(), petFirstDay: '2027-03-01', today: '2027-03-04',
      lastClosed: { date: '2027-03-02', streak: 2, passesUsedInMonth: 0 }, ticks: ticks(),
    });
    expect(v.base).toBe(2);
  });

  it('no due critical tasks today is never "complete"', () => {
    const v = streakView({ tasks: [task('litter', false)], ticks: ticks(), restDays: new Set(), petFirstDay: '2027-03-01', lastClosed: null, today: '2027-03-01' });
    expect(v).toMatchObject({ todayDue: 0, todayComplete: false, shown: 0 });
  });
});
