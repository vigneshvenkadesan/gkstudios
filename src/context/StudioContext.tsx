import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BookingRequest,
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
import { DEFAULT_IMAGE_BY_ID, INITIAL_STUDIO_STATE } from '@/src/data/initialStudioData';

const STORAGE_KEY = 'gk_studios_state_v2';

interface SubmitBookingInput {
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string;
  endDate?: string;
  venue: string;
  packageId: string;
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
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
  submitBooking: (input: SubmitBookingInput) => BookingRequest;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  processBookingAction: (input: AcknowledgeBookingInput) => void;
  upsertCalendarEntry: (entry: CalendarDayEntry) => void;
  removeCalendarEntry: (date: string) => void;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id'>) => PortfolioItem;
  updatePortfolioItem: (id: string, patch: Partial<PortfolioItem>) => void;
  deletePortfolioItem: (id: string) => void;
  createEventProject: (input: CreateEventProjectInput) => EventProject;
  updateEventStage: (projectId: string, stage: EventStage, note?: string) => void;
  updateEventFinancials: (
    projectId: string,
    patch: { agreedAmount?: number; extraCharges?: number; discount?: number; deliveryNotes?: string; assignedCrew?: string }
  ) => void;
  addEventPayment: (projectId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  deleteEventPayment: (projectId: string, paymentId: string) => void;
  resetDemoData: () => void;
}

const StudioContext = createContext<StudioContextValue | undefined>(undefined);

function loadInitialState(): StudioState {
  if (typeof window === 'undefined') return INITIAL_STUDIO_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STUDIO_STATE;
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    const normalizedPortfolio =
      Array.isArray(parsed.portfolio) && parsed.portfolio.length > 0
        ? parsed.portfolio.map((item) => ({
            ...item,
            imageUrl: DEFAULT_IMAGE_BY_ID[item.id] || item.imageUrl,
          }))
        : INITIAL_STUDIO_STATE.portfolio;

    return {
      portfolio: normalizedPortfolio,
      packages:
        Array.isArray(parsed.packages) && parsed.packages.length > 0
          ? parsed.packages
          : INITIAL_STUDIO_STATE.packages,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : INITIAL_STUDIO_STATE.bookings,
      calendarEntries: Array.isArray(parsed.calendarEntries)
        ? parsed.calendarEntries
        : INITIAL_STUDIO_STATE.calendarEntries,
      eventProjects: Array.isArray(parsed.eventProjects)
        ? parsed.eventProjects
        : INITIAL_STUDIO_STATE.eventProjects,
    };
  } catch {
    return INITIAL_STUDIO_STATE;
  }
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  const submitBooking = useCallback(
    (input: SubmitBookingInput): BookingRequest => {
      const selectedPkg =
        state.packages.find((p) => p.id === input.packageId) || state.packages[0];
      const now = new Date();
      const refNumber = String(Math.floor(100 + Math.random() * 900));
      const newBooking: BookingRequest = {
        id: `bk-${Date.now()}`,
        referenceCode: `GK-${String(now.getFullYear()).slice(-2)}${String(
          now.getMonth() + 1
        ).padStart(2, '0')}-${refNumber}`,
        clientName: input.clientName.trim(),
        phone: input.phone.trim(),
        eventType: input.eventType,
        preferredDate: input.preferredDate,
        endDate: input.endDate || undefined,
        venue: input.venue.trim(),
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        quotedAmount: selectedPkg.price,
        notes: input.notes.trim(),
        status: 'Pending',
        createdAt: now.toISOString(),
      };

      setState((prev) => ({
        ...prev,
        bookings: [newBooking, ...prev.bookings],
      }));

      return newBooking;
    },
    [state.packages]
  );

