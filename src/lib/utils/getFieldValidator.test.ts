import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { getFieldValidator } from './getFieldValidator';

describe('getFieldValidator', () => {
  test('returns a validator that enforces field-level constraints', () => {
    const schema = z.object({
      name: z.string().trim().min(2),
    });

    const nameValidator = getFieldValidator(schema, 'name');

    expect(nameValidator.parse('  alex  ')).toBe('alex');
    expect(() => nameValidator.parse('a')).toThrow();
  });

  test('preserves field modifiers such as optional and transform', () => {
    const schema = z.object({
      count: z.string().transform((value) => Number(value)),
      preview: z.object({ value: z.string().min(1) }).optional(),
    });

    const countValidator = getFieldValidator(schema, 'count');
    const previewValidator = getFieldValidator(schema, 'preview');

    expect(countValidator.parse('42')).toBe(42);
    expect(previewValidator.parse(undefined)).toBeUndefined();
    expect(() => previewValidator.parse({ value: '' })).toThrow();
  });
});
