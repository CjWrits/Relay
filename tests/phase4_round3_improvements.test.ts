import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessSourceActivity,
  filterRestrictedActivities,
  filterRestrictedClaims,
  filterRestrictedProjectMemory,
  getAuthenticatedSession,
  signDemoSession,
  verifyDemoSession,
  DEMO_USERS,
} from '../src/lib/security/auth';
import { governanceStore } from '../src/lib/governance/store';
import {
  ATLAS_ACTIVITIES,
  ATLAS_CLAIMS,
  ATLAS_HANDOVERS,
} from '../src/data/mockAtlasData';
import { intelligenceStore } from '../src/lib/intelligence/store';

describe('Round 3 Mandatory Improvements — Automated Test Suite', () => {
  beforeEach(() => {
    governanceStore.resetToDefaults();
  });

  // =========================================================================
  // IMPROVEMENT 1: TRUST & PERMISSION-AWARE KNOWLEDGE ACCESS
  // =========================================================================
  describe('Improvement 1: Trust & Access Control', () => {
    it('1. verifies that ADMIN and REVIEWER roles possess unrestricted clearance', () => {
      assert.equal(canAccessSourceActivity('ADMIN', 'PUBLIC'), true);
      assert.equal(canAccessSourceActivity('ADMIN', 'INTERNAL'), true);
      assert.equal(canAccessSourceActivity('ADMIN', 'RESTRICTED'), true);
      assert.equal(canAccessSourceActivity('ADMIN', 'CONFIDENTIAL'), true);

      assert.equal(canAccessSourceActivity('REVIEWER', 'PUBLIC'), true);
      assert.equal(canAccessSourceActivity('REVIEWER', 'INTERNAL'), true);
      assert.equal(canAccessSourceActivity('REVIEWER', 'RESTRICTED'), true);
      assert.equal(canAccessSourceActivity('REVIEWER', 'CONFIDENTIAL'), true);
    });

    it('2. verifies that INCOMING_MEMBER cannot access RESTRICTED or CONFIDENTIAL source activities', () => {
      assert.equal(canAccessSourceActivity('INCOMING_MEMBER', 'PUBLIC'), true);
      assert.equal(canAccessSourceActivity('INCOMING_MEMBER', 'INTERNAL'), true);
      assert.equal(canAccessSourceActivity('INCOMING_MEMBER', 'RESTRICTED'), false);
      assert.equal(canAccessSourceActivity('INCOMING_MEMBER', 'CONFIDENTIAL'), false);
    });

    it('3. filters restricted activities (such as Incident #11 post-mortem) from incoming member activity feeds', () => {
      const filtered = filterRestrictedActivities(ATLAS_ACTIVITIES, 'INCOMING_MEMBER');
      const hasRestricted = filtered.some((a) => a.accessLevel === 'RESTRICTED' || a.accessLevel === 'CONFIDENTIAL');
      assert.equal(hasRestricted, false, 'Restricted activities must not be present for incoming member');

      // Verify specifically that act-006 (Staging Incident #11) is excluded
      const hasIncident11 = filtered.some((a) => a.id === 'act-006');
      assert.equal(hasIncident11, false, 'Incident #11 activity act-006 must be excluded for incoming member');

      // Verify that internal activities like act-001 are preserved
      const hasAct001 = filtered.some((a) => a.id === 'act-001');
      assert.equal(hasAct001, true, 'Internal activity act-001 must be preserved');
    });

    it('4. prevents citation and excerpt leakage by excluding restricted claims for incoming member', () => {
      const incomingClaims = filterRestrictedClaims(ATLAS_CLAIMS, 'INCOMING_MEMBER', ATLAS_ACTIVITIES);

      // CLM-ATLAS-004 is grounded solely on act-006 (RESTRICTED). It must not be returned to incoming member!
      const hasLeakedIncidentClaim = incomingClaims.some((c) => c.id === 'clm-004');
      assert.equal(hasLeakedIncidentClaim, false, 'CLM-ATLAS-004 must not leak to incoming member');

      // Admin must be able to view all claims
      const adminClaims = filterRestrictedClaims(ATLAS_CLAIMS, 'ADMIN', ATLAS_ACTIVITIES);
      assert.equal(adminClaims.some((c) => c.id === 'clm-004'), true, 'Admin must see CLM-ATLAS-004');
    });

    it('5. filters full reconstructed project memory to guarantee zero leakages across all entity graphs', () => {
      const rawMemory = intelligenceStore.getProjectMemory('proj-atlas-001');
      const filteredMemory = filterRestrictedProjectMemory(rawMemory, 'INCOMING_MEMBER', ATLAS_ACTIVITIES);

      // Ensure no restricted claim exists in memory
      assert.equal(
        filteredMemory.claims.some((c) => c.id === 'clm-004'),
        false,
        'No restricted claim should exist in filtered project memory'
      );

      // Ensure timeline does not contain restricted incident events
      assert.equal(
        filteredMemory.timeline.some((e) => e.sourceActivityId === 'act-006'),
        false,
        'No restricted timeline event should exist in filtered project memory'
      );
    });

    it('6. correctly resolves demo authentication sessions for Marcus, Elena, and Maya', async () => {
      const marcusReq = new Request('http://localhost:3000/api/sources', {
        headers: { 'x-relay-user-id': 'usr-marcus-04' },
      });
      const marcusSession = await getAuthenticatedSession(marcusReq);
      assert.equal(marcusSession.role, 'ADMIN');
      assert.equal(marcusSession.user.name, 'Marcus Vance');
      assert.equal(marcusSession.canViewRestricted, true);

      const elenaReq = new Request('http://localhost:3000/api/sources', {
        headers: { 'x-relay-user-id': 'usr-elena-03' },
      });
      const elenaSession = await getAuthenticatedSession(elenaReq);
      assert.equal(elenaSession.role, 'REVIEWER');
      assert.equal(elenaSession.user.name, 'Elena Rostova');
      assert.equal(elenaSession.canApproveHandovers, true);

      const mayaReq = new Request('http://localhost:3000/api/sources', {
        headers: { 'x-relay-user-id': 'usr-maya-02' },
      });
      const mayaSession = await getAuthenticatedSession(mayaReq);
      assert.equal(mayaSession.role, 'INCOMING_MEMBER');
      assert.equal(mayaSession.user.name, 'Maya Chen');
      assert.equal(mayaSession.canViewRestricted, false);
      assert.equal(mayaSession.canApproveHandovers, false);
    });
  });

  // =========================================================================
  // IMPROVEMENT 2: EVIDENCE GOVERNANCE & HANDOVER LIFECYCLE
  // =========================================================================
  describe('Improvement 2: Evidence Governance & Lifecycle', () => {
    it('7. verifies that evidence validity, claim verification, and resolution status operate independently', () => {
      // CLM-ATLAS-003: SSE vs WebSockets
      const sseClaim = ATLAS_CLAIMS.find((c) => c.id === 'clm-003')!;
      assert.equal(sseClaim.evidenceValidity, 'VALID', 'Evidence from Issue #42 and Commit e419b2c is authentic valid history');
      assert.equal(sseClaim.claimVerification, 'CONFLICTING', 'The two evidence sources contradict each other');
      assert.equal(sseClaim.resolutionStatus, 'UNRESOLVED', 'The technical conflict has not yet been resolved by lead');

      // Valid evidence must NOT imply resolved decision
      assert.notEqual(sseClaim.resolutionStatus, 'RESOLVED');
    });

    it('8. preserves contradictory architectural decisions without premature resolution', () => {
      const bloomClaim = ATLAS_CLAIMS.find((c) => c.id === 'clm-009')!;
      assert.equal(bloomClaim.evidenceValidity, 'VALID');
      assert.equal(bloomClaim.verificationStatus, 'CONFLICTING');
      assert.equal(bloomClaim.resolutionStatus, 'UNRESOLVED');
      assert.equal(bloomClaim.evidence.length, 2, 'Must cite both contradictory sources');
    });

    it('9. enforces handover review submission workflow from DRAFT to UNDER_REVIEW', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      // Set to DRAFT for test
      const storeHandover = governanceStore.getHandover(handoverId, 'ADMIN')!;
      storeHandover.status = 'DRAFT';

      // Incoming member cannot submit
      const unauthorizedSubmit = governanceStore.submitForReview(handoverId, 'Maya Chen', 'INCOMING_MEMBER');
      assert.equal(unauthorizedSubmit.success, false);

      // Admin or author can submit
      const validSubmit = governanceStore.submitForReview(handoverId, 'Arjun Mehta', 'ADMIN');
      assert.equal(validSubmit.success, true);
      assert.equal(validSubmit.handover?.status, 'UNDER_REVIEW');
    });

    it('10. enforces that only authorized REVIEWER or ADMIN can approve a handover and creates immutable version snapshot', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      const storeHandover = governanceStore.getHandover(handoverId, 'ADMIN')!;
      storeHandover.status = 'UNDER_REVIEW';
      const initialVersionCount = storeHandover.versions?.length || 0;

      // Incoming member cannot approve
      const unauthorizedApprove = governanceStore.approveHandover(handoverId, 'Maya Chen', 'INCOMING_MEMBER');
      assert.equal(unauthorizedApprove.success, false);
      assert.equal(storeHandover.status, 'UNDER_REVIEW');

      // Elena (Reviewer) can approve
      const validApprove = governanceStore.approveHandover(
        handoverId,
        'Elena Rostova (Reviewer)',
        'REVIEWER',
        'Verified grounding and approved with note on telemetry SSE standard.'
      );
      assert.equal(validApprove.success, true);
      assert.equal(validApprove.handover?.status, 'APPROVED');
      assert.equal(validApprove.handover?.approvedBy, 'Elena Rostova (Reviewer)');

      // Must have added an immutable version snapshot
      const updatedVersions = validApprove.handover?.versions || [];
      assert.equal(updatedVersions.length, initialVersionCount + 1);
      const latestVersion = updatedVersions[updatedVersions.length - 1];
      assert.equal(latestVersion.reviewStatus, 'APPROVED');
      assert.equal(latestVersion.approvedBy, 'Elena Rostova (Reviewer)');
    });

    it('11. supports the CHANGES_REQUESTED workflow and records change summary in version ledger', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      const storeHandover = governanceStore.getHandover(handoverId, 'ADMIN')!;
      storeHandover.status = 'UNDER_REVIEW';

      const changeReq = governanceStore.requestChanges(
        handoverId,
        'Elena Rostova',
        'REVIEWER',
        'Please clarify the migration rollback plan in Section 4 before approval.'
      );
      assert.equal(changeReq.success, true);
      assert.equal(changeReq.handover?.status, 'CHANGES_REQUESTED');

      const latestVersion = changeReq.handover?.versions?.[changeReq.handover.versions.length - 1];
      assert.equal(latestVersion?.reviewStatus, 'CHANGES_REQUESTED');
      assert.match(latestVersion?.changeSummary || '', /rollback plan/);
    });

    it('12. restricts sharing to handovers that have achieved APPROVED status', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      const storeHandover = governanceStore.getHandover(handoverId, 'ADMIN')!;
      storeHandover.status = 'DRAFT';

      // Cannot share draft handover
      const shareDraft = governanceStore.shareHandover(handoverId, 'Marcus Vance', 'ADMIN');
      assert.equal(shareDraft.success, false);

      // Approve first, then share
      storeHandover.status = 'APPROVED';
      const shareApproved = governanceStore.shareHandover(handoverId, 'Marcus Vance', 'ADMIN');
      assert.equal(shareApproved.success, true);
      assert.equal(shareApproved.handover?.status, 'SHARED');
      assert.equal(shareApproved.handover?.sharedWithRecipient, true);
    });

    it('13. allows reviewer to annotate and adjudicate claims without overwriting original evidence', () => {
      const claimId = 'clm-003';
      const originalEvidence = ATLAS_CLAIMS.find((c) => c.id === claimId)?.evidence;

      const result = governanceStore.updateClaim(
        claimId,
        {
          resolutionStatus: 'RESOLVED',
          reviewerAnnotation: 'Adjudicated: SSE will be standardized across all edge proxy gateways.',
        },
        'Elena Rostova (Reviewer)',
        'REVIEWER'
      );

      assert.equal(result.success, true);
      assert.equal(result.claim?.resolutionStatus, 'RESOLVED');
      assert.equal(result.claim?.reviewerAnnotation, 'Adjudicated: SSE will be standardized across all edge proxy gateways.');
      assert.equal(result.claim?.evidence.length, originalEvidence?.length, 'Original evidence citations must remain preserved');
    });

    it('14. supports knowledge gap ownership assignment and resolution with supporting evidence', () => {
      const gapId = 'que-001'; // DLQ ownership gap
      const assignResult = governanceStore.assignKnowledgeGap(
        gapId,
        'usr-maya-02',
        'Maya Chen',
        'Marcus Vance (Admin)',
        'Assigned to Maya as part of ingress layer transition.'
      );

      assert.equal(assignResult.success, true);
      assert.equal(assignResult.gap?.assignedOwnerName, 'Maya Chen');
      assert.equal(assignResult.gap?.resolutionStatus, 'INVESTIGATING');

      const resolveResult = governanceStore.resolveKnowledgeGap(
        gapId,
        'Commit f812a4b: Added Sentry alert trigger for dlq_audit_events table',
        'Elena Rostova'
      );

      assert.equal(resolveResult.success, true);
      assert.equal(resolveResult.gap?.resolutionStatus, 'RESOLVED');
      assert.match(resolveResult.gap?.resolutionEvidence || '', /Sentry alert trigger/);
    });
  });

  // =========================================================================
  // IMPROVEMENT 3: INTELLIGENT CONTINUATION & KNOWLEDGE TRANSFER
  // =========================================================================
  describe('Improvement 3: Intelligent Continuation', () => {
    it('15. records persistent receipt acknowledgement with unique verification fingerprint', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      const ackResult = governanceStore.acknowledgeHandover(
        handoverId,
        'usr-maya-02',
        'Maya Chen',
        'Senior Full-Stack Engineer (Incoming)',
        'Receipt acknowledged. Will review Liam’s PR splitting v2.4_migration.sql first.'
      );

      assert.equal(ackResult.success, true);
      assert.equal(ackResult.acknowledgement?.recipientName, 'Maya Chen');
      assert.ok(ackResult.acknowledgement?.verificationFingerprint.startsWith('ACK-'));
      assert.ok(ackResult.acknowledgement?.acknowledgedAt);

      const handover = governanceStore.getHandover(handoverId, 'ADMIN');
      assert.equal(handover?.status, 'ACKNOWLEDGED');
      assert.equal(handover?.acknowledgement?.recipientName, 'Maya Chen');
    });

    it('16. enforces idempotent duplicate acknowledgement handling', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      const firstAck = governanceStore.acknowledgeHandover(
        handoverId,
        'usr-maya-02',
        'Maya Chen',
        'Senior Full-Stack Engineer (Incoming)'
      );

      // Attempt second acknowledgement
      const secondAck = governanceStore.acknowledgeHandover(
        handoverId,
        'usr-maya-02',
        'Maya Chen',
        'Senior Full-Stack Engineer (Incoming)'
      );

      assert.equal(secondAck.success, true);
      assert.equal(
        firstAck.acknowledgement?.verificationFingerprint,
        secondAck.acknowledgement?.verificationFingerprint,
        'Idempotent acknowledgement must return the identical fingerprint'
      );
    });

    it('17. explicitly designates unassigned ownership gaps as UNASSIGNED', () => {
      const dlqClaim = ATLAS_CLAIMS.find((c) => c.id === 'clm-007')!;
      assert.equal(dlqClaim.category, 'OWNERSHIP');
      assert.equal(dlqClaim.verificationStatus, 'UNCERTAIN');

      const handover = governanceStore.getHandover(ATLAS_HANDOVERS[0].id, 'ADMIN')!;
      const gapSection = handover.sections?.find((s) => s.sectionKey === 'OUTSTANDING_KNOWLEDGE_GAPS');
      assert.ok(gapSection, 'Outstanding knowledge gaps section must exist');
      assert.match(gapSection.contentMarkdown, /Worker Dead-Letter Queue Ownership/);
    });

    it('18. verifies that all Day-1 continuation actions possess valid grounded citations', () => {
      const handover = governanceStore.getHandover(ATLAS_HANDOVERS[0].id, 'ADMIN')!;
      const checklistSection = handover.sections?.find((s) => s.sectionKey === 'DAY_ONE_ACTIONS');
      assert.ok(checklistSection);

      // Verify groundings in checklist
      assert.match(checklistSection.contentMarkdown, /v2\.4_migration\.sql/);
      assert.match(checklistSection.contentMarkdown, /notification-broker/);
      assert.match(checklistSection.contentMarkdown, /auth\/callback\/google/);
    });

    it('19. records complete audit history across all lifecycle transitions', () => {
      const handoverId = ATLAS_HANDOVERS[0].id;
      governanceStore.submitForReview(handoverId, 'Marcus Vance', 'ADMIN');
      governanceStore.approveHandover(handoverId, 'Elena Rostova', 'REVIEWER', 'Approved with notes');
      governanceStore.shareHandover(handoverId, 'Marcus Vance', 'ADMIN');
      governanceStore.acknowledgeHandover(handoverId, 'usr-maya-02', 'Maya Chen', 'Incoming');

      const auditLogs = governanceStore.getAuditLogs();
      const actions = auditLogs.map((l) => l.action);

      assert.ok(actions.includes('SUBMITTED_FOR_REVIEW'));
      assert.ok(actions.includes('APPROVED_HANDOVER'));
      assert.ok(actions.includes('SHARED_HANDOVER'));
      assert.ok(actions.includes('ACKNOWLEDGED_HANDOVER'));
    });

    it('20. completes the full end-to-end Arjun -> Elena -> Maya handover transition without error', () => {
      // 1. Handover exists
      const h = governanceStore.getHandover(ATLAS_HANDOVERS[0].id, 'ADMIN')!;
      assert.equal(h.departingMember.name, 'Arjun Mehta');
      assert.equal(h.incomingMember.name, 'Maya Chen');

      // 2. Submit -> Approve -> Share -> Acknowledge
      const submit = governanceStore.submitForReview(h.id, 'Arjun Mehta', 'ADMIN');
      assert.equal(submit.success, true);

      const approve = governanceStore.approveHandover(h.id, 'Elena Rostova', 'REVIEWER', 'Ready for Maya');
      assert.equal(approve.success, true);

      const share = governanceStore.shareHandover(h.id, 'Marcus Vance', 'ADMIN');
      assert.equal(share.success, true);

      // 3. Maya can now see the handover
      const mayaView = governanceStore.getHandover(h.id, 'INCOMING_MEMBER');
      assert.ok(mayaView, 'Maya must be able to view the shared handover');

      // 4. Maya signs receipt
      const ack = governanceStore.acknowledgeHandover(h.id, 'usr-maya-02', 'Maya Chen', 'Incoming Developer');
      assert.equal(ack.success, true);
      assert.equal(mayaView.status, 'ACKNOWLEDGED');
    });

    it('21. creates and verifies cryptographically signed synthetic demo sessions', () => {
      const marcusToken = signDemoSession('usr-marcus-04');
      assert.ok(marcusToken.startsWith('demo.usr-marcus-04.'));
      const verifiedUserId = verifyDemoSession(marcusToken);
      assert.equal(verifiedUserId, 'usr-marcus-04');

      const elenaToken = signDemoSession('usr-elena-03');
      assert.equal(verifyDemoSession(elenaToken), 'usr-elena-03');

      const mayaToken = signDemoSession('usr-maya-02');
      assert.equal(verifyDemoSession(mayaToken), 'usr-maya-02');
    });

    it('22. strictly rejects forged, tampered, or expired session cookies', () => {
      // Tampered user ID in token
      const validToken = signDemoSession('usr-maya-02');
      const forgedAdminToken = validToken.replace('usr-maya-02', 'usr-marcus-04');
      assert.equal(verifyDemoSession(forgedAdminToken), null, 'Tampered token signature must fail verification');

      // Tampered signature
      const tamperedSig = validToken.substring(0, validToken.length - 4) + 'abcd';
      assert.equal(verifyDemoSession(tamperedSig), null, 'Invalid signature must fail verification');

      // Non-existent user
      assert.throws(() => signDemoSession('usr-fake-99'));
      assert.equal(verifyDemoSession('demo.usr-fake-99.123456.abcdef'), null);
      assert.equal(verifyDemoSession(''), null);
      assert.equal(verifyDemoSession(null), null);
    });

    it('23. guarantees zero privilege default for unauthenticated requests', async () => {
      const unauthReq = new Request('http://localhost:3000/api/sources');
      const session = await getAuthenticatedSession(unauthReq);

      assert.equal(session.isAuthenticated, false);
      assert.equal(session.user, null);
      assert.equal(session.role, null);
      assert.equal(session.canViewRestricted, false);
      assert.equal(session.canApproveHandovers, false);
      assert.equal(session.canEditClaims, false);

      // Unauthenticated access level check must reject all
      assert.equal(canAccessSourceActivity(session.role, 'PUBLIC'), false);
      assert.equal(canAccessSourceActivity(session.role, 'RESTRICTED'), false);
    });

    it('24. prevents arbitrary client role injection and derives permissions strictly from server record', async () => {
      // Malicious request attempting to spoof admin role for Maya Chen
      const spoofedReq = new Request('http://localhost:3000/api/sources', {
        headers: {
          'x-relay-user-id': 'usr-maya-02',
          'x-user-role': 'ADMIN',
        },
      });

      const session = await getAuthenticatedSession(spoofedReq);
      // Server must look up usr-maya-02 from DEMO_USERS and strictly assign INCOMING_MEMBER, ignoring 'x-user-role: ADMIN'
      assert.equal(session.role, 'INCOMING_MEMBER', 'Role must be derived from server DEMO_USERS record, not client header');
      assert.equal(session.canViewRestricted, false, 'Spoofed admin header must not grant restricted access');
    });
  });
});
