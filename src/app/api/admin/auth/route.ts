import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'gk_admin_session';
const AUTHENTICATED_COOKIE_VALUE = 'admin-session-v2';

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.get(ADMIN_COOKIE)?.value === AUTHENTICATED_COOKIE_VALUE;
  return NextResponse.json({ authenticated: isAuthenticated });
}

function getCookieOptions(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const isHttps = forwardedProto === 'https' || request.url.startsWith('https://');
  return {
    httpOnly: true,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
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

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE, AUTHENTICATED_COOKIE_VALUE, getCookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ authenticated: false });
  const opts = getCookieOptions(request);
  response.cookies.set(ADMIN_COOKIE, '', {
    ...opts,
    maxAge: 0,
  });
  return response;
}
