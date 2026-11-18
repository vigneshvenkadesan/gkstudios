import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_COOKIE = 'gk_admin_session';
const VALID_PIN = process.env.ADMIN_PIN || '1234';

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(ADMIN_COOKIE)?.value === 'authenticated';
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
    const body = (await request.json()) as { pin?: string; demo?: boolean };
    const providedPin = body.pin?.trim();

    if (!body.demo && providedPin !== VALID_PIN) {
      return NextResponse.json(
        { error: 'Invalid studio PIN. Use 1234 or Demo Admin Login.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE, 'authenticated', getCookieOptions(request));
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
