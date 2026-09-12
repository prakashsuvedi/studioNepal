import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Layers, 
  SlidersHorizontal,
  Film,
  Camera,
  Monitor,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Scene, BrandOverlayConfig } from '../../types';
import { getCompositionAtTime } from '../../lib/timelineComposition';
import { LivePreviewCanvas } from '../LivePreviewCanvas';
import { SubtitleItem, SubtitleBurnOptions } from '../SubtitleEditorModal';

interface CapCutPlayerPanelProps {
  scenes: Scene[];
  selectedScene: Scene | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  totalDuration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1') => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onStepFrame?: (deltaFrames: number) => void;
  onOpenMediaLibrary?: () => void;
  brandOverlayConfig?: BrandOverlayConfig;
  previewMode?: 'canvas' | 'stage';
  setPreviewMode?: (mode: 'canvas' | 'stage') => void;
  onToggleCurrentTicker?: () => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
}

export const CapCutPlayerPanel: React.FC<CapCutPlayerPanelProps> = ({
  scenes,
  selectedScene,
  isPlaying,
  onTogglePlay,
  currentTime,
  totalDuration,
  aspectRatio,
  setAspectRatio,
  onPrevScene,
  onNextScene,
  onStepFrame,
  onOpenMediaLibrary,
  brandOverlayConfig,
  previewMode = 'canvas',
  setPreviewMode,
  onToggleCurrentTicker,
  isMuted = false,
  setIsMuted,
  subtitles,
  subtitleBurnOptions,
}) => {
  const [internalMuted, setInternalMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [safeAreaMode, setSafeAreaMode] = useState<'none' | 'action_title' | 'social_9_16' | 'grid_3x3'>('none');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const effectiveMuted = isMuted !== undefined ? isMuted : internalMuted;
  const toggleMute = () => {
    if (setIsMuted) {
      setIsMuted(!effectiveMuted);
    } else {
      setInternalMuted(!internalMuted);
    }
  };

  // Find the exact active scene at currentTime using deterministic composition logic
  const activeSceneAtPlayhead = React.useMemo(() => {
    if (scenes.length === 0) return null;
    return getCompositionAtTime(scenes, currentTime).activeScene || scenes[scenes.length - 1] || null;
  }, [scenes, currentTime]);

  const displayedScene = activeSceneAtPlayhead || selectedScene;
  const isTickerActive = Boolean(displayedScene?.tickerConfig?.enabled);

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-[#06080d] flex flex-col h-full overflow-hidden select-none border-r border-slate-800/80 min-w-0"
    >
      {/* Top Header */}
      <div className="h-10 px-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#090c13] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            Viewport
          </span>
          <span className="px-2 py-0.5 bg-slate-800/90 text-[10px] font-mono font-bold text-cyan-400 rounded-md border border-slate-700/60">
            {aspectRatio}
          </span>
          {displayedScene && (
            <span className="text-[11px] text-slate-400 truncate max-w-[180px] bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
              {displayedScene.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Area Guides Selector */}
          <select
            value={safeAreaMode}
            onChange={(e) => setSafeAreaMode(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md px-2 py-1 text-[10px] font-medium text-slate-300 focus:outline-none cursor-pointer"
            title="Toggle Safe Area Overlay Guidelines"
          >
            <option value="none">Guides: Off</option>
            <option value="action_title">90/80 Action Safe</option>
            <option value="social_9_16">9:16 Social Margins</option>
            <option value="grid_3x3">3x3 Rule of Thirds</option>
          </select>

          {/* Quick Ticker Toggle */}
          {onToggleCurrentTicker && displayedScene && (
            <button
              onClick={onToggleCurrentTicker}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isTickerActive 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
              title={isTickerActive ? "Click to disable scrolling ticker" : "Click to enable scrolling ticker"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isTickerActive ? 'bg-rose-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Ticker: {isTickerActive ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {setPreviewMode && (
            <button
              onClick={() => setPreviewMode(previewMode === 'canvas' ? 'stage' : 'canvas')}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                previewMode === 'canvas' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {previewMode === 'canvas' ? 'Compositor' : 'Direct'}
            </button>
          )}

          <button
            onClick={handleFullscreen}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-[#06080d] to-[#06080d]">
        <div 
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/80 flex items-center justify-center border border-slate-800/80 transition-all duration-150"
          style={{
            aspectRatio: aspectRatio === '16:9' ? '16 / 9' : aspectRatio === '9:16' ? '9 / 16' : '1 / 1',
            height: '100%',
            width: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {scenes.length > 0 ? (
            previewMode === 'canvas' ? (
              <LivePreviewCanvas
                scenes={scenes}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTogglePlay={onTogglePlay}
                aspectRatio={aspectRatio}
                brandOverlayConfig={brandOverlayConfig}
                safeAreaMode={safeAreaMode}
                isMuted={effectiveMuted}
                playbackSpeed={playbackSpeed}
                subtitles={subtitles}
                subtitleBurnOptions={subtitleBurnOptions}
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
                {displayedScene?.mediaUrl ? (
                  displayedScene.mediaType === 'video' || displayedScene.mediaUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? (
                    <video
                      src={displayedScene.mediaUrl}
                      autoPlay={isPlaying}
                      muted={effectiveMuted}
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={displayedScene.mediaUrl}
                      alt={displayedScene.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <Film className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No media generated yet</p>
                  </div>
                )}

                {/* Subtitle / Text overlay */}
                {(displayedScene?.textOverlay || displayedScene?.textNepali) && (
                  <div className={`absolute left-0 right-0 px-4 text-center pointer-events-none ${
                    displayedScene.textPosition === 'top' ? 'top-6' : 
                    displayedScene.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-6'
                  }`}>
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-sm font-bold shadow-lg text-white">
                      {displayedScene.textNepali || displayedScene.textOverlay}
                    </span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center p-8 text-slate-600">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400">Timeline is empty</p>
              <p className="text-[11px] text-slate-600 mt-1">Import or generate media from the left panel to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Player Controller (CapCut Signature Dark Bar) */}
      <div className="h-11 bg-[#0a0d14] border-t border-slate-800/80 px-2.5 sm:px-4 flex items-center justify-between shrink-0 gap-2">
        {/* Timecode */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300 shrink-0">
          <span className="text-cyan-400">{formatTimecode(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onPrevScene}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Previous Scene (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {onStepFrame && (
            <button
              onClick={() => onStepFrame(-1)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition cursor-pointer hidden sm:inline-flex"
              title="Step -1 Frame (-0.033s)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer mx-0.5"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {onStepFrame && (
            <button
              onClick={() => onStepFrame(1)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition cursor-pointer hidden sm:inline-flex"
              title="Step +1 Frame (+0.033s)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onNextScene}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Next Scene (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Speed, Mute & Ratio */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Speed Selector */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-300">
            <span className="text-slate-500 mr-1 text-[10px]">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={e => setPlaybackSpeed(Number(e.target.value))}
              className="bg-transparent text-cyan-400 font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="0.5" className="bg-slate-900 text-white">0.5x</option>
              <option value="1" className="bg-slate-900 text-white">1.0x</option>
              <option value="1.5" className="bg-slate-900 text-white">1.5x</option>
              <option value="2" className="bg-slate-900 text-white">2.0x</option>
            </select>
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title={effectiveMuted ? "Unmute" : "Mute"}
          >
            {effectiveMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <select
            value={aspectRatio}
            onChange={e => setAspectRatio(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
      </div>
    </div>
  );
};
