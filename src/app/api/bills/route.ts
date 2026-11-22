import { NextResponse } from 'next/server';
import { getBillsOnServer } from '@/src/server/studioStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('projectId') || searchParams.get('bookingId') || searchParams.get('query');
    const bills = await getBillsOnServer(queryId || undefined);
    return NextResponse.json(bills);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch bills';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
