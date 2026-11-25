import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  deleteServiceOnServer,
  getServicesFromMongo,
  updateServiceOnServer,
} from '@/src/server/studioStore';
import { StudioService } from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

function revalidateCatalogPages() {
  revalidatePath('/');
  revalidatePath('/packages');
  revalidatePath('/portfolio');
  revalidatePath('/admin/packages');
}

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const services = await getServicesFromMongo();
    const service = services.find(
      (s) => s.slug === id || s.id === id
    );

    if (!service) {
      return NextResponse.json({ error: `Service "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Could not get service:', error);
    return NextResponse.json({ error: 'Could not retrieve service.' }, { status: 500 });
  }
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
    const patch = (await request.json()) as Partial<StudioService>;
    const updated = await updateServiceOnServer(id, patch);
    revalidateCatalogPages();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Could not update service:', error);
    const message =
      error instanceof Error ? error.message : 'Could not update service.';
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
    const result = await deleteServiceOnServer(id);
    revalidateCatalogPages();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Could not delete service:', error);
    const message =
      error instanceof Error ? error.message : 'Could not delete service.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
