import {
  NormalizedActivity,
  VerificationStatus,
  EvidenceStrength,
  ClaimCategory,
  InferenceType,
  EntityType,
  RelationshipType,
  ReconstructedEntity,
  EntityRelationship,
  KnowledgeGap,
  Decision,
  Task,
  Risk,
  Dependency,
  Claim,
  ClaimEvidence,
  UserRole,
} from '@/types/relay';

export interface CandidateEvidenceReference {
  activityId: string;
  exactQuote: string;
  startLine?: number;
  endLine?: number;
  sourceReference?: string;
  relevanceExplanation?: string;
}

export interface CandidateDecision {
  title: string;
  summary: string;
  rationale: string;
  alternativesConsidered?: string;
  madeByName?: string;
  decidedAt: string;
  affectedModule?: string;
  isRevised?: boolean;
  isExplicit: boolean;
  evidence: CandidateEvidenceReference[];
}

export interface CandidateTask {
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'ABANDONED' | 'PENDING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeName?: string;
  blockerReason?: string;
  externalTaskUrl?: string;
  createdAt: string;
  evidence: CandidateEvidenceReference[];
}

export interface CandidateRisk {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedModule?: string;
  triggerCondition?: string;
  potentialImpact?: string;
  suggestedMitigation?: string; // labeled recommendation
  ownerName?: string;
  identifiedAt: string;
  evidence: CandidateEvidenceReference[];
}

export interface CandidateDependency {
  sourceEntityName: string;
  targetEntityName: string;
  dependencyType: 'TECHNICAL' | 'DATA' | 'OPERATIONAL' | 'TEAM';
  description?: string;
  isBlocking: boolean;
  isHypothesis: boolean;
  evidence: CandidateEvidenceReference[];
}

export interface CandidateOwnership {
  personName: string;
  moduleOrTaskName: string;
  assignmentType: 'EXPLICIT_OWNER' | 'HISTORICAL_CONTRIBUTOR' | 'TASK_ASSIGNEE' | 'UNASSIGNED_GAP';
  evidence: CandidateEvidenceReference[];
}

export interface CandidateKnowledgeGap {
  title: string;
  description: string;
  category: 'OWNERSHIP' | 'ARCHITECTURE' | 'OPERATIONAL' | 'DOCUMENTATION';
  impact: string;
  affectedEntityName?: string;
  evidence: CandidateEvidenceReference[];
}

export interface CandidateClaim {
  claimCode?: string;
  claimText: string;
  category: ClaimCategory;
  confidenceScore: number;
  inferenceType: InferenceType;
  conflictNotes?: string;
  evidence: CandidateEvidenceReference[];
}

export interface ExtractionResult {
  entities: ReconstructedEntity[];
  decisions: CandidateDecision[];
  tasks: CandidateTask[];
  risks: CandidateRisk[];
  dependencies: CandidateDependency[];
  ownerships: CandidateOwnership[];
  knowledgeGaps: CandidateKnowledgeGap[];
  claims: CandidateClaim[];
  rawAnalysisMetadata?: Record<string, unknown>;
}

export interface ExtractionOptions {
  projectId: string;
  userRole?: UserRole;
  incrementalSince?: string;
  existingEntityIds?: Set<string>;
  forceDeterministic?: boolean;
}

export interface AnalysisProvider {
  name: string;
  providerType: 'DETERMINISTIC' | 'LLM_ASSISTED';
  isConfigured(): boolean;
  extractEntitiesAndFacts(
    activities: NormalizedActivity[],
    options: ExtractionOptions
  ): Promise<ExtractionResult>;
}

export interface EvidenceValidationResult {
  isValid: boolean;
  verificationStatus: VerificationStatus;
  evidenceStrength: EvidenceStrength;
  validatedEvidence: ClaimEvidence[];
  reasons: string[];
  isTruncatedSource: boolean;
}
