import { useEffect, useState, useRef } from 'react';
import { isBrowserOffline } from '../lib/apiClient';

export interface RenderSSEProgress {
  jobId: string;
  stage: 'QUEUED' | 'FETCHING_ASSETS' | 'COMPOSITING' | 'ENCODING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0 - 100
  fps?: number;
  downloadUrl?: string;
  error?: string;
  timestamp: string;
  isReconnecting?: boolean;
}

export function useRenderSSE(jobId: string | null) {
  const [progressData, setProgressData] = useState<RenderSSEProgress | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const lastKnownProgressRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const pollTimerRef = useRef<any>(null);
  const watchdogTimerRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!jobId) {
      setProgressData(null);
      setIsDone(false);
      setIsPollingFallback(false);
      setIsReconnecting(false);
      lastKnownProgressRef.current = 0;
      return;
    }

    let eventSource: EventSource | null = null;
    let isActive = true;

    const startPollingFallback = () => {
      if (pollTimerRef.current) return;
      setIsPollingFallback(true);
      console.log(`[useRenderSSE] Watchdog/SSE fallback active for job: ${jobId}`);

      let consecutiveErrors = 0;

      const pollCycle = async () => {
        if (!isActive || isDone) return;

        // Skip if browser is currently offline and retry after backoff
        if (isBrowserOffline()) {
          setIsReconnecting(true);
          pollTimerRef.current = setTimeout(pollCycle, 3000);
          return;
        }

        try {
          const res = await fetch(`/api/render/status/${jobId}`);
          if (res.ok) {
            consecutiveErrors = 0;
            setIsReconnecting(false);
            const data = await res.json();
            const rawProgress = data.progress ?? 50;
            const safeProgress = Math.max(lastKnownProgressRef.current, rawProgress);
            lastKnownProgressRef.current = safeProgress;

            const formatted: RenderSSEProgress = {
              jobId,
              stage: data.stage || (data.status === 'completed' ? 'COMPLETED' : 'ENCODING'),
              progress: safeProgress,
              downloadUrl: data.downloadUrl,
              error: data.error,
              timestamp: data.updatedAt || new Date().toISOString(),
              isReconnecting: false,
            };

            setProgressData(formatted);

            if (formatted.stage === 'COMPLETED' || formatted.stage === 'FAILED' || data.status === 'completed') {
              setIsDone(true);
              return;
            }
          } else {
            consecutiveErrors++;
          }
        } catch (err) {
          consecutiveErrors++;
          setIsReconnecting(true);
          console.warn(`[useRenderSSE] Network interruption during polling fallback (${consecutiveErrors} attempts):`, err);
        }

        // Adaptive polling interval with backoff on errors
        const interval = consecutiveErrors > 0 ? Math.min(10000, 2000 * Math.pow(1.5, consecutiveErrors)) : 2000;
        if (isActive && !isDone) {
          pollTimerRef.current = setTimeout(pollCycle, interval);
        }
      };

      pollCycle();
    };

    const resetWatchdog = () => {
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      
      // 20-second SSE heartbeat watchdog timer
      watchdogTimerRef.current = setTimeout(() => {
        if (isActive && !isDone) {
          console.log('[useRenderSSE] Watchdog timeout: switching to resilient polling');
          if (eventSource) {
            try { eventSource.close(); } catch {}
          }
          startPollingFallback();
        }
      }, 20000);
    };

    const connectSSE = () => {
      if (!isActive || isDone) return;

      if (isBrowserOffline()) {
        setIsReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(connectSSE, 3000);
        return;
      }

      try {
        if (eventSource) {
          try { eventSource.close(); } catch {}
        }

        eventSource = new EventSource(`/api/render/stream/${jobId}`);
        resetWatchdog();

        eventSource.onopen = () => {
          setIsReconnecting(false);
          retryCountRef.current = 0;
          resetWatchdog();
        };

        eventSource.onmessage = (event) => {
          try {
            resetWatchdog();
            setIsReconnecting(false);
            retryCountRef.current = 0;
            const data: RenderSSEProgress = JSON.parse(event.data);

            const safeProgress = Math.max(lastKnownProgressRef.current, data.progress);
            lastKnownProgressRef.current = safeProgress;

            setProgressData({
              ...data,
              progress: safeProgress,
              isReconnecting: false,
            });

            if (data.stage === 'COMPLETED' || data.stage === 'FAILED') {
              setIsDone(true);
              if (eventSource) eventSource.close();
              if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
              if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
            }
          } catch (err) {
            console.warn('[useRenderSSE] Error parsing SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            try { eventSource.close(); } catch {}
          }

          if (!isActive || isDone) return;

          setIsReconnecting(true);
          retryCountRef.current += 1;
          const delay = Math.min(15000, 1000 * Math.pow(1.8, retryCountRef.current - 1));

          console.warn(`[useRenderSSE] Connection error. Reconnecting attempt #${retryCountRef.current} in ${Math.round(delay)}ms...`);

          if (retryCountRef.current > 4) {
            startPollingFallback();
          } else {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isActive && !isDone) connectSSE();
            }, delay);
          }
        };
      } catch (e) {
        startPollingFallback();
      }
    };

    // Instant reconnect on network online event
    const handleOnline = () => {
      console.log('[useRenderSSE] Browser online detected. Immediate reconnection triggered.');
      setIsReconnecting(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      
      if (!isDone && isActive) {
        if (isPollingFallback) {
          startPollingFallback();
        } else {
          connectSSE();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    connectSSE();

    return () => {
      isActive = false;
      window.removeEventListener('online', handleOnline);
      if (eventSource) {
        try { eventSource.close(); } catch {}
      }
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [jobId]);

  return {
    progress: progressData?.progress ?? lastKnownProgressRef.current,
    stage: progressData?.stage ?? 'QUEUED',
    downloadUrl: progressData?.downloadUrl,
    error: progressData?.error,
    isDone,
    isPollingFallback,
    isReconnecting,
    progressData,
  };
}


