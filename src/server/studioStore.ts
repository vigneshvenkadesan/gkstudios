import fs from 'fs/promises';
import path from 'path';
import {
  BookingRequest,
  BookingServiceOption,
  BookingStatus,
  CalendarDayEntry,
  CUSTOM_PACKAGE_ID,
  CUSTOM_PACKAGE_NAME,
  EventCategory,
  EventProject,
  EventStage,
  PackageSnapshot,
  PaymentRecord,
  PortfolioItem,
  StudioPackage,
  StudioState,
} from '../types/studio';
import { DEFAULT_IMAGE_BY_ID, INITIAL_STUDIO_STATE } from '../data/initialStudioData';
import {
  getBookingModel,
  getCalendarScheduleModel,
  getEventProjectModel,
  getPackageModel,
} from './mongodb';
import { formatINR } from '../lib/utils';

const PRIMARY_DB_PATH = path.join(process.cwd(), 'data', 'studio-db.json');

let memoryCache: StudioState | null = null;

function cloneInitialState(): StudioState {
  return JSON.parse(JSON.stringify(INITIAL_STUDIO_STATE)) as StudioState;
}

async function requireBookingModel() {
  const bookings = await getBookingModel();
  if (!bookings) {
    throw new Error('MongoDB is not configured. Booking requests cannot be stored.');
  }
  return bookings;
}

async function requireCalendarScheduleModel() {
  const schedule = await getCalendarScheduleModel();
  if (!schedule) {
    throw new Error('MongoDB is not configured. Calendar schedule cannot be stored.');
  }
  return schedule;
}

async function requireEventProjectModel() {
  const projects = await getEventProjectModel();
  if (!projects) {
    throw new Error('MongoDB is not configured. Event projects cannot be stored.');
  }
  return projects;
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
    bookings: [],
    calendarEntries: [],
    eventProjects: Array.isArray(raw.eventProjects)
      ? raw.eventProjects
      : INITIAL_STUDIO_STATE.eventProjects,
  };
}

async function readFromDisk(): Promise<StudioState> {
  try {
    const content = await fs.readFile(PRIMARY_DB_PATH, 'utf-8');
    const parsed = JSON.parse(content) as Partial<StudioState>;
    return normalizeState(parsed);
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      const seed = cloneInitialState();
      seed.bookings = [];
      seed.calendarEntries = [];
      return seed;
    }
    throw error;
  }
}

async function writeToDisk(nextState: StudioState): Promise<void> {
  await fs.mkdir(path.dirname(PRIMARY_DB_PATH), { recursive: true });
  await fs.writeFile(
    PRIMARY_DB_PATH,
    JSON.stringify(
      { ...nextState, bookings: [], calendarEntries: [], eventProjects: [] },
      null,
      2
    ),
    'utf-8'
  );
}

export function toPlainPackage(doc: unknown): StudioPackage {
  const p = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};

  const priceNum = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  return {
    id: String(p.id || p._id || ''),
    name: String(p.name || ''),
    audience: String(p.audience || ''),
    price: priceNum,
    priceLabel: p.priceLabel ? String(p.priceLabel) : formatINR(priceNum),
    duration: String(p.duration || ''),
    highlighted: Boolean(p.highlighted || p.featured),
    featured: Boolean(p.featured || p.highlighted),
    deliverables: Array.isArray(p.deliverables) ? p.deliverables.map(String) : [],
    imageUrl: p.imageUrl ? String(p.imageUrl) : p.image ? String(p.image) : '',
    image: p.image ? String(p.image) : p.imageUrl ? String(p.imageUrl) : '',
    category: p.category ? String(p.category) : undefined,
    status: p.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: p.displayOnPortfolio !== false,
    sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : 0,
    createdAt: p.createdAt ? String(p.createdAt) : undefined,
    updatedAt: p.updatedAt ? String(p.updatedAt) : undefined,
  };
}

