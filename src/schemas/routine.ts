import z from 'zod';

export const routineSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
});
