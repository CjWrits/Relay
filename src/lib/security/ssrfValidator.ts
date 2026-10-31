import { URL } from 'node:url';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS / GCP / Azure metadata endpoint
  'metadata.google.internal',
  'instance-data',
]);

const ALLOWED_DEFAULT_HOSTS = new Set([
  'gitlab.com',
  'www.gitlab.com',
]);

export interface HostValidationResult {
  allowed: boolean;
  normalizedUrl?: string;
  projectPath?: string;
  error?: string;
}

/**
 * Validates GitLab project URL or path to prevent SSRF and internal network scanning.
 */
export function validateGitLabTarget(urlOrPath: string): HostValidationResult {
  if (!urlOrPath || typeof urlOrPath !== 'string') {
    return { allowed: false, error: 'Target URL or project path is required.' };
  }

  const trimmed = urlOrPath.trim();

  // If it's a simple path like "gitlab-org/gitlab" or "group/subgroup/project"
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // Validate path characters
    const pathRegex = /^[a-zA-Z0-9_\-\.]+(\/[a-zA-Z0-9_\-\.]+)+$/;
    if (!pathRegex.test(trimmed) || trimmed.includes('..')) {
      return { allowed: false, error: 'Invalid project path format. Must be "group/project" without path traversal.' };
    }
    return {
      allowed: true,
      normalizedUrl: `https://gitlab.com/${trimmed}`,
      projectPath: trimmed,
    };
  }

  // Parse as URL
  try {
    const parsed = new URL(trimmed);

    // Only HTTPS is permitted for security
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { allowed: false, error: 'Only HTTP/HTTPS protocols are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return { allowed: false, error: 'Access to loopback, link-local, or cloud metadata endpoints is prohibited.' };
    }

    // Check private IP ranges
    if (isPrivateIp(hostname)) {
      return { allowed: false, error: 'Access to private internal IP addresses is prohibited.' };
    }

    // Custom allowed self-hosted GitLab domain from environment if set
    const customHost = process.env.ALLOWED_GITLAB_HOST?.toLowerCase();
    const isAllowedHost = ALLOWED_DEFAULT_HOSTS.has(hostname) || (customHost && hostname === customHost);

    if (!isAllowedHost) {
      return {
        allowed: false,
        error: `Host "${hostname}" is not in the allowed list. Use gitlab.com or configure ALLOWED_GITLAB_HOST.`,
      };
    }

    // Extract project path from URL pathname
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '');
    if (!cleanPath || cleanPath.split('/').length < 2) {
      return { allowed: false, error: 'URL must contain at least group and project name (e.g. "group/project").' };
    }

    if (cleanPath.includes('..')) {
      return { allowed: false, error: 'Path traversal characters ("..") are prohibited.' };
    }

    return {
      allowed: true,
      normalizedUrl: `${parsed.protocol}//${parsed.host}/${cleanPath}`,
      projectPath: cleanPath,
    };
  } catch {
    return { allowed: false, error: 'Malformed URL provided.' };
  }
}

/**
 * Checks whether an IP or hostname string belongs to a private RFC1918 or RFC3927 subnet.
 */
function isPrivateIp(hostname: string): boolean {
  // Check IPv4 octets if applicable
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // 169.254.0.0/16
    if (a === 0) return true;
  }
  return false;
}
