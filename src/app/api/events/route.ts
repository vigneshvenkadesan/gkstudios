import { NextResponse } from 'next/server';
import {
  createEventProjectOnServer,
  getEventsFromMongo,
} from '@/src/server/studioStore';
import { getEventModel } from '@/src/server/mongodb';
import { CUSTOM_PACKAGE_NAME, EventCategory, StudioEvent } from '@/src/types/studio';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';

    let events = await getEventsFromMongo();

    if (!all) {
      events = events.filter((e) => (e.status ?? 'active') === 'active');
    }

    if (category) {
      events = events.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase()
      );
    }

    events.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to load events from Mongo:', error);
    return NextResponse.json(
      { error: 'Event data is currently unavailable.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      // EventProject creation fields
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

      // Direct StudioEvent creation fields (for dynamic event management)
      id?: string;
      name?: string;
      tamilName?: string;
      category?: string;
      status?: 'active' | 'inactive';
      sortOrder?: number;
    };

    // If clientName is present, this is an EventProject creation (existing flow)
    if (body.clientName) {
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
    }

    // Otherwise, handle StudioEvent creation in MongoDB events collection
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Event name is required.' },
        { status: 400 }
      );
    }

    const eventModel = await getEventModel();
    if (!eventModel) {
      return NextResponse.json(
        { error: 'MongoDB events collection is currently unavailable.' },
        { status: 503 }
      );
    }

    const eventId =
      body.id?.trim() ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newEvent: StudioEvent = {
      id: eventId,
      name: body.name.trim(),
      tamilName: body.tamilName?.trim() || undefined,
      category: body.category?.trim() || 'wedding',
      status: body.status === 'inactive' ? 'inactive' : 'active',
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await eventModel.updateOne({ id: eventId }, { $set: newEvent }, { upsert: true });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Failed to process event POST:', error);
    return NextResponse.json(
      { error: 'Unable to process event request.' },
      { status: 500 }
    );
  }
}
