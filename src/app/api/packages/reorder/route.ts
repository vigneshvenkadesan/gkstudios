import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { reorderPackagesOnServer } from '@/src/server/studioStore';

const ADMIN_COOKIE = 'gk_admin_session';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'authenticated';
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { orderedIds } = (await request.json()) as { orderedIds?: string[] };
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    const state = await reorderPackagesOnServer(orderedIds);
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder packages';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
