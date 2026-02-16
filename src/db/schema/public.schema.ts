import { isNull, relations } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { calendarIntervalUnits } from '@/domain/calendar/calendarInterval';
import { commitmentStates } from '@/domain/commitment/commitmentStates';
import { shareInvitationStatuses } from '@/domain/share/shareInvitationStatuses';
import { sharePermissions } from '@/domain/share/sharePermissions';
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

export const commitmentStateEnum = pgEnum('commitment_state', commitmentStates);

export const sharePermissionEnum = pgEnum('share_permission', sharePermissions);
export const shareInvitationStatusEnum = pgEnum(
  'share_invitation_status',
  shareInvitationStatuses,
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

  resolutionType: taskResolutionTypeEnum('type').notNull().default('completed'),

  /* Absolute moment (UTC) */
  resolvedAt: timestamp('completed_at').notNull(),

  /* Local calendar date (no timezone) */
  resolvedDate: date('completed_date').notNull(),

  /* Snapshot of the scheduled date at completion time */
  scheduledDate: date('scheduled_date').notNull(),
});

export const commitmentGroups = pgTable(
  'commitment_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('commitment_groups_user_id_idx').on(table.userId),
    uniqueIndex('commitment_groups_user_id_name_idx').on(
      table.userId,
      table.name,
    ),
  ],
);

export const commitmentGroupShares = pgTable(
  'commitment_group_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    groupId: uuid('group_id')
      .notNull()
      .references(() => commitmentGroups.id, { onDelete: 'cascade' }),

    invitedByUserId: text('invited_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    invitedEmail: text('invited_email').notNull(),

    sharedWithUserId: text('shared_with_user_id').references(() => user.id, {
      onDelete: 'cascade',
    }),

    permission: sharePermissionEnum('permission').notNull().default('view'),
    status: shareInvitationStatusEnum('status').notNull().default('pending'),

    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
    acceptedAt: timestamp('accepted_at'),
    rejectedAt: timestamp('rejected_at'),
    revokedAt: timestamp('revoked_at'),
    leftAt: timestamp('left_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('commitment_group_shares_group_id_idx').on(table.groupId),
    index('commitment_group_shares_group_id_status_idx').on(
      table.groupId,
      table.status,
    ),
    index('commitment_group_shares_shared_with_user_id_idx').on(
      table.sharedWithUserId,
    ),
    index('commitment_group_shares_shared_with_user_id_status_idx').on(
      table.sharedWithUserId,
      table.status,
    ),
    index('commitment_group_shares_invited_email_status_idx').on(
      table.invitedEmail,
      table.status,
    ),
    uniqueIndex('commitment_group_shares_group_id_invited_email_idx').on(
      table.groupId,
      table.invitedEmail,
    ),
    uniqueIndex('commitment_group_shares_group_id_shared_with_user_id_idx').on(
      table.groupId,
      table.sharedWithUserId,
    ),
  ],
);

export const commitments = pgTable(
  'commitments',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    groupId: uuid('group_id').references(() => commitmentGroups.id, {
      onDelete: 'set null',
    }),

    title: text('title').notNull(),
    note: text('note'),

    state: commitmentStateEnum('state').notNull().default('active'),
    position: integer('position').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('commitments_user_id_idx').on(table.userId),
    index('commitments_group_id_idx').on(table.groupId),
    index('commitments_group_order_idx').on(
      table.userId,
      table.groupId,
      table.position,
    ),
  ],
);

export const commitmentGroupsRelations = relations(
  commitmentGroups,
  ({ one, many }) => ({
    user: one(user, {
      fields: [commitmentGroups.userId],
      references: [user.id],
    }),
    commitments: many(commitments),
    shares: many(commitmentGroupShares),
  }),
);

export const commitmentGroupSharesRelations = relations(
  commitmentGroupShares,
  ({ one }) => ({
    group: one(commitmentGroups, {
      fields: [commitmentGroupShares.groupId],
      references: [commitmentGroups.id],
    }),
    sharedWithUser: one(user, {
      fields: [commitmentGroupShares.sharedWithUserId],
      references: [user.id],
    }),
    invitedByUser: one(user, {
      fields: [commitmentGroupShares.invitedByUserId],
      references: [user.id],
    }),
  }),
);

export const commitmentsRelations = relations(commitments, ({ one }) => ({
  user: one(user, {
    fields: [commitments.userId],
    references: [user.id],
  }),
  group: one(commitmentGroups, {
    fields: [commitments.groupId],
    references: [commitmentGroups.id],
  }),
}));
