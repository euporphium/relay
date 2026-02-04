import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

export function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
