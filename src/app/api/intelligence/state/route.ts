import { NextRequest, NextResponse } from 'next/server';
import { intelligenceStore } from '@/lib/intelligence/store';
import { getAuthenticatedSession, filterRestrictedProjectMemory } from '@/lib/security/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.user || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'proj-atlas-001';

    const rawMemory = intelligenceStore.getProjectMemory(projectId);

    // Apply strict server-side security filter across all memory dimensions
    const memory = filterRestrictedProjectMemory(rawMemory, session.role);

    return NextResponse.json({
      success: true,
      memory,
      userRole: session.role,
      currentUser: session.user.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve project memory state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
