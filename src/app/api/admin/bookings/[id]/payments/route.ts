import { NextResponse } from 'next/server';
import { addEventPaymentOnServer, getStudioState } from '@/src/server/studioStore';
import { PaymentMethod } from '@/src/types/studio';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      date?: string;
      label?: string;
      amount?: number;
      method?: PaymentMethod;
      referenceNote?: string;
    };

    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required.' },
        { status: 400 }
      );
    }

    const state = await getStudioState();
    const project = state.eventProjects.find(
      (p) => p.id === id || p.bookingId === id || p.referenceCode === id
    );

    if (!project) {
      return NextResponse.json(
        { error: 'Associated event project not found for payment entry.' },
        { status: 404 }
      );
    }

    const updatedState = await addEventPaymentOnServer(project.id, {
      date: body.date || new Date().toISOString().split('T')[0],
      label: body.label || 'Installment',
      amount: Number(body.amount),
      method: body.method || 'UPI / GPay',
      referenceNote: body.referenceNote,
    });

    const updatedProject = updatedState.eventProjects.find((p) => p.id === project.id);
    const lastPayment = updatedProject?.payments[updatedProject.payments.length - 1];
    const generatedBill = updatedState.bills?.find((b) => b.paymentId === lastPayment?.id);

    return NextResponse.json({
      success: true,
      payment: lastPayment,
      bill: generatedBill,
      state: updatedState,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
