import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  addPortfolioItemOnServer,
  getPortfolioItemsFromMongo,
} from '@/src/server/studioStore';
import { EventCategory, PortfolioItem } from '@/src/types/studio';
import { normalizeImageCrop } from '@/src/lib/imageCrop';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    if (includeHidden && !(await isAuthorizedAdmin())) {
      return NextResponse.json({ error: 'Studio staff authentication required.' }, { status: 401 });
    }

    const items = await getPortfolioItemsFromMongo();
    return NextResponse.json(
      includeHidden ? items : items.filter((item) => item.isVisible)
    );
  } catch (error) {
    console.error('Could not load gallery images:', error);
    return NextResponse.json(
      { error: 'Gallery images are currently unavailable.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Gallery image details are required.' }, { status: 400 });
    }
    const body = rawBody as Partial<PortfolioItem>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    if (
      !title ||
      !category ||
      !location ||
      !imageUrl
    ) {
      return NextResponse.json(
        { error: 'Title, category, location, and image URL are required.' },
        { status: 400 }
      );
    }
    if (imageUrl.toLowerCase().startsWith('data:')) {
      return NextResponse.json(
        { error: 'Image data URLs are not supported. Upload the image to Cloudinary first.' },
        { status: 400 }
      );
    }

    const desktopCrop = normalizeImageCrop(body.desktopCrop);
    const mobileCrop = normalizeImageCrop(body.mobileCrop);

    const item: Omit<PortfolioItem, 'id'> = {
      title,
      category: category as EventCategory,
      location,
      imageUrl,
      secure_url: body.secure_url,
      public_id: body.public_id,
      folder: body.folder || 'gkstudios',
      shootNotes: body.shootNotes?.trim() || '',
      exif: body.exif?.trim() || '',
      dateLabel: body.dateLabel?.trim() || '',
      isHeroFeatured: body.isHeroFeatured === true,
      isVisible: body.isVisible !== false,
      aspect: body.aspect === 'wide' ? 'wide' : body.aspect === 'tall' ? 'tall' : 'standard',
      ...(body.eventId ? { eventId: body.eventId } : {}),
      ...(desktopCrop ? { desktopCrop } : {}),
      ...(mobileCrop ? { mobileCrop } : {}),
    };

    const result = await addPortfolioItemOnServer(item);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Could not save gallery image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save gallery image.' },
      { status: 500 }
    );
  }
}
