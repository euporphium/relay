import {
  CalendarIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { CalendarDay } from '@/domain/calendar/calendarDay';

type DayNavigatorProps = {
  day?: CalendarDay;
};

export function DayNavigator({ day }: DayNavigatorProps) {
  const navigate = useNavigate({ from: '/tasks/' });
  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    // Canonicalize the route on the client using the user's local "today".
    // This avoids server-side timezone assumptions and keeps the URL explicit.
    if (!day) {
      void navigate({
        search: {
          date: todayString,
        },
        replace: true,
      });
    }
  }, [day, navigate, todayString]);

  if (!day) {
    return null;
  }

  const isToday = isSameDay(day.date, today);

  const navigateToDate = (date: Date) => {
    void navigate({
      search: {
        date: format(date, 'yyyy-MM-dd'),
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Previous day"
        onClick={() => navigateToDate(subDays(day.date, 1))}
      >
        <CaretLeftIcon />
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="text-lg font-semibold tabular-nums"
          >
            <CalendarIcon className="mr-2" />
            {day.display}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={day.date}
            onSelect={(newDate) => {
              if (newDate) {
                navigateToDate(newDate);
              }
              setIsOpen(false);
            }}
            defaultMonth={day.date}
          />
          {!isToday && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  navigateToDate(today);
                  setIsOpen(false);
                }}
              >
                Today
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Button
        size="icon"
        variant="ghost"
        aria-label="Next day"
        onClick={() => navigateToDate(addDays(day.date, 1))}
      >
        <CaretRightIcon />
      </Button>
    </div>
  );
}
