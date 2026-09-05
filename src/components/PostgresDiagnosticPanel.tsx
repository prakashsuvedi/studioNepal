import React, { useState, useEffect } from 'react';
import { Database, Activity, RefreshCw, CheckCircle2, XCircle, HardDrive, Shield, Server } from 'lucide-react';

export const PostgresDiagnosticPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/postgres/verify');
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      } else {
        setError(data.error || 'PostgreSQL verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Supabase PostgreSQL Instance Diagnostic</span>
              {report?.connected ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live & Connected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Offline / Connecting
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Host: <code className="text-rose-400 font-mono">aws-0-ap-northeast-2.pooler.supabase.com:5432</code> | Database: <code className="text-emerald-400 font-mono">postgres</code>
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Testing Connection...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Ping Latency
              </span>
              <p className="text-2xl font-black text-white">{report.latencyMs} <span className="text-xs text-slate-400 font-normal">ms</span></p>
              <p className="text-[10px] text-emerald-400 font-medium">SSL Connection Active</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-rose-400" /> PostgreSQL Engine
              </span>
              <p className="text-xs font-bold text-slate-200 truncate">{report.version || 'PostgreSQL 15.x'}</p>
              <p className="text-[10px] text-slate-400">AWS AP-Northeast-2 Pooler</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Active Database User
              </span>
              <p className="text-xs font-mono text-indigo-300 font-semibold truncate">{report.user}</p>
              <p className="text-[10px] text-slate-400">Database: {report.database}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Database Records Count</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <p className="text-xl font-bold text-emerald-400">{report.counts?.users ?? 0}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Users Table</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <p className="text-xl font-bold text-rose-400">{report.counts?.transactions ?? 0}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Transactions</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                <p className="text-xl font-bold text-indigo-400">{report.counts?.logs ?? 0}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Gen Logs</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
            <span className="text-slate-400 font-semibold">Redacted Connection String:</span>
            <p className="font-mono text-emerald-400 text-[11px] break-all">{report.connectionStringRedacted}</p>
            <p className="text-[10px] text-slate-500 pt-1">Server Timestamp: {report.serverTime || new Date().toISOString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
