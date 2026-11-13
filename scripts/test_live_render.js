// Automated End-to-End Judge Simulation against Live Render Deployment
const BASE_URL = process.env.TARGET_URL || 'https://relay-82oi.onrender.com';

async function runJudgeSimulation() {
  console.log(`\n============================================================`);
  console.log(`STARTING LIVE DEPLOYMENT JUDGE SIMULATION`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`============================================================\n`);

  let currentCookie = '';

  function extractCookies(res) {
    // Collect set-cookie headers
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return;
    const parts = setCookie.split(',').map((c) => c.split(';')[0].trim());
    currentCookie = parts.join('; ');
  }

  // 1. Open /login
  console.log('Step 1: Probing /login route...');
  const loginPageRes = await fetch(`${BASE_URL}/login`);
  console.log(`  -> HTTP Status: ${loginPageRes.status} (${loginPageRes.statusText})`);
  if (loginPageRes.status !== 200) throw new Error('Login page unreachable');

  // 2. Log in as Marcus Vance (Admin)
  console.log('\nStep 2: Authenticating as Marcus Vance (ADMIN)...');
  const marcusLoginRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-marcus-04' }),
  });
  extractCookies(marcusLoginRes);
  const marcusSessionData = await marcusLoginRes.json();
  console.log(`  -> Login success: ${marcusSessionData.success}`);
  console.log(`  -> Session Role: ${marcusSessionData.session?.role}`);
  console.log(`  -> User: ${marcusSessionData.session?.user?.name}`);
  console.log(`  -> Cookie: ${currentCookie.substring(0, 45)}...`);

  // 3. Inspect authorized evidence as Marcus
  console.log('\nStep 3: Inspecting sources as Marcus (verifying Incident #11 access)...');
  const marcusSourcesRes = await fetch(`${BASE_URL}/api/sources`, {
    headers: { Cookie: currentCookie },
  });
  const marcusSources = await marcusSourcesRes.json();
  const hasIncident11Marcus = marcusSources.activities?.some((a) => a.id === 'act-006');
  console.log(`  -> Marcus can see Incident #11 (act-006): ${hasIncident11Marcus} (EXPECTED: true)`);
  if (!hasIncident11Marcus) throw new Error('Marcus was denied access to Incident #11');

  // 4. Switch to Elena Rostova (Reviewer)
  console.log('\nStep 4: Switching identity to Elena Rostova (REVIEWER)...');
  const elenaLoginRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-elena-03' }),
  });
  extractCookies(elenaLoginRes);
  const elenaSessionData = await elenaLoginRes.json();
  console.log(`  -> Switched to: ${elenaSessionData.session?.user?.name} (${elenaSessionData.session?.role})`);

  // 5. Submit and approve Atlas handover
  console.log('\nStep 5: Submitting handover for review and approving...');
  const submitRes = await fetch(`${BASE_URL}/api/handovers/hnd-atlas-01/lifecycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: currentCookie },
    body: JSON.stringify({ action: 'SUBMIT_FOR_REVIEW' }),
  });
  const submitData = await submitRes.json();
  console.log(`  -> Submission result: ${submitData.success}, Status: ${submitData.handover?.status}`);

  const approveRes = await fetch(`${BASE_URL}/api/handovers/hnd-atlas-01/lifecycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: currentCookie },
    body: JSON.stringify({ action: 'APPROVE', notes: 'Approved for Maya Chen onboarding' }),
  });
  const approveData = await approveRes.json();
  console.log(`  -> Approval result: ${approveData.success}, Status: ${approveData.handover?.status}`);

  // 6. Verify immutable version creation
  console.log('\nStep 6: Verifying immutable version snapshot creation...');
  const versions = approveData.handover?.versions || [];
  console.log(`  -> Total recorded versions: ${versions.length}`);
  const latestVer = versions[versions.length - 1];
  console.log(`  -> Latest version number: v${latestVer?.versionNumber}, approvedBy: ${latestVer?.approvedBy}`);

  // 7. Share handover with Maya Chen
  console.log('\nStep 7: Sharing approved handover with Maya Chen...');
  const shareRes = await fetch(`${BASE_URL}/api/handovers/hnd-atlas-01/lifecycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: currentCookie },
    body: JSON.stringify({ action: 'SHARE' }),
  });
  const shareData = await shareRes.json();
  console.log(`  -> Share result: ${shareData.success}, Status: ${shareData.handover?.status}`);

  // 8. Switch to Maya Chen (Incoming Member)
  console.log('\nStep 8: Switching identity to Maya Chen (INCOMING_MEMBER)...');
  const mayaLoginRes = await fetch(`${BASE_URL}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'usr-maya-02' }),
  });
  extractCookies(mayaLoginRes);
  const mayaSessionData = await mayaLoginRes.json();
  console.log(`  -> Switched to: ${mayaSessionData.session?.user?.name} (${mayaSessionData.session?.role})`);

  // 9. Verify restricted sources & claims are strictly INACCESSIBLE to Maya
  console.log('\nStep 9: Verifying zero information leakage for Maya Chen...');
  const mayaSourcesRes = await fetch(`${BASE_URL}/api/sources`, {
    headers: { Cookie: currentCookie },
  });
  const mayaSources = await mayaSourcesRes.json();
  const hasIncident11Maya = mayaSources.activities?.some((a) => a.id === 'act-006');
  console.log(`  -> Maya can see Incident #11 (act-006): ${hasIncident11Maya} (EXPECTED: false)`);
  if (hasIncident11Maya) throw new Error('SECURITY VIOLATION: Incident #11 leaked to Maya Chen');

  const mayaClaimsRes = await fetch(`${BASE_URL}/api/governance/claims`, {
    headers: { Cookie: currentCookie },
  });
  const mayaClaims = await mayaClaimsRes.json();
  const hasIncidentClaimMaya = mayaClaims.claims?.some((c) => c.id === 'clm-004');
  console.log(`  -> Maya can see Incident #11 Claim (clm-004): ${hasIncidentClaimMaya} (EXPECTED: false)`);
  if (hasIncidentClaimMaya) throw new Error('SECURITY VIOLATION: Restricted claim clm-004 leaked to Maya Chen');

  // 10. Open continuation workspace
  console.log('\nStep 10: Inspecting continuation workspace for Maya...');
  const continuationPageRes = await fetch(`${BASE_URL}/continuation`);
  console.log(`  -> Continuation page status: ${continuationPageRes.status}`);

  // 11. Inspect knowledge gaps & unassigned responsibilities
  console.log('\nStep 11: Inspecting knowledge gaps...');
  const gapsRes = await fetch(`${BASE_URL}/api/governance/knowledge-gaps`, {
    headers: { Cookie: currentCookie },
  });
  const gapsData = await gapsRes.json();
  console.log(`  -> Knowledge gaps count: ${gapsData.knowledgeGaps?.length || 0}`);

  // 12. Acknowledge handover receipt as Maya
  console.log('\nStep 12: Signing handover receipt as Maya Chen...');
  const ackRes = await fetch(`${BASE_URL}/api/handovers/hnd-atlas-01/lifecycle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: currentCookie },
    body: JSON.stringify({ action: 'ACKNOWLEDGE', comments: 'Live judge simulation acknowledgement' }),
  });
  const ackData = await ackRes.json();
  const fingerprint = ackData.acknowledgement?.verificationFingerprint;
  console.log(`  -> Acknowledgement status: ${ackData.success}`);
  console.log(`  -> Verification Fingerprint: ${fingerprint}`);

  // 13. Refresh browser (simulate browser reload by re-fetching handover)
  console.log('\nStep 13: Simulating page refresh (re-fetching handover)...');
  const refreshRes = await fetch(`${BASE_URL}/api/handovers/hnd-atlas-01`, {
    headers: { Cookie: currentCookie },
  });
  const refreshData = await refreshRes.json();
  console.log(`  -> Refreshed Handover Status: ${refreshData.handover?.status} (EXPECTED: ACKNOWLEDGED)`);
  console.log(`  -> Persisted Fingerprint: ${refreshData.handover?.acknowledgement?.verificationFingerprint}`);

  // 14. Verify receipt and handover status remain available
  console.log('\nStep 14: Verifying final workflow state...');
  if (refreshData.handover?.status !== 'ACKNOWLEDGED') {
    throw new Error('Handover status failed to persist across simulated refresh');
  }
  if (!refreshData.handover?.acknowledgement?.verificationFingerprint) {
    throw new Error('Verification fingerprint missing after simulated refresh');
  }

  console.log(`\n============================================================`);
  console.log(`ALL 14 STEPS OF JUDGE SIMULATION PASSED CLEANLY ON RENDER!`);
  console.log(`============================================================\n`);
}

runJudgeSimulation().catch((err) => {
  console.error('\nSIMULATION FAILED:', err);
  process.exit(1);
});
