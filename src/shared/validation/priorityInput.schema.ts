import { z } from 'zod';

export const priorityInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  note: z.string().trim().optional(),
  groupId: z.uuid().optional(),
  groupName: z.string().trim().optional(),
  groupSelection: z.string().optional(),
});

export type PriorityInput = z.input<typeof priorityInputSchema>;
