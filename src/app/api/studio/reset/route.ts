import { NextResponse } from 'next/server';
import { resetStudioState } from '@/src/server/studioStore';

export async function POST() {
  try {
    const state = await resetStudioState();
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset studio data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
