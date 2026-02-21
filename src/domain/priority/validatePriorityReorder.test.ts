import { describe, expect, test } from 'vitest';
import { validatePriorityReorder } from './validatePriorityReorder';

const ERROR_MESSAGE = 'Priority mismatch while reordering';

describe('validatePriorityReorder', () => {
  test('accepts matching ordered ids', () => {
    expect(() =>
      validatePriorityReorder({
        orderedIds: ['a', 'b', 'c'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).not.toThrow();
  });

  test('rejects length mismatch', () => {
    expect(() =>
      validatePriorityReorder({
        orderedIds: ['a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });

  test('rejects duplicate ordered ids', () => {
    expect(() =>
      validatePriorityReorder({
        orderedIds: ['a', 'a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });

  test('rejects ordered ids not in active set', () => {
    expect(() =>
      validatePriorityReorder({
        orderedIds: ['a', 'b', 'x'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });
});
