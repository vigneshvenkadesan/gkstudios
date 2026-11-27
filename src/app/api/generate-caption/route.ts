import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  CoreEventCategory,
  EVENT_CATEGORIES,
  GeneratedCaptionResponse,
  PortfolioGridSizeOption,
} from '@/src/types/studio';

export const runtime = 'nodejs';

const ALLOWED_GRID_SIZES: readonly PortfolioGridSizeOption[] = [
  'Standard (4:3)',
  'Wide (3:2)',
  'Tall (3:4)',
];

const SYSTEM_PROMPT = `You are the creative director for GK Studios, a luxury South Indian wedding and milestone photography studio in Tamil Nadu.
Inspect the provided photograph and return curated editorial metadata as JSON matching the exact schema.

Rules for every field:
- "title": Warm, editorial, memorable, concise title (3 to 8 words), e.g., "Maalai Maatral Triumph — Muhurtham Moments" or "Three Hearts, One Horizon".
- "category": Choose the best matching value strictly from:
  - "Weddings"
  - "Traditional Ceremonies"
  - "Family Celebrations"
  - "Portraits & Outdoor Shoots"
  - "Corporate Events"
- "shootNotes": Write 2 to 3 vivid editorial sentences describing lighting (golden hour, brass lamp glow, hall lighting, studio strobe), framing and depth, attire or South Indian cultural rituals (Kanjeevaram silk, kasavu, veshti, floral garlands, candid family smiles, or backdrop), and emotional mood.
- "gridSize": Recommend the aspect ratio best matching the image's natural orientation and composition strictly from:
  - "Standard (4:3)"
  - "Wide (3:2)"
  - "Tall (3:4)"
- "featureInHero": Return true ONLY if the image is a spacious horizontal/scenic frame with clean negative space suitable for hero display headlines; otherwise return false.`;

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;

function isAllowedRemoteImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeCategory(raw: unknown): CoreEventCategory {
  if (typeof raw === 'string' && EVENT_CATEGORIES.includes(raw as CoreEventCategory)) {
    return raw as CoreEventCategory;
  }
  return 'Weddings';
}

function normalizeGridSize(raw: unknown): PortfolioGridSizeOption {
  if (typeof raw === 'string' && ALLOWED_GRID_SIZES.includes(raw as PortfolioGridSizeOption)) {
    return raw as PortfolioGridSizeOption;
  }
  return 'Standard (4:3)';
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'GEMINI_API_KEY is not configured in .env.local. Add it to enable AI auto-fill or enter fields manually.',
      },
      { status: 503 }
    );
  }

  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'An image file is required for AI analysis.' }, { status: 400 });
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 });
      }
      if (file.size > MAX_REMOTE_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image is too large for caption analysis.' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = file.type || 'image/jpeg';
    } else {
      const body = (await request.json()) as {
        imageBase64?: string;
        mimeType?: string;
        imageUrl?: string;
      };

      if (typeof body.imageBase64 === 'string' && body.imageBase64.trim()) {
        base64Data = body.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
          ? body.mimeType
          : 'image/jpeg';
      } else if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
        const targetUrl = body.imageUrl.trim();
        if (!isAllowedRemoteImageUrl(targetUrl)) {
          return NextResponse.json(
            { error: 'Provide a valid HTTPS image URL or upload an image file first.' },
            { status: 400 }
          );
        }
        const imgRes = await fetch(targetUrl, { signal: AbortSignal.timeout(12000) });
        if (!imgRes.ok) {
          return NextResponse.json(
            { error: `Unable to fetch the image from Cloudinary (${imgRes.status}).` },
            { status: 502 }
          );
        }
        const remoteMime = imgRes.headers.get('content-type') || '';
        if (!remoteMime.startsWith('image/')) {
          return NextResponse.json({ error: 'URL did not return a valid image.' }, { status: 400 });
        }
        const buf = await imgRes.arrayBuffer();
        if (buf.byteLength > MAX_REMOTE_IMAGE_BYTES) {
          return NextResponse.json({ error: 'Remote image exceeds 10 MB limit.' }, { status: 400 });
        }
        base64Data = Buffer.from(buf).toString('base64');
        mimeType = remoteMime.split(';')[0].trim();
      } else {
        return NextResponse.json(
          { error: 'Upload an image or provide an image URL for Gemini analysis.' },
          { status: 400 }
        );
      }
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: 'Analyze this photography portfolio frame and generate the structured metadata JSON.',
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: [...EVENT_CATEGORIES],
            },
            shootNotes: { type: Type.STRING },
            gridSize: {
              type: Type.STRING,
              enum: [...ALLOWED_GRID_SIZES],
            },
            featureInHero: { type: Type.BOOLEAN },
          },
          required: ['title', 'category', 'shootNotes', 'gridSize', 'featureInHero'],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      return NextResponse.json(
        { error: 'Gemini returned an empty response. Try again or enter details manually.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText) as Partial<GeneratedCaptionResponse>;
    const payload: GeneratedCaptionResponse = {
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Timeless Studio Moment',
      category: normalizeCategory(parsed.category),
      shootNotes:
        typeof parsed.shootNotes === 'string' && parsed.shootNotes.trim()
          ? parsed.shootNotes.trim()
          : 'Captured by GK Studios documentary team with natural color grading.',
      gridSize: normalizeGridSize(parsed.gridSize),
      featureInHero: Boolean(parsed.featureInHero),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Gemini caption generation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate AI captions.';
    const lower = message.toLowerCase();
    if (lower.includes('429') || lower.includes('quota') || lower.includes('rate')) {
      return NextResponse.json(
        {
          error:
            'Gemini AI rate limit reached. Wait a moment and click Regenerate, or enter details manually.',
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to analyze image with Gemini right now. You can fill in the fields manually.' },
      { status: 500 }
    );
  }
}
