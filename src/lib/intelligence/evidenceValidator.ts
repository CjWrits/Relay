import {
  NormalizedActivity,
  VerificationStatus,
  EvidenceStrength,
  ClaimEvidence,
  UserRole,
} from '@/types/relay';
import { CandidateEvidenceReference, EvidenceValidationResult } from './types';

export class EvidenceValidationService {
  /**
   * Validates evidence citations against real stored project activities.
   * Strictly enforces the 10 evidence integrity rules.
   */
  validateEvidence(
    candidateEvidence: CandidateEvidenceReference[],
    projectId: string,
    activitiesMap: Map<string, NormalizedActivity>,
    options?: {
      userRole?: UserRole;
      isInferred?: boolean;
      hasConflict?: boolean;
    }
  ): EvidenceValidationResult {
    const reasons: string[] = [];
    const validatedEvidence: ClaimEvidence[] = [];
    let isTruncatedSource = false;

    // Rule 5: Empty evidence array CANNOT produce VERIFIED
    if (!candidateEvidence || candidateEvidence.length === 0) {
      return {
        isValid: false,
        verificationStatus: 'UNVERIFIED',
        evidenceStrength: 'NONE',
        validatedEvidence: [],
        reasons: ['No supporting source activities provided. Claims without evidence are marked UNVERIFIED.'],
        isTruncatedSource: false,
      };
    }

    let validDirectQuotesCount = 0;
    let hasPromptInjection = false;

    for (let i = 0; i < candidateEvidence.length; i++) {
      const ev = candidateEvidence[i];
      const evId = `ev-val-${Date.now()}-${i}`;

      // Rule 1 & 4: Every activity ID must exist in current project (cannot invent source IDs)
      const activity = activitiesMap.get(ev.activityId);
      if (!activity) {
        reasons.push(`Invalid activity ID: "${ev.activityId}" does not exist in project "${projectId}".`);
        continue;
      }

      if (activity.projectId !== projectId) {
        reasons.push(`Cross-project violation: Activity "${ev.activityId}" belongs to project "${activity.projectId}", not "${projectId}".`);
        continue;
      }

      // Detect adversarial prompt injection patterns in untrusted source content
      const injectionPattern = /(?:system\s*(?:instruction|prompt)|ignore\s*(?:all\s*)?previous\s*instructions|mark\s*(?:all\s*)?claims\s*as\s*verified)/i;
      if (injectionPattern.test(activity.contentBody || '') || injectionPattern.test(ev.exactQuote || '')) {
        hasPromptInjection = true;
        reasons.push(`Adversarial prompt injection pattern detected in source activity "${ev.activityId}". Cannot grant VERIFIED status without independent verification.`);
      }

      // Rule 10: Access control filter (respect source permissions)
      if (options?.userRole === 'INCOMING_MEMBER') {
        if (activity.accessLevel === 'RESTRICTED' || activity.accessLevel === 'CONFIDENTIAL') {
          reasons.push(`Access denied: User role INCOMING_MEMBER cannot reference ${activity.accessLevel} activity "${ev.activityId}".`);
          continue;
        }
      }

      // Rule 9: Identify incomplete or truncated sources
      const isDocTruncated =
        activity.metadata?.isTruncated === true ||
        (activity.activityType === 'DOCUMENT_CHUNK' && activity.contentBody.length >= 3000);
      if (isDocTruncated) {
        isTruncatedSource = true;
      }

      // Rule 2: Quote matching verification
      const rawContent = activity.contentBody || '';
      const quoteCheck = this.verifyQuoteInContent(ev.exactQuote, rawContent);

      if (!quoteCheck.matched) {
        reasons.push(
          `Fabricated quote rejected: Quotation "${ev.exactQuote.slice(0, 40)}..." does not exist in source activity "${ev.activityId}".`
        );
        continue;
      }

      // Rule 3: Line number verification
      let lineRef = ev.sourceReference;
      if (ev.startLine !== undefined && ev.endLine !== undefined) {
        const lineValidation = this.verifyLineNumbers(ev.startLine, ev.endLine, rawContent, activity);
        if (!lineValidation.valid) {
          reasons.push(`Invalid line range: [L${ev.startLine}-L${ev.endLine}] is invalid for activity "${ev.activityId}".`);
          continue;
        }
        lineRef = lineRef || `Lines ${ev.startLine}-${ev.endLine}`;
      }

      validDirectQuotesCount++;

      validatedEvidence.push({
        id: evId,
        claimId: '', // populated when claim is saved
        activityId: activity.id,
        excerpt: ev.exactQuote,
        exactQuote: ev.exactQuote,
        lineReference: lineRef || (activity.metadata?.filePath ? `${activity.metadata.filePath}` : activity.externalId),
        startLine: ev.startLine,
        endLine: ev.endLine,
        relevanceExplanation: ev.relevanceExplanation || 'Direct textual grounding from source activity.',
        isTruncated: isDocTruncated,
        sourceReference: activity.originalUrl || activity.originalPath || activity.externalId,
        activity,
      });
    }

    // Determine verification status & evidence strength
    if (validatedEvidence.length === 0) {
      return {
        isValid: false,
        verificationStatus: 'UNVERIFIED',
        evidenceStrength: 'NONE',
        validatedEvidence: [],
        reasons: reasons.length > 0 ? reasons : ['All candidate evidence failed validation checks.'],
        isTruncatedSource,
      };
    }

    // Rule 7 & 8: Conflicting claims must remain visible and cannot be assumed VERIFIED
    if (options?.hasConflict) {
      return {
        isValid: true,
        verificationStatus: 'CONFLICTING',
        evidenceStrength: validatedEvidence.length > 1 ? 'CORROBORATED' : 'DIRECT',
        validatedEvidence,
        reasons: ['Incompatible statements found across sources. Marked CONFLICTING for human review.'],
        isTruncatedSource,
      };
    }

    // Rule 6: An inference cannot silently become a direct observation
    if (options?.isInferred) {
      return {
        isValid: true,
        verificationStatus: 'UNCERTAIN',
        evidenceStrength: 'INDIRECT',
        validatedEvidence,
        reasons: ['Claim is inferred through heuristic deduction rather than explicit direct statement.'],
        isTruncatedSource,
      };
    }

    // If source is truncated, we mark as UNCERTAIN so developers know content is partial
    if (isTruncatedSource) {
      return {
        isValid: true,
        verificationStatus: 'UNCERTAIN',
        evidenceStrength: 'WEAK',
        validatedEvidence,
        reasons: ['Supporting source activity is truncated (exceeds 3,000 char threshold). Uncertainty preserved.'],
        isTruncatedSource: true,
      };
    }

    // If adversarial prompt injection is detected, demote to UNCERTAIN
    if (hasPromptInjection) {
      return {
        isValid: true,
        verificationStatus: 'UNCERTAIN',
        evidenceStrength: 'WEAK',
        validatedEvidence,
        reasons: ['Adversarial prompt injection pattern detected in source. Marked UNCERTAIN to prevent spoofed verification.'],
        isTruncatedSource,
      };
    }

    // Verified directly
    const strength: EvidenceStrength = validDirectQuotesCount >= 2 ? 'CORROBORATED' : 'DIRECT';
    return {
      isValid: true,
      verificationStatus: 'VERIFIED',
      evidenceStrength: strength,
      validatedEvidence,
      reasons: ['Evidence verified: Exact text quotations matched with valid activity IDs.'],
      isTruncatedSource: false,
    };
  }

