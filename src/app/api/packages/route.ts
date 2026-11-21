import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  createPackageOnServer,
  getPackagesFromMongo,
} from '@/src/server/studioStore';
import { StudioPackage } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === 'authenticated';
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');
    const all = searchParams.get('all') === 'true';

    let packages = await getPackagesFromMongo();

    if (eventId) {
      packages = packages.filter((pkg) => pkg.eventId === eventId);
    }

    if (!all) {
      if (status) {
        packages = packages.filter((pkg) => (pkg.status ?? 'active') === status);
      } else {
        packages = packages.filter((pkg) => (pkg.status ?? 'active') === 'active');
      }
    }

    packages.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Could not load package data:', error);
    return NextResponse.json({ error: 'Package data is currently unavailable.' }, { status: 500 });
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
    console.error('Could not create package:', error);
    const message =
      error instanceof Error &&
      (error.message === 'Package name is required.' || error.message.startsWith('Package ID "'))
        ? error.message
        : 'Could not create package. Please try again.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
