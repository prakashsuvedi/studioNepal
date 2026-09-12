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
  Sliders,
  Terminal,
  AlertCircle,
  Eye
} from 'lucide-react';
import { HardwareAccelerationIndicator } from '../HardwareAccelerationIndicator';

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
  onOpenRenderPreview?: () => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onClearTimeline?: () => void;
  onImportProject?: () => void;
  onOpenStoryboards?: () => void;
  onOpenDebugger?: () => void;
  onOpenSocialPublisher?: () => void;
  errorCount?: number;
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
  onOpenRenderPreview,
  onSave,
  onNewProject,
  onClearTimeline,
  onImportProject,
  onOpenStoryboards,
  onOpenDebugger,
  onOpenSocialPublisher,
  errorCount = 0,
  autoSaveTime = 'Just now',
  scenesCount = 0,
}) => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <header className="h-12 bg-[#0a0d14] border-b border-slate-800/80 flex items-center justify-between px-3 select-none shrink-0 z-30 relative shadow-sm overflow-hidden gap-2">
      {/* Left: Brand, New Project, Menu & AutoSave */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
        {/* Editor Identifier Tag */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-slate-800/80">
          <div className="w-6 h-6 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <FileVideo className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-300 hidden sm:inline">
            Timeline Editor
          </span>
        </div>

        {/* New Project CTA */}
        {onNewProject && (
          <button 
            onClick={onNewProject}
            className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0"
            title="Start a new clean project"
          >
            <Plus className="w-3 h-3 text-slate-950 stroke-[3]" />
            <span className="hidden lg:inline">New</span>
          </button>
        )}

        {/* Menu Pill with Dropdown */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setShowMenuDropdown(!showMenuDropdown)}
            className="px-2 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[11px] font-medium border border-slate-800 transition flex items-center gap-0.5 cursor-pointer"
          >
            <span>Menu</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showMenuDropdown && (
            <div 
              className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-200"
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

              {onOpenRenderPreview && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenRenderPreview();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer text-cyan-300 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Real-Time Render Preview...</span>
                </button>
              )}

              {onOpenDebugger && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenDebugger();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer text-cyan-300"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rendering Debugger...</span>
                </button>
              )}

              {onOpenSocialPublisher && (
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    onOpenSocialPublisher();
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer text-rose-300 font-medium"
                >
                  <Share2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Social Publish Center...</span>
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

        {/* Hardware Acceleration Status Indicator */}
        <HardwareAccelerationIndicator 
          onOpenDebugger={onOpenDebugger}
          showNotificationBanner={false}
        />

        {/* Auto-save Status */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-slate-400 pl-2 border-l border-slate-800 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-slate-400">Saved: <span className="text-slate-300 font-mono">{autoSaveTime}</span></span>
        </div>
      </div>

      {/* Center: Editable Project Name */}
      <div className="flex-1 flex items-center justify-center min-w-0 mx-1.5 sm:mx-3">
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-slate-200 focus:text-white border border-transparent focus:border-slate-700 outline-none text-center transition w-28 sm:w-44 md:w-56 max-w-full truncate"
          title="Click to rename project"
        />
      </div>

      {/* Right: Actions, Aspect Ratio, Pro, Export */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
        {/* Rendering Debugger Fast Button */}
        {onOpenDebugger && (
          <button
            onClick={onOpenDebugger}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer border shrink-0 ${
              errorCount > 0
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800'
            }`}
            title="Open Media & Rendering Debugger Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden xl:inline">Debugger</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-slate-950 text-[9px] font-black">
                {errorCount}
              </span>
            )}
          </button>
        )}

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

        {/* Real-time Render Preview Quick Access */}
        {onOpenRenderPreview && (
          <button
            onClick={onOpenRenderPreview}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400 font-semibold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Open Real-time Render Preview Modal"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Preview</span>
          </button>
        )}

        {/* Social Publisher Suite Quick Access */}
        {onOpenSocialPublisher && (
          <button
            onClick={onOpenSocialPublisher}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500/60 font-semibold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Open Multi-Platform Social Publisher (YouTube, TikTok, Reels, X)"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Publish</span>
          </button>
        )}

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
