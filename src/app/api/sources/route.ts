import { NextRequest, NextResponse } from 'next/server';
import { ingestionStore } from '@/lib/ingestion/store';
import { getAuthenticatedSession, filterRestrictedActivities, canAccessSourceActivity } from '@/lib/security/auth';

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
    const sourceId = searchParams.get('sourceId') || undefined;

    const allSources = ingestionStore.getSources(projectId);
    const allActivities = ingestionStore.getActivities(projectId, sourceId);
    const storageStatus = ingestionStore.getStorageStatus();

    // Source-level permission filtering (Mandatory Improvement 1)
    const authorizedSources = allSources.filter((src) =>
      canAccessSourceActivity(session.role, src.defaultAccessLevel)
    );

    const authorizedActivities = filterRestrictedActivities(allActivities, session.role);

    return NextResponse.json({
      sources: authorizedSources,
      activities: authorizedActivities,
      storageStatus,
      userRole: session.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch sources';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
