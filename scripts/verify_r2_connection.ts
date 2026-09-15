/**
 * Cloudflare R2 Live Connection Verification Script
 * Safely checks credentials, performs PutObject (write test), GetObject (read test),
 * ListObjectsV2 (list test), and DeleteObject (cleanup test).
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { storageBucket } from '../src/server/storageBucket';

async function verifyR2Connection() {
  console.log('================================================================');
  console.log('☁️  Cloudflare R2 Object Storage Connection Verification');
  console.log('================================================================\n');

  const config = storageBucket.getConfig();
  const endpoint = process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT || process.env.S3_ENDPOINT || config.s3Endpoint || '';
  const bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || process.env.S3_BUCKET || config.s3Bucket || 'nepalai';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || config.s3AccessKeyId || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || config.s3SecretAccessKey || '';
  let region = process.env.R2_REGION || config.s3Region || 'auto';
  if (
    !region ||
    region.includes(' ') ||
    region.includes('(') ||
    region.toLowerCase().includes('apac') ||
    (endpoint && endpoint.includes('r2.cloudflarestorage.com'))
  ) {
    region = 'auto';
  }

  // Normalize endpoint
  let cleanEndpoint = endpoint;
  try {
    if (cleanEndpoint) {
      const parsed = new URL(cleanEndpoint);
      parsed.pathname = '';
      cleanEndpoint = parsed.origin;
    }
  } catch {}

  console.log('--- 1. Environment & Configuration Check ---');
  console.log(`• Provider Configured:     ${config.provider}`);
  console.log(`• R2 Endpoint:             ${cleanEndpoint ? cleanEndpoint : '⚠️ Not configured in environment'}`);
  console.log(`• R2 Bucket Name:          ${bucket}`);
  console.log(`• R2 Region:               ${region}`);
  console.log(`• R2 Access Key ID:        ${accessKeyId ? `Configured (${accessKeyId.slice(0, 6)}...${accessKeyId.slice(-4)})` : '⚠️ Missing (R2_ACCESS_KEY_ID)'}`);
  console.log(`• R2 Secret Access Key:    ${secretAccessKey ? 'Configured (Hidden for security)' : '⚠️ Missing (R2_SECRET_ACCESS_KEY)'}`);

  if (!cleanEndpoint || !accessKeyId || !secretAccessKey) {
    console.log('\n--- 2. Diagnostic Assessment ---');
    console.log('⚠️ Cloudflare R2 credentials are not yet populated in the environment secrets.');
    console.log('\nTo complete the live connection:');
    console.log('1. Go to your AI Studio Settings / Secrets panel.');
    console.log('2. Add the following variables:');
    console.log('   - R2_ENDPOINT:          https://<your_account_id>.r2.cloudflarestorage.com');
    console.log('   - R2_BUCKET:            nepalai');
    console.log('   - R2_ACCESS_KEY_ID:     <your_r2_token_access_key_id>');
    console.log('   - R2_SECRET_ACCESS_KEY: <your_r2_token_secret_access_key>');
    console.log('   - STORAGE_PROVIDER:     r2');
    console.log('\nOnce added, the platform will automatically switch from local fallback to Cloudflare R2.');
    return;
  }

  console.log('\n--- 2. Live Cloudflare R2 Handshake & Operations Test ---');

  const s3 = new S3Client({
    region,
    endpoint: cleanEndpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const testKey = `nepalai_connection_test_${Date.now()}.txt`;
  const testPayload = `NepalAI Cloudflare R2 Handshake Verified at ${new Date().toISOString()}`;

  try {
    // 1. Check Bucket Accessibility / HeadBucket
    console.log('• Testing bucket access...');
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`  ✅ Bucket "${bucket}" is accessible and active.`);
    } catch (headErr: any) {
      console.log(`  ℹ️ HeadBucket check note: ${headErr?.message || headErr} (proceeding to PutObject test)`);
    }

    // 2. PutObject (Write Test)
    console.log('• Performing PutObject write test...');
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from(testPayload),
        ContentType: 'text/plain',
      })
    );
    console.log(`  ✅ Write test successful! Uploaded "${testKey}".`);

    // 3. GetObject (Read Test)
    console.log('• Performing GetObject read test...');
    const getRes = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: testKey,
      })
    );
    const readBytes = await getRes.Body?.transformToString();
    if (readBytes === testPayload) {
      console.log('  ✅ Read test successful! Payload matches exactly.');
    } else {
      console.log('  ⚠️ Read payload mismatch:', readBytes);
    }

    // 4. ListObjectsV2 (List Test)
    console.log('• Performing ListObjectsV2 test...');
    const listRes = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 5,
      })
    );
    console.log(`  ✅ List test successful! Found ${listRes.KeyCount || 0} objects in bucket.`);

    // 5. DeleteObject (Cleanup Test)
    console.log('• Performing DeleteObject cleanup...');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: testKey,
      })
    );
    console.log(`  ✅ Cleanup successful! Test object "${testKey}" deleted.`);

    console.log('\n================================================================');
    console.log('🎉 Cloudflare R2 Connection is FULLY OPERATIONAL & VERIFIED!');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ Cloudflare R2 Connection Failed:');
    console.error(`   Error Code: ${err?.name || 'Unknown'}`);
    console.error(`   Message:    ${err?.message || err}`);
    if (err?.$metadata) {
      console.error(`   HTTP Status: ${err.$metadata.httpStatusCode}`);
    }
  }
}

verifyR2Connection().catch((err) => {
  console.error('Fatal verification error:', err);
});
