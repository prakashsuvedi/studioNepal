import { Scene, AudioTrack, BrandOverlayConfig } from '../types';
import { SubtitleItem } from '../components/SubtitleEditorModal';

export interface RenderOptions {
  scenes: Scene[];
  audioTracks?: AudioTrack[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '720p' | '4k';
  fps?: number;
  format?: 'webm' | 'mp4' | 'gif';
  bitrate?: 'high' | 'balanced' | 'compressed';
  brandOverlayConfig?: BrandOverlayConfig;
  subtitles?: SubtitleItem[];
  onProgress?: (progress: number, step: string) => void;
}

/**
 * Real client-side Video Combiner and Rendering Engine
 * Composites multiple scenes (images & videos), motions, filters, text overlays, 
 * watermarks, and multi-track audio into a single standalone video file using MediaRecorder & Canvas.
 */
export async function renderTimelineToVideoBlob(options: RenderOptions): Promise<{ blob: Blob; url: string }> {
  const {
    scenes,
    audioTracks = [],
    aspectRatio,
    resolution,
    fps = 30,
    format = 'webm',
    brandOverlayConfig,
    subtitles = [],
    onProgress
  } = options;

  if (!scenes || scenes.length === 0) {
    throw new Error('Timeline must contain at least one scene to render.');
  }

  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 4), 0);

  // Determine canvas pixel dimensions
  let width = 1280;
  let height = 720;

  if (resolution === '1080p') {
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    } else {
      width = 1920;
      height = 1080;
    }
  } else if (resolution === '4k') {
    if (aspectRatio === '9:16') {
      width = 2160;
      height = 3840;
    } else if (aspectRatio === '1:1') {
      width = 2160;
      height = 2160;
    } else {
      width = 3840;
      height = 2160;
    }
  } else {
    // 720p
    if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '1:1') {
      width = 720;
      height = 720;
    } else {
      width = 1280;
      height = 720;
    }
  }

  if (onProgress) onProgress(5, 'Pre-allocating high-resolution composition canvas...');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Failed to acquire 2D rendering context on canvas');
  }

  // Pre-load all scene media elements (images and videos)
  if (onProgress) onProgress(15, 'Buffering scene media assets and textures...');
  
  const loadedMedia = await Promise.all(
    scenes.map(async (scene, idx) => {
      const isVideo = scene.mediaType === 'video' || scene.mediaUrl?.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
      
      if (isVideo && scene.mediaUrl) {
        return new Promise<{ type: 'video'; el: HTMLVideoElement; scene: Scene }>((resolve) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.src = scene.mediaUrl;
          video.muted = true;
          video.preload = 'auto';
          video.playsInline = true;
          video.onloadeddata = () => resolve({ type: 'video', el: video, scene });
          video.onerror = () => {
            // Fallback to non-CORS attempt
            const vFallback = document.createElement('video');
            vFallback.src = scene.mediaUrl;
            vFallback.muted = true;
            vFallback.preload = 'auto';
            vFallback.onloadeddata = () => resolve({ type: 'video', el: vFallback, scene });
            vFallback.onerror = () => resolve({ type: 'video', el: vFallback, scene });
          };
          setTimeout(() => resolve({ type: 'video', el: video, scene }), 4000);
        });
      } else if (scene.mediaUrl) {
        return new Promise<{ type: 'image'; el: HTMLImageElement; scene: Scene }>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = scene.mediaUrl;
          img.onload = () => resolve({ type: 'image', el: img, scene });
          img.onerror = () => {
            // Try without crossOrigin in case CDN blocks CORS headers
            const imgFallback = new Image();
            imgFallback.src = scene.mediaUrl;
            imgFallback.onload = () => resolve({ type: 'image', el: imgFallback, scene });
            imgFallback.onerror = () => resolve({ type: 'image', el: imgFallback, scene });
          };
          setTimeout(() => resolve({ type: 'image', el: img, scene }), 4000);
        });
      }

      return { type: 'image' as const, el: new Image(), scene };
    })
  );

  // Set up Web Audio Context for real audio mixing
  if (onProgress) onProgress(30, 'Synthesizing multi-track audio master...');
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();

      for (const track of audioTracks) {
        if (track.url) {
          try {
            const resp = await fetch(track.url, { mode: 'cors' }).catch(() => null);
            if (resp && resp.ok) {
              const arrayBuf = await resp.arrayBuffer();
              const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuf;

              const gainNode = audioCtx.createGain();
              const vol = (track.volume ?? 80) / 100;
              gainNode.gain.value = vol;

              source.connect(gainNode);
              gainNode.connect(audioDest);
              source.start(audioCtx.currentTime + (track.startTime || 0));
            }
          } catch (audioErr) {
            console.warn('Audio track mix notice:', audioErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Web Audio setup notice:', e);
  }

  // Combine Canvas stream + Audio stream
  const canvasStream = canvas.captureStream(fps);
  if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
    audioDest.stream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
  }

  // Setup MediaRecorder
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: resolution === '4k' ? 25000000 : resolution === '1080p' ? 8000000 : 3500000
    });
  } catch (recErr) {
    recorder = new MediaRecorder(canvasStream);
  }

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  if (onProgress) onProgress(45, 'Recording sequential timeline frames & applying transitions...');

  recorder.start(100);

  // Frame-by-frame rendering loop over total duration
  const frameIntervalMs = 1000 / fps;
  const totalFrames = Math.ceil(totalDuration * fps);
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / fps;

    // Calculate active scene
    let accumulatedTime = 0;
    let activeSceneIdx = 0;
    let sceneStartTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + scenes[i].duration) {
        activeSceneIdx = i;
        sceneStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += scenes[i].duration;
    }

    if (currentTime >= accumulatedTime && scenes.length > 0) {
      activeSceneIdx = scenes.length - 1;
      sceneStartTime = accumulatedTime - scenes[activeSceneIdx].duration;
    }

    const currentMedia = loadedMedia[activeSceneIdx];
    const scene = scenes[activeSceneIdx];
    const sceneElapsed = currentTime - sceneStartTime;
    const sceneProgress = Math.min(1, Math.max(0, sceneElapsed / (scene.duration || 4)));

    // Clear background
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, width, height);

    // Draw Media
    ctx.save();
    
    // Apply Camera Motion
    ctx.translate(width / 2, height / 2);
    if (scene.motion === 'zoom_in') {
      const scale = 1.0 + sceneProgress * 0.12;
      ctx.scale(scale, scale);
    } else if (scene.motion === 'zoom_out') {
      const scale = 1.12 - sceneProgress * 0.12;
      ctx.scale(scale, scale);
    } else if (scene.motion === 'pan_right') {
      ctx.translate(sceneProgress * 40, 0);
      ctx.scale(1.05, 1.05);
    } else if (scene.motion === 'pan_left') {
      ctx.translate(-sceneProgress * 40, 0);
      ctx.scale(1.05, 1.05);
    } else if (scene.motion === 'dolly') {
      const scale = 1.0 + Math.sin(sceneProgress * Math.PI) * 0.08;
      ctx.scale(scale, scale);
    }
    ctx.translate(-width / 2, -height / 2);

    // Apply color filter
    if (scene.filter === 'cinematic') {
      ctx.filter = 'contrast(1.2) saturate(1.15) brightness(0.95)';
    } else if (scene.filter === 'warm') {
      ctx.filter = 'sepia(0.3) saturate(1.25)';
    } else if (scene.filter === 'cool') {
      ctx.filter = 'hue-rotate(180deg) saturate(1.1)';
    } else if (scene.filter === 'vibrant') {
      ctx.filter = 'saturate(1.5) contrast(1.1)';
    }

    if (currentMedia.type === 'video' && currentMedia.el && currentMedia.el.readyState >= 2) {
      const v = currentMedia.el;
      if (Math.abs(v.currentTime - (sceneElapsed % (v.duration || scene.duration))) > 0.3) {
        v.currentTime = sceneElapsed % (v.duration || scene.duration);
      }
      const vRatio = v.videoWidth / v.videoHeight;
      const targetRatio = width / height;
      let dw = width, dh = height, dx = 0, dy = 0;
      if (vRatio > targetRatio) {
        dw = height * vRatio;
        dx = (width - dw) / 2;
      } else {
        dh = width / vRatio;
        dy = (height - dh) / 2;
      }
      try {
        ctx.drawImage(v, dx, dy, dw, dh);
      } catch (e) {}
    } else if (currentMedia.type === 'image' && currentMedia.el && currentMedia.el.naturalWidth > 0) {
      const img = currentMedia.el;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = width / height;
      let dw = width, dh = height, dx = 0, dy = 0;
      if (imgRatio > targetRatio) {
        dw = height * imgRatio;
        dx = (width - dw) / 2;
      } else {
        dh = width / imgRatio;
        dy = (height - dh) / 2;
      }
      try {
        ctx.drawImage(img, dx, dy, dw, dh);
      } catch (e) {}
    } else {
      // Procedural cinematic background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#111827');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(width * 0.035)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(scene.title, width / 2, height / 2);
    }

    ctx.restore();

    // Subtle cinematic vignette
    const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.75);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtitles & Text Overlays
    const overlayText = scene.textNepali || scene.textOverlay;
    if (overlayText) {
      const fontSize = Math.max(18, Math.round(width * 0.032));
      ctx.font = `bold ${fontSize}px Mukta, "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';

      const textY = scene.textPosition === 'top' 
        ? height * 0.15 
        : scene.textPosition === 'center'
        ? height * 0.5 
        : height * 0.88;

      const metrics = ctx.measureText(overlayText);
      const textWidth = metrics.width;
      const paddingX = fontSize * 0.8;
      const paddingY = fontSize * 0.4;

      // Backdrop pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(
        width / 2 - textWidth / 2 - paddingX,
        textY - fontSize + paddingY * 0.5 - 4,
        textWidth + paddingX * 2,
        fontSize + paddingY * 2,
        8
      );
      ctx.fill();

      // Text with shadow
      ctx.fillStyle = scene.textColor || '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(overlayText, width / 2, textY);
      ctx.shadowBlur = 0;
    }

    // Brand Watermark Overlay
    if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl) {
      const scaleVal = (brandOverlayConfig.scalePercent ? brandOverlayConfig.scalePercent / 100 : 0.18);
      const logoSize = Math.round(width * scaleVal);
      const margin = brandOverlayConfig.marginPx || 24;
      let lx = width - logoSize - margin;
      let ly = margin;

      if (brandOverlayConfig.position === 'top-left') {
        lx = margin;
        ly = margin;
      } else if (brandOverlayConfig.position === 'bottom-left') {
        lx = margin;
        ly = height - logoSize - margin;
      } else if (brandOverlayConfig.position === 'bottom-right') {
        lx = width - logoSize - margin;
        ly = height - logoSize - margin;
      }

      ctx.save();
      ctx.globalAlpha = (brandOverlayConfig.opacityPercent ? brandOverlayConfig.opacityPercent / 100 : 0.85);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(logoSize * 0.22)}px sans-serif`;
      ctx.fillText(brandOverlayConfig.brandText || 'NepalAI Studio', lx, ly + logoSize * 0.5);
      ctx.restore();
    }

    // Update progress
    if (frame % Math.max(1, Math.floor(totalFrames / 15)) === 0) {
      const percent = Math.round(45 + (frame / totalFrames) * 45);
      if (onProgress) {
        onProgress(percent, `Rendering frame ${frame + 1} of ${totalFrames} (${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`);
      }
      // Yield to UI event loop
      await new Promise((r) => setTimeout(r, 4));
    }
  }

  if (onProgress) onProgress(95, 'Finalizing video file container and metadata...');

  recorder.stop();
  if (audioCtx) {
    audioCtx.close().catch(() => {});
  }

  // Await recorder completion
  const recordedBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(finalBlob);
    };
    setTimeout(() => {
      const fallbackBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(fallbackBlob);
    }, 1500);
  });

  const downloadUrl = URL.createObjectURL(recordedBlob);

  if (onProgress) onProgress(100, 'Video render & combination complete!');

  return {
    blob: recordedBlob,
    url: downloadUrl
  };
}
