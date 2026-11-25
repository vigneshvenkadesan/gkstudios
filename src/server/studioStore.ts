import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import {
  BookingProposalUpdate,
  BookingRequest,
  BookingServiceOption,
  BookingStatus,
  CalendarDayEntry,
  CUSTOM_PACKAGE_ID,
  CUSTOM_PACKAGE_NAME,
  EventCategory,
  EventProject,
  EventStage,
  PackageCustomizer,
  PackageDeliverables,
  PackageIncludedFeatures,
  PackageSnapshot,
  PaymentRecord,
  PortfolioItem,
  StudioBill,
  DurationTier,
  OptedServiceSnapshot,
  PackageIncludedService,
  StudioEvent,
  StudioEventCategory,
  StudioService,
  StudioPackage,
  StudioState,
} from '../types/studio';
import { DEFAULT_IMAGE_BY_ID, INITIAL_STUDIO_STATE } from '../data/initialStudioData';
import { STUDIO_TERMS_AND_CONDITIONS } from '../config/termsAndConditions';
import {
  getBillModel,
  getBookingModel,
  getCalendarScheduleModel,
  getEventProjectModel,
  getStudioEventModel,
  getPackageModel,
  getServiceModel,
} from './mongodb';
import { formatINR } from '../lib/utils';
import {
  DEFAULT_STUDIO_PACKAGES,
  DEFAULT_STUDIO_SERVICES,
  calculatePackageBasePrice,
  calculatePackageServiceCost,
  formatServiceLineItem,
  hasValidPackageServiceDurationTiers,
  sanitizePackageDeliverables,
} from '../lib/pricing';
import { englishOnlyName } from '../lib/englishOnlyName';

const PRIMARY_DB_PATH = path.join(process.cwd(), 'data', 'studio-db.json');
const DURATION_TIER_LABELS: Record<DurationTier, string> = {
  threeHours: 'Up to 3 Hours',
  halfDay: 'Half Day',
  fullDay: 'Full Day',
};
const STANDARD_DURATION_LABELS = new Set([
  'Up to 3 Hours',
  '3 Hours',
  'Three Hours (3h)',
  'Half Day',
  'Half Day (Up to 6 Hours)',
  'Half-Day',
  'Full Day',
  'Full Day (10h - 12h)',
  'Full-Day',
  'Single Day',
]);

function normalizeDurationLabel(
  duration: string | undefined,
  durationTier: DurationTier
): string {
  const trimmed = duration?.trim() || '';
  return !trimmed || STANDARD_DURATION_LABELS.has(trimmed)
    ? DURATION_TIER_LABELS[durationTier]
    : trimmed;
}

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
    throw new Error('Event data is unavailable.');
  }
  return projects;
}

async function requireStudioEventModel() {
  const events = await getStudioEventModel();
  if (!events) {
    throw new Error('Event storage is unavailable.');
  }
  return events;
}

async function requirePackageModel() {
  const packages = await getPackageModel();
  if (!packages) {
    throw new Error('Package storage is unavailable.');
  }
  return packages;
}

async function resolvePackageId(idOrObjectId: string): Promise<string | null> {
  const packageModel = await requirePackageModel();
  const filters: Array<Record<string, unknown>> = [{ id: idOrObjectId }];
  if (Types.ObjectId.isValid(idOrObjectId)) {
    filters.push({ _id: new Types.ObjectId(idOrObjectId) });
  }
  const pkg = await packageModel.findOne({ $or: filters }).select({ id: 1 }).lean().exec();
  return pkg?.id ? String(pkg.id) : null;
}

async function requireBillModel() {
  const bills = await getBillModel();
  if (!bills) {
    throw new Error('Bill storage is unavailable.');
  }
  return bills;
}

function normalizeState(raw: Partial<StudioState>): StudioState {
  const rawPortfolio =
    Array.isArray(raw.portfolio) && raw.portfolio.length > 0
      ? raw.portfolio.map((item) => ({
          ...item,
          imageUrl: DEFAULT_IMAGE_BY_ID[item.id] || item.imageUrl,
        }))
      : INITIAL_STUDIO_STATE.portfolio;
  const portfolio = Array.from(
    new Map(rawPortfolio.map((item) => [item.id, item])).values()
  );

  return {
    portfolio,
    events: [],
    packages: [],
    bookings: [],
    calendarEntries: [],
    eventProjects: [],
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
  let legacyEventProjects: EventProject[] | undefined;
  try {
    const existingContent = await fs.readFile(PRIMARY_DB_PATH, 'utf-8');
    const existingState = JSON.parse(existingContent) as Partial<StudioState>;
    if (Array.isArray(existingState.eventProjects)) {
      legacyEventProjects = existingState.eventProjects;
    }
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    ) {
      throw error;
    }
  }

  await fs.mkdir(path.dirname(PRIMARY_DB_PATH), { recursive: true });
  await fs.writeFile(
    PRIMARY_DB_PATH,
    JSON.stringify(
      {
        portfolio: nextState.portfolio,
        events: nextState.events,
        bookings: [],
        calendarEntries: [],
        ...(legacyEventProjects ? { eventProjects: legacyEventProjects } : {}),
      },
      null,
      2
    ),
    'utf-8'
  );
}

export function normalizePackageDeliverables(raw: unknown): PackageDeliverables {
  return sanitizePackageDeliverables(raw);
}

export function toPlainService(doc: unknown): StudioService {
  const s = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};

  return {
    id: String(s.slug || s.id || s._id || ''),
    name: englishOnlyName(String(s.name || '')),
    slug: String(s.slug || ''),
    tamilName: s.tamilName ? String(s.tamilName) : undefined,
    category: String(s.category || 'Photography'),
    description: String(s.description || ''),
    pricingType: s.pricingType === 'per_unit' ? 'per_unit' : 'tiered',
    unitLabel: String(s.unitLabel || 'unit'),
    unitPrice: typeof s.unitPrice === 'number' ? s.unitPrice : null,
    minQuantity: typeof s.minQuantity === 'number' ? s.minQuantity : 1,
    pricing: s.pricing && typeof s.pricing === 'object' ? (s.pricing as StudioService['pricing']) : null,
    isActive: s.isActive !== false,
    displayOrder: typeof s.displayOrder === 'number' ? s.displayOrder : 0,
    createdAt: s.createdAt ? String(s.createdAt) : undefined,
    updatedAt: s.updatedAt ? String(s.updatedAt) : undefined,
  };
}

export async function getServicesFromMongo(): Promise<StudioService[]> {
  try {
    const serviceModel = await getServiceModel();
    if (!serviceModel) {
      return DEFAULT_STUDIO_SERVICES;
    }
    let docs = await serviceModel.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean().exec();
    if (!docs || docs.length === 0) {
      // Seed default master services
      try {
        await serviceModel.insertMany(DEFAULT_STUDIO_SERVICES);
        const seeded = await serviceModel.find({}).sort({ displayOrder: 1 }).lean().exec();
        return seeded.map(toPlainService);
      } catch (seedErr) {
        console.warn('Could not seed services into Mongo:', seedErr);
        return DEFAULT_STUDIO_SERVICES;
      }
    }
    const newAlbumSlugs = new Set([
      'photo-album-8x12',
      'photo-album-10x30',
      'photo-album-16x24',
      'photo-album-12x36',
      'photo-album-18x24',
      'photo-album-18x24-combo-box',
    ]);
    const existingSlugs = new Set(docs.map((service) => String(service.slug || '')));
    const missingAlbumServices = DEFAULT_STUDIO_SERVICES.filter(
      (service) => newAlbumSlugs.has(service.slug) && !existingSlugs.has(service.slug)
    );
    if (missingAlbumServices.length > 0) {
      try {
        await serviceModel.insertMany(missingAlbumServices, { ordered: false });
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
      docs = await serviceModel.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean().exec();
    }
    return docs.map(toPlainService);
  } catch (err) {
    console.warn('Error fetching services from Mongo, using defaults:', err);
    return DEFAULT_STUDIO_SERVICES;
  }
}

function normalizeStudioEventCategory(
  value: unknown,
  eventId = ''
): StudioEventCategory {
  const category = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (
    category === 'wedding' ||
    category === 'baby-kids' ||
    category === 'outdoor' ||
    category === 'family-milestones'
  ) {
    return category;
  }
  if (/(baby|matern|newborn|birthday|kaathu|naming)/.test(`${category} ${eventId}`.toLowerCase())) {
    return 'baby-kids';
  }
  if (/(outdoor|pre-wedding|commercial|portrait)/.test(`${category} ${eventId}`.toLowerCase())) {
    return 'outdoor';
  }
  if (/(wedding|engagement|reception)/.test(`${category} ${eventId}`.toLowerCase())) {
    return 'wedding';
  }
  return 'family-milestones';
}

function toPlainEvent(doc: unknown): StudioEvent {
  const event = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};
  const id = String(event.id || event._id || '');
  return {
    id,
    name: String(event.name || id.replace(/[-_]+/g, ' ')),
    tamilName: String(event.tamilName || ''),
    category: normalizeStudioEventCategory(event.category, id),
    status: event.status === 'inactive' ? 'inactive' : 'active',
    sortOrder: Number.isInteger(event.sortOrder) ? Number(event.sortOrder) : 1,
  };
}

