import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createProposalTokenOnServer } from '@/src/server/studioStore';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized. Studio staff authentication required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const proposalToken = await createProposalTokenOnServer(id);
    return NextResponse.json({ proposalToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create proposal link.';
    const status =
      message === 'Booking request not found.'
        ? 404
        : message.includes('no longer accepting')
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
