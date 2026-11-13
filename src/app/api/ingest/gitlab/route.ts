import { NextRequest, NextResponse } from 'next/server';
import { ingestionPipeline } from '@/lib/ingestion/pipeline';
import { UserRole } from '@/types/relay';
import { getAuthenticatedSession } from '@/lib/security/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session.isAuthenticated || !session.role) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required. Please log in.' }, { status: 401 });
    }

    const body = await req.json();
    const { projectUrlOrPath, resourceTypes, accessLevel, accessToken } = body;
    const effectiveRole = session.role;

    if (effectiveRole === 'INCOMING_MEMBER') {
      return NextResponse.json(
        { error: 'Authorization denied: Incoming members cannot trigger repository ingestion.' },
        { status: 403 }
      );
    }

    if (!projectUrlOrPath) {
      return NextResponse.json(
        { error: 'GitLab project URL or path is required (e.g. "gitlab-org/gitlab").' },
        { status: 400 }
      );
    }

    if (!resourceTypes || !Array.isArray(resourceTypes) || resourceTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one resource type must be selected (commits, issues, merge_requests, docs).' },
        { status: 400 }
      );
    }

    const report = await ingestionPipeline.ingestFromGitLab(
      {
        projectUrlOrPath,
        resourceTypes,
        defaultAccessLevel: accessLevel || 'INTERNAL',
        accessToken: accessToken ? String(accessToken).trim() : undefined,
      },
      'proj-atlas-001',
      effectiveRole
    );

    if (report.status === 'FAILED') {
      return NextResponse.json(
        { error: report.errorMessage, report },
        { status: report.errorMessage?.includes('Authorization') ? 403 : 400 }
      );
    }

    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal ingestion failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
