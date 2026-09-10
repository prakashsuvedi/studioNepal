// Media & Rendering Error Logger Service
// Intercepts and aggregates browser console errors, HTMLMediaElement errors, and canvas/WebAudio decoding issues

export type MediaErrorCategory = 
  | 'video_decode'
  | 'canvas_render'
  | 'audio_context'
  | 'media_recorder'
  | 'webgl'
  | 'network_stream'
  | 'general';

export type MediaErrorSeverity = 'error' | 'warning' | 'info';

export interface MediaLogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  severity: MediaErrorSeverity;
  category: MediaErrorCategory;
  message: string;
  sourceUrl?: string;
  clipTitle?: string;
  clipIndex?: number;
  details?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

type LogListener = (logs: MediaLogEntry[]) => void;

class MediaErrorLoggerService {
  private logs: MediaLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 300;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initGlobalInterceptors();
    }
  }

  private initGlobalInterceptors() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Log initialization event
    this.addLog({
      severity: 'info',
      category: 'general',
      message: 'Media Rendering & Decoding Error Interceptor initialized',
      details: `UserAgent: ${navigator.userAgent}`,
    });

    // Intercept console.error & console.warn selectively for media-related traces
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      try {
        const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (this.isMediaRelated(text)) {
          this.addLog({
            severity: 'error',
            category: this.categorizeError(text),
            message: text.slice(0, 300),
            details: text.length > 300 ? text : undefined,
            stack: new Error().stack,
          });
        }
      } catch {}
    };

    console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(console, args);
      try {
        const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (this.isMediaRelated(text)) {
          this.addLog({
            severity: 'warning',
            category: this.categorizeError(text),
            message: text.slice(0, 300),
            details: text.length > 300 ? text : undefined,
          });
        }
      } catch {}
    };

    // Global unhandled media rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const reason = event.reason;
        const msg = typeof reason === 'string' ? reason : reason?.message || String(reason);
        if (this.isMediaRelated(msg)) {
          this.addLog({
            severity: 'error',
            category: this.categorizeError(msg),
            message: `Unhandled Media Promise: ${msg}`,
            stack: reason?.stack,
          });
        }
      } catch {}
    });

    // Global window error listener
    window.addEventListener('error', (event) => {
      try {
        const target = event.target as any;
        if (target && (target.tagName === 'VIDEO' || target.tagName === 'AUDIO' || target.tagName === 'CANVAS')) {
          const src = target.src || target.currentSrc || 'inline element';
          const err = target.error;
          let codeDesc = 'UNKNOWN_ERROR';
          if (err) {
            switch (err.code) {
              case 1: codeDesc = 'MEDIA_ERR_ABORTED'; break;
              case 2: codeDesc = 'MEDIA_ERR_NETWORK'; break;
              case 3: codeDesc = 'MEDIA_ERR_DECODE'; break;
              case 4: codeDesc = 'MEDIA_ERR_SRC_NOT_SUPPORTED'; break;
            }
          }
          this.addLog({
            severity: 'error',
            category: 'video_decode',
            message: `Media Element Decode Error: ${codeDesc} (code ${err?.code || 'unknown'})`,
            sourceUrl: src,
            details: err?.message || `Failed to decode or stream media resource: ${src}`,
          });
        }
      } catch {}
    }, true);
  }

  private isMediaRelated(text: string): boolean {
    const keywords = [
      'video', 'audio', 'decode', 'canvas', 'webgl', 'ffmpeg',
      'mediarecorder', 'audiocontext', 'mediastream', 'codec',
      'mp4', 'webm', 'h264', 'vp9', 'vp8', 'transcode', 'buffer',
      'stalled', 'cors', 'tainted canvas', 'demux', 'stream'
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  private categorizeError(text: string): MediaErrorCategory {
    const lower = text.toLowerCase();
    if (lower.includes('webgl') || lower.includes('shader') || lower.includes('gpu')) return 'webgl';
    if (lower.includes('audio') || lower.includes('sound') || lower.includes('sample rate')) return 'audio_context';
    if (lower.includes('mediarecorder') || lower.includes('recording') || lower.includes('mux')) return 'media_recorder';
    if (lower.includes('canvas') || lower.includes('2d context') || lower.includes('drawimage')) return 'canvas_render';
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('404') || lower.includes('cors')) return 'network_stream';
    if (lower.includes('video') || lower.includes('decode') || lower.includes('codec')) return 'video_decode';
    return 'general';
  }

  public addLog(entry: Omit<MediaLogEntry, 'id' | 'timestamp' | 'timeMs'>) {
    const now = new Date();
    const timeFormatted = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    
    const newEntry: MediaLogEntry = {
      ...entry,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: timeFormatted,
      timeMs: Date.now(),
    };

    this.logs.unshift(newEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    this.notify();
  }

  public logVideoDecodeError(url: string, error: any, clipInfo?: { title?: string; index?: number }) {
    let msg = 'HTMLVideoElement decoding failed';
    let codeDesc = 'UNKNOWN';
    if (error && typeof error === 'object' && error.code) {
      switch (error.code) {
        case 1: codeDesc = 'MEDIA_ERR_ABORTED (1)'; break;
        case 2: codeDesc = 'MEDIA_ERR_NETWORK (2)'; break;
        case 3: codeDesc = 'MEDIA_ERR_DECODE (3 - Video format corrupted or unplayable)'; break;
        case 4: codeDesc = 'MEDIA_ERR_SRC_NOT_SUPPORTED (4 - Codec or URL unsupported)'; break;
      }
      msg = `Video Decode Error: ${codeDesc}`;
    } else if (typeof error === 'string') {
      msg = error;
    }

    this.addLog({
      severity: 'error',
      category: 'video_decode',
      message: msg,
      sourceUrl: url,
      clipTitle: clipInfo?.title,
      clipIndex: clipInfo?.index,
      details: typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error),
    });
  }

  public logRenderWarning(message: string, details?: string, category: MediaErrorCategory = 'canvas_render') {
    this.addLog({
      severity: 'warning',
      category,
      message,
      details,
    });
  }

  public getLogs(): MediaLogEntry[] {
    return [...this.logs];
  }

  public getErrorCount(): number {
    return this.logs.filter(l => l.severity === 'error').length;
  }

  public getWarningCount(): number {
    return this.logs.filter(l => l.severity === 'warning').length;
  }

  public clearLogs() {
    this.logs = [];
    this.addLog({
      severity: 'info',
      category: 'general',
      message: 'Debugger error logs cleared by user',
    });
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getLogs();
    this.listeners.forEach(l => l(current));
  }

  public exportLogsAsText(): string {
    const lines = [
      '========================================================================',
      '           NEPALAI STUDIO - RENDERING & MEDIA DECODE LOGS               ',
      `Exported: ${new Date().toISOString()}`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`,
      `Total Log Entries: ${this.logs.length}`,
      `Errors: ${this.getErrorCount()} | Warnings: ${this.getWarningCount()}`,
      '========================================================================\n',
    ];

    this.logs.forEach((log, index) => {
      lines.push(
        `[#${index + 1}] [${log.timestamp}] [${log.severity.toUpperCase()}] [${log.category}]`,
        `Message: ${log.message}`
      );
      if (log.sourceUrl) lines.push(`Source URL: ${log.sourceUrl}`);
      if (log.clipTitle) lines.push(`Clip: "${log.clipTitle}" (Index #${log.clipIndex ?? 0})`);
      if (log.details) lines.push(`Details: ${log.details}`);
      if (log.stack) lines.push(`Stack:\n${log.stack}`);
      lines.push('------------------------------------------------------------------------');
    });

    return lines.join('\n');
  }

  public simulateTestLog(severity: MediaErrorSeverity = 'error') {
    const samples = [
      {
        severity,
        category: 'video_decode' as MediaErrorCategory,
        message: 'Simulated Video Decoder Event: Media dropped 2 frames during dynamic rate transition',
        details: 'Simulated diagnostic trace generated for clipboard and debugger testing.',
        sourceUrl: 'https://studio.nepalai.tech/samples/everest_sunrise.mp4',
      },
      {
        severity,
        category: 'canvas_render' as MediaErrorCategory,
        message: 'Simulated Compositor Notice: Canvas resolution scaled to match target 1080p viewport',
        details: 'Rendering viewport dimensions adjusted to aspect ratio 16:9.',
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    this.addLog(pick);
  }
}

export const mediaErrorLogger = new MediaErrorLoggerService();
