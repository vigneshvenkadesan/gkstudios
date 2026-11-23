import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  getBookingByProposalTokenOnServer,
  updateBookingProposalOnServer,
} from '@/src/server/studioStore';
import {
  BOOKING_SERVICE_OPTIONS,
  BookingProposalUpdate,
  BookingRequest,
  BookingServiceOption,
  DurationTier,
  OptedServiceSnapshot,
  PackageSnapshot,
  ProposalBookingView,
} from '@/src/types/studio';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';
const VALID_DURATION_TIERS = new Set<DurationTier>(['threeHours', 'halfDay', 'fullDay']);
const BOOKING_SERVICE_SET = new Set<string>(BOOKING_SERVICE_OPTIONS);

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOptedServices(value: unknown): OptedServiceSnapshot[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const snapshots: OptedServiceSnapshot[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (
      typeof item.serviceSlug !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.category !== 'string' ||
      (item.pricingType !== 'tiered' && item.pricingType !== 'per_unit') ||
      typeof item.unitLabel !== 'string' ||
      typeof item.unitPrice !== 'number' ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 0 ||
      item.quantity > 1000 ||
      typeof item.total !== 'number' ||
      !Number.isFinite(item.total) ||
      item.total < 0 ||
      (item.durationTier !== undefined && !VALID_DURATION_TIERS.has(item.durationTier as DurationTier))
    ) {
      return null;
    }
    snapshots.push(item as unknown as OptedServiceSnapshot);
  }
  return snapshots;
}

function parsePackageSnapshot(value: unknown): PackageSnapshot | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.price !== 'number' ||
    !Number.isFinite(value.price) ||
    value.price < 0 ||
    typeof value.snapshotAt !== 'string' ||
    !isRecord(value.customizerState)
  ) {
    return null;
  }

  const state = value.customizerState;
  if (
    (state.serviceDurationOverrides !== undefined &&
      (!isRecord(state.serviceDurationOverrides) ||
        Object.values(state.serviceDurationOverrides).some(
          (tier) => !VALID_DURATION_TIERS.has(tier as DurationTier)
        ))) ||
    (state.excludedIncludedIds !== undefined &&
      (!Array.isArray(state.excludedIncludedIds) ||
        state.excludedIncludedIds.some((id) => typeof id !== 'string'))) ||
    (state.selectedUpgradeIds !== undefined &&
      (!Array.isArray(state.selectedUpgradeIds) ||
        state.selectedUpgradeIds.some((id) => typeof id !== 'string'))) ||
    (state.albumSheets !== undefined &&
      (typeof state.albumSheets !== 'number' ||
        !Number.isInteger(state.albumSheets) ||
        state.albumSheets < 0 ||
        state.albumSheets > 1000)) ||
    (state.plan !== undefined && state.plan !== 'half' && state.plan !== 'full') ||
    (state.guests !== undefined && typeof state.guests !== 'string') ||
    (state.eventId !== undefined && typeof state.eventId !== 'string') ||
    (state.shootSetting !== undefined && typeof state.shootSetting !== 'string')
  ) {
    return null;
  }
  return value as unknown as PackageSnapshot;
}

