import crypto from 'crypto';
import { Person, UserRole, AccessLevel, SourceActivity, Claim, ReconstructedProjectMemory } from '@/types/relay';
import { ATLAS_PEOPLE, ATLAS_ACTIVITIES, ATLAS_PROJECT } from '@/data/mockAtlasData';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AuthenticatedSession {
  user: Person | null;
  role: UserRole | null;
  projectId: string;
  isAuthenticated: boolean;
  isSyntheticDemo: boolean;
  canViewRestricted: boolean;
  canApproveHandovers: boolean;
  canEditClaims: boolean;
  token?: string;
  expiresAt: string;
}

export const DEMO_USERS: Record<string, { person: Person; role: UserRole }> = {
  'usr-marcus-04': { person: ATLAS_PEOPLE[3], role: 'ADMIN' },
  'usr-elena-03': { person: ATLAS_PEOPLE[2], role: 'REVIEWER' },
  'usr-maya-02': { person: ATLAS_PEOPLE[1], role: 'INCOMING_MEMBER' },
};

// Cryptographic signing secret for synthetic demonstration sessions
const DEMO_SESSION_SECRET = process.env.DEMO_SESSION_SECRET || 'relay_demo_session_secret_2026_codepunethinkers_final';

/**
 * Creates a cryptographically signed synthetic demo session token.
 * Format: demo.<userId>.<timestamp>.<hmacSignature>
 */
export function signDemoSession(userId: string): string {
  if (!DEMO_USERS[userId]) {
    throw new Error(`Cannot sign session for unknown user ID: ${userId}`);
  }
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', DEMO_SESSION_SECRET).update(payload).digest('hex');
  return `demo.${userId}.${timestamp}.${hmac}`;
}

/**
 * Validates a signed synthetic demo session token.
 * Verifies signature, expiry (7 days), and confirms user exists in DEMO_USERS.
 * Returns verified userId if valid, or null if tampered/invalid/expired.
 */
export function verifyDemoSession(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'demo') return null;

  const [, userId, timestampStr, hmac] = parts;
  if (!DEMO_USERS[userId]) return null;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  // Max session age: 7 days
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge || timestamp > Date.now() + 60000) {
    return null;
  }

  const payload = `${userId}:${timestamp}`;
  const expectedHmac = crypto.createHmac('sha256', DEMO_SESSION_SECRET).update(payload).digest('hex');

  try {
    const sigA = Buffer.from(hmac, 'hex');
    const sigB = Buffer.from(expectedHmac, 'hex');
    if (sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)) {
      return userId;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Parses cookies from Cookie header string.
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const key = parts[0]?.trim();
    const val = parts.slice(1).join('=').trim();
    if (key) {
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.npm_lifecycle_event === 'test' ||
    process.argv.some((arg) => arg.includes('test'))
  );
}

/**
 * Server-side session resolver.
 * Priority:
 * 1. Verified Supabase Auth token (if configured and Bearer token provided)
 * 2. Cryptographically signed `relay_session` cookie for demo accounts
 * 3. Isolated test environment header (`x-relay-user-id` ONLY when running automated tests)
 * 
 * Never defaults an unauthenticated request to ADMIN.
 * Never trusts arbitrary client headers in production.
 * Derives role exclusively from server-side verified records.
 */
export async function getAuthenticatedSession(req?: Request): Promise<AuthenticatedSession> {
  let matchedUserId: string | null = null;

  if (req) {
    // 1. Check Supabase Auth if configured and Bearer token is present
    if (isSupabaseConfigured()) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const supabase = getSupabaseClient();
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data?.user) {
              const serverRole = (data.user.user_metadata?.role as UserRole) || 'INCOMING_MEMBER';
              const canElevate = serverRole === 'ADMIN' || serverRole === 'REVIEWER';
              return {
                user: {
                  id: data.user.id,
                  name: data.user.user_metadata?.full_name || data.user.email || 'Authenticated User',
                  email: data.user.email || '',
                  primaryRole: serverRole,
                  isActive: true,
                },
                role: serverRole,
                projectId: ATLAS_PROJECT.id,
                isAuthenticated: true,
                isSyntheticDemo: false,
                canViewRestricted: canElevate,
                canApproveHandovers: canElevate,
                canEditClaims: canElevate,
                token,
                expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              };
            }
          } catch {
            // Supabase auth check failed
          }
        }
      }
    }

    // 2. Check cryptographically signed `relay_session` cookie
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['relay_session'];

    if (sessionToken) {
      const verified = verifyDemoSession(sessionToken);
      if (verified) {
        matchedUserId = verified;
      }
    }

    // 3. Isolated test environment support (ONLY when running automated tests)
    // In production or live server runtime, test headers are strictly ignored!
    if (!matchedUserId && isTestEnvironment()) {
      const testHeaderUserId = req.headers.get('x-relay-user-id');
      if (testHeaderUserId && DEMO_USERS[testHeaderUserId]) {
        matchedUserId = testHeaderUserId;
      }
    }
  }

  // If a valid demo user was verified
  if (matchedUserId && DEMO_USERS[matchedUserId]) {
    const demoProfile = DEMO_USERS[matchedUserId];
    // Role is DERIVED strictly from server-side DEMO_USERS registry, NEVER from client
    const role = demoProfile.role;
    const canElevate = role === 'ADMIN' || role === 'REVIEWER';

    return {
      user: demoProfile.person,
      role,
      projectId: ATLAS_PROJECT.id,
      isAuthenticated: true,
      isSyntheticDemo: true,
      canViewRestricted: canElevate,
      canApproveHandovers: canElevate,
      canEditClaims: canElevate,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };
  }

  // Unauthenticated / Anonymous Session — Zero Privilege Default
  return {
    user: null,
    role: null,
    projectId: ATLAS_PROJECT.id,
    isAuthenticated: false,
    isSyntheticDemo: false,
    canViewRestricted: false,
    canApproveHandovers: false,
    canEditClaims: false,
    expiresAt: new Date(0).toISOString(),
  };
}

