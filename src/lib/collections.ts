import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db';
import { routineSchema } from '@/schemas/routine';

export const routinesCollection = createCollection(
  localStorageCollectionOptions({
    id: 'routines',
    storageKey: 'app-routines',
    schema: routineSchema,
    getKey: (routine) => routine.id,
  }),
);
