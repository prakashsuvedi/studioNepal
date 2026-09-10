// Offscreen Decoder & Compositor Bridge
// Connects React UI and HTMLCanvasElement to the WebWorker-based offscreen pipeline.

import { renderPerformanceMonitor } from './renderPerformanceMonitor';

export class OffscreenDecoderBridge {
  private worker: Worker | null = null;
  private isSupported: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    this.isSupported =
      typeof window !== 'undefined' &&
      typeof Worker !== 'undefined' &&
      typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
  }

  public isWorkerSupported(): boolean {
    return this.isSupported;
  }

  public initWorker(canvas: HTMLCanvasElement, width: number, height: number): boolean {
    if (!this.isSupported) return false;

    try {
      if (this.worker) {
        this.worker.terminate();
      }

      // Initialize worker via inline Blob or direct worker constructor
      const workerCode = `
        let offscreenCanvas = null;
        let ctx = null;

        self.onmessage = (e) => {
          const data = e.data;
          if (data.type === 'INIT') {
            if (data.canvas) {
              offscreenCanvas = data.canvas;
              ctx = offscreenCanvas.getContext('2d');
            }
            self.postMessage({ type: 'INIT_DONE', success: !!ctx });
            return;
          }

          if (data.type === 'RENDER_FRAME' && ctx && offscreenCanvas) {
            const start = performance.now();
            ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            if (data.filter && data.filter !== 'none') {
              ctx.filter = data.filter;
            } else {
              ctx.filter = 'none';
            }

            if (data.bitmap) {
              ctx.drawImage(data.bitmap, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
              data.bitmap.close();
            }

            ctx.filter = 'none';

            if (data.subtitles && Array.isArray(data.subtitles)) {
              data.subtitles.forEach((sub) => {
                ctx.font = 'bold ' + (sub.fontSize || 24) + 'px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = sub.color || '#FFFFFF';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(sub.text, offscreenCanvas.width / 2, sub.y || offscreenCanvas.height - 60);
              });
            }

            const duration = performance.now() - start;
            self.postMessage({ type: 'FRAME_RENDERED', time: data.time, renderDurationMs: duration });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      const offscreen = canvas.transferControlToOffscreen();
      this.worker.postMessage(
        {
          type: 'INIT',
          canvas: offscreen,
          width,
          height,
        },
        [offscreen]
      );

      this.worker.onmessage = (e) => {
        if (e.data.type === 'INIT_DONE') {
          this.isInitialized = e.data.success;
          if (this.isInitialized) {
            renderPerformanceMonitor.setActiveDecoder('offscreen_worker');
          }
        }
      };

      URL.revokeObjectURL(workerUrl);
      return true;
    } catch (err) {
      console.warn('[OffscreenDecoderBridge] Worker initialization fallback to main canvas:', err);
      this.isInitialized = false;
      return false;
    }
  }

  public renderFrameOffscreen(
    bitmap: ImageBitmap,
    time: number,
    filter?: string,
    subtitles?: Array<{ text: string; fontSize: number; color: string; y: number }>
  ) {
    if (!this.worker || !this.isInitialized) return false;

    try {
      this.worker.postMessage(
        {
          type: 'RENDER_FRAME',
          bitmap,
          time,
          filter,
          subtitles,
        },
        [bitmap]
      );
      return true;
    } catch {
      return false;
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}

export const offscreenDecoderBridge = new OffscreenDecoderBridge();