export function toPlainPackage(doc: unknown, services: StudioService[] = DEFAULT_STUDIO_SERVICES): StudioPackage {
  const p = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};
  const resolvedDurationTier: DurationTier =
    p.durationTier === 'threeHours' ||
    p.durationTier === 'halfDay' ||
    p.durationTier === 'fullDay'
      ? p.durationTier
      : typeof p.sortOrder === 'number' && p.sortOrder === 3
        ? 'fullDay'
        : 'halfDay';

  // Dynamically resolve package price from services collection
  const calculatedPrice = calculatePackageServiceCost(
    { ...(p as Partial<StudioPackage>), durationTier: resolvedDurationTier },
    services,
    resolvedDurationTier
  );
  const hasPriceOverride = typeof p.price === 'number' && Number.isFinite(p.price);
  const price = hasPriceOverride ? Number(p.price) : undefined;
  const displayPrice = price ?? calculatedPrice;

  const resolvedEventId = String(p.eventId || 'wedding');

  return {
    id: String(p.id || p._id || ''),
    eventId: resolvedEventId,
    category: resolvedEventId,
    tier:
      p.tier === 'essential' || p.tier === 'signature' || p.tier === 'premium'
        ? p.tier
        : undefined,
    name: String(p.name || ''),
    audience: String(p.audience || ''),
    price: displayPrice,
    priceIsOverride: hasPriceOverride,
    currency: String(p.currency || 'INR'),
    priceLabel: hasPriceOverride && typeof p.priceLabel === 'string' && p.priceLabel.trim()
      ? p.priceLabel
      : formatINR(displayPrice),
    duration: String(p.duration || ''),
    durationTier: resolvedDurationTier,
    includedServices: Array.isArray(p.includedServices) ? p.includedServices : undefined,
    highlighted: Boolean(p.highlighted),
    featured: Boolean(p.featured),
    deliverables: sanitizePackageDeliverables(p.deliverables),
    customizer:
      p.customizer && typeof p.customizer === 'object'
        ? (p.customizer as PackageCustomizer)
        : undefined,
    imageUrl: p.imageUrl ? String(p.imageUrl) : p.image ? String(p.image) : '',
    image: p.image ? String(p.image) : p.imageUrl ? String(p.imageUrl) : '',
    status: p.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: p.displayOnPortfolio !== false,
    sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : 0,
    eventSortOrder:
      typeof p.eventSortOrder === 'number' && Number.isInteger(p.eventSortOrder)
        ? p.eventSortOrder
        : undefined,
    createdAt: p.createdAt ? String(p.createdAt) : undefined,
    updatedAt: p.updatedAt ? String(p.updatedAt) : undefined,
  };
}

export async function getPackagesFromMongo(services?: StudioService[]): Promise<StudioPackage[]> {
  const packageModel = await getPackageModel();
  if (!packageModel) {
    throw new Error('Package data is unavailable.');
  }

  const effectiveServices = services || (await getServicesFromMongo());
  let mongoPackages = await packageModel
    .find({})
    .sort({ eventSortOrder: 1, sortOrder: 1, createdAt: 1 })
    .lean()
    .exec();

  if (!mongoPackages || mongoPackages.length === 0) {
    try {
      await packageModel.insertMany(
        DEFAULT_STUDIO_PACKAGES.map((pkg) => ({
          ...pkg,
          deliverables: sanitizePackageDeliverables(pkg.deliverables),
        }))
      );
      mongoPackages = await packageModel
        .find({})
        .sort({ eventSortOrder: 1, sortOrder: 1, createdAt: 1 })
        .lean()
        .exec();
    } catch (seedErr) {
      console.warn('Could not seed packages into Mongo:', seedErr);
      return DEFAULT_STUDIO_PACKAGES.map((pkg) => toPlainPackage(pkg, effectiveServices));
    }
  }

  const deliverableMigrationOps = mongoPackages.flatMap((pkg) => {
    const deliverables = sanitizePackageDeliverables(pkg.deliverables);
    const category = String(pkg.eventId || 'wedding');
    const needsDeliverablesUpdate =
      JSON.stringify(deliverables) !== JSON.stringify(pkg.deliverables || {});
    const needsCategoryUpdate = pkg.category !== category;
    const needsAddonRemoval =
      (pkg as unknown as Record<string, unknown>).availableAddons !== undefined;
    if (!needsDeliverablesUpdate && !needsCategoryUpdate && !needsAddonRemoval) return [];
    const set: Record<string, unknown> = {};
    if (needsDeliverablesUpdate) set.deliverables = deliverables;
    if (needsCategoryUpdate) set.category = category;
    return [{
      updateOne: {
        filter: { _id: pkg._id },
        update: {
          ...(Object.keys(set).length > 0 ? { $set: set } : {}),
          ...(needsAddonRemoval ? { $unset: { availableAddons: 1 } } : {}),
        },
      },
    }];
  });
  if (deliverableMigrationOps.length > 0) {
    await packageModel.bulkWrite(deliverableMigrationOps);
  }

  return mongoPackages.map((pkg) => toPlainPackage(pkg, effectiveServices));
}

export async function getEventsFromMongo(options: {
  includeInactive?: boolean;
  category?: string;
} = {}): Promise<StudioEvent[]> {
  const eventModel = await requireStudioEventModel();
  let docs = await eventModel.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();

  if (docs.length === 0) {
    const packages = await getPackagesFromMongo();
    const grouped = new Map<string, StudioPackage[]>();
    packages.forEach((pkg) => {
      const eventId = pkg.eventId || 'wedding';
      const group = grouped.get(eventId) || [];
      group.push(pkg);
      grouped.set(eventId, group);
    });
    const initialEvents = Array.from(grouped.entries()).map(([id, linkedPackages], index) => ({
      id,
      name: id
        .replace(/[-_]+/g, ' ')
        .replace(/\b[a-z]/g, (letter) => letter.toUpperCase()),
      tamilName: '',
      category: normalizeStudioEventCategory(linkedPackages[0]?.category, id),
      status: linkedPackages.some((pkg) => pkg.status !== 'inactive') ? 'active' as const : 'inactive' as const,
      sortOrder: Math.min(
        ...linkedPackages
          .map((pkg) => pkg.eventSortOrder)
          .filter((order): order is number => Number.isInteger(order) && order > 0),
        index + 1
      ),
    }));
    if (initialEvents.length > 0) {
      try {
        await eventModel.insertMany(initialEvents, { ordered: false });
        docs = await eventModel.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        docs = await eventModel.find({}).sort({ sortOrder: 1, name: 1 }).lean().exec();
      }
    }
  }

  return docs
    .map(toPlainEvent)
    .filter((event) => options.includeInactive || event.status === 'active')
    .filter((event) => !options.category || event.category === options.category)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getPackageFromMongo(
  idOrObjectId: string
): Promise<StudioPackage | null> {
  const packageModel = await requirePackageModel();
  const filters: Array<Record<string, unknown>> = [{ id: idOrObjectId }];
  if (Types.ObjectId.isValid(idOrObjectId)) {
    filters.push({ _id: new Types.ObjectId(idOrObjectId) });
  }
  const pkg = await packageModel.findOne({ $or: filters }).lean().exec();
  if (!pkg) return null;
  const services = await getServicesFromMongo();
  const deliverables = sanitizePackageDeliverables(pkg.deliverables);
  const category = String(pkg.eventId || 'wedding');
  const needsAddonRemoval =
    (pkg as unknown as Record<string, unknown>).availableAddons !== undefined;
  const update: Record<string, unknown> = {};
  if (JSON.stringify(deliverables) !== JSON.stringify(pkg.deliverables || {})) {
    update.$set = { deliverables, category };
  } else if (pkg.category !== category) {
    update.$set = { category };
  }
  if (needsAddonRemoval) update.$unset = { availableAddons: 1 };
  if (Object.keys(update).length > 0) {
    await packageModel.updateOne({ _id: pkg._id }, update);
  }
  return toPlainPackage({ ...pkg, deliverables, category }, services);
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
    ...(booking.durationTier ? { durationTier: booking.durationTier } : {}),
    ...(Array.isArray(booking.optedServices) && booking.optedServices.length
      ? { optedServices: booking.optedServices }
      : {}),
    ...(booking.totalAmount !== undefined ? { totalAmount: Number(booking.totalAmount) } : {}),
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
    ...(booking.proposalDraft
      ? { proposalDraft: booking.proposalDraft as BookingProposalUpdate }
      : {}),
    ...(booking.proposalUpdatedAt
      ? { proposalUpdatedAt: String(booking.proposalUpdatedAt) }
      : {}),
    ...(booking.proposalSubmittedAt
      ? { proposalSubmittedAt: String(booking.proposalSubmittedAt) }
      : {}),
    ...(booking.proposalRevision !== undefined
      ? { proposalRevision: Number(booking.proposalRevision) }
      : {}),
    createdAt:
      typeof booking.createdAt === 'string'
        ? booking.createdAt
        : new Date(String(booking.createdAt)).toISOString(),
  };
}

export async function createProposalTokenOnServer(bookingId: string): Promise<string> {
  const bookings = await requireBookingModel();
  const booking = await bookings.findOne({ id: bookingId }).lean().exec();
  if (!booking) throw new Error('Booking request not found.');
  if (booking.status === 'Confirmed' || booking.status === 'Declined') {
    throw new Error('This inquiry is no longer accepting proposal changes.');
  }
  if (typeof booking.proposalToken === 'string' && booking.proposalToken) {
    return booking.proposalToken;
  }

  const token = randomBytes(32).toString('hex');
  await bookings.updateOne(
    { id: bookingId, proposalToken: { $exists: false } },
    { $set: { proposalToken: token } }
  );
  const saved = await bookings.findOne({ id: bookingId }).lean().exec();
  if (typeof saved?.proposalToken !== 'string' || !saved.proposalToken) {
    throw new Error('Could not create a proposal link. Please try again.');
  }
  return saved.proposalToken;
}

