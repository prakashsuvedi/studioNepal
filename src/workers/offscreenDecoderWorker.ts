// WebWorker-Based Offscreen Decoding & Compositing Pipeline
// Moves heavy video frame rendering, color LUT transforms, and raster operations
// to a dedicated worker thread to maintain 60 FPS UI responsiveness.

export interface WorkerInitMessage {
  type: 'INIT';
  canvas?: OffscreenCanvas;
  width: number;
  height: number;
}

export interface WorkerRenderFrameMessage {
  type: 'RENDER_FRAME';
  bitmap?: ImageBitmap;
  time: number;
  filter?: string;
  watermarkBitmap?: ImageBitmap;
  watermarkX?: number;
  watermarkY?: number;
  watermarkWidth?: number;
  watermarkHeight?: number;
  subtitles?: Array<{ text: string; fontSize: number; color: string; y: number }>;
}

let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (e: MessageEvent) => {
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
    const startTime = performance.now();
    ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Apply color filter
    if (data.filter && data.filter !== 'none') {
      ctx.filter = data.filter;
    } else {
      ctx.filter = 'none';
    }

    // Draw main frame bitmap if provided
    if (data.bitmap) {
      ctx.drawImage(data.bitmap, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      data.bitmap.close();
    }

    ctx.filter = 'none';

    // Draw watermark bitmap
    if (data.watermarkBitmap) {
      ctx.drawImage(
        data.watermarkBitmap,
        data.watermarkX || 20,
        data.watermarkY || 20,
        data.watermarkWidth || 100,
        data.watermarkHeight || 40
      );
      data.watermarkBitmap.close();
    }

    // Draw subtitle overlays
    if (data.subtitles && Array.isArray(data.subtitles)) {
      data.subtitles.forEach((sub: any) => {
        ctx!.font = `bold ${sub.fontSize || 24}px sans-serif`;
        ctx!.textAlign = 'center';
        ctx!.fillStyle = sub.color || '#FFFFFF';
        ctx!.shadowColor = 'rgba(0,0,0,0.8)';
        ctx!.shadowBlur = 4;
        ctx!.fillText(sub.text, offscreenCanvas!.width / 2, sub.y || offscreenCanvas!.height - 60);
      });
    }

    const renderDurationMs = performance.now() - startTime;
    self.postMessage({
      type: 'FRAME_RENDERED',
      time: data.time,
      renderDurationMs,
    });
  }
};
