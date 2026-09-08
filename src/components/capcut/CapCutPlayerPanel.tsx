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
  Monitor
} from 'lucide-react';
import { Scene, BrandOverlayConfig } from '../../types';
import { LivePreviewCanvas } from '../LivePreviewCanvas';

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
  brandOverlayConfig?: BrandOverlayConfig;
  previewMode?: 'canvas' | 'stage';
  setPreviewMode?: (mode: 'canvas' | 'stage') => void;
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
  brandOverlayConfig,
  previewMode = 'canvas',
  setPreviewMode,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      className="flex-1 bg-[#07090e] flex flex-col h-full overflow-hidden select-none border-r border-slate-800/80"
    >
      {/* Top Header */}
      <div className="h-9 px-3 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0d14] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Player - Master 01</span>
          <span className="px-1.5 py-0.2 bg-slate-800 text-[10px] font-mono font-bold text-cyan-400 rounded">
            {aspectRatio}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {setPreviewMode && (
            <button
              onClick={() => setPreviewMode(previewMode === 'canvas' ? 'stage' : 'canvas')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                previewMode === 'canvas' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {previewMode === 'canvas' ? 'Canvas Engine' : 'Stage Mode'}
            </button>
          )}

          <button
            onClick={handleFullscreen}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        <div 
          className={`relative bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center border border-slate-800/80 ${
            aspectRatio === '16:9' 
              ? 'w-full aspect-video max-w-3xl' 
              : aspectRatio === '9:16'
              ? 'h-full aspect-[9/16] max-h-[500px]'
              : 'h-full aspect-square max-h-[460px]'
          }`}
        >
          {scenes.length > 0 ? (
            previewMode === 'canvas' ? (
              <LivePreviewCanvas
                scenes={scenes}
                currentTime={currentTime}
                totalDuration={totalDuration}
                aspectRatio={aspectRatio}
                brandOverlayConfig={brandOverlayConfig}
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
                {selectedScene?.mediaUrl ? (
                  selectedScene.mediaType === 'video' || selectedScene.mediaUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? (
                    <video
                      src={selectedScene.mediaUrl}
                      autoPlay={isPlaying}
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={selectedScene.mediaUrl}
                      alt={selectedScene.title}
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
                {(selectedScene?.textOverlay || selectedScene?.textNepali) && (
                  <div className={`absolute left-0 right-0 px-4 text-center pointer-events-none ${
                    selectedScene.textPosition === 'top' ? 'top-6' : 
                    selectedScene.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-6'
                  }`}>
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-sm font-bold shadow-lg text-white">
                      {selectedScene.textNepali || selectedScene.textOverlay}
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
      <div className="h-11 bg-[#0a0d14] border-t border-slate-800/80 px-4 flex items-center justify-between shrink-0">
        {/* Timecode */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300">
          <span className="text-cyan-400">{formatTimecode(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevScene}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Previous Scene (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onNextScene}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Next Scene (End)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools: Mute & Ratio */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <select
            value={aspectRatio}
            onChange={e => setAspectRatio(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
