import fs from 'fs/promises';
import path from 'path';
import {
  BookingRequest,
  BookingStatus,
  CalendarDayEntry,
  EventCategory,
  EventProject,
  EventStage,
  PaymentRecord,
  PortfolioItem,
  StudioState,
} from '@/src/types/studio';
import { DEFAULT_IMAGE_BY_ID, INITIAL_STUDIO_STATE } from '@/src/data/initialStudioData';

const PRIMARY_DB_PATH = path.join(process.cwd(), 'data', 'studio-db.json');
const FALLBACK_DB_PATH = '/tmp/gk-studios-db.json';

let memoryCache: StudioState | null = null;
let activeDbPath: string = PRIMARY_DB_PATH;

function cloneInitialState(): StudioState {
  return JSON.parse(JSON.stringify(INITIAL_STUDIO_STATE)) as StudioState;
}

function normalizeState(raw: Partial<StudioState>): StudioState {
  const portfolio =
    Array.isArray(raw.portfolio) && raw.portfolio.length > 0
      ? raw.portfolio.map((item) => ({
          ...item,
          imageUrl: DEFAULT_IMAGE_BY_ID[item.id] || item.imageUrl,
        }))
      : INITIAL_STUDIO_STATE.portfolio;

  return {
    portfolio,
    packages:
      Array.isArray(raw.packages) && raw.packages.length > 0
        ? raw.packages
        : INITIAL_STUDIO_STATE.packages,
    bookings: Array.isArray(raw.bookings) ? raw.bookings : INITIAL_STUDIO_STATE.bookings,
    calendarEntries: Array.isArray(raw.calendarEntries)
      ? raw.calendarEntries
      : INITIAL_STUDIO_STATE.calendarEntries,
    eventProjects: Array.isArray(raw.eventProjects)
      ? raw.eventProjects
      : INITIAL_STUDIO_STATE.eventProjects,
  };
}

async function readFromDisk(): Promise<StudioState> {
  for (const candidate of [activeDbPath, PRIMARY_DB_PATH, FALLBACK_DB_PATH]) {
    try {
      const content = await fs.readFile(candidate, 'utf-8');
      const parsed = JSON.parse(content) as Partial<StudioState>;
      activeDbPath = candidate;
      return normalizeState(parsed);
    } catch {
      // Try next location
    }
  }
  const seed = cloneInitialState();
  await writeToDisk(seed);
  return seed;
}

async function writeToDisk(nextState: StudioState): Promise<void> {
  const payload = JSON.stringify(nextState, null, 2);
  try {
    await fs.mkdir(path.dirname(activeDbPath), { recursive: true });
    await fs.writeFile(activeDbPath, payload, 'utf-8');
  } catch {
    activeDbPath = FALLBACK_DB_PATH;
    try {
      await fs.writeFile(FALLBACK_DB_PATH, payload, 'utf-8');
    } catch {
      // Keep memoryCache authoritative if filesystem is completely read-only
    }
  }
}

export async function getStudioState(): Promise<StudioState> {
  if (!memoryCache) {
    memoryCache = await readFromDisk();
  }
  return memoryCache;
}

export async function saveStudioState(nextState: StudioState): Promise<StudioState> {
  memoryCache = nextState;
  await writeToDisk(nextState);
  return memoryCache;
}

export async function resetStudioState(): Promise<StudioState> {
  const seed = cloneInitialState();
  return saveStudioState(seed);
}

export async function createBookingOnServer(input: {
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string;
  endDate?: string;
  venue: string;
  packageId: string;
  notes: string;
}): Promise<BookingRequest> {
  const state = await getStudioState();
  const blocked = state.calendarEntries.find(
    (entry) => entry.date === input.preferredDate && entry.status === 'Booked'
  );
  if (blocked) {
    throw new Error(`Selected date ${input.preferredDate} is already booked.`);
  }

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

  await saveStudioState({
    ...state,
    bookings: [newBooking, ...state.bookings],
  });

  return newBooking;
}

export async function updateBookingStatusOnServer(
  bookingId: string,
  status: BookingStatus
): Promise<StudioState> {
  const state = await getStudioState();
  const exists = state.bookings.some((b) => b.id === bookingId);
  if (!exists) {
    throw new Error('Booking request not found.');
  }

  return saveStudioState({
    ...state,
    bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  });
}

