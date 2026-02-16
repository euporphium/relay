import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db';

export const COMMITMENTS_UI_STATE_STORAGE_KEY = 'commitments-ui-state-v1';

export type CommitmentSectionUiState = {
  id: string;
  isOpen: boolean;
};

export const commitmentSectionStateCollection = createCollection(
  localStorageCollectionOptions({
    id: 'commitments-ui-state',
    storageKey: COMMITMENTS_UI_STATE_STORAGE_KEY,
    getKey: (state: CommitmentSectionUiState) => state.id,
  }),
);
