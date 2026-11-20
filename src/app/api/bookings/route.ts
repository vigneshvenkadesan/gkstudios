import { NextResponse } from 'next/server';
import { createBookingOnServer } from '@/src/server/studioStore';
import {
  BOOKING_SERVICE_OPTIONS,
  BookingServiceOption,
  BookingStatus,
  EventCategory,
} from '@/src/types/studio';

const bookingServiceSet = new Set<string>(BOOKING_SERVICE_OPTIONS);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientName?: string;
      phone?: string;
      eventType?: EventCategory;
      preferredDate?: string;
      endDate?: string;
      eventTime?: string;
      venue?: string;
      packageId?: string;
      packageName?: string;
      quotedAmount?: number;
      notes?: string;
      status?: BookingStatus;
      source?: string;
      assignedCrew?: string;
      termsAccepted?: boolean;
      termsAcceptedAt?: string;
      termsVersion?: string;
      requestedServices?: unknown;
    };

    if (!body.clientName?.trim() || !body.phone?.trim() || !body.preferredDate || !body.venue?.trim()) {
      return NextResponse.json(
        { error: 'Client name, phone, preferred date, and venue are required.' },
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
      venue: body.venue,
      packageId: body.packageId || 'pkg-grand',
      packageName: body.packageName,
      quotedAmount: body.quotedAmount,
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
    });

    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
