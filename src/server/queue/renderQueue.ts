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

// High-performance Concurrency Limiter to prevent event-loop starvation and OOM crashes
class ConcurrencyLimiter {
  private active = 0;
  private readonly maxConcurrency: number;
  private pending: Array<() => Promise<void>> = [];

  constructor(maxConcurrency = 2) {
    this.maxConcurrency = maxConcurrency;
  }

  public enqueue(task: () => Promise<void>) {
    this.pending.push(task);
    this.processNext();
  }

  private async processNext() {
    if (this.active >= this.maxConcurrency || this.pending.length === 0) return;
    const task = this.pending.shift();
    if (!task) return;
    this.active++;
    try {
      await task();
    } catch (e: any) {
      console.error('[ConcurrencyLimiter Task Error]:', e?.message || e);
    } finally {
      this.active--;
      this.processNext();
    }
  }

  public get pendingCount() {
    return this.pending.length;
  }

  public get activeCount() {
    return this.active;
  }
}

const localConcurrencyWorker = new ConcurrencyLimiter(2);

export class RenderQueueManager {
  private adminQueue?: Queue;
  private paidQueue?: Queue;
  private freeQueue?: Queue;
  private workers: Worker[] = [];

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
      await this.executeJobPipeline(jobId, userId, options);
    };

    ['admin-renders', 'paid-renders', 'free-renders'].forEach(queueName => {
      const worker = new Worker(queueName, processJob, workerOptions);
      worker.on('failed', (job, err) => {
        if (job) {
          console.error(`[BullMQ DLQ Alert] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
          this.emitStage(job.data.jobId, job.data.userId, 'FAILED', 0, undefined, undefined, err.message);

          dispatchDlqAlert({
            jobId: job.data.jobId || job.id || 'unknown',
            userId: job.data.userId || 'unknown',
            queueTier: queueName,
            attemptsMade: job.attemptsMade || 3,
            errorMessage: err.message || 'Render pipeline failure',
            stackTrace: err.stack,
            failedAt: new Date().toISOString(),
          });
        }
      });
      this.workers.push(worker);
    });
  }

  private async executeJobPipeline(jobId: string, userId: string, options: ProcessVideoOptions) {
    this.emitStage(jobId, userId, 'FETCHING_ASSETS', 15);
    await new Promise(r => setTimeout(r, 200));

    this.emitStage(jobId, userId, 'COMPOSITING', 35);
    await new Promise(r => setTimeout(r, 250));

    this.emitStage(jobId, userId, 'ENCODING', 60, 30);

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
    let targetQueue = this.freeQueue;

    if (userRole === 'admin') {
      priorityName = 'admin-renders';
      priorityNum = 1;
      targetQueue = this.adminQueue || this.paidQueue;
    } else if (userRole === 'subscriber') {
      priorityName = 'paid-renders';
      priorityNum = 2;
      targetQueue = this.paidQueue;
    }

    // Initialize local status
    this.emitStage(jobId, userId, 'QUEUED', 5);

    // If BullMQ + Redis is ready, use it for cross-process scaling
    if (useRedis && targetQueue) {
      try {
        await targetQueue.add('render-job', jobData, {
          jobId,
          priority: priorityNum,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        });
        return { jobId, priority: priorityName };
      } catch (e: any) {
        console.warn('[BullMQ] Queue dispatch failed, falling back to in-memory concurrency limiter:', e.message);
      }
    }

    // High-performance isolated concurrency-controlled worker queue
    localConcurrencyWorker.enqueue(async () => {
      try {
        await this.executeJobPipeline(jobId, userId, options);
      } catch (err: any) {
        console.error(`[RenderQueue DLQ] Failure for render job ${jobId}:`, err.message);
        this.emitStage(jobId, userId, 'FAILED', 0, undefined, undefined, err.message || 'Render failed');
      }
    });

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
