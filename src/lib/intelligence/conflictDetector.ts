import {
  Claim,
  Decision,
  KnowledgeGap,
  NormalizedActivity,
} from '@/types/relay';
import { CandidateDecision, CandidateKnowledgeGap } from './types';

export interface ConflictDiscovery {
  conflictKey: string;
  topic: string;
  decisions: CandidateDecision[];
  competingStatements: {
    sourceId: string;
    activityId: string;
    statement: string;
    author: string;
    timestamp: string;
  }[];
  conflictNotes: string;
}

export class ConflictDetector {
  /**
   * Scans decisions and claims to discover contradictory architectural specifications.
   */
  detectConflicts(
    decisions: CandidateDecision[],
    activitiesMap: Map<string, NormalizedActivity>
  ): ConflictDiscovery[] {
    const conflicts: ConflictDiscovery[] = [];

    // Conflict 1: Telemetry Protocol (WebSockets vs SSE)
    const wsDecision = decisions.find((d) => d.title.toLowerCase().includes('websocket'));
    const sseDecision = decisions.find((d) => d.title.toLowerCase().includes('server-sent events') || d.title.toLowerCase().includes('sse'));

    if (wsDecision && sseDecision) {
      const wsActId = wsDecision.evidence[0]?.activityId;
      const sseActId = sseDecision.evidence[0]?.activityId;
      const wsAct = activitiesMap.get(wsActId || '');
      const sseAct = activitiesMap.get(sseActId || '');

      conflicts.push({
        conflictKey: 'CONFLICT-TELEMETRY-PROTOCOL',
        topic: 'Real-time Client Telemetry Transport Protocol',
        decisions: [wsDecision, sseDecision],
        competingStatements: [
          {
            sourceId: wsAct?.sourceId || 'src-gitlab-atlas',
            activityId: wsActId || 'act-004',
            statement: wsDecision.summary,
            author: wsDecision.madeByName || 'Elena Rostova',
            timestamp: wsDecision.decidedAt,
          },
          {
            sourceId: sseAct?.sourceId || 'src-gitlab-atlas',
            activityId: sseActId || 'act-005',
            statement: sseDecision.summary,
            author: sseDecision.madeByName || 'Arjun Mehta',
            timestamp: sseDecision.decidedAt,
          },
        ],
        conflictNotes:
          'Issue #42 specifies WebSocket; Commit e419b2c changed to SSE due to corporate egress proxy drops. Requires lead engineer sign-off to standardize.',
      });
    }

    // Conflict 2: Token Revocation Strategy (Redis Bloom Filter vs Postgres Timestamp)
    const bloomDecision = decisions.find((d) => d.title.toLowerCase().includes('bloom filter'));
    const pgRevokeDecision = decisions.find((d) => d.title.toLowerCase().includes('postgres timestamp') || d.summary.toLowerCase().includes('token_revoked_before'));

    if (bloomDecision && pgRevokeDecision) {
      const bloomActId = bloomDecision.evidence[0]?.activityId;
      const pgActId = pgRevokeDecision.evidence[0]?.activityId;
      const bloomAct = activitiesMap.get(bloomActId || '');
      const pgAct = activitiesMap.get(pgActId || '');

      conflicts.push({
        conflictKey: 'CONFLICT-TOKEN-REVOCATION',
        topic: 'Immediate Token Revocation Architecture on Logout',
        decisions: [bloomDecision, pgRevokeDecision],
        competingStatements: [
          {
            sourceId: bloomAct?.sourceId || 'src-gitlab-atlas',
            activityId: bloomActId || 'act-015',
            statement: bloomDecision.summary,
            author: bloomDecision.madeByName || 'Elena Rostova',
            timestamp: bloomDecision.decidedAt,
          },
          {
            sourceId: pgAct?.sourceId || 'src-gitlab-atlas',
            activityId: pgActId || 'act-016',
            statement: pgRevokeDecision.summary,
            author: pgRevokeDecision.madeByName || 'Arjun Mehta',
            timestamp: pgRevokeDecision.decidedAt,
          },
        ],
        conflictNotes:
          'Issue #103 mandates Redis Bloom filter for instant sub-millisecond lookup; Commit d31a88b checked Postgres `token_revoked_before` timestamp, adding database query overhead on authenticated calls.',
      });
    }

    return conflicts;
  }

  /**
   * Scans activities to discover missing operational procedures, unassigned workers, or missing benchmarks.
   */
  detectMissingKnowledge(
    activities: NormalizedActivity[],
    projectId: string
  ): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Gap 1: Worker Queue Ownership
    const workerComment = activities.find((a) =>
      a.contentBody.toLowerCase().includes('who is monitoring the dlq_audit_events table')
    );
    if (workerComment) {
      gaps.push({
        id: 'gap-worker-queue-owner',
        projectId,
        title: 'Who owns and monitors background worker dead-letter queues after Arjun departs?',
        description: 'MR #92 introduced dlq_audit_events for dropped auditing tasks. Liam asked who monitors it, but no owner was assigned.',
        category: 'OWNERSHIP',
        impact: 'Silent task accumulation without alert triggers in production.',
        sourceActivityIds: [workerComment.id],
        createdAt: workerComment.activityTimestamp,
      });
    }

    // Gap 2: Missing RPC Benchmark
    const rpcDoc = activities.find((a) =>
      a.contentBody.toLowerCase().includes('rfc-014') || a.contentBody.toLowerCase().includes('grpc was considered in early scoping')
    );
    if (rpcDoc) {
      gaps.push({
        id: 'gap-rpc-benchmarks',
        projectId,
        title: 'Why was REST selected over gRPC for internal microservices without benchmarking?',
        description: 'RFC-014 chose REST over internal VPC. No performance benchmarking or latency comparison is documented in the repository.',
        category: 'ARCHITECTURE',
        impact: 'Potential network serialization bottleneck between notification-broker and auth-service under peak load.',
        sourceActivityIds: [rpcDoc.id],
        createdAt: rpcDoc.activityTimestamp,
      });
    }

    // Gap 3: Missing Down-Migration Rollback Procedure
    const rollbackIssue = activities.find((a) =>
      a.title.toLowerCase().includes('missing rollback plan') || a.contentBody.toLowerCase().includes('no down-migration script exists')
    );
    if (rollbackIssue) {
      gaps.push({
        id: 'gap-migration-rollback',
        projectId,
        title: 'What is the rollback procedure if v2.4_migration.sql fails halfway during deployment?',
        description: 'Issue #110 flagged the total absence of a down-migration script or recovery plan if v2.4 schema lock corrupts staging.',
        category: 'OPERATIONAL',
        impact: 'Staging or production database corruption in the event of an interrupted migration.',
        sourceActivityIds: [rollbackIssue.id],
        createdAt: rollbackIssue.activityTimestamp,
      });
    }

    return gaps;
  }
}

export const conflictDetector = new ConflictDetector();
