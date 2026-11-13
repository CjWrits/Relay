import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession, signDemoSession, DEMO_USERS } from '@/lib/security/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    return NextResponse.json({
      success: true,
      isAuthenticated: session.isAuthenticated,
      session: session.isAuthenticated ? session : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    let targetUserId: string | null = null;

    if (userId && DEMO_USERS[userId]) {
      targetUserId = userId;
    } else if (email) {
      const foundEntry = Object.entries(DEMO_USERS).find(
        ([, val]) => val.person.email.toLowerCase() === (email || '').toLowerCase().trim()
      );
      if (foundEntry) {
        targetUserId = foundEntry[0];
      }
    }

    if (targetUserId && DEMO_USERS[targetUserId]) {
      const profile = DEMO_USERS[targetUserId];
      const signedToken = signDemoSession(targetUserId);

      const res = NextResponse.json({
        success: true,
        message: `Logged in as synthetic demo user: ${profile.person.name}`,
        session: {
          user: profile.person,
          role: profile.role,
          isAuthenticated: true,
          isSyntheticDemo: true,
        },
      });

      // Set cryptographically signed HttpOnly cookie for server validation
      res.cookies.set('relay_session', signedToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 86400,
      });

      // Set client-readable cookie for UI persona rendering
      res.cookies.set('relay_user_id', targetUserId, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 86400,
      });

      return res;
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid credentials. Please select one of the preconfigured synthetic demonstration profiles or provide valid credentials.',
      },
      { status: 401 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failure';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  res.cookies.set('relay_session', '', { path: '/', maxAge: 0, httpOnly: true });
  res.cookies.set('relay_user_id', '', { path: '/', maxAge: 0, httpOnly: false });

  return res;
}
