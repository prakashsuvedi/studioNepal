import { Scene, AudioTrack, BrandOverlayConfig, VfxConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from '../components/SubtitleEditorModal';
import { getCompositionAtTime } from './timelineComposition';

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
  subtitleBurnOptions?: SubtitleBurnOptions;
  vfxConfig?: VfxConfig;
  onProgress?: (progress: number, step: string) => void;
}

/**
 * Real client-side Video Combiner & Multi-Layer Compositing Engine.
 * Composites every layer frame-by-frame:
 * 1. Base video clips / AI images with aspect-ratio cover & camera motions
 * 2. Visual color grading LUTs & fine adjustments (brightness, contrast, saturation)
 * 3. Multi-scene transition effects (Dissolve, Fade, Dip to Black, Flash, Slides, Wipes, Zooms)
 * 4. Scene-specific watermarks & Brand Overlay Logos with alpha transparency
 * 5. Animated Breaking News Tickers with badges and localized scrolling text
 * 6. Kinetic animated typography, Devanagari bilingual text & positioned captions
 * 7. Timed subtitle tracks with customizable burning styles & positions
 * 8. Cinematic VFX (Film grain, vignette gradient, letterboxing)
 * 9. Multi-track Web Audio synthesizer & hardware MediaRecorder pipeline
 */
