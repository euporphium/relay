import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db';
import { routineSchema } from '@/schemas/routine';

export const routineCollection = createCollection(
  localStorageCollectionOptions({
    id: 'routines',
    storageKey: 'app-routines',
    schema: routineSchema,
    getKey: (routine) => routine.id,
  }),
);
