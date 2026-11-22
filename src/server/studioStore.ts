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
  PackageCustomizer,
  PackageDeliverables,
  PackageIncludedFeatures,
  PackageSnapshot,
  PaymentRecord,
  PortfolioItem,
  StudioBill,
  DurationTier,
  OptedServiceSnapshot,
  PackageAvailableAddon,
  PackageIncludedService,
  StudioService,
  StudioEvent,
  StudioPackage,
  StudioState,
} from '../types/studio';
import { DEFAULT_IMAGE_BY_ID, INITIAL_STUDIO_STATE } from '../data/initialStudioData';
import { STUDIO_TERMS_AND_CONDITIONS } from '../config/termsAndConditions';
import {
  getBillModel,
  getBookingModel,
  getCalendarScheduleModel,
  getEventModel,
  getEventProjectModel,
  getPackageModel,
  getServiceModel,
} from './mongodb';
import { formatINR } from '../lib/utils';
import {
  DEFAULT_STUDIO_PACKAGES,
  DEFAULT_STUDIO_SERVICES,
  calculatePackageBasePrice,
  formatServiceLineItem,
} from '../lib/pricing';

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
    throw new Error('Event data is unavailable.');
  }
  return projects;
}

async function requirePackageModel() {
  const packages = await getPackageModel();
  if (!packages) {
    throw new Error('Package storage is unavailable.');
  }
  return packages;
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

export const DEFAULT_EVENTS: StudioEvent[] = [
  // Wedding Category
  {
    id: 'wedding',
    name: 'Wedding & Muhurtham',
    tamilName: 'திருமணம் & முகூர்த்தம்',
    category: 'wedding',
    status: 'active',
    sortOrder: 1,
  },
  {
    id: 'engagement',
    name: 'Engagement (Nitchayathartham)',
    tamilName: 'நிச்சயதார்த்தம்',
    category: 'wedding',
    status: 'active',
    sortOrder: 2,
  },
  {
    id: 'reception',
    name: 'Wedding Reception',
    tamilName: 'திருமண வரவேற்பு',
    category: 'wedding',
    status: 'active',
    sortOrder: 3,
  },
  {
    id: 'pre-wedding',
    name: 'Pre & Post Wedding Shoot',
    tamilName: 'பிரீ & போஸ்ட் வெடிங் ஷூட்',
    category: 'wedding',
    status: 'active',
    sortOrder: 4,
  },

  // Baby & Maternity Category
  {
    id: 'valai-kaapu',
    name: 'Valai Kaapu / Seemantham',
    tamilName: 'வளைகாப்பு / சீமந்தம்',
    category: 'baby-maternity',
    status: 'active',
    sortOrder: 5,
  },
  {
    id: 'maternity',
    name: 'Maternity Portraits',
    tamilName: 'தாய்மைப் புகைப்படங்கள்',
    category: 'baby-maternity',
    status: 'active',
    sortOrder: 6,
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower & Welcoming',
    tamilName: 'பேபி ஷவர் & தொட்டில் வரவேற்பு',
    category: 'baby-maternity',
    status: 'active',
    sortOrder: 7,
  },
  {
    id: 'newborn',
    name: 'Newborn & Infant Portraits',
    tamilName: 'பச்சிளம் குழந்தை புகைப்படம்',
    category: 'baby-maternity',
    status: 'active',
    sortOrder: 8,
  },

  // Birthday & Kids Category
  {
    id: 'birthday',
    name: 'Birthday & Milestone Party',
    tamilName: 'பிறந்தநாள் விழா',
    category: 'birthday-kids',
    status: 'active',
    sortOrder: 9,
  },
  {
    id: 'first-birthday',
    name: 'First Year Celebration / Ayush Homam',
    tamilName: 'முதல் பிறந்தநாள் / ஆயுஷ் ஹோமம்',
    category: 'birthday-kids',
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'naming-ceremony',
    name: 'Naming Ceremony (Thottil)',
    tamilName: 'பெயர் சூட்டு விழா (தொட்டில்)',
    category: 'birthday-kids',
    status: 'active',
    sortOrder: 11,
  },
  {
    id: 'kaathu-kuthi',
    name: 'Ear Piercing (Kaathu Kuthi)',
    tamilName: 'காது குத்து விழா',
    category: 'birthday-kids',
    status: 'active',
    sortOrder: 12,
  },

  // Family & Traditional Category
  {
    id: 'puberty-ceremony',
    name: 'Puberty Ceremony (Manjal Neerattu)',
    tamilName: 'மஞ்சள் நீராட்டு விழா',
    category: 'family-traditional',
    status: 'active',
    sortOrder: 13,
  },
  {
    id: 'housewarming',
    name: 'Housewarming (Griha Pravesam)',
    tamilName: 'கிரகப்பிரவேசம் (புதுமனை புகுவிழா)',
    category: 'family-traditional',
    status: 'active',
    sortOrder: 14,
  },
  {
    id: 'upanayanam',
    name: 'Upanayanam / Sacred Thread',
    tamilName: 'உபநயனம் / பூணூல் விழா',
    category: 'family-traditional',
    status: 'active',
    sortOrder: 15,
  },
  {
    id: 'sashtiapthapoorthi',
    name: 'Sashtiapthapoorthi (60th / 80th)',
    tamilName: 'சஷ்டியப்தபூர்த்தி (மணிவிழா / சதாபிஷேகம்)',
    category: 'family-traditional',
    status: 'active',
    sortOrder: 16,
  },

  // Corporate & Business Category
  {
    id: 'corporate-event',
    name: 'Corporate & Business Summit',
    tamilName: 'வணிக & நிறுவன மாநாடு',
    category: 'corporate-business',
    status: 'active',
    sortOrder: 17,
  },
  {
    id: 'commercial-shoot',
    name: 'Product & Brand Commercial Shoot',
    tamilName: 'தயாரிப்பு & விளம்பரப் படம்',
    category: 'corporate-business',
    status: 'active',
    sortOrder: 18,
  },
];

export function toPlainEvent(doc: unknown): StudioEvent {
  const e = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};

  return {
    id: String(e.id || e._id || ''),
    name: String(e.name || ''),
    tamilName: e.tamilName ? String(e.tamilName) : undefined,
    category: String(e.category || 'wedding'),
    status: e.status === 'inactive' ? 'inactive' : 'active',
    sortOrder: typeof e.sortOrder === 'number' ? e.sortOrder : 0,
    createdAt: e.createdAt ? String(e.createdAt) : undefined,
    updatedAt: e.updatedAt ? String(e.updatedAt) : undefined,
  };
}

