import { 
  Scene, 
  AudioTrack, 
  CameraMotion, 
  TransitionType, 
  ColorFilter, 
  ColorAdjustments,
  KineticTypographyConfig,
  TickerConfig,
  SceneWatermark,
  BrandOverlayConfig 
} from '../types';

export interface VideoRendererOptions {
  fps?: number; // Frames per second (default 30)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '1080p' | '720p' | '4k' | { width: number; height: number };
  sampleRate?: number; // Audio sample rate (default 44100)
  brandOverlay?: BrandOverlayConfig;
  defaultTransitionDuration?: number; // In seconds (default 0.8s)
}

export interface ActiveVisualMedia {
  scene: Scene;
  sceneIndex: number;
  localTime: number; // Time elapsed in seconds within this scene
  sceneDuration: number;
  startTime: number;
  endTime: number;
  progress: number; // 0.0 to 1.0 within this scene
  motion: CameraMotion;
  filter: ColorFilter;
  colorAdjustments?: ColorAdjustments;
  textOverlay?: string;
  textNepali?: string;
  kineticConfig?: KineticTypographyConfig;
  tickerConfig?: TickerConfig;
  watermark?: SceneWatermark;
  mediaType: 'image' | 'video';
  mediaUrl: string;
}

export interface ActiveTransition {
  type: TransitionType;
  progress: number; // 0.0 to 1.0 across the transition duration
  duration: number; // Duration of the transition in seconds
  fromScene: Scene;
  fromSceneIndex: number;
  toScene: Scene;
  toSceneIndex: number;
}

export interface ActiveAudioTrack {
  track: AudioTrack;
  trackIndex: number;
  localTime: number; // Time elapsed within the audio track
  trackDuration: number;
  startTime: number;
  endTime: number;
  progress: number; // 0.0 to 1.0 within track duration
  effectiveVolume: number; // 0 to 100 (taking ducking and track volume into account)
  type: 'bgm' | 'sfx' | 'voiceover';
  isDucked?: boolean;
}

export interface TimelineFrameState {
  timeInSeconds: number;
  frameIndex: number;
  totalDuration: number;
  totalFrames: number;
  overallProgress: number; // 0.0 to 1.0
  activeVisual: ActiveVisualMedia | null;
  activeAudioTracks: ActiveAudioTrack[];
  transition: ActiveTransition | null;
  isFinished: boolean;
}

export interface SceneTimeRange {
  scene: Scene;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  transitionDuration: number;
}

export interface AudioTrackTimeRange {
  track: AudioTrack;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  effectiveVolume: number;
}

export interface MockRenderOptions {
  fps?: number;
  format?: 'webm' | 'mp4';
  width?: number;
  height?: number;
  durationLimitSeconds?: number;
  sampleFramesCount?: number;
  simulateSpeed?: 'fast' | 'realtime';
  onProgress?: (progress: number, step: string) => void;
}

export interface MockRenderResult {
  blob: Blob;
  blobUrl: string;
  duration: number;
  totalFrames: number;
  fps: number;
  resolution: { width: number; height: number };
  format: string;
  scenesCount: number;
  audioTracksCount: number;
  diagnostics: {
    framesSampled: number;
    activeTransitionsCount: number;
    activeAudioOverlapCount: number;
    renderTimeMs: number;
    sceneTimeRanges: Array<{
      id: string;
      title: string;
      startTime: number;
      endTime: number;
      duration: number;
      mediaType: string;
      mediaUrl: string;
    }>;
    audioTimeRanges: Array<{
      id: string;
      title: string;
      startTime: number;
      endTime: number;
      duration: number;
      volume: number;
      type: string;
    }>;
  };
}

/**
 * VideoRenderer
 * 
 * Frame-by-frame orchestration engine that maps playback timestamps (in seconds)
 * against active Scene objects and AudioTracks, computing visual states, transitions,
 * audio overlaps/ducking, and generating client-side mock render blobs for validation.
 */
export class VideoRenderer {
  private scenes: Scene[] = [];
  private audioTracks: AudioTrack[] = [];
  private options: {
    fps: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
    resolution: '1080p' | '720p' | '4k' | { width: number; height: number };
    sampleRate: number;
    brandOverlay?: BrandOverlayConfig;
    defaultTransitionDuration: number;
  };

  private sceneRanges: SceneTimeRange[] = [];
  private audioRanges: AudioTrackTimeRange[] = [];
  private totalDuration: number = 0;
  private totalFrames: number = 0;
  private createdBlobUrls: Set<string> = new Set();

