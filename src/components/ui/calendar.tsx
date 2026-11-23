'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AvailabilityStatus, CalendarDayEntry } from '@/src/types/studio';
import { cn, toISODate } from '@/src/lib/utils';
import { PublicLocale, translate } from '@/src/i18n/translations';

interface StudioCalendarProps {
  monthDate: Date;
  onMonthChange: (nextMonth: Date) => void;
  entries: CalendarDayEntry[];
  selectedDate?: string;
  onSelectDate: (isoDate: string, entry?: CalendarDayEntry) => void;
  allowSelectBooked?: boolean;
  size?: 'compact' | 'standard' | 'large';
  locale?: PublicLocale;
  showNavigation?: boolean;
  showLegend?: boolean;
  showCellStatusLabels?: boolean;
}

export function StudioCalendar({
  monthDate,
  onMonthChange,
  entries,
  selectedDate,
  onSelectDate,
  allowSelectBooked = false,
  size = 'standard',
  locale = 'en',
  showNavigation = true,
  showLegend = true,
  showCellStatusLabels = true,
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

  const monthLabel = monthDate.toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN', {
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'short' }).format(
      new Date(Date.UTC(2023, 0, index + 1))
    )
  );
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const isCompact = size === 'compact';
  const statusLabel = (status: AvailabilityStatus) =>
    t(
      status === 'Booked'
        ? 'calendar.booked'
        : status === 'Limited'
          ? 'calendar.limited'
          : 'calendar.open'
    );

  const handlePrev = () => onMonthChange(new Date(year, month - 1, 1));
  const handleNext = () => onMonthChange(new Date(year, month + 1, 1));

  const isLarge = size === 'large';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#C5B378]/15">
        <div>
          <h4
            className={cn(
              'font-serif font-semibold text-white tracking-tight',
              isLarge ? 'text-2xl' : isCompact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
            )}
          >
            {monthLabel}
          </h4>
        </div>
        {showNavigation && (
          <div className="flex items-center gap-2">
            {isLarge ? (
              <button
                type="button"
                onClick={() => onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="h-9 rounded-sm border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs font-medium text-[#D8C78E] hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
              >
                {t('calendar.currentMonth')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMonthChange(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                className="h-9 rounded-sm border border-[#C5B378]/25 bg-[#072421] px-3 text-xs font-medium text-[#D8C78E] hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
              >
                {t('calendar.today')}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrev}
              aria-label={t('calendar.previousMonth')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#C5B378]/25 bg-[#072421] text-[#E6ECEB] transition-colors hover:border-[#D8C78E] hover:bg-[#134E49] hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={t('calendar.nextMonth')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#C5B378]/25 bg-[#072421] text-[#E6ECEB] transition-colors hover:border-[#D8C78E] hover:bg-[#134E49] hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center pt-4 pb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className={cn(
              'font-medium text-[#D8C78E]/80 py-1.5 tracking-[0.04em]',
              isLarge ? 'text-xs sm:text-sm border-b border-[#C5B378]/15' : 'text-[11px] sm:text-xs'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={cn('grid grid-cols-7', isLarge ? 'gap-2 sm:gap-2.5' : 'gap-1.5 sm:gap-2')}>
        {cells.map((cell) => {
          if (cell.day === null) {
            return (
              <div
                key={cell.iso}
                className={
                  isLarge
                    ? 'min-h-[88px] sm:min-h-[112px] rounded-md bg-[#072421]/30'
                    : size === 'compact'
                    ? 'h-11'
                    : 'h-12 sm:h-14'
                }
              />
            );
          }

          const entry = entryMap.get(cell.iso);
          const status: AvailabilityStatus = entry?.[0]?.status ?? 'Available';
          const isPast = cell.iso < todayISO;
          const isToday = cell.iso === todayISO;
          const isSelected = selectedDate === cell.iso;
          const isDisabled = !allowSelectBooked && (isPast || status === 'Booked');

          if (isLarge) {
            return (
              <div
                key={cell.iso}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDate(cell.iso, undefined)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectDate(cell.iso, undefined);
                  }
                }}
                className={cn(
                  'group relative flex min-h-[76px] sm:min-h-[112px] flex-col justify-between rounded-md border p-1.5 sm:p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] cursor-pointer',
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
                      'font-mono text-xs sm:text-base font-semibold tabular-nums',
                      isSelected ? 'text-[#D8C78E]' : 'text-white'
                    )}
                  >
                    {cell.day}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10px] font-semibold leading-none px-1 py-0.5 sm:px-1.5 rounded-sm shrink-0',
                      status === 'Booked'
                        ? 'bg-rose-500/25 text-rose-200'
                        : status === 'Limited'
                        ? 'bg-amber-500/25 text-amber-200'
                        : 'text-emerald-300/80'
                    )}
                  >
                    <span className={cn('font-mono font-bold', !isCompact && 'sm:hidden')}>
                      {status === 'Available' ? 'O' : status === 'Limited' ? 'L' : 'B'}
                    </span>
                    {!isCompact && <span className="hidden sm:inline">{statusLabel(status)}</span>}
                  </span>
                </div>

                {entry ? (
                  <div className="mt-1 sm:mt-1.5 w-full space-y-1 overflow-hidden">
                    {entry.slice(0, 3).map((dayEntry) => (
                      <button
                        key={dayEntry.id || `${dayEntry.date}-${dayEntry.title}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(cell.iso, dayEntry);
                        }}
                        className="w-full text-left rounded-sm border border-white/15 bg-black/30 px-1 py-0.5 sm:px-1.5 sm:py-1 transition-all hover:border-[#D8C78E] hover:bg-[#134E49] cursor-pointer group/item"
                        title={`Click to view/manage: ${dayEntry.title}`}
                      >
                        <p className="text-[9px] sm:text-xs font-semibold text-white truncate group-hover/item:text-[#D8C78E]">
                          {dayEntry.title}
                        </p>
                        {dayEntry.venue && (
                          <p className="hidden sm:block text-[9px] text-[#E6ECEB]/75 truncate">
                            {dayEntry.venue}
                          </p>
                        )}
                        {(dayEntry.packageName || (dayEntry.totalPackageAmount && dayEntry.totalPackageAmount > 0)) && (
                          <p className="text-[8.5px] sm:text-[9.5px] text-[#D8C78E] font-medium truncate">
                            {dayEntry.packageName}
                            {dayEntry.totalPackageAmount ? ` • ₹${dayEntry.totalPackageAmount.toLocaleString('en-IN')}` : ''}
                          </p>
                        )}
                        {dayEntry.requestedServices && dayEntry.requestedServices.length > 0 && (
                          <p className="text-[8px] sm:text-[9px] text-emerald-300/90 truncate font-mono">
                            {dayEntry.requestedServices.join(' • ')}
                          </p>
                        )}
                      </button>
                    ))}
                    {entry.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(cell.iso, undefined);
                        }}
                        className="text-[9px] sm:text-[10px] font-semibold text-[#D8C78E] hover:underline"
                      >
                        +{entry.length - 3} more
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="hidden sm:block text-[10px] text-[#E6ECEB]/40 group-hover:text-[#D8C78E] transition-colors">
                    + Add entry
                  </p>
                )}
              </div>
            );
          }

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={`${cell.iso} ${isPast ? t('calendar.pastDate') : locale === 'en' ? status : statusLabel(status)}${entry?.[0]?.title ? ` — ${entry[0].title}` : ''}`}
              onClick={() => onSelectDate(cell.iso, entry?.[0])}
              title={entry ? `${locale === 'en' ? status : statusLabel(status)}: ${entry[0].title}` : `${cell.iso} · ${t('calendar.available')}`}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-sm border text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E]',
                size === 'compact' ? 'h-11' : 'h-12 sm:h-14',
                isPast &&
                  'border-transparent bg-[#061E1C]/50 text-[#E6ECEB]/25 cursor-not-allowed',
                !isPast &&
                  status === 'Available' &&
                  'border-[#C5B378]/15 bg-[#072421] text-white hover:border-[#D8C78E] hover:bg-[#134E49] cursor-pointer',
                !isPast &&
                  status === 'Limited' &&
                  'border-amber-400/50 bg-amber-500/15 text-amber-100 hover:border-amber-300 cursor-pointer',
                !isPast &&
                  status === 'Booked' &&
                  (allowSelectBooked
                    ? 'border-rose-400/45 bg-rose-500/20 text-rose-100 hover:border-rose-300 cursor-pointer'
                    : 'border-rose-400/25 bg-rose-950/55 text-rose-200/60 cursor-not-allowed'),
                isToday && !isSelected && 'border-[#D8C78E]/70',
                isSelected &&
                  'ring-2 ring-[#D8C78E] ring-offset-1 ring-offset-[#0E423E] border-[#D8C78E] bg-[#C5B378] text-[#061E1C] font-semibold hover:bg-[#D8C78E]'
              )}
            >
              <span className="font-mono tabular-nums text-xs sm:text-sm leading-none">
                {cell.day}
              </span>
              {!isPast && showCellStatusLabels && (
                <span
                  className={cn(
                    'mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] leading-none font-medium tracking-[0.01em]',
                    isSelected
                      ? 'text-[#061E1C]'
                      : status === 'Booked'
                      ? 'text-rose-300'
                      : status === 'Limited'
                      ? 'text-amber-300'
                      : 'text-[#D8C78E]/75'
                  )}
                >
                  <span className="sm:hidden font-mono font-bold">
                    {status === 'Available' ? 'O' : status === 'Limited' ? 'L' : 'B'}
                  </span>
                  <span className="hidden sm:inline">{statusLabel(status)}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#C5B378]/15 pt-4 text-xs text-[#E6ECEB]/80">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[2px] border border-[#C5B378]/45 bg-[#072421]" />
            <span>{t('calendar.openAvailable')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[2px] border border-amber-400/60 bg-amber-500/20" />
            <span>{t('calendar.limitedSlot')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[2px] border border-rose-400/50 bg-rose-950/80" />
            <span>{t('calendar.bookedUnavailable')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-[2px] border border-[#D8C78E] bg-[#C5B378]" />
            <span>{t('calendar.selected')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