function parseProposalUpdate(value: unknown): BookingProposalUpdate | null {
  if (!isRecord(value)) return null;
  const optedServices = parseOptedServices(value.optedServices);
  const packageSnapshot = parsePackageSnapshot(value.packageSnapshot);
  const requestedServices =
    Array.isArray(value.requestedServices) &&
    value.requestedServices.length <= BOOKING_SERVICE_OPTIONS.length &&
    value.requestedServices.every(
      (service) => typeof service === 'string' && BOOKING_SERVICE_SET.has(service)
    )
      ? (value.requestedServices as BookingServiceOption[])
      : null;

  if (
    typeof value.clientName !== 'string' ||
    !value.clientName.trim() ||
    value.clientName.length > 200 ||
    typeof value.phone !== 'string' ||
    !value.phone.trim() ||
    value.phone.length > 40 ||
    typeof value.eventType !== 'string' ||
    !value.eventType.trim() ||
    value.eventType.length > 120 ||
    typeof value.preferredDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.preferredDate) ||
    typeof value.venue !== 'string' ||
    !value.venue.trim() ||
    value.venue.length > 300 ||
    typeof value.packageId !== 'string' ||
    !value.packageId ||
    value.packageId.length > 128 ||
    typeof value.packageName !== 'string' ||
    !value.packageName.trim() ||
    value.packageName.length > 200 ||
    typeof value.quotedAmount !== 'number' ||
    !Number.isFinite(value.quotedAmount) ||
    value.quotedAmount < 0 ||
    value.quotedAmount > 1_000_000_000 ||
    typeof value.notes !== 'string' ||
    value.notes.length > 4000 ||
    !optedServices ||
    !packageSnapshot ||
    !requestedServices ||
    (value.durationTier !== undefined &&
      !VALID_DURATION_TIERS.has(value.durationTier as DurationTier)) ||
    (value.endDate !== undefined &&
      (typeof value.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.endDate))) ||
    (value.eventTime !== undefined &&
      (typeof value.eventTime !== 'string' || value.eventTime.length > 120)) ||
    (value.totalAmount !== undefined &&
      (typeof value.totalAmount !== 'number' ||
        !Number.isFinite(value.totalAmount) ||
        value.totalAmount < 0 ||
        value.totalAmount > 1_000_000_000)) ||
    (value.termsAccepted !== undefined && typeof value.termsAccepted !== 'boolean') ||
    (value.termsAcceptedAt !== undefined && typeof value.termsAcceptedAt !== 'string') ||
    (value.termsVersion !== undefined && typeof value.termsVersion !== 'string')
  ) {
    return null;
  }

  return {
    clientName: value.clientName.trim(),
    phone: value.phone.trim(),
    eventType: value.eventType as BookingProposalUpdate['eventType'],
    preferredDate: value.preferredDate,
    ...(typeof value.endDate === 'string' ? { endDate: value.endDate } : {}),
    ...(typeof value.eventTime === 'string' ? { eventTime: value.eventTime } : {}),
    venue: value.venue.trim(),
    packageId: value.packageId,
    packageName: value.packageName.trim(),
    quotedAmount: value.quotedAmount,
    requestedServices,
    ...(value.durationTier ? { durationTier: value.durationTier as DurationTier } : {}),
    optedServices,
    totalAmount: typeof value.totalAmount === 'number' ? value.totalAmount : value.quotedAmount,
    notes: value.notes,
    termsAccepted: value.termsAccepted === true,
    ...(typeof value.termsAcceptedAt === 'string' ? { termsAcceptedAt: value.termsAcceptedAt } : {}),
    ...(typeof value.termsVersion === 'string' ? { termsVersion: value.termsVersion } : {}),
    packageSnapshot,
  };
}

function toProposalView(booking: BookingRequest): ProposalBookingView {
  return {
    id: booking.id,
    clientName: booking.clientName,
    phone: booking.phone,
    eventType: booking.eventType,
    preferredDate: booking.preferredDate,
    ...(booking.endDate ? { endDate: booking.endDate } : {}),
    ...(booking.eventTime ? { eventTime: booking.eventTime } : {}),
    venue: booking.venue,
    packageId: booking.packageId,
    packageName: booking.packageName,
    quotedAmount: booking.quotedAmount,
    ...(booking.requestedServices ? { requestedServices: booking.requestedServices } : {}),
    ...(booking.durationTier ? { durationTier: booking.durationTier } : {}),
    ...(booking.optedServices ? { optedServices: booking.optedServices } : {}),
    ...(booking.totalAmount !== undefined ? { totalAmount: booking.totalAmount } : {}),
    notes: booking.notes,
    status: booking.status,
    ...(booking.termsAccepted !== undefined ? { termsAccepted: booking.termsAccepted } : {}),
    ...(booking.termsAcceptedAt ? { termsAcceptedAt: booking.termsAcceptedAt } : {}),
    ...(booking.termsVersion ? { termsVersion: booking.termsVersion } : {}),
    ...(booking.packageSnapshot ? { packageSnapshot: booking.packageSnapshot } : {}),
    ...(booking.proposalDraft ? { proposalDraft: booking.proposalDraft } : {}),
    ...(booking.proposalUpdatedAt ? { proposalUpdatedAt: booking.proposalUpdatedAt } : {}),
    ...(booking.proposalSubmittedAt ? { proposalSubmittedAt: booking.proposalSubmittedAt } : {}),
    ...(booking.proposalRevision !== undefined
      ? { proposalRevision: booking.proposalRevision }
      : {}),
    createdAt: booking.createdAt,
  };
}

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Proposal link not found.' }, { status: 404 });
    }
    const booking = await getBookingByProposalTokenOnServer(token);
    return NextResponse.json(
      { booking: toProposalView(booking) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load proposal.';
    const status = message === 'Proposal link not found.' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Proposal link not found.' }, { status: 404 });
    }

    const body = (await request.json()) as { actor?: unknown; proposal?: unknown };
    if (body.actor !== 'admin' && body.actor !== 'client') {
      return NextResponse.json({ error: 'Invalid proposal update source.' }, { status: 400 });
    }
    if (body.actor === 'admin' && !(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const proposal = parseProposalUpdate(body.proposal);
    if (!proposal) {
      return NextResponse.json({ error: 'Invalid proposal details.' }, { status: 400 });
    }

    const booking = await updateBookingProposalOnServer(token, proposal, body.actor);
    return NextResponse.json({ booking: toProposalView(booking) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save proposal.';
    const status =
      message === 'Proposal link not found.' || message === 'Booking request not found.'
        ? 404
        : message.includes('no longer accepting')
          ? 409
          : error instanceof SyntaxError
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
