import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import EventEmitter from 'events';
import os from 'os';
import { videoProcessor, ProcessVideoOptions, ProcessVideoResult } from '../videoProcessor';
import { dispatchDlqAlert } from '../monitoring/alertWebhook';

// Global Event Emitter for SSE Subscribers
export const renderEvents = new EventEmitter();
renderEvents.setMaxListeners(500);

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
const REDIS_CHANNEL = 'nepalai:render:events';

// Lazy Redis Clients
let redisClient: Redis | null = null;
let redisPubClient: Redis | null = null;
let redisSubClient: Redis | null = null;
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
        console.warn('[Redis] Connection warning:', err.message);
      });
      useRedis = true;
      return redisClient;
    }
  } catch (e: any) {
    console.warn('[Redis] Not configured or unreachable, using high-throughput in-memory queue manager.');
  }
  return null;
}

// In-Memory Shared Job State Storage
const localJobStore = new Map<string, RenderStageProgress & { data?: RenderJobData; result?: ProcessVideoResult }>();

// Calculate worker concurrency limit dynamically from system or container memory
export function calculateWorkerConcurrency(containerMemoryMb?: number, ffmpegPeakMb = 500): number {
  const envConcurrency = process.env.MAX_RENDER_CONCURRENCY ? parseInt(process.env.MAX_RENDER_CONCURRENCY, 10) : 0;
  if (envConcurrency > 0) return envConcurrency;

  const totalMb = containerMemoryMb || Math.floor(os.totalmem() / (1024 * 1024));
  // Leave 512MB for OS/Node.js runtime, remainder divided by peak measured FFmpeg memory (~500MB)
  const availableMb = Math.max(500, totalMb - 512);
  const calculated = Math.floor(availableMb / ffmpegPeakMb);
  return Math.max(1, Math.min(calculated, 8)); // Cap between 1 and 8
}

// Concurrency Limiter for in-process or local worker execution
export class ConcurrencyLimiter {
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

  public get concurrencyLimit() {
    return this.maxConcurrency;
  }
}

const defaultConcurrency = calculateWorkerConcurrency();
export const localConcurrencyWorker = new ConcurrencyLimiter(defaultConcurrency);

export class RenderQueueManager {
  private adminQueue?: Queue;
  private paidQueue?: Queue;
  private freeQueue?: Queue;
  private workers: Worker[] = [];
  private isWorkerInitialized = false;

  constructor() {
    const redis = getRedisConnection();
    if (redis && useRedis) {
      const opts = { connection: redis };
      this.adminQueue = new Queue('admin-renders', opts);
      this.paidQueue = new Queue('paid-renders', opts);
      this.freeQueue = new Queue('free-renders', opts);

      this.initRedisPubSub();

      // Only launch BullMQ workers in this process if explicitly in WORKER mode OR standalone local mode
      const isStandaloneWorker = process.env.IS_RENDER_WORKER === 'true';
      const isApiContainer = process.env.IS_API_CONTAINER === 'true';

      if (isStandaloneWorker || !isApiContainer) {
        this.initWorkers(redis);
      }
    }
  }

  private initRedisPubSub() {
    try {
      if (!redisPubClient && process.env.REDIS_URL) {
        redisPubClient = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
      }
      if (!redisSubClient && process.env.REDIS_URL) {
        redisSubClient = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
        redisSubClient.subscribe(REDIS_CHANNEL, (err) => {
          if (err) console.warn('[Redis PubSub] Subscribe error:', err.message);
        });
        redisSubClient.on('message', (channel, message) => {
          if (channel === REDIS_CHANNEL) {
            try {
              const payload: RenderStageProgress = JSON.parse(message);
              localJobStore.set(payload.jobId, payload);
              renderEvents.emit(`render_progress_${payload.jobId}`, payload);
              renderEvents.emit('render_global_progress', payload);
            } catch (err: any) {
              console.warn('[Redis PubSub] Failed to parse event payload:', err.message);
            }
          }
        });
      }
    } catch (e: any) {
      console.warn('[Redis PubSub] PubSub initialization notice:', e.message);
    }
  }

