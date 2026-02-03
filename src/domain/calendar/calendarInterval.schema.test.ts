import { describe, expect, test } from 'vitest';
import { calendarIntervalSchema } from './calendarInterval.schema';

describe('calendarIntervalSchema', () => {
  test('accepts valid interval', () => {
    const result = calendarIntervalSchema.parse({
      value: '3',
      unit: 'week',
    });

    expect(result).toEqual({ value: 3, unit: 'week' });
  });

  test('rejects zero or negative values', () => {
    expect(() =>
      calendarIntervalSchema.parse({ value: 0, unit: 'day' }),
    ).toThrow();

    expect(() =>
      calendarIntervalSchema.parse({ value: -1, unit: 'day' }),
    ).toThrow();
  });

  test('rejects invalid unit', () => {
    expect(() =>
      calendarIntervalSchema.parse({ value: 1, unit: 'hour' }),
    ).toThrow();
  });
});
