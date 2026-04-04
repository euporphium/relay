import { GearIcon, PlusIcon } from '@phosphor-icons/react';
import { useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useAppForm } from '@/components/form/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTask } from '@/server/tasks/createTask';
import {
  type TaskInput,
  taskInputSchema,
} from '@/shared/validation/taskInput.schema';

type Props = {
  onCreated: () => void;
  onOpenFullForm: (name: string) => void;
};

export function QuickAddTask({ onCreated, onOpenFullForm }: Props) {
  const createTaskFn = useServerFn(createTask);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultValues: TaskInput = {
    name: '',
    note: '',
    scheduledDate: new Date(),
    preview: undefined,
    reschedule: undefined,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: taskInputSchema },
    onSubmit: async ({ value }) => {
      try {
        await createTaskFn({ data: { ...value, scheduledDate: new Date() } });
        form.reset();
        void router.invalidate();
        onCreated();
      } catch {
        toast.error('Failed to create task');
      } finally {
        inputRef.current?.focus();
      }
    },
  });

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        await form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => (
          <Input
            ref={inputRef}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder="Add a task..."
            aria-label="Task name"
            className="flex-1"
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting}
            aria-label="Add task"
          >
            <PlusIcon />
          </Button>
        )}
      </form.Subscribe>
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => onOpenFullForm(form.state.values.name)}
        aria-label="Create task with options"
      >
        <GearIcon />
      </Button>
    </form>
  );
}
