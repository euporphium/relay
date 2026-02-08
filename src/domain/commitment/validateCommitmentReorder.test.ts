import { describe, expect, test } from 'vitest';
import { validateCommitmentReorder } from './validateCommitmentReorder';

const ERROR_MESSAGE = 'Commitment mismatch while reordering';

describe('validateCommitmentReorder', () => {
  test('accepts matching ordered ids', () => {
    expect(() =>
      validateCommitmentReorder({
        orderedIds: ['a', 'b', 'c'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).not.toThrow();
  });

  test('rejects length mismatch', () => {
    expect(() =>
      validateCommitmentReorder({
        orderedIds: ['a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });

  test('rejects duplicate ordered ids', () => {
    expect(() =>
      validateCommitmentReorder({
        orderedIds: ['a', 'a', 'b'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });

  test('rejects ordered ids not in active set', () => {
    expect(() =>
      validateCommitmentReorder({
        orderedIds: ['a', 'b', 'x'],
        activeIds: ['a', 'b', 'c'],
      }),
    ).toThrow(ERROR_MESSAGE);
  });
});
