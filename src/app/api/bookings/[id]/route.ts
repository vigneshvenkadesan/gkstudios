import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
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
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: 'status' | 'process';
      status?: BookingStatus;
      packageId?: string;
      quotedAmount?: number;
      assignedCrew?: string;
      acknowledgementNote?: string;
      nextStatus?: Extract<BookingStatus, 'In Discussion' | 'Acknowledged' | 'Confirmed'>;
      blockCalendarDate?: boolean;
      eventTime?: string;
      eventEndTime?: string;
    };

    if (body.action === 'status' && body.status) {
      const state = await updateBookingStatusOnServer(id, body.status);
      return NextResponse.json(state);
    }

    if (body.nextStatus) {
      if (
        (body.eventTime !== undefined &&
          (typeof body.eventTime !== 'string' || body.eventTime.length > 120)) ||
        (body.eventEndTime !== undefined &&
          (typeof body.eventEndTime !== 'string' || body.eventEndTime.length > 120))
      ) {
        return NextResponse.json(
          { error: 'Provide a valid event start and end time.' },
          { status: 400 }
        );
      }
      const state = await processBookingOnServer({
        bookingId: id,
        packageId: body.packageId || '',
        quotedAmount: Number(body.quotedAmount) || 0,
        assignedCrew: body.assignedCrew,
        acknowledgementNote: body.acknowledgementNote || '',
        nextStatus: body.nextStatus,
        blockCalendarDate: body.blockCalendarDate,
        eventTime: body.eventTime,
        eventEndTime: body.eventEndTime,
      });
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: 'Invalid booking update payload' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update booking';
    const status =
      message === 'Booking request not found.'
        ? 404
        : message === 'Event end time must be later than the start time.'
          ? 400
        : message.includes('proposal before confirming')
          ? 409
          : error instanceof SyntaxError
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
