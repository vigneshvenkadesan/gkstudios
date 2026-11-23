import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  processBookingOnServer,
  updateBookingStatusOnServer,
} from '@/src/server/studioStore';
import { BookingStatus } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

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
        eventTime: body.eventTime,
      });
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: 'Invalid booking update payload' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update booking';
    const status =
      message === 'Booking request not found.'
        ? 404
        : message.includes('proposal before confirming')
          ? 409
          : error instanceof SyntaxError
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
