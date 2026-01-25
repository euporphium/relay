import type { CalendarIntervalInput } from '@/components/form/calendarInterval.schema';
import { FormBase, type FormControlProps } from '@/components/form/FormBase';
import { FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CalendarIntervalUnit,
  calendarIntervalUnits,
} from '@/domain/calendar/calendarInterval';
import { useFieldContext } from './hooks';

const defaultFieldState: CalendarIntervalInput = {
  value: '1',
  unit: 'day',
} as const;

export function FormCalendarInterval({ ...formProps }: FormControlProps) {
  const field = useFieldContext<CalendarIntervalInput | undefined>();

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const fieldState = field.state.value ?? defaultFieldState;

  const currentValue = fieldState.value;
  const currentUnit = fieldState.unit;

  const inputValue =
    currentValue === undefined || currentValue === null
      ? ''
      : String(currentValue);

  const handleValueChange = (newValue: string) => {
    field.handleChange({ ...fieldState, value: newValue, unit: currentUnit });
  };

  const handleUnitChange = (newUnit: CalendarIntervalUnit) => {
    field.handleChange({ ...fieldState, value: currentValue, unit: newUnit });
  };

  return (
    <FormBase {...formProps}>
      <FieldSet className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          id={field.name}
          inputMode="numeric"
          name={`${field.name}.value`}
          value={inputValue}
          onBlur={field.handleBlur}
          onChange={(e) => handleValueChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <Select onValueChange={handleUnitChange} value={currentUnit}>
          <SelectTrigger
            aria-invalid={isInvalid}
            id={`${field.name}.unit`}
            name={`${field.name}.unit`}
            className="w-30"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {calendarIntervalUnits.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}(s)
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FieldSet>
    </FormBase>
  );
}
