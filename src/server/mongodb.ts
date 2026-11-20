import mongoose, { Schema, type Model } from 'mongoose';
import type {
  BookingRequest,
  CalendarDayEntry,
  EventProject,
} from '../types/studio';

const uri = process.env.MONGODB_STANDARD_URI || process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'gk_studios';

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
    notes: { type: String, default: '' },
    status: { type: String, required: true },
    source: String,
    assignedCrew: String,
    acknowledgementNote: String,
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: String,
    termsVersion: String,
    createdAt: { type: String, required: true },
  },
  { collection: 'booking_requests', strict: false, timestamps: false }
);

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

async function connectToMongo(uri: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, {
    dbName: databaseName,
    maxPoolSize: 5,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 15000,
  });
}

async function ensureMongoConnection(): Promise<boolean> {
  if (!uri) return false;

  if (!globalForMongoose.mongooseConnection) {
    globalForMongoose.mongooseConnection = connectToMongo(uri).catch((error) => {
      globalForMongoose.mongooseConnection = undefined;
      throw error;
    });
  }

  await globalForMongoose.mongooseConnection;
  return true;
}

export async function getBookingModel(): Promise<Model<BookingRequestDocument> | null> {
  if (!(await ensureMongoConnection())) return null;

  return (
    mongoose.models.BookingRequest as Model<BookingRequestDocument> | undefined
  ) || mongoose.model<BookingRequestDocument>('BookingRequest', BookingSchema);
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
  },
  { _id: false }
);

const EventProjectSchema = new Schema<EventProjectDocument>(
  {
    id: { type: String, required: true, unique: true },
    bookingId: String,
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
  },
  { collection: 'event_projects', strict: false, timestamps: false }
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
