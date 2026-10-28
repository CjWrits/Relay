export type UserRole = 'ADMIN' | 'REVIEWER' | 'INCOMING_MEMBER';

export type AccessLevel = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL';

export type VerificationStatus = 'VERIFIED' | 'UNCERTAIN' | 'CONFLICTING' | 'UNVERIFIED';

export type ClaimCategory = 
  | 'DECISION' 
  | 'TASK' 
  | 'RISK' 
  | 'DEPENDENCY' 
  | 'OWNERSHIP' 
  | 'UNRESOLVED_QUESTION';

export type InferenceType = 'DIRECT_EVIDENCE' | 'HEURISTIC' | 'LLM_INFERRED' | 'HUMAN_ENTERED';

export type SourceType = 'GITLAB' | 'GITHUB' | 'DOCUMENT' | 'TXT_UPLOAD';

export type ActivityType = 'COMMIT' | 'ISSUE' | 'MERGE_REQUEST' | 'ISSUE_COMMENT' | 'DOCUMENT_CHUNK';

export type HandoverStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACKNOWLEDGED';

export type TargetRole = 'INCOMING_DEVELOPER' | 'PROJECT_MANAGER' | 'SECURITY_LEAD';

export interface Person {
  id: string;
  name: string;
  email: string;
  gitlabUsername?: string;
  avatarUrl?: string;
  primaryRole: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  repositoryUrl: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  projectId: string;
  sourceType: SourceType;
  name: string;
  externalId?: string;
  externalUrl?: string;
  defaultAccessLevel: AccessLevel;
  lastSyncedAt?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  syncErrorMessage?: string;
  activityCount: number;
}

