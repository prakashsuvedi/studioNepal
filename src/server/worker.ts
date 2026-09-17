import { renderQueueManager, renderEvents, calculateWorkerConcurrency } from './queue/renderQueue';
import { videoProcessor } from './videoProcessor';
import os from 'os';

/**
 * Standalone BullMQ Worker Process Entry Point
 * Separates heavy media rendering workloads from the Web API server.
 * This process only consumes the BullMQ / Redis queues and does NOT serve HTTP traffic.
 */
async function startStandaloneWorker() {
  process.env.IS_RENDER_WORKER = 'true';

  const totalMemMb = Math.floor(os.totalmem() / (1024 * 1024));
  const freeMemMb = Math.floor(os.freemem() / (1024 * 1024));
  const concurrency = calculateWorkerConcurrency(totalMemMb, 500);

  console.log('====================================================');
  console.log('[NepalAI Worker] Starting Dedicated Render Worker Process');
  console.log('[NepalAI Worker] Environment:', process.env.NODE_ENV || 'production');
  console.log(`[NepalAI Worker] Host Memory: ${totalMemMb} MB Total | ${freeMemMb} MB Free`);
  console.log(`[NepalAI Worker] FFmpeg Peak Budget: 500 MB / job`);
  console.log(`[NepalAI Worker] Enforced Concurrency Ceiling: ${concurrency} parallel render job(s)`);
  console.log('[NepalAI Worker] HW Acceleration:', process.env.FFMPEG_HWACCEL || 'libx264 software fallback');
  console.log('====================================================');

  // Initialize BullMQ Workers for processing all queue tiers
  renderQueueManager.initWorkers();

  // Perform startup orphan scratch directory garbage collection
  const gcResult = videoProcessor.cleanupOrphanScratchDirs();
  console.log(`[NepalAI Worker] Startup GC complete. Purged ${gcResult.purgedCount} orphaned scratch directories.`);

  // Hourly orphan scratch space cleanup timer
  const gcInterval = setInterval(() => {
    const gc = videoProcessor.cleanupOrphanScratchDirs();
    if (gc.purgedCount > 0) {
      console.log(`[NepalAI Worker] Scheduled GC purged ${gc.purgedCount} orphaned scratch directories.`);
    }
  }, 60 * 60 * 1000);
  if (gcInterval.unref) gcInterval.unref();

  // Global progress telemetry logging
  renderEvents.on('render_global_progress', (payload) => {
    console.log(
      `[Worker Progress] Job: ${payload.jobId} | Stage: ${payload.stage} | Progress: ${payload.progress}% ${
        payload.fps ? `| ${payload.fps} FPS` : ''
      }`
    );
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    console.log(`[NepalAI Worker] Received ${signal}. Initiating graceful worker shutdown...`);
    try {
      await renderQueueManager.close();
      console.log('[NepalAI Worker] BullMQ queues and workers cleanly stopped.');
    } catch (err: any) {
      console.warn('[NepalAI Worker] Error during worker shutdown:', err.message);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startStandaloneWorker().catch((err) => {
  console.error('[NepalAI Worker] Fatal worker startup error:', err);
  process.exit(1);
});
