import {
  ReconstructedEntity,
  EntityRelationship,
  Claim,
  Decision,
  Task,
  Risk,
  Dependency,
  KnowledgeGap,
  AnalysisRun,
  ClaimHistoryEntry,
  TimelineEvent,
  ReconstructedProjectMemory,
} from '@/types/relay';
import {
  ATLAS_PROJECT,
  ATLAS_CLAIMS,
  ATLAS_DECISIONS,
  ATLAS_TASKS,
  ATLAS_RISKS,
  ATLAS_DEPENDENCIES,
  ATLAS_UNRESOLVED_QUESTIONS,
  ATLAS_ACTIVITIES,
  ATLAS_PEOPLE,
  ATLAS_MODULES,
} from '@/data/mockAtlasData';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/client';

class IntelligenceMemoryStore {
  private analysisRuns: AnalysisRun[] = [];
  private entities: Map<string, ReconstructedEntity> = new Map();
  private relationships: EntityRelationship[] = [];
  private claims: Map<string, Claim> = new Map();
  private decisions: Map<string, Decision> = new Map();
  private tasks: Map<string, Task> = new Map();
  private risks: Map<string, Risk> = new Map();
  private dependencies: Map<string, Dependency> = new Map();
  private knowledgeGaps: Map<string, KnowledgeGap> = new Map();
  private claimHistory: ClaimHistoryEntry[] = [];
  private timeline: TimelineEvent[] = [];
  private processedActivityHashes: Set<string> = new Set();

  constructor() {
    this.seedAtlasProjectMemory();
  }

  private seedAtlasProjectMemory() {
    const projId = ATLAS_PROJECT.id;

    // 1. Seed People Entities
    for (const p of ATLAS_PEOPLE) {
      this.entities.set(p.id, {
        id: p.id,
        projectId: projId,
        entityType: 'PERSON',
        name: p.name,
        description: `${p.primaryRole} (GitLab: @${p.gitlabUsername || 'user'})`,
        properties: { email: p.email, gitlabUsername: p.gitlabUsername, role: p.primaryRole },
        sourceActivityIds: [],
        confidence: 0.99,
        isHypothesis: false,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-11-06T15:00:00Z',
      });
    }

    // 2. Seed Module Entities
    for (const m of ATLAS_MODULES) {
      this.entities.set(m.id, {
        id: m.id,
        projectId: projId,
        entityType: 'PROJECT_MODULE',
        name: m.name,
        description: m.description,
        properties: { leadMaintainer: m.leadMaintainer, repositoryPath: m.repositoryPath },
        sourceActivityIds: [],
        confidence: 0.98,
        isHypothesis: false,
        createdAt: '2026-10-01T09:00:00Z',
        updatedAt: '2026-11-06T15:00:00Z',
      });
    }

    // 3. Seed Decisions
    for (const d of ATLAS_DECISIONS) {
      this.decisions.set(d.id, { ...d });
      this.entities.set(d.id, {
        id: d.id,
        projectId: projId,
        entityType: 'DECISION',
        name: d.title,
        description: d.decisionSummary,
        properties: { rationale: d.rationale, decidedAt: d.decidedAt, status: d.status },
        sourceActivityIds: [],
        confidence: 0.95,
        isHypothesis: false,
        createdAt: d.decidedAt,
        updatedAt: d.decidedAt,
      });
    }

    // 4. Seed Tasks
    for (const t of ATLAS_TASKS) {
      this.tasks.set(t.id, { ...t });
      this.entities.set(t.id, {
        id: t.id,
        projectId: projId,
        entityType: 'TASK',
        name: t.title,
        description: t.description || '',
        properties: { status: t.status, priority: t.priority, assigneeName: t.assigneeName },
        sourceActivityIds: [],
        confidence: 0.95,
        isHypothesis: false,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
      });
    }

    // 5. Seed Risks
    for (const r of ATLAS_RISKS) {
      this.risks.set(r.id, { ...r });
      this.entities.set(r.id, {
        id: r.id,
        projectId: projId,
        entityType: 'RISK',
        name: r.title,
        description: r.description,
        properties: { severity: r.severity, mitigation: r.mitigationStrategy, owner: r.ownerName },
        sourceActivityIds: [],
        confidence: 0.95,
        isHypothesis: false,
        createdAt: r.identifiedAt,
        updatedAt: r.identifiedAt,
      });
    }

    // 6. Seed Dependencies
    for (const dep of ATLAS_DEPENDENCIES) {
      this.dependencies.set(dep.id, { ...dep });
    }

    // 7. Seed Knowledge Gaps
    for (const q of ATLAS_UNRESOLVED_QUESTIONS) {
      this.knowledgeGaps.set(q.id, {
        id: q.id,
        projectId: projId,
        title: q.title,
        description: q.description,
        category: q.category as KnowledgeGap['category'],
        impact: q.impact,
        sourceActivityIds: [],
        createdAt: '2026-11-05T12:00:00Z',
      });
    }

    // 8. Seed Claims
    for (const c of ATLAS_CLAIMS) {
      this.claims.set(c.claimCode, { ...c });
    }

    // 9. Seed Activities hashes for incremental tracking
    for (const a of ATLAS_ACTIVITIES) {
      this.processedActivityHashes.add(a.id);
    }

    // 10. Initial Analysis Run
    this.analysisRuns.push({
      id: 'run-init-001',
      projectId: projId,
      provider: 'DETERMINISTIC',
      status: 'SUCCESS',
      activitiesProcessed: ATLAS_ACTIVITIES.length,
      entitiesDiscovered: this.entities.size,
      claimsCreated: this.claims.size,
      conflictsDiscovered: 2,
      knowledgeGapsDiscovered: this.knowledgeGaps.size,
      startedAt: '2026-11-06T15:00:00Z',
      completedAt: '2026-11-06T15:01:00Z',
      details: { note: 'Baseline deterministic memory reconstruction for Atlas.' },
    });

    // 11. Initial Timeline Events from activities
    for (const a of ATLAS_ACTIVITIES) {
      this.timeline.push({
        id: `tl-${a.id}`,
        projectId: projId,
        timestamp: a.activityTimestamp,
        title: a.title,
        description: a.contentBody.slice(0, 160),
        eventType: (a.activityType === 'DOCUMENT_CHUNK' ? 'DOCUMENT' : a.activityType) as TimelineEvent['eventType'],
        authorName: a.authorName,
        sourceActivityId: a.id,
        isAnalysisInferred: false,
      });
    }
  }