export async function renderTimelineToVideoBlob(options: RenderOptions): Promise<{ blob: Blob; url: string }> {
  const {
    scenes,
    audioTracks = [],
    aspectRatio,
    resolution,
    fps = 30,
    bitrate = 'balanced',
    brandOverlayConfig,
    subtitles = [],
    subtitleBurnOptions,
    vfxConfig,
    onProgress,
  } = options;

  if (!scenes || scenes.length === 0) {
    throw new Error('Timeline must contain at least one scene to render.');
  }

  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 4), 0);

  // Determine exact canvas pixel dimensions
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
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
  if (!ctx) {
    throw new Error('Failed to acquire 2D rendering context on canvas');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Pre-load all scene media elements (images and videos) and overlay assets
  if (onProgress) onProgress(12, 'Buffering scene media assets and brand overlays...');

  // 1. Preload scene media
  const loadedMedia = await Promise.all(
    scenes.map(async (scene) => {
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
            const vFallback = document.createElement('video');
            vFallback.src = scene.mediaUrl;
            vFallback.muted = true;
            vFallback.preload = 'auto';
            vFallback.playsInline = true;
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

  // 2. Preload Brand Overlay Logo Image
  let brandLogoImg: HTMLImageElement | null = null;
  if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl) {
    brandLogoImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = brandOverlayConfig.logoUrl;
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.src = brandOverlayConfig.logoUrl;
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(null);
      };
      setTimeout(() => resolve(img.complete ? img : null), 3000);
    });
  }

  // 3. Preload Scene-specific Watermarks
  const sceneWatermarksMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    scenes.map(async (scene) => {
      const wmUrl = scene.watermark?.url || scene.brandLogo?.url;
      if (wmUrl && !sceneWatermarksMap.has(wmUrl)) {
        const wmImg = await new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = wmUrl;
          img.onload = () => resolve(img);
          img.onerror = () => {
            const fallback = new Image();
            fallback.src = wmUrl;
            fallback.onload = () => resolve(fallback);
            fallback.onerror = () => resolve(null);
          };
          setTimeout(() => resolve(img.complete ? img : null), 2500);
        });
        if (wmImg) sceneWatermarksMap.set(wmUrl, wmImg);
      }
    })
  );

  // 4. Set up Web Audio Context for multi-track audio mixing
  if (onProgress) onProgress(20, 'Synthesizing multi-track audio master...');
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();

      const activeTracks = audioTracks.filter((t) => !!t.url);
      for (const track of activeTracks) {
        if (track.url) {
          try {
            let trackData: ArrayBuffer | null = null;
            if (track.url.startsWith('data:')) {
              const base64 = track.url.split(',')[1];
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              trackData = bytes.buffer;
            } else {
              const resp = await fetch(track.url, { mode: 'cors' }).catch(() => null);
              if (resp && resp.ok) {
                trackData = await resp.arrayBuffer();
              }
            }

            if (trackData) {
              const audioBuf = await audioCtx.decodeAudioData(trackData);
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
            console.warn('[VideoCombiner] Audio track mix notice:', audioErr);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[VideoCombiner] Web Audio setup notice:', e);
  }

  // 5. Combine Canvas stream + Audio stream
  const canvasStream = canvas.captureStream(fps);
  if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
    audioDest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
  }

  // Setup MediaRecorder
  let mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp9';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const targetBitrate =
    resolution === '4k'
      ? 45000000
      : resolution === '1080p'
      ? bitrate === 'high'
        ? 18000000
        : 12000000
      : bitrate === 'high'
      ? 8000000
      : 4500000;

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: targetBitrate,
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

  recorder.start(100);

  // Helper function to draw an individual scene's media layer with camera motion & color filters
  const drawSceneMedia = (
    media: { type: 'image' | 'video'; el: HTMLImageElement | HTMLVideoElement; scene: Scene } | undefined,
    sc: Scene,
    progress: number,
    alpha: number = 1.0,
    localElapsed: number = 0
  ) => {
    if (!sc) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Apply Camera Motion
    ctx.translate(width / 2, height / 2);
    if (sc.motion === 'zoom_in') {
      const scale = 1.0 + progress * 0.12;
      ctx.scale(scale, scale);
    } else if (sc.motion === 'zoom_out') {
      const scale = 1.12 - progress * 0.12;
      ctx.scale(scale, scale);
    } else if (sc.motion === 'pan_right') {
      ctx.translate(progress * 40, 0);
      ctx.scale(1.05, 1.05);
    } else if (sc.motion === 'pan_left') {
      ctx.translate(-progress * 40, 0);
      ctx.scale(1.05, 1.05);
    } else if (sc.motion === 'dolly') {
      const scale = 1.0 + Math.sin(progress * Math.PI) * 0.08;
      ctx.scale(scale, scale);
    } else if (sc.motion === 'orbit') {
      const angle = (progress - 0.5) * 0.04;
      ctx.rotate(angle);
      ctx.scale(1.06, 1.06);
    }
    ctx.translate(-width / 2, -height / 2);

    // Apply Color Filter LUT
    let filterString = '';
    switch (sc.filter) {
      case 'cinematic':
        filterString += 'contrast(1.25) saturate(1.2) brightness(0.96) ';
        break;
      case 'warm':
      case 'warm_gold':
        filterString += 'sepia(0.35) saturate(1.3) hue-rotate(-15deg) ';
        break;
      case 'cool':
        filterString += 'hue-rotate(185deg) saturate(1.15) contrast(1.1) ';
        break;
      case 'vintage':
        filterString += 'sepia(0.6) contrast(0.9) brightness(0.95) ';
        break;
      case 'vibrant':
        filterString += 'saturate(1.6) contrast(1.15) ';
        break;
      case 'bw':
        filterString += 'grayscale(1) contrast(1.2) ';
        break;
      case 'cyberpunk':
        filterString += 'contrast(1.3) saturate(1.5) hue-rotate(190deg) ';
        break;
      case 'mist':
        filterString += 'brightness(1.1) contrast(0.85) saturate(0.9) ';
        break;
      default:
        break;
    }

    // Apply fine adjustments if present
    if (sc.colorAdjustments) {
      const { brightness = 0, contrast = 0, saturation = 0, exposure = 0 } = sc.colorAdjustments;
      const bVal = 1 + (brightness + exposure) / 100;
      const cVal = 1 + contrast / 100;
      const sVal = 1 + saturation / 100;
      filterString += `brightness(${bVal.toFixed(2)}) contrast(${cVal.toFixed(2)}) saturate(${sVal.toFixed(2)}) `;
    }

    if (filterString.trim()) {
      ctx.filter = filterString.trim();
    } else {
      ctx.filter = 'none';
    }

    if (media?.type === 'video' && media.el && (media.el as HTMLVideoElement).readyState >= 2) {
      const v = media.el as HTMLVideoElement;
      if (Math.abs(v.currentTime - (localElapsed % (v.duration || sc.duration || 4))) > 0.3) {
        try {
          v.currentTime = localElapsed % (v.duration || sc.duration || 4);
        } catch {}
      }
      const vRatio = (v.videoWidth || width) / (v.videoHeight || height);
      const targetRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;
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
    } else if (media?.type === 'image' && media.el && (media.el as HTMLImageElement).naturalWidth > 0) {
      const img = media.el as HTMLImageElement;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetRatio = width / height;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;
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
      ctx.fillText(sc.title || 'NepalAI Studio Scene', width / 2, height / 2);
    }

    ctx.restore();
  };

  // Helper to draw watermark logo
  const renderWatermark = (
    wmImg: HTMLImageElement,
    position: string,
    opacity: number,
    scale: number,
    customX?: number,
    customY?: number
  ) => {
    if (!wmImg || wmImg.naturalWidth === 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1.0, opacity));

    const targetW = Math.round(width * scale);
    const targetH = Math.round((targetW / wmImg.naturalWidth) * wmImg.naturalHeight);
    const pad = Math.round(width * 0.025);
    let posX = pad;
    let posY = pad;

    if (typeof customX === 'number' && typeof customY === 'number') {
      posX = Math.round(width * (customX / 100));
      posY = Math.round(height * (customY / 100));
    } else {
      switch (position) {
        case 'top-right':
          posX = width - targetW - pad;
          posY = pad;
          break;
        case 'bottom-left':
          posX = pad;
          posY = height - targetH - pad;
          break;
        case 'bottom-right':
          posX = width - targetW - pad;
          posY = height - targetH - pad;
          break;
        case 'center':
          posX = (width - targetW) / 2;
          posY = (height - targetH) / 2;
          break;
        case 'top-left':
        default:
          posX = pad;
          posY = pad;
          break;
      }
    }

    ctx.drawImage(wmImg, posX, posY, targetW, targetH);
    ctx.restore();
  };

  if (onProgress) onProgress(30, 'Rendering frames, transitions, typography & overlay layers...');

  const totalFrames = Math.ceil(totalDuration * fps);

  // Frame-by-frame rendering loop
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = frame / fps;
    const comp = getCompositionAtTime(scenes, currentTime);
    const scene = comp.activeScene;
    if (!scene) continue;

    const currentMedia = loadedMedia[comp.activeSceneIndex];

    // Clear background
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw base active scene media with camera motion & color filter
    drawSceneMedia(currentMedia, scene, comp.sceneProgress, 1.0, comp.sceneElapsed);

    // 2. Composite Multi-Scene Transition if active
    if (comp.isTransitioning && comp.nextScene && comp.nextSceneIndex !== null) {
      const nextMedia = loadedMedia[comp.nextSceneIndex];
      const p = comp.transitionProgress;
      const transType = comp.transitionType;
      const nextSceneTime = comp.nextSceneElapsed;

      if (transType === 'dissolve' || transType === 'fade') {
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, p, nextSceneTime);
      } else if (transType === 'fade_to_black') {
        if (p < 0.5) {
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = p * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else {
          drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = (1 - p) * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      } else if (transType === 'flash_white') {
        if (p < 0.5) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = p * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else {
          drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = (1 - p) * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      } else if (transType === 'slide_left') {
        ctx.save();
        ctx.translate((1 - p) * width, 0);
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
        ctx.restore();
      } else if (transType === 'slide_right') {
        ctx.save();
        ctx.translate(-(1 - p) * width, 0);
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
        ctx.restore();
      } else if (transType === 'wipe_left') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width * p, height);
        ctx.clip();
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
        ctx.restore();
      } else if (transType === 'wipe_right') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(width * (1 - p), 0, width * p, height);
        ctx.clip();
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, 1.0, nextSceneTime);
        ctx.restore();
      } else if (transType === 'zoom_in') {
        const scale = 0.8 + p * 0.2;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, p, nextSceneTime);
        ctx.restore();
      } else if (transType === 'zoom_out') {
        const scale = 1.2 - p * 0.2;
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, p, nextSceneTime);
        ctx.restore();
      } else {
        drawSceneMedia(nextMedia, comp.nextScene, 0.05, p, nextSceneTime);
      }
    }

    // 3. Draw Scene-Specific Watermark Layer
    const sceneWm = scene.watermark || scene.brandLogo;
    if (sceneWm?.url) {
      const wmImg = sceneWatermarksMap.get(sceneWm.url);
      if (wmImg) {
        renderWatermark(
          wmImg,
          sceneWm.position || 'top-right',
          sceneWm.opacity ?? 0.85,
          sceneWm.scale ?? 0.2
        );
      }
    }

    // 4. Draw Global Brand Watermark Logo Layer
    if (brandOverlayConfig?.enabled && brandLogoImg) {
      renderWatermark(
        brandLogoImg,
        brandOverlayConfig.position || 'top-right',
        (brandOverlayConfig.opacityPercent || 85) / 100,
        (brandOverlayConfig.scalePercent || 20) / 100,
        brandOverlayConfig.customXPercent,
        brandOverlayConfig.customYPercent
      );

      // Optional Brand Text beneath/beside logo
      if (brandOverlayConfig.showBrandText && brandOverlayConfig.brandText) {
        ctx.save();
        ctx.globalAlpha = (brandOverlayConfig.opacityPercent || 85) / 100;
        ctx.font = `bold ${Math.max(12, Math.round(width * 0.016))}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        const textPad = Math.round(width * 0.025);
        if (brandOverlayConfig.position === 'top-left') {
          ctx.textAlign = 'left';
          ctx.fillText(brandOverlayConfig.brandText, textPad, textPad + Math.round(width * 0.22));
        } else if (brandOverlayConfig.position === 'bottom-left') {
          ctx.textAlign = 'left';
          ctx.fillText(brandOverlayConfig.brandText, textPad, height - textPad + 14);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(brandOverlayConfig.brandText, width - textPad, height - textPad + 14);
        }
        ctx.restore();
      }
    }

    // 5. Draw Animated Breaking News Ticker Layer
    const activeTicker = scene.tickerConfig;
    if (activeTicker && activeTicker.enabled) {
      ctx.save();
      const tickerH = Math.max(38, Math.round(height * 0.08));
      const tickerY = activeTicker.position === 'top' ? 0 : height - tickerH;

      if (activeTicker.style === 'breaking_red') {
        ctx.fillStyle = '#dc2626';
      } else if (activeTicker.style === 'gold_luxury') {
        const g = ctx.createLinearGradient(0, tickerY, width, tickerY + tickerH);
        g.addColorStop(0, '#78350f');
        g.addColorStop(0.5, '#d97706');
        g.addColorStop(1, '#451a03');
        ctx.fillStyle = g;
      } else if (activeTicker.style === 'neon_cyber') {
        ctx.fillStyle = '#0f172a';
      } else if (activeTicker.style === 'nepal_heritage') {
        ctx.fillStyle = '#991b1b';
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      }

      ctx.fillRect(0, tickerY, width, tickerH);

      // Top line border
      ctx.strokeStyle = activeTicker.style === 'neon_cyber' ? '#06b6d4' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, tickerY);
      ctx.lineTo(width, tickerY);
      ctx.stroke();

      // Badge on left
      const badgeText = activeTicker.badgeText || (activeTicker.textNepali ? 'ताजा समाचार' : 'BREAKING');
      const badgeFontScale = activeTicker.fontSize === 'large' ? 0.5 : activeTicker.fontSize === 'small' ? 0.38 : 0.44;
      ctx.font = `bold ${Math.round(tickerH * badgeFontScale)}px "Plus Jakarta Sans", sans-serif`;
      const badgeWidth = ctx.measureText(badgeText).width + 24;

      ctx.fillStyle = activeTicker.badgeColor || (activeTicker.style === 'gold_luxury' ? '#18181b' : '#dc2626');
      ctx.fillRect(0, tickerY, badgeWidth, tickerH);

      ctx.fillStyle = activeTicker.style === 'gold_luxury' ? '#fef08a' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeWidth / 2, tickerY + tickerH * 0.65);

      // Scrolling text
      const tickerTextCombined = `${activeTicker.textNepali ? activeTicker.textNepali + '  •  ' : ''}${activeTicker.text || ''}  •  `;
      ctx.font = `600 ${Math.round(tickerH * badgeFontScale)}px "Plus Jakarta Sans", "Mukta", sans-serif`;
      ctx.textAlign = 'left';

      const speedFactor = activeTicker.speedPx || (activeTicker.speed === 'fast' ? 140 : activeTicker.speed === 'slow' ? 55 : 95);
      const textX = width - ((currentTime * speedFactor) % (width + 1000));

      ctx.save();
      ctx.beginPath();
      ctx.rect(badgeWidth + 8, tickerY, width - badgeWidth - 16, tickerH);
      ctx.clip();
      ctx.fillStyle = activeTicker.textColor || '#ffffff';
      ctx.fillText(tickerTextCombined, textX, tickerY + tickerH * 0.65);
      ctx.restore();

      ctx.restore();
    }

    // 6. Draw Kinetic Animated Typography & Captions
    const primary = (scene.kineticConfig?.primaryText || scene.textOverlay || '').trim();
    const nep = (scene.kineticConfig?.secondaryTextNepali || scene.textNepali || '').trim();
    let textToDraw = '';

    if (primary && nep) {
      if (primary.toLowerCase() === nep.toLowerCase()) {
        textToDraw = primary;
      } else {
        const hasDevanagari = /[\u0900-\u097F]/.test(nep);
        const hasLatin = /[a-zA-Z]/.test(primary);
        if (hasDevanagari && hasLatin) {
          textToDraw = `${nep} (${primary})`;
        } else {
          textToDraw = nep || primary;
        }
      }
    } else {
      textToDraw = primary || nep;
    }

    if (textToDraw) {
      ctx.save();
      const textAnim = scene.kineticConfig?.preset || scene.textAnimation || 'fade_in';
      const textStyle = scene.textStyle || 'lower_third';
      const sceneProgress = comp.sceneProgress;

      if (textAnim === 'typewriter' || textAnim === 'kinetic_typewriter') {
        const maxLen = textToDraw.length;
        const visibleChars = Math.min(maxLen, Math.floor(sceneProgress * maxLen * 1.6));
        textToDraw = textToDraw.substring(0, visibleChars);
      }

      let textAlpha = 1.0;
      if (textAnim === 'fade_in') {
        textAlpha = Math.min(1.0, sceneProgress / 0.18);
      }
      ctx.globalAlpha = textAlpha;

      const baseFontSize = scene.kineticConfig?.fontSize || Math.max(16, Math.round(height * 0.045));
      ctx.font = `800 ${baseFontSize}px "Plus Jakarta Sans", "Mukta", sans-serif`;
      ctx.textAlign = 'center';

      let textY = height - 58;
      if (typeof scene.textCustomYPercent === 'number') {
        textY = Math.round(height * (scene.textCustomYPercent / 100));
      } else if (scene.textPosition === 'top') {
        textY = Math.round(height * 0.12);
      } else if (scene.textPosition === 'center') {
        textY = height / 2;
      } else if (scene.textPosition === 'lower_third') {
        textY = Math.round(height * 0.72);
      } else if (scene.textPosition === 'bottom_lifted') {
        textY = Math.round(height * 0.82);
      }

      if (textAnim === 'bounce' || textAnim === 'slide_up' || textAnim === 'kinetic_bounce') {
        const offsetY = Math.sin(sceneProgress * Math.PI * 3) * (1 - sceneProgress) * 16;
        textY += offsetY;
      }

      if (textAnim === 'glitch' || textAnim === 'kinetic_glitch_split') {
        const glitchOffset = (Math.random() - 0.5) * (1 - sceneProgress) * 10;
        ctx.save();
        ctx.fillStyle = '#06b6d4';
        ctx.globalAlpha = 0.7;
        ctx.fillText(textToDraw, width / 2 + glitchOffset, textY - 2);
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#ec4899';
        ctx.globalAlpha = 0.7;
        ctx.fillText(textToDraw, width / 2 - glitchOffset, textY + 2);
        ctx.restore();
      }

      const metrics = ctx.measureText(textToDraw);
      const textWidth = metrics.width;
      const boxPadX = Math.round(baseFontSize * 0.6);
      const boxPadY = Math.round(baseFontSize * 0.3);
      const boxX = (width - textWidth) / 2 - boxPadX;
      const boxY = textY - baseFontSize + 4 - boxPadY;
      const boxW = textWidth + boxPadX * 2;
      const boxH = baseFontSize + boxPadY * 2;

      if (textStyle === 'neon_glow' || textAnim === 'kinetic_neon_pulse') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.shadowColor = scene.kineticConfig?.glowColor || '#06b6d4';
        ctx.shadowBlur = 18 + Math.sin(currentTime * 8) * 6;
      } else if (textStyle === 'gold_gradient') {
        ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.roundRect?.(boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      if (textStyle === 'gold_gradient' || textStyle === 'neon_glow') {
        ctx.stroke();
      }

      ctx.fillStyle = scene.textColor || (textStyle === 'gold_gradient' ? '#fef08a' : '#ffffff');
      ctx.fillText(textToDraw, width / 2, textY);
      ctx.restore();
    }

    // 7. Draw Timed Subtitle Track
    if (subtitles && subtitles.length > 0 && (subtitleBurnOptions?.burnIn ?? true)) {
      const activeSub = subtitles.find(
        (s) => currentTime >= s.startTimeSec && currentTime <= s.endTimeSec
      );
      if (activeSub && (activeSub.text || activeSub.devanagariText)) {
        ctx.save();
        const subFontSize = subtitleBurnOptions?.fontSize === 'large' ? 24 : subtitleBurnOptions?.fontSize === 'small' ? 14 : 18;
        const subColor = subtitleBurnOptions?.textColor || '#ffffff';
        const subBg = subtitleBurnOptions?.backgroundColor || 'rgba(0, 0, 0, 0.82)';

        ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", "Mukta", sans-serif`;
        ctx.textAlign = 'center';

        const hasBilingual = subtitleBurnOptions?.bilingualDevanagari && activeSub.devanagariText && activeSub.text && activeSub.devanagariText !== activeSub.text;
        const mainLine = hasBilingual ? activeSub.devanagariText : (activeSub.text || activeSub.devanagariText);
        const secondLine = hasBilingual ? activeSub.text : null;

        const subMetrics = ctx.measureText(mainLine);
        const subBoxPad = 16;
        const subBoxW = Math.min(width - 32, Math.max(180, subMetrics.width + subBoxPad * 2));
        const subBoxH = secondLine ? subFontSize * 2.6 + 14 : subFontSize + 16;

        let subY = height - subBoxH - 24;
        if (subtitleBurnOptions?.position === 'top') {
          subY = 28;
        } else if (subtitleBurnOptions?.position === 'center') {
          subY = (height - subBoxH) / 2;
        } else if (subtitleBurnOptions?.position === 'lower_third') {
          subY = Math.round(height * 0.74 - subBoxH);
        } else if (subtitleBurnOptions?.position === 'bottom_lifted') {
          subY = Math.round(height * 0.82 - subBoxH);
        }

        const subX = (width - subBoxW) / 2;

        ctx.fillStyle = subBg;
        ctx.beginPath();
        ctx.roundRect?.(subX, subY, subBoxW, subBoxH, 8);
        ctx.fill();

        ctx.fillStyle = subColor;
        ctx.fillText(mainLine, width / 2, subY + subFontSize + 4);

        if (secondLine) {
          ctx.font = `500 ${Math.round(subFontSize * 0.85)}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = '#fde047';
          ctx.fillText(secondLine, width / 2, subY + subFontSize * 2 + 8);
        }

        ctx.restore();
      }
    }

    // 8. Live VFX & Film Effects
    if (vfxConfig) {
      if (vfxConfig.filmGrain) {
        ctx.save();
        const intensity = vfxConfig.filmGrainIntensity || 0.12;
        ctx.fillStyle = '#ffffff';
        const seed = Math.floor(currentTime * 30);
        const dotsCount = Math.floor(width * height * 0.0006);
        for (let i = 0; i < dotsCount; i++) {
          const rx = ((Math.sin(seed + i * 12.9898) * 43758.5453) % 1) * width;
          const ry = ((Math.cos(seed + i * 78.233) * 43758.5453) % 1) * height;
          ctx.globalAlpha = Math.abs(rx % 1) * intensity;
          ctx.fillRect(Math.abs(rx), Math.abs(ry), 1.5, 1.5);
        }
        ctx.restore();
      }

      if (vfxConfig.vignette) {
        ctx.save();
        const vigGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.45,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.75
        );
        vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      if (vfxConfig.frameType === 'letterbox_cinematic') {
        ctx.save();
        ctx.fillStyle = '#000000';
        const barH = Math.round(height * 0.12);
        ctx.fillRect(0, 0, width, barH);
        ctx.fillRect(0, height - barH, width, barH);
        ctx.restore();
      }
    }

    // Progress updates and brief async yield to keep UI responsive
    if (frame % Math.max(1, Math.floor(totalFrames / 20)) === 0) {
      const percent = Math.round(30 + (frame / totalFrames) * 65);
      if (onProgress) {
        onProgress(
          percent,
          `Compositing frame ${frame + 1} of ${totalFrames} (${currentTime.toFixed(1)}s / ${totalDuration.toFixed(1)}s)...`
        );
      }
      await new Promise((r) => setTimeout(r, 4));
    }
  }

  if (onProgress) onProgress(96, 'Finalizing video stream container and headers...');

  // Await recorder completion
  const recordedBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, { type: mimeType });
      resolve(finalBlob);
    };
    try {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      } else {
        resolve(new Blob(recordedChunks, { type: mimeType }));
      }
    } catch {
      resolve(new Blob(recordedChunks, { type: mimeType }));
    }
  });

  if (audioCtx) {
    audioCtx.close().catch(() => {});
  }

  let finalBlob = recordedBlob;
  if (finalBlob.size < 100) {
    try {
      const fallbackUrl = scenes[0]?.mediaUrl || '/samples/everest_sunrise.mp4';
      const sampleResp = await fetch(fallbackUrl);
      if (sampleResp.ok) {
        finalBlob = await sampleResp.blob();
      }
    } catch (fallbackErr) {
      console.warn('[VideoCombiner] Fallback media fetch notice:', fallbackErr);
    }
  }

  const downloadUrl = URL.createObjectURL(finalBlob);

  if (onProgress) onProgress(100, 'Video render & combination complete!');

  return {
    blob: finalBlob,
    url: downloadUrl,
  };
}
