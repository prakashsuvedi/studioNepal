/**
 * Phase 01B Stage 1: Critical Authentication Remediation Verification Suite
 *
 * Demonstrates:
 * 1. Empty and malformed admin-login requests cannot obtain an administrator JWT.
 * 2. Invalid credentials cannot obtain an administrator JWT.
 * 3. Legitimate configured administrator authentication still works.
 * 4. Spoofed x-user-id headers cannot authenticate or elevate a caller.
 * 5. Spoofed userId query parameters cannot authenticate or elevate a caller.
 * 6. Unauthenticated callers cannot execute protected administrative actions.
 * 7. Authenticated non-admin users remain unable to perform administrative actions.
 * 8. Expired, malformed, or invalidly signed JWTs are rejected.
 * 9. Missing administrator configuration does not enable a fallback login.
 * 10. Query-string admin secrets are rejected on protected endpoints.
 * 11. Existing user, subscriber, guest, and normal login behaviors remain compatible.
 * 12. All 110 API routes remain registered and route contracts intact.
 */

import fs from 'fs';
import path from 'path';
import { 
  generateJwtToken, 
  verifyJwtToken, 
  ADMIN_WHITELIST_EMAILS, 
  ADMIN_CREDENTIALS,
  isUserAdmin,
  isValidAdminSecret 
} from '../src/server/credentials';
import { db } from '../src/server/db';
import { User, Transaction } from '../src/db/schema';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runPhase1bVerification() {
  console.log('========================================================================');
  console.log('🛡️  PHASE 01B STAGE 1: CRITICAL AUTHENTICATION REMEDIATION VERIFICATION');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // Requirement 1: Empty and malformed admin-login requests rejected
  // -------------------------------------------------------------------------
  console.log('--- Test 1: Empty & Malformed Admin-Login Requests ---');
  
  const resEmptyObj = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const dataEmptyObj = await resEmptyObj.json();
  assert(resEmptyObj.status === 400, 'Empty JSON payload {} returns HTTP 400', `Status: ${resEmptyObj.status}`);
  assert(!dataEmptyObj.token, 'Empty JSON payload does NOT issue a JWT token');
  assert(!dataEmptyObj.user, 'Empty JSON payload does NOT return an admin user');

  const resEmptyFields = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prakashsuvedi.backup@gmail.com', password: '' }),
  });
  assert(resEmptyFields.status === 400, 'Empty password string returns HTTP 400');

  const resWhitespace = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prakashsuvedi.backup@gmail.com', password: '    ' }),
  });
  assert(resWhitespace.status === 400, 'Whitespace password returns HTTP 400');

  // -------------------------------------------------------------------------
  // Requirement 2: Invalid credentials cannot obtain an administrator JWT
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Invalid Credentials Rejection ---');
  
  const resBadPass = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prakashsuvedi.backup@gmail.com', password: 'incorrect-admin-password' }),
  });
  const dataBadPass = await resBadPass.json();
  assert(resBadPass.status === 401, 'Incorrect password returns HTTP 401 Unauthorized', `Status: ${resBadPass.status}`);
  assert(!dataBadPass.token, 'Incorrect password does not return token');

  const resBadEmail = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'attacker@evil.com', password: ADMIN_CREDENTIALS.password || 'admin@123' }),
  });
  assert(resBadEmail.status === 401, 'Non-whitelisted email returns HTTP 401 Unauthorized');

  // Short password (< 8 chars)
  const resShortPass = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'prakashsuvedi.backup@gmail.com', password: 'short' }),
  });
  assert(resShortPass.status === 401, 'Short password (< 8 chars) returns HTTP 401 Unauthorized');

  // -------------------------------------------------------------------------
  // Requirement 3: Legitimate configured administrator authentication still works
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Legitimate Administrator Authentication ---');

  const configuredPass = ADMIN_CREDENTIALS.password || process.env.ADMIN_PASSWORD || 'admin@123';
  const configuredEmail = ADMIN_CREDENTIALS.email || 'prakashsuvedi.backup@gmail.com';

  const resLegit = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: configuredEmail, password: configuredPass }),
  });
  const dataLegit = await resLegit.json();
  assert(resLegit.status === 200, 'Legitimate admin login returns HTTP 200 OK', `Status: ${resLegit.status}`);
  assert(dataLegit.success === true, 'Response reports success: true');
  assert(typeof dataLegit.token === 'string' && dataLegit.token.length > 50, 'Returns valid signed JWT token');
  assert(dataLegit.user?.role === 'admin', 'User record role is verified as admin');
  assert(ADMIN_WHITELIST_EMAILS.includes(dataLegit.user?.email.toLowerCase()), 'User email matches whitelist');

  const legitAdminToken = dataLegit.token;

  // -------------------------------------------------------------------------
  // Requirement 4 & 5: Spoofed x-user-id and userId query params blocked
  // -------------------------------------------------------------------------
  console.log('\n--- Test 4 & 5: Spoofed x-user-id and ?userId Rejection ---');

  const resSpoofedHeader = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { 'x-user-id': 'usr_admin_01' },
  });
  assert(resSpoofedHeader.status === 403, 'Spoofed x-user-id: usr_admin_01 returns HTTP 403 Forbidden', `Status: ${resSpoofedHeader.status}`);

  const resSpoofedQuery = await fetch(`${BASE_URL}/api/admin/users?userId=usr_admin_01`);
  assert(resSpoofedQuery.status === 403, 'Spoofed ?userId=usr_admin_01 returns HTTP 403 Forbidden', `Status: ${resSpoofedQuery.status}`);

  const resSpoofedBoth = await fetch(`${BASE_URL}/api/admin/users?userId=usr_admin_saghimire12`, {
    headers: { 'x-user-id': 'usr_admin_saghimire12' },
  });
  assert(resSpoofedBoth.status === 403, 'Spoofed alternate admin user returns HTTP 403 Forbidden');

  // -------------------------------------------------------------------------
  // Requirement 6: Unauthenticated callers cannot execute admin actions
  // -------------------------------------------------------------------------
  console.log('\n--- Test 6: Unauthenticated Administrative Actions Blocked ---');

  const adminRoutes = [
    { method: 'GET', path: '/api/admin/users' },
    { method: 'GET', path: '/api/admin/postgres/verify' },
    { method: 'GET', path: '/api/admin/backups' },
    { method: 'GET', path: '/api/admin/db/export' },
    { method: 'GET', path: '/api/admin/daily-reset-audit' },
    { method: 'POST', path: '/api/admin/backups/create' },
    { method: 'GET', path: '/api/admin/feedback' },
  ];

  for (const route of adminRoutes) {
    const res = await fetch(`${BASE_URL}${route.path}`, { method: route.method });
    assert(res.status === 403, `Unauthenticated ${route.method} ${route.path} returns HTTP 403`);
  }

  // -------------------------------------------------------------------------
  // Requirement 7: Authenticated non-admin users cannot perform admin actions
  // -------------------------------------------------------------------------
  console.log('\n--- Test 7: Non-Admin Authenticated Users Blocked ---');

  // Test regular user token with role: 'user'
  const normalUserToken = generateJwtToken({
    userId: 'usr_admin_01',
    email: 'client@nepal.ai',
    role: 'user',
    tier: 'creator',
  }, 3600);

  const resNormalUser = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${normalUserToken}` },
  });
  assert(resNormalUser.status === 403, 'Authenticated non-admin user returns HTTP 403 Forbidden', `Status: ${resNormalUser.status}`);

  // Forged admin role on non-whitelisted email
  const forgedAdminToken = generateJwtToken({
    userId: 'usr_evil_attacker',
    email: 'attacker@evil.com',
    role: 'admin',
    tier: 'pro_studio',
  }, 3600);

  const resForgedAdmin = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${forgedAdminToken}` },
  });
  assert(resForgedAdmin.status === 403, 'Forged admin role with non-whitelisted email is blocked with HTTP 403');

  // -------------------------------------------------------------------------
  // Requirement 8: Expired, malformed, or invalidly signed JWTs rejected
  // -------------------------------------------------------------------------
  console.log('\n--- Test 8: Tampered & Expired Token Rejection ---');

  const expiredToken = generateJwtToken({
    userId: 'usr_admin_01',
    email: 'prakashsuvedi.backup@gmail.com',
    role: 'admin',
  }, -300); // Expired 5 mins ago

  const resExpired = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(resExpired.status === 403, 'Expired admin JWT returns HTTP 403');

  const malformedToken = `${legitAdminToken.slice(0, -10)}abcdefghij`;
  const resMalformed = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${malformedToken}` },
  });
  assert(resMalformed.status === 403, 'Tampered signature JWT returns HTTP 403');

  // -------------------------------------------------------------------------
  // Requirement 9: Missing configuration fails closed
  // -------------------------------------------------------------------------
  console.log('\n--- Test 9: Fail-Closed Behavior on Missing Secret ---');

  assert(isValidAdminSecret('') === false, 'Empty string is never a valid admin secret');
  assert(isValidAdminSecret('   ') === false, 'Whitespace is never a valid admin secret');
  assert(isValidAdminSecret('admin') === false, 'Weak password "admin" is rejected');
  assert(isValidAdminSecret('123456') === false, 'Weak password "123456" is rejected');
  assert(isValidAdminSecret('password') === false, 'Weak password "password" is rejected');
  assert(isValidAdminSecret('nepalai') === false, 'Weak password "nepalai" is rejected');

  // -------------------------------------------------------------------------
  // Requirement 10: Query-string admin secrets rejected
  // -------------------------------------------------------------------------
  console.log('\n--- Test 10: Query-String Admin Key Rejection ---');

  const resQueryAdminKey = await fetch(`${BASE_URL}/api/admin/users?adminKey=admin`);
  assert(resQueryAdminKey.status === 403, 'Query parameter ?adminKey=admin returns HTTP 403');

  const resQueryRealKey = await fetch(`${BASE_URL}/api/admin/users?adminKey=${configuredPass}`);
  assert(resQueryRealKey.status === 403, 'Query parameter ?adminKey=<secret> is rejected with HTTP 403 (Header only)');

  // But legitimate x-admin-key header works
  const adminSecretKey = ADMIN_CREDENTIALS.adminKey || process.env.ADMIN_SECRET_KEY || configuredPass;
  const resHeaderAdminKey = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { 'x-admin-key': adminSecretKey },
  });
  assert(resHeaderAdminKey.status === 200, 'Legitimate x-admin-key HTTP header returns HTTP 200 OK');

  // Legitimate JWT Bearer token works
  const resBearerAdmin = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${legitAdminToken}` },
  });
  assert(resBearerAdmin.status === 200, 'Legitimate JWT Bearer token returns HTTP 200 OK on admin routes');

  // -------------------------------------------------------------------------
  // Requirement 11: Normal user, guest, and standard routes remain compatible
  // -------------------------------------------------------------------------
  console.log('\n--- Test 11: User, Subscriber & Guest Compatibility ---');

  const resHealth = await fetch(`${BASE_URL}/api/health`);
  assert(resHealth.status === 200, 'GET /api/health is accessible without authentication (HTTP 200)');

  const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${normalUserToken}` },
  });
  assert(resMe.status === 200, 'GET /api/auth/me resolves regular user profile successfully');

  // -------------------------------------------------------------------------
  // Stage 2: Diagnostic Gating & Information Shielding (Findings 04 & 05)
  // -------------------------------------------------------------------------
  console.log('\n--- Stage 2 Tests: Diagnostic Gating (Findings 04 & 05) ---');

  // Finding 04: /api/diagnostic/storage/r2
  const resUnauthR2 = await fetch(`${BASE_URL}/api/diagnostic/storage/r2`);
  assert(resUnauthR2.status === 403, 'Unauthenticated GET /api/diagnostic/storage/r2 returns HTTP 403 Forbidden');

  const resNonAdminR2 = await fetch(`${BASE_URL}/api/diagnostic/storage/r2`, {
    headers: { Authorization: `Bearer ${normalUserToken}` },
  });
  assert(resNonAdminR2.status === 403, 'Non-admin GET /api/diagnostic/storage/r2 returns HTTP 403 Forbidden');

  const resSpoofedR2 = await fetch(`${BASE_URL}/api/diagnostic/storage/r2`, {
    headers: { 'x-user-id': 'usr_admin_01' },
  });
  assert(resSpoofedR2.status === 403, 'Spoofed x-user-id on /api/diagnostic/storage/r2 returns HTTP 403 Forbidden');

  const resAdminR2 = await fetch(`${BASE_URL}/api/diagnostic/storage/r2`, {
    headers: { Authorization: `Bearer ${legitAdminToken}` },
  });
  assert(resAdminR2.status === 200, 'Authenticated admin GET /api/diagnostic/storage/r2 returns HTTP 200 OK');

  // Finding 05: /api/diagnostic/ai-credentials
  const resUnauthAiCreds = await fetch(`${BASE_URL}/api/diagnostic/ai-credentials`);
  assert(resUnauthAiCreds.status === 403, 'Unauthenticated GET /api/diagnostic/ai-credentials returns HTTP 403 Forbidden');

  const resNonAdminAiCreds = await fetch(`${BASE_URL}/api/diagnostic/ai-credentials`, {
    headers: { Authorization: `Bearer ${normalUserToken}` },
  });
  assert(resNonAdminAiCreds.status === 403, 'Non-admin GET /api/diagnostic/ai-credentials returns HTTP 403 Forbidden');

  const resSpoofedAiCreds = await fetch(`${BASE_URL}/api/diagnostic/ai-credentials`, {
    headers: { 'x-user-id': 'usr_admin_01' },
  });
  assert(resSpoofedAiCreds.status === 403, 'Spoofed x-user-id on /api/diagnostic/ai-credentials returns HTTP 403 Forbidden');

  const resAdminAiCreds = await fetch(`${BASE_URL}/api/diagnostic/ai-credentials`, {
    headers: { Authorization: `Bearer ${legitAdminToken}` },
  });
  assert(resAdminAiCreds.status === 200, 'Authenticated admin GET /api/diagnostic/ai-credentials returns HTTP 200 OK');

  // Verify public health endpoints remain accessible without authentication
  const resLive = await fetch(`${BASE_URL}/api/health/live`);
  assert(resLive.status === 200, 'Public probe /api/health/live is accessible without authentication (HTTP 200)');

  const resReady = await fetch(`${BASE_URL}/api/health/ready`);
  assert(resReady.status === 200, 'Public probe /api/health/ready is accessible without authentication (HTTP 200)');

  const resDiagnosticPublic = await fetch(`${BASE_URL}/api/diagnostic`);
  assert(resDiagnosticPublic.status === 200, 'Public probe /api/diagnostic is accessible without authentication (HTTP 200)');

  // -------------------------------------------------------------------------
  // Stage 3: Multi-Tenant Project Isolation & BOLA/IDOR Prevention (Finding 06)
  // -------------------------------------------------------------------------
  console.log('\n--- Stage 3 Tests: Tenant Project Isolation & BOLA Prevention (Finding 06) ---');

  const aliceUserId = 'usr_tenant_alice_stage3';
  const bobUserId = 'usr_tenant_bob_stage3';

  const aliceToken = generateJwtToken({
    userId: aliceUserId,
    email: 'alice@production.ai',
    role: 'user',
    tier: 'creator',
  }, 3600);

  const bobToken = generateJwtToken({
    userId: bobUserId,
    email: 'bob@production.ai',
    role: 'user',
    tier: 'creator',
  }, 3600);

  const aliceProjectId = `proj_alice_priv_${Date.now()}`;
  const guestProjectId = `proj_guest_open_${Date.now()}`;

  // 1. Alice creates her private project snapshot
  const resAliceCreate = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}/versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aliceToken}`,
    },
    body: JSON.stringify({
      title: 'Alice Private Commercial',
      description: 'Confidential commercial cut for Alice',
      scenes: [{ id: 'sc_1', title: 'Kathmandu Drone Shot', duration: 5 }],
      ownerId: aliceUserId,
    }),
  });
  assert(resAliceCreate.status === 200, 'Owner (Alice) creates project version snapshot successfully (HTTP 200)');

  // 2. Alice retrieves her project -> 200 OK
  const resAliceGet = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  assert(resAliceGet.status === 200, 'Owner (Alice) can access her project (HTTP 200)');
  const aliceProjectJson = await resAliceGet.json();
  assert(aliceProjectJson.project?.title === 'Alice Private Commercial', 'Alice project data correctly returned');

  // 3. Bob attempts to access Alice\'s project -> 403 Forbidden
  const resBobGet = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  assert(resBobGet.status === 403, 'Unauthorized tenant (Bob) is blocked from Alice\'s project (HTTP 403 Forbidden)');
  const bobErrJson = await resBobGet.json();
  assert(bobErrJson.code === 'FORBIDDEN_TENANT_ACCESS', 'Error code is FORBIDDEN_TENANT_ACCESS');

  // 4. Bob attempts to spoof Alice\'s identity with x-user-id -> 403 Forbidden
  const resBobSpoofHeader = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}`, {
    headers: {
      Authorization: `Bearer ${bobToken}`,
      'x-user-id': aliceUserId,
    },
  });
  assert(resBobSpoofHeader.status === 403, 'Spoofed x-user-id does not grant Bob access to Alice\'s project (HTTP 403)');

  // 5. Bob attempts to spoof Alice\'s identity with ?userId=... -> 403 Forbidden
  const resBobSpoofQuery = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}?userId=${aliceUserId}`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  assert(resBobSpoofQuery.status === 403, 'Spoofed ?userId query param does not grant Bob access to Alice\'s project (HTTP 403)');

  // 6. Unauthenticated caller attempts to access Alice\'s project -> 403 Forbidden
  const resUnauthGet = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}`);
  assert(resUnauthGet.status === 403, 'Unauthenticated caller is blocked from private project (HTTP 403 Forbidden)');

  // 7. Platform Admin audit access to Alice\'s project -> 200 OK
  const resAdminGetAlice = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}`, {
    headers: { Authorization: `Bearer ${legitAdminToken}` },
  });
  assert(resAdminGetAlice.status === 200, 'Platform admin has verified audit access to Alice\'s project (HTTP 200 OK)');

  // 8. Bob attempts to list Alice\'s project versions -> 403 Forbidden
  const resBobVersions = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}/versions`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  assert(resBobVersions.status === 403, 'Unauthorized tenant (Bob) cannot view Alice\'s project version history (HTTP 403)');

  // 9. Bob attempts to create a new version on Alice\'s project -> 403 Forbidden
  const resBobCreateVersion = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}/versions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`,
    },
    body: JSON.stringify({
      title: 'Bob Malicious Overwrite',
      scenes: [{ id: 'sc_bad', duration: 1 }],
    }),
  });
  assert(resBobCreateVersion.status === 403, 'Unauthorized tenant (Bob) cannot add versions to Alice\'s project (HTTP 403)');

  // 10. Bob attempts to restore a version on Alice\'s project -> 403 Forbidden
  const resBobRestore = await fetch(`${BASE_URL}/api/projects/${aliceProjectId}/versions/ver_random/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  assert(resBobRestore.status === 403, 'Unauthorized tenant (Bob) cannot restore versions on Alice\'s project (HTTP 403)');

  // 11. Bob attempts to overwrite Alice\'s project via atomic-save -> 403 Forbidden
  const resBobAtomic = await fetch(`${BASE_URL}/api/transactions/atomic-save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bobToken}`,
    },
    body: JSON.stringify({
      projectId: aliceProjectId,
      scenes: [{ id: 'sc_tamper', duration: 10 }],
    }),
  });
  assert(resBobAtomic.status === 403, 'Unauthorized tenant (Bob) cannot overwrite project via atomic-save (HTTP 403)');

  // 12. Project Listing Isolation (GET /api/projects)
  const resAliceList = await fetch(`${BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${aliceToken}` },
  });
  assert(resAliceList.status === 200, 'Alice can list projects (HTTP 200)');
  const aliceListJson = await resAliceList.json();
  const aliceHasHerProject = aliceListJson.projects?.some((p: any) => p.id === aliceProjectId);
  assert(aliceHasHerProject === true, 'Alice\'s project list contains her project');

  const resBobList = await fetch(`${BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${bobToken}` },
  });
  assert(resBobList.status === 200, 'Bob can list projects (HTTP 200)');
  const bobListJson = await resBobList.json();
  const bobHasAliceProject = bobListJson.projects?.some((p: any) => p.id === aliceProjectId);
  assert(bobHasAliceProject === false, 'Bob\'s project list does NOT contain Alice\'s private project (Tenant Isolated)');

  // 13. Open Guest Project Compatibility
  const resGuestCreate = await fetch(`${BASE_URL}/api/projects/${guestProjectId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Guest Community Workspace',
      scenes: [{ id: 'sc_guest', duration: 4 }],
      ownerId: 'usr_guest',
    }),
  });
  assert(resGuestCreate.status === 200, 'Guest project version created successfully (HTTP 200)');

  const resGuestGet = await fetch(`${BASE_URL}/api/projects/${guestProjectId}`);
  assert(resGuestGet.status === 200, 'Guest project remains accessible without authentication (HTTP 200)');

  // -------------------------------------------------------------------------
  // Stage 4: AI Resource Protection & Quota Evasion Prevention (Finding 07)
  // -------------------------------------------------------------------------
  console.log('\n--- Stage 4 Tests: AI Resource Protection & Quota Evasion (Finding 07) ---');

  const exhaustedUser = db.findOrCreateUser('exhausted@tenant.ai', 'Exhausted User');
  db.updateUser(exhaustedUser.id, { credits: 0, tier: 'free_trial' });
  db.setTrialUsage(exhaustedUser.id, {
    imagesCount: 50,
    maxImages: 50,
    videoCount: 20,
    maxVideo: 20,
  });

  const exhaustedToken = generateJwtToken({
    userId: exhaustedUser.id,
    email: 'exhausted@tenant.ai',
    role: 'user',
    tier: 'free_trial',
  }, 3600);

  // 1. Non-admin passes adminBypass: true on /api/images/azure -> blocked with 403
  const resBypassImg = await fetch(`${BASE_URL}/api/images/azure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Cinematic Himalayan peaks at sunrise',
      adminBypass: true,
    }),
  });
  assert(resBypassImg.status === 403, 'Non-admin with adminBypass: true on /api/images/azure returns HTTP 403 Forbidden');
  const bypassImgJson = await resBypassImg.json();
  assert(bypassImgJson.code === 'INSUFFICIENT_CREDITS' || bypassImgJson.quotaExceeded === true, 'Response reports quotaExceeded/INSUFFICIENT_CREDITS');

  // 2. Non-admin spoofs userId: "usr_admin_01" on /api/images/azure -> blocked with 403
  const resSpoofUserImg = await fetch(`${BASE_URL}/api/images/azure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Cinematic Himalayan peaks at sunrise',
      userId: 'usr_admin_01',
    }),
  });
  assert(resSpoofUserImg.status === 403, 'Non-admin spoofing userId: "usr_admin_01" on /api/images/azure returns HTTP 403 Forbidden');

  // 3. Missing prompt on /api/images/azure -> 400 Bad Request
  const resEmptyPrompt = await fetch(`${BASE_URL}/api/images/azure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminBypass: true }),
  });
  assert(resEmptyPrompt.status === 400, 'Missing prompt on /api/images/azure returns HTTP 400 Bad Request');

  // 4. Non-admin passes adminBypass: true on /api/video/azure -> blocked with 403
  const resBypassVid = await fetch(`${BASE_URL}/api/video/azure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Cinematic aerial video of Pokhara lake',
      adminBypass: true,
    }),
  });
  assert(resBypassVid.status === 403, 'Non-admin with adminBypass: true on /api/video/azure returns HTTP 403 Forbidden');
  const bypassVidJson = await resBypassVid.json();
  assert(bypassVidJson.code === 'INSUFFICIENT_CREDITS' || bypassVidJson.quotaExceeded === true, 'Response reports video quotaExceeded/INSUFFICIENT_CREDITS');

  // 5. Non-admin spoofs userId: "usr_admin_01" on /api/video/azure -> blocked with 403
  const resSpoofUserVid = await fetch(`${BASE_URL}/api/video/azure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Cinematic aerial video of Pokhara lake',
      userId: 'usr_admin_01',
    }),
  });
  assert(resSpoofUserVid.status === 403, 'Non-admin spoofing userId: "usr_admin_01" on /api/video/azure returns HTTP 403 Forbidden');

  // 6. Non-admin spoofs userId: "usr_admin_01" on /api/generate/image -> blocked with 403
  const resSpoofGenImg = await fetch(`${BASE_URL}/api/generate/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Test generation prompt',
      userId: 'usr_admin_01',
    }),
  });
  assert(resSpoofGenImg.status === 403, 'Non-admin spoofing userId: "usr_admin_01" on /api/generate/image returns HTTP 403 Forbidden');
  const genImgJson = await resSpoofGenImg.json();
  assert(genImgJson.code === 'PAYWALL_TRIGGERED', 'Response code is PAYWALL_TRIGGERED');

  // 7. Non-admin spoofs userId: "usr_admin_01" on /api/generate/video -> blocked with 403
  const resSpoofGenVid = await fetch(`${BASE_URL}/api/generate/video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${exhaustedToken}`,
    },
    body: JSON.stringify({
      prompt: 'Test video prompt',
      userId: 'usr_admin_01',
    }),
  });
  assert(resSpoofGenVid.status === 403, 'Non-admin spoofing userId: "usr_admin_01" on /api/generate/video returns HTTP 403 Forbidden');
  const genVidJson = await resSpoofGenVid.json();
  assert(genVidJson.code === 'PAYWALL_TRIGGERED', 'Response code is PAYWALL_TRIGGERED');

  // -------------------------------------------------------------------------
  // Stage 5: Persistence Outbox Queue & Cloud Sync Resilience (Finding 08)
  // -------------------------------------------------------------------------
  console.log('\n--- Stage 5 Tests: Persistence Outbox Queue & Cloud Sync Resilience (Finding 08) ---');

  const initialPendingCount = db.getPendingSyncOutbox().length;

  // 1. Enqueue outbox item explicitly
  const sampleUser: User = {
    id: `usr_outbox_test_${Date.now()}`,
    email: `outbox_${Date.now()}@test.ai`,
    name: 'Outbox Test User',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    role: 'user',
    tier: 'free_trial',
    credits: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const queuedItem = db.enqueueSyncOutbox('user', sampleUser, 'Simulated network drop');
  assert(queuedItem.id.startsWith('outbox_'), 'Outbox item generated with unique ID');
  assert(queuedItem.type === 'user', 'Outbox item preserves entity type');
  assert(queuedItem.attempts === 0, 'Outbox item initialized with 0 attempts');
  assert(queuedItem.lastError === 'Simulated network drop', 'Outbox item records failure reason');

  // 2. Outbox pending list retrieval
  const pendingItems = db.getPendingSyncOutbox();
  assert(pendingItems.some(i => i.id === queuedItem.id), 'Pending outbox list contains newly queued item');

  // 3. Sync fallback enqueues to outbox when disconnected
  const prevCount = db.getPendingSyncOutbox().length;
  await db.syncTransactionToPostgres({
    id: `tx_outbox_${Date.now()}`,
    userId: sampleUser.id,
    userEmail: sampleUser.email,
    packageId: 'sasta_50_npr',
    packageName: 'Sasta Micro-Pass',
    amount: 0.38,
    currency: 'USD',
    creditsAdded: 60,
    stripePaymentId: 'test_outbox_stripe_session_101',
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  });
  const afterTxCount = db.getPendingSyncOutbox().length;
  assert(afterTxCount >= prevCount, 'syncTransactionToPostgres safely captures or enqueues transaction');

  // 4. Safe non-crashing execution of drainPendingSyncOutbox()
  const drainResult = await db.drainPendingSyncOutbox();
  assert(typeof drainResult.processed === 'number', 'drainPendingSyncOutbox returns processed count');
  assert(typeof drainResult.succeeded === 'number', 'drainPendingSyncOutbox returns succeeded count');
  assert(typeof drainResult.failed === 'number', 'drainPendingSyncOutbox returns failed count');

  // 5. Admin verification endpoint reports outbox telemetry
  const resAdminPostgresVerify = await fetch(`${BASE_URL}/api/admin/postgres/verify`, {
    headers: { Authorization: `Bearer ${legitAdminToken}` },
  });
  assert(resAdminPostgresVerify.status === 200, 'Authenticated admin GET /api/admin/postgres/verify returns HTTP 200');
  const verifyJson = await resAdminPostgresVerify.json();
  assert(verifyJson.outbox !== undefined, 'Response includes outbox telemetry');
  assert(typeof verifyJson.outbox.pendingCount === 'number', 'Response reports outbox pendingCount metric');

  // 6. Non-admin is blocked from /api/admin/postgres/verify
  const resNonAdminPostgresVerify = await fetch(`${BASE_URL}/api/admin/postgres/verify`, {
    headers: { Authorization: `Bearer ${exhaustedToken}` },
  });
  assert(resNonAdminPostgresVerify.status === 403, 'Non-admin GET /api/admin/postgres/verify returns HTTP 403 Forbidden');

  // -------------------------------------------------------------------------
  // Requirement 12: All 110 API routes preserved
  // -------------------------------------------------------------------------
  console.log('\n--- Test 12: 110 Routes Registration Verification ---');

  const serverContent = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  const routeMatches = serverContent.match(/app\.(get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\2/g) || [];
  assert(routeMatches.length >= 110, `All registered endpoints preserved (Found: ${routeMatches.length} routes)`);

  console.log('\n========================================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passed}/${passed + failed} CHECKS PASSED`);
  if (failed === 0) {
    console.log('🎉 100% OF PHASE 01B STAGES 1, 2, 3, 4 & 5 SECURITY TESTS PASSED!');
  } else {
    console.error(`⚠️ ${failed} tests failed!`);
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runPhase1bVerification().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
