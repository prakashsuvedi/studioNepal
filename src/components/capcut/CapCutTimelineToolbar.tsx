import React, { useState } from 'react';
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
  MousePointer,
  Eye,
  Sliders,
  ChevronDown,
  FileText,
  Check
} from 'lucide-react';
import { ProjectWorkflowPresetId, ProjectWorkflowPreset, Scene } from '../../types';
import { WORKFLOW_PRESETS } from '../../data/workflowPresets';

interface CapCutTimelineToolbarProps {
  onSplitClip?: () => void;
  onDeleteClip?: () => void;
  onDuplicateClip?: () => void;
  onAddMedia?: () => void;
  onAddAudio?: () => void;
  onAddSceneTemplate?: () => void;
  onOpenRenderPreview?: () => void;
  onOpenBatchProcessor?: () => void;
  selectedWorkflowPresetId?: ProjectWorkflowPresetId;
  onSelectWorkflowPreset?: (preset: ProjectWorkflowPreset) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  isSnapping: boolean;
  setIsSnapping: (snap: boolean) => void;
  hasSelectedClip: boolean;
  selectedScene?: Scene | null;
  onUpdateSelectedScene?: (updated: Partial<Scene>) => void;
}

export const CapCutTimelineToolbar: React.FC<CapCutTimelineToolbarProps> = ({
  onSplitClip,
  onDeleteClip,
  onDuplicateClip,
  onAddMedia,
  onAddAudio,
  onAddSceneTemplate,
  onOpenRenderPreview,
  onOpenBatchProcessor,
  selectedWorkflowPresetId = 'documentary',
  onSelectWorkflowPreset,
  zoomLevel,
  setZoomLevel,
  isSnapping,
  setIsSnapping,
  hasSelectedClip,
  selectedScene,
  onUpdateSelectedScene,
}) => {
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const activePreset = WORKFLOW_PRESETS.find(p => p.id === selectedWorkflowPresetId) || WORKFLOW_PRESETS[0];

  return (
    <div className="h-10 bg-[#090c13] border-t border-b border-slate-800/80 px-3.5 flex items-center justify-between select-none shrink-0 text-xs relative z-30">
      {/* Left Edit Tools (CapCut Style) */}
      <div className="flex items-center gap-1.5">
        {/* Pointer Tool */}
        <button
          className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-md transition font-bold border border-cyan-500/30"
          title="Selection Tool (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        {/* Split / Blade */}
        <button
          onClick={onSplitClip}
          disabled={!hasSelectedClip}
          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer flex items-center gap-1"
          title="Split Clip at Playhead (Ctrl+B)"
        >
          <Scissors className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-semibold">Split</span>
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

        {/* Selected Clip Quick Duration & Speed Controls */}
        {hasSelectedClip && selectedScene && onUpdateSelectedScene && (
          <>
            <div className="h-4 w-px bg-slate-800 mx-1"></div>
            
            {/* Duration Adjuster */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded-md border border-cyan-500/30 text-[11px]">
              <span className="text-slate-400 font-medium">Len:</span>
              <button
                onClick={() => {
                  const newDur = Math.max(0.5, Number((selectedScene.duration - 0.5).toFixed(1)));
                  onUpdateSelectedScene({ duration: newDur });
                }}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 rounded font-bold transition cursor-pointer text-[10px]"
                title="Decrease clip length by 0.5s"
              >
                -0.5s
              </button>
              <span className="font-mono text-cyan-300 font-bold px-1 min-w-[32px] text-center">
                {selectedScene.duration.toFixed(1)}s
              </span>
              <button
                onClick={() => {
                  const newDur = Number((selectedScene.duration + 0.5).toFixed(1));
                  onUpdateSelectedScene({ duration: newDur });
                }}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 rounded font-bold transition cursor-pointer text-[10px]"
                title="Increase clip length by 0.5s"
              >
                +0.5s
              </button>
            </div>

            {/* Clip Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded-md border border-cyan-500/30 text-[11px]">
              <span className="text-slate-400 font-medium">Speed:</span>
              <select
                value={selectedScene.speed || selectedScene.playbackRate || 1}
                onChange={(e) => {
                  const spd = parseFloat(e.target.value);
                  onUpdateSelectedScene({ speed: spd, playbackRate: spd });
                }}
                className="bg-slate-950 text-cyan-300 font-bold border border-slate-700/80 rounded px-1 py-0.5 text-[10px] cursor-pointer focus:outline-hidden focus:border-cyan-400"
                title="Change playback speed of this clip"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* Quick Add Buttons */}
        {onAddMedia && (
          <button
            onClick={onAddMedia}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Film className="w-3 h-3 text-cyan-400" />
            <span>+ Media</span>
          </button>
        )}

        {onAddAudio && (
          <button
            onClick={onAddAudio}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Music className="w-3 h-3 text-purple-400" />
            <span>+ Audio</span>
          </button>
        )}

        {onOpenBatchProcessor && (
          <button
            onClick={onOpenBatchProcessor}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 border border-cyan-500/40 rounded-md text-[11px] font-semibold transition cursor-pointer shadow-xs"
            title="Batch Scene Processor: Break Long Script into Scenes"
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline font-bold">Batch Script</span>
          </button>
        )}

        {onAddSceneTemplate && (
          <button
            onClick={onAddSceneTemplate}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[11px] font-semibold transition cursor-pointer"
          >
            <LayoutTemplate className="w-3 h-3 text-amber-400" />
            <span>+ Template</span>
          </button>
        )}

        {onOpenRenderPreview && (
          <button
            onClick={onOpenRenderPreview}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 rounded-md text-[11px] font-semibold transition cursor-pointer shadow-xs"
            title="Real-Time Render Preview with Timeline Simulation"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>Render Preview</span>
          </button>
        )}
      </div>

      {/* Center/Right: Project Workflow Preset Selector & Timeline Utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Workflow Preset Selector Dropdown */}
        {onSelectWorkflowPreset && (
          <div className="relative">
            <button
              onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-md text-[11px] font-semibold transition cursor-pointer"
              title="Select Project Workflow Preset"
            >
              <span>{activePreset.icon}</span>
              <span className="font-bold text-cyan-300 hidden md:inline">{activePreset.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isPresetDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-64 bg-[#0d121f] border border-slate-700/90 rounded-xl shadow-2xl p-1.5 space-y-1 z-50 text-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Project Workflow Presets</span>
                  <span className="text-cyan-400 font-mono text-[9px]">Auto Layout</span>
                </div>

                {WORKFLOW_PRESETS.map((preset) => {
                  const isSelected = preset.id === activePreset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSelectWorkflowPreset(preset);
                        setIsPresetDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start justify-between text-xs transition cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base">{preset.icon}</span>
                        <div>
                          <div className="font-bold text-[11px] text-white flex items-center gap-1.5">
                            <span>{preset.name}</span>
                            <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded font-mono">
                              {preset.aspectRatio}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                            {preset.nameNepali}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Magnet Snapping Toggle */}
        <button
          onClick={() => setIsSnapping(!isSnapping)}
          className={`p-1.5 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
            isSnapping 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-xs shadow-cyan-500/20' 
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
          title="Toggle Magnetic Snapping (Clips snap to playhead & edges)"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isSnapping ? 'Snap: ON' : 'Snap'}</span>
        </button>

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800/80">
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
            className="w-16 sm:w-24 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
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
