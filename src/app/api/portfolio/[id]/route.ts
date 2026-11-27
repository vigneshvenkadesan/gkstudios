import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  deletePortfolioItemOnServer,
  PortfolioItemNotFoundError,
  updatePortfolioItemOnServer,
} from '@/src/server/studioStore';
import { PortfolioItem } from '@/src/types/studio';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<PortfolioItem>;
    const state = await updatePortfolioItemOnServer(id, patch);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof PortfolioItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Could not update gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to update portfolio item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const state = await deletePortfolioItemOnServer(id);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof PortfolioItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Could not delete gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete portfolio item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
