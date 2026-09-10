// Media Pre-Warm Service
// Proactively initiates HEAD requests and 1-frame range fetches for upcoming clips in the timeline,
// warming browser HTTP caches and hardware video decoder pipelines before the playhead reaches cut points.

import { Scene } from '../types';
import { sanitizeMediaUrl } from './mediaUrlSanitizer';
import { renderPerformanceMonitor } from './renderPerformanceMonitor';

export interface PreWarmedMediaItem {
  url: string;
  sanitizedUrl: string;
  status: 'warming' | 'ready' | 'cached' | 'error';
  contentLength?: number;
  contentType?: string;
  acceptRanges?: boolean;
  blobUrl?: string;
  preWarmTimestamp: number;
  firstFrameBitmap?: ImageBitmap;
}

class MediaPreWarmService {
  private cache: Map<string, PreWarmedMediaItem> = new Map();
  private activeFetches: Set<string> = new Set();
  private hiddenWarmupVideos: Map<string, HTMLVideoElement> = new Map();

  constructor() {
    // Clean up cache periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupStale(), 60000);
    }
  }

  // Pre-warm a list of upcoming scenes relative to the current active scene index
  public preWarmTimeline(scenes: Scene[], activeIndex: number, lookahead = 2) {
    if (!scenes || scenes.length === 0) return;

    for (let i = 1; i <= lookahead; i++) {
      const targetIndex = activeIndex + i;
      if (targetIndex < scenes.length) {
        const scene = scenes[targetIndex];
        if (scene && scene.mediaUrl) {
          this.preWarmMedia(scene.mediaUrl, scene.mediaType === 'image' ? 'image' : 'video');
        }
      }
    }
  }

  // Pre-warm an individual media asset
  public async preWarmMedia(rawUrl: string, mediaType: 'video' | 'image' = 'video'): Promise<PreWarmedMediaItem> {
    const cleanUrl = sanitizeMediaUrl(rawUrl);
    if (this.cache.has(cleanUrl)) {
      const existing = this.cache.get(cleanUrl)!;
      if (existing.status === 'ready' || existing.status === 'cached') {
        return existing;
      }
    }

    if (this.activeFetches.has(cleanUrl)) {
      return this.cache.get(cleanUrl) || {
        url: rawUrl,
        sanitizedUrl: cleanUrl,
        status: 'warming',
        preWarmTimestamp: Date.now(),
      };
    }

    this.activeFetches.add(cleanUrl);
    const item: PreWarmedMediaItem = {
      url: rawUrl,
      sanitizedUrl: cleanUrl,
      status: 'warming',
      preWarmTimestamp: Date.now(),
    };
    this.cache.set(cleanUrl, item);

    try {
      // 1. Proactively issue a lightweight HEAD or range request
      let rangeSupported = true;
      let contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      let contentLength = 0;

      try {
        const headResp = await fetch(cleanUrl, {
          method: 'HEAD',
          headers: { 'Range': 'bytes=0-65535' },
        });

        if (headResp.ok || headResp.status === 206) {
          contentType = headResp.headers.get('content-type') || contentType;
          rangeSupported = headResp.headers.get('accept-ranges') === 'bytes' || headResp.status === 206;
          const lengthHeader = headResp.headers.get('content-length');
          if (lengthHeader) contentLength = parseInt(lengthHeader, 10);
        }
      } catch {
        // Continue if HEAD is blocked by CORS, proceed to minimal chunk fetch
      }

      // 2. Fetch minimal 1-frame pre-warm chunk (first 128KB) to prime browser network cache
      try {
        const chunkResp = await fetch(cleanUrl, {
          headers: { 'Range': 'bytes=0-131071' },
          cache: 'force-cache',
        });
        if (chunkResp.ok || chunkResp.status === 206) {
          item.status = 'cached';
        }
      } catch {}

      // 3. For video clips, spin up a lightweight background offscreen decoder element
      if (mediaType === 'video' && typeof document !== 'undefined') {
        if (!this.hiddenWarmupVideos.has(cleanUrl)) {
          const warmVid = document.createElement('video');
          warmVid.preload = 'auto';
          warmVid.muted = true;
          warmVid.playsInline = true;
          warmVid.crossOrigin = 'anonymous';
          warmVid.style.position = 'fixed';
          warmVid.style.width = '1px';
          warmVid.style.height = '1px';
          warmVid.style.opacity = '0.001';
          warmVid.style.pointerEvents = 'none';
          warmVid.style.top = '-9999px';

          const onReady = () => {
            item.status = 'ready';
            item.contentLength = contentLength;
            item.contentType = contentType;
            item.acceptRanges = rangeSupported;
            this.hiddenWarmupVideos.set(cleanUrl, warmVid);
            renderPerformanceMonitor.recordFirstFrameDecoded(`prewarm_${cleanUrl}`);
          };

          warmVid.onloadeddata = onReady;
          warmVid.oncanplay = onReady;

          warmVid.onerror = () => {
            // Attempt proxy fallback pre-warm if direct fails
            if (!cleanUrl.includes('/api/proxy/media') && cleanUrl.startsWith('http')) {
              warmVid.src = `/api/proxy/media?url=${encodeURIComponent(cleanUrl)}`;
              warmVid.load();
            } else {
              item.status = 'cached';
            }
          };

          renderPerformanceMonitor.recordClipLoadStart(`prewarm_${cleanUrl}`, 'Pre-warm Clip');
          warmVid.src = cleanUrl;
          warmVid.load();
          document.body.appendChild(warmVid);
        }
      } else {
        item.status = 'ready';
      }

      item.contentLength = contentLength;
      item.contentType = contentType;
      item.acceptRanges = rangeSupported;
    } catch (err) {
      item.status = 'cached';
    } finally {
      this.activeFetches.delete(cleanUrl);
    }

    return item;
  }

  // Retrieve a pre-warmed media item if ready
  public getPreWarmedItem(rawUrl: string): PreWarmedMediaItem | undefined {
    const cleanUrl = sanitizeMediaUrl(rawUrl);
    return this.cache.get(cleanUrl);
  }

  // Check if an asset is already primed in decoder cache
  public isPreWarmed(rawUrl: string): boolean {
    const item = this.getPreWarmedItem(rawUrl);
    return item?.status === 'ready' || item?.status === 'cached';
  }

  // Cleanup old pre-warm elements to prevent memory leaks
  private cleanupStale() {
    const now = Date.now();
    for (const [url, item] of this.cache.entries()) {
      if (now - item.preWarmTimestamp > 5 * 60 * 1000) {
        if (item.blobUrl) {
          try { URL.revokeObjectURL(item.blobUrl); } catch {}
        }
        const vid = this.hiddenWarmupVideos.get(url);
        if (vid && vid.parentNode) {
          try {
            vid.src = '';
            vid.remove();
          } catch {}
          this.hiddenWarmupVideos.delete(url);
        }
        this.cache.delete(url);
      }
    }
  }

  public clear() {
    for (const [, vid] of this.hiddenWarmupVideos.entries()) {
      try {
        vid.src = '';
        vid.remove();
      } catch {}
    }
    this.hiddenWarmupVideos.clear();
    this.cache.clear();
    this.activeFetches.clear();
  }
}

export const mediaPreWarm = new MediaPreWarmService();
