import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  createPackageOnServer,
  getPackagesFromMongo,
} from '@/src/server/studioStore';
import { StudioPackage } from '@/src/types/studio';
import { hasValidPackageServiceDurationTiers } from '@/src/lib/pricing';

const VALID_DURATION_TIERS = ['threeHours', 'halfDay', 'fullDay'] as const;

function revalidateCatalogPages() {
  revalidatePath('/');
  revalidatePath('/packages');
  revalidatePath('/portfolio');
  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath('/admin/packages');
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
      packages = packages.filter((pkg) => pkg.displayOnPortfolio !== false);
    }

    packages.sort(
      (a, b) =>
        (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) - (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

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
    if (
      body.durationTier !== undefined &&
      !VALID_DURATION_TIERS.includes(body.durationTier as (typeof VALID_DURATION_TIERS)[number])
    ) {
      return NextResponse.json(
        { error: 'durationTier must be one of: threeHours, halfDay, fullDay.' },
        { status: 400 }
      );
    }
    if (
      body.eventSortOrder !== undefined &&
      (!Number.isInteger(body.eventSortOrder) || body.eventSortOrder < 1)
    ) {
      return NextResponse.json(
        { error: 'eventSortOrder must be a positive whole number.' },
        { status: 400 }
      );
    }
    if (
      !hasValidPackageServiceDurationTiers(body.includedServices)
    ) {
      return NextResponse.json(
        { error: 'Service durationTier must be threeHours, halfDay, or fullDay.' },
        { status: 400 }
      );
    }

    const result = await createPackageOnServer(body);
    revalidateCatalogPages();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Could not create package:', error);
    const message = error instanceof Error ? error.message : 'Could not create package.';
    const status = message.includes('already exists')
      ? 409
      : /required|must be|slug|does not exist|non-negative/i.test(message)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: 'Use an event update to change event status.' }, { status: 400 });
  } catch (error) {
    console.error('Could not handle package update:', error);
    return NextResponse.json({ error: 'Could not update packages.' }, { status: 500 });
  }
}
