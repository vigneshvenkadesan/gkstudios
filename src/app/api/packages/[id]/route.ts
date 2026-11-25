import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  deletePackageOnServer,
  getPackageFromMongo,
  updatePackageOnServer,
} from '@/src/server/studioStore';
import { StudioPackage } from '@/src/types/studio';
import { hasValidPackageServiceDurationTiers } from '@/src/lib/pricing';

const VALID_DURATION_TIERS = ['threeHours', 'halfDay', 'fullDay'] as const;

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pkg = await getPackageFromMongo(id);
    if (!pkg) {
      return NextResponse.json({ error: `Package with ID "${id}" not found.` }, { status: 404 });
    }
    return NextResponse.json(pkg);
  } catch (error) {
    console.error('Could not load package:', error);
    return NextResponse.json({ error: 'Package data is currently unavailable.' }, { status: 500 });
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
    const patch = (await request.json()) as Partial<StudioPackage>;
    if (
      patch.durationTier !== undefined &&
      !VALID_DURATION_TIERS.includes(patch.durationTier as (typeof VALID_DURATION_TIERS)[number])
    ) {
      return NextResponse.json(
        { error: 'durationTier must be one of: threeHours, halfDay, fullDay.' },
        { status: 400 }
      );
    }
    if (
      patch.eventSortOrder !== undefined &&
      (!Number.isInteger(patch.eventSortOrder) || patch.eventSortOrder < 1)
    ) {
      return NextResponse.json(
        { error: 'eventSortOrder must be a positive whole number.' },
        { status: 400 }
      );
    }
    if (
      !hasValidPackageServiceDurationTiers(patch.includedServices) ||
      !hasValidPackageServiceDurationTiers(patch.availableAddons)
    ) {
      return NextResponse.json(
        { error: 'Service durationTier must be threeHours, halfDay, or fullDay.' },
        { status: 400 }
      );
    }
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
