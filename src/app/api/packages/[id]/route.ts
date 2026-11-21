import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  deletePackageOnServer,
  updatePackageOnServer,
} from '@/src/server/studioStore';
import { StudioPackage } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'authenticated';
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const patch = (await request.json()) as Partial<StudioPackage>;
    const state = await updatePackageOnServer(id, patch);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Could not update package:', error);
    const message =
      error instanceof Error && error.message.startsWith('Package with ID "')
        ? error.message
        : 'Could not update package. Please try again.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const PUT = PATCH;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const state = await deletePackageOnServer(id);
    return NextResponse.json(state);
  } catch (error) {
    console.error('Could not delete package:', error);
    const message =
      error instanceof Error && error.message.startsWith('Package with ID "')
        ? error.message
        : 'Could not delete package. Please try again.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
