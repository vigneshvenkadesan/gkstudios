import mongoose, { Schema, type Model } from 'mongoose';
import type {
  BookingRequest,
  CalendarDayEntry,
  EventProject,
  StudioEvent,
  StudioBill,
  StudioPackage,
  StudioService,
} from '../types/studio';

function getMongoUri(): string | undefined {
  return process.env.MONGODB_STANDARD_URI || process.env.MONGODB_URI;
}

function getDatabaseName(): string {
  return process.env.MONGODB_DATABASE || 'gkstudios_dev';
}

interface BookingRequestDocument extends BookingRequest, mongoose.Document {}

const BookingSchema = new Schema<BookingRequestDocument>(
  {
    id: { type: String, required: true, unique: true },
    referenceCode: { type: String, required: true },
    clientName: { type: String, required: true },
    phone: { type: String, required: true },
    eventType: { type: String, required: true },
    preferredDate: { type: String, required: true },
    endDate: String,
    eventTime: String,
    venue: { type: String, required: true },
    packageId: { type: String, required: true },
    packageName: { type: String, required: true },
    quotedAmount: { type: Number, required: true },
    requestedServices: { type: [String], default: [] },
    durationTier: String,
    optedServices: { type: Schema.Types.Mixed, default: [] },
    totalAmount: Number,
    notes: { type: String, default: '' },
    status: { type: String, required: true },
    source: String,
    assignedCrew: String,
    acknowledgementNote: String,
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: String,
    termsVersion: String,
    packageSnapshot: { type: Schema.Types.Mixed },
    proposalToken: { type: String, unique: true, sparse: true },
    proposalDraft: { type: Schema.Types.Mixed },
    proposalUpdatedAt: String,
    proposalSubmittedAt: String,
    proposalRevision: Number,
    createdAt: { type: String, required: true },
  },
  { collection: 'booking_requests', strict: false, timestamps: false }
);

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

async function connectToMongo(uri: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, {
    dbName: getDatabaseName(),
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 15000,
  });
}

async function ensureMongoConnection(): Promise<boolean> {
  const uri = getMongoUri();
  if (!uri) return false;

  try {
    if (!globalForMongoose.mongooseConnection) {
      globalForMongoose.mongooseConnection = connectToMongo(uri).catch((error) => {
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
    }

    await globalForMongoose.mongooseConnection;
    return true;
  } catch (error) {
    console.warn('MongoDB connection unavailable:', error instanceof Error ? error.message : error);
    return false;
  }
}

interface StudioEventDocument extends StudioEvent, mongoose.Document {}

const StudioEventSchema = new Schema<StudioEventDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tamilName: { type: String, required: true, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['wedding', 'baby-kids', 'outdoor', 'family-milestones'],
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    sortOrder: { type: Number, required: true, default: 1 },
  },
  { collection: 'events', strict: true, timestamps: false }
);

export async function getStudioEventModel(): Promise<Model<StudioEventDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.StudioEvent as Model<StudioEventDocument> | undefined
  ) || mongoose.model<StudioEventDocument>('StudioEvent', StudioEventSchema);
}

export async function getBookingModel(): Promise<Model<BookingRequestDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.BookingRequest as Model<BookingRequestDocument> | undefined
  ) || mongoose.model<BookingRequestDocument>('BookingRequest', BookingSchema);
}

interface StudioPackageDocument extends Omit<StudioPackage, '_id'>, mongoose.Document {}

const IncludedPackageServiceSchema = new Schema(
  {
    serviceSlug: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    durationTier: { type: String, enum: ['threeHours', 'halfDay', 'fullDay'] },
  },
  { _id: false }
);

const PackageCustomizerSchema = new Schema(
  {
    included: {
      traditionalPhoto: { type: Boolean, default: false },
      traditionalVideo: { type: Boolean, default: false },
      candidPhoto: { type: Boolean, default: false },
      candidVideo: { type: Boolean, default: false },
      drone: { type: Boolean, default: false },
      ledWall: { type: Boolean, default: false },
      outdoorShoot: { type: Boolean, default: false },
      printedAlbum: { type: Boolean, default: false },
    },
    addons: { type: [Schema.Types.Mixed], default: undefined },
    features: { type: [String], default: undefined },
  },
  { _id: false, strict: false }
);

const PackageSchema = new Schema<StudioPackageDocument>(
  {
    id: { type: String, required: true, unique: true },
    eventId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    tier: { type: String, enum: ['essential', 'signature', 'premium'] },
    name: { type: String, required: true },
    audience: { type: String, required: true },
    price: { type: Number, default: undefined },
    currency: { type: String, default: 'INR' },
    priceLabel: String,
    duration: { type: String, required: true },
    durationTier: { type: String, enum: ['threeHours', 'halfDay', 'fullDay'] },
    includedServices: { type: [IncludedPackageServiceSchema], default: [] },
    highlighted: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    deliverables: {
      Deliverables: { type: String, default: '' },
    },
    customizer: { type: PackageCustomizerSchema, default: undefined },
    imageUrl: String,
    image: String,
    status: { type: String, default: 'active' },
    displayOnPortfolio: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    eventSortOrder: { type: Number, default: 1 },
    createdAt: String,
    updatedAt: String,
  },
  { collection: 'packages', strict: false, timestamps: true }
);

export async function getPackageModel(): Promise<Model<StudioPackageDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.Package as Model<StudioPackageDocument> | undefined
  ) || mongoose.model<StudioPackageDocument>('Package', PackageSchema);
}

