// Performance Telemetry & Decoding Jitter Monitor for Video Rendering Engine
// Tracks Time-to-First-Frame (TTFF), frame-to-frame jitter, dropped frames, and decoder buffer metrics.

export interface VideoPerformanceMetrics {
  ttffMs: number; // Time to first frame in milliseconds
  averageTtffMs: number;
  decodingJitterMs: number; // Standard deviation of frame intervals in ms
  instantFps: number;
  averageFps: number;
  droppedFramesCount: number;
  totalFramesRendered: number;
  bufferAheadSeconds: number;
  activeDecoderPipeline: 'hardware_native' | 'mse_chunked' | 'offscreen_worker' | 'canvas_fallback';
  lastClipTitle?: string;
  lastClipIndex?: number;
  timestamp: number;
}

type MetricsListener = (metrics: VideoPerformanceMetrics) => void;

class RenderPerformanceMonitorService {
  private metrics: VideoPerformanceMetrics = {
    ttffMs: 0,
    averageTtffMs: 0,
    decodingJitterMs: 0,
    instantFps: 60,
    averageFps: 60,
    droppedFramesCount: 0,
    totalFramesRendered: 0,
    bufferAheadSeconds: 0,
    activeDecoderPipeline: 'hardware_native',
    timestamp: Date.now(),
  };

  private listeners: Set<MetricsListener> = new Set();
  private pendingTtffStartTimes: Map<string, number> = new Map();
  private historicalTtffs: number[] = [];
  private frameTimestamps: number[] = [];
  private frameIntervals: number[] = [];
  private maxHistory = 60; // 1 second at 60fps

  // Record the start of a clip load or seek event
  public recordClipLoadStart(clipKey: string, clipTitle?: string, clipIndex?: number) {
    this.pendingTtffStartTimes.set(clipKey, performance.now());
    if (clipTitle) this.metrics.lastClipTitle = clipTitle;
    if (clipIndex !== undefined) this.metrics.lastClipIndex = clipIndex;
  }

  // Record when the first frame of the clip is successfully decoded and painted
  public recordFirstFrameDecoded(clipKey: string) {
    const startTime = this.pendingTtffStartTimes.get(clipKey);
    if (startTime) {
      const ttff = Math.max(1, Math.round(performance.now() - startTime));
      this.pendingTtffStartTimes.delete(clipKey);
      this.historicalTtffs.push(ttff);
      if (this.historicalTtffs.length > 20) this.historicalTtffs.shift();

      const avgTtff = Math.round(
        this.historicalTtffs.reduce((a, b) => a + b, 0) / this.historicalTtffs.length
      );

      this.metrics.ttffMs = ttff;
      this.metrics.averageTtffMs = avgTtff;
      this.metrics.timestamp = Date.now();
      this.notify();
    }
  }

  // Record every compositor or video frame tick to compute real-time jitter and FPS
  public recordFrameRenderTick(bufferAheadSec = 0) {
    const now = performance.now();
    this.metrics.totalFramesRendered++;
    this.metrics.bufferAheadSeconds = Math.max(0, parseFloat(bufferAheadSec.toFixed(2)));

    if (this.frameTimestamps.length > 0) {
      const last = this.frameTimestamps[this.frameTimestamps.length - 1];
      const interval = now - last;
      this.frameIntervals.push(interval);
      if (this.frameIntervals.length > this.maxHistory) {
        this.frameIntervals.shift();
      }

      // Check for frame drop / stall (normal 60fps interval is ~16.6ms, 30fps is ~33.3ms)
      if (interval > 50) {
        this.metrics.droppedFramesCount++;
      }

      // Calculate Jitter (standard deviation of frame intervals)
      if (this.frameIntervals.length >= 5) {
        const mean = this.frameIntervals.reduce((a, b) => a + b, 0) / this.frameIntervals.length;
        const variance =
          this.frameIntervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          this.frameIntervals.length;
        this.metrics.decodingJitterMs = parseFloat(Math.sqrt(variance).toFixed(2));
        
        // Instant & Average FPS
        if (interval > 0) {
          this.metrics.instantFps = Math.min(120, Math.round(1000 / interval));
        }
        if (mean > 0) {
          this.metrics.averageFps = Math.min(120, Math.round(1000 / mean));
        }
      }
    }

    this.frameTimestamps.push(now);
    if (this.frameTimestamps.length > this.maxHistory) {
      this.frameTimestamps.shift();
    }

    this.metrics.timestamp = Date.now();
    this.notify();
  }

  public setActiveDecoder(pipeline: 'hardware_native' | 'mse_chunked' | 'offscreen_worker' | 'canvas_fallback') {
    this.metrics.activeDecoderPipeline = pipeline;
    this.notify();
  }

  public getMetrics(): VideoPerformanceMetrics {
    return { ...this.metrics };
  }

  public resetMetrics() {
    this.historicalTtffs = [];
    this.frameIntervals = [];
    this.frameTimestamps = [];
    this.metrics.droppedFramesCount = 0;
    this.metrics.totalFramesRendered = 0;
    this.metrics.ttffMs = 0;
    this.metrics.decodingJitterMs = 0;
    this.notify();
  }

  public subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  private notifyScheduled = false;
  private lastNotifyTime = 0;

  private notify(force = false) {
    const now = performance.now();
    if (force || now - this.lastNotifyTime >= 500) {
      this.lastNotifyTime = now;
      const curr = this.getMetrics();
      this.listeners.forEach((l) => {
        try { l(curr); } catch (e) { console.warn('[RenderPerformanceMonitor] Listener error:', e); }
      });
    } else if (!this.notifyScheduled) {
      this.notifyScheduled = true;
      setTimeout(() => {
        this.notifyScheduled = false;
        this.lastNotifyTime = performance.now();
        const curr = this.getMetrics();
        this.listeners.forEach((l) => {
          try { l(curr); } catch (e) { console.warn('[RenderPerformanceMonitor] Listener error:', e); }
        });
      }, 500);
    }
  }
}

export const renderPerformanceMonitor = new RenderPerformanceMonitorService();
