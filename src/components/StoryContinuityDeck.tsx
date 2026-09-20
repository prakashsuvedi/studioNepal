import React, { useState } from 'react';
import { 
  Sparkles, 
  Film, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Play, 
  Sliders, 
  ShieldCheck,
  Clapperboard,
  Check,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Wand2
} from 'lucide-react';
import { ChainedSegmentItem } from './SoraStudioView';
import { SubjectLockItem } from '../data/soraProductionPacks';

interface StoryContinuityDeckProps {
  chainSegments: ChainedSegmentItem[];
  activeSubjectLock: SubjectLockItem;
  currentGeneratingIndex: number | null;
  onGenerateNextSegment: (segment: ChainedSegmentItem, index: number) => void;
  onAssembleStoryToTimeline: () => void;
  onOpenPreview: (url: string) => void;
  onUpdateSegmentPrompt: (index: number, newPrompt: string) => void;
}

export const StoryContinuityDeck: React.FC<StoryContinuityDeckProps> = ({
  chainSegments,
  activeSubjectLock,
  currentGeneratingIndex,
  onGenerateNextSegment,
  onAssembleStoryToTimeline,
  onOpenPreview,
  onUpdateSegmentPrompt
}) => {
  const completedSegments = chainSegments.filter(s => !!s.videoUrl);
  const nextUnrenderedIndex = chainSegments.findIndex(s => !s.videoUrl);
  const nextSegment = nextUnrenderedIndex !== -1 ? chainSegments[nextUnrenderedIndex] : null;

  const [isEditingNextPrompt, setIsEditingNextPrompt] = useState(false);
  const [editedNextPrompt, setEditedNextPrompt] = useState(nextSegment ? nextSegment.prompt : '');

  React.useEffect(() => {
    if (nextSegment) {
      setEditedNextPrompt(nextSegment.prompt);
    }
  }, [nextSegment]);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
      
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Clapperboard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Google Flow Multi-Scene Storyboard</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {completedSegments.length} of {chainSegments.length} Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Iteratively generate continuous scenes with character identity locked</p>
          </div>
        </div>

        {/* Character Identity Lock Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
          <span className="text-base">{activeSubjectLock.avatarEmoji}</span>
          <div className="text-left">
            <div className="text-[10.5px] font-bold text-white flex items-center gap-1">
              <span>{activeSubjectLock.name}</span>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-[9px] font-mono text-indigo-300 block">{activeSubjectLock.anchorToken}</span>
          </div>
        </div>
      </div>

      {/* Sequential Scene Flow Graphic / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {chainSegments.map((segment, idx) => {
          const isDone = !!segment.videoUrl;
          const isCurrent = currentGeneratingIndex === idx;
          const isNext = nextUnrenderedIndex === idx;

          return (
            <div
              key={segment.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                isDone
                  ? 'bg-slate-950/90 border-emerald-500/60 text-white shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                  : isCurrent
                  ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                  : isNext
                  ? 'bg-slate-950/80 border-indigo-500/50 hover:border-indigo-400'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[9px] font-bold">
                      {idx + 1}
                    </span>
                    Scene {idx + 1}
                  </span>
                  {isDone ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" />
                      <span>Ready</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Rendering</span>
                    </span>
                  ) : isNext ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/40">
                      NEXT
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500">Queued</span>
                  )}
                </div>

                {/* Video Preview / Placeholder Thumbnail */}
                <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2 border border-slate-800">
                  {isDone && segment.videoUrl ? (
                    <>
                      <video
                        src={segment.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div 
                        onClick={() => onOpenPreview(segment.videoUrl!)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/90 group-hover:bg-white text-indigo-900 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                          <Play className="w-3 h-3 fill-indigo-900 ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : isCurrent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/40 p-2 text-center">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mb-1" />
                      <span className="text-[9px] text-indigo-200 font-medium">Neural Sora-2 Generating...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-2 text-center text-slate-600">
                      <Clapperboard className="w-5 h-5 text-slate-700 mb-1" />
                      <span className="text-[9px] text-slate-500 font-medium">{segment.recommendedDuration}s Shot</span>
                    </div>
                  )}
                </div>

                <div className="font-bold text-[11px] text-white line-clamp-1 mb-1">{segment.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{segment.prompt}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9.5px]">
                <span className="font-mono text-slate-400">{segment.recommendedDuration}s • Sora-2</span>
                {isDone && segment.videoUrl && (
                  <button
                    type="button"
                    onClick={() => onOpenPreview(segment.videoUrl!)}
                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Play</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Visual Generation Approval & Prompt Box */}
      {nextSegment && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-950 to-indigo-950/70 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-bold text-white">
                Ready to Generate Next Scene ({nextUnrenderedIndex + 1} of {chainSegments.length}): {nextSegment.title}
              </span>
            </div>
            <button
              onClick={() => setIsEditingNextPrompt(!isEditingNextPrompt)}
              className="text-[10px] text-indigo-300 hover:text-white font-semibold transition cursor-pointer"
            >
              {isEditingNextPrompt ? 'Save Edit' : 'Edit Scene Prompt'}
            </button>
          </div>

          {isEditingNextPrompt ? (
            <textarea
              value={editedNextPrompt}
              onChange={(e) => {
                setEditedNextPrompt(e.target.value);
                onUpdateSegmentPrompt(nextUnrenderedIndex, e.target.value);
              }}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              "{nextSegment.prompt}"
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Continuity: Preserving {activeSubjectLock.name} visual identity and lighting</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onGenerateNextSegment(nextSegment, nextUnrenderedIndex)}
                disabled={currentGeneratingIndex !== null}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {currentGeneratingIndex === nextUnrenderedIndex ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Scene {nextUnrenderedIndex + 1}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Approve & Generate Scene {nextUnrenderedIndex + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assemble Complete Story into Video Studio Button */}
      {completedSegments.length >= 1 && (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              {completedSegments.length} scenes ready to assemble into master timeline with auto-crossfades
            </span>
          </div>

          <button
            type="button"
            onClick={onAssembleStoryToTimeline}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Assemble Complete Story in Video Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
