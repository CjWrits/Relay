import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATLAS_ACTIVITIES,
  ATLAS_CLAIMS,
  ATLAS_DECISIONS,
  ATLAS_TASKS,
  ATLAS_RISKS,
  ATLAS_DEPENDENCIES,
  ATLAS_UNRESOLVED_QUESTIONS,
  ATLAS_SOURCES,
  ATLAS_PEOPLE,
} from '../src/data/mockAtlasData';

describe('Phase 1.5 Synthetic Atlas Foundation Validation', () => {
  it('satisfies all quantitative dataset minimums', () => {
    assert.ok(ATLAS_PEOPLE.length >= 5, `Expected >= 5 people, got ${ATLAS_PEOPLE.length}`);
    assert.ok(ATLAS_ACTIVITIES.length >= 15, `Expected >= 15 activities, got ${ATLAS_ACTIVITIES.length}`);
    assert.ok(ATLAS_DECISIONS.length >= 5, `Expected >= 5 decisions, got ${ATLAS_DECISIONS.length}`);
    assert.ok(ATLAS_TASKS.length >= 5, `Expected >= 5 tasks, got ${ATLAS_TASKS.length}`);
    assert.ok(ATLAS_RISKS.length >= 3, `Expected >= 3 risks, got ${ATLAS_RISKS.length}`);
    assert.ok(ATLAS_DEPENDENCIES.length >= 4, `Expected >= 4 dependencies, got ${ATLAS_DEPENDENCIES.length}`);
    assert.ok(
      ATLAS_UNRESOLVED_QUESTIONS.length >= 3,
      `Expected >= 3 unresolved questions, got ${ATLAS_UNRESOLVED_QUESTIONS.length}`
    );
  });

  it('validates every evidence reference resolves to an existing source activity', () => {
    const activityIds = new Set(ATLAS_ACTIVITIES.map((a) => a.id));

    let totalEvidenceCitations = 0;
    for (const claim of ATLAS_CLAIMS) {
      for (const ev of claim.evidence) {
        totalEvidenceCitations++;
        assert.ok(
          activityIds.has(ev.activityId),
          `Claim ${claim.claimCode} references missing activity ID: ${ev.activityId}`
        );
        assert.ok(ev.excerpt.length > 5, `Evidence ${ev.id} must have non-empty excerpt`);
        assert.ok(ev.lineReference, `Evidence ${ev.id} must have a line or commit reference`);
      }
    }
    assert.ok(totalEvidenceCitations > 0, 'Must have at least one verified evidence citation');
  });

  it('validates every source activity has complete provenance', () => {
    const sourceIds = new Set(ATLAS_SOURCES.map((s) => s.id));

    for (const act of ATLAS_ACTIVITIES) {
      assert.ok(act.id, 'Activity must have id');
      assert.ok(sourceIds.has(act.sourceId), `Activity ${act.id} references missing source ${act.sourceId}`);
      assert.ok(act.externalReferenceId, `Activity ${act.id} must have externalReferenceId`);
      assert.ok(act.authorName, `Activity ${act.id} must have authorName`);
      assert.ok(act.activityTimestamp, `Activity ${act.id} must have activityTimestamp`);
      assert.ok(act.contentBody, `Activity ${act.id} must have contentBody`);
    }
  });

  it('identifies at least two distinct conflicting information examples', () => {
    const conflictingClaims = ATLAS_CLAIMS.filter((c) => c.verificationStatus === 'CONFLICTING');
    assert.ok(
      conflictingClaims.length >= 2,
      `Expected at least 2 conflicting claims, found: ${conflictingClaims.length}`
    );

    // Each conflicting claim must have at least 2 contradicting evidence citations or clear conflict notes
    for (const claim of conflictingClaims) {
      assert.ok(claim.conflictNotes, `Conflicting claim ${claim.claimCode} must have conflictNotes`);
      assert.ok(
        claim.evidence.length >= 2,
        `Conflicting claim ${claim.claimCode} must provide at least 2 contradicting evidence citations`
      );
    }
  });

  it('identifies at least two missing evidence examples that cannot be represented as VERIFIED', () => {
    const missingEvidenceClaims = ATLAS_CLAIMS.filter(
      (c) => c.evidence.length === 0 && (c.verificationStatus === 'UNVERIFIED' || c.verificationStatus === 'UNCERTAIN')
    );
    assert.ok(
      missingEvidenceClaims.length >= 2,
      `Expected at least 2 missing evidence claims, found: ${missingEvidenceClaims.length}`
    );

    // Confirm that none of them are marked VERIFIED
    for (const claim of missingEvidenceClaims) {
      assert.notEqual(
        claim.verificationStatus,
        'VERIFIED',
        `Claim ${claim.claimCode} with 0 evidence citations must never be marked VERIFIED`
      );
    }
  });

  it('validates that duplicate source records do not create duplicate activities', () => {
    const seenActivityIds = new Set<string>();
    const seenExternalIds = new Set<string>();

    for (const act of ATLAS_ACTIVITIES) {
      assert.ok(!seenActivityIds.has(act.id), `Duplicate activity ID detected in Atlas dataset: ${act.id}`);
      seenActivityIds.add(act.id);

      if (act.externalReferenceId) {
        assert.ok(
          !seenExternalIds.has(act.externalReferenceId),
          `Duplicate externalReferenceId detected in Atlas dataset: ${act.externalReferenceId}`
        );
        seenExternalIds.add(act.externalReferenceId);
      }
    }
  });

  it('proves that unverified information cannot be represented as VERIFIED', () => {
    for (const claim of ATLAS_CLAIMS) {
      if (claim.verificationStatus === 'VERIFIED') {
        assert.ok(
          claim.evidence.length > 0,
          `Claim ${claim.claimCode} is marked VERIFIED but has 0 evidence citations!`
        );
        assert.ok(
          claim.confidenceScore >= 0.7,
          `Claim ${claim.claimCode} is marked VERIFIED but confidence score is too low (${claim.confidenceScore})`
        );
      }
    }
  });
});
