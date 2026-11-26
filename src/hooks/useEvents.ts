'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudio } from '@/src/context/StudioContext';
import { StudioEvent } from '@/src/types/studio';

interface UseEventsOptions {
  all?: boolean;
  category?: string;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { state, isLoading } = useStudio();
  const [events, setEvents] = useState<StudioEvent[]>(state.events);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (options.all) {
      params.set('all', 'true');
    } else {
      params.set('status', 'active');
    }
    if (options.category) params.set('category', options.category);

    setIsFetching(true);
    setError(null);
    fetch(`/api/events?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as StudioEvent[] | { error?: string };
        if (!response.ok || !Array.isArray(payload)) {
          throw new Error(
            !Array.isArray(payload) && payload.error
              ? payload.error
              : 'Unable to load events.'
          );
        }
        setEvents(payload);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load events.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFetching(false);
      });

    return () => controller.abort();
  }, [options.all, options.category, refreshVersion]);

  const activeEvents = useMemo(
    () => events.filter((event) => event.status === 'active'),
    [events]
  );
  const eventsByCategory = useMemo(() => {
    const map = new Map<string, StudioEvent[]>();
    activeEvents.forEach((event) => {
      const list = map.get(event.category) || [];
      list.push(event);
      map.set(event.category, list);
    });
    return map;
  }, [activeEvents]);

  const refresh = useCallback(async () => {
    setRefreshVersion((version) => version + 1);
  }, []);

  return {
    events,
    activeEvents,
    eventsByCategory,
    isLoading: isLoading || isFetching,
    error,
    refresh,
  };
}
