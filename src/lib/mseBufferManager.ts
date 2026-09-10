// Media Source Extensions (MSE) Buffer Manager
// Manages chunked video buffering, memory window trimming, and robust SourceBuffer codec initialization
// to prevent MEDIA_ERR_SRC_NOT_SUPPORTED and browser memory pressure during video timeline playback.

import { mediaErrorLogger } from './mediaErrorLogger';
import { renderPerformanceMonitor } from './renderPerformanceMonitor';

export interface MseStreamSession {
  id: string;
  mediaSource: MediaSource;
  objectUrl: string;
  sourceBuffer?: SourceBuffer;
  isReady: boolean;
  isDestroyed: boolean;
  mimeType: string;
  totalBytes: number;
  bufferedBytes: number;
  abortController: AbortController;
}

class MseBufferManagerService {
  private sessions: Map<string, MseStreamSession> = new Map();

  // Test and detect the best supported MSE video codec for the current browser
  public getSupportedMseCodec(): string {
    if (typeof window === 'undefined' || !('MediaSource' in window)) {
      return '';
    }

    const candidateTypes = [
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp4; codecs="avc1.64001F, mp4a.40.2"',
      'video/mp4; codecs="avc1.4D401F"',
      'video/mp4; codecs="avc1.42E01E"',
      'video/mp4',
      'video/webm; codecs="vp9, opus"',
      'video/webm; codecs="vp8, opus"',
      'video/webm',
    ];

    for (const type of candidateTypes) {
      if (MediaSource.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/mp4';
  }

  public isMseSupported(): boolean {
    return typeof window !== 'undefined' && 'MediaSource' in window && !!this.getSupportedMseCodec();
  }

  // Create an MSE stream URL for a given media URL, loading it in streaming chunks
  public async createMseStream(
    url: string,
    options?: {
      chunkSize?: number;
      mimeCodec?: string;
      onProgress?: (loadedBytes: number, totalBytes: number) => void;
    }
  ): Promise<MseStreamSession | null> {
    if (!this.isMseSupported()) {
      return null;
    }

    const sessionId = 'mse_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const mediaSource = new MediaSource();
    const objectUrl = URL.createObjectURL(mediaSource);
    const abortController = new AbortController();

    const selectedMime = options?.mimeCodec || this.getSupportedMseCodec();
    const chunkSize = options?.chunkSize || 512 * 1024; // 512 KB chunks

    const session: MseStreamSession = {
      id: sessionId,
      mediaSource,
      objectUrl,
      isReady: false,
      isDestroyed: false,
      mimeType: selectedMime,
      totalBytes: 0,
      bufferedBytes: 0,
      abortController,
    };

    this.sessions.set(sessionId, session);

    return new Promise<MseStreamSession | null>((resolve) => {
      const handleSourceOpen = async () => {
        mediaSource.removeEventListener('sourceopen', handleSourceOpen);
        if (session.isDestroyed) {
          resolve(null);
          return;
        }

        try {
          const sourceBuffer = mediaSource.addSourceBuffer(selectedMime);
          session.sourceBuffer = sourceBuffer;
          session.isReady = true;
          renderPerformanceMonitor.setActiveDecoder('mse_chunked');

          // Launch chunked fetch pipeline in background
          this.startChunkedFetch(session, url, chunkSize, options?.onProgress);
          resolve(session);
        } catch (err: any) {
          mediaErrorLogger.logRenderWarning(
            `MSE SourceBuffer initialization error with ${selectedMime}`,
            err?.message || String(err),
            'video_decode'
          );
          resolve(null);
        }
      };

      if (mediaSource.readyState === 'open') {
        handleSourceOpen();
      } else {
        mediaSource.addEventListener('sourceopen', handleSourceOpen);
      }
    });
  }

  // Fetch media in small byte-range chunks and push to SourceBuffer queue
  private async startChunkedFetch(
    session: MseStreamSession,
    url: string,
    chunkSize: number,
    onProgress?: (loaded: number, total: number) => void
  ) {
    try {
      const resp = await fetch(url, {
        signal: session.abortController.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Failed to fetch media stream (status ${resp.status})`);
      }

      const contentLengthHeader = resp.headers.get('content-length');
      session.totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      const reader = resp.body.getReader();
      const chunkQueue: Uint8Array[] = [];
      let isAppending = false;

      const appendNext = () => {
        if (session.isDestroyed || !session.sourceBuffer || session.mediaSource.readyState !== 'open') {
          return;
        }

        if (!isAppending && chunkQueue.length > 0 && !session.sourceBuffer.updating) {
          const chunk = chunkQueue.shift()!;
          isAppending = true;
          try {
            session.sourceBuffer.appendBuffer(chunk);
          } catch (e: any) {
            isAppending = false;
            // Handle QuotaExceededError by evicting older buffers
            if (e.name === 'QuotaExceededError' && session.sourceBuffer && !session.sourceBuffer.updating) {
              try {
                const currentTime = session.mediaSource.duration || 0;
                if (currentTime > 10) {
                  session.sourceBuffer.remove(0, currentTime - 10);
                }
              } catch {}
            }
          }
        }
      };

      if (session.sourceBuffer) {
        session.sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          appendNext();
        });
      }

      while (!session.isDestroyed) {
        const { done, value } = await reader.read();
        if (done) {
          if (session.mediaSource.readyState === 'open' && !session.sourceBuffer?.updating) {
            try {
              session.mediaSource.endOfStream();
            } catch {}
          }
          break;
        }

        if (value) {
          session.bufferedBytes += value.byteLength;
          chunkQueue.push(value);
          appendNext();
          if (onProgress) {
            onProgress(session.bufferedBytes, session.totalBytes || session.bufferedBytes);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[MSE Buffer Manager] Stream fetch error:', err);
      }
    }
  }

  // Evict played segments before the playhead to release GPU/RAM memory
  public trimBufferWindow(session: MseStreamSession, currentPlayheadTime: number, keepWindowSeconds = 5) {
    if (!session || session.isDestroyed || !session.sourceBuffer || session.sourceBuffer.updating) {
      return;
    }

    const removeEnd = currentPlayheadTime - keepWindowSeconds;
    if (removeEnd > 2) {
      try {
        session.sourceBuffer.remove(0, removeEnd);
      } catch {}
    }
  }

  // Destroy session and clean up object URLs
  public destroySession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isDestroyed = true;
      session.abortController.abort();
      try {
        URL.revokeObjectURL(session.objectUrl);
      } catch {}
      this.sessions.delete(sessionId);
    }
  }

  public clearAll() {
    for (const id of this.sessions.keys()) {
      this.destroySession(id);
    }
  }
}

export const mseBufferManager = new MseBufferManagerService();
