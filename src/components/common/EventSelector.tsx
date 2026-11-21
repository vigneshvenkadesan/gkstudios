'use client';

import React, { useMemo } from 'react';
import { useEvents } from '@/src/hooks/useEvents';
import { EVENT_CATEGORY_GROUPS, StudioEvent } from '@/src/types/studio';

export interface EventSelectorProps {
  id?: string;
  name?: string;
  value: string; // event id
  onChange: (eventId: string, event?: StudioEvent) => void;
  events?: StudioEvent[]; // optional override
  includeInactive?: boolean;
  groupByCategory?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showTamilName?: boolean;
  error?: string;
}

export function EventSelector({
  id = 'event-selector',
  name = 'eventId',
  value,
  onChange,
  events: propEvents,
  includeInactive = false,
  groupByCategory = true,
  label,
  placeholder = 'Select ceremony / event',
  required = false,
  disabled = false,
  className = '',
  showTamilName = true,
  error,
}: EventSelectorProps) {
  const { events: hookEvents, isLoading } = useEvents({ all: includeInactive });
  const eventList = propEvents || hookEvents;

  const filteredEvents = useMemo(() => {
    return eventList
      .filter((e) => (includeInactive ? true : (e.status ?? 'active') === 'active'))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [eventList, includeInactive]);

  const categories = useMemo(() => {
    if (!groupByCategory) return [];

    const groupMap = new Map<string, { label: string; tamilLabel?: string; events: StudioEvent[] }>();

    // Initialize with known category groups
    EVENT_CATEGORY_GROUPS.forEach((g) => {
      groupMap.set(g.id, { label: g.label, tamilLabel: g.tamilLabel, events: [] });
    });

    // Populate events
    filteredEvents.forEach((ev) => {
      const catKey = ev.category || 'wedding';
      if (!groupMap.has(catKey)) {
        groupMap.set(catKey, { label: catKey.toUpperCase(), events: [] });
      }
      groupMap.get(catKey)!.events.push(ev);
    });

    // Return only groups that have events
    return Array.from(groupMap.entries())
      .filter(([_, g]) => g.events.length > 0)
      .map(([id, g]) => ({ id, ...g }));
  }, [filteredEvents, groupByCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEvent = filteredEvents.find((ev) => ev.id === selectedId);
    onChange(selectedId, selectedEvent);
  };

  const baseSelectClass = `w-full rounded-sm border bg-[#092E2B] px-3.5 py-2.5 text-sm text-[#E6ECEB] transition-colors focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
    error ? 'border-rose-400/80' : 'border-[#C5B378]/30 hover:border-[#D8C78E]/60'
  } ${className}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-[#D8C78E]">
          {label} {required && <span className="text-rose-300">*</span>}
        </label>
      )}

      <select
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled || (isLoading && filteredEvents.length === 0)}
        className={baseSelectClass}
        required={required}
      >
        <option value="" disabled className="bg-[#072421] text-stone-400">
          {isLoading && filteredEvents.length === 0 ? 'Loading ceremonies...' : placeholder}
        </option>

        {groupByCategory ? (
          categories.map((cat) => (
            <optgroup
              key={cat.id}
              label={`${cat.label}${showTamilName && cat.tamilLabel ? ` (${cat.tamilLabel})` : ''}`}
              className="bg-[#051B19] text-[#D8C78E] font-semibold"
            >
              {cat.events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-[#072421] text-white font-normal">
                  {ev.name}
                  {showTamilName && ev.tamilName ? ` — ${ev.tamilName}` : ''}
                  {includeInactive && ev.status === 'inactive' ? ' (Inactive)' : ''}
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          filteredEvents.map((ev) => (
            <option key={ev.id} value={ev.id} className="bg-[#072421] text-white">
              {ev.name}
              {showTamilName && ev.tamilName ? ` — ${ev.tamilName}` : ''}
              {includeInactive && ev.status === 'inactive' ? ' (Inactive)' : ''}
            </option>
          ))
        )}
      </select>

      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
