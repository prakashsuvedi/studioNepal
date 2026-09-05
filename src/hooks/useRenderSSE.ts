import { useEffect, useState, useRef } from 'react';

export interface RenderSSEProgress {
  jobId: string;
  stage: 'QUEUED' | 'FETCHING_ASSETS' | 'COMPOSITING' | 'ENCODING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0 - 100
  fps?: number;
  downloadUrl?: string;
  error?: string;
  timestamp: string;
}

export function useRenderSSE(jobId: string | null) {
  const [progressData, setProgressData] = useState<RenderSSEProgress | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isPollingFallback, setIsPollingFallback] = useState(false);

  const lastMsgTimeRef = useRef<number>(Date.now());
  const retryCountRef = useRef<number>(0);
  const pollTimerRef = useRef<any>(null);
  const watchdogTimerRef = useRef<any>(null);

  useEffect(() => {
    if (!jobId) {
      setProgressData(null);
      setIsDone(false);
      setIsPollingFallback(false);
      return;
    }

    let eventSource: EventSource | null = null;
    let isActive = true;

    const startPollingFallback = () => {
      if (pollTimerRef.current) return;
      setIsPollingFallback(true);
      console.log(`[useRenderSSE] Watchdog triggered polling fallback for job: ${jobId}`);

      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/render/status/${jobId}`);
          if (res.ok) {
            const data = await res.json();
            const formatted: RenderSSEProgress = {
              jobId,
              stage: data.stage || (data.status === 'completed' ? 'COMPLETED' : 'ENCODING'),
              progress: data.progress ?? 50,
              downloadUrl: data.downloadUrl,
              error: data.error,
              timestamp: data.updatedAt || new Date().toISOString(),
            };

            setProgressData((prev) => {
              // Preserve progress without resetting to 0
              if (prev && formatted.progress < prev.progress) {
                return { ...formatted, progress: prev.progress };
              }
              return formatted;
            });

            if (formatted.stage === 'COMPLETED' || formatted.stage === 'FAILED' || data.status === 'completed') {
              setIsDone(true);
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            }
          }
        } catch (err) {
          console.warn('[useRenderSSE] Polling fallback error:', err);
        }
      }, 2000);
    };

    const resetWatchdog = () => {
      lastMsgTimeRef.current = Date.now();
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      
      // 15-second SSE heartbeat watchdog timer
      watchdogTimerRef.current = setTimeout(() => {
        if (isActive && !isDone) {
          startPollingFallback();
        }
      }, 15000);
    };

    const connectSSE = () => {
      if (!isActive) return;

      try {
        eventSource = new EventSource(`/api/render/stream/${jobId}`);
        resetWatchdog();

        eventSource.onmessage = (event) => {
          try {
            resetWatchdog();
            retryCountRef.current = 0; // Reset exponential retry counter on success
            const data: RenderSSEProgress = JSON.parse(event.data);

            setProgressData((prev) => {
              // Maintain smooth progress bar without resetting
              if (prev && data.progress < prev.progress && data.stage !== 'FAILED') {
                return { ...data, progress: prev.progress };
              }
              return data;
            });

            if (data.stage === 'COMPLETED' || data.stage === 'FAILED') {
              setIsDone(true);
              if (eventSource) eventSource.close();
              if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            }
          } catch (err) {
            console.warn('[useRenderSSE] Error parsing SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) eventSource.close();

          if (!isActive || isDone) return;

          // Exponential backoff reconnect: 1s, 2s, 5s
          retryCountRef.current += 1;
          const delay = retryCountRef.current === 1 ? 1000 : retryCountRef.current === 2 ? 2000 : 5000;

          if (retryCountRef.current > 3) {
            startPollingFallback();
          } else {
            setTimeout(() => {
              if (isActive && !isDone) connectSSE();
            }, delay);
          }
        };
      } catch (e) {
        startPollingFallback();
      }
    };

    connectSSE();

    return () => {
      isActive = false;
      if (eventSource) eventSource.close();
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [jobId]);

  return {
    progress: progressData?.progress ?? 0,
    stage: progressData?.stage ?? 'QUEUED',
    downloadUrl: progressData?.downloadUrl,
    error: progressData?.error,
    isDone,
    isPollingFallback,
    progressData,
  };
}

