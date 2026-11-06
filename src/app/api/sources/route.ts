import { NextRequest, NextResponse } from 'next/server';
import { ingestionStore } from '@/lib/ingestion/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || 'proj-atlas-001';
  const sourceId = searchParams.get('sourceId') || undefined;

  const sources = ingestionStore.getSources(projectId);
  const activities = ingestionStore.getActivities(projectId, sourceId);
  const storageStatus = ingestionStore.getStorageStatus();

  return NextResponse.json({
    sources,
    activities,
    storageStatus,
  });
}