export async function getEventsFromMongo(): Promise<StudioEvent[]> {
  try {
    const eventModel = await getEventModel();
    if (!eventModel) {
      return DEFAULT_EVENTS;
    }

    let mongoEvents = await eventModel
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();

    // Auto-seed if collection is empty
    if (!mongoEvents || mongoEvents.length === 0) {
      try {
        await eventModel.insertMany(DEFAULT_EVENTS);
        mongoEvents = await eventModel
          .find({})
          .sort({ sortOrder: 1, createdAt: 1 })
          .lean()
          .exec();
      } catch (seedErr) {
        console.warn('Auto-seed events failed, using fallback:', seedErr);
        return DEFAULT_EVENTS;
      }
    }

    return mongoEvents.map(toPlainEvent);
  } catch (error) {
    console.warn('Failed to load events from Mongo, using default list:', error);
    return DEFAULT_EVENTS;
  }
}

export function normalizePackageDeliverables(raw: unknown): PackageDeliverables {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const result: PackageDeliverables = {};
    const items = raw.map(String).map((s) => s.trim()).filter(Boolean);
    items.forEach((item) => {
      const lower = item.toLowerCase();
      if (
        lower.includes('photographer') ||
        lower.includes('videographer') ||
        lower.includes('drone') ||
        lower.includes('crew') ||
        lower.includes('gimbal') ||
        lower.includes('operator') ||
        lower.includes('camera') ||
        lower.includes('coverage')
      ) {
        result['Event Coverage & Crew'] = result['Event Coverage & Crew']
          ? `${result['Event Coverage & Crew']} + ${item}`
          : item;
      } else if (
        lower.includes('album') ||
        lower.includes('book') ||
        lower.includes('frame') ||
        lower.includes('print') ||
        lower.includes('box') ||
        lower.includes('karizma')
      ) {
        result['Albums & Photo Frames'] = result['Albums & Photo Frames']
          ? `${result['Albums & Photo Frames']} + ${item}`
          : item;
      } else if (
        lower.includes('digital') ||
        lower.includes('raw') ||
        lower.includes('teaser') ||
        lower.includes('video') ||
        lower.includes('film') ||
        lower.includes('cloud') ||
        lower.includes('drive') ||
        lower.includes('footage') ||
        lower.includes('reel') ||
        lower.includes('stills') ||
        lower.includes('photos')
      ) {
        result['Digital Deliverables'] = result['Digital Deliverables']
          ? `${result['Digital Deliverables']} + ${item}`
          : item;
      } else {
        result['Event Coverage & Crew'] = result['Event Coverage & Crew']
          ? `${result['Event Coverage & Crew']} + ${item}`
          : item;
      }
    });
    return result;
  }

  if (typeof raw === 'object') {
    const result: PackageDeliverables = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val === 'string' && val.trim()) {
        result[key] = val.trim();
      }
    }
    return result;
  }

  return {};
}