function toPlainBooking(booking: BookingRequest & { createdAt?: unknown; packageSnapshot?: unknown }): BookingRequest {
  return {
    id: String(booking.id),
    referenceCode: String(booking.referenceCode),
    clientName: String(booking.clientName),
    phone: String(booking.phone),
    eventType: booking.eventType,
    preferredDate: String(booking.preferredDate),
    ...(booking.endDate ? { endDate: String(booking.endDate) } : {}),
    ...(booking.eventTime ? { eventTime: String(booking.eventTime) } : {}),
    venue: String(booking.venue),
    packageId: String(booking.packageId),
    packageName: String(booking.packageName),
    quotedAmount: Number(booking.quotedAmount),
    ...(Array.isArray(booking.requestedServices) && booking.requestedServices.length
      ? { requestedServices: booking.requestedServices }
      : {}),
    notes: String(booking.notes || ''),
    status: booking.status,
    ...(booking.source ? { source: String(booking.source) } : {}),
    ...(booking.assignedCrew ? { assignedCrew: String(booking.assignedCrew) } : {}),
    ...(booking.acknowledgementNote
      ? { acknowledgementNote: String(booking.acknowledgementNote) }
      : {}),
    ...(booking.termsAccepted !== undefined
      ? { termsAccepted: Boolean(booking.termsAccepted) }
      : {}),
    ...(booking.termsAcceptedAt ? { termsAcceptedAt: String(booking.termsAcceptedAt) } : {}),
    ...(booking.termsVersion ? { termsVersion: String(booking.termsVersion) } : {}),
    ...(booking.packageSnapshot ? { packageSnapshot: booking.packageSnapshot as PackageSnapshot } : {}),
    createdAt:
      typeof booking.createdAt === 'string'
        ? booking.createdAt
        : new Date(String(booking.createdAt)).toISOString(),
  };
}

function toPlainEventProject(project: EventProject & { _id?: unknown; packageSnapshot?: unknown }): EventProject {
  return {
    id: String(project.id),
    ...(project.bookingId ? { bookingId: String(project.bookingId) } : {}),
    referenceCode: String(project.referenceCode),
    clientName: String(project.clientName),
    phone: String(project.phone),
    eventType: project.eventType,
    eventDate: String(project.eventDate),
    ...(project.endDate ? { endDate: String(project.endDate) } : {}),
    venue: String(project.venue),
    packageName: String(project.packageName),
    assignedCrew: String(project.assignedCrew),
    currentStage: project.currentStage,
    stageUpdates: project.stageUpdates || {},
    agreedAmount: Number(project.agreedAmount),
    extraCharges: Number(project.extraCharges),
    discount: Number(project.discount),
    payments: Array.isArray(project.payments) ? project.payments : [],
    deliveryNotes: String(project.deliveryNotes || ''),
    ...(project.packageSnapshot ? { packageSnapshot: project.packageSnapshot as PackageSnapshot } : {}),
  };
}

