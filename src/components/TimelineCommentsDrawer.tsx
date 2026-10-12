import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Plus, 
  Check, 
  Trash2, 
  Clock, 
  User, 
  Filter, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Scene, SceneComment, UserSession } from '../types';

interface TimelineCommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  selectedSceneId: string;
  currentTime: number;
  onSeek: (time: number) => void;
  onSelectScene: (sceneId: string) => void;
  onUpdateScenes: (updatedScenes: Scene[]) => void;
  currentUser?: UserSession | null;
}

export const TimelineCommentsDrawer: React.FC<TimelineCommentsDrawerProps> = ({
  isOpen,
  onClose,
  scenes,
  selectedSceneId,
  currentTime,
  onSeek,
  onSelectScene,
  onUpdateScenes,
  currentUser,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'current' | 'unresolved'>('all');
  const [newCommentText, setNewCommentText] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.name || 'Producer');
  const [authorRole, setAuthorRole] = useState<'Director' | 'Producer' | 'Editor' | 'Client' | 'Sound Designer'>('Editor');
  const [targetSceneId, setTargetSceneId] = useState<string>(selectedSceneId || scenes[0]?.id || '');

  if (!isOpen) return null;

  // Compute timeline start time for each scene to calculate relative vs absolute timestamps
  let runningStart = 0;
  const sceneTimingMap: Record<string, { start: number; end: number }> = {};
  scenes.forEach(s => {
    sceneTimingMap[s.id] = { start: runningStart, end: runningStart + (s.duration || 4) };
    runningStart += (s.duration || 4);
  });

  // Collect all comments across scenes
  const allComments: Array<SceneComment & { sceneTitle: string }> = [];
  scenes.forEach(s => {
    if (s.comments && Array.isArray(s.comments)) {
      s.comments.forEach(c => {
        allComments.push({
          ...c,
          sceneTitle: s.title || 'Untitled Scene',
        });
      });
    }
  });

  // Sort chronologically by timelineTime
  allComments.sort((a, b) => (a.timelineTime ?? 0) - (b.timelineTime ?? 0));

  // Filter comments
  const filteredComments = allComments.filter(c => {
    if (filterMode === 'current') return c.sceneId === (selectedSceneId || targetSceneId);
    if (filterMode === 'unresolved') return !c.resolved;
    return true;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const chosenScene = scenes.find(s => s.id === (targetSceneId || selectedSceneId)) || scenes[0];
    if (!chosenScene) return;

    const sceneTiming = sceneTimingMap[chosenScene.id] || { start: 0, end: chosenScene.duration };
    // Relative timestamp inside this scene
    let relTimestamp = currentTime - sceneTiming.start;
    if (relTimestamp < 0 || relTimestamp > chosenScene.duration) {
      // If playhead is outside this scene, set timestamp to middle or clamp
      relTimestamp = Math.min(chosenScene.duration, Math.max(0, relTimestamp < 0 ? 0 : chosenScene.duration));
    }
    const absTimestamp = sceneTiming.start + relTimestamp;

    const newComment: SceneComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sceneId: chosenScene.id,
      timestamp: Number(relTimestamp.toFixed(2)),
      timelineTime: Number(absTimestamp.toFixed(2)),
      author: `${authorName.trim()} (${authorRole})`,
      authorRole,
      authorEmail: currentUser?.email,
      text: newCommentText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    const updated = scenes.map(s => {
      if (s.id === chosenScene.id) {
        return {
          ...s,
          comments: [...(s.comments || []), newComment],
        };
      }
      return s;
    });

    onUpdateScenes(updated);
    setNewCommentText('');
  };

  const handleToggleResolve = (sceneId: string, commentId: string) => {
    const updated = scenes.map(s => {
      if (s.id === sceneId && s.comments) {
        return {
          ...s,
          comments: s.comments.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c),
        };
      }
      return s;
    });
    onUpdateScenes(updated);
  };

  const handleDeleteComment = (sceneId: string, commentId: string) => {
    const updated = scenes.map(s => {
      if (s.id === sceneId && s.comments) {
        return {
          ...s,
          comments: s.comments.filter(c => c.id !== commentId),
        };
      }
      return s;
    });
    onUpdateScenes(updated);
  };

  const currentScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0a0d15] border-l border-slate-800 shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#07090f] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Team Timeline Feedback</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
                {allComments.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Time-stamped notes for directors, editors & clients
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-[#090c13] flex items-center gap-1 text-[11px]">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
            filterMode === 'all'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({allComments.length})
        </button>
        <button
          onClick={() => setFilterMode('unresolved')}
          className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
            filterMode === 'unresolved'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Open ({allComments.filter(c => !c.resolved).length})
        </button>
        {currentScene && (
          <button
            onClick={() => setFilterMode('current')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer truncate max-w-[140px] ${
              filterMode === 'current'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={`Filter by "${currentScene.title}"`}
          >
            This Scene ({currentScene.comments?.length || 0})
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-slate-500">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
            <p className="text-xs font-medium">No comments in this view</p>
            <p className="text-[11px] text-slate-600 max-w-[200px] mx-auto">
              Add a time-stamped note below to leave feedback for editors or team members.
            </p>
          </div>
        ) : (
          filteredComments.map(comment => {
            const isResolved = comment.resolved;
            return (
              <div 
                key={comment.id}
                className={`p-3 rounded-xl border transition space-y-2 ${
                  isResolved 
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-65' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectScene(comment.sceneId);
                        if (typeof comment.timelineTime === 'number') {
                          onSeek(comment.timelineTime);
                        }
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40 transition flex items-center gap-1 cursor-pointer shrink-0"
                      title="Jump playhead to this exact frame"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(comment.timelineTime ?? comment.timestamp)}</span>
                    </button>
                    <span className="text-[11px] font-bold text-slate-200 truncate">
                      {comment.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleResolve(comment.sceneId, comment.id)}
                      className={`p-1 rounded transition cursor-pointer text-[10px] flex items-center gap-1 ${
                        isResolved 
                          ? 'text-emerald-400 hover:text-emerald-300' 
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                      title={isResolved ? 'Mark as Open' : 'Mark as Resolved'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.sceneId, comment.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed break-words">
                  {comment.text}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[10px] text-slate-500">
                  <span className="truncate max-w-[180px]">
                    Scene: <span className="text-slate-400">{comment.sceneTitle}</span>
                  </span>
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Input Form */}
      <form onSubmit={handleAddComment} className="p-3 border-t border-slate-800 bg-[#07090f] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold flex items-center gap-1 text-amber-400">
            <Clock className="w-3 h-3" />
            <span>At Playhead: {formatTime(currentTime)}</span>
          </span>
          <select
            value={targetSceneId}
            onChange={e => setTargetSceneId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-hidden"
          >
            {scenes.map((s, idx) => (
              <option key={s.id} value={s.id}>
                {idx + 1}. {s.title.slice(0, 16)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <input
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Your Name"
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
          <select
            value={authorRole}
            onChange={e => setAuthorRole(e.target.value as any)}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-amber-500"
          >
            <option value="Director">🎬 Director</option>
            <option value="Producer">⭐ Producer</option>
            <option value="Editor">✂️ Editor</option>
            <option value="Client">💼 Client / Brand</option>
            <option value="Sound Designer">🎵 Sound Designer</option>
          </select>
        </div>

        <div className="relative">
          <textarea
            rows={2}
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            placeholder="Add note on framing, timing, audio sync, or subtitle edit..."
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 resize-none pr-12"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition font-bold disabled:opacity-40 cursor-pointer shadow-sm"
            title="Post Comment"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
