import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/security/auth';
import { governanceStore } from '@/lib/governance/store';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.user || !session.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required. Please log in.' },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { action, notes, comments } = body;

    switch (action) {
      case 'SUBMIT_FOR_REVIEW': {
        const result = governanceStore.submitForReview(id, session.user.name, session.role);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, handover: result.handover });
      }

      case 'APPROVE': {
        const result = governanceStore.approveHandover(id, session.user.name, session.role, notes);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 403 });
        }
        return NextResponse.json({ success: true, handover: result.handover });
      }

      case 'REQUEST_CHANGES': {
        if (!notes) {
          return NextResponse.json({ success: false, error: 'Please specify the changes requested.' }, { status: 400 });
        }
        const result = governanceStore.requestChanges(id, session.user.name, session.role, notes);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 403 });
        }
        return NextResponse.json({ success: true, handover: result.handover });
      }

      case 'SHARE': {
        const result = governanceStore.shareHandover(id, session.user.name, session.role);
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, handover: result.handover });
      }

      case 'ACKNOWLEDGE': {
        const result = governanceStore.acknowledgeHandover(
          id,
          session.user.id,
          session.user.name,
          session.user.primaryRole,
          comments
        );
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, acknowledgement: result.acknowledgement });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported lifecycle action: "${action}"` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lifecycle operation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
