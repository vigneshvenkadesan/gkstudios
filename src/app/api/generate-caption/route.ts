import { NextResponse } from 'next/server';
import { GoogleGenAI, MediaResolution, Type } from '@google/genai';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import { resolveEffectiveGeminiApiKey } from '@/src/server/aiSettings';
import { getEventsFromMongo } from '@/src/server/studioStore';
import {
  CoreEventCategory,
  EVENT_CATEGORIES,
  GeneratedCaptionResponse,
  normalizeEventCategory,
  PortfolioGridSizeOption,
  StudioEvent,
} from '@/src/types/studio';

export const runtime = 'nodejs';

const ALLOWED_GRID_SIZES: readonly PortfolioGridSizeOption[] = [
  'Standard (4:3)',
  'Wide (3:2)',
  'Tall (3:4)',
];

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const EVENTS_CACHE_TTL_MS = 60_000;
const GEMINI_MODEL = 'gemini-3.8-flash';

let cachedEvents: { items: StudioEvent[]; expiresAt: number } | null = null;

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

function sanitizeClientEvents(raw: unknown): StudioEvent[] {
  if (!Array.isArray(raw)) return [];
  const valid: StudioEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === 'string' ? rec.id.trim() : '';
    const name = typeof rec.name === 'string' ? rec.name.trim() : '';
    const cat = typeof rec.category === 'string' ? rec.category.trim() : 'wedding';
    if (!id || !name) continue;
    valid.push({
      id,
      name,
      tamilName: '',
      category: cat as StudioEvent['category'],
      status: 'active',
      sortOrder: valid.length + 1,
    });
  }
  return valid;
}

async function resolveEventsCatalog(clientEventsRaw: unknown): Promise<StudioEvent[]> {
  const fromClient = sanitizeClientEvents(clientEventsRaw);
  if (fromClient.length > 0) {
    return fromClient;
  }

  const now = Date.now();
  if (cachedEvents && cachedEvents.expiresAt > now) {
    return cachedEvents.items;
  }

  const dbEvents = await getEventsFromMongo({ includeInactive: false }).catch(
    () => [] as StudioEvent[]
  );
  if (dbEvents.length > 0) {
    cachedEvents = { items: dbEvents, expiresAt: now + EVENTS_CACHE_TTL_MS };
  }
  return dbEvents;
}

function buildSystemPrompt(dbEvents: StudioEvent[]): string {
  const eventsCatalog =
    dbEvents.length > 0
      ? dbEvents
          .map((ev) => `- "${ev.id}" (${ev.name})`)
          .join('\n')
      : `- "wedding" (Wedding)\n- "reception" (Reception)\n- "outdoor-shoot" (Outdoor Shoot)`;

  return `You are the creative director for GK Studios, specializing in Tamil Nadu weddings and milestone photography.

Return only valid, compact JSON—no markdown or commentary—with keys in this exact order: title, eventId, location, gridSize, featureInHero, shootNotes.

Allowed events:
${eventsCatalog}

Generate the best editorial match using the image and user context:
- title: Warm, specific, 3–7-word title. Prefer meaningful Tamil wedding or milestone phrasing when natural.
- eventId: Copy exactly one ID from the Allowed events list. Never invent or rename an ID.
- location: Infer one graceful, plausible venue or setting. Use a recognizable Tamil Nadu context only when supported; otherwise use a neutral place name.
- gridSize: Choose exactly one: "Standard (4:3)", "Wide (3:2)", or "Tall (3:4)" based on composition and subject framing.
- featureInHero: true only for a wide, high-impact image with enough visual breathing room for overlay text; otherwise false.
- shootNotes: Exactly two vivid sentences covering relevant details such as direction of light, attire or ritual, candid emotion, composition, and mood. Avoid generic filler and claims not visible or implied.

Example title: "Maalai Maatral — Sacred Muhurtham".`;
}

function normalizeGridSize(raw: unknown): PortfolioGridSizeOption {
  if (typeof raw === 'string' && ALLOWED_GRID_SIZES.includes(raw as PortfolioGridSizeOption)) {
    return raw as PortfolioGridSizeOption;
  }
  return 'Standard (4:3)';
}

function resolveMatchedEvent(
  rawEventId: unknown,
  dbEvents: StudioEvent[]
): { eventId: string; eventName: string; category: CoreEventCategory } {
  if (dbEvents.length === 0) {
    return {
      eventId: typeof rawEventId === 'string' && rawEventId.trim() ? rawEventId.trim() : 'wedding',
      eventName: 'Wedding',
      category: 'Weddings',
    };
  }

  const targetId = typeof rawEventId === 'string' ? rawEventId.trim().toLowerCase() : '';
  const exact = dbEvents.find((ev) => ev.id.toLowerCase() === targetId);
  if (exact) {
    return {
      eventId: exact.id,
      eventName: exact.name,
      category: normalizeEventCategory(exact.category),
    };
  }

  const byName = dbEvents.find((ev) => ev.name.toLowerCase() === targetId);
  if (byName) {
    return {
      eventId: byName.id,
      eventName: byName.name,
      category: normalizeEventCategory(byName.category),
    };
  }

  const fallback = dbEvents[0];
  return {
    eventId: fallback.id,
    eventName: fallback.name,
    category: normalizeEventCategory(fallback.category),
  };
}

