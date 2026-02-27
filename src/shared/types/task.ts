import type { CalendarIntervalUnit } from '@/domain/calendar/calendarInterval';
import type { RescheduleAnchor } from '@/domain/task/rescheduleAnchors';
import type { Attachment } from '@/shared/types/attachment';

export type Task = {
  id: string;
  userId: string;
  name: string;
  note: string | null;
  scheduledDate: string;
  previewLeadTime: number | null;
  previewUnit: CalendarIntervalUnit | null;
  rescheduleEvery: number | null;
  rescheduleUnit: CalendarIntervalUnit | null;
  rescheduleFrom: RescheduleAnchor | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  attachments?: Attachment[];
};

export type TaskForDate = Task & {
  previewStartDate: Date;
  status: 'active' | 'upcoming';
};

export type ResolveTaskResult = {
  resolutionId: string;
  nextTask?: { id: string; scheduledDate: string };
};
