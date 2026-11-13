import { NextRequest, NextResponse } from 'next/server';
import { governanceStore } from '@/lib/governance/store';
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

    const logs = governanceStore.getAuditLogs();
    return NextResponse.json({ success: true, auditLogs: logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve audit trail';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
