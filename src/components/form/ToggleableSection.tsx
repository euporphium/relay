import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldDescription, FieldLabel } from '@/components/ui/field';

type ToggleableSectionProps<T> = {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  label: string;
  defaultValue: T;
  children: ReactNode;
  description?: string;
};

export function ToggleableSection<T>({
  value,
  onChange,
  label,
  defaultValue,
  children,
  description,
}: ToggleableSectionProps<T>) {
  const enabled = value !== undefined;

  return (
    <>
      <FieldLabel className="p-2 rounded-xl">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => {
            onChange(checked ? defaultValue : undefined);
          }}
        />
        {label}
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldLabel>
      {enabled && children}
    </>
  );
}
