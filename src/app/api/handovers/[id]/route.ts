import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/security/auth';
import { governanceStore } from '@/lib/governance/store';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const handover = governanceStore.getHandover(id, session.role);

    if (!handover) {
      return NextResponse.json(
        { success: false, error: 'Handover not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, handover });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve handover';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
