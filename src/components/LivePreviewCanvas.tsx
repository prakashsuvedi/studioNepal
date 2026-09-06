import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Scene, SceneWatermark, BrandOverlayConfig, TickerConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { Play, Pause, Maximize, RefreshCw, Layers, Sparkles, Activity } from 'lucide-react';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const videoCacheRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [fps, setFps] = useState<number>(60);
  const [showHud, setShowHud] = useState<boolean>(true);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Canvas internal proxy resolutions (low-res proxy for instant 60fps rendering)
  const canvasDimensions = useMemo(() => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 360, height: 640 };
      case '1:1':
        return { width: 480, height: 480 };
      case '16:9':
      default:
        return { width: 640, height: 360 };
    }
  }, [aspectRatio]);

  // Pre-load images & videos in background
  useEffect(() => {
    scenes.forEach((scene) => {
      if (scene.mediaUrl) {
        const isVideo = scene.mediaType === 'video' || scene.mediaUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
        if (isVideo) {
          if (!videoCacheRef.current.has(scene.mediaUrl)) {
            const vid = document.createElement('video');
            vid.crossOrigin = 'anonymous';
            vid.src = scene.mediaUrl;
            vid.muted = true;
            vid.playsInline = true;
            vid.preload = 'auto';
            videoCacheRef.current.set(scene.mediaUrl, vid);
          }
        } else {
          if (!imageCacheRef.current.has(scene.mediaUrl)) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = scene.mediaUrl;
            img.onload = () => {
              imageCacheRef.current.set(scene.mediaUrl, img);
            };
          }
        }
      }

      if (scene.watermark?.url && !imageCacheRef.current.has(scene.watermark.url)) {
        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.src = scene.watermark.url;
        wmImg.onload = () => {
          imageCacheRef.current.set(scene.watermark!.url, wmImg);
        };
      }
    });

    if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl && !imageCacheRef.current.has(brandOverlayConfig.logoUrl)) {
      const bImg = new Image();
      bImg.crossOrigin = 'anonymous';
      bImg.src = brandOverlayConfig.logoUrl;
      bImg.onload = () => {
        imageCacheRef.current.set(brandOverlayConfig.logoUrl, bImg);
      };
    }
  }, [scenes, brandOverlayConfig]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track FPS
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastFrameTimeRef.current >= 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current)));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    const { width, height } = canvasDimensions;

    // Calculate current scene
    let accumulatedTime = 0;
    let activeSceneIndex = 0;
    let sceneStartTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + scenes[i].duration) {
        activeSceneIndex = i;
        sceneStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += scenes[i].duration;
    }

    if (currentTime >= accumulatedTime && scenes.length > 0) {
      activeSceneIndex = scenes.length - 1;
      sceneStartTime = accumulatedTime - scenes[activeSceneIndex].duration;
    }

    const currentScene = scenes[activeSceneIndex];
    if (!currentScene) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const sceneElapsed = Math.max(0, currentTime - sceneStartTime);
    const sceneDuration = currentScene.duration || 4;
    const sceneProgress = Math.min(1, sceneElapsed / sceneDuration);

    // Check transition to next scene (last 0.8s of current scene)
    const transitionDuration = currentScene.transitionDuration || 0.8;
    const isTransitioning = 
      currentScene.transition !== 'cut' &&
      sceneDuration - sceneElapsed <= transitionDuration &&
      activeSceneIndex < scenes.length - 1;

    const transitionProgress = isTransitioning 
      ? (sceneElapsed - (sceneDuration - transitionDuration)) / transitionDuration
      : 0;

    const nextScene = isTransitioning ? scenes[activeSceneIndex + 1] : null;

    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Apply color filter function
    const getCssFilter = (filterName: string) => {
      switch (filterName) {
        case 'cinematic':
          return 'contrast(1.25) saturate(1.2) brightness(0.95)';
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
    };

    // Camera Motion transform helper
    const applyMotionTransform = (
      context: CanvasRenderingContext2D,
      motion: string,
      progress: number
    ) => {
      context.translate(width / 2, height / 2);
      switch (motion) {
        case 'zoom_in': {
          const s = 1.0 + progress * 0.15;
          context.scale(s, s);
          break;
        }
        case 'zoom_out': {
          const s = 1.15 - progress * 0.15;
          context.scale(s, s);
          break;
        }
        case 'pan_left': {
          const dx = progress * 30;
          context.translate(-dx, 0);
          context.scale(1.08, 1.08);
          break;
        }
        case 'pan_right': {
          const dx = progress * 30;
          context.translate(dx, 0);
          context.scale(1.08, 1.08);
          break;
        }
        case 'dolly': {
          const s = 1.0 + Math.sin(progress * Math.PI) * 0.1;
          context.scale(s, s);
          break;
        }
        case 'orbit': {
          const rot = (progress - 0.5) * 0.04;
          context.rotate(rot);
          context.scale(1.06, 1.06);
          break;
        }
        default:
          break;
      }
      context.translate(-width / 2, -height / 2);
    };

    // Draw scene frame (both images & video tags)
    const drawSceneFrame = (scene: Scene, progress: number, alpha: number = 1.0, elapsedSec: number = 0) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = getCssFilter(scene.filter);

      applyMotionTransform(ctx, scene.motion, progress);

      const isVideo = scene.mediaType === 'video' || scene.mediaUrl?.match(/\.(mp4|webm|mov|ogg)($|\?)/i);

      if (isVideo) {
        const vidElem = videoCacheRef.current.get(scene.mediaUrl);
        if (vidElem) {
          if (isPlaying && vidElem.paused) {
            vidElem.play().catch(() => {});
          } else if (!isPlaying && !vidElem.paused) {
            vidElem.pause();
          }
          if (Math.abs(vidElem.currentTime - (elapsedSec % (vidElem.duration || scene.duration))) > 0.3) {
            vidElem.currentTime = elapsedSec % (vidElem.duration || scene.duration);
          }

          if (vidElem.readyState >= 2) {
            const imgRatio = vidElem.videoWidth / vidElem.videoHeight;
            const targetRatio = width / height;
            let dw = width, dh = height, dx = 0, dy = 0;
            if (imgRatio > targetRatio) {
              dw = height * imgRatio;
              dx = (width - dw) / 2;
            } else {
              dh = width / imgRatio;
              dy = (height - dh) / 2;
            }
            ctx.drawImage(vidElem, dx, dy, dw, dh);
          }
        }
      } else {
        const cachedImg = imageCacheRef.current.get(scene.mediaUrl);
        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
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
        } else {
          // Fallback procedural visual gradient
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#4338ca');
          grad.addColorStop(1, '#312e81');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Scene: ${scene.title}`, width / 2, height / 2);
        }
      }

      ctx.restore();
    };

    // 1. Draw base scene frame
    drawSceneFrame(currentScene, sceneProgress, 1.0, sceneElapsed);

    // 2. Draw Transition to next scene if active
    if (isTransitioning && nextScene) {
      if (currentScene.transition === 'dissolve' || currentScene.transition === 'fade') {
        drawSceneFrame(nextScene, 0.05, transitionProgress, 0);
      } else if (currentScene.transition === 'fade_to_black') {
        if (transitionProgress < 0.5) {
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = transitionProgress * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else {
          drawSceneFrame(nextScene, 0.05, 1.0, 0);
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = (1 - transitionProgress) * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      } else if (currentScene.transition === 'flash_white') {
        if (transitionProgress < 0.5) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = transitionProgress * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        } else {
          drawSceneFrame(nextScene, 0.05, 1.0, 0);
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = (1 - transitionProgress) * 2;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      } else if (currentScene.transition === 'slide_left') {
        ctx.save();
        const offsetX = width * (1 - transitionProgress);
        ctx.translate(offsetX, 0);
        drawSceneFrame(nextScene, 0.05, 1.0, 0);
        ctx.restore();
      } else if (currentScene.transition === 'slide_right') {
        ctx.save();
        const offsetX = -width * (1 - transitionProgress);
        ctx.translate(offsetX, 0);
        drawSceneFrame(nextScene, 0.05, 1.0, 0);
        ctx.restore();
      } else if (currentScene.transition === 'blur_dissolve') {
        ctx.save();
        drawSceneFrame(nextScene, 0.05, transitionProgress, 0);
        ctx.restore();
      } else if (currentScene.transition === 'wipe_left') {
        ctx.save();
        const wipeX = width * (1 - transitionProgress);
        ctx.beginPath();
        ctx.rect(wipeX, 0, width - wipeX, height);
        ctx.clip();
        drawSceneFrame(nextScene, 0.05, 1.0, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wipeX, 0);
        ctx.lineTo(wipeX, height);
        ctx.stroke();
        ctx.restore();
      } else if (currentScene.transition === 'wipe_right') {
        ctx.save();
        const wipeX = width * transitionProgress;
        ctx.beginPath();
        ctx.rect(0, 0, wipeX, height);
        ctx.clip();
        drawSceneFrame(nextScene, 0.05, 1.0, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wipeX, 0);
        ctx.lineTo(wipeX, height);
        ctx.stroke();
        ctx.restore();
      } else if (currentScene.transition === 'zoom_in' || currentScene.transition === 'zoom_out') {
        ctx.save();
        const scale = currentScene.transition === 'zoom_in' ? 0.7 + transitionProgress * 0.3 : 1.3 - transitionProgress * 0.3;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        drawSceneFrame(nextScene, 0.05, transitionProgress, 0);
        ctx.restore();
      }
    }

    // 3. Draw Watermark / Brand Logos (Both per-scene & global brandOverlayConfig)
    const drawWatermarkItem = (wmUrl: string, position: string, opacity: number, scale: number) => {
      const wmImg = imageCacheRef.current.get(wmUrl);
      if (wmImg && wmImg.complete && wmImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = opacity;

        const targetW = width * scale;
        const targetH = (targetW / wmImg.naturalWidth) * wmImg.naturalHeight;
        const pad = 14;

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

    if (currentScene.watermark?.url) {
      drawWatermarkItem(
        currentScene.watermark.url,
        currentScene.watermark.position,
        currentScene.watermark.opacity ?? 0.85,
        currentScene.watermark.scale ?? 0.22
      );
    } else if (currentScene.brandLogo?.url) {
      drawWatermarkItem(
        currentScene.brandLogo.url,
        currentScene.brandLogo.position,
        currentScene.brandLogo.opacity ?? 0.85,
        currentScene.brandLogo.scale ?? 0.22
      );
    }

    if (brandOverlayConfig?.enabled && brandOverlayConfig.logoUrl) {
      drawWatermarkItem(
        brandOverlayConfig.logoUrl,
        brandOverlayConfig.position,
        (brandOverlayConfig.opacityPercent || 85) / 100,
        (brandOverlayConfig.scalePercent || 20) / 100
      );
    }

    // 4. Draw Animated Scrolling Ticker Option
    const activeTicker: TickerConfig | undefined = currentScene.tickerConfig || {
      enabled: true,
      text: 'NEPALAI STUDIO PRO • REALTIME PRODUCTION ENGINE • 4K HDR HYBRID RENDERING',
      textNepali: 'नेपालआई स्टुडियो प्रो - अत्याधुनिक भिडियो सम्पादन प्लेटफर्म',
      style: 'breaking_red',
      speed: 'medium',
      position: 'bottom',
      badgeText: 'LIVE BROADCAST',
    };

    if (activeTicker && activeTicker.enabled) {
      ctx.save();
      const tickerHeight = Math.max(26, Math.round(height * 0.08));
      const tickerY = activeTicker.position === 'top' ? 0 : height - tickerHeight;

      // Background style
      if (activeTicker.style === 'breaking_red') {
        ctx.fillStyle = '#dc2626'; // Red
      } else if (activeTicker.style === 'gold_luxury') {
        const g = ctx.createLinearGradient(0, tickerY, width, tickerY + tickerHeight);
        g.addColorStop(0, '#78350f');
        g.addColorStop(0.5, '#d97706');
        g.addColorStop(1, '#451a03');
        ctx.fillStyle = g;
      } else if (activeTicker.style === 'neon_cyber') {
        ctx.fillStyle = '#0f172a';
      } else if (activeTicker.style === 'nepal_heritage') {
        ctx.fillStyle = '#1e3a8a';
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      }

      ctx.fillRect(0, tickerY, width, tickerHeight);

      // Top line border
      ctx.strokeStyle = activeTicker.style === 'neon_cyber' ? '#06b6d4' : 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, tickerY);
      ctx.lineTo(width, tickerY);
      ctx.stroke();

      // Badge on left
      const badgeText = activeTicker.badgeText || 'BREAKING';
      ctx.font = `bold ${Math.round(tickerHeight * 0.45)}px "Plus Jakarta Sans", sans-serif`;
      const badgeWidth = ctx.measureText(badgeText).width + 16;

      ctx.fillStyle = activeTicker.style === 'gold_luxury' ? '#18181b' : '#f87171';
      ctx.fillRect(0, tickerY, badgeWidth, tickerHeight);

      ctx.fillStyle = activeTicker.style === 'gold_luxury' ? '#fef08a' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeWidth / 2, tickerY + tickerHeight * 0.65);

      // Scrolling ticker text calculation
      const tickerTextCombined = `${activeTicker.textNepali ? activeTicker.textNepali + '  •  ' : ''}${activeTicker.text}  •  `;
      ctx.font = `600 ${Math.round(tickerHeight * 0.45)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';

      const speedFactor = activeTicker.speed === 'fast' ? 120 : activeTicker.speed === 'slow' ? 45 : 80;
      const textX = width - ((currentTime * speedFactor) % (width + 600));

      ctx.save();
      ctx.beginPath();
      ctx.rect(badgeWidth + 6, tickerY, width - badgeWidth - 12, tickerHeight);
      ctx.clip();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tickerTextCombined, textX, tickerY + tickerHeight * 0.65);
      ctx.restore();

      ctx.restore();
    }

    // 5. Draw Kinetic Typography & Multi-layer Text Overlays
    let textToDraw = currentScene.kineticConfig?.primaryText || currentScene.textOverlay;
    if (currentScene.textNepali || currentScene.kineticConfig?.secondaryTextNepali) {
      const nep = currentScene.kineticConfig?.secondaryTextNepali || currentScene.textNepali;
      textToDraw = (nep ? `${nep}  ` : '') + (textToDraw ? `(${textToDraw})` : '');
    }

    if (textToDraw) {
      ctx.save();
      const textAnim = currentScene.kineticConfig?.preset || currentScene.textAnimation || 'fade_in';
      const textStyle = currentScene.textStyle || 'lower_third';
      const kc = currentScene.kineticConfig;

      // Typewriter animation handling
      if (textAnim === 'typewriter' || textAnim === 'kinetic_typewriter') {
        const maxLen = textToDraw.length;
        const visibleChars = Math.min(maxLen, Math.floor(sceneProgress * maxLen * 1.6));
        textToDraw = textToDraw.substring(0, visibleChars);
      }

      // Calculate opacity
      let textAlpha = 1.0;
      if (textAnim === 'fade_in') {
        textAlpha = Math.min(1.0, sceneProgress / 0.18);
      }

      ctx.globalAlpha = textAlpha;

      const baseFontSize = kc?.fontSize || Math.max(14, Math.round(height * 0.05));
      ctx.font = `800 ${baseFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';

      let textY = height - 56;
      if (currentScene.textPosition === 'top') textY = 48;
      else if (currentScene.textPosition === 'center') textY = height / 2;
      else if (currentScene.textPosition === 'lower_third') textY = height - 60;

      // Vertical bounce/slide offset animation
      if (textAnim === 'bounce' || textAnim === 'slide_up' || textAnim === 'kinetic_bounce') {
        const offsetY = Math.sin(sceneProgress * Math.PI * 3) * (1 - sceneProgress) * 18;
        textY += offsetY;
      }

      // Kinetic Glitch Split (RGB shift offset)
      if (textAnim === 'glitch' || textAnim === 'kinetic_glitch_split') {
        const glitchOffset = (Math.random() - 0.5) * (1 - sceneProgress) * 12;
        // Cyan layer offset
        ctx.save();
        ctx.fillStyle = '#06b6d4';
        ctx.globalAlpha = 0.7;
        ctx.fillText(textToDraw, width / 2 + glitchOffset, textY - 2);
        ctx.restore();

        // Magenta layer offset
        ctx.save();
        ctx.fillStyle = '#ec4899';
        ctx.globalAlpha = 0.7;
        ctx.fillText(textToDraw, width / 2 - glitchOffset, textY + 2);
        ctx.restore();
      }

      // Kinetic 3D Zoom (Depth expansion)
      if (textAnim === 'kinetic_3d_zoom' || textAnim === 'zoom_pop') {
        const scale = 0.6 + Math.min(0.4, sceneProgress * 1.5);
        ctx.translate(width / 2, textY);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -textY);
      }

      const metrics = ctx.measureText(textToDraw);
      const textWidth = metrics.width;
      const boxPadX = 18;
      const boxPadY = 8;
      const boxX = (width - textWidth) / 2 - boxPadX;
      const boxY = textY - baseFontSize + 4 - boxPadY;
      const boxW = textWidth + boxPadX * 2;
      const boxH = baseFontSize + boxPadY * 2;

      // Draw custom style box background / Multi-layer Glow
      if (textStyle === 'neon_glow' || textAnim === 'kinetic_neon_pulse') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.shadowColor = kc?.glowColor || '#06b6d4';
        ctx.shadowBlur = 18 + Math.sin(currentTime * 8) * 6;
      } else if (textStyle === 'gold_gradient') {
        ctx.fillStyle = 'rgba(24, 24, 27, 0.94)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
      } else if (textStyle === 'impact_caption') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.roundRect?.(boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      if (textStyle === 'gold_gradient' || textStyle === 'neon_glow' || textAnim === 'kinetic_neon_pulse') {
        ctx.stroke();
      }

      ctx.fillStyle = currentScene.textColor || (textStyle === 'gold_gradient' ? '#fef08a' : '#ffffff');
      ctx.fillText(textToDraw, width / 2, textY);
      ctx.restore();
    }

    // 6. Draw Timed Subtitles (Bilingual Devanagari & English)
    if (subtitles && subtitles.length > 0 && (subtitleBurnOptions?.burnIn ?? true)) {
      const activeSub = subtitles.find(
        (s) => currentTime >= s.startTimeSec && currentTime <= s.endTimeSec
      );
      if (activeSub && (activeSub.text || activeSub.devanagariText)) {
        ctx.save();
        const subFontSize = subtitleBurnOptions?.fontSize === 'large' ? 18 : subtitleBurnOptions?.fontSize === 'small' ? 12 : 15;
        const subColor = subtitleBurnOptions?.textColor || '#ffffff';
        const subBg = subtitleBurnOptions?.backgroundColor || 'rgba(0, 0, 0, 0.75)';

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

    ctx.restore();
  }, [currentTime, scenes, canvasDimensions, isPlaying, brandOverlayConfig, subtitles, subtitleBurnOptions]);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className={`relative flex flex-col items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Canvas Element */}
      <div className="relative flex items-center justify-center w-full h-full max-h-[460px] p-2">
        <canvas
          ref={canvasRef}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          className="max-h-full max-w-full object-contain rounded-xl shadow-lg cursor-pointer"
          onClick={onTogglePlay}
        />

        {/* Live HUD Overlay */}
        {showHud && (
          <div className="absolute inset-x-4 top-4 flex items-center justify-between pointer-events-none text-[11px] font-mono select-none z-30">
            {/* Left Badge: Proxy Engine & FPS */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-slate-200 border border-slate-700/60 shadow">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="font-bold">CANVAS PROXY</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400 font-semibold">{fps} FPS</span>
            </div>

            {/* Right Badge: Timecode & Aspect Ratio */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-slate-200 border border-slate-700/60 shadow">
              <span className="text-indigo-400 font-bold">{formatTimecode(currentTime)}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-semibold">{aspectRatio}</span>
            </div>
          </div>
        )}

        {/* Floating Play Indicator when paused */}
        {!isPlaying && (
          <div 
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer group bg-black/20 hover:bg-black/30 transition z-20"
          >
            <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition duration-150 pl-0.5">
              <Play className="w-5 h-5 fill-current" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Proxy Status Strip */}
      <div className="w-full px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-400" />
            High-Precision Frame Compositor
          </span>
          <span className="text-slate-600">•</span>
          <span>Hardware Accelerated 2D Canvas</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHud(!showHud)}
            className="hover:text-slate-200 text-slate-400 font-medium px-1 rounded transition"
          >
            {showHud ? 'Hide HUD' : 'Show HUD'}
          </button>
        </div>
      </div>
    </div>
  );
};
