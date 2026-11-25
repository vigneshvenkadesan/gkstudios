import { NextResponse } from 'next/server';
import {
  addEventPaymentOnServer,
  deleteEventPaymentOnServer,
  deleteEventProjectOnServer,
  updateEventFinancialsOnServer,
  updateEventStageOnServer,
} from '@/src/server/studioStore';
import { EventStage, PaymentRecord } from '@/src/types/studio';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
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
    if (error instanceof Error && error.message === 'Event project not found.') {
      return NextResponse.json({ error: error.message }, { status: 404 });
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

    const state = await deleteEventProjectOnServer(id);
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof Error && error.message === 'Event project not found.') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Failed to delete event.', error);
    return NextResponse.json({ error: 'Unable to delete event.' }, { status: 500 });
  }
}
