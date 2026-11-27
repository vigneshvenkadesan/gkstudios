import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  InvalidPortfolioOrderError,
  reorderPortfolioItemsOnServer,
} from '@/src/server/studioStore';

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const rawBody: unknown = await request.json();
    if (
      !rawBody ||
      typeof rawBody !== 'object' ||
      Array.isArray(rawBody)
    ) {
      return NextResponse.json({ error: 'An orderedIds array is required.' }, { status: 400 });
    }

    const orderedIds = (rawBody as Record<string, unknown>).orderedIds;
    if (
      !Array.isArray(orderedIds) ||
      !orderedIds.every((id): id is string => typeof id === 'string' && id.length > 0)
    ) {
      return NextResponse.json({ error: 'An orderedIds array is required.' }, { status: 400 });
    }

    const state = await reorderPortfolioItemsOnServer(orderedIds);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof InvalidPortfolioOrderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Could not reorder gallery images:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not reorder gallery images.' },
      { status: 500 }
    );
  }
}
