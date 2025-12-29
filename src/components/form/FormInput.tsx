import {
  FormBase,
  type FormControlProps,
} from '@/components/form/FormBase.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useFieldContext } from './hooks';

export function FormInput(props: FormControlProps) {
  const field = useFieldContext<string>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
    </FormBase>
  );
}
