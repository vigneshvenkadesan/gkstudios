import mongoose, { Schema, type Model } from 'mongoose';
import type { BookingRequest, CalendarDayEntry } from '../types/studio';

const uri = process.env.MONGODB_URI;
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
    venue: { type: String, required: true },
    packageId: { type: String, required: true },
    packageName: { type: String, required: true },
    quotedAmount: { type: Number, required: true },
    notes: { type: String, default: '' },
    status: { type: String, required: true },
    assignedCrew: String,
    acknowledgementNote: String,
    createdAt: { type: String, required: true },
  },
  { collection: 'booking_requests', strict: false, timestamps: false }
);

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export async function getBookingModel(): Promise<Model<BookingRequestDocument> | null> {
  if (!uri) return null;

  if (!globalForMongoose.mongooseConnection) {
    globalForMongoose.mongooseConnection = mongoose
      .connect(uri, {
        dbName: databaseName,
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 15000,
      })
      .then((instance) => instance)
      .catch((error) => {
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
  }

  await globalForMongoose.mongooseConnection;

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
  },
  { collection: 'calendar_schedule', strict: false, timestamps: false }
);

export async function getCalendarScheduleModel(): Promise<Model<CalendarScheduleDocument> | null> {
  if (!uri) return null;

  if (!globalForMongoose.mongooseConnection) {
    globalForMongoose.mongooseConnection = mongoose
      .connect(uri, {
        dbName: databaseName,
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 15000,
      })
      .then((instance) => instance)
      .catch((error) => {
        globalForMongoose.mongooseConnection = undefined;
        throw error;
      });
  }

  await globalForMongoose.mongooseConnection;

  return (
    mongoose.models.CalendarSchedule as Model<CalendarScheduleDocument> | undefined
  ) || mongoose.model<CalendarScheduleDocument>('CalendarSchedule', CalendarScheduleSchema);
}
