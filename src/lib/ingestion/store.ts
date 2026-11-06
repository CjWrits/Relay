import { Source, NormalizedActivity, IngestionJobRecord } from '@/types/relay';
import { ATLAS_SOURCES, ATLAS_ACTIVITIES } from '@/data/mockAtlasData';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/client';

class IngestionStore {
  private sources: Map<string, Source> = new Map();
  private activities: Map<string, NormalizedActivity> = new Map();
  private syncJobs: IngestionJobRecord[] = [];

  constructor() {
    this.seedAtlasData();
  }

  private seedAtlasData() {
    // Seed existing Atlas sources
    for (const src of ATLAS_SOURCES) {
      this.sources.set(src.id, { ...src });
    }

    // Seed existing Atlas activities as normalized activities
    for (const act of ATLAS_ACTIVITIES) {
      const extId = act.externalReferenceId || act.id;
      const normalized: NormalizedActivity = {
        ...act,
        projectId: 'proj-atlas-001',
        sourceType: act.sourceId.includes('gitlab') ? 'GITLAB' : 'DOCUMENT',
        externalId: extId,
        importedAt: act.activityTimestamp,
        contentHash: `hash-${act.id}`,
        originalUrl: act.externalUrl,
      };
      this.activities.set(extId, normalized);
    }

    // Seed initial sync history log
    this.syncJobs.push({
      id: 'job-init-001',
      sourceId: 'src-gitlab-atlas',
      projectId: 'proj-atlas-001',
      startedAt: '2026-11-06T14:40:00Z',
      completedAt: '2026-11-06T14:45:00Z',
      recordsFetched: 18,
      recordsImported: 18,
      duplicatesSkipped: 0,
      status: 'SUCCESS',
      details: { resourceTypes: ['commits', 'issues', 'merge_requests', 'docs'] },
    });
  }

  getSources(projectId = 'proj-atlas-001'): Source[] {
    return Array.from(this.sources.values()).filter((s) => s.projectId === projectId);
  }

  getSource(sourceId: string): Source | undefined {
    return this.sources.get(sourceId);
  }

  addOrUpdateSource(source: Source): Source {
    const existing = this.sources.get(source.id);
    const updated: Source = {
      ...existing,
      ...source,
      lastSyncedAt: new Date().toISOString(),
    };
    this.sources.set(source.id, updated);
    return updated;
  }

  getActivities(projectId = 'proj-atlas-001', sourceId?: string): NormalizedActivity[] {
    const all = Array.from(this.activities.values()).filter((a) => a.projectId === projectId);
    if (sourceId) {
      return all.filter((a) => a.sourceId === sourceId);
    }
    // Return sorted newest first
    return all.sort((a, b) => new Date(b.activityTimestamp).getTime() - new Date(a.activityTimestamp).getTime());
  }

  /**
   * Persists normalized activities with deduplication based on `externalId`.
   * Returns imported activities and count of skipped duplicates.
   */
  addActivities(activities: NormalizedActivity[]): { imported: NormalizedActivity[]; duplicatesSkipped: number } {
    const imported: NormalizedActivity[] = [];
    let duplicatesSkipped = 0;

    for (const act of activities) {
      // Check if externalId already exists
      if (this.activities.has(act.externalId)) {
        duplicatesSkipped++;
      } else {
        this.activities.set(act.externalId, act);
        imported.push(act);

        // Update activity count on parent source
        const src = this.sources.get(act.sourceId);
        if (src) {
          src.activityCount = (src.activityCount || 0) + 1;
          src.lastSyncedAt = new Date().toISOString();
          src.syncStatus = 'SUCCESS';
        }
      }
    }

    return { imported, duplicatesSkipped };
  }

  /**
   * Persists normalized activities to Supabase when configured, or to the local store.
   * Throws if database persistence fails, ensuring callers never assume false persistence.
   */
  async addActivitiesAsync(
    activities: NormalizedActivity[],
    options?: { forceDbFailure?: boolean }
  ): Promise<{ imported: NormalizedActivity[]; duplicatesSkipped: number; remotePersisted: boolean }> {
    if (options?.forceDbFailure) {
      throw new Error('Database persistence failure: Supabase PostgreSQL connection refused or constraint violation');
    }

    const { imported, duplicatesSkipped } = this.addActivities(activities);

    let remotePersisted = false;
    if (isSupabaseConfigured() && imported.length > 0) {
      const client = getSupabaseAdminClient();
      if (!client) {
        throw new Error('Database persistence failure: Supabase client initialization failed despite configured environment');
      }

      const recordsToInsert = imported.map((act) => ({
        id: act.id,
        source_id: act.sourceId,
        activity_type: act.activityType,
        external_reference_id: act.externalId,
        title: act.title,
        content_body: act.contentBody,
        author_name: act.authorName,
        author_email: act.authorEmail,
        access_level: act.accessLevel,
        activity_timestamp: act.activityTimestamp,
        external_url: act.originalUrl,
        content_hash: act.contentHash,
        metadata: act.metadata || {},
      }));

      const { error } = await client.from('source_activities').upsert(recordsToInsert);
      if (error) {
        throw new Error(`Database persistence failure: ${error.message}`);
      }
      remotePersisted = true;
    }

    return { imported, duplicatesSkipped, remotePersisted };
  }

  getSyncJobs(projectId = 'proj-atlas-001'): IngestionJobRecord[] {
    return [...this.syncJobs].filter((j) => j.projectId === projectId).reverse();
  }

  addSyncJob(job: IngestionJobRecord): void {
    this.syncJobs.push(job);
  }

  getStorageStatus(): { mode: 'LOCAL_MEMORY' | 'SUPABASE_CONNECTED'; configured: boolean; message: string } {
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
    const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

    if (hasSupabaseUrl && hasSupabaseKey) {
      return {
        mode: 'SUPABASE_CONNECTED',
        configured: true,
        message: 'Connected to Supabase PostgreSQL instance with Row Level Security.',
      };
    }

    return {
      mode: 'LOCAL_MEMORY',
      configured: false,
      message: 'Operating in Local Memory Store mode (Supabase credentials not set in .env.local).',
    };
  }
}

// Global singleton instance for server runtime
const globalForStore = globalThis as unknown as { relayIngestionStore?: IngestionStore };
export const ingestionStore = globalForStore.relayIngestionStore ?? new IngestionStore();
if (process.env.NODE_ENV !== 'production') globalForStore.relayIngestionStore = ingestionStore;
