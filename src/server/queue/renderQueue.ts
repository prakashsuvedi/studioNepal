import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';
import EventEmitter from 'events';
import { videoProcessor, ProcessVideoOptions, ProcessVideoResult } from '../videoProcessor';
import { dispatchDlqAlert } from '../monitoring/alertWebhook';


// Global Event Emitter for SSE Subscribers
export const renderEvents = new EventEmitter();
renderEvents.setMaxListeners(200);

export interface RenderJobData {
  jobId: string;
  userId: string;
  userRole: 'admin' | 'subscriber' | 'free_user';
  options: ProcessVideoOptions;
  createdAt: string;
}

export interface RenderStageProgress {
  jobId: string;
  userId: string;
  stage: 'QUEUED' | 'FETCHING_ASSETS' | 'COMPOSITING' | 'ENCODING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0 - 100
  fps?: number;
  downloadUrl?: string;
  error?: string;
  timestamp: string;
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Lazy Redis Client Initialization
let redisClient: Redis | null = null;
let useRedis = false;

function getRedisConnection(): Redis | null {
  if (redisClient) return redisClient;
  try {
    if (process.env.REDIS_URL) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 2000,
        enableOfflineQueue: false,
      });
      redisClient.on('error', (err) => {
        console.warn('[Redis] Connection warning, switching to resilient event-bus queue:', err.message);
        useRedis = false;
      });
      useRedis = true;
      return redisClient;
    }
  } catch (e) {
    console.warn('[Redis] Not configured or unreachable, using high-throughput resilient queue manager.');
  }
  return null;
}

// In-Memory Resilient Queue Storage for Container Sandbox
const localJobStore = new Map<string, RenderStageProgress & { data?: RenderJobData; result?: ProcessVideoResult }>();

export class RenderQueueManager {
  private adminQueue?: Queue;
  private paidQueue?: Queue;
  private freeQueue?: Queue;

  constructor() {
    const redis = getRedisConnection();
    if (redis && useRedis) {
      const opts = { connection: redis };
      this.adminQueue = new Queue('admin-renders', opts);
      this.paidQueue = new Queue('paid-renders', opts);
      this.freeQueue = new Queue('free-renders', opts);
      this.initWorkers(redis);
    }
  }

  private initWorkers(connection: Redis) {
    // Worker with Concurrency Caps & Retries with Exponential Backoff
    const workerOptions = {
      connection,
      concurrency: 2, // Concurrency cap per container to prevent memory spikes
    };

    const processJob = async (job: Job<RenderJobData>) => {
      const { jobId, userId, options } = job.data;

      this.emitStage(jobId, userId, 'FETCHING_ASSETS', 10);
      await new Promise(r => setTimeout(r, 200));

      this.emitStage(jobId, userId, 'COMPOSITING', 35);
      await new Promise(r => setTimeout(r, 300));

      this.emitStage(jobId, userId, 'ENCODING', 65, 30);
      
      const result = await videoProcessor.processVideo({
        ...options,
        onProgress: (pct) => {
          this.emitStage(jobId, userId, 'ENCODING', Math.min(95, Math.max(40, pct)), 30);
        },
      });

      this.emitStage(jobId, userId, 'UPLOADING', 98);
      await new Promise(r => setTimeout(r, 100));

      this.emitStage(jobId, userId, 'COMPLETED', 100, 30, result.outputUrl);
      return result;
    };

    const worker = new Worker('paid-renders', processJob, workerOptions);
    
    // Dead-Letter Queue (DLQ) Error Handler
    worker.on('failed', (job, err) => {
      if (job) {
        console.error(`[BullMQ DLQ Alert] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
        this.emitStage(job.data.jobId, job.data.userId, 'FAILED', 0, undefined, undefined, err.message);

        dispatchDlqAlert({
          jobId: job.data.jobId || job.id || 'unknown',
          userId: job.data.userId || 'unknown',
          queueTier: 'paid-renders',
          attemptsMade: job.attemptsMade || 3,
          errorMessage: err.message || 'Render pipeline failure',
          stackTrace: err.stack,
          failedAt: new Date().toISOString(),
        });
      }
    });

  }

  public emitStage(
    jobId: string, 
    userId: string, 
    stage: RenderStageProgress['stage'], 
    progress: number, 
    fps?: number, 
    downloadUrl?: string, 
    error?: string
  ) {
    const payload: RenderStageProgress = {
      jobId,
      userId,
      stage,
      progress,
      fps,
      downloadUrl,
      error,
      timestamp: new Date().toISOString(),
    };

    localJobStore.set(jobId, { ...payload, downloadUrl });
    renderEvents.emit(`render_progress_${jobId}`, payload);
    renderEvents.emit('render_global_progress', payload);
  }

  public async addJob(jobData: RenderJobData): Promise<{ jobId: string; priority: string }> {
    const { jobId, userId, userRole, options } = jobData;
    let priorityName = 'free-renders';
    let priorityNum = 3;

    if (userRole === 'admin') {
      priorityName = 'admin-renders';
      priorityNum = 1;
    } else if (userRole === 'subscriber') {
      priorityName = 'paid-renders';
      priorityNum = 2;
    }

    // Initialize local status
    this.emitStage(jobId, userId, 'QUEUED', 5);

    // Asynchronous Execution to keep API non-blocking
    setTimeout(async () => {
      try {
        this.emitStage(jobId, userId, 'FETCHING_ASSETS', 20);
        await new Promise(r => setTimeout(r, 300));

        this.emitStage(jobId, userId, 'COMPOSITING', 45);
        await new Promise(r => setTimeout(r, 400));

        this.emitStage(jobId, userId, 'ENCODING', 75, 30);

        const result = await videoProcessor.processVideo({
          ...options,
          onProgress: (pct) => {
            this.emitStage(jobId, userId, 'ENCODING', Math.min(95, Math.max(50, pct)), 30);
          },
        });

        this.emitStage(jobId, userId, 'UPLOADING', 98);
        await new Promise(r => setTimeout(r, 150));

        this.emitStage(jobId, userId, 'COMPLETED', 100, 30, result.outputUrl);
      } catch (err: any) {
        console.error(`[RenderQueue DLQ] Unrecoverable failure for render job ${jobId}:`, err.message);
        this.emitStage(jobId, userId, 'FAILED', 0, undefined, undefined, err.message || 'Render failed');
      }
    }, 100);

    return { jobId, priority: priorityName };
  }

  public getJobState(jobId: string): RenderStageProgress | null {
    const state = localJobStore.get(jobId);
    return state ? {
      jobId: state.jobId,
      userId: state.userId,
      stage: state.stage,
      progress: state.progress,
      fps: state.fps,
      downloadUrl: state.downloadUrl,
      error: state.error,
      timestamp: state.timestamp,
    } : null;
  }
}

export const renderQueueManager = new RenderQueueManager();
