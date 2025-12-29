import { CalendarIcon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  FormBase,
  type FormControlProps,
} from '@/components/form/FormBase.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { useFieldContext } from './hooks';

export function FormDatePicker(props: FormControlProps) {
  const field = useFieldContext<Date | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const date = field.state.value ? new Date(field.state.value) : undefined;

  return (
    <FormBase {...props}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            variant="outline"
            data-empty={!date}
            className="data-[empty=true]:text-muted-foreground w-70 justify-start text-left font-normal"
            aria-invalid={isInvalid}
          >
            <CalendarIcon />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              field.handleChange(newDate);
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </FormBase>
  );
}
