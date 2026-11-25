import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  addEventPaymentOnServer,
  deleteEventPaymentOnServer,
  deleteEventProjectOnServer,
  deleteEventOnServer,
  updateEventOnServer,
  updateEventFinancialsOnServer,
  updateEventStageOnServer,
} from '@/src/server/studioStore';
import { EventStage, PaymentRecord, StudioEvent } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

function revalidateCatalogPages() {
  revalidatePath('/');
  revalidatePath('/packages');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath('/admin/packages');
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      resource?: string;
      // EventProject actions
      action?: 'stage' | 'financials' | 'add_payment' | 'delete_payment';
      stage?: EventStage;
      note?: string;
      agreedAmount?: number;
      extraCharges?: number;
      discount?: number;
      deliveryNotes?: string;
      assignedCrew?: string;
      payment?: Omit<PaymentRecord, 'id'>;
      paymentId?: string;
    };

    if (body.resource === 'catalog-event') {
      if (!(await isAuthorizedAdmin())) {
        return NextResponse.json(
          { error: 'Unauthorized. Studio staff authentication required.' },
          { status: 401 }
        );
      }
      const { resource: _resource, ...patch } = body;
      const state = await updateEventOnServer(id, patch as Partial<StudioEvent>);
      revalidateCatalogPages();
      return NextResponse.json(state);
    }

    if (body.action === 'stage' && body.stage) {
      const state = await updateEventStageOnServer(id, body.stage, body.note);
      return NextResponse.json(state);
    }

    if (body.action === 'financials') {
      const state = await updateEventFinancialsOnServer(id, {
        agreedAmount: body.agreedAmount,
        extraCharges: body.extraCharges,
        discount: body.discount,
        deliveryNotes: body.deliveryNotes,
        assignedCrew: body.assignedCrew,
      });
      return NextResponse.json(state);
    }

    if (body.action === 'add_payment' && body.payment) {
      const state = await addEventPaymentOnServer(id, body.payment);
      return NextResponse.json(state);
    }

    if (body.action === 'delete_payment' && body.paymentId) {
      const state = await deleteEventPaymentOnServer(id, body.paymentId);
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: 'Invalid event update action' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found.')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('must be')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to update event.', error);
    return NextResponse.json({ error: 'Unable to update event.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(_request.url);
    const resource = searchParams.get('resource');
    if (resource === 'catalog-event') {
      if (!(await isAuthorizedAdmin())) {
        return NextResponse.json(
          { error: 'Unauthorized. Studio staff authentication required.' },
          { status: 401 }
        );
      }
      const state = await deleteEventOnServer(id);
      revalidateCatalogPages();
      return NextResponse.json(state);
    }

    const state = await deleteEventProjectOnServer(id);
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof Error && error.message.includes('still has linked packages')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('not found.')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Failed to delete event.', error);
    return NextResponse.json({ error: 'Unable to delete event.' }, { status: 500 });
  }
}
