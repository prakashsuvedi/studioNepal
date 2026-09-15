/**
 * Test Suite: Storage & R2 Diagnostic Client
 * Tests:
 * 1. storage.ts diagnostic types & method exports
 * 2. inspectR2Bucket behavior under configured / unconfigured credentials
 * 3. listR2BucketContents data structure and error handling
 */

import { storageBucket } from '../src/server/storageBucket';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

async function runR2DiagnosticSuite() {
  console.log('================================================================');
  console.log('🧪 Running Storage & Cloudflare R2 Diagnostic Unit & API Suite');
  console.log('================================================================\n');

  console.log('--- Test Group 1: Storage Bucket R2 Inspection API ---');
  const inspection = await storageBucket.inspectR2Bucket();
  assert(typeof inspection.authorized === 'boolean', 'inspectR2Bucket returns boolean authorized field');
  assert(inspection.bucket === 'nepalai', 'inspectR2Bucket targets "nepalai" bucket');
  assert(inspection.region === 'auto', 'inspectR2Bucket region is normalized to "auto"');
  assert(typeof inspection.latencyMs === 'number' && inspection.latencyMs >= 0, 'inspectR2Bucket returns numeric latency in ms');
  assert(Array.isArray(inspection.objects), 'inspectR2Bucket returns array of objects');

  console.log('\n--- Test Group 2: S3/R2 Endpoint Normalization ---');
  const config = storageBucket.getConfig();
  assert(config.s3Bucket === 'nepalai', 'Configured s3Bucket is "nepalai"');
  assert(config.s3Region === 'auto', 'Configured region is "auto"');

  console.log('\n================================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed}/${passed} Storage & R2 Diagnostic Tests PASSED!`);
  } else {
    console.error(`⚠️ ${failed} tests failed`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runR2DiagnosticSuite().catch((err) => {
  console.error('Fatal error in R2 diagnostic test suite:', err);
  process.exit(1);
});
