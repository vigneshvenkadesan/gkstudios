import { NextResponse } from 'next/server';
import { addPortfolioItemOnServer } from '@/src/server/studioStore';
import { PortfolioItem } from '@/src/types/studio';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<PortfolioItem, 'id'>;
    if (!body.title?.trim() || !body.location?.trim() || !body.imageUrl?.trim()) {
      return NextResponse.json(
        { error: 'Title, location, and image URL are required.' },
        { status: 400 }
      );
    }
    const result = await addPortfolioItemOnServer(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add portfolio item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
