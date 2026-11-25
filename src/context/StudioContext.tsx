'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BookingRequest,
  BookingServiceOption,
  BookingStatus,
  CalendarDayEntry,
  DurationTier,
  EventCategory,
  EventProject,
  EventStage,
  OptedServiceSnapshot,
  PackageSnapshot,
  PaymentRecord,
  PortfolioItem,
  StudioBill,
  StudioPackage,
  StudioService,
  StudioState,
} from '@/src/types/studio';
import { INITIAL_STUDIO_STATE } from '@/src/data/initialStudioData';
import { DEFAULT_STUDIO_SERVICES } from '@/src/lib/pricing';

interface SubmitBookingInput {
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string;
  endDate?: string;
  eventTime?: string;
  venue: string;
  packageId: string;
  packageName?: string;
  quotedAmount?: number;
  requestedServices?: BookingServiceOption[];
  durationTier?: DurationTier;
  optedServices?: OptedServiceSnapshot[];
  totalAmount?: number;
  notes: string;
  status?: BookingStatus;
  source?: string;
  assignedCrew?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  packageSnapshot?: PackageSnapshot;
}

interface AcknowledgeBookingInput {
  bookingId: string;
  packageId: string;
  quotedAmount: number;
  assignedCrew?: string;
  acknowledgementNote: string;
  nextStatus: Extract<BookingStatus, 'In Discussion' | 'Acknowledged' | 'Confirmed'>;
  blockCalendarDate?: boolean;
  eventTime?: string;
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
  services: StudioService[];
  portfolio: PortfolioItem[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
  bills: StudioBill[];
  refreshStudio: () => Promise<boolean>;
  submitBooking: (input: SubmitBookingInput) => Promise<BookingRequest>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  processBookingAction: (input: AcknowledgeBookingInput) => Promise<void>;
  upsertCalendarEntry: (entry: CalendarDayEntry) => Promise<void>;
  removeCalendarEntry: (date: string, entryId?: string) => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => Promise<PortfolioItem>;
  updatePortfolioItem: (id: string, patch: Partial<PortfolioItem>) => Promise<void>;
  deletePortfolioItem: (id: string) => Promise<void>;
  addPackage: (item: Partial<StudioPackage>) => Promise<StudioPackage>;
  updatePackage: (id: string, patch: Partial<StudioPackage>) => Promise<void>;
  updateEventPackagesStatus: (eventId: string, status: 'active' | 'inactive') => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  getPackage: (id: string) => Promise<StudioPackage>;
  reorderPackages: (orderedIds: string[]) => Promise<void>;
  saveService: (service: Partial<StudioService>) => Promise<StudioService>;
  updateService: (idOrSlug: string, patch: Partial<StudioService>) => Promise<StudioService>;
  deleteService: (idOrSlug: string) => Promise<void>;
  createEventProject: (input: CreateEventProjectInput) => Promise<EventProject>;
  deleteEventProject: (projectId: string) => Promise<void>;
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
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
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
      return true;
    } catch (error) {
      console.error('Failed to refresh studio data.', error);
      return false;
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
        eventTime: input.eventTime,
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

  const addPackage = useCallback(
    async (item: Partial<StudioPackage>): Promise<StudioPackage> => {
      const data = await requestJson<{ state: StudioState; created: StudioPackage }>(
        '/api/packages',
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

  const getPackage = useCallback(async (id: string): Promise<StudioPackage> => {
    return requestJson<StudioPackage>(`/api/packages/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
  }, []);

  const updatePackage = useCallback(
    async (id: string, patch: Partial<StudioPackage>) => {
      const nextState = await requestJson<StudioState>(`/api/packages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setState(nextState);
    },
    []
  );

  const updateEventPackagesStatus = useCallback(
    async (eventId: string, status: 'active' | 'inactive') => {
      const nextState = await requestJson<StudioState>('/api/packages', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'event-status', eventId, status }),
      });
      setState(nextState);
    },
    []
  );

  const deletePackage = useCallback(async (id: string) => {
    const nextState = await requestJson<StudioState>(`/api/packages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    setState(nextState);
  }, []);

  const reorderPackages = useCallback(async (orderedIds: string[]) => {
    const nextState = await requestJson<StudioState>('/api/packages/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
    setState(nextState);
  }, []);

  const saveService = useCallback(async (service: Partial<StudioService>): Promise<StudioService> => {
    const created = await requestJson<StudioService>('/api/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    await refreshStudio();
    return created;
  }, [refreshStudio]);

  const updateService = useCallback(async (idOrSlug: string, patch: Partial<StudioService>): Promise<StudioService> => {
    const updated = await requestJson<StudioService>(`/api/services/${idOrSlug}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await refreshStudio();
    return updated;
  }, [refreshStudio]);

  const deleteService = useCallback(async (idOrSlug: string): Promise<void> => {
    await requestJson(`/api/services/${idOrSlug}`, {
      method: 'DELETE',
    });
    await refreshStudio();
  }, [refreshStudio]);

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

  const deleteEventProject = useCallback(async (projectId: string) => {
    const nextState = await requestJson<StudioState>(`/api/events/${projectId}`, {
      method: 'DELETE',
    });
    setState(nextState);
  }, []);

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

  return (
    <StudioContext.Provider
      value={{
        state,
        isLoading,
        packages: state.packages,
        services: state.services && state.services.length > 0 ? state.services : DEFAULT_STUDIO_SERVICES,
        portfolio: state.portfolio,
        bookings: state.bookings,
        calendarEntries: state.calendarEntries,
        eventProjects: state.eventProjects,
        bills: state.bills ?? [],
        refreshStudio,
        submitBooking,
        updateBookingStatus,
        processBookingAction,
        upsertCalendarEntry,
        removeCalendarEntry,
        addPortfolioItem,
        updatePortfolioItem,
        deletePortfolioItem,
        addPackage,
        updatePackage,
        updateEventPackagesStatus,
        deletePackage,
        getPackage,
        reorderPackages,
        saveService,
        updateService,
        deleteService,
        createEventProject,
        deleteEventProject,
        updateEventStage,
        updateEventFinancials,
        addEventPayment,
        deleteEventPayment,
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