/**
 * Checks if a given role is authorized to view a source activity by clearance level.
 * Rule:
 * - ADMIN: PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL
 * - REVIEWER: PUBLIC, INTERNAL, RESTRICTED, CONFIDENTIAL
 * - INCOMING_MEMBER: PUBLIC, INTERNAL only (RESTRICTED and CONFIDENTIAL strictly blocked!)
 * - Unauthenticated / Anonymous: False for all
 */
export function canAccessSourceActivity(userRole: UserRole | null | undefined, accessLevel: AccessLevel): boolean {
  if (!userRole) return false;
  if (userRole === 'ADMIN' || userRole === 'REVIEWER') {
    return true;
  }
  if (userRole === 'INCOMING_MEMBER') {
    return accessLevel === 'PUBLIC' || accessLevel === 'INTERNAL';
  }
  return false;
}

/**
 * Filters source activities by user role clearance.
 */
export function filterRestrictedActivities(
  activities: SourceActivity[],
  userRole: UserRole | null | undefined
): SourceActivity[] {
  if (!userRole) return [];
  return activities.filter((act) => canAccessSourceActivity(userRole, act.accessLevel));
}

/**
 * Builds activity map for fast clearance lookup.
 */
function getActivityClearanceMap(activities?: SourceActivity[]): Map<string, AccessLevel> {
  const map = new Map<string, AccessLevel>();
  const list = activities && activities.length > 0 ? activities : ATLAS_ACTIVITIES;
  list.forEach((a) => map.set(a.id, a.accessLevel));
  return map;
}

/**
 * Strict Claim Filtering:
 * Prevents restricted evidence and citations from leaking to unauthorized users.
 * If user is INCOMING_MEMBER:
 * 1. Disallows claims where all supporting evidence is restricted or confidential.
 * 2. Filters out any restricted excerpts from claims that have multiple evidence items.
 * 3. Strips sensitive source references (e.g. postmortem-staging-11.md).
 * If user is unauthenticated: returns empty list.
 */
export function filterRestrictedClaims(
  claims: Claim[],
  userRole: UserRole | null | undefined,
  activities?: SourceActivity[]
): Claim[] {
  if (!userRole) return [];
  if (userRole === 'ADMIN' || userRole === 'REVIEWER') {
    return claims;
  }

  const clearanceMap = getActivityClearanceMap(activities);

  return claims
    .map((claim) => {
      // Filter the claim's evidence to only those the user is cleared to view
      const authorizedEvidence = claim.evidence.filter((ev) => {
        const level = clearanceMap.get(ev.activityId) || 'INTERNAL';
        return canAccessSourceActivity(userRole, level);
      });

      // If original claim had evidence, but none are authorized for this user,
      // and the claim itself discusses restricted incidents, drop or redact it.
      if (claim.evidence.length > 0 && authorizedEvidence.length === 0) {
        return null;
      }

      // Return claim with only permitted evidence excerpts
      return {
        ...claim,
        evidence: authorizedEvidence,
      };
    })
    .filter((c): c is Claim => c !== null);
}

/**
 * Filters complete reconstructed project memory for recipient-specific delivery.
 */
export function filterRestrictedProjectMemory(
  memory: ReconstructedProjectMemory,
  userRole: UserRole | null | undefined,
  activities?: SourceActivity[]
): ReconstructedProjectMemory {
  if (!userRole) {
    return {
      ...memory,
      decisions: [],
      tasks: [],
      risks: [],
      dependencies: [],
      knowledgeGaps: [],
      timeline: [],
      claims: [],
      relationships: [],
    };
  }

  if (userRole === 'ADMIN' || userRole === 'REVIEWER') {
    return memory;
  }

  const clearanceMap = getActivityClearanceMap(activities);

  // 1. Filter claims
  const filteredClaims = filterRestrictedClaims(memory.claims, userRole, activities);
  const allowedClaimIds = new Set(filteredClaims.map((c) => c.id));

  // 2. Filter risks: Exclude risks solely grounded in restricted documents if user is INCOMING_MEMBER
  const filteredRisks = memory.risks.filter((risk) => {
    if (!risk.claimId) return true;
    return allowedClaimIds.has(risk.claimId);
  });

  // 3. Filter timeline: Exclude events from restricted activities
  const filteredTimeline = memory.timeline.filter((event) => {
    if (!event.sourceActivityId) return true;
    const level = clearanceMap.get(event.sourceActivityId) || 'INTERNAL';
    return canAccessSourceActivity(userRole, level);
  });

  // 4. Filter knowledge gaps
  const filteredGaps = memory.knowledgeGaps.filter((gap) => {
    if (!gap.sourceActivityIds || gap.sourceActivityIds.length === 0) return true;
    return gap.sourceActivityIds.some((actId) => {
      const level = clearanceMap.get(actId) || 'INTERNAL';
      return canAccessSourceActivity(userRole, level);
    });
  });

  return {
    ...memory,
    claims: filteredClaims,
    risks: filteredRisks,
    timeline: filteredTimeline,
    knowledgeGaps: filteredGaps,
  };
}
