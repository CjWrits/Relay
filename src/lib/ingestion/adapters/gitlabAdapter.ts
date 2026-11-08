import { createHash } from 'node:crypto';
import { NormalizedActivity, AccessLevel, SourceType } from '@/types/relay';
import { GitLabSourceConfig, SourceAdapter, ValidationResult } from '../types';
import { validateGitLabTarget } from '@/lib/security/ssrfValidator';

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  created_at: string;
  web_url?: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: string;
  created_at: string;
  web_url?: string;
  author?: {
    name: string;
    username: string;
  };
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: string;
  created_at: string;
  web_url?: string;
  author?: {
    name: string;
    username: string;
  };
}

export interface GitLabTreeItem {
  id: string;
  name: string;
  type: 'tree' | 'blob';
  path: string;
  mode: string;
}

export class GitLabAdapter implements SourceAdapter<GitLabSourceConfig> {
  sourceType: SourceType = 'GITLAB';

  async validateConfig(config: GitLabSourceConfig): Promise<ValidationResult> {
    if (!config.projectUrlOrPath) {
      return { valid: false, error: 'GitLab project URL or path is required.' };
    }

    const hostCheck = validateGitLabTarget(config.projectUrlOrPath);
    if (!hostCheck.allowed) {
      return { valid: false, error: hostCheck.error };
    }

    if (!config.resourceTypes || config.resourceTypes.length === 0) {
      return { valid: false, error: 'At least one resource type (commits, issues, merge_requests, docs) must be selected.' };
    }

    return { valid: true };
  }