export async function getStudioState(): Promise<StudioState> {
  if (!memoryCache) {
    memoryCache = await readFromDisk();
  }

  const bookings = await requireBookingModel();
  const mongoBookings = await bookings.find({}).sort({ createdAt: -1 }).lean().exec();
  const plainBookings = mongoBookings.map((booking) =>
    toPlainBooking(booking as unknown as BookingRequest & { createdAt?: unknown })
  );

  const schedule = await requireCalendarScheduleModel();
  const mongoSchedule = await schedule.find({}).sort({ date: 1 }).lean().exec();
  const plainSchedule = mongoSchedule.map((entry) => {
    const plain = entry as unknown as CalendarDayEntry & { _id?: unknown };
    return {
      id: String(plain.id),
      date: String(plain.date),
      status: plain.status,
      title: String(plain.title),
      ...(plain.eventType ? { eventType: plain.eventType } : {}),
      ...(plain.clientName ? { clientName: String(plain.clientName) } : {}),
      ...(plain.venue ? { venue: String(plain.venue) } : {}),
      ...(plain.assignedCrew ? { assignedCrew: String(plain.assignedCrew) } : {}),
      ...(plain.notes ? { notes: String(plain.notes) } : {}),
      ...(plain.bookingId ? { bookingId: String(plain.bookingId) } : {}),
      ...(plain.phone ? { phone: String(plain.phone) } : {}),
      ...(plain.time ? { time: String(plain.time) } : {}),
      ...(Array.isArray(plain.requestedServices) ? { requestedServices: plain.requestedServices } : {}),
    } satisfies CalendarDayEntry;
  });

  const eventProjects = await requireEventProjectModel();
  let mongoProjects = await eventProjects.find({}).sort({ eventDate: 1 }).lean().exec();
  if (mongoProjects.length === 0 && memoryCache.eventProjects.length > 0) {
    await eventProjects.bulkWrite(
      memoryCache.eventProjects.map((project) => ({
        updateOne: {
          filter: { id: project.id },
          update: { $setOnInsert: project },
          upsert: true,
        },
      }))
    );
    mongoProjects = await eventProjects.find({}).sort({ eventDate: 1 }).lean().exec();
  }

  const packageModel = await getPackageModel();
  let plainPackages: StudioPackage[] = [];
  if (packageModel) {
    try {
      const mongoPackages = await packageModel.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean().exec();
      if (mongoPackages && mongoPackages.length > 0) {
        plainPackages = mongoPackages.map(toPlainPackage);
      }
    } catch (err) {
      console.warn('Could not query packages from MongoDB:', err);
    }
  }

  if (plainPackages.length === 0) {
    plainPackages =
      memoryCache && memoryCache.packages && memoryCache.packages.length > 0
        ? memoryCache.packages
        : INITIAL_STUDIO_STATE.packages;
  }

  memoryCache = {
    ...memoryCache,
    packages: plainPackages,
    bookings: plainBookings,
    calendarEntries: plainSchedule,
    eventProjects: mongoProjects.map((project) =>
      toPlainEventProject(project as unknown as EventProject & { _id?: unknown })
    ),
  };
  return memoryCache;
}

export async function saveStudioState(nextState: StudioState): Promise<StudioState> {
  memoryCache = {
    ...nextState,
    bookings: nextState.bookings,
  };
  await writeToDisk({ ...nextState, bookings: [], calendarEntries: [] });
  return memoryCache;
}

export async function resetStudioState(): Promise<StudioState> {
  const bookings = await requireBookingModel();
  const schedule = await requireCalendarScheduleModel();
  const eventProjects = await requireEventProjectModel();
  await bookings.deleteMany({});
  await schedule.deleteMany({});
  await eventProjects.deleteMany({});

  const seed = cloneInitialState();
  seed.bookings = [];
  seed.calendarEntries = [];
  if (seed.eventProjects.length > 0) {
    await eventProjects.insertMany(seed.eventProjects);
  }
  return saveStudioState(seed);
}

export async function createBookingOnServer(input: {
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
  notes: string;
  status?: BookingStatus;
  source?: string;
  assignedCrew?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
}): Promise<BookingRequest> {
  const state = await getStudioState();
  // Studio supports concurrent crews and multiple bookings/orders on the same date.
  const isCustomPackage = input.packageId === CUSTOM_PACKAGE_ID;
  const selectedPkg = isCustomPackage
    ? undefined
    : state.packages.find((p) => p.id === input.packageId) || state.packages[0];
  const now = new Date();
  const refNumber = String(Math.floor(100 + Math.random() * 900));

  const resolvedPkgName =
    input.packageName?.trim() ||
    (isCustomPackage ? CUSTOM_PACKAGE_NAME : selectedPkg?.name || CUSTOM_PACKAGE_NAME);

  const resolvedQuotedAmount =
    typeof input.quotedAmount === 'number' && !isNaN(input.quotedAmount)
      ? input.quotedAmount
      : selectedPkg?.price || 0;

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
    eventTime: input.eventTime?.trim() || undefined,
    venue: input.venue.trim(),
    packageId: selectedPkg?.id || CUSTOM_PACKAGE_ID,
    packageName: resolvedPkgName,
    quotedAmount: resolvedQuotedAmount,
    requestedServices: input.requestedServices?.length
      ? input.requestedServices
      : undefined,
    notes: input.notes.trim(),
    status: input.status || 'Pending',
    source: input.source?.trim() || undefined,
    assignedCrew: input.assignedCrew?.trim() || undefined,
    termsAccepted: input.termsAccepted ?? false,
    termsAcceptedAt: input.termsAcceptedAt || undefined,
    termsVersion: input.termsVersion || undefined,
    packageSnapshot: {
      id: selectedPkg?.id || input.packageId || CUSTOM_PACKAGE_ID,
      name: resolvedPkgName,
      price: resolvedQuotedAmount,
      duration: selectedPkg?.duration,
      deliverables: selectedPkg?.deliverables,
      snapshotAt: now.toISOString(),
    },
    createdAt: now.toISOString(),
  };

  const bookings = await requireBookingModel();
  await bookings.updateOne(
    { id: newBooking.id },
    { $set: newBooking },
    { upsert: true }
  );

  memoryCache = {
    ...state,
    bookings: [newBooking, ...state.bookings],
  };

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

  const bookings = await requireBookingModel();
  await bookings.updateOne({ id: bookingId }, { $set: { status } });

  const nextState = {
    ...state,
    bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  };
  memoryCache = nextState;
  return nextState;
}

