import { isNull, relations } from 'drizzle-orm';
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
import { calendarIntervalUnits } from '@/domain/calendar/calendarInterval';
import { rescheduleAnchors } from '@/domain/task/rescheduleAnchors';
import { taskResolutionTypes } from '@/domain/task/taskResolutionTypes';
import { user } from './auth.schema';

export const rescheduleAnchorEnum = pgEnum(
  'reschedule_anchor',
  rescheduleAnchors,
);

export const intervalUnitEnum = pgEnum('interval_unit', calendarIntervalUnits);

export const taskResolutionTypeEnum = pgEnum(
  'task_resolution_type',
  taskResolutionTypes,
);

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

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
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => [
    index('tasks_user_id_idx').on(table.userId),
    index('tasks_active_scheduled_date_idx')
      .on(table.userId, table.scheduledDate)
      .where(isNull(table.resolvedAt)),
  ],
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(user, {
    fields: [tasks.userId],
    references: [user.id],
  }),
}));

export const taskResolutions = pgTable('task_resolutions', {
  id: uuid('id').defaultRandom().primaryKey(),

  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  resolutionType: taskResolutionTypeEnum('type').notNull(),

  /* Absolute moment (UTC) */
  resolvedAt: timestamp('completed_at').notNull(),

  /* Local calendar date (no timezone) */
  resolvedDate: date('completed_date').notNull(),

  /* Snapshot of the scheduled date at completion time */
  scheduledDate: date('scheduled_date').notNull(),
});
