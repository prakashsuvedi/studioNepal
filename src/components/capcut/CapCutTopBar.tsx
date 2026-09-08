import React, { useState } from 'react';
import { 
  Sparkles, 
  Share2, 
  Download, 
  Save, 
  RotateCcw, 
  RotateCw, 
  Monitor, 
  Smartphone, 
  Square,
  CheckCircle2,
  ChevronDown,
  Layers,
  Crown,
  Settings,
  HelpCircle,
  FileVideo,
  Plus,
  Trash2,
  FolderOpen,
  LayoutTemplate,
  Sliders
} from 'lucide-react';

interface CapCutTopBarProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  aspectRatio: '16:9' | '9:16' | '1:1';
  setAspectRatio: (ratio: '16:9' | '9:16' | '1:1') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onClearTimeline?: () => void;
  onImportProject?: () => void;
  onOpenStoryboards?: () => void;
  autoSaveTime?: string;
  scenesCount?: number;
}

export const CapCutTopBar: React.FC<CapCutTopBarProps> = ({
  projectTitle,
  setProjectTitle,
  aspectRatio,
  setAspectRatio,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onSave,
  onNewProject,
  onClearTimeline,
  onImportProject,
  onOpenStoryboards,
  autoSaveTime = 'Just now',
  scenesCount = 0,
}) => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <header className="h-12 bg-[#0c0f17] border-b border-slate-800/80 flex items-center justify-between px-3 select-none shrink-0 z-30 relative">
      {/* Left: Brand, New Project, Menu & AutoSave */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand Tag */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <FileVideo className="w-3.5 h-3.5 text-slate-950 font-black" />
          </div>
          <span className="font-bold text-xs tracking-tight text-white flex items-center gap-1">
            NepalAI <span className="text-cyan-400 font-extrabold">Studio</span>
          </span>
        </div>

        {/* New Project CTA */}
        {onNewProject && (
          <button 
            onClick={onNewProject}
            className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-[11px] font-bold transition flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
            title="Start a new clean project"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}

        {/* Menu Pill with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-medium border border-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Menu</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showMenuDropdown && (
            <div 
              className="absolute left-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-200"
              onMouseLeave={() => setShowMenuDropdown(false)}
            >
              {onNewProject && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onNewProject();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 text-cyan-300 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>New Project...</span>
                </button>
              )}

              {onImportProject && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onImportProject();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Project JSON</span>
                </button>
              )}

              {onSave && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onSave();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Project (Ctrl+S)</span>
                </button>
              )}

              {onOpenStoryboards && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenStoryboards();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Storyboard Wizard</span>
                </button>
              )}

              <div className="h-px bg-slate-800 my-1"></div>

              {onClearTimeline && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onClearTimeline();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950/40 text-rose-300 rounded flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All Timeline Clips</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Auto-save Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 pl-2 border-l border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-slate-400">Auto saved: <span className="text-slate-300 font-mono">{autoSaveTime}</span></span>
        </div>
      </div>

      {/* Center: Editable Project Name */}
      <div className="flex items-center gap-2 max-w-sm">
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 px-3 py-1 rounded-md text-xs font-semibold text-slate-200 focus:text-white border border-transparent focus:border-slate-700 outline-none text-center transition w-36 sm:w-56 truncate"
          title="Click to rename project"
        />
      </div>

      {/* Right: Actions, Aspect Ratio, Pro, Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800/80 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800/80 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center bg-slate-900/90 rounded-md p-0.5 border border-slate-800">
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] font-bold transition cursor-pointer ${
              aspectRatio === '16:9' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Landscape 16:9 (YouTube / TV)"
          >
            16:9
          </button>
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] font-bold transition cursor-pointer ${
              aspectRatio === '9:16' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Portrait 9:16 (TikTok / Reels / Shorts)"
          >
            9:16
          </button>
          <button
            onClick={() => setAspectRatio('1:1')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] font-bold transition cursor-pointer ${
              aspectRatio === '1:1' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Square 1:1 (Instagram Post)"
          >
            1:1
          </button>
        </div>

        {/* Export Button (CapCut Signature Cyan CTA) */}
        <button
          onClick={onExport}
          className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-md shadow-md shadow-cyan-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
