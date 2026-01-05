export const calendarIntervalUnits = ['day', 'week', 'month', 'year'] as const;

/**
 * Calendar-based unit used for scheduling calculations.
 * Units are applied using calendar math, not fixed durations.
 */
export type CalendarIntervalUnit = (typeof calendarIntervalUnits)[number];
