import { NextRequest, NextResponse } from 'next/server';
import { intelligenceStore } from '@/lib/intelligence/store';
import { UserRole } from '@/types/relay';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'proj-atlas-001';
    const userRole = (req.headers.get('x-user-role') as UserRole) || 'ADMIN';

    const memory = intelligenceStore.getProjectMemory(projectId);

    // Apply security filter: Incoming members cannot see RESTRICTED or CONFIDENTIAL claims
    if (userRole === 'INCOMING_MEMBER') {
      memory.claims = memory.claims.filter((c) => {
        const isRestricted = c.evidence.some(
          (e) => e.activity?.accessLevel === 'RESTRICTED' || e.activity?.accessLevel === 'CONFIDENTIAL'
        );
        return !isRestricted;
      });
    }

    return NextResponse.json({ success: true, memory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve project memory state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
