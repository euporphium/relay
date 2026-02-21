export const priorityStates = ['active', 'completed', 'released'] as const;

/**
 * Valid lifecycle states for priorities.
 * `active` is in progress, `completed` is done, and `released` is intentionally stopped.
 */
export type PriorityState = (typeof priorityStates)[number];
