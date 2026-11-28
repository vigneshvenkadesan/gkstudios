import { NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/src/server/adminAuth';
import {
  clearStoredGeminiApiKeyOverride,
  getStoredGeminiApiKeyOverride,
  maskApiKey,
  setStoredGeminiApiKeyOverride,
} from '@/src/server/aiSettings';

export const dynamic = 'force-dynamic';

async function buildSafeStatusPayload() {
  const overrideKey = await getStoredGeminiApiKeyOverride();
  const hasOverride = Boolean(overrideKey);
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  return {
    hasOverride,
    maskedOverrideKey: overrideKey ? maskApiKey(overrideKey) : '',
    hasEnvKey,
    activeSource: hasOverride ? ('override' as const) : hasEnvKey ? ('env' as const) : ('none' as const),
  };
}

export async function GET() {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json(await buildSafeStatusPayload());
  } catch (error) {
    console.error('Could not load studio AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to load AI settings.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Gemini API key is required.' }, { status: 400 });
    }
    const rawKey = (rawBody as { geminiApiKey?: unknown }).geminiApiKey;
    const trimmedKey = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (trimmedKey.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid Gemini API key.' },
        { status: 400 }
      );
    }

    await setStoredGeminiApiKeyOverride(trimmedKey);
    return NextResponse.json(await buildSafeStatusPayload());
  } catch (error) {
    console.error('Could not save Gemini API key override:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save API key.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  if (!(await isAuthorizedAdmin())) {
    return NextResponse.json(
      { error: 'Unauthorized. Studio staff authentication required.' },
      { status: 401 }
    );
  }

  try {
    await clearStoredGeminiApiKeyOverride();
    return NextResponse.json(await buildSafeStatusPayload());
  } catch (error) {
    console.error('Could not clear Gemini API key override:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear custom API key.' },
      { status: 500 }
    );
  }
}