export function toPlainService(doc: unknown): StudioService {
  const s = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};

  return {
    id: String(s.slug || s.id || s._id || ''),
    name: String(s.name || ''),
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
    const docs = await serviceModel.find({}).sort({ displayOrder: 1, createdAt: 1 }).lean().exec();
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
    return docs.map(toPlainService);
  } catch (err) {
    console.warn('Error fetching services from Mongo, using defaults:', err);
    return DEFAULT_STUDIO_SERVICES;
  }
}

export function toPlainPackage(doc: unknown, services: StudioService[] = DEFAULT_STUDIO_SERVICES): StudioPackage {
  const p = (doc && typeof (doc as { toObject?: () => unknown }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown> || {};

  // Dynamically resolve package price from services collection
  const dynamicPrice = calculatePackageBasePrice(p as Partial<StudioPackage>, services);

  // Legacy migration / backward compatibility:
  // If eventId is missing, resolve gracefully from category or default to 'wedding'
  let resolvedEventId = p.eventId ? String(p.eventId) : undefined;
  if (!resolvedEventId && p.category) {
    const cat = String(p.category).toLowerCase();
    if (cat.includes('wedding')) resolvedEventId = 'wedding';
    else if (cat.includes('reception')) resolvedEventId = 'reception';
    else if (cat.includes('engagement')) resolvedEventId = 'engagement';
    else if (cat.includes('baby') || cat.includes('maternity') || cat.includes('seemantham')) resolvedEventId = 'valai-kaapu';
    else if (cat.includes('birthday') || cat.includes('milestone')) resolvedEventId = 'birthday';
    else if (cat.includes('corporate')) resolvedEventId = 'corporate-event';
    else resolvedEventId = 'wedding';
  } else if (!resolvedEventId) {
    resolvedEventId = 'wedding';
  }

  return {
    id: String(p.id || p._id || ''),
    eventId: resolvedEventId,
    tier:
      p.tier === 'essential' || p.tier === 'signature' || p.tier === 'premium'
        ? p.tier
        : undefined,
    name: String(p.name || ''),
    audience: String(p.audience || ''),
    price: dynamicPrice,
    currency: String(p.currency || 'INR'),
    priceLabel: formatINR(dynamicPrice),
    duration: String(p.duration || ''),
    durationTier: (p.durationTier as DurationTier) || undefined,
    includedServices: Array.isArray(p.includedServices) ? p.includedServices : undefined,
    availableAddons: Array.isArray(p.availableAddons) ? p.availableAddons : undefined,
    highlighted: Boolean(p.highlighted),
    featured: Boolean(p.featured),
    deliverables: normalizePackageDeliverables(p.deliverables),
    customizer:
      p.customizer && typeof p.customizer === 'object'
        ? (p.customizer as PackageCustomizer)
        : undefined,
    imageUrl: p.imageUrl ? String(p.imageUrl) : p.image ? String(p.image) : '',
    image: p.image ? String(p.image) : p.imageUrl ? String(p.imageUrl) : '',
    category: p.category ? String(p.category) : resolvedEventId,
    status: p.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: p.displayOnPortfolio !== false,
    sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : 0,
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
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()
    .exec();

  if (!mongoPackages || mongoPackages.length === 0) {
    try {
      await packageModel.insertMany(DEFAULT_STUDIO_PACKAGES);
      mongoPackages = await packageModel
        .find({})
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean()
        .exec();
    } catch (seedErr) {
      console.warn('Could not seed packages into Mongo:', seedErr);
      return DEFAULT_STUDIO_PACKAGES.map((pkg) => toPlainPackage(pkg, effectiveServices));
    }
  }

  return mongoPackages.map((pkg) => toPlainPackage(pkg, effectiveServices));
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
  const plainEvents = await getEventsFromMongo();

  memoryCache = {
    ...memoryCache,
    services: plainServices,
    packages: plainPackages,
    events: plainEvents,
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
  eventTime?: string;
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
  const resolvedEventTime =
    input.eventTime !== undefined ? input.eventTime.trim() : targetBooking.eventTime;

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
        totalAmount: targetBooking.totalAmount ?? input.quotedAmount,
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

  // Find matching event
  const matchingEvent = state.events?.find(
    (e) =>
      e.name.toLowerCase() === project.eventType.toLowerCase() ||
      e.id.toLowerCase() === project.eventType.toLowerCase()
  );

  const eventName = project.eventType || matchingBooking?.eventType || 'Celebration';
  let tamilEventName = matchingEvent?.tamilName || '';
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
      paymentDate: payment.date || new Date().toISOString().split('T')[0],
      paymentStage: payment.label || 'Payment',
    },
    termsAndConditions: STUDIO_TERMS_AND_CONDITIONS.map((t) => ({
      en: t.en,
      ta: t.ta,
    })),
    optedServices: project.optedServices || matchingBooking?.optedServices || matchingCalendarEntry?.optedServices,
    createdAt: new Date().toISOString(),
  };

  await billModel.create(newBill);

  const newPayment: PaymentRecord = {
    ...payment,
    id: paymentId,
    billId,
    billNumber,
  };

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
  const result = await projects.deleteOne({ id: projectId });
  if (result.deletedCount === 0) {
    throw new Error('Event project not found.');
  }
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
    eventId: input.eventId?.trim() || 'wedding',
    tier: input.tier,
    name,
    audience: input.audience?.trim() || 'For weddings and celebrations',
    price,
    currency: input.currency?.trim() || 'INR',
    priceLabel: input.priceLabel?.trim() || formatINR(price),
    duration: input.duration?.trim() || 'Single Day',
    highlighted: Boolean(input.highlighted || input.featured),
    featured: Boolean(input.featured || input.highlighted),
    deliverables: input.deliverables
      ? normalizePackageDeliverables(input.deliverables)
      : {
          'Event Coverage & Crew': '1 Lead Candid Photographer + 1 Traditional Photographer',
          'Albums & Photo Frames': 'Signature Layflat Photo Album',
          'Digital Deliverables': 'Full Event Edited Video + Raw Footage Drive',
        },
    customizer: input.customizer,
    imageUrl: input.imageUrl?.trim() || input.image?.trim() || '',
    category: input.category?.trim() || 'Weddings',
    status: input.status === 'inactive' ? 'inactive' : 'active',
    displayOnPortfolio: input.displayOnPortfolio !== false,
    sortOrder: typeof input.sortOrder === 'number' ? input.sortOrder : maxSort + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const packageModel = await requirePackageModel();
  await packageModel.updateOne({ id }, { $set: newPackage }, { upsert: true });

  const nextPackages = [...state.packages, newPackage].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

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
    eventId: patch.eventId !== undefined ? patch.eventId.trim() : existing.eventId || 'wedding',
    price,
    currency: patch.currency || existing.currency || 'INR',
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
    deliverables:
      patch.deliverables !== undefined
        ? normalizePackageDeliverables(patch.deliverables)
        : existing.deliverables,
    customizer: patch.customizer !== undefined ? patch.customizer : existing.customizer,
    status: patch.status ? (patch.status === 'inactive' ? 'inactive' : 'active') : existing.status,
    displayOnPortfolio:
      patch.displayOnPortfolio !== undefined
        ? patch.displayOnPortfolio
        : existing.displayOnPortfolio,
    sortOrder: patch.sortOrder !== undefined ? Number(patch.sortOrder) : existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };

  const packageModel = await requirePackageModel();
  await packageModel.updateOne({ id }, { $set: updatedPackage }, { upsert: true });

  const nextPackages = state.packages
    .map((p) => (p.id === id ? updatedPackage : p))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function deletePackageOnServer(id: string): Promise<StudioState> {
  const state = await getStudioState();
  const exists = state.packages.some((p) => p.id === id);
  if (!exists) {
    throw new Error(`Package with ID "${id}" not found.`);
  }

  const packageModel = await requirePackageModel();
  await packageModel.deleteOne({ id });

  const nextPackages = state.packages.filter((p) => p.id !== id);

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function reorderPackagesOnServer(orderedIds: string[]): Promise<StudioState> {
  const state = await getStudioState();
  const packageModel = await requirePackageModel();

  const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]));

  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { id },
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
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  memoryCache = {
    ...state,
    packages: nextPackages,
  };

  return memoryCache;
}

export async function saveServiceOnServer(service: Partial<StudioService>): Promise<StudioService> {
  const serviceModel = await getServiceModel();
  if (!serviceModel) throw new Error('Service storage unavailable.');
  const slug = service.slug || service.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug) throw new Error('Service slug is required.');
  const updated = await serviceModel
    .findOneAndUpdate(
      { slug },
      { $set: { ...service, slug, updatedAt: new Date().toISOString() } },
      { new: true, upsert: true }
    )
    .lean()
    .exec();
  return toPlainService(updated);
}
