import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import { addPortfolioItemOnServer } from '@/src/server/studioStore';
import { PortfolioItem } from '@/src/types/studio';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as Omit<PortfolioItem, 'id'>;
    if (
      !body.title?.trim() ||
      !body.category ||
      !body.location?.trim() ||
      !body.imageUrl?.trim()
    ) {
      return NextResponse.json(
        { error: 'Title, category, location, and image URL are required.' },
        { status: 400 }
      );
    }
    if (body.imageUrl.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Image data URLs are not supported. Upload the image to Cloudinary first.' },
        { status: 400 }
      );
    }
    const result = await addPortfolioItemOnServer(body);
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Could not save gallery image:', error);
    const message = error instanceof Error ? error.message : 'Failed to add portfolio item';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
