import { NextResponse } from 'next/server';
import { createBookingOnServer } from '@/src/server/studioStore';
import {
  BOOKING_SERVICE_OPTIONS,
  BookingServiceOption,
  BookingStatus,
  CUSTOM_PACKAGE_ID,
  DurationTier,
  EventCategory,
  OptedServiceSnapshot,
  PackageSnapshot,
} from '@/src/types/studio';

const bookingServiceSet = new Set<string>(BOOKING_SERVICE_OPTIONS);
const durationTierSet = new Set<DurationTier>(['threeHours', 'halfDay', 'fullDay']);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientName?: string;
      phone?: string;
      eventType?: EventCategory;
      preferredDate?: string;
      endDate?: string;
      eventTime?: string;
      eventEndTime?: string;
      venue?: string;
      packageId?: string;
      packageName?: string;
      quotedAmount?: number;
      durationTier?: DurationTier;
      optedServices?: OptedServiceSnapshot[];
      totalAmount?: number;
      notes?: string;
      status?: BookingStatus;
      source?: string;
      assignedCrew?: string;
      termsAccepted?: boolean;
      termsAcceptedAt?: string;
      termsVersion?: string;
      requestedServices?: unknown;
      packageSnapshot?: PackageSnapshot;
    };

    if (!body.clientName?.trim() || !body.phone?.trim() || !body.preferredDate || !body.venue?.trim()) {
      return NextResponse.json(
        { error: 'Client name, phone, preferred date, and venue are required.' },
        { status: 400 }
      );
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate) ||
      (body.endDate !== undefined &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(body.endDate) || body.endDate < body.preferredDate)) ||
      (body.eventTime !== undefined &&
        (typeof body.eventTime !== 'string' || body.eventTime.length > 120)) ||
      (body.eventEndTime !== undefined &&
        (typeof body.eventEndTime !== 'string' || body.eventEndTime.length > 120))
    ) {
      return NextResponse.json(
        { error: 'Provide a valid event start and end date/time.' },
        { status: 400 }
      );
    }
    if (
      typeof body.eventTime === 'string' &&
      typeof body.eventEndTime === 'string' &&
      (!body.endDate || body.endDate === body.preferredDate) &&
      /^\d{2}:\d{2}$/.test(body.eventTime) &&
      /^\d{2}:\d{2}$/.test(body.eventEndTime) &&
      body.eventEndTime <= body.eventTime
    ) {
      return NextResponse.json(
        { error: 'Event end time must be later than the start time.' },
        { status: 400 }
      );
    }
    if (body.durationTier !== undefined && !durationTierSet.has(body.durationTier)) {
      return NextResponse.json(
        { error: 'durationTier must be one of: threeHours, halfDay, fullDay.' },
        { status: 400 }
      );
    }

    const created = await createBookingOnServer({
      clientName: body.clientName,
      phone: body.phone,
      eventType: body.eventType || 'Weddings',
      preferredDate: body.preferredDate,
      endDate: body.endDate,
      eventTime: body.eventTime,
      eventEndTime: body.eventEndTime,
      venue: body.venue,
      packageId: body.packageId || CUSTOM_PACKAGE_ID,
      packageName: body.packageName,
      quotedAmount: body.quotedAmount,
      durationTier: body.durationTier,
      optedServices: Array.isArray(body.optedServices) ? body.optedServices : undefined,
      totalAmount: typeof body.totalAmount === 'number' ? body.totalAmount : undefined,
      requestedServices: Array.isArray(body.requestedServices)
        ? body.requestedServices.filter(
            (service): service is BookingServiceOption =>
              typeof service === 'string' && bookingServiceSet.has(service)
          )
        : [],
      notes: body.notes || '',
      status: body.status,
      source: body.source,
      assignedCrew: body.assignedCrew,
      termsAccepted: typeof body.termsAccepted === 'boolean' ? body.termsAccepted : false,
      termsAcceptedAt: typeof body.termsAcceptedAt === 'string' ? body.termsAcceptedAt : undefined,
      termsVersion: typeof body.termsVersion === 'string' ? body.termsVersion : undefined,
      packageSnapshot: body.packageSnapshot,
    });

    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
