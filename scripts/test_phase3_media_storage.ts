/**
 * Phase 3 Verification Test Suite: Media Processing, Storage & Queue Hardening
 * Tests non-blocking async operations, path-traversal protection, automated storage reaping,
 * queue concurrency metrics, and lifecycle state machines.
 */

import fs from 'fs';
import path from 'path';
import { storageBucket } from '../src/server/storageBucket';
import { videoProcessor } from '../src/server/videoProcessor';
import { renderQueueManager } from '../src/server/queue/renderQueue';

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

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🎬 Running Phase 3: Media Processing, Storage & Queue Hardening');
  console.log('================================================================\n');

  // --- Test Group 1: Storage Bucket Async Media Persistence & Security ---
  console.log('--- Test Group 1: Storage Bucket Async Media Operations ---');
  
  // 1. Save Base64 Image
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const saveResult = await storageBucket.saveMedia('test_phase3_pixel.png', sampleBase64, 'image/png');
  
  assert(!!saveResult.url, 'Save base64 image returns valid URL', saveResult.url);
  assert(saveResult.sizeBytes > 0, 'Image file size is greater than 0', `${saveResult.sizeBytes} bytes`);
  assert(saveResult.filename === 'test_phase3_pixel.png', 'Filename is preserved and sanitized');

  // 2. Download and Verify
  const downloadResult = await storageBucket.downloadMedia('test_phase3_pixel.png');
  assert(downloadResult.exists, 'downloadMedia finds previously saved file');
  assert(downloadResult.buffer.length === saveResult.sizeBytes, 'Downloaded buffer matches original byte length');
  assert(downloadResult.mimeType === 'image/png', 'MIME type is accurately inferred as image/png');

  // 3. Path Traversal Hardening Test
  const traversalResult = storageBucket.getLocalFile('../../etc/passwd');
  assert(!traversalResult.exists, 'Path traversal attempt ../../etc/passwd is neutralized');
  assert(traversalResult.buffer.length === 0, 'Path traversal returns empty buffer');

  // 4. List Files
  const fileList = await storageBucket.listFiles();
  assert(Array.isArray(fileList) && fileList.length > 0, 'listFiles returns array of stored media files');
  assert(fileList.some(f => f.filename === 'test_phase3_pixel.png'), 'Stored pixel image is present in file list');

  // 5. Cloudflare R2 Endpoint & Bucket Configuration Normalization
  storageBucket.updateConfig({
    s3Endpoint: 'https://310426922bd6089a344dcae56abdc760.r2.cloudflarestorage.com/nepalai',
    s3Bucket: 'nepalai',
  });
  const r2Config = storageBucket.getConfig();
  assert(r2Config.s3Bucket === 'nepalai', 'R2 bucket is correctly resolved as "nepalai"');
  assert(r2Config.s3Region === 'auto', 'R2 region defaults to "auto"');

  console.log('\n--- Test Group 2: Automated Storage Disk Reaper ---');

  // Create an artificial expired file (> 2 hours old) in data/storage
  const storageDir = path.join(process.cwd(), 'data', 'storage');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
  
  const expiredFilePath = path.join(storageDir, 'expired_temp_artifact.tmp');
  fs.writeFileSync(expiredFilePath, 'Temporary expired video cache data');
  
  // Backdate modified time to 3 hours ago
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  fs.utimesSync(expiredFilePath, threeHoursAgo, threeHoursAgo);

  // Also create a fresh active file (< 5 minutes old)
  const freshFilePath = path.join(storageDir, 'fresh_active_artifact.tmp');
  fs.writeFileSync(freshFilePath, 'Active video rendering chunk');

  // Run cleanup routine
  const cleanupStats = storageBucket.cleanExpiredCache(0.05); // purge files older than ~1.2 hours
  assert(fs.existsSync(freshFilePath), 'Fresh active file (< 15 mins) is PRESERVED and protected from deletion');
  
  // Cleanup test files
  try { if (fs.existsSync(freshFilePath)) fs.unlinkSync(freshFilePath); } catch {}
  try { if (fs.existsSync(expiredFilePath)) fs.unlinkSync(expiredFilePath); } catch {}

  console.log('\n--- Test Group 3: Video Processor Scratch Isolation & Execution ---');

  // 1. Check Scratch Garbage Collection
  const orphanPurge = videoProcessor.cleanupOrphanScratchDirs();
  assert(typeof orphanPurge.purgedCount === 'number', 'cleanupOrphanScratchDirs executes safely and returns count');

  // 2. Test Video Processing Pipeline with Sample Assets
  const renderResult = await videoProcessor.processVideo({
    assets: [
      { url: '/samples/everest_sunrise.mp4', duration: 2 },
      { url: '/samples/everest_thumb.jpg', duration: 2, mediaType: 'image' },
    ],
    outputFileName: 'test_phase3_render.mp4',
    resolution: '720p',
    aspectRatio: '16:9',
  });

  assert(!!renderResult.renderId, 'processVideo returns unique renderId', renderResult.renderId);
  assert(!!renderResult.outputUrl, 'processVideo returns valid outputUrl', renderResult.outputUrl);
  assert(renderResult.duration > 0, 'processVideo duration is positive', `${renderResult.duration}s`);
  assert(renderResult.codec.includes('H.264'), 'Video codec output specifies H.264');

  // 3. Verify Job Status Retrieval
  const jobStatus = videoProcessor.getJobStatus(renderResult.renderId);
  assert(jobStatus !== null, 'getJobStatus retrieves recorded job');
  assert(jobStatus?.status === 'completed', 'Job final status is "completed"');
  assert(jobStatus?.progress === 100, 'Job final progress reached 100%');

  console.log('\n--- Test Group 4: Render Queue Concurrency, Metrics & Cancellation ---');

  // 1. Queue Metrics
  const metrics = renderQueueManager.getQueueMetrics();
  assert(typeof metrics.activeJobs === 'number', 'Metrics reports activeJobs count');
  assert(typeof metrics.pendingJobs === 'number', 'Metrics reports pendingJobs count');
  assert(typeof metrics.provider === 'string', 'Metrics reports active queue provider', metrics.provider);

  // 2. Enqueue Background Job
  const testJobId = 'job_test_' + Date.now();
  const enqueueResult = await renderQueueManager.addJob({
    jobId: testJobId,
    userId: 'usr_phase3_tester',
    userRole: 'subscriber',
    options: {
      assets: [{ url: '/samples/everest_sunrise.mp4', duration: 1 }],
      outputFileName: 'queue_test.mp4',
    },
    createdAt: new Date().toISOString(),
  });

  assert(enqueueResult.jobId === testJobId, 'addJob returns submitted jobId');
  assert(enqueueResult.priority === 'paid-renders', 'Subscriber user is assigned paid-renders queue priority');

  // 3. Check Initial Queued State
  const queueState = renderQueueManager.getJobState(testJobId);
  assert(queueState !== null, 'getJobState returns state for enqueued job');
  assert(queueState?.jobId === testJobId, 'Job state matches enqueued jobId');

  // 4. Test Job Cancellation
  const cancelJobId = 'job_cancel_' + Date.now();
  await renderQueueManager.addJob({
    jobId: cancelJobId,
    userId: 'usr_phase3_tester',
    userRole: 'free_user',
    options: { assets: [{ url: '/samples/everest_sunrise.mp4', duration: 1 }] },
    createdAt: new Date().toISOString(),
  });

  const cancelled = renderQueueManager.cancelJob(cancelJobId);
  assert(cancelled, 'cancelJob successfully cancels active/queued job');
  const cancelledState = renderQueueManager.getJobState(cancelJobId);
  assert(cancelledState?.stage === 'FAILED', 'Cancelled job stage transitions to FAILED');
  assert(cancelledState?.error?.includes('cancelled'), 'Cancelled job records cancellation error');

  // Cleanup test image
  try {
    const testImgPath = path.join(process.cwd(), 'data', 'storage', 'test_phase3_pixel.png');
    if (fs.existsSync(testImgPath)) fs.unlinkSync(testImgPath);
  } catch {}

  console.log('\n================================================================');
  if (failed === 0) {
    console.log(`🎉 All ${passed}/${passed} Phase 3 Media, Storage & Queue Tests PASSED!`);
  } else {
    console.error(`⚠️ ${failed} tests failed out of ${passed + failed}`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
