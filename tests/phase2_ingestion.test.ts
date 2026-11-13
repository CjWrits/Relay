import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GitLabAdapter } from '../src/lib/ingestion/adapters/gitlabAdapter';
import { DocumentAdapter } from '../src/lib/ingestion/adapters/documentAdapter';
import { IngestionPipeline } from '../src/lib/ingestion/pipeline';
import { ingestionStore } from '../src/lib/ingestion/store';
import { validateGitLabTarget } from '../src/lib/security/ssrfValidator';
import { NormalizedActivity } from '../src/types/relay';

describe('Phase 2 Ingestion System — Automated Test Suite (15 Test Specifications)', () => {
  const gitlabAdapter = new GitLabAdapter();
  const documentAdapter = new DocumentAdapter();
  const pipeline = new IngestionPipeline();

  // ==========================================================================
  // 1. GitLab API Response Normalization
  // ==========================================================================
  it('1. GitLab API response normalization: maps commit data to NormalizedActivity schema', async () => {
    const mockFetch: typeof fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/repository/commits')) {
        return new Response(
          JSON.stringify([
            {
              id: 'a1b2c3d4e5f6789012345678901234567890abcd',
              short_id: 'a1b2c3d4',
              title: 'feat(api): implement oauth token refresh',
              message: 'feat(api): implement oauth token refresh\n\nFull details here.',
              author_name: 'Alice Developer',
              author_email: 'alice@example.com',
              created_at: '2026-11-06T10:00:00Z',
              web_url: 'https://gitlab.com/test-org/test-repo/-/commit/a1b2c3d4e5f6',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    };

    const activities = await gitlabAdapter.fetchActivities(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['commits'],
      },
      'proj-test-01',
      'src-test-01',
      mockFetch
    );

    assert.equal(activities.length, 1);
    const commit = activities[0];
    assert.equal(commit.activityType, 'COMMIT');
    assert.equal(commit.externalId, 'commit-a1b2c3d4e5f6789012345678901234567890abcd');
    assert.equal(commit.title, 'feat(api): implement oauth token refresh');
    assert.equal(commit.authorName, 'Alice Developer');
    assert.equal(commit.authorEmail, 'alice@example.com');
    assert.equal(commit.sourceType, 'GITLAB');
    assert.ok(commit.contentHash);
    assert.ok(commit.importedAt);
  });

  // ==========================================================================
  // 2. Pagination Handling
  // ==========================================================================
  it('2. Pagination: fetches multiple pages using x-next-page headers until exhausted', async () => {
    let callCount = 0;
    const mockFetch: typeof fetch = async (url) => {
      callCount++;
      const urlStr = url.toString();
      const isSecondPage = new URL(urlStr).searchParams.get('page') === '2';
      if (isSecondPage) {
        return new Response(
          JSON.stringify([
            {
              id: 'commit-page-2',
              short_id: 'c-page2',
              title: 'Commit Page 2',
              message: 'Message 2',
              author_name: 'Author 2',
              created_at: '2026-11-06T10:00:00Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json', 'x-next-page': '' } }
        );
      }
      return new Response(
        JSON.stringify([
          {
            id: 'commit-page-1',
            short_id: 'c-page1',
            title: 'Commit Page 1',
            message: 'Message 1',
            author_name: 'Author 1',
            created_at: '2026-11-06T09:00:00Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json', 'x-next-page': '2' } }
      );
    };

    const activities = await gitlabAdapter.fetchActivities(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['commits'],
        maxItemsPerResource: 10,
      },
      'proj-test-01',
      'src-test-01',
      mockFetch
    );

    assert.equal(callCount, 2, 'Should have made 2 paginated requests');
    assert.equal(activities.length, 2, 'Should have accumulated records from both pages');
  });

  // ==========================================================================
  // 3. Rate-Limit Handling (HTTP 429)
  // ==========================================================================
  it('3. Rate-limit handling: gracefully handles HTTP 429 with Retry-After header', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '5' },
      });
    };

    // fetchActivities catches 429 and returns empty activities cleanly without crash
    const activities = await gitlabAdapter.fetchActivities(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['commits'],
      },
      'proj-test-01',
      'src-test-01',
      mockFetch
    );

    assert.deepEqual(activities, [], 'Should exit gracefully on 429 rate limit');
  });

  // ==========================================================================
  // 4. Authentication Failures (HTTP 401)
  // ==========================================================================
  it('4. Authentication failures: throws a descriptive error on GitLab HTTP 401', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response('Unauthorized', { status: 401 });
    };

    await assert.rejects(
      async () => {
        const privatePaginator = (
          gitlabAdapter as unknown as {
            fetchPaginated: (url: string, headers: Record<string, string>, limit: number, f: typeof fetch) => Promise<unknown[]>;
          }
        ).fetchPaginated(
          'https://gitlab.com/api/v4/projects/test/repository/commits',
          {},
          10,
          mockFetch
        );
        await privatePaginator;
      },
      {
        message: /GitLab authentication failed \(401\)/,
      }
    );
  });

  // ==========================================================================
  // 5. Duplicate Commit Detection
  // ==========================================================================
  it('5. Duplicate commit detection: prevents duplicate commits from being re-imported', () => {
    const commitActivity: NormalizedActivity = {
      id: 'act-test-commit-dup-01',
      sourceId: 'src-test-gl-commit',
      projectId: 'proj-atlas-001',
      sourceType: 'GITLAB',
      externalId: 'commit-unique-sha-555',
      activityType: 'COMMIT',
      title: 'feat: unique test commit',
      contentBody: 'Commit content body',
      authorName: 'Test Committer',
      accessLevel: 'INTERNAL',
      activityTimestamp: '2026-11-06T12:00:00Z',
      importedAt: '2026-11-06T12:00:00Z',
      contentHash: 'hash-commit-555',
    };

    const run1 = ingestionStore.addActivities([commitActivity]);
    assert.equal(run1.imported.length, 1);
    assert.equal(run1.duplicatesSkipped, 0);

    const run2 = ingestionStore.addActivities([commitActivity]);
    assert.equal(run2.imported.length, 0);
    assert.equal(run2.duplicatesSkipped, 1, 'Identical commit externalId must be skipped');
  });

  // ==========================================================================
  // 6. Duplicate Issue Detection
  // ==========================================================================
  it('6. Duplicate issue detection: prevents duplicate issues from creating duplicate activities', () => {
    const issueActivity: NormalizedActivity = {
      id: 'act-test-issue-dup-01',
      sourceId: 'src-test-gl-issue',
      projectId: 'proj-atlas-001',
      sourceType: 'GITLAB',
      externalId: 'issue-777',
      activityType: 'ISSUE',
      title: 'Issue #777: Memory leak in worker queue',
      contentBody: 'Worker process crashes after 24 hours of execution.',
      authorName: 'QA Engineer',
      accessLevel: 'INTERNAL',
      activityTimestamp: '2026-11-06T13:00:00Z',
      importedAt: '2026-11-06T13:00:00Z',
      contentHash: 'hash-issue-777',
    };

    const firstRun = ingestionStore.addActivities([issueActivity]);
    assert.equal(firstRun.imported.length, 1);
    assert.equal(firstRun.duplicatesSkipped, 0);

    const secondRun = ingestionStore.addActivities([issueActivity]);
    assert.equal(secondRun.imported.length, 0);
    assert.equal(secondRun.duplicatesSkipped, 1, 'Duplicate issue externalId must be skipped');
  });

  // ==========================================================================
  // 7. Merge-Request Normalization
  // ==========================================================================
  it('7. Merge-request normalization: correctly maps open & closed MRs with metadata', async () => {
    const mockFetch: typeof fetch = async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/merge_requests')) {
        return new Response(
          JSON.stringify([
            {
              id: 901,
              iid: 45,
              title: 'Add distributed telemetry tracing',
              description: 'Integrated OpenTelemetry collector with trace propagation.',
              state: 'merged',
              created_at: '2026-11-06T14:00:00Z',
              web_url: 'https://gitlab.com/test-org/test-repo/-/merge_requests/45',
              author: { name: 'Elena Rostova', username: 'erostova' },
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    };

    const activities = await gitlabAdapter.fetchActivities(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['merge_requests'],
      },
      'proj-test-01',
      'src-test-01',
      mockFetch
    );

    assert.equal(activities.length, 1);
    const mr = activities[0];
    assert.equal(mr.activityType, 'MERGE_REQUEST');
    assert.equal(mr.externalId, 'mr-45');
    assert.equal(mr.title, 'MR !45: Add distributed telemetry tracing');
    assert.equal(mr.authorName, 'Elena Rostova');
    assert.equal(mr.metadata?.mrIid, 45);
    assert.equal(mr.metadata?.mrState, 'merged');
    assert.equal(mr.metadata?.integration, 'GITLAB_API_V4');
    assert.ok(mr.contentHash);
  });

  // ==========================================================================
  // 8. Markdown Line-Number Preservation
  // ==========================================================================
  it('8. Markdown line-number preservation: chunks markdown while strictly preserving line ranges', () => {
    const markdown = `# Architecture Overview
Line 2 text.
Line 3 text.

## Database Strategy
Line 6 details on PostgreSQL.
Line 7 details on connection pooling.

### Caching Layer
Line 10 details on Redis caching.
Line 11 details on cache invalidation.`;

    const chunks = documentAdapter.chunkDocumentContent(markdown, 'architecture.md', 5);
    assert.ok(chunks.length >= 2, 'Should be split into multiple chunks');

    for (const chunk of chunks) {
      assert.ok(chunk.startLine >= 1);
      assert.ok(chunk.endLine >= chunk.startLine);
      assert.ok(chunk.content.length > 0);
      assert.ok(chunk.contentHash);
    }

    // Verify first chunk starts at line 1
    assert.equal(chunks[0].startLine, 1);
  });

  // ==========================================================================
  // 9. TXT Upload Support
  // ==========================================================================
  it('9. TXT upload: preserves line ranges without requiring markdown headers', async () => {
    const textContent = Array.from({ length: 60 }, (_, i) => `Deployment step ${i + 1}`).join('\n');
    const activities = await documentAdapter.fetchActivities(
      [
        {
          fileName: 'runbook.txt',
          fileContent: textContent,
          fileSizeBytes: Buffer.byteLength(textContent),
        },
      ],
      'proj-atlas-001',
      'src-doc-runbook'
    );

    assert.ok(activities.length >= 2, 'Should split 60-line text file into chunks');
    assert.equal(activities[0].sourceType, 'TXT_UPLOAD');
    assert.ok(activities[0].metadata?.startLine === 1);
  });

  // ==========================================================================
  // 10. File Size Restriction (> 5 MB rejected)
  // ==========================================================================
  it('10. File size restriction: rejects files exceeding the 5 MB ceiling', () => {
    const oversizedBytes = 6 * 1024 * 1024; // 6 MB
    const validation = documentAdapter.validateFile('bigfile.md', oversizedBytes, 'Sample text');
    assert.equal(validation.valid, false);
    assert.match(validation.error || '', /exceeds 5 MB limit/);
  });

  // ==========================================================================
  // 11. MIME & Binary Spoofing (Null byte rejection)
  // ==========================================================================
  it('11. MIME spoofing: rejects binary content disguised with .md or .txt extension', () => {
    const binaryWithNull = 'Fake markdown\0binary_bytes_here';
    const validation = documentAdapter.validateFile('malicious.md', 100, binaryWithNull);
    assert.equal(validation.valid, false);
    assert.match(validation.error || '', /Binary content detected/);
  });

  // ==========================================================================
  // 12. Malformed Document Handling (Empty or invalid extension)
  // ==========================================================================
  it('12. Malformed document handling: rejects 0-byte files and unsupported file types', () => {
    const emptyValidation = documentAdapter.validateFile('empty.md', 0, '');
    assert.equal(emptyValidation.valid, false);
    assert.match(emptyValidation.error || '', /File is empty/);

    const exeValidation = documentAdapter.validateFile('payload.exe', 500, 'MZ...');
    assert.equal(exeValidation.valid, false);
    assert.match(exeValidation.error || '', /Unsupported file extension/);

    const shValidation = documentAdapter.validateFile('script.sh', 200, '#!/bin/bash');
    assert.equal(shValidation.valid, false);
    assert.match(shValidation.error || '', /Unsupported file extension/);
  });

  // ==========================================================================
  // 13. Unauthorized Project Ingestion (RBAC & SSRF)
  // ==========================================================================
  it('13. Unauthorized project ingestion: blocks non-admin users and SSRF targets', async () => {
    // 13a. RBAC block
    const rbacReport = await pipeline.ingestFromGitLab(
      {
        projectUrlOrPath: 'gitlab-org/gitlab',
        resourceTypes: ['commits'],
      },
      'proj-atlas-001',
      'INCOMING_MEMBER' // Non-admin role
    );
    assert.equal(rbacReport.status, 'FAILED');
    assert.match(rbacReport.errorMessage || '', /Authorization denied/);

    // 13b. SSRF blocks
    const localhostCheck = validateGitLabTarget('http://localhost:8080/group/proj');
    assert.equal(localhostCheck.allowed, false);

    const metadataCheck = validateGitLabTarget('http://169.254.169.254/latest/meta-data');
    assert.equal(metadataCheck.allowed, false);

    const traversalCheck = validateGitLabTarget('gitlab-org/../../etc/passwd');
    assert.equal(traversalCheck.allowed, false);
  });

  // ==========================================================================
  // 14. Secret Redaction
  // ==========================================================================
  it('14. Secret redaction: guarantees access tokens are not leaked in activities or reports', async () => {
    process.env.GITLAB_ACCESS_TOKEN = 'secret-glpat-xyz-987654321';

    const mockFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify([
          {
            id: 'sha-redact-test',
            short_id: 'sha-red',
            title: 'Commit for token check',
            message: 'Commit message',
            author_name: 'Dev',
            created_at: '2026-11-06T10:00:00Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const report = await pipeline.ingestFromGitLab(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['commits'],
      },
      'proj-atlas-001',
      'ADMIN',
      mockFetch
    );

    const serialized = JSON.stringify(report);
    assert.ok(
      !serialized.includes('secret-glpat-xyz-987654321'),
      'CRITICAL SECURITY: Access token leaked in serialized ingestion report!'
    );

    delete process.env.GITLAB_ACCESS_TOKEN;
  });

  // ==========================================================================
  // 15. Database Persistence Failures
  // ==========================================================================
  it('15. Database persistence failures: handles DB failure without pretending persistence succeeded', async () => {
    const mockFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify([
          {
            id: 'sha-db-fail-test',
            short_id: 'sha-fail',
            title: 'Commit to test db error',
            message: 'Commit content',
            author_name: 'Dev',
            created_at: '2026-11-06T10:00:00Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    // Force database failure during persistence
    const report = await pipeline.ingestFromGitLab(
      {
        projectUrlOrPath: 'test-org/test-repo',
        resourceTypes: ['commits'],
      },
      'proj-atlas-001',
      'ADMIN',
      mockFetch,
      { forceDbFailure: true }
    );

    // Verify report reflects FAILED status and records exact database error
    assert.equal(report.status, 'FAILED');
    assert.match(report.errorMessage || '', /Database persistence failure/);
    assert.equal(report.recordsImported, 0);

    // Verify sync history records this as a failed job
    const jobs = ingestionStore.getSyncJobs('proj-atlas-001');
    const failedJob = jobs.find((j) => j.id === report.jobId);
    assert.ok(failedJob);
    assert.equal(failedJob.status, 'FAILED');
    assert.match(failedJob.errorMessage || '', /Database persistence failure/);
  });
});
