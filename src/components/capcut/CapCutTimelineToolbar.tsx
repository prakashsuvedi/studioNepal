import React from 'react';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Magnet, 
  Maximize2, 
  RotateCcw, 
  RotateCw, 
  Sparkles, 
  Plus, 
  LayoutTemplate, 
  Layers, 
  Music, 
  Film,
  MousePointer
} from 'lucide-react';

interface CapCutTimelineToolbarProps {
  onSplitClip?: () => void;
  onDeleteClip?: () => void;
  onDuplicateClip?: () => void;
  onAddMedia?: () => void;
  onAddAudio?: () => void;
  onAddSceneTemplate?: () => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  isSnapping: boolean;
  setIsSnapping: (snap: boolean) => void;
  hasSelectedClip: boolean;
}

export const CapCutTimelineToolbar: React.FC<CapCutTimelineToolbarProps> = ({
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  onAddMedia,
  onAddAudio,
  onAddSceneTemplate,
  zoomLevel,
  setZoomLevel,
  isSnapping,
  setIsSnapping,
  hasSelectedClip,
}) => {
  return (
    <div className="h-10 bg-[#0c0f17] border-t border-b border-slate-800/80 px-4 flex items-center justify-between select-none shrink-0 text-xs">
      {/* Left Edit Tools (CapCut Style) */}
      <div className="flex items-center gap-1">
        {/* Pointer Tool */}
        <button
          className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-md transition font-bold"
          title="Selection Tool (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        {/* Split / Blade */}
        <button
          onClick={onSplitClip}
          disabled={!hasSelectedClip}
          className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-md hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
          title="Split Clip at Playhead (Ctrl+B)"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Split</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteClip}
          disabled={!hasSelectedClip}
          className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded-md hover:bg-slate-800 transition cursor-pointer"
          title="Delete Clip (Del)"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicateClip}
          disabled={!hasSelectedClip}
          className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-md hover:bg-slate-800 transition cursor-pointer"
          title="Duplicate Clip (Ctrl+D)"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Quick Add Buttons */}
        {onAddMedia && (
          <button
            onClick={onAddMedia}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Film className="w-3 h-3 text-cyan-400" />
            <span>+ Media</span>
          </button>
        )}

        {onAddAudio && (
          <button
            onClick={onAddAudio}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Music className="w-3 h-3 text-purple-400" />
            <span>+ Audio</span>
          </button>
        )}

        {onAddSceneTemplate && (
          <button
            onClick={onAddSceneTemplate}
            className="hidden md:flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[11px] font-semibold transition cursor-pointer"
          >
            <LayoutTemplate className="w-3 h-3 text-amber-400" />
            <span>+ Template</span>
          </button>
        )}
      </div>

      {/* Right Controls: Snapping & Zoom Slider */}
      <div className="flex items-center gap-3">
        {/* Magnet Snapping */}
        <button
          onClick={() => setIsSnapping(!isSnapping)}
          className={`p-1.5 rounded-md transition cursor-pointer ${
            isSnapping 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Clip Snapping (N)"
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel(Math.max(10, zoomLevel - 8))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Zoom Out Timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="12"
            max="60"
            value={zoomLevel}
            onChange={e => setZoomLevel(Number(e.target.value))}
            className="w-20 sm:w-28 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            title="Timeline Scale"
          />

          <button
            onClick={() => setZoomLevel(Math.min(60, zoomLevel + 8))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Zoom In Timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
