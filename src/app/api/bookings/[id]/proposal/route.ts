import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import { createProposalTokenOnServer } from '@/src/server/studioStore';

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
