import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/security/auth';
import { governanceStore } from '@/lib/governance/store';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const claims = governanceStore.getClaims(session.role);

    return NextResponse.json({
      success: true,
      claims,
      userRole: session.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve claims';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.user || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { claimId, updates } = body;

    if (!claimId || !updates) {
      return NextResponse.json(
        { success: false, error: 'claimId and updates payload required' },
        { status: 400 }
      );
    }

    const result = governanceStore.updateClaim(claimId, updates, session.user.name, session.role);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, claim: result.claim });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claim adjudication failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
