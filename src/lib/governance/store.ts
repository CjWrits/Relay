import {
  Handover,
  HandoverVersion,
  HandoverAcknowledgement,
  HandoverStatus,
  Claim,
  KnowledgeGap,
  AuditLogItem,
  UserRole,
} from '@/types/relay';
import {
  ATLAS_HANDOVERS,
  ATLAS_CLAIMS,
  ATLAS_UNRESOLVED_QUESTIONS,
  ATLAS_AUDIT_LOGS,
  ATLAS_PROJECT,
} from '@/data/mockAtlasData';
import { filterRestrictedClaims } from '@/lib/security/auth';

class GovernanceStore {
  private handovers: Map<string, Handover> = new Map();
  private claims: Map<string, Claim> = new Map();
  private knowledgeGaps: Map<string, KnowledgeGap> = new Map();
  private auditLogs: AuditLogItem[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.handovers.clear();
    this.claims.clear();
    this.knowledgeGaps.clear();
    this.auditLogs = [];

    // 1. Initialize Handovers
    ATLAS_HANDOVERS.forEach((h) => {
      // Clone sections and versions
      this.handovers.set(h.id, {
        ...h,
        sections: h.sections?.map((s) => ({ ...s })) || [],
        versions: h.versions?.map((v) => ({ ...v })) || [],
      });
    });

    // 2. Initialize Claims
    ATLAS_CLAIMS.forEach((c) => {
      this.claims.set(c.id, {
        ...c,
        evidence: c.evidence.map((e) => ({ ...e })),
      });
    });

    // 3. Initialize Knowledge Gaps
    ATLAS_UNRESOLVED_QUESTIONS.forEach((q) => {
      this.knowledgeGaps.set(q.id, {
        id: q.id,
        projectId: q.projectId,
        title: q.title,
        description: q.description,
        category: q.category,
        impact: q.impact,
        sourceActivityIds: q.claimId ? ['act-012', 'act-013', 'act-018'] : [],
        createdAt: '2026-11-05T14:30:00Z',
        resolutionStatus: 'OPEN',
      });
    });

    // 4. Initialize Audit Logs
    this.auditLogs = [...ATLAS_AUDIT_LOGS];
  }

  // =========================================================================
  // HANDOVER LIFECYCLE
  // =========================================================================

  public getHandovers(userRole: UserRole): Handover[] {
    const all = Array.from(this.handovers.values());

    // Incoming member can only see handovers that are SHARED or ACKNOWLEDGED
    if (userRole === 'INCOMING_MEMBER') {
      return all.filter((h) => h.status === 'SHARED' || h.status === 'ACKNOWLEDGED' || h.sharedWithRecipient);
    }

    return all;
  }

  public getHandover(id: string, userRole: UserRole): Handover | null {
    const handover = this.handovers.get(id);
    if (!handover) return null;

    if (userRole === 'INCOMING_MEMBER') {
      if (handover.status !== 'SHARED' && handover.status !== 'ACKNOWLEDGED' && !handover.sharedWithRecipient) {
        return null;
      }
    }

    return handover;
  }

  /**
   * Submits a draft handover for formal review.
   * State: DRAFT / CHANGES_REQUESTED -> UNDER_REVIEW
   */
  public submitForReview(handoverId: string, actorName: string, role: UserRole): { success: boolean; handover?: Handover; error?: string } {
    if (role === 'INCOMING_MEMBER') {
      return { success: false, error: 'Unauthorized: Incoming members cannot submit handovers for review.' };
    }

    const handover = this.handovers.get(handoverId);
    if (!handover) return { success: false, error: 'Handover not found.' };

    if (handover.status === 'UNDER_REVIEW') {
      return { success: false, error: 'Handover is already under review.' };
    }

    handover.status = 'UNDER_REVIEW';
    handover.updatedAt = new Date().toISOString();

    this.addAuditLog(actorName, 'SUBMITTED_FOR_REVIEW', 'HANDOVER', handover.title);
    return { success: true, handover };
  }

  /**
   * Approves a handover.
   * Authorized only for REVIEWER or ADMIN.
   * Creates an immutable version snapshot.
   */
  public approveHandover(
    handoverId: string,
    reviewerName: string,
    role: UserRole,
    notes?: string
  ): { success: boolean; handover?: Handover; error?: string } {
    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      return { success: false, error: 'Unauthorized: Only an authorized REVIEWER or ADMIN can approve handovers.' };
    }

    const handover = this.handovers.get(handoverId);
    if (!handover) return { success: false, error: 'Handover not found.' };

