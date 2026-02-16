import { type ReactNode, useEffect, useId, useState } from 'react';
import {
  type CommitmentSectionUiState,
  commitmentSectionStateCollection,
} from './commitmentSectionState';

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

export function CommitmentSection({
  sectionId,
  defaultOpen = true,
  children,
}: CommitmentSectionProps) {
  const contentId = useId();
  const [data, setData] = useState<CommitmentSectionUiState[]>([]);

  useEffect(() => {
    const readSectionState = () => {
      setData(
        Array.from(
          commitmentSectionStateCollection.entries(),
          ([, section]) => section,
        ),
      );
    };

    commitmentSectionStateCollection.startSyncImmediate();
    readSectionState();

    const subscription =
      commitmentSectionStateCollection.subscribeChanges(readSectionState);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const persistedSection = data?.find((section) => section.id === sectionId);
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
