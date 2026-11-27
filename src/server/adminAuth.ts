import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'gk_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && Buffer.byteLength(secret, 'utf8') >= 32 ? secret : null;
}

export function createAdminSessionToken(): string | null {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = `v1.${expiresAt}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isValidAdminSessionToken(token: string | undefined): boolean {
  const secret = getAdminSessionSecret();
  if (!secret || !token) return false;

  const [version, expiryValue, signature, ...extraParts] = token.split('.');
  if (
    version !== 'v1' ||
    !expiryValue ||
    !/^\d+$/.test(expiryValue) ||
    !signature ||
    !/^[A-Za-z0-9_-]+$/.test(signature) ||
    extraParts.length > 0
  ) {
    return false;
  }

  const expiresAt = Number(expiryValue);
  const now = Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + ADMIN_SESSION_MAX_AGE_SECONDS
  ) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(`${version}.${expiryValue}`)
    .digest();
  const provided = Buffer.from(signature, 'base64url');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
