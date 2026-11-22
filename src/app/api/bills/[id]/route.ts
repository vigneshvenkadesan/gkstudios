import { NextResponse } from 'next/server';
import { getBillByIdOnServer } from '@/src/server/studioStore';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bill = await getBillByIdOnServer(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json(bill);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