export async function getBookingByProposalTokenOnServer(
  token: string
): Promise<BookingRequest> {
  const bookings = await requireBookingModel();
  const booking = await bookings.findOne({ proposalToken: token }).lean().exec();
  if (!booking) throw new Error('Proposal link not found.');
  return toPlainBooking(booking as unknown as BookingRequest);
}

export async function updateBookingProposalOnServer(
  token: string,
  input: BookingProposalUpdate,
  actor: 'admin' | 'client'
): Promise<BookingRequest> {
  const bookings = await requireBookingModel();
  const current = await bookings.findOne({ proposalToken: token }).lean().exec();
  if (!current) throw new Error('Proposal link not found.');
  if (current.status === 'Confirmed' || current.status === 'Declined') {
    throw new Error('This inquiry is no longer accepting proposal changes.');
  }

  const now = new Date().toISOString();
  const update =
    actor === 'client'
      ? {
          proposalDraft: input,
          status: 'In Discussion' as const,
          proposalSubmittedAt: now,
        }
      : {
          ...input,
        };
  const unset =
    actor === 'admin'
      ? {
          proposalDraft: 1,
          ...(input.endDate ? {} : { endDate: 1 }),
        }
      : undefined;
  await bookings.updateOne(
    {
      id: current.id,
      proposalToken: token,
      status: { $nin: ['Confirmed', 'Declined'] },
    },
    {
      $set: {
        ...update,
        proposalUpdatedAt: now,
        proposalRevision: Number(current.proposalRevision || 0) + 1,
      },
      ...(unset ? { $unset: unset } : {}),
    }
  );

  const saved = await bookings.findOne({ id: current.id }).lean().exec();
  if (!saved) throw new Error('Booking request not found.');
  const updatedBooking = toPlainBooking(saved as unknown as BookingRequest);
  const state = await getStudioState();
  memoryCache = {
    ...state,
    bookings: state.bookings.map((booking) =>
      booking.id === updatedBooking.id ? updatedBooking : booking
    ),
  };
  return updatedBooking;
}

function toPlainEventProject(project: EventProject & { _id?: unknown; packageSnapshot?: unknown }): EventProject {
  return {
    id: String(project.id),
    ...(project.bookingId ? { bookingId: String(project.bookingId) } : {}),
    ...(project.calendarEntryId ? { calendarEntryId: String(project.calendarEntryId) } : {}),
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
    ...(Array.isArray(project.requestedServices) ? { requestedServices: project.requestedServices } : {}),
    ...(project.durationTier ? { durationTier: project.durationTier } : {}),
    ...(Array.isArray(project.optedServices) && project.optedServices.length
      ? { optedServices: project.optedServices }
      : {}),
    ...(project.totalAmount !== undefined ? { totalAmount: Number(project.totalAmount) } : {}),
    ...(project.packageSnapshot ? { packageSnapshot: project.packageSnapshot as PackageSnapshot } : {}),
  };
}

function toPlainBill(b: any): StudioBill {
  return {
    id: String(b.id),
    billNumber: String(b.billNumber),
    bookingId: String(b.bookingId),
    paymentId: String(b.paymentId),
    clientName: String(b.clientName),
    clientPhone: String(b.clientPhone),
    eventDetails: b.eventDetails || {
      eventName: '',
      tamilEventName: '',
      eventDate: '',
      eventTime: '',
      venue: '',
      schedulePlan: '',
    },
    packageDetails: b.packageDetails
      ? {
          basePackageName: String(b.packageDetails.basePackageName || ''),
          tierLabel: b.packageDetails.tierLabel || 'Signature',
          durationTier: b.packageDetails.durationTier || b.durationTier || undefined,
          optedServices: Array.isArray(b.packageDetails.optedServices)
            ? b.packageDetails.optedServices
            : Array.isArray(b.optedServices)
            ? b.optedServices
            : undefined,
          includedServices: Array.isArray(b.packageDetails.includedServices)
            ? b.packageDetails.includedServices
                .filter(
                  (svc: any) =>
                    svc &&
                    svc.selected !== false &&
                    svc.included !== false &&
                    svc.active !== false &&
                    (typeof svc.quantity !== 'number' || svc.quantity > 0)
                )
                .map((svc: any) => ({
                  key: String(svc.key || ''),
                  en: String(svc.en || ''),
                  ta: String(svc.ta || ''),
                  selected: true,
                }))
            : [],
          deliverables: b.packageDetails.deliverables || {},
          requiredCrew: Array.isArray(b.packageDetails.requiredCrew)
            ? b.packageDetails.requiredCrew.map(String)
            : [],
          inclusions: Array.isArray(b.packageDetails.inclusions)
            ? b.packageDetails.inclusions.map(String)
            : [],
          addons: Array.isArray(b.packageDetails.addons)
            ? b.packageDetails.addons
                .filter(
                  (addon: any) =>
                    addon &&
                    addon.selected !== false &&
                    addon.active !== false &&
                    (typeof addon.quantity !== 'number' || addon.quantity > 0)
                )
                .map((addon: { label: string; priceDelta: number }) => ({
                  label: addon.label,
                  priceDelta: addon.priceDelta,
                }))
            : [],
          excludedItems: Array.isArray(b.packageDetails.excludedItems)
            ? b.packageDetails.excludedItems.map(
                (item: { label: string; priceDelta: number }) => ({
                  label: item.label,
                  priceDelta: item.priceDelta,
                })
              )
            : [],
        }
      : {
          basePackageName: '',
          tierLabel: 'Signature',
          includedServices: [],
          deliverables: {},
          requiredCrew: [],
          inclusions: [],
          addons: [],
          excludedItems: [],
        },
    financials: b.financials || {
      totalPackageAmount: 0,
      amountPaidNow: 0,
      totalPaidToDate: 0,
      balanceDue: 0,
      paymentMode: 'UPI',
      paymentDate: '',
      paymentStage: 'Payment',
    },
    paymentHistory: Array.isArray(b.paymentHistory)
      ? b.paymentHistory.map((payment: PaymentRecord) => ({
          id: String(payment.id || ''),
          date: String(payment.date || ''),
          label: String(payment.label || 'Payment'),
          amount: Number(payment.amount) || 0,
          method: payment.method || 'UPI / GPay',
          referenceNote: payment.referenceNote,
          billId: payment.billId,
          billNumber: payment.billNumber,
        }))
      : [],
    termsAndConditions: Array.isArray(b.termsAndConditions)
      ? b.termsAndConditions.map((term: { en?: unknown; ta?: unknown }) => ({
          en: String(term.en || ''),
          ta: String(term.ta || ''),
        }))
      : [],
    optedServices: Array.isArray(b.optedServices)
      ? b.optedServices
      : Array.isArray(b.packageDetails?.optedServices)
      ? b.packageDetails.optedServices
      : undefined,
    createdAt: String(b.createdAt),
  };
}

