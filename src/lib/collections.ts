import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db';
import { taskSchema } from '@/schemas/task';

export const taskCollection = createCollection(
  localStorageCollectionOptions({
    id: 'tasks',
    storageKey: 'app-tasks',
    schema: taskSchema,
    getKey: (task) => task.id,
  }),
);
