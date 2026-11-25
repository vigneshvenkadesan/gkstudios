'use client';

import { useMemo } from 'react';
import { useStudio } from '@/src/context/StudioContext';
import { getPackageEvents } from '@/src/lib/packageEvents';
import { StudioEvent } from '@/src/types/studio';

interface UseEventsOptions {
  all?: boolean;
  category?: string;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { packages, isLoading, refreshStudio } = useStudio();

  const allEvents = useMemo(
    () =>
      getPackageEvents(packages, {
        includeInactive: options.all,
        category: options.category,
      }),
    [packages, options.all, options.category]
  );

  const activeEvents = useMemo(() => {
    return allEvents.filter((event) => (event.status ?? 'active') === 'active');
  }, [allEvents]);

  const eventsByCategory = useMemo(() => {
    const map = new Map<string, StudioEvent[]>();
    activeEvents.forEach((event) => {
      const cat = event.category || 'wedding';
      const list = map.get(cat) || [];
      list.push(event);
      map.set(cat, list);
    });
    return map;
  }, [activeEvents]);

  return {
    events: allEvents,
    activeEvents,
    eventsByCategory,
    isLoading,
    error: null,
    refresh: refreshStudio,
  };
}
