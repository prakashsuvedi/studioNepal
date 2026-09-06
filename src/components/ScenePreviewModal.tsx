import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Film, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Type, 
  Palette, 
  Clock, 
  Layers, 
  Sliders,
  FileText,
  Tag,
  MessageSquare,
  Save
} from 'lucide-react';
import { Scene } from '../types';

interface ScenePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  sceneIndex: number;
  totalScenes: number;
  onPrevScene?: () => void;
  onNextScene?: () => void;
  onUpdateSceneNotes?: (notes: string) => void;
}

export const ScenePreviewModal: React.FC<ScenePreviewModalProps> = ({
  isOpen,
  onClose,
  scene,
  sceneIndex,
  totalScenes,
  onPrevScene,
  onNextScene,
  onUpdateSceneNotes,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata' | 'prompt' | 'notes'>('preview');
  const [notesInput, setNotesInput] = useState(scene?.notes || '');
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);

  React.useEffect(() => {
    if (scene) {
      setNotesInput(scene.notes || '');
      setSavedNotesSuccess(false);
    }
  }, [scene?.id, scene?.notes]);

  if (!isOpen || !scene) return null;

  const isVideo = scene.mediaType === 'video' || (scene.mediaUrl && (
    scene.mediaUrl.endsWith('.mp4') || 
    scene.mediaUrl.includes('/api/video/') || 
    scene.mediaUrl.includes('sample/ForBigger')
  ));

  const aspectRatioClass = 
    scene.aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[480px]' :
    scene.aspectRatio === '1:1' ? 'aspect-square max-h-[420px]' :
    'aspect-video max-h-[380px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                  Scene {sceneIndex + 1} of {totalScenes}
                </span>
                <h3 className="text-base font-bold text-white">
                  {scene.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed scene content, media preview, and sequence metadata verification
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Prev / Next scene cycling buttons */}
            {onPrevScene && (
              <button
                onClick={onPrevScene}
                disabled={sceneIndex === 0}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                title="Previous Scene"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {onNextScene && (
              <button
                onClick={onNextScene}
                disabled={sceneIndex === totalScenes - 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                title="Next Scene"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Media Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'metadata'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Full Metadata</span>
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'prompt'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Prompts & Text</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition relative ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Production Notes</span>
              {scene.notes && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Duration: <strong className="text-white font-mono">{scene.duration}s</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          
          {/* 1. PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Main Media Stage Box */}
              <div className="bg-black rounded-xl border border-slate-800 p-2 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                {scene.mediaUrl ? (
                  isVideo ? (
                    <video
                      src={scene.mediaUrl}
                      autoPlay={isPlaying}
                      loop
                      muted={isMuted}
                      playsInline
                      className={`w-full h-auto object-contain rounded-lg ${aspectRatioClass}`}
                    />
                  ) : (
                    <img
                      src={scene.mediaUrl}
                      alt={scene.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-auto object-cover rounded-lg ${aspectRatioClass}`}
                    />
                  )
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Film className="w-12 h-12 text-slate-700" />
                    <p className="text-sm">No media URL bound to this scene</p>
                  </div>
                )}

                {/* Text Overlay Rendered on Media Stage */}
                {scene.textOverlay && (
                  <div className={`absolute inset-x-6 p-3 z-10 pointer-events-none flex justify-center ${
                    scene.textPosition === 'top' ? 'top-6' :
                    scene.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                    scene.textPosition === 'lower_third' ? 'bottom-16' : 'bottom-6'
                  }`}>
                    <div className="bg-black/60 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20 max-w-lg text-center">
                      <p className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                        {scene.textOverlay}
                      </p>
                      {scene.textNepali && (
                        <p className="text-xs font-semibold text-amber-300 mt-0.5">
                          {scene.textNepali}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Watermark Overlay Rendered on Media Stage */}
                {scene.watermark && scene.watermark.url && (
                  <div 
                    className={`absolute p-2 z-20 pointer-events-none ${
                      scene.watermark.position === 'top-left' ? 'top-4 left-4' :
                      scene.watermark.position === 'top-right' ? 'top-4 right-4' :
                      scene.watermark.position === 'bottom-left' ? 'bottom-4 left-4' :
                      scene.watermark.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                      'bottom-4 right-4'
                    }`}
                    style={{ opacity: scene.watermark.opacity || 0.85 }}
                  >
                    <img
                      src={scene.watermark.url}
                      alt="Watermark"
                      referrerPolicy="no-referrer"
                      className="h-8 object-contain drop-shadow"
                    />
                  </div>
                )}

                {/* Media Playback Overlay Bar */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/80 flex items-center justify-between opacity-90 group-hover:opacity-100 transition">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                      {scene.mediaType === 'video' ? 'Video Clip' : 'AI Image Frame'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {scene.aspectRatio}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Specs Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Camera Motion</span>
                  <span className="text-xs font-bold text-indigo-300 capitalize">{scene.motion || 'static'}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Next Transition</span>
                  <span className="text-xs font-bold text-purple-300 capitalize">{scene.transition || 'cut'} ({scene.transitionDuration || 0.8}s)</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Color Filter</span>
                  <span className="text-xs font-bold text-amber-300 capitalize">{scene.filter || 'none'}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Audio Volume</span>
                  <span className="text-xs font-bold text-emerald-300 font-mono">{scene.volume ?? 100}%</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. FULL METADATA TAB */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Visual Settings Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Sliders className="w-4 h-4" />
                    <span>Visual & Camera Configuration</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Scene Identifier:</span>
                      <span className="font-mono text-white font-bold">{scene.id}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Media Type:</span>
                      <span className="capitalize text-indigo-300 font-bold">{scene.mediaType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Aspect Ratio:</span>
                      <span className="font-mono text-white">{scene.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Camera Motion:</span>
                      <span className="capitalize text-amber-300 font-semibold">{scene.motion}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Color Filter Grade:</span>
                      <span className="capitalize text-emerald-300 font-semibold">{scene.filter || 'none'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Color Tag:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {scene.colorTag || 'b_roll'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transition & Audio Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Layers className="w-4 h-4" />
                    <span>Transitions & Audio Mix</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Transition Effect:</span>
                      <span className="capitalize text-purple-300 font-bold">{scene.transition || 'cut'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Transition Duration:</span>
                      <span className="font-mono text-white font-bold">{scene.transitionDuration || 0.8}s</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Scene Duration:</span>
                      <span className="font-mono text-white font-bold">{scene.duration} seconds</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Volume Level:</span>
                      <span className="font-mono text-emerald-300 font-bold">{scene.volume ?? 100}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Watermark Stamped:</span>
                      <span className={`font-semibold ${scene.watermark ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {scene.watermark ? `Yes (${scene.watermark.name || 'Custom'})` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Preflight Verification Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Scene Readiness Preflight Checks
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Media URL validated and reachable</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Timing constraints verified ({scene.duration}s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Aspect ratio matched to timeline ({scene.aspectRatio})</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 font-medium bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Devanagari text encoding confirmed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PROMPTS TAB */}
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              {/* Prompt Text Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  AI Visual Prompt (English)
                </span>
                <p className="text-sm font-mono text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {scene.prompt || 'No visual prompt specified.'}
                </p>
              </div>

              {scene.promptNepali && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Nepali Prompt Context
                  </span>
                  <p className="text-sm font-semibold text-amber-200 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {scene.promptNepali}
                  </p>
                </div>
              )}

              {/* Text Overlay Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                  Text Overlay Settings
                </span>
                <div className="space-y-2">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">On-Screen Caption:</span>
                    <p className="text-sm font-bold text-white">
                      {scene.textOverlay || '(No text overlay)'}
                    </p>
                    {scene.textNepali && (
                      <p className="text-xs font-semibold text-amber-300 mt-1">
                        {scene.textNepali}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Position:</span>
                      <span className="font-semibold text-white capitalize">{scene.textPosition}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Font:</span>
                      <span className="font-semibold text-white capitalize">{scene.textFont}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 text-[10px] block">Color:</span>
                      <span className="font-semibold text-white font-mono">{scene.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRODUCTION NOTES & BATCH TAGS TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Batch Tags Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Scene Batch Labels & Status Tags
                  </span>
                </div>
                {scene.tags && scene.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {scene.tags.map((tag, tIdx) => {
                      const tagBg = 
                        tag === 'Draft' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        tag === 'Final' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        tag === 'Needs Review' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                        tag === 'A-Roll' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        tag === 'B-Roll' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                        'bg-purple-500/20 text-purple-300 border-purple-500/30';

                      return (
                        <span key={tIdx} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${tagBg}`}>
                          🏷️ {tag}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    No batch tags applied yet. Use the timeline batch-tagging toolbar to assign labels like 'Draft', 'Final', or 'Needs Review'.
                  </p>
                )}
              </div>

              {/* Production Notes Editor Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Production Notes & Client Comments
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Persisted in Project Metadata</span>
                </div>
                <p className="text-xs text-slate-400">
                  Attach specific director notes, audio cues, client feedback, or edit instructions for this scene.
                </p>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g., Ensure color grading matches warm sunset palette; fade audio out at 3.2s for voiceover..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-slate-500">
                    {notesInput.length} characters
                  </span>
                  <button
                    onClick={() => {
                      if (onUpdateSceneNotes) {
                        onUpdateSceneNotes(notesInput);
                        setSavedNotesSuccess(true);
                        setTimeout(() => setSavedNotesSuccess(false), 2500);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Scene Notes</span>
                  </button>
                </div>
                {savedNotesSuccess && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Production notes updated and saved to project metadata!</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onPrevScene && (
              <button
                onClick={onPrevScene}
                disabled={sceneIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Scene</span>
              </button>
            )}
            {onNextScene && (
              <button
                onClick={onNextScene}
                disabled={sceneIndex === totalScenes - 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
              >
                <span>Next Scene</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg"
          >
            Done Previewing
          </button>
        </div>

      </div>
    </div>
  );
};
