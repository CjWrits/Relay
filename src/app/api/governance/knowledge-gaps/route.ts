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
    const gaps = governanceStore.getKnowledgeGaps();
    return NextResponse.json({ success: true, knowledgeGaps: gaps });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve knowledge gaps';
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
    const { action, gapId, ownerId, ownerName, notes, resolutionEvidence } = body;

    if (session.role === 'INCOMING_MEMBER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Incoming members cannot reassign or close knowledge gaps.' },
        { status: 403 }
      );
    }

    if (action === 'ASSIGN') {
      const result = governanceStore.assignKnowledgeGap(
        gapId,
        ownerId,
        ownerName,
        session.user.name,
        notes
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, gap: result.gap });
    }

    if (action === 'RESOLVE') {
      const result = governanceStore.resolveKnowledgeGap(
        gapId,
        resolutionEvidence || 'Documented consensus',
        session.user.name,
        notes
      );
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, gap: result.gap });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: "${action}"` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Knowledge gap operation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
