import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { CalendarDay } from '@/domain/calendar/calendarDay';

type DayNavigatorProps = {
  day?: CalendarDay;
};

export function DayNavigator({ day }: DayNavigatorProps) {
  const navigate = useNavigate({ from: '/tasks/' });

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    // Canonicalize the route on the client using the user's local "today".
    // This avoids server-side timezone assumptions and keeps the URL explicit.
    if (!day) {
      navigate({
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

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Previous day"
        onClick={() =>
          navigate({
            search: {
              date: format(subDays(day.date, 1), 'yyyy-MM-dd'),
            },
          })
        }
      >
        <CaretLeftIcon />
      </Button>

      <span className="text-lg font-semibold tabular-nums min-w-35 text-center">
        {day.display}
      </span>

      <Button
        size="icon"
        variant="ghost"
        aria-label="Next day"
        onClick={() =>
          navigate({
            search: {
              date: format(addDays(day.date, 1), 'yyyy-MM-dd'),
            },
          })
        }
      >
        <CaretRightIcon />
      </Button>

      {!isToday && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigate({
              search: {
                date: todayString,
              },
            })
          }
        >
          Today
        </Button>
      )}
    </div>
  );
}