export async function getStudioState(): Promise<StudioState> {
  if (!memoryCache) {
    memoryCache = await readFromDisk();
  }

  const plainServices = await getServicesFromMongo();

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
      ...(plain.durationTier ? { durationTier: plain.durationTier } : {}),
      ...(Array.isArray(plain.optedServices) ? { optedServices: plain.optedServices } : {}),
      ...(plain.packageId ? { packageId: String(plain.packageId) } : {}),
      ...(plain.packageName ? { packageName: String(plain.packageName) } : {}),
      ...(plain.packageTier ? { packageTier: plain.packageTier } : {}),
      ...(plain.totalPackageAmount !== undefined ? { totalPackageAmount: Number(plain.totalPackageAmount) } : {}),
      ...(plain.totalAmount !== undefined ? { totalAmount: Number(plain.totalAmount) } : {}),
      ...(plain.paymentStatus ? { paymentStatus: String(plain.paymentStatus) } : {}),
    } satisfies CalendarDayEntry;
  });

  const eventProjects = await requireEventProjectModel();
  const mongoProjects = await eventProjects.find({}).sort({ eventDate: 1 }).lean().exec();

  let plainBills: StudioBill[] = [];
  try {
    const billModel = await requireBillModel();
    const mongoBills = await billModel.find({}).sort({ createdAt: -1 }).lean().exec();
    plainBills = mongoBills.map(toPlainBill);
  } catch (err) {
    console.warn('Failed to load bills from Mongo:', err);
  }

  const plainPackages = await getPackagesFromMongo(plainServices);
  const plainEvents = await getEventsFromMongo({ includeInactive: true });

  memoryCache = {
    ...memoryCache,
    events: plainEvents,
    services: plainServices,
    packages: plainPackages,
    bookings: plainBookings,
    calendarEntries: plainSchedule,
    bills: plainBills,
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
}): Promise<BookingRequest> {
  const state = await getStudioState();
  // Studio supports concurrent crews and multiple bookings/orders on the same date.
  const isCustomPackage = input.packageId === CUSTOM_PACKAGE_ID;
  const selectedPkg = isCustomPackage
    ? undefined
    : state.packages.find((p) => p.id === input.packageId);
  if (!isCustomPackage && !selectedPkg) {
    throw new Error('Selected package is unavailable. Please choose another package.');
  }
  const now = new Date();
  const refNumber = String(Math.floor(100 + Math.random() * 900));

  const resolvedPkgName =
    input.packageName?.trim() ||
    (isCustomPackage ? CUSTOM_PACKAGE_NAME : selectedPkg?.name || CUSTOM_PACKAGE_NAME);

  const resolvedQuotedAmount =
    typeof input.quotedAmount === 'number' && !isNaN(input.quotedAmount)
      ? input.quotedAmount
      : selectedPkg
        ? calculatePackageBasePrice(selectedPkg, state.services || DEFAULT_STUDIO_SERVICES)
        : 0;

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
    durationTier: input.durationTier,
    optedServices: input.optedServices?.length ? input.optedServices : undefined,
    totalAmount: input.totalAmount ?? resolvedQuotedAmount,
    notes: input.notes.trim(),
    status: input.status || 'Pending',
    source: input.source?.trim() || undefined,
    assignedCrew: input.assignedCrew?.trim() || undefined,
    termsAccepted: input.termsAccepted ?? false,
    termsAcceptedAt: input.termsAcceptedAt || undefined,
    termsVersion: input.termsVersion || undefined,
    packageSnapshot: input.packageSnapshot || {
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
  const bookings = await requireBookingModel();
  const current = await bookings.findOne({ id: bookingId }).lean().exec();
  if (!current) {
    throw new Error('Booking request not found.');
  }
  if (status === 'Confirmed' && current.proposalDraft) {
    throw new Error('Review and save the client proposal before confirming this inquiry.');
  }
  await bookings.updateOne({ id: bookingId }, { $set: { status } });

  const updatedBooking = {
    ...toPlainBooking(current as unknown as BookingRequest),
    status,
  };
  const nextState = {
    ...state,
    bookings: state.bookings.some((booking) => booking.id === bookingId)
      ? state.bookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      : [updatedBooking, ...state.bookings],
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
  eventTime?: string;
}): Promise<StudioState> {
  const cachedState = await getStudioState();
  const bookingsModel = await requireBookingModel();
  const persistedBooking = await bookingsModel.findOne({ id: input.bookingId }).lean().exec();
  if (!persistedBooking) {
    throw new Error('Booking request not found.');
  }
  const targetBooking = toPlainBooking(persistedBooking as unknown as BookingRequest);
  if (input.nextStatus === 'Confirmed' && targetBooking.proposalDraft) {
    throw new Error('Review and save the client proposal before confirming this inquiry.');
  }
  const state: StudioState = {
    ...cachedState,
    bookings: cachedState.bookings.some((booking) => booking.id === targetBooking.id)
      ? cachedState.bookings.map((booking) =>
          booking.id === targetBooking.id ? targetBooking : booking
        )
      : [targetBooking, ...cachedState.bookings],
  };

  const pkg = state.packages.find((p) => p.id === input.packageId);
  const resolvedPkgName =
    input.packageId === CUSTOM_PACKAGE_ID
      ? CUSTOM_PACKAGE_NAME
      : pkg
        ? pkg.name
        : targetBooking.packageName;
  const resolvedCrew =
    input.assignedCrew?.trim() || targetBooking.assignedCrew || 'G Krishna & Studio Unit';
  const resolvedEventTime =
    input.eventTime !== undefined ? input.eventTime.trim() : targetBooking.eventTime;

  const updatedBookings = state.bookings.map((b) =>
    b.id === input.bookingId
      ? {
          ...b,
          packageId: pkg ? pkg.id : b.packageId,
          packageName: resolvedPkgName,
          quotedAmount: input.quotedAmount,
          totalAmount: input.quotedAmount,
          assignedCrew: resolvedCrew,
          acknowledgementNote: input.acknowledgementNote.trim(),
          status: input.nextStatus,
          eventTime: resolvedEventTime || undefined,
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
        time: resolvedEventTime || targetBooking.eventTime,
        requestedServices: targetBooking.requestedServices,
        durationTier: targetBooking.durationTier,
        optedServices: targetBooking.optedServices,
        packageId: pkg ? pkg.id : targetBooking.packageId,
        packageName: resolvedPkgName,
        packageTier: pkg
          ? (pkg.sortOrder === 3 ? 'Premium' : pkg.sortOrder === 1 ? 'Essential' : 'Signature')
          : undefined,
        totalPackageAmount: input.quotedAmount,
        totalAmount: input.quotedAmount,
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
        requestedServices: targetBooking.requestedServices || [],
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

  // Auto-Sync to EventProject (Manage Payments / Event Times & Payments)
  // Whenever an entry has client information or booked status (not a pure studio maintenance block)
  const clientName = (entry.clientName || entry.title || '').trim();
  const isMaintenance =
    entry.eventType === 'Studio Maintenance' ||
    entry.title.toLowerCase().includes('maintenance');
  const isBooked = entry.status === 'Booked';

  if (isBooked && clientName && !isMaintenance) {
    try {
      const eventProjects = await requireEventProjectModel();
      // Look for an existing project linked to this calendar entry, or bookingId, or (phone + date)
      const orConditions: any[] = [{ calendarEntryId: entryId }];
      if (entry.bookingId) {
        orConditions.push({ bookingId: entry.bookingId });
      }
      if (entry.phone && entry.date) {
        orConditions.push({ phone: entry.phone, eventDate: entry.date });
      }

      const existingProject = await eventProjects.findOne({ $or: orConditions });
      const todayIso = new Date().toISOString().slice(0, 10);
      const agreedAmount =
        entry.totalPackageAmount && entry.totalPackageAmount > 0
          ? entry.totalPackageAmount
          : 0;

      const projectPayload: Partial<EventProject> = {
        calendarEntryId: entryId,
        ...(entry.bookingId ? { bookingId: entry.bookingId } : {}),
        clientName: entry.clientName ? entry.clientName.trim() : entry.title.trim(),
        phone: entry.phone ? entry.phone.trim() : '',
        eventType: (entry.eventType &&
        entry.eventType !== 'Studio Maintenance' &&
        entry.eventType !== 'Muhurtham Rush'
          ? entry.eventType
          : 'Weddings') as any,
        eventDate: entry.date,
        venue: entry.venue?.trim() || 'To be confirmed',
        packageName:
          entry.packageName ||
          `${entry.packageTier || 'Signature'} Package`,
        assignedCrew: entry.assignedCrew || 'G Krishna + Studio Unit',
        deliveryNotes: entry.notes?.trim() || 'No delivery notes provided.',
      };

      if (agreedAmount > 0) {
        projectPayload.agreedAmount = agreedAmount;
      }

      if (existingProject) {
        await eventProjects.updateOne(
          { id: existingProject.id },
          {
            $set: {
              ...projectPayload,
              ...(agreedAmount > 0 ? { agreedAmount } : {}),
            },
          }
        );
      } else {
        const refNumber = String(Math.floor(100 + Math.random() * 900));
        const newProjectId = `ev-${Date.now()}`;
        const newProject: EventProject = {
          id: newProjectId,
          calendarEntryId: entryId,
          ...(entry.bookingId ? { bookingId: entry.bookingId } : {}),
          referenceCode: `GK-${entry.date.replace(/-/g, '').slice(2, 6)}-${refNumber}`,
          clientName: projectPayload.clientName!,
          phone: projectPayload.phone || '',
          eventType: projectPayload.eventType || 'Weddings',
          eventDate: entry.date,
          venue: projectPayload.venue || 'To be confirmed',
          packageName: projectPayload.packageName || 'Signature Package',
          assignedCrew: projectPayload.assignedCrew || 'G Krishna + Studio Unit',
          currentStage: 'Booking Confirmed',
          stageUpdates: {
            'Booking Confirmed': {
              completedAt: todayIso,
              note: 'Auto-synced from Admin Calendar.',
            },
          },
          agreedAmount: agreedAmount,
          extraCharges: 0,
          discount: 0,
          payments: [],
          deliveryNotes: projectPayload.deliveryNotes || 'No delivery notes provided.',
        };
        await eventProjects.create(newProject);
      }
    } catch (syncErr) {
      console.error('Failed to sync booked calendar entry to EventProject:', syncErr);
      throw new Error(
        'The schedule entry was saved, but its payment project could not be created. Please edit and save the booking again.'
      );
    }
  }

  return getStudioState();
}

export async function removeCalendarEntryOnServer(
  date: string,
  entryId?: string
): Promise<StudioState> {
  const schedule = await requireCalendarScheduleModel();
  const selectedEntries = await schedule
    .find(entryId ? { id: entryId } : { date })
    .lean()
    .exec();
  const selectedEntryIds = [
    ...new Set([
      ...selectedEntries.map((entry) => String(entry.id || '')),
      ...(entryId ? [entryId] : []),
    ].filter(Boolean)),
  ];
  const linkedBookingIds = new Set(
    selectedEntries
      .map((entry) => String(entry.bookingId || ''))
      .filter(Boolean)
  );

  const projectFilters: Array<Record<string, unknown>> = [];
  if (selectedEntryIds.length > 0) {
    projectFilters.push({ calendarEntryId: { $in: selectedEntryIds } });
  }
  if (linkedBookingIds.size > 0) {
    projectFilters.push({ bookingId: { $in: [...linkedBookingIds] } });
  }

  const eventProjects = await requireEventProjectModel();
  const linkedProjects =
    projectFilters.length > 0
      ? await eventProjects.find({ $or: projectFilters }).lean().exec()
      : [];
  const plainLinkedProjects = linkedProjects as unknown as EventProject[];
  const linkedProjectIds = new Set(plainLinkedProjects.map((project) => project.id));
  for (const project of plainLinkedProjects) {
    if (project.bookingId) linkedBookingIds.add(project.bookingId);
  }

  if (plainLinkedProjects.length > 0 || linkedBookingIds.size > 0) {
    await deleteBillsForEventProjects(plainLinkedProjects, [...linkedBookingIds]);
  }
  if (plainLinkedProjects.length > 0) {
    await eventProjects.deleteMany({ id: { $in: [...linkedProjectIds] } });
  }

  if (linkedBookingIds.size > 0) {
    const bookings = await requireBookingModel();
    await bookings.deleteMany({ id: { $in: [...linkedBookingIds] } });
  }

  const scheduleFilters: Array<Record<string, unknown>> = [];
  if (selectedEntryIds.length > 0) {
    scheduleFilters.push({ id: { $in: selectedEntryIds } });
  }
  if (linkedBookingIds.size > 0) {
    scheduleFilters.push({ bookingId: { $in: [...linkedBookingIds] } });
  }
  if (!entryId && selectedEntries.length === 0) {
    scheduleFilters.push({ date });
  }
  if (scheduleFilters.length > 0) {
    await schedule.deleteMany({ $or: scheduleFilters });
  }

  return getStudioState();
}

async function deleteBillsForEventProjects(
  projects: EventProject[],
  additionalOrderIds: string[] = []
): Promise<void> {
  const bills = await requireBillModel();
  const relatedOrderIds = [
    ...new Set([
      ...additionalOrderIds,
      ...projects.flatMap((project) => [project.id, project.bookingId || '']),
    ].filter(Boolean)),
  ];
  const payments = projects.flatMap((project) => project.payments || []);
  const paymentIds = [...new Set(payments.map((payment) => payment.id).filter(Boolean))];
  const billIds = [...new Set(payments.map((payment) => payment.billId).filter(Boolean))];
  const billNumbers = [...new Set(payments.map((payment) => payment.billNumber).filter(Boolean))];
  const filters: Array<Record<string, unknown>> = [];

  if (relatedOrderIds.length > 0) {
    filters.push({ bookingId: { $in: relatedOrderIds } });
  }
  if (paymentIds.length > 0) {
    filters.push({ paymentId: { $in: paymentIds } });
  }
  if (billIds.length > 0) {
    filters.push({ id: { $in: billIds } });
  }
  if (billNumbers.length > 0) {
    filters.push({ billNumber: { $in: billNumbers } });
  }

  if (filters.length > 0) {
    await bills.deleteMany({ $or: filters });
  }
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
  const project = state.eventProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('Event project not found.');
  }

  const billModel = await requireBillModel();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `GKS-${currentYear}-`;
  const existingCount = await billModel.countDocuments({
    billNumber: new RegExp(`^${yearPrefix}`),
  });

  let seq = existingCount + 1;
  let candidateBillNumber = `${yearPrefix}${String(seq).padStart(4, '0')}`;
  while (await billModel.findOne({ billNumber: candidateBillNumber })) {
    seq += 1;
    candidateBillNumber = `${yearPrefix}${String(seq).padStart(4, '0')}`;
  }
  const billNumber = candidateBillNumber;
  const paymentId = `pay-${Date.now()}`;
  const billId = `bill-${Date.now()}`;

  // Find matching booking
  const matchingBooking = state.bookings.find(
    (b) => b.id === project.bookingId || b.referenceCode === project.referenceCode
  );

  const eventName = project.eventType || matchingBooking?.eventType || 'Celebration';
  let tamilEventName = '';
  if (!tamilEventName) {
    const lower = eventName.toLowerCase();
    if (lower.includes('wedding')) tamilEventName = 'திருமணம்';
    else if (lower.includes('engagement')) tamilEventName = 'நிச்சயதார்த்தம்';
    else if (lower.includes('birthday') || lower.includes('kid')) tamilEventName = 'பிறந்தநாள் விழா';
    else if (lower.includes('baby') || lower.includes('maternity') || lower.includes('seemantham')) tamilEventName = 'வளைகாப்பு & சீமந்தம்';
    else if (lower.includes('housewarming')) tamilEventName = 'புதுமனை புகுவிழா';
    else if (lower.includes('puberty')) tamilEventName = 'மஞ்சள் நீராட்டு விழா';
    else tamilEventName = 'நிகழ்வு';
  }

  const eventDate = project.eventDate || matchingBooking?.preferredDate || '';
  const eventTime =
    matchingBooking?.eventTime || '06:00 AM (Morning Muhurtham)';
  const venue = project.venue || matchingBooking?.venue || '';
  const schedulePlan =
    matchingBooking?.notes?.includes('Plan:')
      ? matchingBooking.notes.split('Plan:')[1].split('•')[0].trim()
      : project.deliveryNotes || 'Standard Celebration Coverage';

  const basePackageName =
    project.packageName || matchingBooking?.packageName || 'Custom Studio Package';

  // Derive required crew
  let requiredCrew: string[] = [];
  if (project.assignedCrew && project.assignedCrew.trim()) {
    requiredCrew = project.assignedCrew
      .split(/[,/•+]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (requiredCrew.length === 0) {
    const pkgLower = basePackageName.toLowerCase();
    if (
      pkgLower.includes('signature') ||
      pkgLower.includes('royal') ||
      pkgLower.includes('premium')
    ) {
      requiredCrew = [
        'Lead Traditional Photographer',
        'Candid Photographer',
        'Traditional Cinematographer',
      ];
    } else {
      requiredCrew = ['Traditional Photographer', 'Traditional Videographer'];
    }
  }

  // Find matching calendar entry
  const matchingCalendarEntry = state.calendarEntries?.find(
    (c) =>
      c.id === project.calendarEntryId ||
      (c.bookingId && c.bookingId === project.bookingId) ||
      (c.phone && project.phone && c.phone === project.phone && c.date === project.eventDate)
  );

  // Find matching package
  const matchedPkg =
    state.packages?.find(
      (p) =>
        p.id === project.packageSnapshot?.id ||
        p.id === matchingBooking?.packageId ||
        p.id === matchingCalendarEntry?.packageId ||
        p.name.toLowerCase() === basePackageName.toLowerCase()
    ) ||
    state.packages?.find((p) =>
      basePackageName.toLowerCase().includes(p.name.toLowerCase())
    );

  // Determine tierLabel
  let tierLabel: 'Essential' | 'Signature' | 'Premium' = 'Signature';
  if (matchingCalendarEntry?.packageTier) {
    tierLabel = matchingCalendarEntry.packageTier;
  } else if (matchedPkg?.tier) {
    tierLabel =
      matchedPkg.tier === 'premium'
        ? 'Premium'
        : matchedPkg.tier === 'essential'
        ? 'Essential'
        : 'Signature';
  } else if (matchedPkg?.sortOrder === 3 || /premium|royal/i.test(basePackageName)) {
    tierLabel = 'Premium';
  } else if (matchedPkg?.sortOrder === 1 || /essential|silver|classic/i.test(basePackageName)) {
    tierLabel = 'Essential';
  }

  // Base included features
  const baseInclusions: PackageIncludedFeatures = matchedPkg?.customizer?.included
    ? { ...matchedPkg.customizer.included }
    : tierLabel === 'Premium'
    ? {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: true,
        drone: true,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: true,
      }
    : tierLabel === 'Essential'
    ? {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: false,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: true,
      }
    : {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: true,
      };

  const activeServices: PackageIncludedFeatures = { ...baseInclusions };

  // Resolve requested services from project, booking, or calendar
  const requestedServices: BookingServiceOption[] = [
    ...(project.requestedServices || []),
    ...(matchingBooking?.requestedServices || []),
    ...(matchingCalendarEntry?.requestedServices || []),
  ];

  // If explicit requested services exist (e.g. client selected 3 out of 5 services),
  // strictly filter the core coverage services to ONLY what was selected:
  if (requestedServices.length > 0) {
    activeServices.traditionalPhoto = requestedServices.includes('Traditional Camera');
    activeServices.traditionalVideo = requestedServices.includes('Traditional Video');
    activeServices.candidPhoto = requestedServices.includes('Candid Camera');
    activeServices.candidVideo = requestedServices.includes('Candid Video');
    activeServices.drone = requestedServices.includes('Drone');
    activeServices.ledWall = requestedServices.includes('LED Wall') || requestedServices.includes('TV');
  }

  // Handle customizer exclusions from booking snapshot or project snapshot
  const snapshotExclusions = [
    ...(matchingBooking?.packageSnapshot?.customizerState?.exclusions || []),
    ...(project.packageSnapshot?.customizerState?.exclusions || []),
  ];
  snapshotExclusions.forEach((ex) => {
    const text = ex.toLowerCase();
    if (/drone/i.test(text)) activeServices.drone = false;
    if (/candid\s*video|cinematic\s*(film|video)|highlight\s*film/i.test(text)) activeServices.candidVideo = false;
    if (/candid\s*(photo|camera)|portrait/i.test(text)) activeServices.candidPhoto = false;
    if (/traditional\s*video/i.test(text)) activeServices.traditionalVideo = false;
    if (/traditional\s*(photo|camera)/i.test(text)) activeServices.traditionalPhoto = false;
    if (/album|photobook/i.test(text)) activeServices.printedAlbum = false;
    if (/outdoor\s*(couple|session|shoot)/i.test(text)) activeServices.outdoorShoot = false;
    if (/led|live\s*screen|display/i.test(text)) activeServices.ledWall = false;
  });

  // Handle customizer additions from snapshot
  const snapshotAdditions = [
    ...(matchingBooking?.packageSnapshot?.customizerState?.additions || []),
    ...(project.packageSnapshot?.customizerState?.additions || []),
  ];
  snapshotAdditions.forEach((add) => {
    const text = add.toLowerCase();
    if (/drone/i.test(text)) activeServices.drone = true;
    if (/candid\s*video|cinematic\s*(film|video)|highlight\s*film/i.test(text)) activeServices.candidVideo = true;
    if (/candid\s*(photo|camera)/i.test(text)) activeServices.candidPhoto = true;
    if (/traditional\s*video/i.test(text)) activeServices.traditionalVideo = true;
    if (/traditional\s*(photo|camera)/i.test(text)) activeServices.traditionalPhoto = true;
    if (/album|photobook/i.test(text)) activeServices.printedAlbum = true;
    if (/outdoor\s*(couple|session|shoot)/i.test(text)) activeServices.outdoorShoot = true;
    if (/led|live\s*screen|display/i.test(text)) activeServices.ledWall = true;
  });

  // Check text notes for customizer toggles
  const notesText = [
    matchingBooking?.notes || '',
    project.deliveryNotes || '',
    matchingCalendarEntry?.notes || '',
  ].join(' ');

  if (/without\s*drone|no\s*drone/i.test(notesText)) activeServices.drone = false;
  else if (/drone/i.test(notesText) && requestedServices.length === 0) activeServices.drone = true;

  if (/without\s*candid\s*video|no\s*candid\s*video/i.test(notesText)) activeServices.candidVideo = false;
  else if (
    /candid\s*video|cinematic\s*(film|video)|highlight\s*film/i.test(notesText) &&
    requestedServices.length === 0
  ) {
    activeServices.candidVideo = true;
  }

  if (/without\s*album|no\s*album|remove\s*album/i.test(notesText)) {
    activeServices.printedAlbum = false;
  }

  // Derive addons & exclusions
  const addons: Array<{ label: string; priceDelta: number }> = [];
  const excludedItems: Array<{ label: string; priceDelta: number }> = [];

  if (activeServices.drone && !baseInclusions.drone) {
    addons.push({ label: 'Drone Aerial Cinematography', priceDelta: 8000 });
  }
  if (activeServices.candidVideo && !baseInclusions.candidVideo) {
    addons.push({ label: 'Cinematic Highlight Video', priceDelta: 12000 });
  }
  if (activeServices.ledWall && !baseInclusions.ledWall) {
    addons.push({ label: 'Live LED Screen Display', priceDelta: 10000 });
  }
  if (activeServices.outdoorShoot && !baseInclusions.outdoorShoot) {
    addons.push({ label: 'Outdoor Couple Portrait Session', priceDelta: 7000 });
  }
  if (!activeServices.printedAlbum && baseInclusions.printedAlbum) {
    excludedItems.push({ label: 'Printed Heirloom Album Removed', priceDelta: -5000 });
  }

  // Standard service metadata mapping (Bilingual EN + TA)
  const SERVICE_METADATA_MAP: Record<string, { en: string; ta: string }> = {
    traditionalPhoto: {
      en: 'Traditional Photography',
      ta: 'பாரம்பரியப் புகைப்படம்',
    },
    traditionalVideo: {
      en: 'Traditional Video (Full HD)',
      ta: 'பாரம்பரிய வீடியோ',
    },
    candidPhoto: {
      en: 'Candid Photography (Portraits & Moments)',
      ta: 'கேன்டிட் புகைப்படம்',
    },
    candidVideo: {
      en: 'Cinematic Highlight Video',
      ta: 'சினிமாடிக் ஹைலைட் வீடியோ',
    },
    drone: {
      en: 'Drone Aerial Cinematography',
      ta: 'ட்ரோன் வான்வழிப் படப்பிடிப்பு',
    },
    ledWall: {
      en: 'Live LED Screen Display',
      ta: 'நேரடி எல்.ஈ.டி திரை',
    },
    outdoorShoot: {
      en: 'Outdoor Couple Portrait Session',
      ta: 'அவுட்டோர் ஜோடி படப்பிடிப்பு',
    },
    printedAlbum: {
      en: 'Heirloom Photobook / Album',
      ta: 'பாரம்பரிய புகைப்பட ஆல்பம்',
    },
  };

  const includedServices: Array<{ key: string; en: string; ta: string; selected: boolean }> = [];
  for (const [key, meta] of Object.entries(SERVICE_METADATA_MAP)) {
    if (activeServices[key as keyof PackageIncludedFeatures]) {
      includedServices.push({
        key,
        en: meta.en,
        ta: meta.ta,
        selected: true,
      });
    }
  }

  const deliverables: Record<string, string> = {
    ...(matchedPkg?.deliverables || {}),
  };
  if (!deliverables['Event Coverage & Crew']) {
    deliverables['Event Coverage & Crew'] = requiredCrew.join(' + ');
  }
  if (!deliverables['Albums & Photo Frames']) {
    deliverables['Albums & Photo Frames'] = activeServices.printedAlbum
      ? 'Heirloom Flush-Mount Album (40 Pages / 250+ Photos)'
      : 'Digital Handover Only';
  }
  if (!deliverables['Digital Deliverables']) {
    deliverables['Digital Deliverables'] = 'Online Cloud Gallery + High-Speed USB';
  }

  const inclusions = includedServices.map((s) => `${s.en} (${s.ta})`);

  const totalPackageAmount = Math.max(
    0,
    (project.agreedAmount || 0) + (project.extraCharges || 0) - (project.discount || 0)
  );
  const amountPaidNow = Number(payment.amount) || 0;
  const previousPaid = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidToDate = previousPaid + amountPaidNow;
  const balanceDue = Math.max(0, totalPackageAmount - totalPaidToDate);
  const paymentDate = payment.date || new Date().toISOString().split('T')[0];
  const newPayment: PaymentRecord = {
    ...payment,
    date: paymentDate,
    id: paymentId,
    billId,
    billNumber,
  };
  const paymentHistory = [...project.payments, newPayment].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const newBill: StudioBill = {
    id: billId,
    billNumber,
    bookingId: project.bookingId || project.id,
    paymentId,
    clientName: project.clientName,
    clientPhone: project.phone,
    eventDetails: {
      eventName,
      tamilEventName,
      eventDate,
      eventTime,
      venue,
      schedulePlan,
    },
    packageDetails: {
      basePackageName,
      tierLabel,
      durationTier: project.durationTier || matchingBooking?.durationTier || matchingCalendarEntry?.durationTier,
      optedServices: project.optedServices || matchingBooking?.optedServices || matchingCalendarEntry?.optedServices,
      includedServices,
      deliverables,
      requiredCrew,
      inclusions,
      addons,
      excludedItems,
    },
    financials: {
      totalPackageAmount,
      amountPaidNow,
      totalPaidToDate,
      balanceDue,
      paymentMode: payment.method || 'UPI',
      paymentDate,
      paymentStage: payment.label || 'Payment',
    },
    paymentHistory,
    termsAndConditions: STUDIO_TERMS_AND_CONDITIONS.map((t) => ({
      en: t.en,
      ta: t.ta,
    })),
    optedServices: project.optedServices || matchingBooking?.optedServices || matchingCalendarEntry?.optedServices,
    createdAt: new Date().toISOString(),
  };

  await billModel.create(newBill);

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

  const targetPayment = project.payments.find((p) => p.id === paymentId);
  if (targetPayment?.billId) {
    try {
      const billModel = await requireBillModel();
      await billModel.deleteOne({ id: targetPayment.billId });
    } catch (e) {
      console.warn('Failed to delete associated bill:', e);
    }
  }

  const projects = await requireEventProjectModel();
  await projects.updateOne(
    { id: projectId },
    { $set: { payments: project.payments.filter((payment) => payment.id !== paymentId) } }
  );
  return getStudioState();
}

export async function getBillsOnServer(queryId?: string): Promise<StudioBill[]> {
  const billModel = await requireBillModel();
  const filter = queryId
    ? {
        $or: [
          { bookingId: queryId },
          { paymentId: queryId },
          { billNumber: queryId },
          { id: queryId },
        ],
      }
    : {};
  const bills = await billModel.find(filter).sort({ createdAt: -1 }).lean().exec();
  return bills.map(toPlainBill);
}

export async function getBillByIdOnServer(idOrNumber: string): Promise<StudioBill | null> {
  const billModel = await requireBillModel();
  const bill = await billModel
    .findOne({
      $or: [{ id: idOrNumber }, { billNumber: idOrNumber }, { paymentId: idOrNumber }],
    })
    .lean()
    .exec();
  if (!bill) return null;
  return toPlainBill(bill);
}

export async function deleteEventProjectOnServer(projectId: string): Promise<StudioState> {
  const projects = await requireEventProjectModel();
  const project = await projects.findOne({ id: projectId }).lean().exec();
  if (!project) {
    throw new Error('Event project not found.');
  }
  await deleteBillsForEventProjects([project as unknown as EventProject]);
  const result = await projects.deleteOne({ id: projectId });
  if (result.deletedCount === 0) {
    throw new Error('Event project not found.');
  }
  return getStudioState();
}

function validateEventSlug(id: string): string {
  const slug = id.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Event ID must be a lowercase slug using letters, numbers, and hyphens.');
  }
  return slug;
}

function validatePackageSlug(id: string): string {
  const slug = id.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Package ID must be a lowercase slug using letters, numbers, and hyphens.');
  }
  return slug;
}

function validateStudioEventCategory(value: unknown): StudioEventCategory {
  if (
    value === 'wedding' ||
    value === 'baby-kids' ||
    value === 'outdoor' ||
    value === 'family-milestones'
  ) {
    return value;
  }
  throw new Error('Event category must be wedding, baby-kids, outdoor, or family-milestones.');
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);
}

function updateCachedEvents(events: StudioEvent[]): void {
  if (memoryCache) {
    memoryCache = {
      ...memoryCache,
      events: [...events].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    };
  }
}

export async function createEventOnServer(
  input: Partial<StudioEvent>
): Promise<{ state: StudioState; created: StudioEvent }> {
  const name = input.name?.trim();
  if (!name) throw new Error('Event name is required.');
  const id = validateEventSlug(
    input.id?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );
  const sortOrder = Number(input.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 10) {
    throw new Error('Event sort order must be a whole number from 1 to 10.');
  }
  if (input.status !== undefined && input.status !== 'active' && input.status !== 'inactive') {
    throw new Error('Event status must be active or inactive.');
  }
  const category = validateStudioEventCategory(input.category);
  const created: StudioEvent = {
    id,
    name,
    tamilName: input.tamilName?.trim() || '',
    category,
    status: input.status === 'inactive' ? 'inactive' : 'active',
    sortOrder,
  };
  const eventModel = await requireStudioEventModel();
  try {
    await eventModel.create(created);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(`Event ID "${id}" already exists.`);
    }
    throw error;
  }
  const state = await getStudioState();
  const events = [...state.events.filter((event) => event.id !== id), created];
  updateCachedEvents(events);
  return { state: { ...state, events }, created };
}