export interface SourceActivity {
  id: string;
  sourceId: string;
  activityType: ActivityType;
  externalReferenceId?: string;
  externalId?: string;
  title: string;
  contentBody: string;
  authorName: string;
  authorEmail?: string;
  authorId?: string;
  accessLevel: AccessLevel;
  activityTimestamp: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ClaimEvidence {
  id: string;
  claimId: string;
  activityId: string;
  excerpt: string;
  lineReference?: string;
  relevanceExplanation?: string;
  activity?: SourceActivity;
  startLine?: number;
  endLine?: number;
  exactQuote?: string;
  isTruncated?: boolean;
  sourceReference?: string;
}

export type EvidenceStrength = 'DIRECT' | 'CORROBORATED' | 'INDIRECT' | 'WEAK' | 'NONE';

export interface Claim {
  id: string;
  projectId: string;
  claimCode: string; // e.g. CLM-ATLAS-001
  claimText: string;
  category: ClaimCategory;
  verificationStatus: VerificationStatus;
  confidenceScore: number; // 0.0 to 1.0
  inferenceType: InferenceType;
  conflictNotes?: string;
  createdAt: string;
  updatedAt: string;
  evidence: ClaimEvidence[];
  evidenceStrength?: EvidenceStrength;
  analysisRunId?: string;
  sourceReference?: string;
}

export interface Decision {
  id: string;
  projectId: string;
  claimId?: string;
  title: string;
  decisionSummary: string;
  rationale: string;
  alternativesConsidered?: string;
  madeById?: string;
  madeByName?: string;
  decidedAt: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'DEPRECATED';
  evidenceCount: number;
}

export interface Task {
  id: string;
  projectId: string;
  claimId?: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'ABANDONED' | 'PENDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  assigneeName?: string;
  externalTaskUrl?: string;
  blockerReason?: string;
  createdAt: string;
}

export interface Risk {
  id: string;
  projectId: string;
  claimId?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigationStrategy?: string;
  status: 'ACTIVE' | 'MITIGATED' | 'ACCEPTED';
  identifiedAt: string;
  ownerName?: string;
  isUnresolved: boolean;
}

export interface Dependency {
  id: string;
  projectId: string;
  sourceEntityName: string;
  targetEntityName: string;
  dependencyType: 'TECHNICAL' | 'DATA' | 'OPERATIONAL' | 'TEAM';
  description?: string;
  isBlocking: boolean;
}

export interface HandoverSection {
  id: string;
  handoverId: string;
  sectionKey: string;
  title: string;
  contentMarkdown: string;
  sectionOrder: number;
}

export interface HandoverVersion {
  id: string;
  handoverId: string;
  versionNumber: number;
  changedByName: string;
  changeSummary: string;
  createdAt: string;
}

export interface Handover {
  id: string;
  projectId: string;
  title: string;
  departingMember: Person;
  incomingMember: Person;
  targetRole: TargetRole;
  status: HandoverStatus;
  scope: string;
  createdAt: string;
  updatedAt: string;
  sections?: HandoverSection[];
  versions?: HandoverVersion[];
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ContinuityBreakdown {
  overallScore: number; // 0 - 100
  factors: {
    verifiedClaimsPercent: number; // e.g. 78%
    verifiedClaimsCount: number;
    totalClaimsCount: number;
    ownershipGapsCount: number;
    unresolvedCriticalRisksCount: number;
    missingRationaleCount: number;
    pendingHandoverReviewsCount: number;
  };
  explanation: string;
}

export interface AuditLogItem {
  id: string;
  projectId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityName: string;
  timestamp: string;
}


// ============================================================================
// INGESTION & ADAPTER TYPES (PHASE 2)
// ============================================================================

export interface NormalizedActivity extends SourceActivity {
  projectId: string;
  sourceType: SourceType;
  externalId: string;
  importedAt: string;
  contentHash: string;
  originalUrl?: string;
  originalPath?: string;
}

export interface IngestionJobRecord {
  id: string;
  sourceId: string;
  projectId: string;
  startedAt: string;
  completedAt?: string;
  recordsFetched: number;
  recordsImported: number;
  duplicatesSkipped: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  details?: Record<string, unknown>;
}

export interface DocumentChunk {
  documentId: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  sectionHeading?: string;
}

// ============================================================================
// INTELLIGENCE & PROJECT MEMORY TYPES (PHASE 3)
// ============================================================================

export type EntityType =
  | 'PERSON'
  | 'PROJECT_MODULE'
  | 'DECISION'
  | 'TASK'
  | 'RISK'
  | 'DEPENDENCY'
  | 'BLOCKER'
  | 'UNRESOLVED_QUESTION'
  | 'TECHNICAL_EVENT'
  | 'OWNERSHIP_ASSIGNMENT';

export type RelationshipType =
  | 'CONTRIBUTED_TO'
  | 'OWNS'
  | 'AFFECTS'
  | 'DEPENDS_ON'
  | 'BLOCKED_BY'
  | 'RELATES_TO'
  | 'CONTRADICTS'
  | 'SUPERSEDES';

export interface ReconstructedEntity {
  id: string;
  projectId: string;
  entityType: EntityType;
  name: string;
  description: string;
  properties: Record<string, unknown>;
  sourceActivityIds: string[];
  confidence: number;
  isHypothesis: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntityRelationship {
  id: string;
  projectId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  evidenceActivityIds: string[];
  isHypothesis: boolean;
  rationale?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeGap {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: 'OWNERSHIP' | 'ARCHITECTURE' | 'OPERATIONAL' | 'DOCUMENTATION';
  affectedEntityId?: string;
  impact: string;
  sourceActivityIds: string[];
  createdAt: string;
}

export interface AnalysisRun {
  id: string;
  projectId: string;
  provider: 'DETERMINISTIC' | 'LLM_ASSISTED';
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  activitiesProcessed: number;
  entitiesDiscovered: number;
  claimsCreated: number;
  conflictsDiscovered: number;
  knowledgeGapsDiscovered: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  details?: Record<string, unknown>;
}

export interface ClaimHistoryEntry {
  id: string;
  claimId: string;
  analysisRunId: string;
  previousStatus: VerificationStatus;
  newStatus: VerificationStatus;
  reason: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  timestamp: string;
  title: string;
  description: string;
  eventType: 'COMMIT' | 'MERGE_REQUEST' | 'ISSUE' | 'DOCUMENT' | 'DECISION' | 'RISK_DISCOVERY' | 'TASK_STATE' | 'CONFLICT';
  authorName: string;
  sourceActivityId?: string;
  isAnalysisInferred: boolean;
  verificationStatus?: VerificationStatus;
  metadata?: Record<string, unknown>;
}

export interface ReconstructedProjectMemory {
  projectId: string;
  lastAnalysisRun?: AnalysisRun;
  entities: ReconstructedEntity[];
  relationships: EntityRelationship[];
  claims: Claim[];
  decisions: Decision[];
  tasks: Task[];
  risks: Risk[];
  dependencies: Dependency[];
  knowledgeGaps: KnowledgeGap[];
  timeline: TimelineEvent[];
  updatedAt: string;
}
