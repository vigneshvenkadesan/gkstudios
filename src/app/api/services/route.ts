import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getServicesFromMongo,
  saveServiceOnServer,
} from '@/src/server/studioStore';
import { StudioService } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';

    let services = await getServicesFromMongo();

    if (category) {
      services = services.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (!all) {
      services = services.filter((s) => s.isActive);
    }

    services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    return NextResponse.json(services);
  } catch (error) {
    console.error('Could not load services data:', error);
    return NextResponse.json({ error: 'Service data is currently unavailable.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<StudioService>;
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Service name is required.' },
        { status: 400 }
      );
    }

    const result = await saveServiceOnServer(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Could not save service:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save service.' },
      { status: 400 }
    );
  }
}
