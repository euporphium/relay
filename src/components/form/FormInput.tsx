import { FormBase, type FormControlProps } from '@/components/form/FormBase';
import { Input } from '@/components/ui/input';
import { useFieldContext } from './hooks';

type FormInputProps = FormControlProps & {
  type?: 'text' | 'email' | 'password';
};

export function FormInput({ type = 'text', ...props }: FormInputProps) {
  const field = useFieldContext<string>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
    </FormBase>
  );
}
