import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import { reorderPackagesOnServer } from '@/src/server/studioStore';

export async function POST(request: Request) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { eventId, orderedIds } = (await request.json()) as {
      eventId?: string;
      orderedIds?: string[];
    };
    if (typeof eventId !== 'string' || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'eventId and orderedIds array are required.' },
        { status: 400 }
      );
    }

    const state = await reorderPackagesOnServer(eventId, orderedIds);
    revalidatePath('/');
    revalidatePath('/packages');
    revalidatePath('/portfolio');
    revalidatePath('/admin');
    revalidatePath('/admin/events');
    revalidatePath('/admin/packages');
    return NextResponse.json(state);
  } catch (error) {
    console.error('Could not reorder packages:', error);
    const message = error instanceof Error ? error.message : 'Could not reorder packages.';
    return NextResponse.json(
      { error: message },
      { status: message.includes('must belong') ? 400 : 500 }
    );
  }
}