  // --- QUERY METHODS ---

  getProjectMemory(projectId = 'proj-atlas-001', authorizedProjectIds?: string[]): ReconstructedProjectMemory {
    if (authorizedProjectIds && !authorizedProjectIds.includes(projectId)) {
      throw new Error(`Unauthorized: User does not have access to project "${projectId}".`);
    }
    return {
      projectId,
      lastAnalysisRun: this.analysisRuns.filter((r) => r.projectId === projectId).reverse()[0],
      entities: Array.from(this.entities.values()).filter((e) => e.projectId === projectId),
      relationships: this.relationships.filter((r) => r.projectId === projectId),
      claims: Array.from(this.claims.values()).filter((c) => c.projectId === projectId),
      decisions: Array.from(this.decisions.values()).filter((d) => d.projectId === projectId),
      tasks: Array.from(this.tasks.values()).filter((t) => t.projectId === projectId),
      risks: Array.from(this.risks.values()).filter((r) => r.projectId === projectId),
      dependencies: Array.from(this.dependencies.values()).filter((dep) => dep.projectId === projectId),
      knowledgeGaps: Array.from(this.knowledgeGaps.values()).filter((g) => g.projectId === projectId),
      timeline: this.timeline.filter((t) => t.projectId === projectId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      updatedAt: new Date().toISOString(),
    };
  }

  getAnalysisRuns(projectId = 'proj-atlas-001'): AnalysisRun[] {
    return this.analysisRuns.filter((r) => r.projectId === projectId).reverse();
  }

  getProcessedHashes(): Set<string> {
    return this.processedActivityHashes;
  }

  // --- MUTATION METHODS (IDEMPOTENT & INCREMENTAL) ---

  recordAnalysisRun(run: AnalysisRun): void {
    this.analysisRuns.push(run);
  }

  upsertEntities(entities: ReconstructedEntity[]): void {
    for (const ent of entities) {
      this.entities.set(ent.id, ent);
    }
  }

  setRelationships(projectId: string, relationships: EntityRelationship[]): void {
    // Replace relationships for project to prevent duplicate graph edges
    this.relationships = [
      ...this.relationships.filter((r) => r.projectId !== projectId),
      ...relationships,
    ];
  }

  upsertClaims(claims: Claim[], runId: string): void {
    for (const claim of claims) {
      const existing = this.claims.get(claim.claimCode);
      if (existing) {
        if (existing.verificationStatus !== claim.verificationStatus) {
          // Record claim status change history
          this.claimHistory.push({
            id: `ch-${Date.now()}-${this.claimHistory.length}`,
            claimId: claim.id,
            analysisRunId: runId,
            previousStatus: existing.verificationStatus,
            newStatus: claim.verificationStatus,
            reason: `Re-evaluated in analysis run ${runId}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
      this.claims.set(claim.claimCode, claim);
    }
  }

  setDecisions(projectId: string, decisions: Decision[]): void {
    for (const [id, d] of Array.from(this.decisions.entries())) {
      if (d.projectId === projectId) {
        this.decisions.delete(id);
      }
    }
    for (const d of decisions) {
      this.decisions.set(d.id, d);
    }
  }

  upsertDecisions(decisions: Decision[]): void {
    for (const d of decisions) {
      this.decisions.set(d.id, d);
    }
  }

  setTasks(projectId: string, tasks: Task[]): void {
    for (const [id, t] of Array.from(this.tasks.entries())) {
      if (t.projectId === projectId) {
        this.tasks.delete(id);
      }
    }
    for (const t of tasks) {
      this.tasks.set(t.id, t);
    }
  }

  upsertTasks(tasks: Task[]): void {
    for (const t of tasks) {
      this.tasks.set(t.id, t);
    }
  }

  setRisks(projectId: string, risks: Risk[]): void {
    for (const [id, r] of Array.from(this.risks.entries())) {
      if (r.projectId === projectId) {
        this.risks.delete(id);
      }
    }
    for (const r of risks) {
      this.risks.set(r.id, r);
    }
  }

  upsertRisks(risks: Risk[]): void {
    for (const r of risks) {
      this.risks.set(r.id, r);
    }
  }

  setDependencies(projectId: string, dependencies: Dependency[]): void {
    for (const [id, d] of Array.from(this.dependencies.entries())) {
      if (d.projectId === projectId) {
        this.dependencies.delete(id);
      }
    }
    for (const d of dependencies) {
      this.dependencies.set(d.id, d);
    }
  }

  upsertDependencies(dependencies: Dependency[]): void {
    for (const d of dependencies) {
      this.dependencies.set(d.id, d);
    }
  }

  setKnowledgeGaps(projectId: string, gaps: KnowledgeGap[]): void {
    for (const [id, g] of Array.from(this.knowledgeGaps.entries())) {
      if (g.projectId === projectId) {
        this.knowledgeGaps.delete(id);
      }
    }
    for (const g of gaps) {
      this.knowledgeGaps.set(g.id, g);
    }
  }

  upsertKnowledgeGaps(gaps: KnowledgeGap[]): void {
    for (const g of gaps) {
      this.knowledgeGaps.set(g.id, g);
    }
  }

  setTimelineEvents(projectId: string, events: TimelineEvent[]): void {
    this.timeline = [
      ...this.timeline.filter((t) => t.projectId !== projectId),
      ...events,
    ];
  }

  markActivitiesProcessed(activityIds: string[]): void {
    for (const id of activityIds) {
      this.processedActivityHashes.add(id);
    }
  }

  /**
   * Persists memory state remotely to Supabase if credentials are valid.
   * Throws if configured but fails, ensuring failure is never masked.
   */
  async persistToSupabaseIfConfigured(
    run: AnalysisRun,
    options?: { forceDbFailure?: boolean }
  ): Promise<{ persistedRemotely: boolean }> {
    if (options?.forceDbFailure) {
      throw new Error('Supabase database connection failed: connection refused during memory state persistence.');
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseAdminClient();
      if (!client) {
        throw new Error('Supabase client failed initialization.');
      }

      const { error } = await client.from('analysis_runs').insert({
        id: run.id,
        project_id: run.projectId,
        provider: run.provider,
        status: run.status,
        activities_processed: run.activitiesProcessed,
        entities_discovered: run.entitiesDiscovered,
        claims_created: run.claimsCreated,
        conflicts_discovered: run.conflictsDiscovered,
        knowledge_gaps_discovered: run.knowledgeGapsDiscovered,
        started_at: run.startedAt,
        completed_at: run.completedAt,
        error_message: run.errorMessage,
        details: run.details || {},
      });

      if (error) {
        throw new Error(`Supabase persistence error: ${error.message}`);
      }

      return { persistedRemotely: true };
    }

    return { persistedRemotely: false };
  }
}

// Global singleton instance for server runtime
const globalForStore = globalThis as unknown as { relayIntelligenceStore?: IntelligenceMemoryStore };
export const intelligenceStore = globalForStore.relayIntelligenceStore ?? new IntelligenceMemoryStore();
if (process.env.NODE_ENV !== 'production') globalForStore.relayIntelligenceStore = intelligenceStore;