  /**
   * Verifies that exactQuote appears in rawContent, with whitespace normalization.
   */
  private verifyQuoteInContent(exactQuote: string, rawContent: string): { matched: boolean } {
    if (!exactQuote || exactQuote.trim().length === 0) {
      return { matched: false };
    }

    const cleanQuote = this.normalizeWhitespace(exactQuote.trim().toLowerCase());
    const cleanContent = this.normalizeWhitespace(rawContent.toLowerCase());

    // Direct substring match
    if (cleanContent.includes(cleanQuote)) {
      return { matched: true };
    }

    // Check for quote segment match if quote contains ellipses
    if (cleanQuote.includes('...')) {
      const parts = cleanQuote.split('...').map((p) => p.trim()).filter((p) => p.length > 5);
      if (parts.length > 0 && parts.every((p) => cleanContent.includes(p))) {
        return { matched: true };
      }
    }

    return { matched: false };
  }

  /**
   * Verifies line numbers make sense relative to the document or activity chunk.
   */
  private verifyLineNumbers(
    startLine: number,
    endLine: number,
    content: string,
    activity: NormalizedActivity
  ): { valid: boolean } {
    if (startLine <= 0 || endLine < startLine) {
      return { valid: false };
    }

    // If chunk metadata has explicit line bounds
    const metaStart = activity.metadata?.startLine as number | undefined;
    const metaEnd = activity.metadata?.endLine as number | undefined;

    if (metaStart !== undefined && metaEnd !== undefined) {
      // Chunk must overlap with the claimed line range
      if (startLine > metaEnd + 10 || endLine < metaStart - 10) {
        return { valid: false };
      }
    }

    const totalLines = content.split(/\r?\n/).length;
    // Allow line numbers up to chunk line count + 10 for margin
    if (startLine > totalLines + 50 && metaStart === undefined) {
      return { valid: false };
    }

    return { valid: true };
  }

  private normalizeWhitespace(str: string): string {
    return str.replace(/\s+/g, ' ');
  }
}

export const evidenceValidationService = new EvidenceValidationService();
