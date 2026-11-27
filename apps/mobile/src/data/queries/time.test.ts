import { describe, expect, it } from 'vitest';
import { parseTimestamp } from './time';

describe('parseTimestamp', () => {
  const at = Date.UTC(2026, 10, 27, 15, 0, 0, 120);
  it.each([
    '2026-11-27 15:00:00.12+00',
    '2026-11-27 15:00:00.12Z',
    '2026-11-27T15:00:00.120Z',
    '2026-11-27T16:00:00.12+01:00',
    '2026-11-27 15:00:00.12',
  ])('%s', (s) => expect(parseTimestamp(s)).toBe(at));
});
