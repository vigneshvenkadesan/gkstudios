import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  createEventOnServer,
  createEventProjectOnServer,
  getEventsFromMongo,
} from '@/src/server/studioStore';
import { CUSTOM_PACKAGE_NAME, EventCategory, StudioEvent } from '@/src/types/studio';

export const dynamic = 'force-dynamic';

function revalidateCatalogPages() {
  revalidatePath('/');
  revalidatePath('/packages');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath('/admin/packages');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';
    const requestedStatus = searchParams.get('status');
    let events = await getEventsFromMongo({
      includeInactive: all || requestedStatus === 'inactive',
      category: category || undefined,
    });
    if (!all && requestedStatus === 'inactive') {
      events = events.filter((event) => event.status === 'inactive');
    }
    return NextResponse.json(events);
  } catch (error) {
    console.error('Failed to load events:', error);
    return NextResponse.json(
      { error: 'Event data is currently unavailable.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Partial<StudioEvent> & {
      resource?: string;
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
    };

    if (body.resource === 'catalog-event') {
      const result = await createEventOnServer(body);
      revalidateCatalogPages();
      return NextResponse.json(result, { status: 201 });
    }

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
    console.error('Failed to process event POST:', error);
    const message = error instanceof Error ? error.message : 'Unable to process event request.';
    const status = message.includes('already exists')
      ? 409
      : /required|must be|slug|does not exist/i.test(message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
