import type { ComponentPropsWithoutRef } from 'react';
import { FormBase, type FormControlProps } from '@/components/form/FormBase';
import { Input } from '@/components/ui/input';
import { useFieldContext } from './hooks';

type FormInputProps = FormControlProps &
  Omit<
    ComponentPropsWithoutRef<'input'>,
    'name' | 'value' | 'onChange' | 'onBlur'
  >;

export function FormInput({
  label,
  description,
  ...inputProps
}: FormInputProps) {
  const field = useFieldContext<string>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase label={label} description={description}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
      />
    </FormBase>
  );
}
