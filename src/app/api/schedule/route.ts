import { NextResponse } from 'next/server';
import {
  removeCalendarEntryOnServer,
  upsertCalendarEntryOnServer,
} from '@/src/server/studioStore';
import { CalendarDayEntry } from '@/src/types/studio';

export async function PUT(request: Request) {
  try {
    const entry = (await request.json()) as CalendarDayEntry;
    if (
      !entry.date ||
      !entry.title?.trim() ||
      !entry.eventType?.trim() ||
      !entry.venue?.trim() ||
      !entry.phone?.trim()
    ) {
      return NextResponse.json(
        { error: 'Date, schedule title, event category, venue, and phone number are required.' },
        { status: 400 }
      );
    }
    const state = await upsertCalendarEntryOnServer(entry);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update schedule';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const entryId = searchParams.get('id') || undefined;
    if (!date) {
      return NextResponse.json({ error: 'Query param "date" is required.' }, { status: 400 });
    }
    const state = await removeCalendarEntryOnServer(date, entryId);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove schedule entry';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
