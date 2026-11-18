import { NextResponse } from 'next/server';
import {
  processBookingOnServer,
  updateBookingStatusOnServer,
} from '@/src/server/studioStore';
import { BookingStatus } from '@/src/types/studio';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: 'status' | 'process';
      status?: BookingStatus;
      packageId?: string;
      quotedAmount?: number;
      assignedCrew?: string;
      acknowledgementNote?: string;
      nextStatus?: Extract<BookingStatus, 'Acknowledged' | 'Confirmed'>;
      blockCalendarDate?: boolean;
    };

    if (body.action === 'status' && body.status) {
      const state = await updateBookingStatusOnServer(id, body.status);
      return NextResponse.json(state);
    }

    if (body.nextStatus) {
      const state = await processBookingOnServer({
        bookingId: id,
        packageId: body.packageId || '',
        quotedAmount: Number(body.quotedAmount) || 0,
        assignedCrew: body.assignedCrew,
        acknowledgementNote: body.acknowledgementNote || '',
        nextStatus: body.nextStatus,
        blockCalendarDate: body.blockCalendarDate,
      });
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: 'Invalid booking update payload' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update booking';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