  const updateBookingStatus = useCallback((bookingId: string, status: BookingStatus) => {
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    }));
  }, []);

  const processBookingAction = useCallback((input: AcknowledgeBookingInput) => {
    setState((prev) => {
      const pkg = prev.packages.find((p) => p.id === input.packageId);
      const targetBooking = prev.bookings.find((b) => b.id === input.bookingId);
      if (!targetBooking) return prev;

      const resolvedPkgName = pkg ? pkg.name : targetBooking.packageName;
      const resolvedCrew = input.assignedCrew?.trim() || targetBooking.assignedCrew || 'G Krishna & Studio Unit';

      const updatedBookings = prev.bookings.map((b) =>
        b.id === input.bookingId
          ? {
              ...b,
              packageId: pkg ? pkg.id : b.packageId,
              packageName: resolvedPkgName,
              quotedAmount: input.quotedAmount,
              assignedCrew: resolvedCrew,
              acknowledgementNote: input.acknowledgementNote.trim(),
              status: input.nextStatus,
            }
          : b
      );

      let updatedCalendar = [...prev.calendarEntries];

      if (input.blockCalendarDate && targetBooking.preferredDate) {
        const datesToUpdate: string[] = [targetBooking.preferredDate];
        if (targetBooking.endDate && targetBooking.endDate > targetBooking.preferredDate) {
          const start = new Date(targetBooking.preferredDate + 'T00:00:00');
          const end = new Date(targetBooking.endDate + 'T00:00:00');
          const cursor = new Date(start);
          cursor.setDate(cursor.getDate() + 1);
          let guard = 0;
          while (cursor <= end && guard < 7) {
            const iso = cursor.toISOString().slice(0, 10);
            datesToUpdate.push(iso);
            cursor.setDate(cursor.getDate() + 1);
            guard++;
          }
        }

        datesToUpdate.forEach((dateStr) => {
          const entry: CalendarDayEntry = {
            date: dateStr,
            status: input.nextStatus === 'Confirmed' ? 'Booked' : 'Limited',
            title: `${targetBooking.clientName} — ${targetBooking.eventType}`,
            eventType: targetBooking.eventType,
            clientName: targetBooking.clientName,
            venue: targetBooking.venue,
            assignedCrew: resolvedCrew,
            notes: input.acknowledgementNote.trim() || targetBooking.notes,
            bookingId: targetBooking.id,
          };
          const existingIdx = updatedCalendar.findIndex((c) => c.date === dateStr);
          if (existingIdx >= 0) {
            updatedCalendar[existingIdx] = entry;
          } else {
            updatedCalendar.push(entry);
          }
        });
      }

      // Auto-sync Confirmed bookings into Event Timeline & Payment Ledger
      let updatedProjects = [...prev.eventProjects];
      if (input.nextStatus === 'Confirmed') {
        const exists = updatedProjects.some((p) => p.bookingId === targetBooking.id);
        if (!exists) {
          const todayIso = new Date().toISOString().slice(0, 10);
          const newProject: EventProject = {
            id: `ev-${Date.now()}`,
            bookingId: targetBooking.id,
            referenceCode: targetBooking.referenceCode,
            clientName: targetBooking.clientName,
            phone: targetBooking.phone,
            eventType: targetBooking.eventType,
            eventDate: targetBooking.preferredDate,
            endDate: targetBooking.endDate,
            venue: targetBooking.venue,
            packageName: resolvedPkgName,
            assignedCrew: resolvedCrew,
            currentStage: 'Booking Confirmed',
            stageUpdates: {
              'Booking Confirmed': {
                completedAt: todayIso,
                note: input.acknowledgementNote.trim() || 'Date locked via booking approval.',
              },
            },
            agreedAmount: input.quotedAmount,
            extraCharges: 0,
            discount: 0,
            payments: [],
            deliveryNotes: targetBooking.notes || 'Standard album & 4K delivery workflow.',
          };
          updatedProjects = [newProject, ...updatedProjects];
        }
      }

      return {
        ...prev,
        bookings: updatedBookings,
        calendarEntries: updatedCalendar,
        eventProjects: updatedProjects,
      };
    });
  }, []);

  const upsertCalendarEntry = useCallback((entry: CalendarDayEntry) => {
    setState((prev) => {
      const idx = prev.calendarEntries.findIndex((c) => c.date === entry.date);
      const next = [...prev.calendarEntries];
      if (idx >= 0) {
        next[idx] = entry;
      } else {
        next.push(entry);
      }
      next.sort((a, b) => a.date.localeCompare(b.date));
      return { ...prev, calendarEntries: next };
    });
  }, []);

  const removeCalendarEntry = useCallback((date: string) => {
    setState((prev) => ({
      ...prev,
      calendarEntries: prev.calendarEntries.filter((c) => c.date !== date),
    }));
  }, []);

  const addPortfolioItem = useCallback((item: Omit<PortfolioItem, 'id'>): PortfolioItem => {
    const newItem: PortfolioItem = {
      ...item,
      id: `pf-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      portfolio: [newItem, ...prev.portfolio],
    }));
    return newItem;
  }, []);

  const updatePortfolioItem = useCallback((id: string, patch: Partial<PortfolioItem>) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }, []);

  const deletePortfolioItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((item) => item.id !== id),
    }));
  }, []);

  const createEventProject = useCallback((input: CreateEventProjectInput): EventProject => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const refNumber = String(Math.floor(100 + Math.random() * 900));
    const initialPayments: PaymentRecord[] =
      input.initialAdvance && input.initialAdvance > 0
        ? [
            {
              id: `pay-${Date.now()}`,
              date: todayIso,
              label: 'Booking Advance',
              amount: input.initialAdvance,
              method: 'UPI / GPay',
            },
          ]
        : [];

    const newProject: EventProject = {
      id: `ev-${Date.now()}`,
      referenceCode: `GK-${todayIso.slice(2, 4)}${todayIso.slice(5, 7)}-${refNumber}`,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      eventType: input.eventType,
      eventDate: input.eventDate,
      endDate: input.endDate || undefined,
      venue: input.venue.trim(),
      packageName: input.packageName,
      assignedCrew: input.assignedCrew.trim() || 'G Krishna & Studio Unit',
      currentStage: 'Booking Confirmed',
      stageUpdates: {
        'Booking Confirmed': {
          completedAt: todayIso,
          note: 'Offline booking created in Studio Timeline.',
        },
      },
      agreedAmount: input.agreedAmount,
      extraCharges: 0,
      discount: 0,
      payments: initialPayments,
      deliveryNotes: input.deliveryNotes?.trim() || '',
    };

    setState((prev) => ({
      ...prev,
      eventProjects: [newProject, ...prev.eventProjects],
    }));

    return newProject;
  }, []);

  const updateEventStage = useCallback((projectId: string, stage: EventStage, note?: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setState((prev) => ({
      ...prev,
      eventProjects: prev.eventProjects.map((proj) => {
        if (proj.id !== projectId) return proj;
        const existing = proj.stageUpdates[stage] || {};
        return {
          ...proj,
          currentStage: stage,
          stageUpdates: {
            ...proj.stageUpdates,
            [stage]: {
              completedAt: existing.completedAt || todayIso,
              note: note !== undefined ? note : existing.note,
            },
          },
        };
      }),
    }));
  }, []);

  const updateEventFinancials = useCallback(
    (
      projectId: string,
      patch: {
        agreedAmount?: number;
        extraCharges?: number;
        discount?: number;
        deliveryNotes?: string;
        assignedCrew?: string;
      }
    ) => {
      setState((prev) => ({
        ...prev,
        eventProjects: prev.eventProjects.map((proj) =>
          proj.id === projectId ? { ...proj, ...patch } : proj
        ),
      }));
    },
    []
  );

  const addEventPayment = useCallback(
    (projectId: string, payment: Omit<PaymentRecord, 'id'>) => {
      const newPayment: PaymentRecord = {
        ...payment,
        id: `pay-${Date.now()}`,
      };
      setState((prev) => ({
        ...prev,
        eventProjects: prev.eventProjects.map((proj) =>
          proj.id === projectId
            ? { ...proj, payments: [...proj.payments, newPayment] }
            : proj
        ),
      }));
    },
    []
  );

  const deleteEventPayment = useCallback((projectId: string, paymentId: string) => {
    setState((prev) => ({
      ...prev,
      eventProjects: prev.eventProjects.map((proj) =>
        proj.id === projectId
          ? { ...proj, payments: proj.payments.filter((p) => p.id !== paymentId) }
          : proj
      ),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    setState(INITIAL_STUDIO_STATE);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDIO_STATE));
    } catch {
      // Ignore
    }
  }, []);

  return (
    <StudioContext.Provider
      value={{
        state,
        packages: state.packages,
        portfolio: state.portfolio,
        bookings: state.bookings,
        calendarEntries: state.calendarEntries,
        eventProjects: state.eventProjects,
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