export async function processBookingOnServer(input: {
  bookingId: string;
  packageId: string;
  quotedAmount: number;
  assignedCrew?: string;
  acknowledgementNote: string;
  nextStatus: Extract<BookingStatus, 'In Discussion' | 'Acknowledged' | 'Confirmed'>;
  blockCalendarDate?: boolean;
}): Promise<StudioState> {
  const state = await getStudioState();
  const targetBooking = state.bookings.find((b) => b.id === input.bookingId);
  if (!targetBooking) {
    throw new Error('Booking request not found.');
  }

  const pkg = state.packages.find((p) => p.id === input.packageId);
  const resolvedPkgName =
    input.packageId === CUSTOM_PACKAGE_ID
      ? CUSTOM_PACKAGE_NAME
      : pkg
        ? pkg.name
        : targetBooking.packageName;
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
        phone: targetBooking.phone,
        time: targetBooking.eventTime,
        requestedServices: targetBooking.requestedServices,
      };
      const existingIdx = targetBooking.id
        ? updatedCalendar.findIndex(
            (c) => c.date === dateStr && c.bookingId === targetBooking.id
          )
        : -1;
      if (existingIdx >= 0) {
        updatedCalendar[existingIdx] = {
          ...updatedCalendar[existingIdx],
          ...entry,
          id: updatedCalendar[existingIdx].id,
        };
      } else {
        const matchingLegacyIdx = updatedCalendar.findIndex(
          (c) => c.date === dateStr && c.bookingId === targetBooking.id
        );
        if (matchingLegacyIdx >= 0) {
          updatedCalendar[matchingLegacyIdx] = entry;
        } else {
          updatedCalendar.push({ ...entry, id: `cal-${targetBooking.id}-${dateStr}` });
        }
      }
    });
  }

  if (input.nextStatus === 'Confirmed') {
    const alreadyExists = state.eventProjects.some((p) => p.bookingId === targetBooking.id);
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
        packageSnapshot: targetBooking.packageSnapshot || {
          id: pkg?.id || targetBooking.packageId || CUSTOM_PACKAGE_ID,
          name: resolvedPkgName,
          price: input.quotedAmount,
          duration: pkg?.duration,
          deliverables: pkg?.deliverables,
          snapshotAt: new Date().toISOString(),
        },
      };
      const eventProjects = await requireEventProjectModel();
      await eventProjects.updateOne(
        { bookingId: targetBooking.id },
        { $setOnInsert: newProject },
        { upsert: true }
      );
    }
  }

  if (input.blockCalendarDate) {
    const schedule = await requireCalendarScheduleModel();
    for (const entry of updatedCalendar) {
      if (!entry.id) continue;
      await schedule.updateOne(
        { id: entry.id },
        { $set: entry },
        { upsert: true }
      );
    }
  }

  const targetBookingId = targetBooking.id;
  const updatedBooking = updatedBookings.find((booking) => booking.id === targetBookingId);
  if (!updatedBooking) {
    throw new Error('Booking request not found.');
  }

  const bookings = await requireBookingModel();
  await bookings.updateOne(
    { id: targetBookingId },
    { $set: updatedBooking },
    { upsert: true }
  );

  return getStudioState();
}

