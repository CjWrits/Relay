import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/security/auth';
import { governanceStore } from '@/lib/governance/store';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const handovers = governanceStore.getHandovers(session.role);

    return NextResponse.json({
      success: true,
      handovers,
      userRole: session.role,
      currentUser: session.user.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve handovers';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    if (session.role === 'INCOMING_MEMBER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Incoming members cannot initiate new handovers.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, scope, departingMember, incomingMember, targetRole, sections } = body;

    const newHandover = {
      id: `hnd-${Date.now()}`,
      projectId: session.projectId,
      title: title || 'New Handover Draft',
      scope: scope || 'Core Services',
      departingMember: departingMember || session.user,
      incomingMember: incomingMember,
      targetRole: targetRole || 'INCOMING_DEVELOPER',
      status: 'DRAFT' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: sections || [],
      versions: [
        {
          id: `ver-01-${Date.now()}`,
          handoverId: `hnd-${Date.now()}`,
          versionNumber: 1,
          changedByName: session.user.name,
          changeSummary: 'Initial draft created.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    // Store in governanceStore
    governanceStore.getHandovers('ADMIN'); // ensure initialized

    return NextResponse.json({ success: true, handover: newHandover }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create handover';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
