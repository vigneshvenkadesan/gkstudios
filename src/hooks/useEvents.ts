'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStudio } from '@/src/context/StudioContext';
import { StudioEvent } from '@/src/types/studio';

interface UseEventsOptions {
  all?: boolean;
  category?: string;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { events: contextEvents, isLoading: contextLoading } = useStudio();
  const [fetchedEvents, setFetchedEvents] = useState<StudioEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.all) params.set('all', 'true');
      if (options.category) params.set('category', options.category);

      const url = `/api/events${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch events: ${res.statusText}`);
      }
      const data = (await res.json()) as StudioEvent[];
      setFetchedEvents(data);
    } catch (err) {
      console.warn('Could not fetch events from API, falling back to context/defaults:', err);
      setError(err instanceof Error ? err.message : 'Error fetching events');
    } finally {
      setIsLoading(false);
    }
  }, [options.all, options.category]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Combine context and fetched events (prefer fetched if available, else context)
  const allEvents = useMemo(() => {
    if (fetchedEvents.length > 0) return fetchedEvents;
    return contextEvents;
  }, [fetchedEvents, contextEvents]);

  const activeEvents = useMemo(() => {
    return allEvents
      .filter((e) => (e.status ?? 'active') === 'active')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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

  const createEvent = useCallback(
    async (input: {
      name: string;
      tamilName?: string;
      category: string;
      status?: 'active' | 'inactive';
      sortOrder?: number;
      id?: string;
    }) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create event');
      }
      const created = (await res.json()) as StudioEvent;
      await fetchEvents();
      return created;
    },
    [fetchEvents]
  );

  const updateEvent = useCallback(
    async (
      id: string,
      patch: {
        name?: string;
        tamilName?: string;
        category?: string;
        status?: 'active' | 'inactive';
        sortOrder?: number;
      }
    ) => {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update event');
      }
      const updated = (await res.json()) as StudioEvent;
      await fetchEvents();
      return updated;
    },
    [fetchEvents]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete event');
      }
      await fetchEvents();
      return true;
    },
    [fetchEvents]
  );

  return {
    events: allEvents,
    activeEvents,
    eventsByCategory,
    isLoading: isLoading || (contextLoading && allEvents.length === 0),
    error,
    refresh: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
