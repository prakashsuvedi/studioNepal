import { generateJwtToken, verifyJwtToken, ADMIN_WHITELIST_EMAILS } from '../src/server/credentials';
import { db } from '../src/server/db';
import { fonePayGateway } from '../src/server/fonepayGateway';
import { storageBucket } from '../src/server/storageBucket';

async function testReadinessHardening() {
  console.log('=== Running Production Readiness Hardening Verification ===\n');

  // Test 1: JWT Signing and Verification
  console.log('Test 1: JWT Cryptographic Signing & Verification');
  const token = generateJwtToken({
    userId: 'usr_admin_01',
    email: 'prakashsuvedi.backup@gmail.com',
    role: 'admin',
    tier: 'pro_studio',
  });

  const verified = verifyJwtToken(token);
  if (!verified.valid || verified.payload?.email !== 'prakashsuvedi.backup@gmail.com') {
    throw new Error('JWT verification failed!');
  }
  console.log('  ✅ Valid JWT properly created and verified via HMAC-SHA256 signature.');

  const tamperedToken = token.slice(0, -4) + 'abcd';
  const tamperedVerified = verifyJwtToken(tamperedToken);
  if (tamperedVerified.valid) {
    throw new Error('Tampered token should be rejected!');
  }
  console.log('  ✅ Tampered token correctly rejected (signature mismatch).');

  // Test 2: Admin Auto-Elevation Prevention
  console.log('\nTest 2: Admin Whitelist Check');
  const attacker = db.findOrCreateUser('hacker.admin@malicious.com', 'Hacker');
  if (attacker.role === 'admin' || attacker.tier === 'pro_studio') {
    throw new Error('Attacker was elevated to admin role!');
  }
  console.log('  ✅ Malicious user with "admin" in email was NOT granted admin privileges (role: ' + attacker.role + ').');

  const legitAdmin = db.findOrCreateUser('prakashsuvedi.backup@gmail.com');
  if (legitAdmin.role !== 'admin') {
    throw new Error('Whitelisted admin was not recognized!');
  }
  console.log('  ✅ Whitelisted admin correctly recognized.');

  // Test 3: FonePay PRN Idempotency & Replay Attack Defense
  console.log('\nTest 3: FonePay Idempotency & Anti-Replay Defense');
  const testPrn = 'TEST_PRN_' + Date.now();
  const tx1 = db.processFonePayPayment(attacker.id, 'sasta_50_npr', testPrn);
  if (!tx1 || tx1.creditsAdded !== 60) {
    throw new Error('First payment failed to process');
  }
  console.log('  ✅ First payment processed successfully (added 60 credits).');

  let replayCaught = false;
  try {
    db.processFonePayPayment(attacker.id, 'sasta_50_npr', testPrn);
  } catch (e: any) {
    replayCaught = true;
    console.log('  ✅ Replay attack prevented:', e.message);
  }
  if (!replayCaught) {
    throw new Error('Duplicate PRN was allowed to credit twice!');
  }

  // Test 4: Storage Path Traversal Defense
  console.log('\nTest 4: Storage Path Traversal Defense');
  const pathTraversalResult = storageBucket.getLocalFile('../../../etc/passwd');
  if (pathTraversalResult.exists) {
    throw new Error('Path traversal vulnerability detected!');
  }
  console.log('  ✅ Path traversal attempts safely rejected and sanitized.');

  console.log('\n=== All Production Readiness Hardening Tests Passed! ===\n');
  process.exit(0);
}

testReadinessHardening().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
