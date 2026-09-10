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
  Image as ImageIcon,
  Sliders,
  Check,
  X,
  Edit2,
  Clock,
  Layers
} from 'lucide-react';
import { Scene, AudioTrack, TransitionType } from '../../types';
import { computeSceneTimings } from '../../lib/timelineComposition';

export const TIMELINE_TRANSITIONS: { id: TransitionType; label: string; icon: string; desc: string }[] = [
  { id: 'cut', label: 'Cut (None)', icon: '✂️', desc: 'Direct instant cut' },
  { id: 'fade', label: 'Cross Fade', icon: '🌫️', desc: 'Smooth opacity dissolve' },
  { id: 'dissolve', label: 'Dissolve', icon: '✨', desc: 'Cinematic dissolve' },
  { id: 'wipe_left', label: 'Wipe Left', icon: '⬅️', desc: 'Linear wipe to left' },
  { id: 'wipe_right', label: 'Wipe Right', icon: '➡️', desc: 'Linear wipe to right' },
  { id: 'slide_left', label: 'Slide Left', icon: '◀️', desc: 'Push slide to left' },
  { id: 'slide_right', label: 'Slide Right', icon: '▶️', desc: 'Push slide to right' },
  { id: 'slide_up', label: 'Slide Up', icon: '▲', desc: 'Vertical upward slide' },
  { id: 'slide_down', label: 'Slide Down', icon: '▼', desc: 'Vertical downward slide' },
  { id: 'zoom_in', label: 'Zoom In', icon: '🔍', desc: 'Focal zoom into next clip' },
  { id: 'zoom_out', label: 'Zoom Out', icon: '🔎', desc: 'Pull-back reveal' },
  { id: 'flash_white', label: 'Flash White', icon: '⚡', desc: 'High-energy white strobe' },
  { id: 'blur_dissolve', label: 'Blur Dissolve', icon: '💫', desc: 'Dreamy optical defocus' },
];

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
  isBgmMuted?: boolean;
  setIsBgmMuted?: (muted: boolean) => void;
  isVoMuted?: boolean;
  setIsVoMuted?: (muted: boolean) => void;
  bgmVolume?: number;
  setBgmVolume?: (vol: number) => void;
  voVolume?: number;
  setVoVolume?: (vol: number) => void;
  isPlaying?: boolean;
  snapEnabled?: boolean;
  onApplyTransitionToAll?: (transition: TransitionType, duration: number) => void;
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
  isBgmMuted = false,
  setIsBgmMuted,
  isVoMuted = false,
  setIsVoMuted,
  bgmVolume = 80,
  setBgmVolume,
  voVolume = 90,
  setVoVolume,
  isPlaying = false,
  snapEnabled = true,
  onApplyTransitionToAll,
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [draggedSceneIdx, setDraggedSceneIdx] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Trimming State: right or left handle with live tooltip
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right'>('right');
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartDuration, setResizeStartDuration] = useState<number>(0);
  const [activeResizingDuration, setActiveResizingDuration] = useState<number | null>(null);

  // Inline Transition Picker State
  const [activeTransitionIdx, setActiveTransitionIdx] = useState<number | null>(null);
  const [transDuration, setTransDuration] = useState<number>(0.8);

  // Inline Subtitle Quick Editor
  const [editingSubtitleSceneId, setEditingSubtitleSceneId] = useState<string | null>(null);
  const [subtitleInput, setSubtitleInput] = useState<string>('');

  // Track lock & visibility toggles
  const [isVideoTrackLocked, setIsVideoTrackLocked] = useState(false);
  const [isVideoTrackVisible, setIsVideoTrackVisible] = useState(true);

  const pixelsPerSecond = Math.max(12, zoomLevel);
  const timelineWidth = Math.max(800, Math.ceil(totalDuration * pixelsPerSecond) + 360);

  // Deterministic scene timings based on exact half-open intervals
  const sceneTimings = React.useMemo(() => computeSceneTimings(scenes), [scenes]);

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
        const deltaSec = (resizeEdge === 'right' ? deltaPx : -deltaPx) / pixelsPerSecond;
        let newDur = Math.max(0.5, Math.min(60, Number((resizeStartDuration + deltaSec).toFixed(1))));
        if (snapEnabled) {
          // Snap to nearest 0.5s increment
          newDur = Math.round(newDur * 2) / 2;
        }
        setActiveResizingDuration(newDur);
        onUpdateScene(resizingClipId, { duration: newDur });
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setResizingClipId(null);
      setActiveResizingDuration(null);
    };

    if (isScrubbing || resizingClipId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, resizingClipId, resizeEdge, resizeStartX, resizeStartDuration, pixelsPerSecond, totalDuration, snapEnabled]);

  // Drag-and-drop scene reordering
  const handleDragStart = (idx: number) => {
    if (isVideoTrackLocked) return;
    setDraggedSceneIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (isVideoTrackLocked || draggedSceneIdx === null || draggedSceneIdx === targetIdx) return;
    const updated = [...scenes];
    const item = updated.splice(draggedSceneIdx, 1)[0];
    updated.splice(targetIdx, 0, item);
    setDraggedSceneIdx(targetIdx);
    onReorderScenes(updated);
  };

  const handleDragEnd = () => {
    setDraggedSceneIdx(null);
  };

  const handleApplyTransition = (type: TransitionType) => {
    if (activeTransitionIdx === null || !onUpdateScene) return;
    const targetScene = scenes[activeTransitionIdx + 1];
    if (!targetScene) return;
    onUpdateScene(targetScene.id, {
      transition: type,
      transitionDuration: transDuration
    });
  };

  const handleApplyToAllClips = (type: TransitionType) => {
    if (!onUpdateScene) return;
    scenes.slice(1).forEach(s => {
      onUpdateScene(s.id, {
        transition: type,
        transitionDuration: transDuration
      });
    });
    if (onApplyTransitionToAll) {
      onApplyTransitionToAll(type, transDuration);
    }
    setActiveTransitionIdx(null);
  };

  return (
    <div className="flex-1 bg-[#090b12] flex overflow-hidden select-none relative">
      {/* 1. Left Track Headers Dock (CapCut Desktop Studio Style) */}
      <div className="w-32 sm:w-36 bg-[#0c0e17] border-r border-slate-800/90 flex flex-col shrink-0 z-20 shadow-md">
        {/* Ruler Corner Spacer */}
        <div className="h-6 border-b border-slate-800/80 px-2 flex items-center justify-between text-[9px] font-bold text-slate-400 bg-[#090c14]">
          <span>TRACKS</span>
          <span className="font-mono text-cyan-400">{scenes.length} {scenes.length === 1 ? 'Clip' : 'Clips'}</span>
        </div>

        {/* Track 1: Video Track Header */}
        <div className="h-14 border-b border-slate-800/70 p-1.5 flex flex-col justify-between bg-[#0e111b]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
              <Film className="w-3 h-3 text-cyan-400" />
              <span>Video 1</span>
            </div>
            <div className="flex items-center gap-0.5 text-slate-500">
              <button 
                onClick={() => setIsVideoTrackVisible(!isVideoTrackVisible)}
                className={`p-0.5 rounded cursor-pointer transition ${isVideoTrackVisible ? 'text-slate-400 hover:text-white' : 'text-rose-400'}`}
                title={isVideoTrackVisible ? "Hide Video Track" : "Show Video Track"}
              >
                {isVideoTrackVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              </button>
              <button 
                onClick={() => setIsVideoTrackLocked(!isVideoTrackLocked)}
                className={`p-0.5 rounded cursor-pointer transition ${isVideoTrackLocked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                title={isVideoTrackLocked ? "Unlock Video Track" : "Lock Video Track"}
              >
                {isVideoTrackLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <span className="truncate">{isVideoTrackLocked ? '🔒 Locked' : 'Main Track'}</span>
            {onAddMedia && !isVideoTrackLocked && (
              <button
                onClick={onAddMedia}
                className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                title="Add Media to Track"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        {/* Track 2: Text / Subtitles Header */}
        <div className="h-8 border-b border-slate-800/70 px-1.5 flex items-center justify-between bg-[#0b0e17]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
            <Type className="w-2.5 h-2.5 text-amber-400" />
            <span>Subtitles</span>
          </div>
          <span className="text-[8px] px-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded font-mono">TXT</span>
        </div>

        {/* Track 3: Voiceover Track Header */}
        <div className="h-8 border-b border-slate-800/70 px-1.5 flex items-center justify-between bg-[#0c0f19]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
            <button 
              onClick={() => setIsVoMuted && setIsVoMuted(!isVoMuted)}
              className="hover:opacity-80 cursor-pointer"
              title={isVoMuted ? "Unmute Voiceover" : "Mute Voiceover"}
            >
              {isVoMuted ? <VolumeX className="w-2.5 h-2.5 text-rose-400" /> : <Volume2 className="w-2.5 h-2.5 text-emerald-400" />}
            </button>
            <span>Voiceover</span>
          </div>
          <div className="flex items-center gap-0.5">
            {setVoVolume && (
              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/80 px-0.5 rounded border border-emerald-800/60">
                {voVolume}%
              </span>
            )}
          </div>
        </div>

        {/* Track 4: Background Music Header */}
        <div className="h-8 px-1.5 flex items-center justify-between bg-[#0c0f19]">
          <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300">
            <button 
              onClick={() => setIsBgmMuted && setIsBgmMuted(!isBgmMuted)}
              className="hover:opacity-80 cursor-pointer"
              title={isBgmMuted ? "Unmute BGM" : "Mute BGM"}
            >
              {isBgmMuted ? <VolumeX className="w-2.5 h-2.5 text-rose-400" /> : <Music className="w-2.5 h-2.5 text-purple-400" />}
            </button>
            <span>Music</span>
          </div>
          <div className="flex items-center gap-0.5">
            {setBgmVolume && (
              <span className="text-[8px] font-mono text-purple-400 bg-purple-950/80 px-0.5 rounded border border-purple-800/60">
                {bgmVolume}%
              </span>
            )}
            {onAddAudio && (
              <button
                onClick={onAddAudio}
                className="text-[9px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                title="Add Audio Track"
              >
                +
              </button>
            )}
          </div>
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
            className="h-6 border-b border-slate-800/80 bg-[#090c14] relative flex items-center text-[9px] font-mono text-slate-500 select-none cursor-pointer hover:bg-slate-900/50 transition"
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
                  <span className="text-[8px] text-slate-400 leading-tight">
                    {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
                  </span>
                  <div className="w-px h-1 bg-slate-700"></div>
                </div>
              );
            })}
          </div>

          {/* Track 1 Content: Video Clips Row */}
          <div className="h-14 border-b border-slate-800/60 bg-[#0b0e17] relative">
            {scenes.length === 0 ? (
              /* Interactive Empty State Dropzone on Video Track */
              <div className="flex items-center gap-2 py-0.5 px-2 w-full h-full">
                <div 
                  onClick={onAddMedia}
                  className="flex-1 h-11 rounded-lg border-2 border-dashed border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/25 transition cursor-pointer flex items-center justify-center gap-2.5 px-3 text-slate-300 group"
                >
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white flex items-center gap-1">
                      <span>Timeline is empty</span>
                      <span className="text-cyan-400 font-normal">— Click to add media</span>
                    </p>
                  </div>
                </div>

                {onOpenSoraStudio && (
                  <button
                    onClick={onOpenSoraStudio}
                    className="h-11 px-2.5 rounded-lg bg-purple-950/30 border border-purple-500/40 hover:bg-purple-950/50 text-purple-300 flex items-center justify-center gap-1 text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>Sora-2</span>
                  </button>
                )}

                {onOpenImageStudio && (
                  <button
                    onClick={onOpenImageStudio}
                    className="h-11 px-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-950/50 text-cyan-300 flex items-center justify-center gap-1 text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3 text-cyan-400" />
                    <span>GPT Image</span>
                  </button>
                )}

                {onOpenSceneTemplates && (
                  <button
                    onClick={onOpenSceneTemplates}
                    className="h-11 px-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 hover:bg-amber-950/50 text-amber-300 flex items-center justify-center gap-1 text-[10px] font-bold transition shrink-0 cursor-pointer"
                  >
                    <LayoutTemplate className="w-3 h-3 text-amber-400" />
                    <span>Templates</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative h-full w-full">
                {scenes.map((scene, idx) => {
                  const timing = sceneTimings[idx] || {
                    startTime: scenes.slice(0, idx).reduce((acc, s) => acc + s.duration, 0),
                    duration: scene.duration,
                    endTime: scenes.slice(0, idx + 1).reduce((acc, s) => acc + s.duration, 0),
                  };
                  const leftPx = timing.startTime * pixelsPerSecond;
                  const widthPx = timing.duration * pixelsPerSecond;
                  const isSelected = scene.id === selectedSceneId;
                  const isVideo = scene.mediaType === 'video' || (scene.mediaUrl && scene.mediaUrl.match(/\.(mp4|webm|mov|ogg)($|\?)/i));

                  return (
                    <React.Fragment key={scene.id}>
                      {/* Clip Card */}
                      <div
                        draggable={!isVideoTrackLocked}
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScene(scene.id);
                          onSeek(timing.startTime);
                        }}
                        style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                        className={`absolute top-1.5 bottom-1.5 rounded-md overflow-hidden border transition-none cursor-pointer select-none flex flex-col justify-between p-1 shadow-sm group ${
                          !isVideoTrackVisible ? 'opacity-30' : ''
                        } ${
                          isSelected 
                            ? 'border-cyan-400 ring-1.5 ring-cyan-500/50 bg-slate-900 z-10' 
                            : 'border-slate-700/80 bg-slate-950 hover:border-slate-500'
                        }`}
                      >
                        {/* Filmstrip Sprocket Perforations */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between px-1 pointer-events-none z-10 opacity-50">
                          {Array.from({ length: Math.max(2, Math.floor(widthPx / 18)) }).map((_, si) => (
                            <div key={si} className="w-1.5 h-1 bg-black/80 rounded-[1px] border border-white/20"></div>
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 flex justify-between px-1 pointer-events-none z-10 opacity-50">
                          {Array.from({ length: Math.max(2, Math.floor(widthPx / 18)) }).map((_, si) => (
                            <div key={si} className="w-1.5 h-1 bg-black/80 rounded-[1px] border border-white/20"></div>
                          ))}
                        </div>

                        {/* Clip Background Media Thumbnail */}
                        {scene.mediaUrl && (
                          <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition pointer-events-none overflow-hidden">
                            {isVideo && (!scene.thumbnailUrl || scene.thumbnailUrl.match(/\.(mp4|webm|mov)($|\?)/i)) ? (
                              <video
                                src={scene.mediaUrl}
                                muted
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={scene.thumbnailUrl || scene.mediaUrl}
                                alt={scene.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}

                        {/* Live Trimming Tooltip */}
                        {resizingClipId === scene.id && activeResizingDuration !== null && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-lg z-30 flex items-center gap-1 pointer-events-none whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{activeResizingDuration}s</span>
                          </div>
                        )}

                        {/* Top Metadata */}
                        <div className="relative z-10 flex items-center justify-between text-[10px] overflow-hidden">
                          <span className="font-bold text-white truncate max-w-[85px] drop-shadow-md">
                            {widthPx > 35 ? scene.title : ''}
                          </span>
                          <span className="font-mono text-cyan-300 font-bold bg-black/75 px-1 rounded text-[9px]">
                            {widthPx > 45 ? `${scene.duration}s` : ''}
                          </span>
                        </div>

                        {/* Bottom Tags */}
                        <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-300 overflow-hidden">
                          <div className="flex items-center gap-1 min-w-0">
                            {isVideo ? (
                              <span className="text-[8px] bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 px-1 rounded font-mono font-bold flex items-center gap-0.5">
                                <Film className="w-2 h-2 text-cyan-400" />
                                {widthPx > 40 ? 'VID' : ''}
                              </span>
                            ) : (
                              <span className="text-[8px] bg-slate-900/90 text-slate-300 border border-slate-700/60 px-1 rounded font-mono font-bold flex items-center gap-0.5">
                                <ImageIcon className="w-2 h-2 text-slate-400" />
                                {widthPx > 40 ? 'IMG' : ''}
                              </span>
                            )}
                            {widthPx > 60 && (
                              <span className="capitalize px-1 bg-black/60 rounded text-[8px] truncate max-w-[50px]">
                                {scene.motion || 'Cut'}
                              </span>
                            )}
                          </div>
                          {widthPx > 35 && <span className="text-[8px] text-slate-400 font-mono">#{idx + 1}</span>}
                        </div>

                        {/* Left Trim Handle */}
                        {!isVideoTrackLocked && widthPx > 20 && (
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setResizingClipId(scene.id);
                              setResizeEdge('left');
                              setResizeStartX(e.clientX);
                              setResizeStartDuration(scene.duration);
                              setActiveResizingDuration(scene.duration);
                            }}
                            className="absolute left-0 top-0 bottom-0 w-2.5 bg-cyan-400/0 hover:bg-cyan-400/80 cursor-ew-resize opacity-0 group-hover:opacity-100 transition rounded-l z-20 flex items-center justify-center"
                            title="Drag left to adjust duration"
                          >
                            <div className="w-0.5 h-4 bg-slate-950 rounded-full"></div>
                          </div>
                        )}

                        {/* Right Trim Handle */}
                        {!isVideoTrackLocked && widthPx > 20 && (
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setResizingClipId(scene.id);
                              setResizeEdge('right');
                              setResizeStartX(e.clientX);
                              setResizeStartDuration(scene.duration);
                              setActiveResizingDuration(scene.duration);
                            }}
                            className="absolute right-0 top-0 bottom-0 w-2.5 bg-cyan-400/0 hover:bg-cyan-400/80 cursor-ew-resize opacity-0 group-hover:opacity-100 transition rounded-r z-20 flex items-center justify-center"
                            title="Drag right to adjust duration"
                          >
                            <div className="w-0.5 h-4 bg-slate-950 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Inline Transition Node Centered at the Seam */}
                      {idx < scenes.length - 1 && (
                        <div
                          key={`trans-${scene.id}-${scenes[idx + 1].id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextState = activeTransitionIdx === idx ? null : idx;
                            setActiveTransitionIdx(nextState);
                            if (nextState !== null) {
                              setTransDuration(scenes[idx + 1].transitionDuration || 0.8);
                            }
                          }}
                          style={{ left: `${timing.endTime * pixelsPerSecond}px` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center cursor-pointer group/trans"
                          title={`Transition to ${scenes[idx + 1].title}: ${scenes[idx + 1].transition || 'cut'} (${scenes[idx + 1].transitionDuration || 0.8}s)`}
                        >
                          <div className={`w-5 h-8 rounded border flex flex-col items-center justify-center shadow-md transition-all ${
                            activeTransitionIdx === idx 
                              ? 'bg-cyan-500 border-white text-black scale-110 shadow-cyan-500/50' 
                              : scenes[idx + 1].transition && scenes[idx + 1].transition !== 'cut'
                                ? 'bg-indigo-950/90 border-indigo-500/80 text-indigo-300 hover:border-cyan-400 hover:text-cyan-300'
                                : 'bg-slate-900 border-slate-700/80 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                          }`}>
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            <span className="text-[7px] font-mono font-bold leading-none mt-0.5 uppercase">
                              {scenes[idx + 1].transition === 'cut' || !scenes[idx + 1].transition
                                ? '|'
                                : scenes[idx + 1].transition.slice(0, 3)}
                            </span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Quick Add Media Button at end of clips */}
                {scenes.length > 0 && onAddMedia && !isVideoTrackLocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMedia();
                    }}
                    style={{ left: `${totalDuration * pixelsPerSecond + 8}px` }}
                    className="absolute top-1.5 bottom-1.5 px-3 rounded-md border border-dashed border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 flex items-center gap-1.5 text-xs font-bold transition shrink-0 cursor-pointer z-10"
                    title="Add Image/Video clip to timeline"
                  >
                    <Plus className="w-4 h-4 text-cyan-400" />
                    <span>+ Clip</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Track 2 Content: Text / Subtitle Pills */}
          <div className="h-8 border-b border-slate-800/60 bg-[#0a0d15] relative">
            <div className="relative h-full w-full">
              {scenes.map((scene, idx) => {
                const timing = sceneTimings[idx] || {
                  startTime: scenes.slice(0, idx).reduce((acc, s) => acc + s.duration, 0),
                  duration: scene.duration,
                  endTime: scenes.slice(0, idx + 1).reduce((acc, s) => acc + s.duration, 0),
                };
                const leftPx = timing.startTime * pixelsPerSecond;
                const widthPx = timing.duration * pixelsPerSecond;
                const hasText = !!(scene.textOverlay || scene.textNepali);

                return (
                  <div
                    key={`sub-${scene.id}`}
                    style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                    className="absolute top-1 bottom-1 flex items-center px-0.5"
                  >
                    {hasText ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScene(scene.id);
                          setEditingSubtitleSceneId(scene.id);
                          setSubtitleInput(scene.textNepali || scene.textOverlay || '');
                        }}
                        className="w-full h-5 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 flex items-center justify-between text-[9px] font-bold text-amber-200 truncate cursor-pointer hover:bg-amber-500/30 transition group/sub"
                        title={scene.textNepali || scene.textOverlay}
                      >
                        <div className="flex items-center min-w-0">
                          <Type className="w-2 h-2 mr-1 text-amber-400 shrink-0" />
                          <span className="truncate">{scene.textNepali || scene.textOverlay}</span>
                        </div>
                        <Edit2 className="w-2 h-2 text-amber-400 opacity-0 group-hover/sub:opacity-100 transition shrink-0 ml-0.5" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScene(scene.id);
                          setEditingSubtitleSceneId(scene.id);
                          setSubtitleInput('');
                        }}
                        className="w-full h-5 rounded border border-dashed border-slate-800/80 hover:border-amber-500/40 hover:bg-amber-950/20 text-[8px] text-slate-500 hover:text-amber-300 flex items-center justify-center gap-1 transition cursor-pointer"
                        title="Add Subtitle to this scene"
                      >
                        <Plus className="w-2 h-2" />
                        <span>Sub</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 3 Content: Voiceover Audio Track (Waveform visual) */}
          <div className="h-8 border-b border-slate-800/60 bg-[#090c14] relative flex items-center">
            <div 
              style={{ left: 0, width: `${Math.max(120, totalDuration * pixelsPerSecond)}px` }}
              className={`absolute h-6 rounded-md border px-2 flex items-center justify-between text-[10px] shadow-xs transition ${
                isVoMuted 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50' 
                  : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isVoMuted ? 'bg-slate-500' : isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="font-bold text-[10px] truncate max-w-xs">
                  {voTrack ? voTrack.title : 'Nepali Neural Voiceover'}
                </span>
                <div className="flex items-center gap-0.5 opacity-75 pl-1.5">
                  {[4, 10, 6, 14, 8, 12, 5, 11, 7, 13, 6, 10].map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-0.5 rounded-full transition-all duration-150 ${isVoMuted ? 'bg-slate-600' : 'bg-emerald-400'}`} 
                      style={{ height: isPlaying && !isVoMuted ? `${Math.max(2, (h * ((i % 3) + 1)) % 14)}px` : `${Math.min(12, h)}px` }} 
                    />
                  ))}
                </div>
              </div>
              <span className="font-mono text-[8px] font-bold text-emerald-400">{isVoMuted ? 'MUTED' : `${voVolume}%`}</span>
            </div>
          </div>

          {/* Track 4 Content: Background Music (BGM) Track */}
          <div className="h-8 bg-[#090c14] relative flex items-center">
            <div 
              style={{ left: 0, width: `${Math.max(120, totalDuration * pixelsPerSecond)}px` }}
              className={`absolute h-6 rounded-md border px-2 flex items-center justify-between text-[10px] shadow-xs transition ${
                isBgmMuted 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-50' 
                  : 'bg-purple-950/40 border-purple-700/60 text-purple-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isBgmMuted ? 'bg-slate-500' : isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-purple-500'}`}></span>
                <span className="font-bold text-[10px] truncate max-w-xs">
                  {audioTracks.find(a => a.id === selectedAudioId)?.title || 'Cinematic Theme'}
                </span>
                <div className="flex items-center gap-0.5 opacity-75 pl-1.5">
                  {[6, 12, 8, 13, 5, 11, 7, 12, 6, 10, 8, 11].map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-0.5 rounded-full transition-all duration-150 ${isBgmMuted ? 'bg-slate-600' : 'bg-purple-400'}`} 
                      style={{ height: isPlaying && !isBgmMuted ? `${Math.max(2, (h * ((i % 2) + 1.2)) % 14)}px` : `${Math.min(12, h)}px` }} 
                    />
                  ))}
                </div>
              </div>
              <span className="font-mono text-[8px] font-bold text-purple-400">{isBgmMuted ? 'MUTED' : `${bgmVolume}%`}</span>
            </div>
          </div>

          {/* Draggable Playhead Needle (CapCut Cyan Needle) */}
          <div
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
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

      {/* Floating Inline Transition Picker Popover */}
      {activeTransitionIdx !== null && scenes[activeTransitionIdx + 1] && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e121e] border border-slate-700/90 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Clip Transition Selector</h4>
                  <p className="text-[11px] text-slate-400">
                    Between #{activeTransitionIdx + 1} & #{activeTransitionIdx + 2} ({scenes[activeTransitionIdx + 1].title})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTransitionIdx(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Duration Slider */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Transition Duration
                </span>
                <span className="font-mono text-cyan-400 font-bold">{transDuration}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={transDuration}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTransDuration(val);
                  if (onUpdateScene) {
                    onUpdateScene(scenes[activeTransitionIdx + 1].id, { transitionDuration: val });
                  }
                }}
                className="w-full accent-cyan-400"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <button 
                  onClick={() => {
                    setTransDuration(0.4);
                    if (onUpdateScene) onUpdateScene(scenes[activeTransitionIdx + 1].id, { transitionDuration: 0.4 });
                  }}
                  className="hover:text-cyan-400"
                >
                  0.4s (Snappy)
                </button>
                <button 
                  onClick={() => {
                    setTransDuration(0.8);
                    if (onUpdateScene) onUpdateScene(scenes[activeTransitionIdx + 1].id, { transitionDuration: 0.8 });
                  }}
                  className="hover:text-cyan-400"
                >
                  0.8s (Balanced)
                </button>
                <button 
                  onClick={() => {
                    setTransDuration(1.5);
                    if (onUpdateScene) onUpdateScene(scenes[activeTransitionIdx + 1].id, { transitionDuration: 1.5 });
                  }}
                  className="hover:text-cyan-400"
                >
                  1.5s (Cinematic)
                </button>
              </div>
            </div>

            {/* Transition Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto no-scrollbar">
              {TIMELINE_TRANSITIONS.map((trans) => {
                const isCurrent = (scenes[activeTransitionIdx + 1].transition || 'cut') === trans.id;
                return (
                  <button
                    key={trans.id}
                    onClick={() => handleApplyTransition(trans.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{trans.icon}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold block truncate">{trans.label}</span>
                      <span className="text-[9px] text-slate-400 line-clamp-1">{trans.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleApplyToAllClips(scenes[activeTransitionIdx + 1].transition || 'dissolve')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Apply this transition to all scenes across timeline"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Apply to All Clips</span>
              </button>
              <button
                onClick={() => setActiveTransitionIdx(null)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Inline Subtitle Quick Editor Popover */}
      {editingSubtitleSceneId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e121e] border border-slate-700/90 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Edit Scene Caption / Subtitle</h4>
                  <p className="text-[11px] text-slate-400">
                    Supports Nepali Devanagari & English text overlays
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSubtitleSceneId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Caption Text</label>
              <textarea
                value={subtitleInput}
                onChange={(e) => setSubtitleInput(e.target.value)}
                placeholder="Type caption (e.g. सगरमाथाको मनमोहक दृश्य / Majestic Everest sunrise)..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  if (onUpdateScene) {
                    onUpdateScene(editingSubtitleSceneId, { textOverlay: '', textNepali: '' });
                  }
                  setEditingSubtitleSceneId(null);
                }}
                className="px-3 py-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
              >
                Remove Caption
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingSubtitleSceneId(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onUpdateScene) {
                      onUpdateScene(editingSubtitleSceneId, {
                        textOverlay: subtitleInput,
                        textNepali: subtitleInput
                      });
                    }
                    setEditingSubtitleSceneId(null);
                  }}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Caption</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
