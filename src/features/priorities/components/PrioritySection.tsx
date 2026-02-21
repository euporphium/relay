import { type ReactNode, useEffect, useId, useSyncExternalStore } from 'react';
import { prioritySectionStateCollection } from './prioritySectionState';

type PrioritySectionRenderArgs = {
  contentId: string;
  isOpen: boolean;
  toggle: () => void;
};

type PrioritySectionProps = {
  sectionId: string;
  defaultOpen?: boolean;
  children: (args: PrioritySectionRenderArgs) => ReactNode;
};

function readPersistedSectionState(sectionId: string) {
  for (const [, section] of prioritySectionStateCollection.entries()) {
    if (section.id === sectionId) {
      return section;
    }
  }

  return undefined;
}

export function PrioritySection({
  sectionId,
  defaultOpen = true,
  children,
}: PrioritySectionProps) {
  const contentId = useId();

  useEffect(() => {
    prioritySectionStateCollection.startSyncImmediate();
  }, []);

  const persistedSection = useSyncExternalStore(
    (onStoreChange) => {
      const subscription =
        prioritySectionStateCollection.subscribeChanges(onStoreChange);

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
      prioritySectionStateCollection.update(sectionId, (draft) => {
        draft.isOpen = !draft.isOpen;
      });
      return;
    }

    prioritySectionStateCollection.insert({
      id: sectionId,
      isOpen: !isOpen,
    });
  };

  return children({ contentId, isOpen, toggle });
}
