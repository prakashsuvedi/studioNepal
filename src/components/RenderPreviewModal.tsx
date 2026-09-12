import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Film,
  CheckCircle2,
  Sliders,
  Maximize2,
  Volume2,
  VolumeX,
  Layers,
  Activity,
  Zap,
  Eye,
  MonitorPlay,
  SkipBack,
  SkipForward,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Scene, AudioTrack, BrandOverlayConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';

interface RenderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommitExport: () => void;
  scenes: Scene[];
  projectTitle: string;
  totalDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  audioTracks?: AudioTrack[];
  brandOverlayConfig?: BrandOverlayConfig;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
  bgmVolume?: number;
  voVolume?: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export const RenderPreviewModal: React.FC<RenderPreviewModalProps> = ({
  isOpen,
  onClose,
  onCommitExport,
  scenes,
  projectTitle,
  totalDuration,
  aspectRatio,
  audioTracks = [],
  brandOverlayConfig,
  subtitles = [],
  subtitleBurnOptions,
  bgmVolume = 50,
  voVolume = 90,
  currentTime: externalCurrentTime = 0,
  onSeek,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackTime, setPlaybackTime] = useState(externalCurrentTime || 0);
  const [isSimulatingExport, setIsSimulatingExport] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedFrame, setSimulatedFrame] = useState(1);
  const [isSimulationDone, setIsSimulationDone] = useState(false);
  const [targetFps, setTargetFps] = useState<30 | 60>(30);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  const totalFrames = Math.max(1, Math.round((totalDuration || 1) * targetFps));

  // Sync external current time when opened
  useEffect(() => {
    if (isOpen) {
      setPlaybackTime(externalCurrentTime || 0);
      setIsPlaying(true);
      setIsSimulationDone(false);
      setSimulatedProgress(0);
      setSimulatedFrame(1);
    }
  }, [isOpen, externalCurrentTime]);

  // Real-time playback loop
  useEffect(() => {
    if (!isOpen || !isPlaying || totalDuration <= 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setPlaybackTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          return 0; // Loop seamlessly
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isPlaying, totalDuration]);

  // Sync simulation frame with playback
  useEffect(() => {
    if (totalDuration > 0) {
      const currentF = Math.min(totalFrames, Math.max(1, Math.round((playbackTime / totalDuration) * totalFrames)));
      setSimulatedFrame(currentF);
    }
  }, [playbackTime, totalDuration, totalFrames]);

  if (!isOpen) return null;

  // Determine active scene based on playbackTime
  let accumulatedTime = 0;
  let activeSceneIndex = 0;
  let currentScene: Scene | null = scenes[0] || null;
  let timeInCurrentScene = playbackTime;

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (playbackTime >= accumulatedTime && playbackTime < accumulatedTime + s.duration) {
      activeSceneIndex = i;
      currentScene = s;
      timeInCurrentScene = playbackTime - accumulatedTime;
      break;
    }
    accumulatedTime += s.duration;
  }

  // Active subtitle detection
  const activeSubtitle = subtitles.find(
    (sub) => playbackTime >= sub.startTime && playbackTime <= sub.endTime
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleStartSimulation = () => {
    setIsSimulatingExport(true);
    setSimulatedProgress(0);
    setIsSimulationDone(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setSimulatedProgress(progress);
      setSimulatedFrame(Math.min(totalFrames, Math.round((progress / 100) * totalFrames)));

      if (progress >= 100) {
        clearInterval(interval);
        setIsSimulatingExport(false);
        setIsSimulationDone(true);
      }
    }, 40);
  };

  const handleSeek = (time: number) => {
    setPlaybackTime(time);
    if (onSeek) onSeek(time);
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-600/80 rounded-2xl max-w-5xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 px-5 py-3.5 border-b border-cyan-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Real-Time Render Preview
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Live Composite Pass
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {projectTitle} • {aspectRatio} • {scenes.length} Scenes • {totalDuration.toFixed(1)}s Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0">
          
          {/* Left / Center: Composited Video Stage & Playback Controls */}
          <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col items-center justify-between bg-black/60 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto">
            
            {/* Viewport Box */}
            <div className="w-full flex-1 flex items-center justify-center p-2">
              <div
                className={`relative bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center ${
                  aspectRatio === '9:16'
                    ? 'w-[260px] h-[460px] sm:w-[280px] sm:h-[490px]'
                    : aspectRatio === '1:1'
                    ? 'w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]'
                    : 'w-full max-w-[560px] aspect-video'
                }`}
              >
                {/* Visual Scene Asset */}
                {currentScene?.mediaUrl ? (
                  currentScene.mediaType === 'video' ? (
                    <video
                      src={currentScene.mediaUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentScene.mediaUrl}
                      alt={currentScene.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out"
                      style={{
                        transform: currentScene.motion === 'zoom_in'
                          ? `scale(${1 + (timeInCurrentScene / (currentScene.duration || 1)) * 0.15})`
                          : currentScene.motion === 'pan_right'
                          ? `translateX(${(timeInCurrentScene / (currentScene.duration || 1)) * 10}px)`
                          : 'scale(1)',
                        filter: currentScene.filter === 'warm'
                          ? 'sepia(0.2) saturate(1.2)'
                          : currentScene.filter === 'cinematic'
                          ? 'contrast(1.1) brightness(0.95)'
                          : 'none',
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-2 p-4 text-center">
                    <Film className="w-8 h-8 text-slate-600" />
                    <span className="text-xs">No media clip assigned to Scene {activeSceneIndex + 1}</span>
                  </div>
                )}

                {/* Simulated Text Overlay */}
                {currentScene?.textOverlay && (
                  <div
                    className={`absolute inset-x-4 text-center z-20 pointer-events-none transition-all ${
                      currentScene.textPosition === 'top'
                        ? 'top-4'
                        : currentScene.textPosition === 'center'
                        ? 'top-1/2 -translate-y-1/2'
                        : 'bottom-8'
                    }`}
                  >
                    <span
                      className="inline-block px-3 py-1.5 rounded-lg text-sm sm:text-base font-bold shadow-lg"
                      style={{
                        color: currentScene.textColor || '#ffffff',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      {currentScene.textOverlay}
                    </span>
                  </div>
                )}

                {/* Simulated Subtitles Burn-in */}
                {activeSubtitle && subtitleBurnOptions?.burnIn !== false && (
                  <div className="absolute inset-x-4 bottom-3 text-center z-25 pointer-events-none">
                    <span
                      className="inline-block px-3 py-1 rounded-md text-xs sm:text-sm font-semibold shadow-md"
                      style={{
                        color: subtitleBurnOptions?.textColor || '#ffffff',
                        backgroundColor: subtitleBurnOptions?.backgroundColor || 'rgba(0, 0, 0, 0.75)',
                      }}
                    >
                      {activeSubtitle.text}
                    </span>
                  </div>
                )}

                {/* Brand Overlay / Watermark */}
                {brandOverlayConfig?.enabled && (
                  <div
                    className={`absolute z-30 pointer-events-none ${
                      brandOverlayConfig.position === 'top-left'
                        ? 'top-3 left-3'
                        : brandOverlayConfig.position === 'top-right'
                        ? 'top-3 right-3'
                        : brandOverlayConfig.position === 'bottom-left'
                        ? 'bottom-3 left-3'
                        : 'bottom-3 right-3'
                    }`}
                    style={{ opacity: (brandOverlayConfig.opacityPercent || 85) / 100 }}
                  >
                    {brandOverlayConfig.logoUrl ? (
                      <img
                        src={brandOverlayConfig.logoUrl}
                        alt="Brand Watermark"
                        className="h-6 w-auto object-contain drop-shadow"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/20">
                        {brandOverlayConfig.brandText || 'NepalAI'}
                      </span>
                    )}
                  </div>
                )}

                {/* Active Scene Overlay Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-cyan-300 border border-white/10 z-30">
                  Clip {activeSceneIndex + 1}/{scenes.length} • {currentScene?.title || 'Scene'}
                </div>

                {/* Frame Counter Tag */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-slate-300 border border-white/10 z-30">
                  F: {simulatedFrame} / {totalFrames} ({targetFps}fps)
                </div>
              </div>
            </div>

            {/* Playback Controls & Scrubber */}
            <div className="w-full max-w-xl space-y-2 pt-2 shrink-0">
              {/* Scrub Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{formatTime(playbackTime)}</span>
                  <span className="text-cyan-400 font-bold">{formatTime(totalDuration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={totalDuration || 1}
                  step="0.05"
                  value={playbackTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Transport Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSeek(0)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Jump to Start"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (activeSceneIndex > 0) {
                        let t = 0;
                        for (let i = 0; i < activeSceneIndex - 1; i++) t += scenes[i].duration;
                        handleSeek(t);
                      }
                    }}
                    disabled={activeSceneIndex === 0}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
                    title="Previous Scene"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
                    title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                  </button>

                  <button
                    onClick={() => {
                      if (activeSceneIndex < scenes.length - 1) {
                        let t = 0;
                        for (let i = 0; i <= activeSceneIndex; i++) t += scenes[i].duration;
                        handleSeek(t);
                      }
                    }}
                    disabled={activeSceneIndex >= scenes.length - 1}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
                    title="Next Scene"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Audio and FPS toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTargetFps(targetFps === 30 ? 60 : 30)}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-mono text-cyan-300 transition cursor-pointer"
                    title="Toggle Preview Target Framerate"
                  >
                    {targetFps} FPS
                  </button>

                  <button
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      isAudioMuted ? 'bg-rose-950/60 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title={isAudioMuted ? 'Unmute Audio Mix' : 'Mute Audio Mix'}
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Render Simulation Pipeline & Verification Checklist */}
          <div className="lg:col-span-4 p-5 flex flex-col justify-between space-y-4 bg-slate-950 overflow-y-auto">
            
            {/* Simulation Engine Box */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Simulated Frame Export</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {totalFrames} Total Frames
                </span>
              </div>

              {/* Progress Bar & Frame Counter */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {isSimulatingExport
                      ? 'Simulating Frame Rasterizer...'
                      : isSimulationDone
                      ? 'Frame Pass Complete'
                      : 'Real-time Playback Sync'}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {isSimulatingExport ? `${simulatedProgress}%` : `${Math.round((playbackTime / (totalDuration || 1)) * 100)}%`}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-100"
                    style={{
                      width: `${isSimulatingExport ? simulatedProgress : Math.min(100, (playbackTime / (totalDuration || 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[9px] uppercase">Current Frame</span>
                    <span className="text-slate-200 font-bold">{simulatedFrame} / {totalFrames}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[9px] uppercase">Render Pass</span>
                    <span className="text-emerald-400 font-bold">Canvas 2D OK</span>
                  </div>
                </div>

                <button
                  onClick={handleStartSimulation}
                  disabled={isSimulatingExport}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition border border-slate-700/80 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSimulatingExport ? 'Exporting Mock Frames...' : 'Run Mock Frame Export Pass'}</span>
                </button>
              </div>

              {/* Pre-Commit Verification Checklist */}
              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wide">
                  Pre-Commit Visual Checklist
                </span>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Clips & Assets Synchronized</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px]">{scenes.length} clips</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Audio Mix Ready</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      BGM: {bgmVolume}% • VO: {voVolume}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Subtitles & Devanagari</span>
                    </span>
                    <span className="text-cyan-400 font-mono text-[10px]">
                      {subtitles.length > 0 ? `${subtitles.length} lines` : 'Scene Text'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Watermark / Branding</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {brandOverlayConfig?.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commit & Close Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onCommitExport();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Commit & Export Video</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Back to Timeline Editor
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