export async function updateEventOnServer(
  id: string,
  patch: Partial<StudioEvent>
): Promise<StudioState> {
  const state = await getStudioState();
  const existing = state.events.find((event) => event.id === id);
  if (!existing) throw new Error(`Event with ID "${id}" not found.`);

  const nextId = patch.id !== undefined ? validateEventSlug(patch.id) : existing.id;
  const name = patch.name !== undefined ? patch.name.trim() : existing.name;
  if (!name) throw new Error('Event name is required.');
  const sortOrder = patch.sortOrder !== undefined ? Number(patch.sortOrder) : existing.sortOrder;
  if (!Number.isInteger(sortOrder) || sortOrder < 1 || sortOrder > 10) {
    throw new Error('Event sort order must be a whole number from 1 to 10.');
  }
  const category =
    patch.category !== undefined
      ? validateStudioEventCategory(patch.category)
      : existing.category;
  if (patch.status !== undefined && patch.status !== 'active' && patch.status !== 'inactive') {
    throw new Error('Event status must be active or inactive.');
  }
  const updated: StudioEvent = {
    ...existing,
    ...patch,
    id: nextId,
    name,
    tamilName: patch.tamilName !== undefined ? patch.tamilName.trim() : existing.tamilName,
    category,
    status: patch.status === undefined ? existing.status : patch.status,
    sortOrder,
  };
  const eventModel = await requireStudioEventModel();
  const packageModel = await requirePackageModel();
  const updateAt = new Date().toISOString();
  try {
    const result = await eventModel.updateOne({ id }, { $set: updated });
    if (result.matchedCount === 0) throw new Error(`Event with ID "${id}" not found.`);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(`Event ID "${nextId}" already exists.`);
    }
    throw error;
  }

  const packagePatch: Record<string, unknown> = {
    category: nextId,
    eventSortOrder: sortOrder,
    updatedAt: updateAt,
  };
  if (nextId !== id) packagePatch.eventId = nextId;
  if (patch.status !== undefined) packagePatch.status = updated.status;
  await packageModel.updateMany({ eventId: id }, { $set: packagePatch });

  const events = state.events
    .map((event) => (event.id === id ? updated : event))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const packages = state.packages
    .map((pkg) =>
      pkg.eventId === id
        ? {
            ...pkg,
            eventId: nextId,
            category: nextId,
            eventSortOrder: sortOrder,
            ...(patch.status !== undefined ? { status: updated.status } : {}),
            updatedAt: updateAt,
          }
        : pkg
    )
    .sort(
      (a, b) =>
        (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
  memoryCache = { ...state, events, packages };
  return memoryCache;
}

export async function deleteEventOnServer(id: string): Promise<StudioState> {
  const state = await getStudioState();
  if (!state.events.some((event) => event.id === id)) {
    throw new Error(`Event with ID "${id}" not found.`);
  }
  const packageModel = await requirePackageModel();
  if (await packageModel.exists({ eventId: id })) {
    throw new Error(`Event "${id}" still has linked packages and cannot be deleted.`);
  }
  const eventModel = await requireStudioEventModel();
  const result = await eventModel.deleteOne({ id });
  if (result.deletedCount === 0) throw new Error(`Event with ID "${id}" not found.`);
  const events = state.events.filter((event) => event.id !== id);
  memoryCache = { ...state, events };
  return memoryCache;
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
  const id = validatePackageSlug(rawId.startsWith('pkg-') ? rawId : `pkg-${rawId}`);

  if (state.packages.some((p) => p.id === id)) {
    throw new Error(`Package ID "${id}" already exists.`);
  }

  const eventId = input.eventId?.trim();
  if (!eventId) throw new Error('An event must be selected for this package.');
  const linkedEvent = state.events.find((event) => event.id === eventId);
  if (!linkedEvent) throw new Error(`Event "${eventId}" does not exist.`);

  const services = state.services || (await getServicesFromMongo());
  const maxSort = state.packages
    .filter((pkg) => pkg.eventId === eventId)
    .reduce((max, pkg) => Math.max(max, pkg.sortOrder ?? 0), 0);
  const durationTier: DurationTier =
    input.durationTier === 'threeHours' ||
    input.durationTier === 'halfDay' ||
    input.durationTier === 'fullDay'
      ? input.durationTier
      : 'halfDay';
  const includedServices = Array.isArray(input.includedServices) ? input.includedServices : undefined;
  if (!hasValidPackageServiceDurationTiers(includedServices)) {
    throw new Error('Service durationTier must be threeHours, halfDay, or fullDay.');
  }
  if (
    input.price !== undefined &&
    input.price !== null &&
    (!Number.isFinite(input.price) || input.price < 0)
  ) {
    throw new Error('Price must be a non-negative number or empty.');
  }

  const calculatedPrice = calculatePackageServiceCost(
    {
      includedServices,
      durationTier,
    },
    services,
    durationTier
  );
  const hasPriceOverride = typeof input.price === 'number' && Number.isFinite(input.price);
  const price = hasPriceOverride ? Number(input.price) : calculatedPrice;

  const newPackage: StudioPackage = {
    id,
    eventId,
    category: eventId,
    tier: input.tier,
    name,
    audience: input.audience?.trim() || 'For weddings and celebrations',
    price,
    priceIsOverride: hasPriceOverride,
    currency: input.currency?.trim() || 'INR',
    priceLabel: hasPriceOverride && input.priceLabel?.trim()
      ? input.priceLabel.trim()
      : formatINR(price),
    duration: normalizeDurationLabel(input.duration, durationTier),
    durationTier,
    includedServices,
    highlighted: Boolean(input.highlighted || input.featured),
    featured: Boolean(input.featured || input.highlighted),
    deliverables: sanitizePackageDeliverables(input.deliverables),
    customizer: input.customizer,
    imageUrl: input.imageUrl?.trim() || input.image?.trim() || '',
    status: input.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: input.displayOnPortfolio !== false,
    sortOrder: Number.isInteger(input.sortOrder) && Number(input.sortOrder) > 0
      ? Number(input.sortOrder)
      : maxSort + 1,
    eventSortOrder: linkedEvent.sortOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const packageModel = await requirePackageModel();
  const persistedPackage = { ...newPackage };
  if (!hasPriceOverride) delete persistedPackage.price;
  delete persistedPackage.priceIsOverride;
  try {
    await packageModel.create(persistedPackage);
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new Error(`Package ID "${id}" already exists.`);
    throw error;
  }

  const nextPackages = [...state.packages, newPackage].sort(
    (a, b) =>
      (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) - (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return { state: memoryCache, created: newPackage };
}

export async function updatePackageOnServer(
  idOrObjectId: string,
  patch: Partial<StudioPackage>
): Promise<StudioState> {
  const state = await getStudioState();
  const id = await resolvePackageId(idOrObjectId);
  const existing = id ? state.packages.find((p) => p.id === id) : undefined;
  if (!existing) {
    throw new Error(`Package with ID "${idOrObjectId}" not found.`);
  }

  const services = state.services || (await getServicesFromMongo());
  if (
    patch.price !== undefined &&
    patch.price !== null &&
    (!Number.isFinite(patch.price) || patch.price < 0)
  ) {
    throw new Error('Price must be a non-negative number or empty.');
  }
  const nextId = patch.id !== undefined ? validatePackageSlug(patch.id) : existing.id;
  if (state.packages.some((pkg) => pkg.id === nextId && pkg.id !== existing.id)) {
    throw new Error(`Package ID "${nextId}" already exists.`);
  }
  if (
    patch.durationTier !== undefined &&
    patch.durationTier !== 'threeHours' &&
    patch.durationTier !== 'halfDay' &&
    patch.durationTier !== 'fullDay'
  ) {
    throw new Error('durationTier must be one of: threeHours, halfDay, fullDay.');
  }
  const durationTier: DurationTier =
    patch.durationTier !== undefined
      ? patch.durationTier
      : existing.durationTier === 'threeHours' ||
          existing.durationTier === 'halfDay' ||
          existing.durationTier === 'fullDay'
        ? existing.durationTier
        : 'halfDay';
  const includedServices = patch.includedServices !== undefined ? patch.includedServices : existing.includedServices;
  if (!hasValidPackageServiceDurationTiers(includedServices)) {
    throw new Error('Service durationTier must be threeHours, halfDay, or fullDay.');
  }

  const eventId = patch.eventId !== undefined ? patch.eventId.trim() : existing.eventId || '';
  const linkedEvent = state.events.find((event) => event.id === eventId);
  if (!linkedEvent) throw new Error(`Event "${eventId}" does not exist.`);
  const calculatedPrice = calculatePackageServiceCost(
    { ...existing, ...patch, includedServices, durationTier, price: undefined },
    services,
    durationTier
  );
  const packageModel = await requirePackageModel();
  const storedPackage = await packageModel.findOne({ id }).select({ price: 1 }).lean().exec();
  const hasStoredPrice = typeof storedPackage?.price === 'number' && Number.isFinite(storedPackage.price);
  const hasPriceOverride = patch.price === null
    ? false
    : typeof patch.price === 'number' && Number.isFinite(patch.price)
      ? true
      : hasStoredPrice;
  const price = hasPriceOverride
    ? typeof patch.price === 'number' ? patch.price : Number(storedPackage?.price)
    : calculatedPrice;
  const nextDuration = normalizeDurationLabel(
    patch.duration !== undefined ? patch.duration : existing.duration,
    durationTier
  );

  const updatedPackage: StudioPackage = {
    ...existing,
    ...patch,
    id: nextId,
    eventId,
    category: eventId,
    eventSortOrder: linkedEvent.sortOrder,
    price,
    priceIsOverride: hasPriceOverride,
    currency: patch.currency || existing.currency || 'INR',
    priceLabel: hasPriceOverride
      ? patch.priceLabel !== undefined
        ? patch.priceLabel.trim() || formatINR(price)
        : existing.priceLabel || formatINR(price)
      : formatINR(price),
    duration: nextDuration,
    durationTier,
    includedServices,
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
    deliverables:
      patch.deliverables !== undefined
        ? sanitizePackageDeliverables(patch.deliverables)
        : sanitizePackageDeliverables(existing.deliverables),
    customizer: patch.customizer !== undefined ? patch.customizer : existing.customizer,
    status: patch.status ? (patch.status === 'inactive' ? 'inactive' : 'active') : existing.status,
    displayOnPortfolio:
      patch.displayOnPortfolio !== undefined
        ? patch.displayOnPortfolio
        : existing.displayOnPortfolio,
    sortOrder: patch.sortOrder !== undefined ? Number(patch.sortOrder) : existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };

  const persistedPackage = { ...updatedPackage };
  if (hasPriceOverride) persistedPackage.price = price;
  else delete persistedPackage.price;
  delete persistedPackage.priceIsOverride;
  let updateResult;
  try {
    updateResult = await packageModel.updateOne(
      { id },
      {
        $set: persistedPackage,
        ...(hasPriceOverride ? {} : { $unset: { price: 1 } }),
      }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(`Package ID "${nextId}" already exists.`);
    }
    throw error;
  }
  if (updateResult.matchedCount === 0) {
    throw new Error(`Package with ID "${idOrObjectId}" not found.`);
  }

  const nextPackages = state.packages
    .map((pkg) =>
      pkg.id === id
        ? updatedPackage
        : pkg
    )
    .sort(
      (a, b) =>
        (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) - (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function deletePackageOnServer(id: string): Promise<StudioState> {
  const state = await getStudioState();
  const resolvedId = await resolvePackageId(id);
  if (!resolvedId || !state.packages.some((p) => p.id === resolvedId)) {
    throw new Error(`Package with ID "${id}" not found.`);
  }

  const packageModel = await requirePackageModel();
  const deleteResult = await packageModel.deleteOne({ id: resolvedId });
  if (deleteResult.deletedCount === 0) {
    throw new Error(`Package with ID "${id}" not found.`);
  }

  const nextPackages = state.packages.filter((p) => p.id !== resolvedId);

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function reorderPackagesOnServer(
  eventId: string,
  orderedIds: string[]
): Promise<StudioState> {
  const state = await getStudioState();
  const packageModel = await requirePackageModel();
  const eventPackages = state.packages.filter((pkg) => pkg.eventId === eventId);
  const validIds = new Set(eventPackages.map((pkg) => pkg.id));
  if (!eventId || orderedIds.some((id) => !validIds.has(id))) {
    throw new Error('All reordered packages must belong to the selected event.');
  }

  const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]));

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { id, eventId },
      update: { $set: { sortOrder: index + 1, updatedAt: new Date().toISOString() } },
    },
  }));
  if (bulkOps.length > 0) {
    await packageModel.bulkWrite(bulkOps);
  }

  const nextPackages = [...state.packages]
    .map((pkg) => {
      const nextOrder = idToOrder.get(pkg.id);
      return nextOrder !== undefined ? { ...pkg, sortOrder: nextOrder } : pkg;
    })
    .sort(
      (a, b) =>
        (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) - (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function saveServiceOnServer(service: Partial<StudioService>): Promise<StudioService> {
  const serviceModel = await getServiceModel();
  if (!serviceModel) throw new Error('Service storage unavailable.');

  const name = service.name?.trim();
  if (!name) throw new Error('Service name is required.');

  // Auto-generate slug from name if not provided
  const rawSlug = service.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = rawSlug;
  if (!slug) throw new Error('Service slug is required.');

  const services = await getServicesFromMongo();
  const maxSort = services.reduce((max, s) => Math.max(max, s.displayOrder ?? 0), 0);

  const newDoc = {
    ...service,
    name,
    slug,
    category: service.category || 'Photography',
    pricingType: service.pricingType === 'per_unit' ? 'per_unit' : 'tiered',
    unitLabel: service.unitLabel || (service.pricingType === 'per_unit' ? 'unit' : 'camera'),
    unitPrice: typeof service.unitPrice === 'number' ? service.unitPrice : null,
    minQuantity: typeof service.minQuantity === 'number' ? service.minQuantity : 1,
    pricing: service.pricing || null,
    isActive: service.isActive !== false,
    displayOrder: typeof service.displayOrder === 'number' ? service.displayOrder : maxSort + 1,
    updatedAt: new Date().toISOString(),
  };

  const updated = await serviceModel
    .findOneAndUpdate(
      { slug },
      { $set: newDoc, $setOnInsert: { createdAt: new Date().toISOString() } },
      { new: true, upsert: true }
    )
    .lean()
    .exec();

  const plain = toPlainService(updated);

  // Invalidate / refresh memoryCache and package prices
  const updatedServices = await getServicesFromMongo();
  if (memoryCache) {
    memoryCache = {
      ...memoryCache,
      services: updatedServices,
      packages: memoryCache.packages.map((pkg) => toPlainPackage(pkg, updatedServices)),
    };
  }

  return plain;
}

export async function updateServiceOnServer(
  slugOrId: string,
  patch: Partial<StudioService>
): Promise<StudioService> {
  const serviceModel = await getServiceModel();
  if (!serviceModel) throw new Error('Service storage unavailable.');

  // Look up existing service by slug or id
  const existing = await serviceModel
    .findOne({
      $or: [{ slug: slugOrId }, { id: slugOrId }],
    })
    .lean()
    .exec();

  if (!existing) {
    throw new Error(`Service "${slugOrId}" not found.`);
  }

  // Preserve slug so existing package mappings never break
  const { slug, ...safePatch } = patch;

  const updateDoc: Record<string, unknown> = {
    ...safePatch,
    updatedAt: new Date().toISOString(),
  };

  if (patch.name?.trim()) {
    updateDoc.name = patch.name.trim();
  }

  const updated = await serviceModel
    .findOneAndUpdate(
      { slug: existing.slug },
      { $set: updateDoc },
      { new: true }
    )
    .lean()
    .exec();

  const plain = toPlainService(updated);

  // Invalidate / refresh memoryCache and recalculate package prices
  const updatedServices = await getServicesFromMongo();
  if (memoryCache) {
    memoryCache = {
      ...memoryCache,
      services: updatedServices,
      packages: memoryCache.packages.map((pkg) => toPlainPackage(pkg, updatedServices)),
    };
  }

  return plain;
}

export async function deleteServiceOnServer(
  slugOrId: string
): Promise<{ success: boolean; slug: string }> {
  const serviceModel = await getServiceModel();
  if (!serviceModel) throw new Error('Service storage unavailable.');

  const existing = await serviceModel
    .findOne({
      $or: [{ slug: slugOrId }, { id: slugOrId }],
    })
    .lean()
    .exec();

  if (!existing) {
    throw new Error(`Service "${slugOrId}" not found.`);
  }

  await serviceModel.deleteOne({ slug: existing.slug }).exec();

  // Invalidate / refresh memoryCache and recalculate package prices
  const updatedServices = await getServicesFromMongo();
  if (memoryCache) {
    memoryCache = {
      ...memoryCache,
      services: updatedServices,
      packages: memoryCache.packages.map((pkg) => toPlainPackage(pkg, updatedServices)),
    };
  }

  return { success: true, slug: existing.slug };
}
