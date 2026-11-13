import { NextRequest, NextResponse } from 'next/server';
import { intelligenceStore } from '@/lib/intelligence/store';
import { getAuthenticatedSession } from '@/lib/security/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'proj-atlas-001';

    const runs = intelligenceStore.getAnalysisRuns(projectId);
    return NextResponse.json({ success: true, runs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analysis run history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
