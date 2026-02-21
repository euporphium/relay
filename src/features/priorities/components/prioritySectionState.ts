import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db';

export const COMMITMENTS_UI_STATE_STORAGE_KEY = 'priorities-ui-state-v1';

export type PrioritySectionUiState = {
  id: string;
  isOpen: boolean;
};

export const prioritySectionStateCollection = createCollection(
  localStorageCollectionOptions({
    id: 'priorities-ui-state',
    storageKey: COMMITMENTS_UI_STATE_STORAGE_KEY,
    getKey: (state: PrioritySectionUiState) => state.id,
  }),
);