export async function processBookingOnServer(input: {
  bookingId: string;
  packageId: string;
  quotedAmount: number;
  assignedCrew?: string;
  acknowledgementNote: string;
  nextStatus: Extract<BookingStatus, 'Acknowledged' | 'Confirmed'>;
  blockCalendarDate?: boolean;
}): Promise<StudioState> {
  const state = await getStudioState();
  const targetBooking = state.bookings.find((b) => b.id === input.bookingId);
  if (!targetBooking) {
    throw new Error('Booking request not found.');
  }

  const pkg = state.packages.find((p) => p.id === input.packageId);
  const resolvedPkgName = pkg ? pkg.name : targetBooking.packageName;
  const resolvedCrew =
    input.assignedCrew?.trim() || targetBooking.assignedCrew || 'G Krishna & Studio Unit';

  const updatedBookings = state.bookings.map((b) =>
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

  const updatedCalendar = [...state.calendarEntries];

  if (input.blockCalendarDate && targetBooking.preferredDate) {
    const datesToUpdate: string[] = [targetBooking.preferredDate];
    if (targetBooking.endDate && targetBooking.endDate > targetBooking.preferredDate) {
      const start = new Date(targetBooking.preferredDate + 'T00:00:00');
      const end = new Date(targetBooking.endDate + 'T00:00:00');
      const cursor = new Date(start);
      cursor.setDate(cursor.getDate() + 1);
      let guard = 0;
      while (cursor <= end && guard < 7) {
        datesToUpdate.push(cursor.toISOString().slice(0, 10));
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

  let updatedProjects = [...state.eventProjects];
  if (input.nextStatus === 'Confirmed') {
    const alreadyExists = updatedProjects.some((p) => p.bookingId === targetBooking.id);
    if (!alreadyExists) {
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

  return saveStudioState({
    ...state,
    bookings: updatedBookings,
    calendarEntries: updatedCalendar,
    eventProjects: updatedProjects,
  });
}

export async function upsertCalendarEntryOnServer(
  entry: CalendarDayEntry
): Promise<StudioState> {
  const state = await getStudioState();
  const next = [...state.calendarEntries];
  const idx = next.findIndex((c) => c.date === entry.date);
  if (idx >= 0) {
    next[idx] = entry;
  } else {
    next.push(entry);
  }
  next.sort((a, b) => a.date.localeCompare(b.date));

  return saveStudioState({
    ...state,
    calendarEntries: next,
  });
}

export async function removeCalendarEntryOnServer(date: string): Promise<StudioState> {
  const state = await getStudioState();
  return saveStudioState({
    ...state,
    calendarEntries: state.calendarEntries.filter((c) => c.date !== date),
  });
}

export async function addPortfolioItemOnServer(
  item: Omit<PortfolioItem, 'id'>
): Promise<{ state: StudioState; created: PortfolioItem }> {
  const state = await getStudioState();
  const created: PortfolioItem = {
    ...item,
    id: `pf-${Date.now()}`,
  };
  const nextState = await saveStudioState({
    ...state,
    portfolio: [created, ...state.portfolio],
  });
  return { state: nextState, created };
}

export async function updatePortfolioItemOnServer(
  id: string,
  patch: Partial<PortfolioItem>
): Promise<StudioState> {
  const state = await getStudioState();
  return saveStudioState({
    ...state,
    portfolio: state.portfolio.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  });
}

export async function deletePortfolioItemOnServer(id: string): Promise<StudioState> {
  const state = await getStudioState();
  return saveStudioState({
    ...state,
    portfolio: state.portfolio.filter((item) => item.id !== id),
  });
}

export async function createEventProjectOnServer(input: {
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
}): Promise<{ state: StudioState; created: EventProject }> {
  const state = await getStudioState();
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

  const created: EventProject = {
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

  const nextState = await saveStudioState({
    ...state,
    eventProjects: [created, ...state.eventProjects],
  });

  return { state: nextState, created };
}

export async function updateEventStageOnServer(
  projectId: string,
  stage: EventStage,
  note?: string
): Promise<StudioState> {
  const state = await getStudioState();
  const todayIso = new Date().toISOString().slice(0, 10);

  return saveStudioState({
    ...state,
    eventProjects: state.eventProjects.map((proj) => {
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
  });
}

export async function updateEventFinancialsOnServer(
  projectId: string,
  patch: {
    agreedAmount?: number;
    extraCharges?: number;
    discount?: number;
    deliveryNotes?: string;
    assignedCrew?: string;
  }
): Promise<StudioState> {
  const state = await getStudioState();
  return saveStudioState({
    ...state,
    eventProjects: state.eventProjects.map((proj) =>
      proj.id === projectId ? { ...proj, ...patch } : proj
    ),
  });
}

export async function addEventPaymentOnServer(
  projectId: string,
  payment: Omit<PaymentRecord, 'id'>
): Promise<StudioState> {
  const state = await getStudioState();
  const newPayment: PaymentRecord = {
    ...payment,
    id: `pay-${Date.now()}`,
  };

  return saveStudioState({
    ...state,
    eventProjects: state.eventProjects.map((proj) =>
      proj.id === projectId
        ? { ...proj, payments: [...proj.payments, newPayment] }
        : proj
    ),
  });
}

export async function deleteEventPaymentOnServer(
  projectId: string,
  paymentId: string
): Promise<StudioState> {
  const state = await getStudioState();
  return saveStudioState({
    ...state,
    eventProjects: state.eventProjects.map((proj) =>
      proj.id === projectId
        ? { ...proj, payments: proj.payments.filter((p) => p.id !== paymentId) }
        : proj
    ),
  });
}
