import { NextRequest, NextResponse } from 'next/server';
import { ingestionStore } from '@/lib/ingestion/store';
import { getAuthenticatedSession } from '@/lib/security/auth';

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session.isAuthenticated || !session.role) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || 'proj-atlas-001';

  const syncJobs = ingestionStore.getSyncJobs(projectId);
  return NextResponse.json({ syncJobs });
}
