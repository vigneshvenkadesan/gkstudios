'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BookingRequest,
  BookingServiceOption,
  BookingStatus,
  CalendarDayEntry,
  EventCategory,
  EventProject,
  EventStage,
  PaymentRecord,
  PortfolioItem,
  StudioPackage,
  StudioState,
} from '@/src/types/studio';
import { INITIAL_STUDIO_STATE } from '@/src/data/initialStudioData';

interface SubmitBookingInput {
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string;
  endDate?: string;
  eventTime?: string;
  venue: string;
  packageId: string;
  requestedServices?: BookingServiceOption[];
  notes: string;
}

interface AcknowledgeBookingInput {
  bookingId: string;
  packageId: string;
  quotedAmount: number;
  assignedCrew?: string;
  acknowledgementNote: string;
  nextStatus: Extract<BookingStatus, 'Acknowledged' | 'Confirmed'>;
  blockCalendarDate?: boolean;
}

interface CreateEventProjectInput {
  clientName: string;
  phone: string;
  eventType: EventCategory;
  eventDate: string;
  endDate?: string;
  venue: string;
  packageName: string;
  assignedCrew: string;
  agreedAmount: number;
  initialAdvance?: number;
  deliveryNotes?: string;
}

interface StudioContextValue {
  state: StudioState;
  isLoading: boolean;
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
  refreshStudio: () => Promise<void>;
  submitBooking: (input: SubmitBookingInput) => Promise<BookingRequest>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  processBookingAction: (input: AcknowledgeBookingInput) => Promise<void>;
  upsertCalendarEntry: (entry: CalendarDayEntry) => Promise<void>;
  removeCalendarEntry: (date: string, entryId?: string) => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<PortfolioItem>;
  updatePortfolioItem: (id: string, patch: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  createEventProject: (input: CreateEventProjectInput) => Promise<EventProject>;
  updateEventStage: (projectId: string, stage: EventStage, note?: string) => Promise<void>;
  updateEventFinancials: (
    projectId: string,
    patch: {
      agreedAmount?: number;
      extraCharges?: number;
      discount?: number;
      deliveryNotes?: string;
      assignedCrew?: string;
    }
  ) => Promise<void>;
  addEventPayment: (projectId: string, payment: Omit<PaymentRecord, 'id'>) => Promise<void>;
  deleteEventPayment: (projectId: string, paymentId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function StudioProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: StudioState;
}) {
  const [state, setState] = useState<StudioState>(initialState || INITIAL_STUDIO_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(!initialState);

  const refreshStudio = useCallback(async () => {
    try {
      const serverState = await requestJson<StudioState>('/api/studio', { cache: 'no-store' });
      setState(serverState);
    } catch {
      // Keep current state if transient error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudio();
  }, [refreshStudio]);

  const submitBooking = useCallback(
    async (input: SubmitBookingInput): Promise<BookingRequest> => {
      const data = await requestJson<{ booking: BookingRequest }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setState((prev) => ({
        ...prev,
        bookings: [data.booking, ...prev.bookings],
      }));
      return data.booking;
    },
    []
  );

  const updateBookingStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    const nextState = await requestJson<StudioState>(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'status', status }),
    });
    setState(nextState);
  }, []);

  const processBookingAction = useCallback(async (input: AcknowledgeBookingInput) => {
    const nextState = await requestJson<StudioState>(`/api/bookings/${input.bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'process',
        packageId: input.packageId,
        quotedAmount: input.quotedAmount,
        assignedCrew: input.assignedCrew,
        acknowledgementNote: input.acknowledgementNote,
        nextStatus: input.nextStatus,
        blockCalendarDate: input.blockCalendarDate,
      }),
    });
    setState(nextState);
  }, []);

  const upsertCalendarEntry = useCallback(async (entry: CalendarDayEntry) => {
    const nextState = await requestJson<StudioState>('/api/schedule', {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
    setState(nextState);
  }, []);

  const removeCalendarEntry = useCallback(
    async (date: string, entryId?: string) => {
      const params = new URLSearchParams({ date });
      if (entryId) params.set('id', entryId);
      const nextState = await requestJson<StudioState>(
        `/api/schedule?${params.toString()}`,
        { method: 'DELETE' }
      );
      setState(nextState);
    },
    []
  );

  const addPortfolioItem = useCallback(
    async (item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> => {
      const data = await requestJson<{ state: StudioState; created: PortfolioItem }>(
        '/api/portfolio',
        {
          method: 'POST',
          body: JSON.stringify(item),
        }
      );
      setState(data.state);
      return data.created;
    },
    []
  );

  const updatePortfolioItem = useCallback(
    async (id: string, patch: Partial<PortfolioItem>) => {
      const nextState = await requestJson<StudioState>(`/api/portfolio/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setState(nextState);
    },
    []
  );

  const deletePortfolioItem = useCallback(async (id: string) => {
    const nextState = await requestJson<StudioState>(`/api/portfolio/${id}`, {
      method: 'DELETE',
    });
    setState(nextState);
  }, []);

  const createEventProject = useCallback(
    async (input: CreateEventProjectInput): Promise<EventProject> => {
      const data = await requestJson<{ state: StudioState; created: EventProject }>(
        '/api/events',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
      setState(data.state);
      return data.created;
    },
    []
  );

  const updateEventStage = useCallback(
    async (projectId: string, stage: EventStage, note?: string) => {
      const nextState = await requestJson<StudioState>(`/api/events/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'stage', stage, note }),
      });
      setState(nextState);
    },
    []
  );

  const updateEventFinancials = useCallback(
    async (
      projectId: string,
      patch: {
        agreedAmount?: number;
        extraCharges?: number;
        discount?: number;
        deliveryNotes?: string;
        assignedCrew?: string;
      }
    ) => {
      const nextState = await requestJson<StudioState>(`/api/events/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'financials', ...patch }),
      });
      setState(nextState);
    },
    []
  );

  const addEventPayment = useCallback(
    async (projectId: string, payment: Omit<PaymentRecord, 'id'>) => {
      const nextState = await requestJson<StudioState>(`/api/events/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'add_payment', payment }),
      });
      setState(nextState);
    },
    []
  );

  const deleteEventPayment = useCallback(async (projectId: string, paymentId: string) => {
    const nextState = await requestJson<StudioState>(`/api/events/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'delete_payment', paymentId }),
    });
    setState(nextState);
  }, []);

  const resetDemoData = useCallback(async () => {
    const nextState = await requestJson<StudioState>('/api/studio/reset', {
      method: 'POST',
    });
    setState(nextState);
  }, []);

  return (
    <StudioContext.Provider
      value={{
        state,
        isLoading,
        packages: state.packages,
        portfolio: state.portfolio,
        bookings: state.bookings,
        calendarEntries: state.calendarEntries,
        eventProjects: state.eventProjects,
        refreshStudio,
        submitBooking,
        updateBookingStatus,
        processBookingAction,
        upsertCalendarEntry,
        removeCalendarEntry,
        addPortfolioItem,
        updatePortfolioItem,
        deletePortfolioItem,
        createEventProject,
        updateEventStage,
        updateEventFinancials,
        addEventPayment,
        deleteEventPayment,
        resetDemoData,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used inside StudioProvider');
  }
  return ctx;
}