    if (handover.status === 'APPROVED' || handover.status === 'SHARED' || handover.status === 'ACKNOWLEDGED') {
      return { success: false, error: 'Handover is already approved.' };
    }

    const approvedAt = new Date().toISOString();
    handover.status = 'APPROVED';
    handover.approvedBy = reviewerName;
    handover.approvedAt = approvedAt;
    if (notes) handover.reviewNotes = notes;
    handover.updatedAt = approvedAt;

    // Create immutable version snapshot
    const currentVersions = handover.versions || [];
    const newVersionNumber = currentVersions.length + 1;
    const newVersion: HandoverVersion = {
      id: `ver-0${newVersionNumber}-${Date.now()}`,
      handoverId,
      versionNumber: newVersionNumber,
      changedByName: reviewerName,
      changeSummary: notes || `Handover formally reviewed and approved by ${reviewerName}.`,
      createdAt: approvedAt,
      snapshotSections: handover.sections?.map((s) => ({ ...s })),
      reviewStatus: 'APPROVED',
      approvedBy: reviewerName,
      approvedAt,
    };

    handover.versions = [...currentVersions, newVersion];

    this.addAuditLog(reviewerName, 'APPROVED_HANDOVER', 'HANDOVER', `${handover.title} (v${newVersionNumber})`);
    return { success: true, handover };
  }

  /**
   * Requests changes on a handover.
   * State -> CHANGES_REQUESTED
   */
  public requestChanges(
    handoverId: string,
    reviewerName: string,
    role: UserRole,
    changeNotes: string
  ): { success: boolean; handover?: Handover; error?: string } {
    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      return { success: false, error: 'Unauthorized: Only an authorized REVIEWER or ADMIN can request changes.' };
    }

    const handover = this.handovers.get(handoverId);
    if (!handover) return { success: false, error: 'Handover not found.' };

    const timestamp = new Date().toISOString();
    handover.status = 'CHANGES_REQUESTED';
    handover.reviewNotes = changeNotes;
    handover.updatedAt = timestamp;

    const currentVersions = handover.versions || [];
    const newVersionNumber = currentVersions.length + 1;
    const newVersion: HandoverVersion = {
      id: `ver-0${newVersionNumber}-${Date.now()}`,
      handoverId,
      versionNumber: newVersionNumber,
      changedByName: reviewerName,
      changeSummary: `Changes requested: ${changeNotes}`,
      createdAt: timestamp,
      snapshotSections: handover.sections?.map((s) => ({ ...s })),
      reviewStatus: 'CHANGES_REQUESTED',
    };

    handover.versions = [...currentVersions, newVersion];

    this.addAuditLog(reviewerName, 'REQUESTED_CHANGES', 'HANDOVER', `${handover.title}: ${changeNotes}`);
    return { success: true, handover };
  }

  /**
   * Shares an approved handover with the incoming member.
   * State: APPROVED -> SHARED
   */
  public shareHandover(
    handoverId: string,
    adminName: string,
    role: UserRole
  ): { success: boolean; handover?: Handover; error?: string } {
    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      return { success: false, error: 'Unauthorized: Only ADMIN or REVIEWER can share handovers.' };
    }

    const handover = this.handovers.get(handoverId);
    if (!handover) return { success: false, error: 'Handover not found.' };

    if (handover.status !== 'APPROVED' && handover.status !== 'ACKNOWLEDGED') {
      return { success: false, error: 'Cannot share handover: Must be in APPROVED status first.' };
    }

    const timestamp = new Date().toISOString();
    handover.status = handover.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'SHARED';
    handover.sharedWithRecipient = true;
    handover.sharedAt = timestamp;
    handover.updatedAt = timestamp;

    this.addAuditLog(adminName, 'SHARED_HANDOVER', 'HANDOVER', `${handover.title} shared with ${handover.incomingMember.name}`);
    return { success: true, handover };
  }

  /**
   * Formal Handover Receipt Acknowledgment by Incoming Member.
   * Survives page refresh and saves to immutable audit log.
   */
  public acknowledgeHandover(
    handoverId: string,
    recipientId: string,
    recipientName: string,
    recipientRole: string,
    comments?: string
  ): { success: boolean; acknowledgement?: HandoverAcknowledgement; error?: string } {
    const handover = this.handovers.get(handoverId);
    if (!handover) return { success: false, error: 'Handover not found.' };

    // Idempotent: If already acknowledged, return existing acknowledgement
    if (handover.acknowledgement) {
      return { success: true, acknowledgement: handover.acknowledgement };
    }

    const latestVersion = (handover.versions && handover.versions.length > 0)
      ? handover.versions[handover.versions.length - 1].versionNumber
      : 1;

    const timestamp = new Date().toISOString();
    const fingerprint = `ACK-${handoverId.substring(0, 8)}-V${latestVersion}-${Date.now().toString(36).toUpperCase()}`;

    const ack: HandoverAcknowledgement = {
      id: `ack-${Date.now()}`,
      handoverId,
      versionNumber: latestVersion,
      recipientId,
      recipientName,
      recipientRole,
      acknowledgedAt: timestamp,
      comments: comments || 'Receipt formally acknowledged in Continuation Workspace.',
      verificationFingerprint: fingerprint,
    };

    handover.status = 'ACKNOWLEDGED';
    handover.acknowledgement = ack;
    handover.updatedAt = timestamp;

    this.addAuditLog(
      recipientName,
      'ACKNOWLEDGED_HANDOVER',
      'HANDOVER',
      `${handover.title} (Fingerprint: ${fingerprint})`
    );

    return { success: true, acknowledgement: ack };
  }

  // =========================================================================
  // CLAIMS & CONFLICT ADJUDICATION
  // =========================================================================

  public getClaims(userRole: UserRole): Claim[] {
    const all = Array.from(this.claims.values());
    return filterRestrictedClaims(all, userRole);
  }

  public updateClaim(
    claimId: string,
    updates: Partial<Claim>,
    actorName: string,
    role: UserRole
  ): { success: boolean; claim?: Claim; error?: string } {
    if (role !== 'ADMIN' && role !== 'REVIEWER') {
      return { success: false, error: 'Unauthorized: Only REVIEWER or ADMIN can adjudicate claims.' };
    }

    const claim = this.claims.get(claimId);
    if (!claim) return { success: false, error: 'Claim not found.' };

    // Update dimensions while preserving original evidence
    if (updates.evidenceValidity) claim.evidenceValidity = updates.evidenceValidity;
    if (updates.claimVerification) claim.claimVerification = updates.claimVerification;
    if (updates.verificationStatus) claim.verificationStatus = updates.verificationStatus;
    if (updates.resolutionStatus) claim.resolutionStatus = updates.resolutionStatus;
    if (updates.reviewerAnnotation !== undefined) claim.reviewerAnnotation = updates.reviewerAnnotation;

    claim.adjudicatedBy = actorName;
    claim.adjudicatedAt = new Date().toISOString();
    claim.updatedAt = claim.adjudicatedAt;

    this.addAuditLog(
      actorName,
      'ADJUDICATED_CLAIM',
      'CLAIM',
      `${claim.claimCode} (${claim.resolutionStatus || 'UPDATED'})`
    );

    return { success: true, claim };
  }

  // =========================================================================
  // KNOWLEDGE GAPS WORKFLOW
  // =========================================================================

  public getKnowledgeGaps(): KnowledgeGap[] {
    return Array.from(this.knowledgeGaps.values());
  }

  public assignKnowledgeGap(
    gapId: string,
    ownerId: string,
    ownerName: string,
    actorName: string,
    notes?: string
  ): { success: boolean; gap?: KnowledgeGap; error?: string } {
    const gap = this.knowledgeGaps.get(gapId);
    if (!gap) return { success: false, error: 'Knowledge gap not found.' };

    gap.assignedOwnerId = ownerId;
    gap.assignedOwnerName = ownerName;
    gap.resolutionStatus = 'INVESTIGATING';
    if (notes) gap.reviewerNotes = notes;

    this.addAuditLog(actorName, 'ASSIGNED_KNOWLEDGE_GAP', 'KNOWLEDGE_GAP', `${gap.title} -> ${ownerName}`);
    return { success: true, gap };
  }

  public resolveKnowledgeGap(
    gapId: string,
    resolutionEvidence: string,
    actorName: string,
    notes?: string
  ): { success: boolean; gap?: KnowledgeGap; error?: string } {
    const gap = this.knowledgeGaps.get(gapId);
    if (!gap) return { success: false, error: 'Knowledge gap not found.' };

    gap.resolutionStatus = 'RESOLVED';
    gap.resolutionEvidence = resolutionEvidence;
    gap.resolvedAt = new Date().toISOString();
    if (notes) gap.reviewerNotes = notes;

    this.addAuditLog(actorName, 'RESOLVED_KNOWLEDGE_GAP', 'KNOWLEDGE_GAP', `${gap.title} with evidence: ${resolutionEvidence}`);
    return { success: true, gap };
  }

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public addAuditLog(actorName: string, action: string, entityType: string, entityName: string): void {
    const log: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: ATLAS_PROJECT.id,
      actorName,
      action,
      entityType,
      entityName,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log); // newest first
  }
}

export const governanceStore = new GovernanceStore();
