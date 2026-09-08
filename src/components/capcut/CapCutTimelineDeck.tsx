import React, { useRef, useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Film, 
  Music, 
  Type, 
  Plus, 
  Sparkles, 
  MessageSquare, 
  GripVertical, 
  Scissors,
  Trash2,
  Copy,
  Upload,
  Zap,
  LayoutTemplate,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import { Scene, AudioTrack } from '../../types';

interface CapCutTimelineDeckProps {
  scenes: Scene[];
  selectedSceneId: string;
  onSelectScene: (id: string) => void;
  onReorderScenes: (scenes: Scene[]) => void;
  onUpdateScene?: (sceneId: string, updated: Partial<Scene>) => void;
  onDeleteScene?: (sceneId: string) => void;
  onDuplicateScene?: (sceneId: string) => void;
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  zoomLevel: number;
  audioTracks: AudioTrack[];
  selectedAudioId: string;
  onSelectAudioId: (id: string) => void;
  voTrack?: AudioTrack;
  onAddMedia?: () => void;
  onAddAudio?: () => void;
  onOpenSceneTemplates?: () => void;
  onOpenImageStudio?: () => void;
  onOpenSoraStudio?: () => void;
}

export const CapCutTimelineDeck: React.FC<CapCutTimelineDeckProps> = ({
  scenes,
  selectedSceneId,
  onSelectScene,
  onReorderScenes,
  onUpdateScene,
  onDeleteScene,
  onDuplicateScene,
  currentTime,
  totalDuration,
  onSeek,
  zoomLevel,
  audioTracks,
  selectedAudioId,
  onSelectAudioId,
  voTrack,
  onAddMedia,
  onAddAudio,
  onOpenSceneTemplates,
  onOpenImageStudio,
  onOpenSoraStudio,
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [draggedSceneIdx, setDraggedSceneIdx] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Trimming State (resizing clip duration by dragging right edge handle)
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartDuration, setResizeStartDuration] = useState<number>(0);

  // Audio mute states
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [isVoMuted, setIsVoMuted] = useState(false);

  const pixelsPerSecond = Math.max(12, zoomLevel);
  const timelineWidth = Math.max(800, Math.ceil(totalDuration * pixelsPerSecond) + 360);

  // Ruler markings
  const rulerIntervalSeconds = pixelsPerSecond > 35 ? 1 : pixelsPerSecond > 20 ? 2 : 5;
  const numRulerTicks = Math.ceil((Math.max(totalDuration, 15) + 5) / rulerIntervalSeconds);

  // Mouse scrubbing handler
  const handleSeekFromEvent = (e: MouseEvent | React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetTime = Math.max(0, Math.min(totalDuration, clickX / pixelsPerSecond));
    onSeek(targetTime);
  };

  const handleMouseDownOnRuler = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleSeekFromEvent(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        handleSeekFromEvent(e);
      } else if (resizingClipId && onUpdateScene) {
        const deltaPx = e.clientX - resizeStartX;
        const deltaSec = deltaPx / pixelsPerSecond;
        const newDur = Math.max(0.5, Math.min(60, Number((resizeStartDuration + deltaSec).toFixed(1))));
        onUpdateScene(resizingClipId, { duration: newDur });
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setResizingClipId(null);
    };

    if (isScrubbing || resizingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, resizingClipId, resizeStartX, resizeStartDuration, pixelsPerSecond, totalDuration]);

  // Drag-and-drop scene reordering
  const handleDragStart = (idx: number) => {
    setDraggedSceneIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedSceneIdx === null || draggedSceneIdx === targetIdx) return;
    const updated = [...scenes];
    const item = updated.splice(draggedSceneIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setDraggedSceneIdx(targetIdx);
    onReorderScenes(updated);
  };

  const handleDragEnd = () => {
    setDraggedSceneIdx(null);
  };

  return (
    <div className="flex-1 bg-[#090b12] flex overflow-hidden select-none relative">
      {/* 1. Left Track Headers Dock (CapCut Desktop Studio Style) */}
      <div className="w-44 sm:w-48 bg-[#0c0e17] border-r border-slate-800/90 flex flex-col shrink-0 z-20 shadow-lg">
        {/* Ruler Corner Spacer */}
        <div className="h-7 border-b border-slate-800/80 px-3 flex items-center justify-between text-[10px] font-bold text-slate-400 bg-[#090c14]">
          <span>TRACKS</span>
          <span className="font-mono text-cyan-400">{scenes.length} {scenes.length === 1 ? 'Clip' : 'Clips'}</span>
        </div>

        {/* Track 1: Video Track Header */}
        <div className="h-20 border-b border-slate-800/70 p-2 flex flex-col justify-between bg-[#0e111b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video 1</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <button className="p-0.5 hover:text-slate-300 rounded" title="Toggle Track Visibility">
                <Eye className="w-3 h-3" />
              </button>
              <button className="p-0.5 hover:text-slate-300 rounded" title="Lock Track">
                <Lock className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Main Storyboard</span>
            {onAddMedia && (
              <button
                onClick={onAddMedia}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                title="Add Media to Track"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Track 2: Text / Subtitles Header */}
        <div className="h-10 border-b border-slate-800/70 px-2 flex items-center justify-between bg-[#0b0e17]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
            <Type className="w-3 h-3 text-amber-400" />
            <span>Subtitles</span>
          </div>
          <span className="text-[9px] px-1 bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded font-mono">TEXT</span>
        </div>

        {/* Track 3: Voiceover Track Header */}
        <div className="h-12 border-b border-slate-800/70 px-2 flex items-center justify-between bg-[#0c0f19]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
            <button 
              onClick={() => setIsVoMuted(!isVoMuted)}
              className="hover:opacity-80 cursor-pointer"
              title={isVoMuted ? "Unmute Voiceover" : "Mute Voiceover"}
            >
              {isVoMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
            </button>
            <span>Voiceover</span>
          </div>
          <span className="text-[9px] px-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded font-mono">TTS</span>
        </div>

        {/* Track 4: Background Music Header */}
        <div className="h-12 px-2 flex items-center justify-between bg-[#0c0f19]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
            <button 
              onClick={() => setIsBgmMuted(!isBgmMuted)}
              className="hover:opacity-80 cursor-pointer"
              title={isBgmMuted ? "Unmute BGM" : "Mute BGM"}
            >
              {isBgmMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Music className="w-3 h-3 text-purple-400" />}
            </button>
            <span>Music (BGM)</span>
          </div>
          {onAddAudio && (
            <button
              onClick={onAddAudio}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
              title="Add Audio Track"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* 2. Right Track Timeline Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative no-scrollbar"
      >
        <div style={{ width: `${timelineWidth}px` }} className="relative h-full flex flex-col">
          
          {/* Top Time Ruler */}
          <div 
            ref={rulerRef}
            onMouseDown={handleMouseDownOnRuler}
            className="h-7 border-b border-slate-800/80 bg-[#090c14] relative flex items-center text-[10px] font-mono text-slate-500 select-none cursor-pointer hover:bg-slate-900/50 transition"
          >
            {Array.from({ length: numRulerTicks }).map((_, i) => {
              const sec = i * rulerIntervalSeconds;
              const leftPx = sec * pixelsPerSecond;
              return (
                <div
                  key={i}
                  style={{ left: `${leftPx}px` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-between border-l border-slate-800/80 pl-1 pointer-events-none"
                >
                  <span className="text-[9px] text-slate-400 leading-tight">
                    {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
                  </span>
                  <div className="w-px h-1 bg-slate-700"></div>
                </div>
              );
            })}
          </div>

          {/* Track 1 Content: Video Clips Row */}
          <div className="h-20 border-b border-slate-800/60 bg-[#0b0e17] flex items-center px-1 gap-1 relative">
            {scenes.length === 0 ? (
              /* Interactive Empty State Dropzone on Video Track */
              <div className="flex items-center gap-2 py-1 px-3 w-full">
                <div 
                  onClick={onAddMedia}
                  className="flex-1 h-16 rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/25 transition cursor-pointer flex items-center justify-center gap-3 px-4 text-slate-300 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Timeline is empty</span>
                      <span className="text-cyan-400 font-normal">— Click to add videos or images</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Import files, record voice, or generate with AI to build your story.</p>
                  </div>
                </div>

                {onOpenSoraStudio && (
                  <button
                    onClick={onOpenSoraStudio}
                    className="h-16 px-3 rounded-xl bg-purple-950/30 border border-purple-500/40 hover:bg-purple-950/50 text-purple-300 flex flex-col items-center justify-center text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 mb-0.5 text-purple-400" />
                    <span>Sora-2 AI</span>
                  </button>
                )}

                {onOpenImageStudio && (
                  <button
                    onClick={onOpenImageStudio}
                    className="h-16 px-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-950/50 text-cyan-300 flex flex-col items-center justify-center text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 mb-0.5 text-cyan-400" />
                    <span>GPT Image</span>
                  </button>
                )}

                {onOpenSceneTemplates && (
                  <button
                    onClick={onOpenSceneTemplates}
                    className="h-16 px-3 rounded-xl bg-amber-950/30 border border-amber-500/40 hover:bg-amber-950/50 text-amber-300 flex flex-col items-center justify-center text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <LayoutTemplate className="w-4 h-4 mb-0.5 text-amber-400" />
                    <span>Templates</span>
                  </button>
                )}
              </div>
            ) : (
              scenes.map((scene, idx) => {
                const widthPx = Math.max(64, scene.duration * pixelsPerSecond);
                const isSelected = scene.id === selectedSceneId;

                return (
                  <div
                    key={scene.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScene(scene.id);
                    }}
                    style={{ width: `${widthPx}px` }}
                    className={`h-16 rounded-lg overflow-hidden border transition-all cursor-pointer relative shrink-0 flex flex-col justify-between p-1.5 shadow-md group select-none ${
                      isSelected 
                        ? 'border-cyan-400 ring-2 ring-cyan-500/50 bg-slate-900 z-10' 
                        : 'border-slate-700/80 bg-slate-950 hover:border-slate-500'
                    }`}
                  >
                    {/* Clip Background Media Thumbnail */}
                    {scene.mediaUrl && (
                      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition pointer-events-none overflow-hidden">
                        {scene.mediaType === 'video' || scene.mediaUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i) ? (
                          <video src={scene.mediaUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={scene.mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    )}

                    {/* Top Metadata */}
                    <div className="relative z-10 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-white truncate max-w-[85px] drop-shadow-md">
                        {scene.title}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold bg-black/70 px-1 rounded text-[9px]">
                        {scene.duration}s
                      </span>
                    </div>

                    {/* Bottom Transition / Motion Tag */}
                    <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-300">
                      <span className="capitalize px-1 bg-black/60 rounded text-[8px]">{scene.motion || 'Cut'}</span>
                      <span className="text-[8px] text-slate-400 font-mono">#{idx + 1}</span>
                    </div>

                    {/* Left & Right Trimming Resize Handles (CapCut Style) */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingClipId(scene.id);
                        setResizeStartX(e.clientX);
                        setResizeStartDuration(scene.duration);
                      }}
                      className="absolute right-0 top-0 bottom-0 w-2.5 bg-cyan-400/0 hover:bg-cyan-400/80 cursor-ew-resize opacity-0 group-hover:opacity-100 transition rounded-r z-20 flex items-center justify-center"
                      title="Drag to trim / adjust clip duration"
                    >
                      <div className="w-0.5 h-4 bg-slate-950 rounded-full"></div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick Add Media Button on Timeline */}
            {scenes.length > 0 && onAddMedia && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddMedia();
                }}
                className="h-16 px-3 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 flex items-center gap-1.5 text-xs font-bold transition shrink-0 cursor-pointer"
                title="Add Image/Video clip to timeline"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>+ Clip</span>
              </button>
            )}
          </div>

          {/* Track 2 Content: Text / Subtitle Pills */}
          <div className="h-10 border-b border-slate-800/60 bg-[#0a0d15] flex items-center px-1 gap-1 relative">
            {scenes.map((scene) => {
              const widthPx = Math.max(64, scene.duration * pixelsPerSecond);
              const hasText = !!(scene.textOverlay || scene.textNepali);

              return (
                <div
                  key={scene.id}
                  style={{ width: `${widthPx}px` }}
                  className="h-7 shrink-0 flex items-center"
                >
                  {hasText ? (
                    <div 
                      onClick={() => onSelectScene(scene.id)}
                      className="w-full h-6 rounded bg-amber-500/20 border border-amber-500/40 px-2 flex items-center text-[10px] font-bold text-amber-200 truncate cursor-pointer hover:bg-amber-500/30 transition"
                      title={scene.textNepali || scene.textOverlay}
                    >
                      <Type className="w-2.5 h-2.5 mr-1 text-amber-400 shrink-0" />
                      <span className="truncate">{scene.textNepali || scene.textOverlay}</span>
                    </div>
                  ) : (
                    <div className="w-full h-1 bg-slate-800/30 rounded"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Track 3 Content: Voiceover Audio Track (Waveform visual) */}
          <div className="h-12 border-b border-slate-800/60 bg-[#090c14] flex items-center px-1 relative">
            <div 
              style={{ width: `${Math.max(300, (totalDuration || 10) * pixelsPerSecond)}px` }}
              className={`h-9 rounded-lg border px-3 flex items-center justify-between text-xs shadow-sm transition ${
                isVoMuted 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50' 
                  : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isVoMuted ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                <span className="font-bold text-[11px] truncate max-w-xs">
                  {voTrack ? voTrack.title : 'Nepali Neural Voiceover (Master)'}
                </span>
                <div className="flex items-center gap-0.5 opacity-75 pl-2">
                  {[4, 10, 6, 14, 8, 16, 5, 12, 7, 15, 9, 13, 6, 11, 4, 10, 7, 14].map((h, i) => (
                    <div key={i} className={`w-0.5 rounded-full ${isVoMuted ? 'bg-slate-600' : 'bg-emerald-400'}`} style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-400">{isVoMuted ? 'MUTED' : 'VO ACTIVE'}</span>
            </div>
          </div>

          {/* Track 4 Content: Background Music (BGM) Track */}
          <div className="h-12 bg-[#090c14] flex items-center px-1 relative">
            <div 
              style={{ width: `${Math.max(360, (totalDuration || 10) * pixelsPerSecond)}px` }}
              className={`h-9 rounded-lg border px-3 flex items-center justify-between text-xs shadow-sm transition ${
                isBgmMuted 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50' 
                  : 'bg-purple-950/40 border-purple-700/60 text-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isBgmMuted ? 'bg-slate-500' : 'bg-purple-400 animate-pulse'}`}></span>
                <span className="font-bold text-[11px] truncate max-w-xs">
                  {audioTracks.find(a => a.id === selectedAudioId)?.title || 'Cinematic Background Theme'}
                </span>
                <div className="flex items-center gap-0.5 opacity-75 pl-2">
                  {[6, 12, 8, 15, 7, 13, 5, 11, 9, 14, 6, 10, 8, 16, 5, 12, 7, 13].map((h, i) => (
                    <div key={i} className={`w-0.5 rounded-full ${isBgmMuted ? 'bg-slate-600' : 'bg-purple-400'}`} style={{ height: `${h}px` }} />
                  ))}
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-purple-400">{isBgmMuted ? 'MUTED' : 'BGM STEREO'}</span>
            </div>
          </div>

          {/* Draggable Playhead Needle (CapCut Cyan Needle) */}
          <div
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-transform duration-75"
          >
            {/* Playhead Needle Head */}
            <div className="w-3.5 h-4 bg-cyan-400 rounded-b -translate-x-1/2 flex items-center justify-center shadow-md shadow-cyan-400/50">
              <div className="w-1 h-1 bg-slate-950 rounded-full"></div>
            </div>
            {/* Playhead Needle Line */}
            <div className="w-0.5 h-full bg-gradient-to-b from-cyan-400 via-cyan-500 to-transparent -translate-x-1/2"></div>
          </div>

        </div>
      </div>
    </div>
  );
};
