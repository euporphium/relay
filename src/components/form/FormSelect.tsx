import { FormBase, type FormControlProps } from '@/components/form/FormBase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from './hooks';

export type FormSelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = FormControlProps & {
  options: FormSelectOption[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function FormSelect({
  options,
  placeholder,
  value,
  onValueChange,
  ...props
}: FormSelectProps) {
  const field = useFieldContext<string | undefined>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const resolvedValue = value ?? field.state.value ?? '';

  return (
    <FormBase {...props}>
      <Select
        value={resolvedValue}
        onValueChange={(nextValue) => {
          field.handleChange(nextValue === '' ? undefined : nextValue);
          onValueChange?.(nextValue);
        }}
      >
        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormBase>
  );
}
