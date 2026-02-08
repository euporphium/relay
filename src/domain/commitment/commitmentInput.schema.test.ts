import { describe, expect, test } from 'vitest';
import { commitmentInputSchema } from './commitmentInput.schema';

describe('commitmentInputSchema', () => {
  test('accepts valid input and trims title', () => {
    const result = commitmentInputSchema.parse({
      title: '  Learn TypeScript ',
      note: ' Keep it short ',
    });

    expect(result).toEqual({
      title: 'Learn TypeScript',
      note: 'Keep it short',
    });
  });

  test('rejects empty title', () => {
    expect(() => commitmentInputSchema.parse({ title: '   ' })).toThrow();
  });

  test('accepts optional group fields', () => {
    const result = commitmentInputSchema.parse({
      title: 'Exercise',
      groupId: 'f3d7b59a-5c0f-4a2b-9b0f-6c3f2f0a47e8',
      groupName: 'Health',
      groupSelection: 'existing',
    });

    expect(result).toEqual({
      title: 'Exercise',
      groupId: 'f3d7b59a-5c0f-4a2b-9b0f-6c3f2f0a47e8',
      groupName: 'Health',
      groupSelection: 'existing',
    });
  });

  test('rejects invalid groupId', () => {
    expect(() =>
      commitmentInputSchema.parse({ title: 'Read', groupId: 'not-a-uuid' }),
    ).toThrow();
  });
});
