import { NextRequest, NextResponse } from 'next/server';
import { memoryReconstructionService } from '@/lib/intelligence/reconstructionService';
import { getAuthenticatedSession } from '@/lib/security/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { projectId = 'proj-atlas-001', providerMode = 'DETERMINISTIC', incremental = false } = body;

    // Only Admin or Reviewer can initiate memory reconstruction
    if (session.role === 'INCOMING_MEMBER') {
      return NextResponse.json(
        { error: 'Authorization denied: Incoming members have read-only access and cannot trigger project memory reconstruction.' },
        { status: 403 }
      );
    }

    const report = await memoryReconstructionService.reconstructProjectMemory(projectId, {
      userRole: session.role,
      providerMode,
      incremental,
    });

    if (report.status === 'FAILED') {
      return NextResponse.json({ error: report.errorMessage, report }, { status: 500 });
    }

    return NextResponse.json({ success: true, report, userRole: session.role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal reconstruction failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
