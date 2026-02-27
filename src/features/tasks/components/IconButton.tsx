import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

export function IconButton({
  label,
  onClick,
  children,
  className,
}: IconButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={onClick}
      aria-label={label}
      className={className}
    >
      {children}
    </Button>
  );
}
