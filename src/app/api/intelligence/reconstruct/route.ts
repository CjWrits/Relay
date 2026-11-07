import { NextRequest, NextResponse } from 'next/server';
import { memoryReconstructionService } from '@/lib/intelligence/reconstructionService';
import { UserRole } from '@/types/relay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId = 'proj-atlas-001', providerMode = 'DETERMINISTIC', incremental = false } = body;
    const userRole = (req.headers.get('x-user-role') as UserRole) || body.userRole || 'ADMIN';

    // Only Admin or Reviewer can initiate memory reconstruction
    if (userRole === 'INCOMING_MEMBER') {
      return NextResponse.json(
        { error: 'Authorization denied: Incoming members have read-only access and cannot trigger project memory reconstruction.' },
        { status: 403 }
      );
    }

    const report = await memoryReconstructionService.reconstructProjectMemory(projectId, {
      userRole,
      providerMode,
      incremental,
    });

    if (report.status === 'FAILED') {
      return NextResponse.json({ error: report.errorMessage, report }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal reconstruction failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
