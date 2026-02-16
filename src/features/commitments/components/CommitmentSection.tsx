import { type ReactNode, useEffect, useId, useSyncExternalStore } from 'react';
import { commitmentSectionStateCollection } from './commitmentSectionState';

type CommitmentSectionRenderArgs = {
  contentId: string;
  isOpen: boolean;
  toggle: () => void;
};

type CommitmentSectionProps = {
  sectionId: string;
  defaultOpen?: boolean;
  children: (args: CommitmentSectionRenderArgs) => ReactNode;
};

function readPersistedSectionState(sectionId: string) {
  for (const [, section] of commitmentSectionStateCollection.entries()) {
    if (section.id === sectionId) {
      return section;
    }
  }

  return undefined;
}

export function CommitmentSection({
  sectionId,
  defaultOpen = true,
  children,
}: CommitmentSectionProps) {
  const contentId = useId();

  useEffect(() => {
    commitmentSectionStateCollection.startSyncImmediate();
  }, []);

  const persistedSection = useSyncExternalStore(
    (onStoreChange) => {
      const subscription =
        commitmentSectionStateCollection.subscribeChanges(onStoreChange);

      return () => {
        subscription.unsubscribe();
      };
    },
    () => readPersistedSectionState(sectionId),
    () => undefined,
  );

  const isOpen = persistedSection?.isOpen ?? defaultOpen;

  const toggle = () => {
    if (persistedSection) {
      commitmentSectionStateCollection.update(sectionId, (draft) => {
        draft.isOpen = !draft.isOpen;
      });
      return;
    }

    commitmentSectionStateCollection.insert({
      id: sectionId,
      isOpen: !isOpen,
    });
  };

  return children({ contentId, isOpen, toggle });
}
