import { describe, expect, test } from 'vitest';
import { rescheduleRuleSchema } from './rescheduleRule.schema';

describe('rescheduleRuleSchema', () => {
  test('accepts valid reschedule rule', () => {
    const result = rescheduleRuleSchema.parse({
      value: 1,
      unit: 'week',
      from: 'scheduled',
    });

    expect(result).toEqual({
      value: 1,
      unit: 'week',
      from: 'scheduled',
    });
  });

  test('rejects invalid from value', () => {
    expect(() =>
      rescheduleRuleSchema.parse({
        value: 1,
        unit: 'week',
        from: 'invalid',
      }),
    ).toThrow();
  });
});