interface StudioServiceDocument extends Omit<StudioService, '_id'>, mongoose.Document {}

const ServiceSchema = new Schema<StudioServiceDocument>(
  {
    id: String,
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tamilName: { type: String, default: '' },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    pricingType: { type: String, enum: ['tiered', 'per_unit'], required: true },
    unitLabel: { type: String, default: 'unit' },
    unitPrice: { type: Number, default: null },
    minQuantity: { type: Number, default: 1 },
    pricing: { type: Schema.Types.Mixed, default: null },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    createdAt: String,
    updatedAt: String,
  },
  { collection: 'services', strict: false, timestamps: true }
);

export async function getServiceModel(): Promise<Model<StudioServiceDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    (mongoose.models.Service as Model<StudioServiceDocument> | undefined) ||
    mongoose.model<StudioServiceDocument>('Service', ServiceSchema)
  );
}

interface CalendarScheduleDocument extends CalendarDayEntry, mongoose.Document {}

const CalendarScheduleSchema = new Schema<CalendarScheduleDocument>(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    title: { type: String, required: true },
    eventType: String,
    clientName: String,
    venue: String,
    assignedCrew: String,
    notes: String,
    bookingId: String,
    phone: String,
    time: String,
    requestedServices: { type: [String], default: [] },
    durationTier: String,
    optedServices: { type: Schema.Types.Mixed, default: [] },
    totalAmount: Number,
  },
  { collection: 'calendar_schedule', strict: false, timestamps: false }
);

interface EventProjectDocument extends EventProject, mongoose.Document {}

const PaymentSchema = new Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    referenceNote: String,
    billId: String,
    billNumber: String,
  },
  { _id: false }
);

const EventProjectSchema = new Schema<EventProjectDocument>(
  {
    id: { type: String, required: true, unique: true },
    bookingId: String,
    calendarEntryId: String,
    referenceCode: { type: String, required: true },
    clientName: { type: String, required: true },
    phone: { type: String, required: true },
    eventType: { type: String, required: true },
    eventDate: { type: String, required: true },
    endDate: String,
    venue: { type: String, required: true },
    packageName: { type: String, required: true },
    assignedCrew: { type: String, required: true },
    currentStage: { type: String, required: true },
    stageUpdates: { type: Schema.Types.Mixed, required: true, default: {} },
    agreedAmount: { type: Number, required: true },
    extraCharges: { type: Number, required: true },
    discount: { type: Number, required: true },
    payments: { type: [PaymentSchema], default: [] },
    deliveryNotes: { type: String, required: true },
    requestedServices: { type: [String], default: [] },
    durationTier: String,
    optedServices: { type: Schema.Types.Mixed, default: [] },
    totalAmount: Number,
    packageSnapshot: { type: Schema.Types.Mixed },
  },
  { collection: 'event_projects', strict: false, timestamps: false }
);

interface BillDocument extends Omit<StudioBill, '_id'>, mongoose.Document {}

const BillSchema = new Schema<BillDocument>(
  {
    id: { type: String, required: true, unique: true },
    billNumber: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    paymentId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    eventDetails: {
      eventName: { type: String, default: '' },
      tamilEventName: { type: String, default: '' },
      eventDate: { type: String, default: '' },
      eventTime: { type: String, default: '' },
      venue: { type: String, default: '' },
      schedulePlan: { type: String, default: '' },
    },
    packageDetails: {
      basePackageName: { type: String, default: '' },
      tierLabel: { type: String, default: 'Signature' },
      durationTier: String,
      optedServices: { type: Schema.Types.Mixed, default: [] },
      includedServices: [
        {
          key: String,
          en: String,
          ta: String,
          selected: { type: Boolean, default: true },
        },
      ],
      deliverables: { type: Schema.Types.Mixed, default: {} },
      requiredCrew: { type: [String], default: [] },
      inclusions: { type: [String], default: [] },
      addons: [{ label: String, priceDelta: Number }],
      excludedItems: [{ label: String, priceDelta: Number }],
    },
    financials: {
      totalPackageAmount: { type: Number, required: true },
      amountPaidNow: { type: Number, required: true },
      totalPaidToDate: { type: Number, required: true },
      balanceDue: { type: Number, required: true },
      paymentMode: { type: String, default: 'UPI' },
      paymentDate: { type: String, required: true },
      paymentStage: { type: String, default: 'Payment' },
    },
    paymentHistory: { type: [PaymentSchema], default: [] },
    termsAndConditions: [{ en: String, ta: String }],
    optedServices: { type: Schema.Types.Mixed, default: [] },
    createdAt: { type: String, required: true },
  },
  { collection: 'bills', strict: false, timestamps: true }
);

export async function getCalendarScheduleModel(): Promise<Model<CalendarScheduleDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.CalendarSchedule as Model<CalendarScheduleDocument> | undefined
  ) || mongoose.model<CalendarScheduleDocument>('CalendarSchedule', CalendarScheduleSchema);
}

export async function getEventProjectModel(): Promise<Model<EventProjectDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.EventProject as Model<EventProjectDocument> | undefined
  ) || mongoose.model<EventProjectDocument>('EventProject', EventProjectSchema);
}

export async function getBillModel(): Promise<Model<BillDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    (mongoose.models.Bill as Model<BillDocument> | undefined) ||
    mongoose.model<BillDocument>('Bill', BillSchema)
  );
}
