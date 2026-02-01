import { describe, expect, test } from 'vitest';
import { createCalendarDay } from './calendarDay';

describe('createCalendarDay', () => {
  test('creates a canonical calendar day from an ISO date', () => {
    const day = createCalendarDay('2026-01-31');

    expect(day.iso).toBe('2026-01-31');
    expect(day.date).toBeInstanceOf(Date);
    expect(day.display).toBe('Sat, Jan 31');
  });
});
