export const rescheduleAnchors = ['scheduled', 'completion'] as const;

/**
 * Determines the reference point for calculating the next occurrence of a recurring task.
 * - `scheduled`: Next occurrence is calculated from the originally scheduled date
 * - `completion`: Next occurrence is calculated from when the task was completed
 */
export type RescheduleAnchor = (typeof rescheduleAnchors)[number];