function decodeJsonStringLiteral(rawEscaped: string): string {
  const trimmed = rawEscaped.replace(/\\$/, '');
  try {
    return JSON.parse(`"${trimmed}"`) as string;
  } catch {
    return trimmed
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

function extractPartialCaptionFields(
  rawBuffer: string,
  dbEvents: StudioEvent[]
): Partial<GeneratedCaptionResponse> {
  const patch: Partial<GeneratedCaptionResponse> = {};

  const titleMatch = rawBuffer.match(/"title"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (titleMatch?.[1]) {
    patch.title = decodeJsonStringLiteral(titleMatch[1]);
  }

  const eventMatch = rawBuffer.match(/"eventId"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (eventMatch?.[1]) {
    const matched = resolveMatchedEvent(decodeJsonStringLiteral(eventMatch[1]), dbEvents);
    patch.eventId = matched.eventId;
    patch.eventName = matched.eventName;
    patch.category = matched.category;
  }

  const locationMatch = rawBuffer.match(/"location"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (locationMatch?.[1]) {
    patch.location = decodeJsonStringLiteral(locationMatch[1]);
  }

  const gridMatch = rawBuffer.match(/"gridSize"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (gridMatch?.[1]) {
    patch.gridSize = normalizeGridSize(decodeJsonStringLiteral(gridMatch[1]));
  }

  const heroMatch = rawBuffer.match(/"featureInHero"\s*:\s*(true|false)/);
  if (heroMatch?.[1]) {
    patch.featureInHero = heroMatch[1] === 'true';
  }

  // Extract in-progress or completed shootNotes so it types live as tokens stream
  const notesMatch = rawBuffer.match(/"shootNotes"\s*:\s*"((?:\\.|[^"\\])*)"?/);
  if (notesMatch?.[1]) {
    patch.shootNotes = decodeJsonStringLiteral(notesMatch[1]);
  }

  return patch;
}

function buildFinalPayload(
  parsed: Record<string, unknown>,
  dbEvents: StudioEvent[]
): GeneratedCaptionResponse {
  const matchedEvent = resolveMatchedEvent(parsed.eventId, dbEvents);
  const category =
    typeof parsed.category === 'string' &&
    EVENT_CATEGORIES.includes(parsed.category as CoreEventCategory)
      ? (parsed.category as CoreEventCategory)
      : matchedEvent.category;

  return {
    title:
      typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim()
        : 'Timeless Studio Moment',
    eventId: matchedEvent.eventId,
    eventName: matchedEvent.eventName,
    category,
    location:
      typeof parsed.location === 'string' && parsed.location.trim()
        ? parsed.location.trim()
        : 'Tamil Nadu',
    shootNotes:
      typeof parsed.shootNotes === 'string' && parsed.shootNotes.trim()
        ? parsed.shootNotes.trim()
        : 'Captured by GK Studios documentary team with natural color grading.',
    gridSize: normalizeGridSize(parsed.gridSize),
    featureInHero: Boolean(parsed.featureInHero),
  };
}

function mapAiErrorToResponse(error: unknown): { status: number; message: string } {
  const message = error instanceof Error ? error.message : 'Failed to generate AI captions.';
  const lower = message.toLowerCase();
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission denied') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return {
      status: 401,
      message:
        'Gemini API key was rejected. Check your custom key in Gallery Manager or .env.local.',
    };
  }
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate')) {
    return {
      status: 429,
      message:
        'AI rate limit reached. Wait a moment and click Regenerate, or enter details manually.',
    };
  }
  return {
    status: 500,
    message: 'Unable to analyze image with AI right now. You can fill in the fields manually.',
  };
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';
    let orientationHint = '';
    let clientEventsRaw: unknown = null;
    let requestApiKey = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const rawHint = formData.get('dimensions');
      if (typeof rawHint === 'string' && rawHint.trim()) {
        orientationHint = rawHint.trim();
      }
      const rawCustomKey = formData.get('geminiApiKey');
      if (typeof rawCustomKey === 'string' && rawCustomKey.trim()) {
        requestApiKey = rawCustomKey.trim();
      }
      const rawEvents = formData.get('events');
      if (typeof rawEvents === 'string' && rawEvents.trim()) {
        try {
          clientEventsRaw = JSON.parse(rawEvents);
        } catch {
          clientEventsRaw = null;
        }
      }
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'An image file is required for AI analysis.' },
          { status: 400 }
        );
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 });
      }
      if (file.size > MAX_REMOTE_IMAGE_BYTES) {
        return NextResponse.json(
          { error: 'Image is too large for caption analysis.' },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = file.type || 'image/jpeg';
    } else {
      const body = (await request.json()) as {
        imageBase64?: string;
        mimeType?: string;
        imageUrl?: string;
        dimensions?: string;
        events?: unknown;
        geminiApiKey?: string;
      };

      clientEventsRaw = body.events;
      if (typeof body.dimensions === 'string' && body.dimensions.trim()) {
        orientationHint = body.dimensions.trim();
      }
      if (typeof body.geminiApiKey === 'string' && body.geminiApiKey.trim()) {
        requestApiKey = body.geminiApiKey.trim();
      }

      if (typeof body.imageBase64 === 'string' && body.imageBase64.trim()) {
        base64Data = body.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        mimeType =
          typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
            ? body.mimeType
            : 'image/jpeg';
      } else if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
        const targetUrl = body.imageUrl.trim();
        if (!isAllowedRemoteImageUrl(targetUrl)) {
          return NextResponse.json(
            { error: 'Provide a valid HTTPS image URL or choose an image file first.' },
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
          { error: 'Choose an image or provide an image URL for AI analysis.' },
          { status: 400 }
        );
      }
    }

    const { apiKey } = await resolveEffectiveGeminiApiKey(requestApiKey);
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'No Gemini API key configured. Add a custom key in Gallery Manager ("AI API Key") or set GEMINI_API_KEY in .env.local.',
        },
        { status: 503 }
      );
    }

    const dbEvents = await resolveEventsCatalog(clientEventsRaw);
    const eventEnum = dbEvents.length > 0 ? dbEvents.map((ev) => ev.id) : undefined;
    const promptText = orientationHint
      ? `Dimensions: ${orientationHint}. Generate JSON.`
      : 'Analyze frame and generate JSON.';

    const ai = new GoogleGenAI({ apiKey });
    const baseContents = [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: promptText },
        ],
      },
    ];

    const baseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        eventId: {
          type: Type.STRING,
          ...(eventEnum ? { enum: eventEnum } : {}),
        },
        location: { type: Type.STRING },
        gridSize: {
          type: Type.STRING,
          enum: [...ALLOWED_GRID_SIZES],
        },
        featureInHero: { type: Type.BOOLEAN },
        shootNotes: { type: Type.STRING },
      },
      required: ['title', 'eventId', 'location', 'gridSize', 'featureInHero', 'shootNotes'],
    };

    const fastConfig = {
      systemInstruction: buildSystemPrompt(dbEvents),
      temperature: 0.35,
      maxOutputTokens: 320,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: baseSchema,
    };

    const wantsStream = (request.headers.get('accept') || '').includes('application/x-ndjson');

    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendLine = (payload: unknown) => {
            controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
          };

          let rawBuffer = '';
          let lastEmitted = '';

          const consumeGenerator = async (
            gen: AsyncGenerator<{ text?: string }>
          ) => {
            for await (const chunk of gen) {
              const delta = chunk.text;
              if (!delta) continue;
              rawBuffer += delta;
              const patch = extractPartialCaptionFields(rawBuffer, dbEvents);
              const serialized = JSON.stringify(patch);
              if (serialized !== '{}' && serialized !== lastEmitted) {
                lastEmitted = serialized;
                sendLine({ type: 'partial', patch });
              }
            }
          };

          try {
            try {
              const gen = await ai.models.generateContentStream({
                model: GEMINI_MODEL,
                contents: baseContents,
                config: fastConfig,
              });
              await consumeGenerator(gen);
            } catch (configError) {
              const msg = configError instanceof Error ? configError.message.toLowerCase() : '';
              if (
                !rawBuffer &&
                (msg.includes('thinking') ||
                  msg.includes('media_resolution') ||
                  msg.includes('argument'))
              ) {
                const { thinkingConfig: _tc, mediaResolution: _mr, ...safeConfig } = fastConfig;
                const fallbackGen = await ai.models.generateContentStream({
                  model: GEMINI_MODEL,
                  contents: baseContents,
                  config: safeConfig,
                });
                await consumeGenerator(fallbackGen);
              } else {
                throw configError;
              }
            }

            let parsed: Record<string, unknown> = {};
            try {
              parsed = JSON.parse(rawBuffer.trim()) as Record<string, unknown>;
            } catch {
              parsed = extractPartialCaptionFields(rawBuffer, dbEvents) as Record<string, unknown>;
            }

            const finalData = buildFinalPayload(parsed, dbEvents);
            sendLine({ type: 'final', data: finalData });
          } catch (streamError) {
            console.error('Streaming AI caption failed:', streamError);
            const mapped = mapAiErrorToResponse(streamError);
            sendLine({ type: 'error', error: mapped.message, status: mapped.status });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    // Standard JSON fallback for direct API callers
    let response;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: baseContents,
        config: fastConfig,
      });
    } catch (configError) {
      const msg = configError instanceof Error ? configError.message.toLowerCase() : '';
      if (msg.includes('thinking') || msg.includes('media_resolution') || msg.includes('argument')) {
        const { thinkingConfig: _tc, mediaResolution: _mr, ...safeConfig } = fastConfig;
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: baseContents,
          config: safeConfig,
        });
      } else {
        throw configError;
      }
    }

    const rawText = response.text?.trim();
    if (!rawText) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Try again or enter details manually.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return NextResponse.json(buildFinalPayload(parsed, dbEvents));
  } catch (error) {
    console.error('AI caption generation failed:', error);
    const mapped = mapAiErrorToResponse(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
