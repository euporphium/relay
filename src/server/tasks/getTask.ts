import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { authMiddleware } from '@/server/middleware/auth';

export const getTask = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.uuid())
  .handler(async ({ data: id, context }) => {
    const { userId } = context;

    return db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
    });
  });

export type Task = Awaited<ReturnType<typeof getTask>>;
