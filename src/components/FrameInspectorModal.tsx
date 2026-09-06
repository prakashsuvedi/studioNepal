import React, { useState, useEffect } from 'react';
import { 
  Crosshair, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Scissors, 
  Clock, 
  Check, 
  X as XIcon, 
  Maximize2, 
  Sliders, 
  Grid,
  Play,
  Pause,
  ArrowRight
} from 'lucide-react';
import { Scene } from '../types';

export interface FrameInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onUpdateSceneDuration: (sceneId: string, newDurationSec: number) => void;
  onSplitSceneAtTime?: (sceneId: string, splitTimeSec: number) => void;
}

export const FrameInspectorModal: React.FC<FrameInspectorModalProps> = ({
  isOpen,
  onClose,
  scene,
  onUpdateSceneDuration,
  onSplitSceneAtTime,
}) => {
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [inFrameIndex, setInFrameIndex] = useState<number>(0);
  const [outFrameIndex, setOutFrameIndex] = useState<number>(0);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [isPlayingFrames, setIsPlayingFrames] = useState<boolean>(false);

  useEffect(() => {
    if (scene) {
      const total = Math.max(1, Math.round(scene.duration * fps));
      setCurrentFrameIndex(0);
      setInFrameIndex(0);
      setOutFrameIndex(total);
    }
  }, [scene, fps]);

  // Frame Playback Loop
  useEffect(() => {
    if (!isPlayingFrames || !scene) return;
    const total = Math.max(1, Math.round(scene.duration * fps));
    const intervalMs = 1000 / fps;

    const timer = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= outFrameIndex || prev >= total - 1) {
          return inFrameIndex;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlayingFrames, scene, fps, inFrameIndex, outFrameIndex]);

  if (!isOpen || !scene) return null;

  const totalFrames = Math.max(1, Math.round(scene.duration * fps));
  const frameTimeSec = Number((currentFrameIndex / fps).toFixed(3));

  const formatTimecode = (frameIdx: number) => {
    const totalSec = frameIdx / fps;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const frames = Math.floor(frameIdx % fps);

    const pad = (num: number) => String(num).padStart(2, '0');
    return `00:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const handleSetInPoint = () => {
    if (currentFrameIndex < outFrameIndex) {
      setInFrameIndex(currentFrameIndex);
    }
  };

  const handleSetOutPoint = () => {
    if (currentFrameIndex > inFrameIndex) {
      setOutFrameIndex(currentFrameIndex);
    }
  };

  const handleApplyTrim = () => {
    const trimmedFrames = outFrameIndex - inFrameIndex;
    if (trimmedFrames <= 0) return;
    const newSec = Number((trimmedFrames / fps).toFixed(2));
    onUpdateSceneDuration(scene.id, Math.max(0.5, newSec));
    onClose();
  };

  const handleSplitAtCurrentFrame = () => {
    if (!onSplitSceneAtTime || frameTimeSec <= 0.2 || frameTimeSec >= scene.duration - 0.2) return;
    onSplitSceneAtTime(scene.id, frameTimeSec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-800/80 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-600/30 border border-sky-500/40 text-sky-400">
              <Crosshair className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Precision Frame Inspector & Cut Point Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] uppercase font-bold">
                  {fps} FPS Precision
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Step frame-by-frame through scene "{scene.title}", set frame-exact in/out cut points, or split composition cleanly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">

          {/* Top Inspector Status Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            
            {/* FPS Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Frame Rate Standard:</span>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                {[24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setFps(rate as any)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                      fps === rate
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* Timecode & Frame Counter */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-300 font-bold">{formatTimecode(currentFrameIndex)}</span>
              </div>

              <div className="text-slate-400">
                Frame <span className="text-white font-bold">{currentFrameIndex + 1}</span> / {totalFrames} ({frameTimeSec}s)
              </div>
            </div>

            {/* Overlay Grid Toggle */}
            <button
              onClick={() => setShowGridOverlay(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                showGridOverlay
                  ? 'bg-sky-950 border-sky-500 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Inspection Grid</span>
            </button>
          </div>

          {/* Main Visual Frame Inspector Canvas */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-sky-500/40 shadow-2xl flex items-center justify-center group">
            
            {/* Media Image / Video */}
            {scene.mediaUrl ? (
              <img
                src={scene.mediaUrl}
                alt={scene.title}
                className="w-full h-full object-cover transition-all"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                No Media Available
              </div>
            )}

            {/* Crosshair / Inspection Grid Overlay */}
            {showGridOverlay && (
              <div className="absolute inset-0 border border-sky-500/30 pointer-events-none flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/3 border-b border-sky-500/20" />
                <div className="absolute inset-x-0 top-2/3 border-b border-sky-500/20" />
                <div className="absolute inset-y-0 left-1/3 border-r border-sky-500/20" />
                <div className="absolute inset-y-0 left-2/3 border-r border-sky-500/20" />
                
                <div className="w-12 h-12 rounded-full border border-sky-400/60 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                </div>
              </div>
            )}

            {/* In/Out Trim Indicators */}
            <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-[10px] font-mono space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>IN POINT:</span>
                <span className="font-bold">{formatTimecode(inFrameIndex)}</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400">
                <span>OUT POINT:</span>
                <span className="font-bold">{formatTimecode(outFrameIndex)}</span>
              </div>
            </div>

            {/* Center Playback Overlay Badge */}
            <span className="absolute bottom-3 right-3 bg-slate-950/90 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-sky-300">
              FRAME STEPPER ACTIVE ({fps} FPS)
            </span>
          </div>

          {/* Frame Stepper Navigation Toolbar */}
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            
            {/* Timeline Frame Scrub Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>00:00:00:00</span>
                <span className="text-sky-300 font-bold">{formatTimecode(currentFrameIndex)}</span>
                <span>{formatTimecode(totalFrames)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={totalFrames - 1}
                value={currentFrameIndex}
                onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Stepper Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentFrameIndex(0)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                  title="First Frame"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentFrameIndex(prev => Math.max(0, prev - 5))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition"
                >
                  -5f
                </button>
                <button
                  onClick={() => setCurrentFrameIndex(prev => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 hover:bg-sky-900 text-sky-200 text-xs font-mono font-bold transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>-1 Frame</span>
                </button>
              </div>

              {/* Play Pause Frame Preview */}
              <button
                onClick={() => setIsPlayingFrames(prev => !prev)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                {isPlayingFrames ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingFrames ? 'Pause Stepper' : 'Play Sequence'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentFrameIndex(prev => Math.min(totalFrames - 1, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-800 hover:bg-sky-900 text-sky-200 text-xs font-mono font-bold transition flex items-center gap-1"
                >
                  <span>+1 Frame</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentFrameIndex(prev => Math.min(totalFrames - 1, prev + 5))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition"
                >
                  +5f
                </button>
                <button
                  onClick={() => setCurrentFrameIndex(totalFrames - 1)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
                  title="Last Frame"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Precision In / Out & Split Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900">
              <button
                onClick={handleSetInPoint}
                className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>[ Set In-Point ({formatTimecode(currentFrameIndex)})</span>
              </button>

              <button
                onClick={handleSetOutPoint}
                className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 hover:bg-rose-900 text-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Set Out-Point ({formatTimecode(currentFrameIndex)}) ]</span>
              </button>

              {onSplitSceneAtTime && (
                <button
                  onClick={handleSplitAtCurrentFrame}
                  className="p-2 rounded-lg bg-sky-950/80 border border-sky-500/40 hover:bg-sky-900 text-sky-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5 text-sky-400" />
                  <span>Split Cut at Frame</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            New Trimmed Duration: <strong className="text-sky-300">{((outFrameIndex - inFrameIndex) / fps).toFixed(2)}s</strong> ({outFrameIndex - inFrameIndex} frames)
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyTrim}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-950 flex items-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Trimmed Cut Points</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
