import { UserRole, Source, IngestionJobRecord } from '@/types/relay';
import { GitLabSourceConfig, ProcessedDocumentInput, IngestionReport } from './types';
import { GitLabAdapter } from './adapters/gitlabAdapter';
import { DocumentAdapter } from './adapters/documentAdapter';
import { ingestionStore } from './store';
import { validateGitLabTarget } from '../security/ssrfValidator';

export class IngestionPipeline {
  private gitlabAdapter = new GitLabAdapter();
  private documentAdapter = new DocumentAdapter();

  /**
   * Orchestrates GitLab repository ingestion pipeline.
   * SOURCE -> AUTH/AUTHZ -> FETCH -> VALIDATION -> NORMALIZATION -> DEDUPLICATION -> PERSISTENCE -> REPORT
   */
  async ingestFromGitLab(
    config: GitLabSourceConfig,
    projectId = 'proj-atlas-001',
    userRole: UserRole = 'ADMIN',
    fetchFn: typeof fetch = fetch,
    options?: { forceDbFailure?: boolean }
  ): Promise<IngestionReport> {
    const startedAt = new Date().toISOString();
    const jobId = `job-gl-${Date.now()}`;

    // 1. Authorization check: Admin only for connecting / syncing sources
    if (userRole !== 'ADMIN') {
      const err = `Authorization denied: User role "${userRole}" lacks permissions to ingest external sources.`;
      this.recordFailedJob(jobId, 'unknown', projectId, startedAt, err);
      return {
        jobId,
        sourceId: 'unknown',
        projectId,
        sourceType: 'GITLAB',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: 0,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: err,
      };
    }

    // 2. Validation
    const validation = await this.gitlabAdapter.validateConfig(config);
    if (!validation.valid) {
      const err = validation.error || 'Invalid GitLab configuration.';
      this.recordFailedJob(jobId, 'unknown', projectId, startedAt, err);
      return {
        jobId,
        sourceId: 'unknown',
        projectId,
        sourceType: 'GITLAB',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: 0,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: err,
      };
    }

    const target = validateGitLabTarget(config.projectUrlOrPath);
    const sourceId = `src-gl-${target.projectPath?.replace(/[^a-zA-Z0-9_-]/g, '-') || 'default'}`;

    // 3. Register or update source in store
    const registeredSource: Source = {
      id: sourceId,
      projectId,
      sourceType: 'GITLAB',
      name: `GitLab: ${target.projectPath}`,
      externalUrl: target.normalizedUrl,
      defaultAccessLevel: config.defaultAccessLevel || 'INTERNAL',
      syncStatus: 'SYNCING',
      activityCount: 0,
    };
    ingestionStore.addOrUpdateSource(registeredSource);

    // 4. Fetch & Normalize activities
    try {
      const rawActivities = await this.gitlabAdapter.fetchActivities(config, projectId, sourceId, fetchFn);
      const recordsFetched = rawActivities.length;

      // 5. Deduplication and Persistence
      const { imported, duplicatesSkipped } = await ingestionStore.addActivitiesAsync(rawActivities, options);

      // 6. Record successful sync job in history
      const completedAt = new Date().toISOString();
      const jobRecord: IngestionJobRecord = {
        id: jobId,
        sourceId,
        projectId,
        startedAt,
        completedAt,
        recordsFetched,
        recordsImported: imported.length,
        duplicatesSkipped,
        status: 'SUCCESS',
        details: { projectPath: target.projectPath, resourceTypes: config.resourceTypes },
      };
      ingestionStore.addSyncJob(jobRecord);

      return {
        jobId,
        sourceId,
        projectId,
        sourceType: 'GITLAB',
        startedAt,
        completedAt,
        status: 'SUCCESS',
        recordsFetched,
        recordsImported: imported.length,
        duplicatesSkipped,
        activities: imported,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.recordFailedJob(jobId, sourceId, projectId, startedAt, errorMsg);

      // Update source status to FAILED
      const src = ingestionStore.getSource(sourceId);
      if (src) {
        src.syncStatus = 'FAILED';
        src.syncErrorMessage = errorMsg;
      }

      return {
        jobId,
        sourceId,
        projectId,
        sourceType: 'GITLAB',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: 0,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: errorMsg,
      };
    }
  }

  /**
   * Orchestrates Document Upload ingestion pipeline.
   * UPLOAD -> AUTH/AUTHZ -> VALIDATION -> CHUNKING -> DEDUPLICATION -> PERSISTENCE -> REPORT
   */
  async ingestFromDocuments(
    inputs: ProcessedDocumentInput[],
    projectId = 'proj-atlas-001',
    userRole: UserRole = 'ADMIN',
    options?: { forceDbFailure?: boolean }
  ): Promise<IngestionReport> {
    const startedAt = new Date().toISOString();
    const jobId = `job-doc-${Date.now()}`;

    // 1. Authorization check: Admin and Reviewer can upload docs
    if (userRole === 'INCOMING_MEMBER') {
      const err = 'Authorization denied: Incoming members cannot upload documentation sources.';
      this.recordFailedJob(jobId, 'unknown', projectId, startedAt, err);
      return {
        jobId,
        sourceId: 'unknown',
        projectId,
        sourceType: 'DOCUMENT',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: 0,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: err,
      };
    }

    // 2. Validation
    const validation = await this.documentAdapter.validateConfig(inputs);
    if (!validation.valid) {
      const err = validation.error || 'Invalid document payload.';
      this.recordFailedJob(jobId, 'unknown', projectId, startedAt, err);
      return {
        jobId,
        sourceId: 'unknown',
        projectId,
        sourceType: 'DOCUMENT',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: 0,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: err,
      };
    }

    // 3. Process each document into activities
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFetched = 0;
    const allActivities: IngestionReport['activities'] = [];

    try {
      for (const doc of inputs) {
        const sourceId = `src-doc-${this.documentAdapter.sanitizeFileName(doc.fileName).replace(/\./g, '-')}`;

        // Register document source
        const registeredSource: Source = {
          id: sourceId,
          projectId,
          sourceType: doc.fileName.endsWith('.txt') ? 'TXT_UPLOAD' : 'DOCUMENT',
          name: doc.fileName,
          externalUrl: `/uploads/${this.documentAdapter.sanitizeFileName(doc.fileName)}`,
          defaultAccessLevel: doc.accessLevel || 'INTERNAL',
          syncStatus: 'SYNCING',
          activityCount: 0,
        };
        ingestionStore.addOrUpdateSource(registeredSource);

        const chunks = await this.documentAdapter.fetchActivities([doc], projectId, sourceId);
        totalFetched += chunks.length;

        const { imported, duplicatesSkipped } = await ingestionStore.addActivitiesAsync(chunks, options);
        totalImported += imported.length;
        totalSkipped += duplicatesSkipped;
        allActivities.push(...imported);
      }

      const completedAt = new Date().toISOString();
      const jobRecord: IngestionJobRecord = {
        id: jobId,
        sourceId: 'batch-documents',
        projectId,
        startedAt,
        completedAt,
        recordsFetched: totalFetched,
        recordsImported: totalImported,
        duplicatesSkipped: totalSkipped,
        status: 'SUCCESS',
        details: { documentCount: inputs.length },
      };
      ingestionStore.addSyncJob(jobRecord);

      return {
        jobId,
        sourceId: 'batch-documents',
        projectId,
        sourceType: 'DOCUMENT',
        startedAt,
        completedAt,
        status: 'SUCCESS',
        recordsFetched: totalFetched,
        recordsImported: totalImported,
        duplicatesSkipped: totalSkipped,
        activities: allActivities,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.recordFailedJob(jobId, 'batch-documents', projectId, startedAt, errorMsg);

      return {
        jobId,
        sourceId: 'batch-documents',
        projectId,
        sourceType: 'DOCUMENT',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'FAILED',
        recordsFetched: totalFetched,
        recordsImported: 0,
        duplicatesSkipped: 0,
        activities: [],
        errorMessage: errorMsg,
      };
    }
  }

  private recordFailedJob(
    jobId: string,
    sourceId: string,
    projectId: string,
    startedAt: string,
    errorMessage: string
  ) {
    ingestionStore.addSyncJob({
      id: jobId,
      sourceId,
      projectId,
      startedAt,
      completedAt: new Date().toISOString(),
      recordsFetched: 0,
      recordsImported: 0,
      duplicatesSkipped: 0,
      status: 'FAILED',
      errorMessage,
    });
  }
}

export const ingestionPipeline = new IngestionPipeline();
