'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AvailabilityStatus, CalendarDayEntry } from '@/src/types/studio';
import { cn, toISODate } from '@/src/lib/utils';

interface StudioCalendarProps {
  monthDate: Date;
  onMonthChange: (nextMonth: Date) => void;
  entries: CalendarDayEntry[];
  selectedDate?: string;
  onSelectDate: (isoDate: string, entry?: CalendarDayEntry) => void;
  allowSelectBooked?: boolean;
  size?: 'compact' | 'standard' | 'large';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StudioCalendar({
  monthDate,
  onMonthChange,
  entries,
  selectedDate,
  onSelectDate,
  allowSelectBooked = false,
  size = 'standard',
}: StudioCalendarProps) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayISO = toISODate(new Date());

  const entryMap = React.useMemo(() => {
    const map = new Map<string, CalendarDayEntry[]>();
    entries.forEach((entry) => {
      const dayEntries = map.get(entry.date) || [];
      dayEntries.push(entry);
      map.set(entry.date, dayEntries);
    });
    return map;
  }, [entries]);

  const cells: Array<{ day: number | null; iso: string }> = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ day: null, iso: `empty-start-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, iso });
  }

  const monthLabel = monthDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrev = () => onMonthChange(new Date(year, month - 1, 1));
  const handleNext = () => onMonthChange(new Date(year, month + 1, 1));

  const isLarge = size === 'large';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 pb-4">
        <h4 className={cn('font-semibold text-white tracking-tight', isLarge ? 'text-xl' : 'text-base')}>
          {monthLabel}
        </h4>
        <div className="flex items-center gap-2">
          {isLarge && (
            <button
              type="button"
              onClick={() => onMonthChange(new Date(2026, 10, 1))}
              className="h-9 rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs font-medium text-[#D8C78E] hover:border-[#D8C78E] hover:text-white cursor-pointer"
            >
              Current Month
            </button>
          )}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#C5B378]/25 bg-[#092E2B] text-[#E6ECEB] transition-colors hover:border-[#D8C78E] hover:text-white cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#C5B378]/25 bg-[#092E2B] text-[#E6ECEB] transition-colors hover:border-[#D8C78E] hover:text-white cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center pb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={cn(
              'font-semibold text-[#D8C78E]/85 py-1.5',
              isLarge ? 'text-xs sm:text-sm border-b border-[#C5B378]/15' : 'text-xs'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={cn('grid grid-cols-7', isLarge ? 'gap-2 sm:gap-2.5' : 'gap-1.5')}>
        {cells.map((cell) => {
          if (cell.day === null) {
            return (
              <div
                key={cell.iso}
                className={
                  isLarge
                    ? 'min-h-[88px] sm:min-h-[112px] rounded-xl bg-[#072421]/30'
                    : size === 'compact'
                    ? 'h-10'
                    : 'h-12 sm:h-14'
                }
              />
            );
          }

          const entry = entryMap.get(cell.iso);
          const status: AvailabilityStatus = entry?.[0]?.status ?? 'Available';
          const isPast = cell.iso < todayISO;
          const isSelected = selectedDate === cell.iso;
          const isDisabled = !allowSelectBooked && (isPast || status === 'Booked');

          if (isLarge) {
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => onSelectDate(cell.iso, undefined)}
                className={cn(
                  'group relative flex min-h-[88px] sm:min-h-[112px] flex-col justify-between rounded-xl border p-2 sm:p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] cursor-pointer',
                  isPast && !entry
                    ? 'border-[#C5B378]/10 bg-[#072421]/50 text-[#E6ECEB]/40 hover:border-[#C5B378]/30'
                    : status === 'Available'
                    ? 'border-[#C5B378]/20 bg-[#092E2B] text-white hover:border-[#D8C78E] hover:bg-[#134E49]'
                    : status === 'Limited'
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-50 hover:border-amber-300'
                    : 'border-rose-400/45 bg-rose-950/60 text-rose-50 hover:border-rose-300',
                  isSelected && 'ring-2 ring-[#D8C78E] border-[#D8C78E]'
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span
                    className={cn(
                      'font-mono text-sm sm:text-base font-semibold tabular-nums',
                      isSelected ? 'text-[#D8C78E]' : 'text-white'
                    )}
                  >
                    {cell.day}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded',
                      status === 'Booked'
                        ? 'bg-rose-500/25 text-rose-200'
                        : status === 'Limited'
                        ? 'bg-amber-500/25 text-amber-200'
                        : 'text-emerald-300/80'
                    )}
                  >
                    {status === 'Booked' ? 'Booked' : status === 'Limited' ? 'Limited' : 'Open'}
                  </span>
                </div>

                {entry ? (
                  <div className="mt-1.5 w-full space-y-1 overflow-hidden">
                    {entry.slice(0, 3).map((dayEntry) => (
                      <div
                        key={dayEntry.id || `${dayEntry.date}-${dayEntry.title}`}
                        className="rounded border border-white/10 bg-black/10 px-1.5 py-1"
                      >
                        <p className="text-[10px] sm:text-xs font-medium text-white truncate">
                          {dayEntry.title}
                        </p>
                        {dayEntry.venue && (
                          <p className="hidden sm:block text-[9px] text-[#E6ECEB]/75 truncate">
                            {dayEntry.venue}
                          </p>
                        )}
                      </div>
                    ))}
                    {entry.length > 3 && (
                      <p className="text-[10px] font-semibold text-[#D8C78E]">
                        +{entry.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="hidden sm:block text-[10px] text-[#E6ECEB]/40 group-hover:text-[#D8C78E] transition-colors">
                    Click to block
                  </p>
                )}
              </button>
            );
          }

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(cell.iso, entry?.[0])}
              title={entry ? `${status}: ${entry[0].title}` : `${cell.iso} · Available`}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E]',
                size === 'compact' ? 'h-11' : 'h-12 sm:h-14',
                isPast &&
                  'border-transparent bg-[#072421]/50 text-[#E6ECEB]/25 cursor-not-allowed',
                !isPast &&
                  status === 'Available' &&
                  'border-[#C5B378]/15 bg-[#092E2B] text-white hover:border-[#D8C78E] hover:bg-[#134E49] cursor-pointer',
                !isPast &&
                  status === 'Limited' &&
                  'border-amber-400/45 bg-amber-500/15 text-amber-100 hover:border-amber-300 cursor-pointer',
                !isPast &&
                  status === 'Booked' &&
                  (allowSelectBooked
                    ? 'border-rose-400/45 bg-rose-500/20 text-rose-100 hover:border-rose-300 cursor-pointer'
                    : 'border-rose-400/25 bg-rose-950/50 text-rose-200/60 cursor-not-allowed'),
                isSelected &&
                  'ring-2 ring-[#D8C78E] border-[#D8C78E] bg-[#C5B378] text-[#072421] font-semibold'
              )}
            >
              <span className="tabular-nums text-sm leading-none">{cell.day}</span>
              {!isPast && (
                <span
                  className={cn(
                    'mt-1 text-[10px] leading-none font-medium',
                    isSelected
                      ? 'text-[#072421]'
                      : status === 'Booked'
                      ? 'text-rose-300'
                      : status === 'Limited'
                      ? 'text-amber-300'
                      : 'text-emerald-300/75'
                  )}
                >
                  {status === 'Booked' ? 'Booked' : status === 'Limited' ? 'Limited' : 'Open'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explicit multi-modal legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#C5B378]/15 pt-3 text-xs text-[#E6ECEB]/80">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-emerald-400/50 bg-[#092E2B]" />
          <span>Open · Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-amber-400/60 bg-amber-500/25" />
          <span>Limited · 1 Crew Slot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border border-rose-400/50 bg-rose-950/80" />
          <span>Booked · Unavailable</span>
        </div>
      </div>
    </div>
  );
}
