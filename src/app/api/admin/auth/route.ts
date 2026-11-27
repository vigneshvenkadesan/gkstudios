import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  isAuthorizedAdmin,
} from '@/src/server/adminAuth';

export async function GET() {
  return NextResponse.json({ authenticated: await isAuthorizedAdmin() });
}

function getCookieOptions(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || request.url.startsWith('https://');
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isHttps,
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { pin?: string };
    const providedPin = body.pin?.trim();
    const configuredPin = process.env.ADMIN_PIN;

    if (!configuredPin || !/^\d{6}$/.test(configuredPin)) {
      return NextResponse.json(
        { error: 'Admin sign-in is unavailable. Contact the administrator.' },
        { status: 503 }
      );
    }

    if (!providedPin || !/^\d{6}$/.test(providedPin) || providedPin !== configuredPin) {
      return NextResponse.json(
        { error: 'Invalid six-digit studio PIN.' },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Admin sign-in is unavailable. Contact the administrator.' },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, getCookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ authenticated: false });
  const opts = getCookieOptions(request);
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...opts,
    maxAge: 0,
  });
  return response;
}
