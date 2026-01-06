import { isNull } from 'drizzle-orm';
import {
  date,
  index,
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

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),
    note: text('note'),

    scheduledDate: date('scheduled_date').notNull(),

    /* Preview rule */
    previewLeadTime: integer('preview_lead_time'),
    previewUnit: intervalUnitEnum('preview_unit'),

    /* Reschedule rule */
    rescheduleEvery: integer('reschedule_every'),
    rescheduleUnit: intervalUnitEnum('reschedule_unit'),
    rescheduleFrom: rescheduleAnchorEnum('reschedule_from'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    archivedAt: timestamp('archived_at'),
  },
  (table) => [
    index('tasks_active_scheduled_date_idx')
      .on(table.scheduledDate)
      .where(isNull(table.archivedAt)),
  ],
);

export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').defaultRandom().primaryKey(),

  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  /* Absolute moment (UTC) */
  completedAt: timestamp('completed_at').notNull(),

  /* Local calendar date (no timezone) */
  completedDate: date('completed_date').notNull(),

  /* Snapshot of the scheduled date at completion time */
  scheduledDate: date('scheduled_date').notNull(),
});
