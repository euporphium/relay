import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const rescheduleAnchorEnum = pgEnum('reschedule_anchor', [
  'scheduled',
  'completion',
]);

export const intervalUnitEnum = pgEnum('interval_unit', [
  'day',
  'week',
  'month',
  'year',
]);

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),
  note: text('note'),

  scheduledDate: timestamp('scheduled_date', { withTimezone: false }).notNull(),

  /* Preview rule */
  previewLeadTime: integer('preview_lead_time'),
  previewUnit: intervalUnitEnum('preview_unit'),

  /* Reschedule rule */
  rescheduleEvery: integer('reschedule_every'),
  rescheduleUnit: intervalUnitEnum('reschedule_unit'),
  rescheduleFrom: rescheduleAnchorEnum('reschedule_from'),

  archivedAt: timestamp('archived_at', { withTimezone: false }),

  createdAt: timestamp('created_at', { withTimezone: false })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', { withTimezone: false })
    .defaultNow()
    .notNull(),
});

export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').defaultRandom().primaryKey(),

  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  /* Absolute moment (UTC) */
  completedAt: timestamp('completed_at', {
    withTimezone: true,
  }).notNull(),

  /* Local calendar date (no timezone) */
  completedDate: timestamp('completed_date', {
    withTimezone: false,
  }).notNull(),

  /* Snapshot of the scheduled date at completion time */
  scheduledDate: timestamp('scheduled_date', { withTimezone: false }).notNull(),
});