  public initWorkers(connection?: Redis) {
    if (this.isWorkerInitialized) return;
    this.isWorkerInitialized = true;

    const redis = connection || getRedisConnection();
    if (!redis) {
      console.log('[RenderQueueManager] BullMQ workers in in-memory mode');
      return;
    }

    const concurrency = calculateWorkerConcurrency();
    console.log(`[BullMQ Worker] Initializing render queues with concurrency ceiling: ${concurrency}`);

    const workerOptions = {
      connection: redis,
      concurrency,
    };

    const processJob = async (job: Job<RenderJobData>) => {
      const { jobId, userId, options } = job.data;
      await this.executeJobPipeline(jobId, userId, options);
    };

    ['admin-renders', 'paid-renders', 'free-renders'].forEach((queueName) => {
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

  public async executeJobPipeline(jobId: string, userId: string, options: ProcessVideoOptions): Promise<ProcessVideoResult> {
    this.emitStage(jobId, userId, 'FETCHING_ASSETS', 15);
    await new Promise((r) => setTimeout(r, 200));

    this.emitStage(jobId, userId, 'COMPOSITING', 35);
    await new Promise((r) => setTimeout(r, 250));

    this.emitStage(jobId, userId, 'ENCODING', 60, 30);

    const result = await videoProcessor.processVideo({
      ...options,
      onProgress: (pct) => {
        this.emitStage(jobId, userId, 'ENCODING', Math.min(95, Math.max(40, pct)), 30);
      },
    });

    this.emitStage(jobId, userId, 'UPLOADING', 98);
    await new Promise((r) => setTimeout(r, 100));

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

    // Cross-process PubSub publishing over Redis
    if (redisPubClient && useRedis) {
      redisPubClient.publish(REDIS_CHANNEL, JSON.stringify(payload)).catch((err) => {
        console.warn('[Redis PubSub] Publish failed:', err.message);
      });
    }
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

    // If BullMQ + Redis is active, dispatch to queue for worker to consume
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
        console.warn('[BullMQ] Queue dispatch failed, falling back to local concurrency limiter:', e.message);
      }
    }

    // If running in isolated API container without Redis, or in local fallback mode
    const isApiContainer = process.env.IS_API_CONTAINER === 'true';
    if (!isApiContainer) {
      localConcurrencyWorker.enqueue(async () => {
        try {
          await this.executeJobPipeline(jobId, userId, options);
        } catch (err: any) {
          console.error(`[RenderQueue DLQ] Failure for render job ${jobId}:`, err.message);
          this.emitStage(jobId, userId, 'FAILED', 0, undefined, undefined, err.message || 'Render failed');
        }
      });
    }

    return { jobId, priority: priorityName };
  }

  public getJobState(jobId: string): RenderStageProgress | null {
    const state = localJobStore.get(jobId);
    return state
      ? {
          jobId: state.jobId,
          userId: state.userId,
          stage: state.stage,
          progress: state.progress,
          fps: state.fps,
          downloadUrl: state.downloadUrl,
          error: state.error,
          timestamp: state.timestamp,
        }
      : null;
  }

  public getQueueMetrics(): {
    activeJobs: number;
    pendingJobs: number;
    totalTracked: number;
    provider: string;
    concurrencyLimit: number;
  } {
    return {
      activeJobs: localConcurrencyWorker.activeCount,
      pendingJobs: localConcurrencyWorker.pendingCount,
      totalTracked: localJobStore.size,
      provider: useRedis ? 'redis_bullmq' : 'in_memory_concurrency_limiter',
      concurrencyLimit: localConcurrencyWorker.concurrencyLimit,
    };
  }

  public cancelJob(jobId: string): boolean {
    const state = localJobStore.get(jobId);
    if (!state) return false;
    if (['COMPLETED', 'FAILED'].includes(state.stage)) return false;

    this.emitStage(jobId, state.userId, 'FAILED', 0, undefined, undefined, 'Job cancelled by user');
    return true;
  }

  public async close(): Promise<void> {
    for (const w of this.workers) {
      await w.close();
    }
  }
}

export const renderQueueManager = new RenderQueueManager();
