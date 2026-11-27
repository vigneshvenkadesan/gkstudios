import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dlwe1mqv';
  const folder = process.env.CLOUDINARY_FOLDER || 'gkstudios';
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary upload is not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' },
      { status: 503 }
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cloudName) || !/^[a-zA-Z0-9/_-]+$/.test(folder)) {
    return NextResponse.json({ error: 'Cloudinary account or folder configuration is invalid.' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Select an image file to upload.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files can be uploaded.' }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Please choose an image smaller than 4 MB.' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParameters = {
      folder,
      timestamp,
      unique_filename: 'true',
      use_filename: 'true',
    };
    const parameterString = Object.entries(signedParameters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const signature = createHash('sha1')
      .update(`${parameterString}${apiSecret}`)
      .digest('hex');
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file, file.name);
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', timestamp);
    cloudinaryForm.append('folder', folder);
    cloudinaryForm.append('unique_filename', 'true');
    cloudinaryForm.append('use_filename', 'true');
    cloudinaryForm.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    );
    const result = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      folder?: string;
      error?: { message?: string };
    };
    if (!response.ok || !result.secure_url || !result.public_id) {
      return NextResponse.json(
        { error: result.error?.message || 'Cloudinary could not upload this image.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      folder: result.folder || folder,
    });
  } catch (error) {
    console.error('Cloudinary image upload failed:', error);
    return NextResponse.json(
      { error: 'Image upload failed. Try again or use a Cloudinary image URL.' },
      { status: 500 }
    );
  }
}
