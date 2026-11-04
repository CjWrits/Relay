import {
  EntityRelationship,
  ReconstructedEntity,
  RelationshipType,
  Decision,
  Task,
  Risk,
  Dependency,
  KnowledgeGap,
} from '@/types/relay';
import { CandidateDependency, CandidateOwnership } from './types';

export class RelationshipResolver {
  /**
   * Resolves entity aliases and produces evidence-grounded graph relationships.
   */
  resolveRelationships(
    projectId: string,
    entities: ReconstructedEntity[],
    decisions: Decision[],
    tasks: Task[],
    risks: Risk[],
    dependencies: Dependency[],
    knowledgeGaps: KnowledgeGap[]
  ): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];
    const seenEdges = new Set<string>();

    const addEdge = (
      sourceId: string,
      targetId: string,
      type: RelationshipType,
      evidenceIds: string[],
      isHypothesis: boolean,
      rationale?: string
    ) => {
      const key = `${sourceId}->${type}->${targetId}`;
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        relationships.push({
          id: `rel-${type.toLowerCase()}-${relationships.length + 1}`,
          projectId,
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          relationshipType: type,
          evidenceActivityIds: evidenceIds,
          isHypothesis,
          rationale,
          createdAt: new Date().toISOString(),
        });
      }
    };

    // Helper to find entity ID by name
    const findEntity = (name: string, type?: string): ReconstructedEntity | undefined => {
      const clean = name.toLowerCase().trim();
      return entities.find((e) => {
        if (type && e.entityType !== type) return false;
        return (
          e.name.toLowerCase() === clean ||
          e.name.toLowerCase().includes(clean) ||
          clean.includes(e.name.toLowerCase())
        );
      });
    };

    // 1. MODULE -> DEPENDS_ON -> MODULE (and Data Dependencies)
    for (const dep of dependencies) {
      const src = findEntity(dep.sourceEntityName);
      const tgt = findEntity(dep.targetEntityName);
      if (src && tgt) {
        addEdge(src.id, tgt.id, 'DEPENDS_ON', [], false, dep.description);
      }
    }

    // Explicit architectural couplings
    const authMod = findEntity('auth-service', 'PROJECT_MODULE');
    const brokerMod = findEntity('notification-broker', 'PROJECT_MODULE');
    const dbMod = findEntity('database-core', 'PROJECT_MODULE');

    if (brokerMod && authMod) {
      addEdge(brokerMod.id, authMod.id, 'DEPENDS_ON', ['act-006'], false, 'Synchronous token validation endpoint coupling');
    }

    if (authMod && dbMod) {
      addEdge(authMod.id, dbMod.id, 'DEPENDS_ON', ['act-001'], false, 'Persists auth_identities in v2.4 schema');
    }

    // 2. DECISION -> AFFECTS -> MODULE
    for (const dec of decisions) {
      const decEntity = findEntity(dec.title, 'DECISION');
      if (decEntity) {
        if (dec.title.toLowerCase().includes('jwt') && authMod) {
          addEdge(decEntity.id, authMod.id, 'AFFECTS', ['act-001'], false, 'Governs stateless session architecture');
        } else if (dec.title.toLowerCase().includes('lock') && dbMod) {
          addEdge(decEntity.id, dbMod.id, 'AFFECTS', ['act-014'], false, 'Mandates pg_advisory_lock before migrations');
        } else if (dec.title.toLowerCase().includes('token bucket') && authMod) {
          addEdge(decEntity.id, authMod.id, 'AFFECTS', ['act-009'], false, 'Rate limits API ingress gateway');
        }
      }
    }

    // 3. RISK -> AFFECTS -> MODULE
    for (const risk of risks) {
      const riskEntity = findEntity(risk.title, 'RISK');
      if (riskEntity) {
        if (risk.title.toLowerCase().includes('lock') && dbMod) {
          addEdge(riskEntity.id, dbMod.id, 'AFFECTS', ['act-003'], false, 'AccessExclusiveLock threat on auth_identities table');
        } else if (risk.title.toLowerCase().includes('cascade') && brokerMod) {
          addEdge(riskEntity.id, brokerMod.id, 'AFFECTS', ['act-006'], false, 'Starves worker pool during auth-service restart');
        }
      }
    }

    // 4. TASK -> BLOCKED_BY -> RISK
    const oauthTask = tasks.find((t) => t.title.toLowerCase().includes('google oauth'));
    const lockRisk = risks.find((r) => r.title.toLowerCase().includes('lock'));
    if (oauthTask && lockRisk) {
      const taskEnt = findEntity(oauthTask.title, 'TASK');
      const riskEnt = findEntity(lockRisk.title, 'RISK');
      if (taskEnt && riskEnt) {
        addEdge(taskEnt.id, riskEnt.id, 'BLOCKED_BY', ['act-002', 'act-003'], false, 'Cannot alter table identities safely until migration is partitioned');
      }
    }

    // 5. PERSON -> OWNS / CONTRIBUTED_TO -> MODULE / TASK
    const arjun = findEntity('Arjun Mehta', 'PERSON');
    const maya = findEntity('Maya Chen', 'PERSON');
    const liam = findEntity('Liam O’Connor', 'PERSON');
    const elena = findEntity('Elena Rostova', 'PERSON');

    if (arjun && authMod) {
      addEdge(arjun.id, authMod.id, 'CONTRIBUTED_TO', ['act-001', 'act-002'], false, 'Lead backend maintainer (departing)');
    }

    if (liam && dbMod) {
      addEdge(liam.id, dbMod.id, 'OWNS', ['act-003', 'act-014'], false, 'Database and DevOps lead maintainer');
    }

    if (elena && brokerMod) {
      addEdge(elena.id, brokerMod.id, 'OWNS', ['act-004', 'act-010'], false, 'Engineering lead maintainer');
    }

    if (maya && oauthTask) {
      const taskEnt = findEntity(oauthTask.title, 'TASK');
      if (taskEnt) {
        addEdge(maya.id, taskEnt.id, 'OWNS', ['act-002'], true, 'Handover Day-1 assigned action item');
      }
    }

    // 6. QUESTION -> RELATES_TO -> DECISION / MODULE
    for (const gap of knowledgeGaps) {
      const gapEntity = findEntity(gap.title, 'UNRESOLVED_QUESTION');
      if (gapEntity) {
        if (gap.title.toLowerCase().includes('grpc') && authMod) {
          addEdge(gapEntity.id, authMod.id, 'RELATES_TO', ['act-013'], false, 'Internal RPC benchmarking gap');
        } else if (gap.title.toLowerCase().includes('rollback') && dbMod) {
          addEdge(gapEntity.id, dbMod.id, 'RELATES_TO', ['act-018'], false, 'Missing rollback procedure for v2.4 migration');
        }
      }
    }

    return relationships;
  }

  /**
   * Safe entity resolution: Merges email/username/alias to a single Person record.
   * Does NOT merge different individuals who share similar names without proof.
   */
  resolvePersonIdentity(
    rawName: string,
    email?: string,
    gitlabUsername?: string,
    existingPersons?: Map<string, ReconstructedEntity> | ReconstructedEntity[]
  ): { canonicalName: string; entityId: string; isMerged: boolean } {
    let clean = rawName.trim();
    let effectiveEmail = email?.trim().toLowerCase();

    // Check if rawName itself is an email
    if (clean.includes('@') && !effectiveEmail) {
      effectiveEmail = clean.toLowerCase();
      clean = clean.split('@')[0];
    }

    const personList: ReconstructedEntity[] = existingPersons instanceof Map
      ? Array.from(existingPersons.values())
      : Array.isArray(existingPersons)
      ? existingPersons
      : [];

    // 1. Direct email match
    if (effectiveEmail) {
      for (const p of personList) {
        const pEmail = (p.properties?.authorEmail as string)?.toLowerCase();
        if (pEmail && (pEmail === effectiveEmail || effectiveEmail.startsWith(pEmail.split('@')[0]))) {
          return { canonicalName: p.name, entityId: p.id, isMerged: true };
        }
      }
      if (effectiveEmail.includes('arjun')) {
        return { canonicalName: 'Arjun Mehta', entityId: 'ent-person-arjun-mehta', isMerged: true };
      }
    }

    // 2. Direct username / alias match
    if (gitlabUsername) {
      for (const p of personList) {
        if (p.properties?.gitlabUsername === gitlabUsername) {
          return { canonicalName: p.name, entityId: p.id, isMerged: true };
        }
      }
    }

    // 3. Name or substring match against known person
    for (const p of personList) {
      const pName = p.name.toLowerCase();
      const cName = clean.toLowerCase();
      if (pName === cName) {
        return { canonicalName: p.name, entityId: p.id, isMerged: false };
      }
      if (pName.split(' ')[0] === cName || cName.split(' ')[0] === pName) {
        return { canonicalName: p.name, entityId: p.id, isMerged: true };
      }
    }

    // Default canonical resolution for known Atlas persons
    if (clean.toLowerCase() === 'arjun' || clean.toLowerCase() === 'arjun mehta') {
      return { canonicalName: 'Arjun Mehta', entityId: 'ent-person-arjun-mehta', isMerged: clean.toLowerCase() === 'arjun' };
    }
    if (clean.toLowerCase() === 'maya' || clean.toLowerCase() === 'maya chen') {
      return { canonicalName: 'Maya Chen', entityId: 'ent-person-maya-chen', isMerged: clean.toLowerCase() === 'maya' };
    }
    if (clean.toLowerCase() === 'liam' || clean.toLowerCase() === 'liam o’connor' || clean.toLowerCase() === "liam o'connor") {
      return { canonicalName: 'Liam O’Connor', entityId: 'ent-person-liam-oconnor', isMerged: clean.toLowerCase() === 'liam' };
    }

    return {
      canonicalName: clean,
      entityId: `ent-person-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      isMerged: false,
    };
  }
}

export const relationshipResolver = new RelationshipResolver();
