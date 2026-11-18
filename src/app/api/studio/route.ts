import { NextResponse } from 'next/server';
import { getStudioState } from '@/src/server/studioStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getStudioState();
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load studio state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
