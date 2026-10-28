import { SourceType, AccessLevel, ActivityType, NormalizedActivity, IngestionJobRecord, DocumentChunk } from '@/types/relay';

export { type DocumentChunk };

export interface ProcessedDocumentInput {
  fileName: string;
  fileContent: string;
  fileSizeBytes: number;
  accessLevel?: AccessLevel;
}

export interface GitLabSourceConfig {
  projectUrlOrPath: string; // e.g. "gitlab-org/gitlab" or "https://gitlab.com/group/project"
  resourceTypes: ('commits' | 'issues' | 'merge_requests' | 'docs')[];
  defaultAccessLevel?: AccessLevel;
  branch?: string;
  maxItemsPerResource?: number;
  accessToken?: string; // Optional ephemeral read-only token
}

export interface DocumentUploadConfig {
  projectId: string;
  defaultAccessLevel?: AccessLevel;
  maxChunkLines?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

export interface IngestionReport {
  jobId: string;
  sourceId: string;
  projectId: string;
  sourceType: SourceType;
  startedAt: string;
  completedAt: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  recordsFetched: number;
  recordsImported: number;
  duplicatesSkipped: number;
  activities: NormalizedActivity[];
  errorMessage?: string;
}

export interface SourceAdapter<TConfig = unknown> {
  sourceType: SourceType;
  validateConfig(config: TConfig): Promise<ValidationResult>;
  fetchActivities(config: TConfig, projectId: string, sourceId: string): Promise<NormalizedActivity[]>;
}
