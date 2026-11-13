import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getSources } from '../src/app/api/sources/route';
import { GET as getHandovers } from '../src/app/api/handovers/route';
import { GET as getState } from '../src/app/api/intelligence/state/route';
import { POST as authSession } from '../src/app/api/auth/session/route';
import { POST as lifecycleAction } from '../src/app/api/handovers/[id]/lifecycle/route';
import { NextRequest } from 'next/server';
import { signDemoSession } from '../src/lib/security/auth';

describe('End-to-End API Security & Zero-Trust Verification', () => {
  it('1. rejects unauthenticated requests to protected endpoints with HTTP 401', async () => {
    // Unauthenticated GET /api/sources
    const reqSources = new NextRequest('http://localhost:3000/api/sources');
    const resSources = await getSources(reqSources);
    assert.equal(resSources.status, 401, 'Unauthenticated sources request must return 401');

    // Unauthenticated GET /api/handovers
    const reqHandovers = new NextRequest('http://localhost:3000/api/handovers');
    const resHandovers = await getHandovers(reqHandovers);
    assert.equal(resHandovers.status, 401, 'Unauthenticated handovers request must return 401');

    // Unauthenticated GET /api/intelligence/state
    const reqState = new NextRequest('http://localhost:3000/api/intelligence/state');
    const resState = await getState(reqState);
    assert.equal(resState.status, 401, 'Unauthenticated state request must return 401');
  });

  it('2. sets cryptographically signed HttpOnly cookie upon login', async () => {
    const loginReq = new NextRequest('http://localhost:3000/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ userId: 'usr-marcus-04' }),
    });

    const res = await authSession(loginReq);
    assert.equal(res.status, 200);

    const cookies = res.cookies.getAll();
    const sessionCookie = cookies.find((c) => c.name === 'relay_session');
    assert.ok(sessionCookie, 'relay_session cookie must be set');
    assert.ok(sessionCookie.value.startsWith('demo.usr-marcus-04.'), 'Token must be signed demo token for Marcus');
    assert.equal(sessionCookie.httpOnly, true, 'relay_session must be HttpOnly');
  });

  it('3. allows Marcus to access restricted sources using his verified signed session', async () => {
    const marcusToken = signDemoSession('usr-marcus-04');
    const req = new NextRequest('http://localhost:3000/api/sources', {
      headers: {
        cookie: `relay_session=${marcusToken}`,
      },
    });

    const res = await getSources(req);
    assert.equal(res.status, 200);
    const data = await res.json();

    const hasRestrictedActivity = data.activities.some((a: { accessLevel: string }) => a.accessLevel === 'RESTRICTED');
    assert.equal(hasRestrictedActivity, true, 'Marcus (ADMIN) must be cleared to view restricted activities');
  });

  it('4. strictly blocks Maya Chen from accessing restricted sources even if she spoofs headers', async () => {
    const mayaToken = signDemoSession('usr-maya-02');
    const req = new NextRequest('http://localhost:3000/api/sources', {
      headers: {
        cookie: `relay_session=${mayaToken}`,
        // Malicious header spoof attempt
        'x-user-role': 'ADMIN',
      },
    });

    const res = await getSources(req);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.equal(data.userRole, 'INCOMING_MEMBER', 'Role must remain INCOMING_MEMBER despite spoofed header');

    const hasRestrictedActivity = data.activities.some(
      (a: { accessLevel: string }) => a.accessLevel === 'RESTRICTED' || a.accessLevel === 'CONFIDENTIAL'
    );
    assert.equal(hasRestrictedActivity, false, 'Restricted sources must NEVER leak to Maya Chen');

    // Incident #11 must be absent
    const hasIncident11 = data.activities.some((a: { id: string }) => a.id === 'act-006');
    assert.equal(hasIncident11, false, 'Incident #11 must be stripped from Maya Chen feed');
  });

  it('5. prevents double-acknowledgement from fabricating inconsistent records (idempotency)', async () => {
    const mayaToken = signDemoSession('usr-maya-02');
    const firstAckReq = new NextRequest('http://localhost:3000/api/handovers/hnd-atlas-01/lifecycle', {
      method: 'POST',
      headers: {
        cookie: `relay_session=${mayaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'ACKNOWLEDGE', comments: 'First acknowledgement' }),
    });

    const params = Promise.resolve({ id: 'hnd-atlas-01' });
    const res1 = await lifecycleAction(firstAckReq, { params });
    const data1 = await res1.json();
    assert.equal(res1.status, 200);
    const originalFingerprint = data1.acknowledgement.verificationFingerprint;

    // Second repeated click (double-click simulation)
    const secondAckReq = new NextRequest('http://localhost:3000/api/handovers/hnd-atlas-01/lifecycle', {
      method: 'POST',
      headers: {
        cookie: `relay_session=${mayaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'ACKNOWLEDGE', comments: 'Double click duplicate' }),
    });

    const res2 = await lifecycleAction(secondAckReq, { params });
    const data2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.equal(
      data2.acknowledgement.verificationFingerprint,
      originalFingerprint,
      'Fingerprint must be idempotent and identical on repeat request'
    );
  });
});
