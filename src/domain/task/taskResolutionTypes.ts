export const taskResolutionTypes = ['completed', 'skipped'] as const;

/**
 * How a task was resolved.
 * - `completed`: The task was finished
 * - `skipped`: The task was intentionally skipped without completion
 */
export type TaskResolutionType = (typeof taskResolutionTypes)[number];
