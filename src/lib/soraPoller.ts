/**
 * Resilient Sora-2 Video Job Polling & Reconnection Engine
 * 
 * Features:
 * - Exponential backoff with jitter on network drops or transient HTTP 5xx errors.
 * - Monotonic progress preservation: prevents progress bars from jumping backward on connection blips.
 * - Auto-recovery when browser comes back online (`window.addEventListener('online')`).
 * - Seamless status resolution without failing mid-job due to temporary disconnections.
 */

import { apiClient, isBrowserOffline } from './apiClient';

export interface SoraJobStatusResult {
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  url?: string;
  error?: string;
}

export interface SoraPollingOptions {
  maxDurationMs?: number; // Maximum total wait time (default 10 minutes)
  initialIntervalMs?: number; // Base polling interval (default 3000ms)
  maxIntervalMs?: number; // Max backoff interval (default 15000ms)
  onProgress?: (progress: number, status: SoraJobStatusResult) => void;
  onReconnecting?: (attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

/**
 * Single status check with transient error protection
 */
export async function fetchVideoStatus(jobId: string): Promise<SoraJobStatusResult> {
  return apiClient.get<SoraJobStatusResult>(`/api/video/status/${encodeURIComponent(jobId)}`, {
    timeoutMs: 15000,
    maxRetries: 3,
    retryDelayMs: 1000,
  });
}

/**
 * Resilient long-running Sora-2 polling loop with backoff and network reconnection
 */
export async function pollSoraJobStatus(
  jobId: string,
  options: SoraPollingOptions = {}
): Promise<SoraJobStatusResult> {
  const {
    maxDurationMs = 600000, // 10 minutes
    initialIntervalMs = 3000,
    maxIntervalMs = 15000,
    onProgress,
    onReconnecting,
    signal,
  } = options;

  const startTime = Date.now();
  let currentProgress = 30;
  let currentInterval = initialIntervalMs;
  let consecutiveNetworkErrors = 0;
  let pollCycle = 0;

  // Track online status wakeup
  let onlineWakeupResolve: (() => void) | null = null;
  const onOnline = () => {
    if (onlineWakeupResolve) {
      onlineWakeupResolve();
      onlineWakeupResolve = null;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
  }

  try {
    while (Date.now() - startTime < maxDurationMs) {
      if (signal?.aborted) {
        throw new Error('Sora video polling cancelled by user');
      }

      pollCycle++;

      // If browser is offline, pause until connection is restored (or up to 10s backoff)
      if (isBrowserOffline()) {
        consecutiveNetworkErrors++;
        const backoff = Math.min(maxIntervalMs, 2000 * Math.pow(1.5, consecutiveNetworkErrors));
        if (onReconnecting) onReconnecting(consecutiveNetworkErrors, backoff);
        
        await Promise.race([
          new Promise((r) => setTimeout(r, backoff)),
          new Promise<void>((resolve) => {
            onlineWakeupResolve = resolve;
          }),
        ]);
        continue;
      }

      try {
        const data = await fetchVideoStatus(jobId);
        consecutiveNetworkErrors = 0;
        currentInterval = initialIntervalMs; // Reset backoff on success

        // Monotonic progress: never decrease
        const rawProgress = data.progress ?? (30 + Math.min(65, pollCycle * 2));
        currentProgress = Math.min(98, Math.max(currentProgress, rawProgress));

        if (onProgress) {
          onProgress(currentProgress, { ...data, progress: currentProgress });
        }

        if (data.status === 'completed' && data.url) {
          return {
            status: 'completed',
            progress: 100,
            url: data.url,
          };
        }

        if (data.status === 'failed') {
          return {
            status: 'failed',
            progress: currentProgress,
            error: data.error || 'Azure Sora-2 generation job failed',
          };
        }
      } catch (err: any) {
        // Network blip or transient failure: do NOT abort job, apply backoff
        consecutiveNetworkErrors++;
        const jitter = Math.random() * 500;
        currentInterval = Math.min(maxIntervalMs, initialIntervalMs * Math.pow(1.4, Math.min(consecutiveNetworkErrors, 5))) + jitter;

        console.warn(
          `[SoraPoller] Network interruption during status poll for job ${jobId} (attempt ${consecutiveNetworkErrors}). Backoff: ${Math.round(currentInterval)}ms. Last known progress: ${currentProgress}%`
        );

        if (onReconnecting) {
          onReconnecting(consecutiveNetworkErrors, currentInterval);
        }
      }

      // Wait interval before next poll, or wake up early on 'online' event
      await Promise.race([
        new Promise((r) => setTimeout(r, currentInterval)),
        new Promise<void>((resolve) => {
          onlineWakeupResolve = resolve;
        }),
      ]);
    }

    throw new Error(`Sora video generation timed out after ${Math.round(maxDurationMs / 1000)} seconds. Please try again.`);
  } finally {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
    }
  }
}
