import React, { useState, useEffect } from 'react';
import { History, X, PlusCircle, CheckCircle2, RotateCcw, Shield, Clock, HardDrive, FileJson, ArrowRight } from 'lucide-react';
import { Scene, AudioTrack, UserSession } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  scenes: Scene[];
  audioTracks?: AudioTrack[];
  user: UserSession | null;
  onRestoreVersion: (scenes: Scene[], audioTracks: AudioTrack[], title: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  projectId = 'project_default',
  scenes,
  audioTracks = [],
  user,
  onRestoreVersion,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      const data = await res.json();
      if (data.success && Array.isArray(data.versions)) {
        setVersions(data.versions);
      }
    } catch (e) {
      console.warn('Could not fetch version history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle || `Version Snapshot (${new Date().toLocaleTimeString()})`,
          description: newDescription || 'Manual timeline configuration snapshot',
          createdBy: user?.name || user?.email || 'Creator',
          scenes,
          audioTracks,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ Version ${data.version.versionNumber} snapshot created and saved to Supabase Storage.`);
        setNewTitle('');
        setNewDescription('');
        await fetchVersions();
      }
    } catch (err: any) {
      setStatusMsg(`❌ Error saving snapshot: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onRestoreVersion(data.scenes, data.audioTracks, data.restoredVersion.title);
        setStatusMsg(`✅ Successfully restored to Version ${data.restoredVersion.versionNumber}!`);
        setTimeout(() => onClose(), 1500);
      }
    } catch (e: any) {
      setStatusMsg(`❌ Version restore failed: ${e.message}`);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Project Version History & Supabase Storage Snapshots</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Track and restore previous video editor scene configurations stored in Supabase Storage Bucket.
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            {statusMsg}
          </div>
        )}

        {/* Create Snapshot Form */}
        <form onSubmit={handleCreateSnapshot} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Create New Version Snapshot</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Version title (e.g., Final Color Grade + Devanagari Audio)..."
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Snapshot notes & changelog summary..."
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Current state: <strong className="text-white">{scenes.length} Scenes</strong> ({scenes.reduce((a, b) => a + (b.duration || 3), 0)}s total duration)
            </span>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{creating ? 'Saving to Supabase...' : 'Save Version Snapshot'}</span>
            </button>
          </div>
        </form>

        {/* Versions List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center justify-between">
            <span>Saved Timeline Versions ({versions.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">Supabase Bucket: nepalai-media/versions/</span>
          </h4>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No version snapshots created yet for this project.</p>
              <p className="text-[11px] text-slate-600">Click "Save Version Snapshot" above to create your first backup checkpoint.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {versions.map(v => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-extrabold border border-indigo-500/30">
                        v{v.versionNumber}
                      </span>
                      <h5 className="text-sm font-bold text-white">{v.title}</h5>
                    </div>
                    <p className="text-xs text-slate-400">{v.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(v.createdAt).toLocaleString()}</span>
                      </span>
                      <span>•</span>
                      <span>By <strong>{v.createdBy}</strong></span>
                      <span>•</span>
                      <span>{v.scenesCount} Scenes ({v.totalDurationSeconds}s)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {v.storageUrl && (
                      <a
                        href={v.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-semibold flex items-center gap-1"
                        title="Download raw JSON snapshot from Supabase Storage"
                      >
                        <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="hidden md:inline">Supabase JSON</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleRestore(v.id)}
                      disabled={restoringId === v.id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoringId === v.id ? 'animate-spin' : ''}`} />
                      <span>{restoringId === v.id ? 'Restoring...' : 'Restore This Version'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
