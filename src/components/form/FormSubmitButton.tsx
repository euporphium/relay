import { Button } from '@/components/ui/button';
import { useFormContext } from './hooks';

type FormSubmitButtonProps = {
  label: string;
};

export function FormSubmitButton({ label }: FormSubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