export async function upsertCalendarEntryOnServer(
  entry: CalendarDayEntry
): Promise<StudioState> {
  const schedule = await requireCalendarScheduleModel();
  const entryId = entry.id || `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedEntry: CalendarDayEntry = { ...entry, id: entryId };

  await schedule.updateOne(
    { id: entryId },
    { $set: normalizedEntry },
    { upsert: true }
  );

  return getStudioState();
}

export async function removeCalendarEntryOnServer(
  date: string,
  entryId?: string
): Promise<StudioState> {
  const schedule = await requireCalendarScheduleModel();

  if (entryId) {
    await schedule.deleteOne({ id: entryId });
  } else {
    await schedule.deleteMany({ date });
  }

  return getStudioState();
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

  const eventProjects = await requireEventProjectModel();
  await eventProjects.updateOne(
    { id: created.id },
    { $set: created },
    { upsert: true }
  );
  const nextState = await getStudioState();

  return { state: nextState, created };
}

export async function updateEventStageOnServer(
  projectId: string,
  stage: EventStage,
  note?: string
): Promise<StudioState> {
  const state = await getStudioState();
  const project = state.eventProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('Event project not found.');
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const existing = project.stageUpdates[stage] || {};
  const updated: EventProject = {
    ...project,
    currentStage: stage,
    stageUpdates: {
      ...project.stageUpdates,
      [stage]: {
        completedAt: existing.completedAt || todayIso,
        note: note !== undefined ? note : existing.note,
      },
    },
  };
  const projects = await requireEventProjectModel();
  await projects.updateOne({ id: projectId }, { $set: updated });
  return getStudioState();
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
  const project = state.eventProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('Event project not found.');
  }

  const projects = await requireEventProjectModel();
  await projects.updateOne({ id: projectId }, { $set: { ...project, ...patch } });
  return getStudioState();
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
  const project = state.eventProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('Event project not found.');
  }

  const projects = await requireEventProjectModel();
  await projects.updateOne(
    { id: projectId },
    { $set: { payments: [...project.payments, newPayment] } }
  );
  return getStudioState();
}

export async function deleteEventPaymentOnServer(
  projectId: string,
  paymentId: string
): Promise<StudioState> {
  const state = await getStudioState();
  const project = state.eventProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('Event project not found.');
  }

  const projects = await requireEventProjectModel();
  await projects.updateOne(
    { id: projectId },
    { $set: { payments: project.payments.filter((payment) => payment.id !== paymentId) } }
  );
  return getStudioState();
}

export async function createPackageOnServer(
  input: Partial<StudioPackage>
): Promise<{ state: StudioState; created: StudioPackage }> {
  const state = await getStudioState();

  const name = input.name?.trim();
  if (!name) {
    throw new Error('Package name is required.');
  }

  const rawId =
    input.id?.trim() ||
    'pkg-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = rawId.startsWith('pkg-') ? rawId : `pkg-${rawId}`;

  if (state.packages.some((p) => p.id === id)) {
    throw new Error(`Package ID "${id}" already exists. Please choose a different ID or name.`);
  }

  const price = typeof input.price === 'number' ? input.price : Number(input.price) || 0;
  const maxSort = state.packages.reduce((max, p) => Math.max(max, p.sortOrder ?? 0), 0);

  const newPackage: StudioPackage = {
    id,
    name,
    audience: input.audience?.trim() || 'For weddings and celebrations',
    price,
    priceLabel: input.priceLabel?.trim() || formatINR(price),
    duration: input.duration?.trim() || 'Single Day',
    highlighted: Boolean(input.highlighted || input.featured),
    featured: Boolean(input.featured || input.highlighted),
    deliverables:
      Array.isArray(input.deliverables) && input.deliverables.length > 0
        ? input.deliverables.map(String).map((d) => d.trim()).filter(Boolean)
        : [
            '1 Lead Candid Photographer + 1 Traditional Photographer',
            'Full Event Edited Video + Raw Footage Drive',
            'Signature Layflat Photo Album',
          ],
    imageUrl: input.imageUrl?.trim() || input.image?.trim() || '',
    category: input.category?.trim() || 'Weddings',
    status: input.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: input.displayOnPortfolio !== false,
    sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : maxSort + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const packageModel = await getPackageModel();
  if (packageModel) {
    await packageModel.updateOne({ id }, { $set: newPackage }, { upsert: true });
  }

  const nextPackages = [...state.packages, newPackage].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  await writeToDisk({
    ...memoryCache,
    packages: nextPackages,
    bookings: [],
    calendarEntries: [],
  });

  return { state: memoryCache, created: newPackage };
}

export async function updatePackageOnServer(
  id: string,
  patch: Partial<StudioPackage>
): Promise<StudioState> {
  const state = await getStudioState();
  const existing = state.packages.find((p) => p.id === id);
  if (!existing) {
    throw new Error(`Package with ID "${id}" not found.`);
  }

  const price = patch.price !== undefined ? (Number(patch.price) || 0) : existing.price;

  const updatedPackage: StudioPackage = {
    ...existing,
    ...patch,
    id: existing.id,
    price,
    priceLabel:
      patch.priceLabel ||
      (patch.price !== undefined ? formatINR(price) : existing.priceLabel),
    highlighted:
      patch.highlighted !== undefined
        ? Boolean(patch.highlighted)
        : patch.featured !== undefined
        ? Boolean(patch.featured)
        : existing.highlighted,
    featured:
      patch.featured !== undefined
        ? Boolean(patch.featured)
        : patch.highlighted !== undefined
        ? Boolean(patch.highlighted)
        : existing.featured,
    deliverables: Array.isArray(patch.deliverables)
      ? patch.deliverables.map(String).map((d) => d.trim()).filter(Boolean)
      : existing.deliverables,
    status: patch.status ? (patch.status === 'inactive' ? 'inactive' : 'active') : existing.status,
    displayOnPortfolio:
      patch.displayOnPortfolio !== undefined
        ? patch.displayOnPortfolio
        : existing.displayOnPortfolio,
    sortOrder: patch.sortOrder !== undefined ? Number(patch.sortOrder) : existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };

  const packageModel = await getPackageModel();
  if (packageModel) {
    await packageModel.updateOne({ id }, { $set: updatedPackage }, { upsert: true });
  }

  const nextPackages = state.packages
    .map((p) => (p.id === id ? updatedPackage : p))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  await writeToDisk({
    ...memoryCache,
    packages: nextPackages,
    bookings: [],
    calendarEntries: [],
  });

  return memoryCache;
}

export async function deletePackageOnServer(id: string): Promise<StudioState> {
  const state = await getStudioState();
  const exists = state.packages.some((p) => p.id === id);
  if (!exists) {
    throw new Error(`Package with ID "${id}" not found.`);
  }

  const packageModel = await getPackageModel();
  if (packageModel) {
    await packageModel.deleteOne({ id });
  }

  const nextPackages = state.packages.filter((p) => p.id !== id);

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  await writeToDisk({
    ...memoryCache,
    packages: nextPackages,
    bookings: [],
    calendarEntries: [],
  });

  return memoryCache;
}

export async function reorderPackagesOnServer(orderedIds: string[]): Promise<StudioState> {
  const state = await getStudioState();
  const packageModel = await getPackageModel();

  const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]));

  if (packageModel) {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { id },
        update: { $set: { sortOrder: index + 1, updatedAt: new Date().toISOString() } },
      },
    }));
    if (bulkOps.length > 0) {
      await packageModel.bulkWrite(bulkOps);
    }
  }

  const nextPackages = [...state.packages]
    .map((pkg) => {
      const nextOrder = idToOrder.get(pkg.id);
      return nextOrder !== undefined ? { ...pkg, sortOrder: nextOrder } : pkg;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}
