import { describe, expect, test } from 'vitest';
import { calculateNextOccurrence } from './calculateNextOccurrence';

describe('calculateNextOccurrence', () => {
  describe('rescheduling logic', () => {
    test('anchors to scheduled date: advances 1 week from schedule', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-01',
        completionDate: '2024-01-05',
        reschedule: { every: 1, unit: 'week', from: 'scheduled' },
      });
      expect(result).toBe('2024-01-08');
    });

    test('anchors to completion date: advances 1 week from completion', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-01',
        completionDate: '2024-01-05',
        reschedule: { every: 1, unit: 'week', from: 'completion' },
      });
      expect(result).toBe('2024-01-12');
    });
  });

  describe('overdue tasks (drift)', () => {
    test('preserves cadence for multi-day intervals (every 3 days)', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-01',
        completionDate: '2024-01-15',
        reschedule: { every: 3, unit: 'day', from: 'scheduled' },
      });
      expect(result).toBe('2024-01-16');
    });

    test('advances weekly tasks multiple intervals to reach future', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-01',
        completionDate: '2024-01-22',
        reschedule: { every: 1, unit: 'week', from: 'scheduled' },
      });
      expect(result).toBe('2024-01-29');
    });

    test('advances monthly tasks correctly across drift', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-10',
        completionDate: '2024-04-15',
        reschedule: { every: 1, unit: 'month', from: 'scheduled' },
      });
      expect(result).toBe('2024-05-10');
    });

    test('handles years of drift efficiently (performance)', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2020-01-01',
        completionDate: '2024-01-01',
        reschedule: { every: 1, unit: 'day', from: 'scheduled' },
      });
      expect(result).toBe('2024-01-02');
    });
  });

  describe('early completion', () => {
    test('advances from scheduled date even if completed early', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-10',
        completionDate: '2024-01-08',
        reschedule: { every: 1, unit: 'week', from: 'scheduled' },
      });
      expect(result).toBe('2024-01-17');
    });

    test('advances from completion date when anchored to completion', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-01-10',
        completionDate: '2024-01-08',
        reschedule: { every: 1, unit: 'week', from: 'completion' },
      });
      expect(result).toBe('2024-01-15');
    });
  });

  describe('calendar edge cases', () => {
    test('handles month-end rollover', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2023-01-31',
        completionDate: '2023-02-01',
        reschedule: { every: 1, unit: 'month', from: 'scheduled' },
      });
      expect(result).toBe('2023-02-28');
    });

    test('handles leap year year-interval', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-02-29',
        completionDate: '2024-02-29',
        reschedule: { every: 1, unit: 'year', from: 'scheduled' },
      });
      expect(result).toBe('2025-02-28');
    });

    test('handles DST boundaries (Spring Forward)', () => {
      const result = calculateNextOccurrence({
        scheduledDate: '2024-03-09',
        completionDate: '2024-03-09',
        reschedule: { every: 1, unit: 'day', from: 'scheduled' },
      });
      expect(result).toBe('2024-03-10');
    });
  });

  describe('validation', () => {
    test('throws error for non-positive intervals', () => {
      expect(() =>
        calculateNextOccurrence({
          scheduledDate: '2024-01-10',
          completionDate: '2024-01-10',
          reschedule: { every: 0, unit: 'day', from: 'scheduled' },
        }),
      ).toThrow();
    });
  });
});