  constructor(
    scenes: Scene[] = [],
    audioTracks: AudioTrack[] = [],
    options: VideoRendererOptions = {}
  ) {
    this.options = {
      fps: options.fps && options.fps > 0 ? options.fps : 30,
      aspectRatio: options.aspectRatio || '16:9',
      resolution: options.resolution || '720p',
      sampleRate: options.sampleRate || 44100,
      brandOverlay: options.brandOverlay,
      defaultTransitionDuration: options.defaultTransitionDuration || 0.8,
    };

    this.setTimeline(scenes, audioTracks);
  }

  /**
   * Updates scenes and audio tracks, recalculating time ranges and frame counts.
   */
  public setTimeline(scenes: Scene[], audioTracks: AudioTrack[] = []): void {
    this.scenes = Array.isArray(scenes) ? [...scenes] : [];
    this.audioTracks = Array.isArray(audioTracks) ? [...audioTracks] : [];
    this.recomputeTimeline();
  }

  public setScenes(scenes: Scene[]): void {
    this.scenes = Array.isArray(scenes) ? [...scenes] : [];
    this.recomputeTimeline();
  }

  public setAudioTracks(audioTracks: AudioTrack[]): void {
    this.audioTracks = Array.isArray(audioTracks) ? [...audioTracks] : [];
    this.recomputeTimeline();
  }

  public getScenes(): Scene[] {
    return [...this.scenes];
  }

  public getAudioTracks(): AudioTrack[] {
    return [...this.audioTracks];
  }

  public getTotalDuration(): number {
    return this.totalDuration;
  }

  public getTotalFrames(): number {
    return this.totalFrames;
  }

  public getFps(): number {
    return this.options.fps;
  }

  public getResolutionDimensions(): { width: number; height: number } {
    const { resolution, aspectRatio } = this.options;
    if (typeof resolution === 'object') {
      return { width: resolution.width, height: resolution.height };
    }

    if (resolution === '1080p') {
      if (aspectRatio === '9:16') return { width: 1080, height: 1920 };
      if (aspectRatio === '1:1') return { width: 1080, height: 1080 };
      return { width: 1920, height: 1080 };
    }

    if (resolution === '4k') {
      if (aspectRatio === '9:16') return { width: 2160, height: 3840 };
      if (aspectRatio === '1:1') return { width: 2160, height: 2160 };
      return { width: 3840, height: 2160 };
    }

    // Default 720p
    if (aspectRatio === '9:16') return { width: 720, height: 1280 };
    if (aspectRatio === '1:1') return { width: 720, height: 720 };
    return { width: 1280, height: 720 };
  }

  public getSceneRanges(): SceneTimeRange[] {
    return [...this.sceneRanges];
  }

  public getAudioRanges(): AudioTrackTimeRange[] {
    return [...this.audioRanges];
  }

  /**
   * Internal helper: computes sequential scene offsets and audio track spans.
   */
  private recomputeTimeline(): void {
    this.sceneRanges = [];
    let accumulatedTime = 0;

    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const duration = Math.max(0.1, Number(scene.duration) || 4);
      const startTime = accumulatedTime;
      const endTime = startTime + duration;
      const transitionDuration = Math.min(
        duration * 0.5,
        scene.transitionDuration !== undefined ? scene.transitionDuration : this.options.defaultTransitionDuration
      );

      this.sceneRanges.push({
        scene,
        index: i,
        startTime,
        endTime,
        duration,
        transitionDuration,
      });

      accumulatedTime = endTime;
    }

    this.totalDuration = Math.max(0, accumulatedTime);
    this.totalFrames = Math.max(0, Math.floor(this.totalDuration * this.options.fps));

