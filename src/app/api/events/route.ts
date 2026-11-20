import { NextResponse } from 'next/server';
import { createEventProjectOnServer } from '@/src/server/studioStore';
import { CUSTOM_PACKAGE_NAME, EventCategory } from '@/src/types/studio';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientName?: string;
      phone?: string;
      eventType?: EventCategory;
      eventDate?: string;
      endDate?: string;
      venue?: string;
      packageName?: string;
      assignedCrew?: string;
      agreedAmount?: number;
      initialAdvance?: number;
      deliveryNotes?: string;
    };

    if (!body.clientName?.trim() || !body.phone?.trim() || !body.venue?.trim() || !body.eventDate) {
      return NextResponse.json(
        { error: 'Client name, phone, event date, and venue are required.' },
        { status: 400 }
      );
    }

    const result = await createEventProjectOnServer({
      clientName: body.clientName,
      phone: body.phone,
      eventType: body.eventType || 'Weddings',
      eventDate: body.eventDate,
      endDate: body.endDate,
      venue: body.venue,
      packageName: body.packageName || CUSTOM_PACKAGE_NAME,
      assignedCrew: body.assignedCrew || 'G Krishna & Studio Unit',
      agreedAmount: Number(body.agreedAmount) || 0,
      initialAdvance: Number(body.initialAdvance) || 0,
      deliveryNotes: body.deliveryNotes,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create event project.', error);
    return NextResponse.json({ error: 'Unable to create event project.' }, { status: 500 });
  }
}
