import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Scene, BrandOverlayConfig, TickerConfig, VfxConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { Play, Activity, Eye, Film, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { getCompositionAtTime } from '../lib/timelineComposition';
import { mediaErrorLogger } from '../lib/mediaErrorLogger';
import { sanitizeMediaUrl } from '../lib/mediaUrlSanitizer';
import { mediaPreWarm } from '../lib/mediaPreWarm';
import { mseBufferManager, MseStreamSession } from '../lib/mseBufferManager';
import { renderPerformanceMonitor, VideoPerformanceMetrics } from '../lib/renderPerformanceMonitor';
import { offscreenDecoderBridge } from '../lib/offscreenDecoderBridge';

export interface VideoAssetState {
  element: HTMLVideoElement;
  status: 'idle' | 'loading' | 'metadata' | 'ready' | 'error';
  url: string;
  readyState: number;
  networkState: number;
  duration: number;
  currentTime: number;
  videoWidth: number;
  videoHeight: number;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  error?: string;
  lastDecodedTime?: number;
  retryCount: number;
}

interface LivePreviewCanvasProps {
  scenes: Scene[];
  currentTime: number;
  isPlaying: boolean;
  aspectRatio: '16:9' | '9:16' | '1:1';
  brandOverlayConfig?: BrandOverlayConfig;
  onTogglePlay?: () => void;
  selectedSceneId?: string;
  onSelectScene?: (id: string) => void;
  className?: string;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
  vfxConfig?: VfxConfig;
  safeAreaMode?: 'none' | 'action_title' | 'social_9_16' | 'grid_3x3';
  isMuted?: boolean;
  playbackSpeed?: number;
}

export const LivePreviewCanvas: React.FC<LivePreviewCanvasProps> = ({
  scenes,
  currentTime,
  isPlaying,
  aspectRatio,
  brandOverlayConfig,
  onTogglePlay,
  selectedSceneId,
  onSelectScene,
  className = '',
  subtitles,
  subtitleBurnOptions,
  vfxConfig,
  safeAreaMode = 'none',
  isMuted = false,
  playbackSpeed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const deckAVideoRef = useRef<HTMLVideoElement | null>(null);
  const deckBVideoRef = useRef<HTMLVideoElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [fps, setFps] = useState<number>(60);
  const [metrics, setMetrics] = useState<VideoPerformanceMetrics>(renderPerformanceMonitor.getMetrics());
  const [showHud, setShowHud] = useState<boolean>(false);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [showRawInspector, setShowRawInspector] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const deckARetryCountRef = useRef<number>(0);
  const deckBRetryCountRef = useRef<number>(0);
  const activeMseSessionRef = useRef<MseStreamSession | null>(null);

  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const lastActiveSceneIdRef = useRef<string | null>(null);

  // Unified composition calculation via timeline composition engine
  const compositionState = useMemo(() => getCompositionAtTime(scenes, currentTime), [scenes, currentTime]);
  const activeScene = compositionState.activeScene;
  const activeSceneIndex = compositionState.activeSceneIndex;
  const nextScene = compositionState.nextScene;
  const isTransitioning = compositionState.isTransition;
  const transitionProgress = compositionState.transitionProgress;

  // Subscribe to performance metrics (TTFF, Jitter, Drops)
  useEffect(() => {
    const unsub = renderPerformanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });
    return unsub;
  }, []);

  // Proactive Media Pre-Warm Trigger (Pre-warms next 2 clips in timeline)
  useEffect(() => {
    mediaPreWarm.preWarmTimeline(scenes, activeSceneIndex, 2);
  }, [scenes, activeSceneIndex]);

  // Track Time-To-First-Frame (TTFF) on scene change
  useEffect(() => {
    if (activeScene?.id && activeScene.id !== lastActiveSceneIdRef.current) {
      lastActiveSceneIdRef.current = activeScene.id;
      deckARetryCountRef.current = 0;
      deckBRetryCountRef.current = 0;
      renderPerformanceMonitor.recordClipLoadStart(
        activeScene.id,
        activeScene.title || 'Scene',
        activeSceneIndex
      );
    }
  }, [activeScene?.id, activeScene?.title, activeSceneIndex]);

  // High-Resolution crisp canvas coordinate space
  const canvasDimensions = useMemo(() => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 720, height: 1280 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '16:9':
      default:
        return { width: 1280, height: 720 };
    }
  }, [aspectRatio]);

  // DOUBLE-BUFFERED ARCHITECTURE (Deck A / Deck B)
  // Even scenes (0, 2, 4...) run on Deck A; Odd scenes (1, 3, 5...) run on Deck B.
  // The inactive deck pre-buffers the upcoming clip into GPU texture memory ahead of time.
  const isEvenScene = activeSceneIndex % 2 === 0;

  const deckAScene = isEvenScene ? activeScene : (nextScene || scenes[activeSceneIndex - 1] || null);
  const deckBScene = !isEvenScene ? activeScene : (nextScene || scenes[activeSceneIndex - 1] || null);

  const isDeckAVideo = useMemo(() => {
    if (!deckAScene?.mediaUrl) return false;
    return deckAScene.mediaType === 'video' || deckAScene.mediaUrl.match(/\.(mp4|webm|mov|ogg|m4v)($|\?)/i) != null;
  }, [deckAScene?.mediaUrl, deckAScene?.mediaType]);

  const isDeckBVideo = useMemo(() => {
    if (!deckBScene?.mediaUrl) return false;
    return deckBScene.mediaType === 'video' || deckBScene.mediaUrl.match(/\.(mp4|webm|mov|ogg|m4v)($|\?)/i) != null;
  }, [deckBScene?.mediaUrl, deckBScene?.mediaType]);

  const isCurrentVideo = useMemo(() => {
    if (!activeScene?.mediaUrl) return false;
    return activeScene.mediaType === 'video' || activeScene.mediaUrl.match(/\.(mp4|webm|mov|ogg|m4v)($|\?)/i) != null;
  }, [activeScene?.mediaUrl, activeScene?.mediaType]);

  const deckASrc = useMemo(() => {
    return deckAScene?.mediaUrl ? sanitizeMediaUrl(deckAScene.mediaUrl) : '';
  }, [deckAScene?.mediaUrl]);

  const deckBSrc = useMemo(() => {
    return deckBScene?.mediaUrl ? sanitizeMediaUrl(deckBScene.mediaUrl) : '';
  }, [deckBScene?.mediaUrl]);

  // Target time within active scene
  const targetSourceTime = useMemo(() => {
    if (!activeScene) return 0;
    const sourceStart = activeScene.sourceStart ?? 0;
    const speed = activeScene.speed ?? activeScene.playbackRate ?? 1;
    return sourceStart + compositionState.sceneLocalTime * speed;
  }, [activeScene, compositionState.sceneLocalTime]);

  // Target time for next pre-buffered standby scene
  const nextSceneTargetTime = useMemo(() => {
    if (!nextScene) return 0;
    const sourceStart = nextScene.sourceStart ?? 0;
    const speed = nextScene.speed ?? nextScene.playbackRate ?? 1;
    if (isTransitioning) {
      const transLocalTime = Math.max(0, compositionState.sceneLocalTime - ((activeScene?.duration || 4) - (activeScene?.transitionDuration || 0.8)));
      return sourceStart + transLocalTime * speed;
    }
    return sourceStart;
  }, [nextScene, activeScene, isTransitioning, compositionState.sceneLocalTime]);

  const targetTimeA = isEvenScene ? targetSourceTime : nextSceneTargetTime;
  const targetTimeB = !isEvenScene ? targetSourceTime : nextSceneTargetTime;

  // Deck A / Deck B Opacities for cross-dissolves and zero-lag cuts
  let opacityA = 0;
  let opacityB = 0;

  if (isEvenScene) {
    if (isTransitioning && nextScene) {
      opacityA = Math.max(0, 1 - transitionProgress);
      opacityB = transitionProgress;
    } else {
      opacityA = 1;
      opacityB = 0;
    }
  } else {
    if (isTransitioning && nextScene) {
      opacityB = Math.max(0, 1 - transitionProgress);
      opacityA = transitionProgress;
    } else {
      opacityB = 1;
      opacityA = 0;
    }
  }

  // Deck A Sync & Preloading Loop (Ultra-smooth rate-guided hardware sync)
  useEffect(() => {
    const vidA = deckAVideoRef.current;
    if (!vidA || !isDeckAVideo || !deckASrc) return;

    const baseSpeed = (playbackSpeed || 1) * (deckAScene?.speed || 1);
    vidA.playbackRate = baseSpeed;

    if (isEvenScene) {
      vidA.muted = isMuted;
      if (isPlaying) {
        if (vidA.paused && !vidA.ended) {
          vidA.play().catch(() => {});
        }
        const drift = vidA.currentTime - targetTimeA;
        const absDrift = Math.abs(drift);
        if (absDrift > 0.75 && !vidA.seeking) {
          // Large scrub or boundary jump: hard seek
          vidA.currentTime = targetTimeA;
        } else if (absDrift > 0.08 && !vidA.seeking) {
          // Micro rate pitch adjustment for ultra-smooth optical synchronization without seeking
          vidA.playbackRate = baseSpeed * (drift < 0 ? 1.04 : 0.96);
        }
      } else {
        if (!vidA.paused) vidA.pause();
        const drift = Math.abs(vidA.currentTime - targetTimeA);
        if (drift > 0.04 && !vidA.seeking) {
          vidA.currentTime = targetTimeA;
        }
      }
    } else {
      // Standby Deck A (Preloading / Transitioning)
      vidA.muted = true;
      if (isTransitioning && isPlaying) {
        if (vidA.paused && !vidA.ended) {
          vidA.play().catch(() => {});
        }
        const drift = vidA.currentTime - targetTimeA;
        const absDrift = Math.abs(drift);
        if (absDrift > 0.75 && !vidA.seeking) {
          vidA.currentTime = targetTimeA;
        } else if (absDrift > 0.08 && !vidA.seeking) {
          vidA.playbackRate = baseSpeed * (drift < 0 ? 1.04 : 0.96);
        }
      } else {
        if (!vidA.paused) vidA.pause();
        if (Math.abs(vidA.currentTime - targetTimeA) > 0.04 && !vidA.seeking) {
          vidA.currentTime = targetTimeA;
        }
      }
    }
  }, [currentTime, isPlaying, isDeckAVideo, deckASrc, isEvenScene, targetTimeA, isMuted, playbackSpeed, isTransitioning, deckAScene?.speed]);

  // Deck B Sync & Preloading Loop (Ultra-smooth rate-guided hardware sync)
  useEffect(() => {
    const vidB = deckBVideoRef.current;
    if (!vidB || !isDeckBVideo || !deckBSrc) return;

    const baseSpeed = (playbackSpeed || 1) * (deckBScene?.speed || 1);
    vidB.playbackRate = baseSpeed;

    if (!isEvenScene) {
      vidB.muted = isMuted;
      if (isPlaying) {
        if (vidB.paused && !vidB.ended) {
          vidB.play().catch(() => {});
        }
        const drift = vidB.currentTime - targetTimeB;
        const absDrift = Math.abs(drift);
        if (absDrift > 0.75 && !vidB.seeking) {
          vidB.currentTime = targetTimeB;
        } else if (absDrift > 0.08 && !vidB.seeking) {
          vidB.playbackRate = baseSpeed * (drift < 0 ? 1.04 : 0.96);
        }
      } else {
        if (!vidB.paused) vidB.pause();
        const drift = Math.abs(vidB.currentTime - targetTimeB);
        if (drift > 0.04 && !vidB.seeking) {
          vidB.currentTime = targetTimeB;
        }
      }
    } else {
      // Standby Deck B (Preloading / Transitioning)
      vidB.muted = true;
      if (isTransitioning && isPlaying) {
        if (vidB.paused && !vidB.ended) {
          vidB.play().catch(() => {});
        }
        const drift = vidB.currentTime - targetTimeB;
        const absDrift = Math.abs(drift);
        if (absDrift > 0.75 && !vidB.seeking) {
          vidB.currentTime = targetTimeB;
        } else if (absDrift > 0.08 && !vidB.seeking) {
          vidB.playbackRate = baseSpeed * (drift < 0 ? 1.04 : 0.96);
        }
      } else {
        if (!vidB.paused) vidB.pause();
        if (Math.abs(vidB.currentTime - targetTimeB) > 0.04 && !vidB.seeking) {
          vidB.currentTime = targetTimeB;
        }
      }
    }
  }, [currentTime, isPlaying, isDeckBVideo, deckBSrc, isEvenScene, targetTimeB, isMuted, playbackSpeed, isTransitioning, deckBScene?.speed]);

  // Silent Video Error Auto-Recovery Ladder (Masks errors from user and progressively falls back)
  const handleSilentVideoError = async (target: HTMLVideoElement, rawUrl: string, deckKey: 'A' | 'B') => {
    const retryRef = deckKey === 'A' ? deckARetryCountRef : deckBRetryCountRef;
    const currentRetry = retryRef.current;
    retryRef.current = currentRetry + 1;

    const scene = deckKey === 'A' ? deckAScene : deckBScene;
    const errorCode = target.error?.code;
    const errorMessage = target.error?.message || 'MEDIA_ERR_SRC_NOT_SUPPORTED';

    mediaErrorLogger.logVideoDecodeError(
      `Silent auto-recovery [Attempt #${currentRetry + 1}]: ${errorMessage} (code ${errorCode || 4}) - Retrying with ${currentRetry === 0 ? 'Pre-warmed cache / Proxy' : currentRetry === 1 ? 'MSE chunk buffer' : 'Direct blob buffer'}`,
      target.src || rawUrl,
      {
        title: scene?.title,
        index: deckKey === 'A' ? (isEvenScene ? activeSceneIndex : activeSceneIndex + 1) : (!isEvenScene ? activeSceneIndex : activeSceneIndex + 1),
      }
    );

    if (currentRetry === 0) {
      const preWarmed = mediaPreWarm.getPreWarmedItem(rawUrl);
      if (preWarmed?.blobUrl) {
        target.src = preWarmed.blobUrl;
        target.load();
        return;
      }
      if (rawUrl.startsWith('http') && !target.src.includes('/api/proxy/media')) {
        const proxyUrl = `/api/proxy/media?url=${encodeURIComponent(rawUrl)}`;
        target.src = proxyUrl;
        target.load();
        return;
      }
    }

    if (currentRetry === 1 && mseBufferManager.isMseSupported()) {
      try {
        const streamUrl = rawUrl.startsWith('http') ? `/api/proxy/media?url=${encodeURIComponent(rawUrl)}` : rawUrl;
        const mseSession = await mseBufferManager.createMseStream(streamUrl);
        activeMseSessionRef.current = mseSession;
        target.src = mseSession.objectUrl;
        target.load();
        return;
      } catch (err) {
        console.warn('[LivePreviewCanvas] MSE fallback attempt error:', err);
      }
    }

    if (currentRetry <= 2) {
      try {
        const fetchUrl = rawUrl.startsWith('http') ? `/api/proxy/media?url=${encodeURIComponent(rawUrl)}` : rawUrl;
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const blob = new Blob([buffer], { type: 'video/mp4' });
          const blobUrl = URL.createObjectURL(blob);
          target.src = blobUrl;
          target.load();
          return;
        }
      } catch {}
    }
  };

  // Pre-cache images
  useEffect(() => {
    scenes.forEach((scene) => {
      if (scene.mediaUrl && !scene.mediaType?.includes('video')) {
        if (!imageCacheRef.current.has(scene.mediaUrl)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = scene.mediaUrl;
          img.onload = () => imageCacheRef.current.set(scene.mediaUrl, img);
          img.onerror = () => {
            const fallback = new Image();
            fallback.src = scene.mediaUrl;
            fallback.onload = () => imageCacheRef.current.set(scene.mediaUrl, fallback);
            imageCacheRef.current.set(scene.mediaUrl, fallback);
          };
          imageCacheRef.current.set(scene.mediaUrl, img);
        }
      }
      if (scene.watermark?.url && !imageCacheRef.current.has(scene.watermark.url)) {
        const wm = new Image();
        wm.crossOrigin = 'anonymous';
        wm.src = scene.watermark.url;
        wm.onload = () => imageCacheRef.current.set(scene.watermark!.url, wm);
        imageCacheRef.current.set(scene.watermark.url, wm);
      }
    });

    if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl && !imageCacheRef.current.has(brandOverlayConfig.logoUrl)) {
      const bImg = new Image();
      bImg.crossOrigin = 'anonymous';
      bImg.src = brandOverlayConfig.logoUrl;
      bImg.onload = () => imageCacheRef.current.set(brandOverlayConfig.logoUrl, bImg);
      imageCacheRef.current.set(brandOverlayConfig.logoUrl, bImg);
    }
  }, [scenes, brandOverlayConfig]);

  // Canvas Vector & Typography Compositor (Runs at 60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track FPS & Telemetry
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFrameTimeRef.current >= 1000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current));
      setFps(prev => (prev === calculatedFps ? prev : calculatedFps));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Measure buffer ahead for rendering performance telemetry
    const activeVid = isEvenScene ? deckAVideoRef.current : deckBVideoRef.current;
    let bufferAheadSec = 0;
    if (activeVid && activeVid.buffered && activeVid.buffered.length > 0) {
      try {
        const end = activeVid.buffered.end(activeVid.buffered.length - 1);
        bufferAheadSec = Math.max(0, end - activeVid.currentTime);
      } catch {}
    }
    renderPerformanceMonitor.recordFrameRenderTick(bufferAheadSec);

    const { width, height } = canvasDimensions;

    // Clear overlay canvas
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (!activeScene) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }

    // 1. If active scene is an Image (or video is decoding fallback), render image with motion
    if (!isCurrentVideo && activeScene.mediaUrl) {
      const cachedImg = imageCacheRef.current.get(activeScene.mediaUrl);
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        ctx.save();
        
        // CSS Filter
        if (activeScene.filter === 'cinematic') ctx.filter = 'contrast(1.25) saturate(1.2)';
        else if (activeScene.filter === 'warm') ctx.filter = 'sepia(0.35) saturate(1.3)';
        else if (activeScene.filter === 'cool') ctx.filter = 'hue-rotate(185deg) saturate(1.15)';
        else if (activeScene.filter === 'vintage') ctx.filter = 'sepia(0.6) contrast(0.9)';
        else if (activeScene.filter === 'vibrant') ctx.filter = 'saturate(1.6) contrast(1.15)';

        // Camera Motion
        const progress = compositionState.sceneProgress;
        ctx.translate(width / 2, height / 2);
        if (activeScene.motion === 'zoom_in') {
          const s = 1.0 + progress * 0.12;
          ctx.scale(s, s);
        } else if (activeScene.motion === 'zoom_out') {
          const s = 1.12 - progress * 0.12;
          ctx.scale(s, s);
        } else if (activeScene.motion === 'pan_right') {
          ctx.translate(progress * 24, 0);
          ctx.scale(1.06, 1.06);
        } else if (activeScene.motion === 'pan_left') {
          ctx.translate(-progress * 24, 0);
          ctx.scale(1.06, 1.06);
        }
        ctx.translate(-width / 2, -height / 2);

        const imgRatio = cachedImg.naturalWidth / cachedImg.naturalHeight;
        const targetRatio = width / height;
        let dw = width, dh = height, dx = 0, dy = 0;
        if (imgRatio > targetRatio) {
          dw = height * imgRatio;
          dx = (width - dw) / 2;
        } else {
          dh = width / imgRatio;
          dy = (height - dh) / 2;
        }
        ctx.drawImage(cachedImg, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    // 2. Draw Brand Watermark Logos
    const drawWatermark = (wmUrl: string, position: string, opacity: number, scale: number) => {
      const wmImg = imageCacheRef.current.get(wmUrl);
      if (wmImg && wmImg.complete && wmImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = opacity;
        const targetW = width * scale;
        const targetH = (targetW / wmImg.naturalWidth) * wmImg.naturalHeight;
        const pad = 16;
        let posX = pad;
        let posY = pad;

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
        ctx.drawImage(wmImg, posX, posY, targetW, targetH);
        ctx.restore();
      }
    };

    if (activeScene.watermark?.url) {
      drawWatermark(
        activeScene.watermark.url,
        activeScene.watermark.position || 'top-right',
        activeScene.watermark.opacity ?? 0.85,
        activeScene.watermark.scale ?? 0.2
      );
    }

    if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl) {
      drawWatermark(
        brandOverlayConfig.logoUrl,
        brandOverlayConfig.position || 'top-right',
        (brandOverlayConfig.opacityPercent || 85) / 100,
        (brandOverlayConfig.scalePercent || 20) / 100
      );
    }

    // 3. Draw Scrolling Breaking News Ticker
    const activeTicker: TickerConfig | undefined = activeScene.tickerConfig;
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
      const badgeText = activeTicker.badgeText || 'BREAKING';
      ctx.font = `bold ${Math.round(tickerH * 0.44)}px "Plus Jakarta Sans", sans-serif`;
      const badgeWidth = ctx.measureText(badgeText).width + 24;

      ctx.fillStyle = activeTicker.style === 'gold_luxury' ? '#18181b' : '#f87171';
      ctx.fillRect(0, tickerY, badgeWidth, tickerH);

      ctx.fillStyle = activeTicker.style === 'gold_luxury' ? '#fef08a' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeWidth / 2, tickerY + tickerH * 0.65);

      // Scrolling text
      const tickerTextCombined = `${activeTicker.textNepali ? activeTicker.textNepali + '  •  ' : ''}${activeTicker.text || ''}  •  `;
      ctx.font = `600 ${Math.round(tickerH * 0.44)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';

      const speedFactor = activeTicker.speed === 'fast' ? 140 : activeTicker.speed === 'slow' ? 55 : 95;
      const textX = width - ((currentTime * speedFactor) % (width + 800));

      ctx.save();
      ctx.beginPath();
      ctx.rect(badgeWidth + 8, tickerY, width - badgeWidth - 16, tickerH);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(tickerTextCombined, textX, tickerY + tickerH * 0.65);
      ctx.restore();

      ctx.restore();
    }

    // 4. Draw Animated Kinetic Typography & Captions
    let textToDraw = activeScene.kineticConfig?.primaryText || activeScene.textOverlay;
    if (activeScene.textNepali || activeScene.kineticConfig?.secondaryTextNepali) {
      const nep = activeScene.kineticConfig?.secondaryTextNepali || activeScene.textNepali;
      textToDraw = (nep ? `${nep}  ` : '') + (textToDraw ? `(${textToDraw})` : '');
    }

    if (textToDraw) {
      ctx.save();
      const textAnim = activeScene.kineticConfig?.preset || activeScene.textAnimation || 'fade_in';
      const textStyle = activeScene.textStyle || 'lower_third';
      const sceneProgress = compositionState.sceneProgress;

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

      const baseFontSize = activeScene.kineticConfig?.fontSize || Math.max(14, Math.round(height * 0.05));
      ctx.font = `800 ${baseFontSize}px "Plus Jakarta Sans", "Mukta", sans-serif`;
      ctx.textAlign = 'center';

      let textY = height - 58;
      if (activeScene.textPosition === 'top') textY = 48;
      else if (activeScene.textPosition === 'center') textY = height / 2;
      else if (activeScene.textPosition === 'lower_third') textY = height - 62;

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
      const boxPadX = 18;
      const boxPadY = 8;
      const boxX = (width - textWidth) / 2 - boxPadX;
      const boxY = textY - baseFontSize + 4 - boxPadY;
      const boxW = textWidth + boxPadX * 2;
      const boxH = baseFontSize + boxPadY * 2;

      if (textStyle === 'neon_glow' || textAnim === 'kinetic_neon_pulse') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.shadowColor = activeScene.kineticConfig?.glowColor || '#06b6d4';
        ctx.shadowBlur = 18 + Math.sin(currentTime * 8) * 6;
      } else if (textStyle === 'gold_gradient') {
        ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.roundRect?.(boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      if (textStyle === 'gold_gradient' || textStyle === 'neon_glow') {
        ctx.stroke();
      }

      ctx.fillStyle = activeScene.textColor || (textStyle === 'gold_gradient' ? '#fef08a' : '#ffffff');
      ctx.fillText(textToDraw, width / 2, textY);
      ctx.restore();
    }

    // 5. Draw Timed Subtitles (Devanagari / English)
    if (subtitles && subtitles.length > 0 && (subtitleBurnOptions?.burnIn ?? true)) {
      const activeSub = subtitles.find(
        (s) => currentTime >= s.startTimeSec && currentTime <= s.endTimeSec
      );
      if (activeSub && (activeSub.text || activeSub.devanagariText)) {
        ctx.save();
        const subFontSize = subtitleBurnOptions?.fontSize === 'large' ? 18 : subtitleBurnOptions?.fontSize === 'small' ? 12 : 15;
        const subColor = subtitleBurnOptions?.textColor || '#ffffff';
        const subBg = subtitleBurnOptions?.backgroundColor || 'rgba(0, 0, 0, 0.78)';

        ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", "Mukta", sans-serif`;
        ctx.textAlign = 'center';

        const hasBilingual = subtitleBurnOptions?.bilingualDevanagari && activeSub.devanagariText && activeSub.text && activeSub.devanagariText !== activeSub.text;
        const mainLine = hasBilingual ? activeSub.devanagariText : (activeSub.text || activeSub.devanagariText);
        const secondLine = hasBilingual ? activeSub.text : null;

        const subMetrics = ctx.measureText(mainLine);
        const subBoxPad = 12;
        const subBoxW = Math.min(width - 24, Math.max(160, subMetrics.width + subBoxPad * 2));
        const subBoxH = secondLine ? subFontSize * 2.6 + 12 : subFontSize + 14;

        let subY = height - subBoxH - 18;
        if (subtitleBurnOptions?.position === 'top') {
          subY = 24;
        } else if (subtitleBurnOptions?.position === 'center') {
          subY = (height - subBoxH) / 2;
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

    // 6. Live VFX & Film Grain
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

      if (vfxConfig.frameType === 'letterbox_cinematic' || vfxConfig.frameType === 'letterbox') {
        ctx.save();
        ctx.fillStyle = '#000000';
        const barH = Math.round(height * 0.12);
        ctx.fillRect(0, 0, width, barH);
        ctx.fillRect(0, height - barH, width, barH);
        ctx.restore();
      }
    }

    // 7. Safe Area Guide Overlays
    if (safeAreaMode && safeAreaMode !== 'none') {
      ctx.save();
      if (safeAreaMode === 'action_title') {
        const actPadX = width * 0.05;
        const actPadY = height * 0.05;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(actPadX, actPadY, width - actPadX * 2, height - actPadY * 2);

        const titlePadX = width * 0.1;
        const titlePadY = height * 0.1;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(titlePadX, titlePadY, width - titlePadX * 2, height - titlePadY * 2);

        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#06b6d4';
        ctx.textAlign = 'left';
        ctx.fillText('90% ACTION SAFE', actPadX + 6, actPadY + 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('80% TITLE SAFE', titlePadX + 6, titlePadY + 14);
      } else if (safeAreaMode === 'social_9_16') {
        const topMargin = height * 0.14;
        const bottomMargin = height * 0.22;
        const rightMargin = width * 0.18;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, width, topMargin);
        ctx.fillRect(0, height - bottomMargin, width, bottomMargin);
        ctx.fillRect(width - rightMargin, topMargin, rightMargin, height - topMargin - bottomMargin);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(width * 0.04, topMargin, width - rightMargin - width * 0.04, height - topMargin - bottomMargin);

        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText('REELS / SHORTS SAFE CORE', (width - rightMargin) / 2, height / 2);
      } else if (safeAreaMode === 'grid_3x3') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(width / 3, 0); ctx.lineTo(width / 3, height);
        ctx.moveTo((width * 2) / 3, 0); ctx.lineTo((width * 2) / 3, height);
        ctx.moveTo(0, height / 3); ctx.lineTo(width, height / 3);
        ctx.moveTo(0, (height * 2) / 3); ctx.lineTo(width, (height * 2) / 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }, [currentTime, activeScene, canvasDimensions, isCurrentVideo, brandOverlayConfig, subtitles, subtitleBurnOptions, vfxConfig, safeAreaMode, isTransitioning, transitionProgress, compositionState]);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  // Compute CSS filter style for active video
  const activeVideoFilter = useMemo(() => {
    switch (activeScene?.filter) {
      case 'cinematic':
        return 'contrast(1.25) saturate(1.2) brightness(0.96)';
      case 'warm':
        return 'sepia(0.35) saturate(1.3) hue-rotate(-15deg)';
      case 'cool':
        return 'hue-rotate(185deg) saturate(1.15) contrast(1.1)';
      case 'vintage':
        return 'sepia(0.6) contrast(0.9) brightness(0.95)';
      case 'vibrant':
        return 'saturate(1.6) contrast(1.15)';
      default:
        return 'none';
    }
  }, [activeScene?.filter]);

  return (
    <div className={`relative flex flex-col items-center justify-center w-full h-full overflow-hidden select-none ${className}`}>
      {/* Viewport Stage */}
      <div 
        className="relative flex items-center justify-center w-full h-full select-none overflow-hidden"
        onClick={onTogglePlay}
      >
        {/* Aspect Ratio Box Wrapper */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
        >
          {/* 0. Instant Poster/Frame Background (Zero Black Screen, Zero Decode Delay) */}
          {activeScene?.mediaUrl && (
            <img
              src={sanitizeMediaUrl(
                activeScene.thumbnailUrl ||
                (activeScene.mediaType === 'image'
                  ? activeScene.mediaUrl
                  : activeScene.mediaUrl.replace(/\.mp4$/, '_thumb.jpg'))
              )}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ filter: activeVideoFilter }}
              onError={(e: any) => {
                // If thumbnail fails, gracefully fallback to direct mediaUrl if image
                if (activeScene.mediaUrl && !activeScene.mediaUrl.endsWith('.mp4') && e.currentTarget.src !== activeScene.mediaUrl) {
                  e.currentTarget.src = sanitizeMediaUrl(activeScene.mediaUrl);
                }
              }}
            />
          )}

          {/* 1. Double-Buffered Hardware Video Element Deck A */}
          {deckASrc && isDeckAVideo && (
            <video
              ref={deckAVideoRef}
              src={deckASrc}
              playsInline
              muted={!isEvenScene || isMuted}
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 z-[2]"
              style={{
                filter: activeVideoFilter,
                opacity: opacityA,
                pointerEvents: isEvenScene ? 'auto' : 'none',
              }}
              onWaiting={() => {
                if (isEvenScene) setIsBuffering(true);
              }}
              onPlaying={() => {
                if (isEvenScene) {
                  setIsBuffering(false);
                  setVideoLoadError(null);
                }
              }}
              onLoadedData={() => {
                if (isEvenScene) {
                  setIsBuffering(false);
                  setVideoLoadError(null);
                  if (activeScene?.id) {
                    renderPerformanceMonitor.recordFirstFrameDecoded(activeScene.id);
                  }
                }
              }}
              onCanPlay={() => {
                if (isEvenScene && activeScene?.id) {
                  renderPerformanceMonitor.recordFirstFrameDecoded(activeScene.id);
                }
              }}
              onError={(e: any) => {
                const target = e.target as HTMLVideoElement;
                const rawUrl = deckAScene?.mediaUrl || '';
                handleSilentVideoError(target, rawUrl, 'A');
              }}
            />
          )}

          {/* 2. Double-Buffered Hardware Video Element Deck B */}
          {deckBSrc && isDeckBVideo && (
            <video
              ref={deckBVideoRef}
              src={deckBSrc}
              playsInline
              muted={isEvenScene || isMuted}
              preload="auto"
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150 z-[2]"
              style={{
                filter: activeVideoFilter,
                opacity: opacityB,
                pointerEvents: !isEvenScene ? 'auto' : 'none',
              }}
              onWaiting={() => {
                if (!isEvenScene) setIsBuffering(true);
              }}
              onPlaying={() => {
                if (!isEvenScene) {
                  setIsBuffering(false);
                  setVideoLoadError(null);
                }
              }}
              onLoadedData={() => {
                if (!isEvenScene) {
                  setIsBuffering(false);
                  setVideoLoadError(null);
                  if (activeScene?.id) {
                    renderPerformanceMonitor.recordFirstFrameDecoded(activeScene.id);
                  }
                }
              }}
              onCanPlay={() => {
                if (!isEvenScene && activeScene?.id) {
                  renderPerformanceMonitor.recordFirstFrameDecoded(activeScene.id);
                }
              }}
              onError={(e: any) => {
                const target = e.target as HTMLVideoElement;
                const rawUrl = deckBScene?.mediaUrl || '';
                handleSilentVideoError(target, rawUrl, 'B');
              }}
            />
          )}

          {/* 3. Real-Time Vector & Typography Overlay Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          />

          {/* 6. Live HUD Overlay */}
          {showHud && (
            <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none text-[11px] font-mono select-none z-30">
              {/* Left Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm text-slate-200 border border-slate-700/70 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="font-bold text-cyan-400">CLIP #{activeSceneIndex + 1}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-200 font-medium max-w-[130px] truncate">{activeScene?.title || 'Scene'}</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-semibold">{fps} FPS</span>
                {metrics.ttffMs > 0 && (
                  <>
                    <span className="text-slate-500">|</span>
                    <span className="text-cyan-300 font-mono text-[10px]">TTFF: {metrics.ttffMs}ms</span>
                  </>
                )}
              </div>

              {/* Right Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-sm text-slate-200 border border-slate-700/70 shadow-lg">
                <span className="text-cyan-400 font-bold">{formatTimecode(currentTime)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-semibold">{aspectRatio}</span>
                {isMuted ? (
                  <VolumeX className="w-3 h-3 text-rose-400 ml-0.5" />
                ) : (
                  <Volume2 className="w-3 h-3 text-emerald-400 ml-0.5" />
                )}
                {playbackSpeed !== 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-300 border border-purple-500/50 text-[10px] font-bold">
                    {playbackSpeed}x
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 7. Floating Play Trigger Button when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer group bg-black/20 hover:bg-black/30 transition z-20">
              <div className="w-12 h-12 rounded-full bg-cyan-500/95 group-hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 group-hover:scale-110 transition duration-150 pl-0.5">
                <Play className="w-5 h-5 fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Diagnostics Overlay (collapsible without taking canvas layout height) */}
      {showDiagnostics && (
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/95 border-t border-cyan-500/40 p-3 text-[10px] font-mono text-cyan-300 space-y-1 z-40 backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between font-bold text-white border-b border-cyan-500/30 pb-1 mb-1">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Activity className="w-3 h-3 animate-spin" />
              HARDWARE DECODING & COMPOSITOR DIAGNOSTICS
            </span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">{fps} FPS • 60Hz V-Sync</span>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-300 pt-1">
            <div>
              <span className="text-slate-500">TIMECODE: </span>
              <span className="text-cyan-400 font-bold">{currentTime.toFixed(3)}s</span>
            </div>
            <div>
              <span className="text-slate-500">ACTIVE CLIP: </span>
              <span className="text-amber-300 font-bold">#{activeSceneIndex + 1} ({activeScene?.mediaType || 'video'})</span>
            </div>
            <div>
              <span className="text-slate-500">TTFF / JITTER: </span>
              <span className="text-emerald-400 font-bold">
                {metrics.ttffMs}ms (±{metrics.decodingJitterMs}ms)
              </span>
            </div>
            <div>
              <span className="text-slate-500">BUFFER AHEAD: </span>
              <span className="text-cyan-300 font-bold">{metrics.bufferAheadSeconds.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-slate-500">SOURCE TIME: </span>
              <span className="text-emerald-400 font-bold">{targetSourceTime.toFixed(3)}s</span>
            </div>
            <div>
              <span className="text-slate-500">DROPPED FRAMES: </span>
              <span className={`font-bold ${metrics.droppedFramesCount === 0 ? 'text-slate-300' : 'text-amber-400'}`}>
                {metrics.droppedFramesCount}
              </span>
            </div>
            <div>
              <span className="text-slate-500">PIPELINE: </span>
              <span className="text-purple-300 font-bold uppercase">{metrics.activeDecoderPipeline.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-500">TRANSITION: </span>
              <span className={isTransitioning ? 'text-purple-400 font-bold' : 'text-slate-500'}>
                {isTransitioning ? `${activeScene?.transition || 'fade'} (${Math.round(transitionProgress * 100)}%)` : 'Direct Cut'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