    // Calculate audio track ranges
    this.audioRanges = [];
    for (let j = 0; j < this.audioTracks.length; j++) {
      const track = this.audioTracks[j];
      const startTime = Math.max(0, track.startTime || 0);
      const duration = track.duration && track.duration > 0 ? track.duration : Math.max(1, this.totalDuration - startTime);
      const endTime = startTime + duration;
      const effectiveVolume = Math.min(100, Math.max(0, track.volume !== undefined ? track.volume : 80));

      this.audioRanges.push({
        track,
        index: j,
        startTime,
        endTime,
        duration,
        effectiveVolume,
      });
    }
  }

  /**
   * Converts a given frame number to its time offset in seconds.
   */
  public getTimeForFrameIndex(frameIndex: number): number {
    if (frameIndex <= 0) return 0;
    return frameIndex / this.options.fps;
  }

  /**
   * Converts a timestamp in seconds to its corresponding integer frame index.
   */
  public getFrameIndexForTime(timeInSeconds: number): number {
    if (timeInSeconds <= 0) return 0;
    return Math.floor(timeInSeconds * this.options.fps);
  }

  /**
   * Determines the active visual scene at timestamp `timeInSeconds`.
   */
  public getActiveVisualMediaAt(timeInSeconds: number): ActiveVisualMedia | null {
    if (this.sceneRanges.length === 0) return null;

    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.totalDuration));

    // Find matching scene range
    let match = this.sceneRanges.find(
      (range) => clampedTime >= range.startTime && (clampedTime < range.endTime || range.index === this.sceneRanges.length - 1)
    );

    if (!match) {
      match = this.sceneRanges[this.sceneRanges.length - 1];
    }

    const localTime = Math.max(0, Math.min(clampedTime - match.startTime, match.duration));
    const progress = match.duration > 0 ? localTime / match.duration : 1;

    return {
      scene: match.scene,
      sceneIndex: match.index,
      localTime,
      sceneDuration: match.duration,
      startTime: match.startTime,
      endTime: match.endTime,
      progress: Math.min(1, Math.max(0, progress)),
      motion: match.scene.motion || 'static',
      filter: match.scene.filter || 'none',
      colorAdjustments: match.scene.colorAdjustments,
      textOverlay: match.scene.textOverlay,
      textNepali: match.scene.textNepali,
      kineticConfig: match.scene.kineticConfig,
      tickerConfig: match.scene.tickerConfig,
      watermark: match.scene.watermark || match.scene.brandLogo,
      mediaType: match.scene.mediaType || 'video',
      mediaUrl: match.scene.mediaUrl || '',
    };
  }

  /**
   * Determines if a transition is currently in progress at `timeInSeconds`.
   */
  public getActiveTransitionAt(timeInSeconds: number): ActiveTransition | null {
    if (this.sceneRanges.length <= 1) return null;

    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.totalDuration));

    for (let i = 0; i < this.sceneRanges.length - 1; i++) {
      const current = this.sceneRanges[i];
      const next = this.sceneRanges[i + 1];

      if (current.scene.transition && current.scene.transition !== 'cut') {
        const transStart = current.endTime - current.transitionDuration;
        const transEnd = current.endTime;

        if (clampedTime >= transStart && clampedTime <= transEnd) {
          const transProgress = current.transitionDuration > 0 
            ? (clampedTime - transStart) / current.transitionDuration 
            : 1;

          return {
            type: current.scene.transition,
            progress: Math.min(1, Math.max(0, transProgress)),
            duration: current.transitionDuration,
            fromScene: current.scene,
            fromSceneIndex: i,
            toScene: next.scene,
            toSceneIndex: i + 1,
          };
        }
      }
    }

    return null;
  }

  /**
   * Returns all active audio tracks at `timeInSeconds`, applying audio ducking
   * if voiceover tracks are concurrent with background music.
   */
  public getActiveAudioTracksAt(timeInSeconds: number): ActiveAudioTrack[] {
    if (this.audioRanges.length === 0) return [];

    const clampedTime = Math.max(0, timeInSeconds);
    const activeRanges = this.audioRanges.filter(
      (range) => clampedTime >= range.startTime && clampedTime < range.endTime
    );

    if (activeRanges.length === 0) return [];

    // Check if voiceover is active (to apply ducking on BGM)
    const hasVoiceover = activeRanges.some(
      (r) => r.track.type === 'voiceover' || r.track.genre?.toLowerCase().includes('voice')
    );

    return activeRanges.map((range) => {
      const localTime = clampedTime - range.startTime;
      const progress = range.duration > 0 ? localTime / range.duration : 1;

      let effectiveVolume = range.effectiveVolume;
      let isDucked = false;

      // Auto-duck BGM by 60% if concurrent voiceover is active
      if (hasVoiceover && (range.track.type === 'bgm' || !range.track.type)) {
        effectiveVolume = Math.round(effectiveVolume * 0.4);
        isDucked = true;
      }

      return {
        track: range.track,
        trackIndex: range.index,
        localTime,
        trackDuration: range.duration,
        startTime: range.startTime,
        endTime: range.endTime,
        progress: Math.min(1, Math.max(0, progress)),
        effectiveVolume,
        type: range.track.type || 'bgm',
        isDucked,
      };
    });
  }

  /**
   * Complete frame orchestration state snapshot for any playback timestamp.
   */
  public getStateAtTime(timeInSeconds: number): TimelineFrameState {
    const clampedTime = Math.max(0, Math.min(timeInSeconds, this.totalDuration));
    const frameIndex = this.getFrameIndexForTime(clampedTime);
    const overallProgress = this.totalDuration > 0 ? clampedTime / this.totalDuration : 1;
    const isFinished = this.totalDuration > 0 && clampedTime >= this.totalDuration;

    return {
      timeInSeconds: clampedTime,
      frameIndex,
      totalDuration: this.totalDuration,
      totalFrames: this.totalFrames,
      overallProgress: Math.min(1, Math.max(0, overallProgress)),
      activeVisual: this.getActiveVisualMediaAt(clampedTime),
      activeAudioTracks: this.getActiveAudioTracksAt(clampedTime),
      transition: this.getActiveTransitionAt(clampedTime),
      isFinished,
    };
  }

  /**
   * Returns the frame state for a specific integer frame index.
   */
  public getStateAtFrame(frameIndex: number): TimelineFrameState {
    const time = this.getTimeForFrameIndex(frameIndex);
    return this.getStateAtTime(time);
  }

  /**
   * Samples the timeline at uniform intervals for debugging or visualization.
   */
  public sampleTimeline(sampleIntervalSeconds: number = 1.0): TimelineFrameState[] {
    const samples: TimelineFrameState[] = [];
    const interval = Math.max(0.1, sampleIntervalSeconds);

    for (let t = 0; t <= this.totalDuration; t += interval) {
      samples.push(this.getStateAtTime(t));
    }

    if (samples.length === 0 || samples[samples.length - 1].timeInSeconds < this.totalDuration) {
      samples.push(this.getStateAtTime(this.totalDuration));
    }

    return samples;
  }

  /**
   * Validates whether the timeline is playable without invalid gaps or missing resources.
   */
  public validateTimeline(): { isValid: boolean; errors: string[]; warnings: string[]; totalDuration: number } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.scenes.length === 0) {
      errors.push('Timeline contains 0 scenes.');
    }

    this.scenes.forEach((scene, idx) => {
      if (!scene.mediaUrl) {
        warnings.push(`Scene #${idx + 1} (${scene.title || 'Untitled'}) has an empty mediaUrl.`);
      }
      if (!scene.duration || scene.duration <= 0) {
        errors.push(`Scene #${idx + 1} has an invalid duration (${scene.duration}).`);
      }
    });

    this.audioTracks.forEach((track, idx) => {
      if (!track.url) {
        warnings.push(`Audio track #${idx + 1} (${track.title || 'Untitled'}) has no audio URL.`);
      }
      if (track.startTime && track.startTime > this.totalDuration) {
        warnings.push(`Audio track #${idx + 1} starts after the video timeline ends (${track.startTime}s > ${this.totalDuration}s).`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalDuration: this.totalDuration,
    };
  }

  /**
   * Client-Side Mock Render Function
   * 
   * Orchestrates the frame-by-frame state across the timeline and renders a visual
   * representation into a canvas, exporting a real Blob and Blob URL.
   * This verifies the temporal and audio orchestration logic before dispatching heavy jobs to server-side FFmpeg.
   */
  public async mockRender(options: MockRenderOptions = {}): Promise<MockRenderResult> {
    const startTimeMs = Date.now();
    const {
      fps = Math.min(30, this.options.fps),
      durationLimitSeconds,
      onProgress,
    } = options;

    const dimensions = this.getResolutionDimensions();
    const width = options.width || dimensions.width;
    const height = options.height || dimensions.height;

    const renderDuration = durationLimitSeconds 
      ? Math.min(this.totalDuration, durationLimitSeconds) 
      : (this.totalDuration || 5);

    const totalRenderFrames = Math.max(1, Math.floor(renderDuration * fps));

    if (onProgress) onProgress(5, 'Initializing frame-by-frame orchestration matrix...');

    // Diagnostic accumulators
    let activeTransitionsCount = 0;
    let activeAudioOverlapCount = 0;

    // Check if running in a Browser with Canvas & MediaStream support
    const isBrowserCanvas = typeof document !== 'undefined' && typeof document.createElement === 'function';

    let outputBlob: Blob;

    if (isBrowserCanvas) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to acquire 2D canvas context for VideoRenderer mockRender.');
      }

      // Check if MediaRecorder is available for browser-side video streaming
      const canRecord = typeof MediaRecorder !== 'undefined' && typeof canvas.captureStream === 'function';

      if (canRecord) {
        outputBlob = await new Promise<Blob>((resolve) => {
          const stream = canvas.captureStream(fps);
          let mimeType = 'video/webm;codecs=vp8,opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }

          const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = () => {
            const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
            resolve(finalBlob);
          };

          recorder.start();

          // Step through frames
          const renderStep = (frameIdx: number) => {
            const t = (frameIdx / totalRenderFrames) * renderDuration;
            const state = this.getStateAtTime(t);

            if (state.transition) activeTransitionsCount++;
            if (state.activeAudioTracks.length > 1) activeAudioOverlapCount++;

            this.paintOrchestrationFrame(ctx, width, height, state, frameIdx, totalRenderFrames);

            const pct = Math.round((frameIdx / totalRenderFrames) * 90);
            if (onProgress && frameIdx % Math.max(1, Math.floor(totalRenderFrames / 10)) === 0) {
              onProgress(pct, `Orchestrating frame ${frameIdx}/${totalRenderFrames} (${t.toFixed(1)}s)...`);
            }

            if (frameIdx + 1 < totalRenderFrames) {
              // Yield to allow encoder frame buffer uptake
              setTimeout(() => renderStep(frameIdx + 1), 8);
            } else {
              setTimeout(() => {
                if (recorder.state !== 'inactive') {
                  recorder.stop();
                }
              }, 120);
            }
          };

          renderStep(0);
        });
      } else {
        // Fallback for environments where MediaRecorder is missing:
        // Draw the midpoint frame and export as lightweight Blob
        const midpointTime = renderDuration / 2;
        const state = this.getStateAtTime(midpointTime);
        this.paintOrchestrationFrame(ctx, width, height, state, Math.floor(totalRenderFrames / 2), totalRenderFrames);
        
        outputBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => {
            resolve(b || new Blob(['MOCK_VIDEO_STREAM'], { type: 'video/mp4' }));
          }, 'image/jpeg', 0.9);
        });
      }
    } else {
      // Node.js or Non-DOM Environment (for CLI tests / server-side verification)
      const mockPayload = {
        type: 'NepalAI_Timeline_Mock_Stream',
        renderedAt: new Date().toISOString(),
        duration: renderDuration,
        framesCount: totalRenderFrames,
        fps,
        resolution: { width, height },
        scenes: this.sceneRanges.map((s) => ({
          title: s.scene.title,
          startTime: s.startTime,
          duration: s.duration,
          mediaUrl: s.scene.mediaUrl,
        })),
        audio: this.audioRanges.map((a) => ({
          title: a.track.title,
          startTime: a.startTime,
          duration: a.duration,
        })),
      };

      outputBlob = new Blob([JSON.stringify(mockPayload, null, 2)], { type: 'application/json' });
    }

    if (onProgress) onProgress(100, 'Mock timeline orchestration render verified successfully.');

    const blobUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
      ? URL.createObjectURL(outputBlob)
      : `mock://blob-url/${Date.now()}`;

    this.createdBlobUrls.add(blobUrl);

    return {
      blob: outputBlob,
      blobUrl,
      duration: renderDuration,
      totalFrames: totalRenderFrames,
      fps,
      resolution: { width, height },
      format: outputBlob.type || 'video/webm',
      scenesCount: this.scenes.length,
      audioTracksCount: this.audioTracks.length,
      diagnostics: {
        framesSampled: totalRenderFrames,
        activeTransitionsCount,
        activeAudioOverlapCount,
        renderTimeMs: Date.now() - startTimeMs,
        sceneTimeRanges: this.sceneRanges.map((s) => ({
          id: s.scene.id,
          title: s.scene.title,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.duration,
          mediaType: s.scene.mediaType || 'video',
          mediaUrl: s.scene.mediaUrl || '',
        })),
        audioTimeRanges: this.audioRanges.map((a) => ({
          id: a.track.id,
          title: a.track.title,
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.duration,
          volume: a.effectiveVolume,
          type: a.track.type || 'bgm',
        })),
      },
    };
  }

  /**
   * Helper: Paints a visual diagnostic frame onto a 2D canvas showing active media,
   * audio meters, timecodes, motion indicators, and transitions.
   */
  private paintOrchestrationFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: TimelineFrameState,
    frameIdx: number,
    totalFrames: number
  ): void {
    // 1. Dark Studio Backdrop
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Active Scene Visual Representation Card
    const cardMargin = 40;
    const cardW = width - cardMargin * 2;
    const cardH = height - cardMargin * 2 - 80;

    const grad = ctx.createLinearGradient(0, cardMargin, width, cardH);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.roundRect 
      ? ctx.roundRect(cardMargin, cardMargin, cardW, cardH, 16)
      : ctx.fillRect(cardMargin, cardMargin, cardW, cardH);
    ctx.fill();

    // Border around the active frame viewport
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Header Info: Scene Title & Motion
    const active = state.activeVisual;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    const sceneTitle = active ? `Scene #${active.sceneIndex + 1}: ${active.scene.title}` : 'No Active Scene';
    ctx.fillText(sceneTitle, cardMargin + 24, cardMargin + 48);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#94a3b8';
    const subInfo = active 
      ? `Media: ${active.mediaType.toUpperCase()} | Motion: ${active.motion} | Filter: ${active.filter} | Scene Time: ${active.localTime.toFixed(2)}s / ${active.sceneDuration.toFixed(1)}s`
      : 'Timeline Empty';
    ctx.fillText(subInfo, cardMargin + 24, cardMargin + 80);

    // 4. Center Visual Graphic & Motion Indicator
    const centerX = width / 2;
    const centerY = (cardMargin + cardH) / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Playhead pulse / progress ring
    if (active) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 72, -Math.PI / 2, -Math.PI / 2 + active.progress * (Math.PI * 2));
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(active?.mediaType === 'image' ? 'IMG FRAME' : 'VIDEO STREAM', centerX, centerY + 6);

    // 5. Active Text Overlay / Subtitle Preview
    if (active?.textOverlay) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      const textWidth = Math.min(cardW - 40, ctx.measureText(active.textOverlay).width + 40);
      ctx.fillRect(centerX - textWidth / 2, centerY + 100, textWidth, 38);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(active.textOverlay, centerX, centerY + 125);
    }

    // 6. Transition Banner if active
    if (state.transition) {
      const trans = state.transition;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(cardMargin, cardMargin + cardH - 50, cardW, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `⚡ ACTIVE TRANSITION [${trans.type.toUpperCase()}]: Scene #${trans.fromSceneIndex + 1} ➔ Scene #${trans.toSceneIndex + 1} (${Math.round(trans.progress * 100)}%)`,
        centerX,
        cardMargin + cardH - 24
      );
    }

    // 7. Audio Tracks Orchestration Meters (Bottom Shelf)
    const shelfY = height - 90;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cardMargin, shelfY, cardW, 60);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(cardMargin, shelfY, cardW, 60);

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('AUDIO MIXER:', cardMargin + 16, shelfY + 24);

    if (state.activeAudioTracks.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('No audio tracks active at this timestamp (Muted)', cardMargin + 130, shelfY + 24);
    } else {
      let badgeX = cardMargin + 130;
      state.activeAudioTracks.forEach((aud) => {
        const isBgm = aud.type === 'bgm';
        ctx.fillStyle = isBgm ? '#047857' : '#b45309';
        ctx.fillRect(badgeX, shelfY + 8, 220, 44);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${aud.type.toUpperCase()}: ${aud.track.title.slice(0, 16)}`, badgeX + 8, shelfY + 26);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(`Vol: ${aud.effectiveVolume}% ${aud.isDucked ? '(DUCKED)' : ''}`, badgeX + 8, shelfY + 42);
        badgeX += 230;
      });
    }

    // 8. Bottom Global Timeline Progress Bar & Timecode
    const progressBarY = height - 20;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, progressBarY, width, 20);

    const progressFillW = (frameIdx / Math.max(1, totalFrames)) * width;
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, progressBarY, progressFillW, 20);

    // Timecode badge
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    const timecode = `T: ${state.timeInSeconds.toFixed(2)}s / ${state.totalDuration.toFixed(2)}s (Frame ${frameIdx + 1}/${totalFrames})`;
    ctx.fillText(timecode, width - 12, progressBarY + 15);
  }

  /**
   * Revokes all generated blob URLs to prevent memory leaks.
   */
  public dispose(): void {
    if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      this.createdBlobUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore revocation errors
        }
      });
    }
    this.createdBlobUrls.clear();
  }

  /**
   * Convenience static method to calculate total duration of any scene array.
   */
  public static calculateTotalDuration(scenes: Scene[]): number {
    if (!Array.isArray(scenes) || scenes.length === 0) return 0;
    return scenes.reduce((acc, s) => acc + Math.max(0.1, Number(s.duration) || 4), 0);
  }
}
