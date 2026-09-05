import { renderQueueManager, renderEvents } from './queue/renderQueue';
import { videoProcessor } from './videoProcessor';

/**
 * Standalone BullMQ Worker Process Entry Point
 * Separates heavy media rendering workloads from the Web API server.
 */
async function startStandaloneWorker() {
  console.log('====================================================');
  console.log('[NepalAI Worker] Starting Dedicated Render Worker Node');
  console.log('[NepalAI Worker] Environment:', process.env.NODE_ENV || 'development');
  console.log('[NepalAI Worker] HW Acceleration:', process.env.FFMPEG_HWACCEL || 'libx264 software fallback');
  console.log('====================================================');

  // Perform startup orphan scratch directory garbage collection
  const gcResult = videoProcessor.cleanupOrphanScratchDirs();
  console.log(`[NepalAI Worker] Startup GC complete. Purged ${gcResult.purgedCount} orphaned scratch directories.`);

  // Hourly orphan scratch space cleanup timer
  setInterval(() => {
    const gc = videoProcessor.cleanupOrphanScratchDirs();
    if (gc.purgedCount > 0) {
      console.log(`[NepalAI Worker] Scheduled GC purged ${gc.purgedCount} orphaned scratch directories.`);
    }
  }, 60 * 60 * 1000);

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
    // Allow active FFmpeg jobs to finish or terminate cleanly
    process.exit(0);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startStandaloneWorker().catch((err) => {
  console.error('[NepalAI Worker] Fatal worker startup error:', err);
  process.exit(1);
});
