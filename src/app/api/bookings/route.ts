import { NextResponse } from 'next/server';
import { createBookingOnServer } from '@/src/server/studioStore';
import { EventCategory } from '@/src/types/studio';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientName?: string;
      phone?: string;
      eventType?: EventCategory;
      preferredDate?: string;
      endDate?: string;
      venue?: string;
      packageId?: string;
      notes?: string;
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
      eventType: body.eventType || 'Iyer Weddings',
      preferredDate: body.preferredDate,
      endDate: body.endDate,
      venue: body.venue,
      packageId: body.packageId || 'pkg-grand',
      notes: body.notes || '',
    });

    return NextResponse.json({ booking: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
