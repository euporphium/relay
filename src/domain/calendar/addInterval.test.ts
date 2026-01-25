import { describe, expect, test } from 'vitest';
import { addInterval } from './addInterval';

describe('addInterval', () => {
  describe('day intervals', () => {
    test('adds 1 day', () => {
      expect(addInterval('2024-01-15', 'day', 1)).toBe('2024-01-16');
    });

    test('handles month boundary', () => {
      expect(addInterval('2024-01-30', 'day', 3)).toBe('2024-02-02');
    });

    test('handles year boundary', () => {
      expect(addInterval('2024-12-30', 'day', 5)).toBe('2025-01-04');
    });

    test('supports multiplier', () => {
      expect(addInterval('2024-01-15', 'day', 1, 3)).toBe('2024-01-18');
    });
  });

  describe('week intervals', () => {
    test('adds 1 week', () => {
      expect(addInterval('2024-01-15', 'week', 1)).toBe('2024-01-22');
    });

    test('adds multiple weeks', () => {
      expect(addInterval('2024-01-15', 'week', 2)).toBe('2024-01-29');
    });

    test('supports multiplier', () => {
      expect(addInterval('2024-01-01', 'week', 1, 3)).toBe('2024-01-22');
    });
  });

  describe('month intervals', () => {
    test('adds 1 month', () => {
      expect(addInterval('2024-01-15', 'month', 1)).toBe('2024-02-15');
    });

    test('handles month-end rollover in leap year', () => {
      expect(addInterval('2024-01-31', 'month', 1)).toBe('2024-02-29');
    });

    test('handles month-end rollover in non-leap year', () => {
      expect(addInterval('2023-01-31', 'month', 1)).toBe('2023-02-28');
    });

    test('handles year boundary', () => {
      expect(addInterval('2024-11-15', 'month', 3)).toBe('2025-02-15');
    });

    test('supports multiplier', () => {
      expect(addInterval('2024-01-10', 'month', 1, 4)).toBe('2024-05-10');
    });
  });

  describe('year intervals', () => {
    test('adds 1 year', () => {
      expect(addInterval('2024-01-15', 'year', 1)).toBe('2025-01-15');
    });

    test('handles leap year to non-leap year', () => {
      expect(addInterval('2024-02-29', 'year', 1)).toBe('2025-02-28');
    });

    test('handles leap year to leap year', () => {
      expect(addInterval('2024-02-29', 'year', 4)).toBe('2028-02-29');
    });

    test('supports multiplier', () => {
      expect(addInterval('2024-01-15', 'year', 1, 3)).toBe('2027-01-15');
    });
  });

  describe('multiplier behavior', () => {
    test('multiplier 0 returns same date', () => {
      expect(addInterval('2024-01-15', 'day', 1, 0)).toBe('2024-01-15');
    });

    test('equivalent every and multiplier combinations produce same result', () => {
      const result1 = addInterval('2024-01-01', 'week', 2, 3);
      const result2 = addInterval('2024-01-01', 'week', 1, 6);
      expect(result1).toBe(result2);
    });
  });
});
