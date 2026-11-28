import { getStudioSettingModel } from '@/src/server/mongodb';

const GEMINI_KEY_SETTING = 'gemini_api_key';
const CACHE_TTL_MS = 30_000;

let cachedOverride: { value: string | null; expiresAt: number } | null = null;

export function maskApiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export async function getStoredGeminiApiKeyOverride(): Promise<string | null> {
  const now = Date.now();
  if (cachedOverride && cachedOverride.expiresAt > now) {
    return cachedOverride.value;
  }

  try {
    const model = await getStudioSettingModel();
    if (!model) {
      return cachedOverride?.value ?? null;
    }

    const doc = await model
      .findOne({ key: GEMINI_KEY_SETTING })
      .select({ value: 1 })
      .lean()
      .exec();
    const val =
      doc && typeof doc.value === 'string' && doc.value.trim() ? doc.value.trim() : null;
    cachedOverride = { value: val, expiresAt: now + CACHE_TTL_MS };
    return val;
  } catch (error) {
    console.warn('Could not read stored Gemini API key setting:', error);
    return cachedOverride?.value ?? null;
  }
}

export async function setStoredGeminiApiKeyOverride(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    await clearStoredGeminiApiKeyOverride();
    return;
  }

  const model = await getStudioSettingModel();
  if (model) {
    await model
      .findOneAndUpdate(
        { key: GEMINI_KEY_SETTING },
        { $set: { key: GEMINI_KEY_SETTING, value: trimmed } },
        { upsert: true, new: true }
      )
      .exec();
  }
  cachedOverride = { value: trimmed, expiresAt: Date.now() + CACHE_TTL_MS };
}

export async function clearStoredGeminiApiKeyOverride(): Promise<void> {
  const model = await getStudioSettingModel();
  if (model) {
    await model.deleteOne({ key: GEMINI_KEY_SETTING }).exec();
  }
  cachedOverride = { value: null, expiresAt: Date.now() + CACHE_TTL_MS };
}

export async function resolveEffectiveGeminiApiKey(requestKey?: string | null): Promise<{
  apiKey: string | null;
  source: 'request' | 'override' | 'env' | 'none';
}> {
  const explicitKey = typeof requestKey === 'string' ? requestKey.trim() : '';
  if (explicitKey) {
    return { apiKey: explicitKey, source: 'request' };
  }

  const overrideKey = await getStoredGeminiApiKeyOverride();
  if (overrideKey) {
    return { apiKey: overrideKey, source: 'override' };
  }

  const envKey = process.env.GEMINI_API_KEY?.trim() || '';
  if (envKey) {
    return { apiKey: envKey, source: 'env' };
  }

  return { apiKey: null, source: 'none' };
}
