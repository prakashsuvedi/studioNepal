import React, { useState, useEffect } from 'react';
import { UserSession, UserGenerationTaskLog, UserTrialQuota } from '../types';
import { 
  X, 
  History, 
  Clock, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Film, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Download
} from 'lucide-react';

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  trialUsage: UserTrialQuota | null;
  onOpenPaywall: () => void;
}

export const UsageHistoryModal: React.FC<UsageHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  trialUsage,
  onOpenPaywall,
}) => {
  const [logs, setLogs] = useState<UserGenerationTaskLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'render'>('all');

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/usage-history?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || 'Failed to load task usage history');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching usage history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => filterType === 'all' || log.type === filterType);

  const totalTasks = logs.length;
  const freeTasksCount = logs.filter(l => l.deductionSource === 'daily_free' || l.creditsCost === 0).length;
  const paidCreditsSpent = logs.reduce((acc, l) => acc + (l.creditsCost || 0), 0);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'video': return <Video className="w-4 h-4 text-indigo-500" />;
      case 'audio': return <Mic className="w-4 h-4 text-amber-500" />;
      case 'render': return <Film className="w-4 h-4 text-purple-500" />;
      default: return <Sparkles className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Generation & Credit Usage Audit Log</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Real-time Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent ledger of every AI media task, deduction source, and timestamp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Daily Free Quota
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  {trialUsage ? `📸${3 - trialUsage.imagesCount}/3 • 🎬${1 - trialUsage.videoCount}/1 • 🎙️${1 - trialUsage.audioCount}/1` : 'Active'}
                </div>
                <div className="text-[10px] text-slate-500">Resets daily at midnight</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Paid Package Credits
                </div>
                <div className="text-base font-extrabold text-indigo-400">
                  {user?.credits ?? 0} Credits
                </div>
                <div className="text-[10px] text-slate-500">Tier: {user?.tier.toUpperCase()}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Total Audit Tasks
                </div>
                <div className="text-xl font-black text-white">{totalTasks} Tasks</div>
                <div className="text-[10px] text-slate-400">{freeTasksCount} via Daily Free</div>
              </div>
              <button
                onClick={onOpenPaywall}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Top Up
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'image', 'video', 'audio', 'render'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                    filterType === type
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {type === 'all' ? 'All Tasks' : type}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 hidden sm:inline">
              Showing {filteredLogs.length} entries
            </span>
          </div>

          {/* Task History Table / List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono">Retrieving credit usage ledger...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-400" />
              {error}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-2xl">
              <History className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">No generation tasks recorded yet</p>
              <p className="text-xs text-slate-500">Your image, video, audio, and render tasks will appear here in real time.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map(log => {
                const isDailyFree = log.deductionSource === 'daily_free' || log.creditsCost === 0;
                const formattedDate = new Date(log.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {getMediaIcon(log.type)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 capitalize">
                            {log.type} Generation
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {log.model}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formattedDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-1 italic font-mono bg-slate-900/40 p-1 rounded px-2">
                          "{log.prompt}"
                        </p>
                      </div>
                    </div>

                    {/* Deduction Source & Cost Badge */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {isDailyFree ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>0 Credits (Daily Free Allowance)</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>-{log.creditsCost} Package Credits</span>
                        </div>
                      )}

                      {log.resultUrl && (
                        <a
                          href={log.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View Media Asset"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Credit Leakage Engine Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>

      </div>
    </div>
  );
};
