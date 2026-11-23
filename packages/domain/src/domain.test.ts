import { describe, expect, it } from 'vitest';
import fixtures from './streak/streak-fixtures.json';
import { addDays, canUndo, isDue, localDate, nextMidnight, tickId, walk, defaultRoutine, parseDecimal, provisionalStreak } from './index';

describe('streak fixtures (shared with the SQL tests)', () => {
  for (const f of fixtures) {
    it(f.name, () => {
      const got = walk(f.start, f.days).map(({ outcome, streak, passesUsedInMonth }) => ({ outcome, streak, passesUsedInMonth }));
      expect(got).toEqual(f.expect);
    });
  }
  it('provisional value equals the walked value', () => {
    const f = fixtures[0]!;
    expect(provisionalStreak(f.start, f.days)).toBe(2);
  });
});

describe('household local date and DST (Europe/Warsaw)', () => {
  const tz = 'Europe/Warsaw';
  it('spring forward: 00:30 CET on 2027-03-28 is 23:30 UTC on the 27th', () => {
    expect(localDate(Date.UTC(2027, 2, 27, 23, 30), tz)).toBe('2027-03-28');
  });
  it('local midnight CEST on 28 March is 22:00 UTC', () => {
    expect(localDate(Date.UTC(2027, 2, 28, 21, 59), tz)).toBe('2027-03-28');
    expect(localDate(Date.UTC(2027, 2, 28, 22, 0), tz)).toBe('2027-03-29');
  });
  it('fall back: 23:30 CET on 2027-10-31 stays on the 31st; day closes 23:00 UTC', () => {
    expect(localDate(Date.UTC(2027, 9, 31, 22, 30), tz)).toBe('2027-10-31');
    expect(nextMidnight(Date.UTC(2027, 9, 31, 22, 30), tz)).toBe(Date.UTC(2027, 9, 31, 23, 0));
  });
  it('rejects a bad zone', () => expect(() => localDate(0, 'Nope/Zone')).toThrow());
});

describe('schedule and ids', () => {
  it('every_n_days and ends_on', () => {
    const t = { anchor_date: '2027-03-01', ends_on: '2027-03-10', paused: false, every_n_days: 3 };
    expect(isDue(t, '2027-03-04')).toBe(true);
    expect(isDue(t, '2027-03-05')).toBe(false);
    expect(isDue(t, '2027-03-13')).toBe(false);
    expect(isDue({ ...t, paused: true }, '2027-03-04')).toBe(false);
  });
  it('undo window is today and yesterday', () => {
    expect(canUndo('2027-03-27', '2027-03-28')).toBe(true);
    expect(canUndo('2027-03-26', '2027-03-28')).toBe(false);
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });
  it('tick id is deterministic', () => {
    expect(tickId('a', '2027-01-01')).toBe(tickId('a', '2027-01-01'));
    expect(tickId('a', '2027-01-01')).not.toBe(tickId('a', '2027-01-02'));
  });
  it('dog routine marks meals and walks critical; cat marks litter not', () => {
    expect(defaultRoutine('dog', '2027-01-01').every((t) => t.streak_critical)).toBe(true);
    expect(defaultRoutine('cat', '2027-01-01').find((t) => t.kind === 'litter')?.streak_critical).toBe(false);
  });
  it('parses Polish decimals', () => {
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('abc')).toBeNull();
  });
});
