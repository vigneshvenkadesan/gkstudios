import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  deletePortfolioItemOnServer,
  PortfolioItemNotFoundError,
  updatePortfolioItemOnServer,
} from '@/src/server/studioStore';
import { PortfolioItem } from '@/src/types/studio';
import { normalizeImageCrop } from '@/src/lib/imageCrop';

function getEditablePatch(body: Partial<PortfolioItem>): Partial<PortfolioItem> {
  const patch: Partial<PortfolioItem> = {};
  if (typeof body.eventId === 'string') patch.eventId = body.eventId.trim();
  if (typeof body.title === 'string') patch.title = body.title;
  if (typeof body.category === 'string') patch.category = body.category;
  if (typeof body.location === 'string') patch.location = body.location;
  if (typeof body.shootNotes === 'string') patch.shootNotes = body.shootNotes;
  if (typeof body.exif === 'string') patch.exif = body.exif;
  if (typeof body.dateLabel === 'string') patch.dateLabel = body.dateLabel;
  if (typeof body.isHeroFeatured === 'boolean') patch.isHeroFeatured = body.isHeroFeatured;
  if (typeof body.isVisible === 'boolean') patch.isVisible = body.isVisible;
  if (body.aspect === 'wide' || body.aspect === 'standard' || body.aspect === 'tall') patch.aspect = body.aspect;
  const desktopCrop = normalizeImageCrop(body.desktopCrop);
  if (desktopCrop) patch.desktopCrop = desktopCrop;
  const mobileCrop = normalizeImageCrop(body.mobileCrop);
  if (mobileCrop) patch.mobileCrop = mobileCrop;
  return patch;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Editable image details are required.' }, { status: 400 });
    }
    const body = rawBody as Partial<PortfolioItem>;
    const patch = getEditablePatch(body);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No editable image fields were provided.' }, { status: 400 });
    }
    if (patch.title !== undefined && !patch.title.trim()) {
      return NextResponse.json({ error: 'Image title cannot be empty.' }, { status: 400 });
    }

    const state = await updatePortfolioItemOnServer(id, patch);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof PortfolioItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Could not update gallery image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not update gallery image.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const state = await deletePortfolioItemOnServer(id);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(state);
  } catch (error) {
    if (error instanceof PortfolioItemNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Could not delete gallery image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not delete gallery image.' },
      { status: 500 }
    );
  }
}
