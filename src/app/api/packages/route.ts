import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createPackageOnServer, getStudioState } from '@/src/server/studioStore';
import { StudioPackage } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'authenticated';
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getStudioState();
    return NextResponse.json(state.packages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch packages';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

    const body = (await request.json()) as Partial<StudioPackage>;
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Package name is required.' },
        { status: 400 }
      );
    }

    const result = await createPackageOnServer(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create package';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