  async fetchActivities(
    config: GitLabSourceConfig,
    projectId: string,
    sourceId: string,
    fetchFn: typeof fetch = fetch
  ): Promise<NormalizedActivity[]> {
    const validation = await this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid GitLab configuration: ${validation.error}`);
    }

    const target = validateGitLabTarget(config.projectUrlOrPath);
    if (!target.projectPath) {
      throw new Error('Could not parse GitLab project path.');
    }

    const baseUrl = this.getBaseApiUrl(config.projectUrlOrPath);
    const encodedProjectPath = encodeURIComponent(target.projectPath);
    const token = config.accessToken?.trim() || process.env.GITLAB_ACCESS_TOKEN?.trim();
    const defaultAccessLevel: AccessLevel = config.defaultAccessLevel || 'INTERNAL';

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'RELAY-Continuity-Platform/1.0',
    };

    if (token) {
      headers['PRIVATE-TOKEN'] = token;
    }

    const activities: NormalizedActivity[] = [];
    const maxItems = config.maxItemsPerResource || 50;

    // 1. Fetch Commits
    if (config.resourceTypes.includes('commits')) {
      try {
        const commits = await this.fetchPaginated<GitLabCommit>(
          `${baseUrl}/projects/${encodedProjectPath}/repository/commits?per_page=20`,
          headers,
          maxItems,
          fetchFn
        );

        for (const commit of commits) {
          const hash = this.computeHash(commit.message || commit.title);
          activities.push({
            id: `act-gl-commit-${commit.short_id || commit.id.slice(0, 8)}`,
            sourceId,
            projectId,
            sourceType: 'GITLAB',
            externalId: `commit-${commit.id}`,
            activityType: 'COMMIT',
            title: commit.title || 'GitLab Commit',
            contentBody: commit.message || commit.title || '',
            authorName: commit.author_name || 'GitLab User',
            authorEmail: commit.author_email,
            accessLevel: defaultAccessLevel,
            activityTimestamp: commit.created_at,
            importedAt: new Date().toISOString(),
            originalUrl: commit.web_url,
            contentHash: hash,
            metadata: {
              commitSha: commit.id,
              shortSha: commit.short_id,
              integration: 'GITLAB_API_V4',
            },
          });
        }
      } catch (err: unknown) {
        console.error('Failed fetching GitLab commits:', err instanceof Error ? err.message : err);
      }
    }

    // 2. Fetch Issues
    if (config.resourceTypes.includes('issues')) {
      try {
        const issues = await this.fetchPaginated<GitLabIssue>(
          `${baseUrl}/projects/${encodedProjectPath}/issues?scope=all&state=all&per_page=20`,
          headers,
          maxItems,
          fetchFn
        );

        for (const issue of issues) {
          const content = issue.description || issue.title;
          const hash = this.computeHash(content);
          activities.push({
            id: `act-gl-issue-${issue.iid}`,
            sourceId,
            projectId,
            sourceType: 'GITLAB',
            externalId: `issue-${issue.iid}`,
            activityType: 'ISSUE',
            title: `Issue #${issue.iid}: ${issue.title}`,
            contentBody: content,
            authorName: issue.author?.name || issue.author?.username || 'GitLab Contributor',
            accessLevel: defaultAccessLevel,
            activityTimestamp: issue.created_at,
            importedAt: new Date().toISOString(),
            originalUrl: issue.web_url,
            contentHash: hash,
            metadata: {
              issueIid: issue.iid,
              issueState: issue.state,
              integration: 'GITLAB_API_V4',
            },
          });
        }
      } catch (err: unknown) {
        console.error('Failed fetching GitLab issues:', err instanceof Error ? err.message : err);
      }
    }

    // 3. Fetch Merge Requests
    if (config.resourceTypes.includes('merge_requests')) {
      try {
        const mrs = await this.fetchPaginated<GitLabMergeRequest>(
          `${baseUrl}/projects/${encodedProjectPath}/merge_requests?scope=all&state=all&per_page=20`,
          headers,
          maxItems,
          fetchFn
        );

        for (const mr of mrs) {
          const content = mr.description || mr.title;
          const hash = this.computeHash(content);
          activities.push({
            id: `act-gl-mr-${mr.iid}`,
            sourceId,
            projectId,
            sourceType: 'GITLAB',
            externalId: `mr-${mr.iid}`,
            activityType: 'MERGE_REQUEST',
            title: `MR !${mr.iid}: ${mr.title}`,
            contentBody: content,
            authorName: mr.author?.name || mr.author?.username || 'GitLab Contributor',
            accessLevel: defaultAccessLevel,
            activityTimestamp: mr.created_at,
            importedAt: new Date().toISOString(),
            originalUrl: mr.web_url,
            contentHash: hash,
            metadata: {
              mrIid: mr.iid,
              mrState: mr.state,
              integration: 'GITLAB_API_V4',
            },
          });
        }
      } catch (err: unknown) {
        console.error('Failed fetching GitLab merge requests:', err instanceof Error ? err.message : err);
      }
    }

    // 4. Fetch Documentation Files (README.md, ARCHITECTURE.md, etc.)
    if (config.resourceTypes.includes('docs')) {
      try {
        const tree = await this.fetchPaginated<GitLabTreeItem>(
          `${baseUrl}/projects/${encodedProjectPath}/repository/tree?per_page=50`,
          headers,
          50,
          fetchFn
        );

        // Find relevant documentation files (.md, .markdown, .txt)
        const docFiles = tree.filter(
          (item) =>
            item.type === 'blob' &&
            /\.(md|markdown|txt)$/i.test(item.name)
        );

        for (const file of docFiles.slice(0, 5)) {
          const rawUrl = `${baseUrl}/projects/${encodedProjectPath}/repository/files/${encodeURIComponent(file.path)}/raw?ref=${config.branch || 'main'}`;
          const res = await fetchFn(rawUrl, { headers });
          if (res.ok) {
            const text = await res.text();
            if (text && text.trim().length > 0) {
              const hash = this.computeHash(text);
              activities.push({
                id: `act-gl-doc-${this.sanitizeKey(file.path)}`,
                sourceId,
                projectId,
                sourceType: 'GITLAB',
                externalId: `doc-${file.path}`,
                activityType: 'DOCUMENT_CHUNK',
                title: `Repo Doc: ${file.name}`,
                contentBody: text.slice(0, 3000), // Ingest up to 3000 chars per doc section
                authorName: 'Repository Maintainers',
                accessLevel: defaultAccessLevel,
                activityTimestamp: new Date().toISOString(),
                importedAt: new Date().toISOString(),
                originalPath: file.path,
                contentHash: hash,
                metadata: {
                  filePath: file.path,
                  integration: 'GITLAB_API_V4',
                },
              });
            }
          }
        }
      } catch (err: unknown) {
        console.error('Failed fetching GitLab repository documents:', err instanceof Error ? err.message : err);
      }
    }

    return activities;
  }

  private async fetchPaginated<T>(
    initialUrl: string,
    headers: Record<string, string>,
    maxTotal: number,
    fetchFn: typeof fetch = fetch
  ): Promise<T[]> {
    const results: T[] = [];
    let currentUrl: string | null = initialUrl;
    let pageCount = 0;
    const MAX_PAGES = 5;

    while (currentUrl && results.length < maxTotal && pageCount < MAX_PAGES) {
      pageCount++;
      const res = await fetchFn(currentUrl, { headers });

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        console.warn(`GitLab rate limit hit (429). Retry-After: ${delayMs}ms`);
        break; // Stop cleanly rather than hanging
      }

      if (res.status === 401) {
        throw new Error('GitLab authentication failed (401). Check GITLAB_ACCESS_TOKEN.');
      }

      if (res.status === 404) {
        throw new Error('GitLab project or resource not found (404). Verify project path.');
      }

      if (!res.ok) {
        throw new Error(`GitLab API error: ${res.status} ${res.statusText}`);
      }

      const items = (await res.json()) as T[];
      if (!Array.isArray(items) || items.length === 0) {
        break;
      }

      results.push(...items);

      // Check GitLab pagination header: x-next-page
      const nextPage = res.headers.get('x-next-page') || res.headers.get('X-Next-Page');
      if (nextPage && nextPage.trim().length > 0) {
        const nextUrl: URL = new URL(currentUrl);
        nextUrl.searchParams.set('page', nextPage);
        currentUrl = nextUrl.toString();
      } else {
        currentUrl = null;
      }
    }

    return results.slice(0, maxTotal);
  }

  private getBaseApiUrl(urlOrPath: string): string {
    const target = validateGitLabTarget(urlOrPath);
    if (target.normalizedUrl) {
      const parsed = new URL(target.normalizedUrl);
      return `${parsed.protocol}//${parsed.host}/api/v4`;
    }
    return 'https://gitlab.com/api/v4';
  }

  private computeHash(content: string): string {
    return createHash('sha256').update(content || '').digest('hex');
  }

  private sanitizeKey(str: string): string {
    return str.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  }
}
