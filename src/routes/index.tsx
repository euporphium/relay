import { createFileRoute } from '@tanstack/react-router';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-4">
      <ThemeToggle />
    </div>
  );
}
