import { describe, expect, test } from 'vitest';
import { taskInputSchema } from './taskInput.schema';

describe('taskInputSchema', () => {
  test('accepts minimal valid task', () => {
    const result = taskInputSchema.parse({
      name: 'Test task',
      scheduledDate: new Date('2024-01-01'),
    });

    expect(result.name).toBe('Test task');
  });

  test('rejects empty name', () => {
    expect(() =>
      taskInputSchema.parse({
        name: '',
        scheduledDate: new Date(),
      }),
    ).toThrow();
  });

  test('accepts reschedule rule', () => {
    const result = taskInputSchema.parse({
      name: 'Recurring task',
      scheduledDate: new Date(),
      reschedule: {
        value: 1,
        unit: 'day',
        from: 'completion',
      },
    });

    expect(result.reschedule?.from).toBe('completion');
  });
});
