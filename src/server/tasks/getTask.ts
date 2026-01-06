import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tasks } from '@/db/schema';

export const getTask = createServerFn()
  .inputValidator(z.uuid())
  .handler(async ({ data: id }) => {
    return db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  });
