import { NextRequest, NextResponse } from 'next/server';
import { ingestionStore } from '@/lib/ingestion/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || 'proj-atlas-001';

  const syncJobs = ingestionStore.getSyncJobs(projectId);
  return NextResponse.json({ syncJobs });
}
