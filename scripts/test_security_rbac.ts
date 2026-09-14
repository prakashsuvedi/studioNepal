/**
 * Security, RBAC & Tenant Isolation Test Suite (Phase 1)
 *
 * Verifies:
 * 1. Cryptographic HS256 JWT Token Signing & Verification
 * 2. Signature Tampering & Forgery Rejection
 * 3. Expired Token Rejection
 * 4. Deprecation of legacy insecure static tokens
 * 5. Admin Whitelist and Privilege Escalation Prevention
 * 6. Multi-Tenant Project Version History Scoping (IDOR Protection)
 * 7. Guest Studio Workspace Backwards Compatibility
 */

import { 
  generateJwtToken, 
  verifyJwtToken, 
  ADMIN_WHITELIST_EMAILS, 
  ADMIN_CREDENTIALS,
  isUserAdmin,
  extractAuthUser,
  JWT_SECRET 
} from '../src/server/credentials';
import { versionHistory } from '../src/server/versionHistory';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failed++;
  }
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log('🔒 Running Phase 1: Security, Auth & Tenant Isolation Test Suite');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test Group 1: JWT Signing & Verification
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Cryptographic JWT Verification ---');
  
  const validToken = generateJwtToken({
    userId: 'usr_nepal_001',
    email: 'creator@kathmandu.ai',
    role: 'user',
    tier: 'pro_studio',
  }, 3600);

  const verification = verifyJwtToken(validToken);
  assert(verification.valid === true, 'Valid JWT token verifies successfully');
  assert(verification.payload?.userId === 'usr_nepal_001', 'Payload userId is accurately extracted');
  assert(verification.payload?.role === 'user', 'Payload role is accurately extracted');

  // Bearer prefix handling
  const bearerVerification = verifyJwtToken(`Bearer ${validToken}`);
  assert(bearerVerification.valid === true, 'Bearer prefixed token verifies seamlessly');

  // -------------------------------------------------------------
  // Test Group 2: Signature Tampering & Forged Token Rejection
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Signature Tampering & Forgery Prevention ---');
  
  const parts = validToken.split('.');
  // Modify the payload to attempt privilege escalation (role: "admin")
  const tamperedPayloadObj = {
    userId: 'usr_nepal_001',
    email: 'creator@kathmandu.ai',
    role: 'admin', // FORGED ADMIN ROLE
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  const tamperedB64Payload = Buffer.from(JSON.stringify(tamperedPayloadObj)).toString('base64url');
  const tamperedToken = `${parts[0]}.${tamperedB64Payload}.${parts[2]}`;

  const tamperedResult = verifyJwtToken(tamperedToken);
  assert(tamperedResult.valid === false, 'Tampered token payload is strictly rejected');
  assert(tamperedResult.reason === 'Invalid signature', 'Returns "Invalid signature" error');

  // Completely forged token with invalid secret
  const forgedSig = crypto.createHmac('sha256', 'attacker_fake_secret').update(`${parts[0]}.${parts[1]}`).digest('base64url');
  const forgedToken = `${parts[0]}.${parts[1]}.${forgedSig}`;
  assert(verifyJwtToken(forgedToken).valid === false, 'Token signed with false secret is rejected');

  // -------------------------------------------------------------
  // Test Group 3: Token Expiration Checks
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Token Expiration Protection ---');

  const expiredToken = generateJwtToken({
    userId: 'usr_nepal_expired',
    email: 'old@nepal.ai',
    role: 'user',
  }, -100); // Expired in the past

  const expiredResult = verifyJwtToken(expiredToken);
  assert(expiredResult.valid === false, 'Expired token is rejected');
  assert(expiredResult.reason === 'Token expired', 'Reports "Token expired" status');

  // -------------------------------------------------------------
  // Test Group 4: Deprecation of Insecure Static Tokens
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Insecure Static Token Deprecation (SEC-1) ---');

  const legacyFakeAdminToken = 'admin_token_arbitrary_string_12345';
  const legacyCheck = verifyJwtToken(legacyFakeAdminToken);
  assert(legacyCheck.valid === false, 'Legacy unauthenticated "admin_token_*" is strictly rejected');

  const emptyCheck = verifyJwtToken('');
  assert(emptyCheck.valid === false, 'Empty token is rejected');

  // -------------------------------------------------------------
  // Test Group 5: RBAC & Admin Privilege Verification
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: RBAC & Admin Privilege Escalation Prevention ---');

  const realAdminToken = generateJwtToken({
    userId: 'usr_admin_real',
    email: 'prakashsuvedi.backup@gmail.com',
    role: 'admin',
  }, 3600);

  const realAdminVerification = verifyJwtToken(realAdminToken);
  assert(realAdminVerification.valid === true, 'Real whitelisted admin token is valid');
  assert(isUserAdmin(realAdminVerification.payload!), 'Whitelisted admin is recognized as admin');

  // Standard user should not be recognized as admin
  const regularUserPayload = {
    userId: 'usr_normal',
    email: 'normal@user.com',
    role: 'user' as const,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  assert(!isUserAdmin(regularUserPayload), 'Regular user cannot escalate to admin');

  // Direct Admin Key Header
  assert(isUserAdmin(null, { headers: { 'x-admin-key': ADMIN_CREDENTIALS.adminKey } }), 'Admin Secret Key header grants admin access');
  assert(!isUserAdmin(null, { headers: { 'x-admin-key': 'wrong-password' } }), 'Invalid admin key header is rejected');

  // -------------------------------------------------------------
  // Test Group 6: Multi-Tenant Project Isolation (SEC-2)
  // -------------------------------------------------------------
  console.log('\n--- Test Group 6: Multi-Tenant Project Isolation (IDOR Protection) ---');

  const tenantA_userId = 'usr_tenant_alice_101';
  const tenantB_userId = 'usr_tenant_bob_202';
  const projectA_id = 'proj_alice_commercial_01';

  // Alice saves a project version snapshot
  await versionHistory.saveVersion({
    projectId: projectA_id,
    title: 'Alice Cut v1',
    description: 'Initial commercial cut',
    createdBy: 'Alice',
    ownerId: tenantA_userId,
    scenes: [{ id: 's1', duration: 4, prompt: 'Kathmandu cityscape' }],
  });

  // 1. Alice queries her own project -> Allowed
  const aliceVersions = versionHistory.getVersions(projectA_id, tenantA_userId, false);
  assert(aliceVersions !== null && aliceVersions.length > 0, 'Project owner (Alice) can access her project versions');

  // 2. Bob attempts to access Alice\'s project -> Rejected (403 IDOR prevention)
  const bobAccessVersions = versionHistory.getVersions(projectA_id, tenantB_userId, false);
  assert(bobAccessVersions === null, 'Unauthorized tenant (Bob) is strictly BLOCKED from Alice\'s project');

  // 3. Platform Admin access -> Allowed for operational audits
  const adminAccessVersions = versionHistory.getVersions(projectA_id, undefined, true);
  assert(adminAccessVersions !== null && adminAccessVersions.length > 0, 'Platform admin has verified audit access');

  // 4. Open Guest Project -> Backwards compatible
  const guestProjectId = 'proj_guest_workspace_unclaimed';
  await versionHistory.saveVersion({
    projectId: guestProjectId,
    title: 'Draft Sequence',
    createdBy: 'Guest',
    scenes: [{ id: 'sg1', duration: 3 }],
  });

  const guestAccess = versionHistory.getVersions(guestProjectId, undefined, false);
  assert(guestAccess !== null, 'Unclaimed guest workspace remains accessible for single-session studio editing');

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log('\n================================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed}/${passed} Phase 1 Security & RBAC Tests PASSED!`);
  } else {
    console.error(`💥 ${failed} tests failed! (${passed} passed)`);
    process.exit(1);
  }
  console.log('================================================================');
}

runSecuritySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
