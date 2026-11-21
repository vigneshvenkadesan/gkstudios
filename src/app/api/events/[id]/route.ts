import { NextResponse } from 'next/server';
import {
  addEventPaymentOnServer,
  deleteEventPaymentOnServer,
  deleteEventProjectOnServer,
  toPlainEvent,
  updateEventFinancialsOnServer,
  updateEventStageOnServer,
} from '@/src/server/studioStore';
import { getEventModel } from '@/src/server/mongodb';
import { EventStage, PaymentRecord, StudioEvent } from '@/src/types/studio';

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

      // StudioEvent properties
      name?: string;
      tamilName?: string;
      category?: string;
      status?: 'active' | 'inactive';
      sortOrder?: number;
    };

    // 1. Check if this is a StudioEvent update (editing ceremony definition)
    if (
      body.name !== undefined ||
      body.tamilName !== undefined ||
      body.category !== undefined ||
      body.status !== undefined ||
      body.sortOrder !== undefined
    ) {
      const eventModel = await getEventModel();
      if (!eventModel) {
        return NextResponse.json(
          { error: 'Event storage is unavailable.' },
          { status: 503 }
        );
      }

      const updateFields: Partial<StudioEvent> = {
        updatedAt: new Date().toISOString(),
      };
      if (body.name !== undefined) updateFields.name = body.name.trim();
      if (body.tamilName !== undefined) updateFields.tamilName = body.tamilName.trim() || undefined;
      if (body.category !== undefined) updateFields.category = body.category.trim();
      if (body.status !== undefined) updateFields.status = body.status;
      if (body.sortOrder !== undefined) updateFields.sortOrder = Number(body.sortOrder);

      const updated = await eventModel.findOneAndUpdate(
        { id },
        { $set: updateFields },
        { new: true }
      );

      if (updated) {
        return NextResponse.json(toPlainEvent(updated));
      }
    }

    // 2. Otherwise handle EventProject workflows
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

    // Check and delete from events collection if present
    const eventModel = await getEventModel();
    if (eventModel) {
      const deleteEventResult = await eventModel.deleteOne({ id });
      if (deleteEventResult.deletedCount > 0) {
        return NextResponse.json({ success: true, deletedEventId: id });
      }
    }

    // Otherwise attempt deleting event project
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
