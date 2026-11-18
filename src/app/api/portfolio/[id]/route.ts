import { NextResponse } from 'next/server';
import {
  deletePortfolioItemOnServer,
  updatePortfolioItemOnServer,
} from '@/src/server/studioStore';
import { PortfolioItem } from '@/src/types/studio';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<PortfolioItem>;
    const state = await updatePortfolioItemOnServer(id, patch);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update portfolio item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const state = await deletePortfolioItemOnServer(id);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete portfolio item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
