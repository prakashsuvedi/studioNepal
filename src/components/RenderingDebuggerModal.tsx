import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Search, 
  RefreshCw, 
  X, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Filter,
  Play
} from 'lucide-react';
import { mediaErrorLogger, MediaLogEntry, MediaErrorSeverity, MediaErrorCategory } from '../lib/mediaErrorLogger';
import { detectHardwareCapabilities } from '../lib/hardwareAccelerationDetector';
import { renderPerformanceMonitor, VideoPerformanceMetrics } from '../lib/renderPerformanceMonitor';

interface RenderingDebuggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineInfo?: {
    scenesCount: number;
    currentTime: number;
    aspectRatio: string;
    projectTitle: string;
  };
}

export const RenderingDebuggerModal: React.FC<RenderingDebuggerModalProps> = ({
  isOpen,
  onClose,
  timelineInfo,
}) => {
  const [logs, setLogs] = useState<MediaLogEntry[]>([]);
  const [metrics, setMetrics] = useState<VideoPerformanceMetrics>(renderPerformanceMonitor.getMetrics());
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribeLogs = mediaErrorLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    const unsubscribeMetrics = renderPerformanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });
    return () => {
      unsubscribeLogs();
      unsubscribeMetrics();
    };
  }, [isOpen]);

  const errorCount = useMemo(() => logs.filter(l => l.severity === 'error').length, [logs]);
  const warningCount = useMemo(() => logs.filter(l => l.severity === 'warning').length, [logs]);
  const infoCount = useMemo(() => logs.filter(l => l.severity === 'info').length, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMessage = log.message.toLowerCase().includes(q);
        const matchUrl = log.sourceUrl?.toLowerCase().includes(q);
        const matchCategory = log.category.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        if (!matchMessage && !matchUrl && !matchCategory && !matchDetails) return false;
      }
      return true;
    });
  }, [logs, selectedSeverity, selectedCategory, searchQuery]);

  const handleCopyLogs = () => {
    const hw = detectHardwareCapabilities();
    const header = [
      '========================================================================',
      '             NEPALAI STUDIO - RENDERING DEBUGGER LOGS                   ',
      `Exported: ${new Date().toISOString()}`,
      `Project Title: ${timelineInfo?.projectTitle || 'Untitled'}`,
      `Timeline Position: ${timelineInfo?.currentTime?.toFixed(2) || 0}s | Clips: ${timelineInfo?.scenesCount || 0} | Aspect: ${timelineInfo?.aspectRatio || '16:9'}`,
      `Performance Telemetry: TTFF=${metrics.ttffMs}ms (Avg ${metrics.averageTtffMs}ms) | Jitter=±${metrics.decodingJitterMs}ms | Drops=${metrics.droppedFramesCount} | Buffer=${metrics.bufferAheadSeconds}s`,
      `Pipeline: ${metrics.activeDecoderPipeline.toUpperCase()} | FPS=${metrics.instantFps} (Avg ${metrics.averageFps})`,
      `GPU Hardware Status: ${hw.statusLabel} (${hw.gpuRenderer})`,
      `WebGL: ${hw.webglVersion} | MediaRecorder: ${hw.mediaRecorderSupported ? 'Supported' : 'Unavailable'}`,
      `Codecs: ${hw.supportedCodecs.slice(0, 4).join(', ') || 'Default'}`,
      `User Agent: ${navigator.userAgent}`,
      `Total Log Entries: ${filteredLogs.length} (Errors: ${errorCount}, Warnings: ${warningCount})`,
      '========================================================================\n',
    ].join('\n');

    const body = filteredLogs.map((log, idx) => {
      let str = `[#${idx + 1}] [${log.timestamp}] [${log.severity.toUpperCase()}] [${log.category}]\nMessage: ${log.message}`;
      if (log.sourceUrl) str += `\nSource URL: ${log.sourceUrl}`;
      if (log.clipTitle) str += `\nClip: "${log.clipTitle}" (Index #${log.clipIndex ?? 0})`;
      if (log.details) str += `\nDetails: ${log.details}`;
      if (log.stack) str += `\nStack: ${log.stack}`;
      return str + '\n------------------------------------------------------------------------';
    }).join('\n');

    const fullText = `${header}\n${body}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    }).catch(err => {
      console.warn('Clipboard write notice:', err);
    });
  };

  const handleDownloadLogs = () => {
    const text = mediaErrorLogger.exportLogsAsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nepalai_render_debug_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Rendering Debugger & Console Interceptor
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                  {logs.length} events captured
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Captures real-time media decoding errors, frame stalls, WebGL faults, and audio context events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* One-click Copy Logs Button */}
            <button
              onClick={handleCopyLogs}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                hasCopied
                  ? 'bg-emerald-500 text-slate-950 font-black scale-105'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
              }`}
              title="Copy all formatted debugging logs to clipboard"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied Logs!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Copy Error Logs</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Performance Telemetry Bar (TTFF & Decoding Jitter) */}
        <div className="px-4 py-2 bg-slate-950 border-b border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              DECODER METRICS:
            </span>

            {/* TTFF Badge */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400">TTFF:</span>
              <span className={`font-mono font-bold ${
                metrics.ttffMs === 0 ? 'text-slate-400' : metrics.ttffMs < 100 ? 'text-emerald-400' : metrics.ttffMs < 300 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {metrics.ttffMs > 0 ? `${metrics.ttffMs}ms` : 'Ready'}
              </span>
              {metrics.averageTtffMs > 0 && (
                <span className="text-[9px] text-slate-500 font-mono">avg {metrics.averageTtffMs}ms</span>
              )}
            </div>

            {/* Decoding Jitter Badge */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400">Jitter:</span>
              <span className={`font-mono font-bold ${
                metrics.decodingJitterMs <= 2.5 ? 'text-emerald-400' : metrics.decodingJitterMs <= 6 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                ±{metrics.decodingJitterMs}ms
              </span>
            </div>

            {/* Dropped Frames */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400">Drops:</span>
              <span className={`font-mono font-bold ${metrics.droppedFramesCount === 0 ? 'text-slate-300' : 'text-amber-400'}`}>
                {metrics.droppedFramesCount}
              </span>
            </div>

            {/* Buffer Ahead */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400">Buffer:</span>
              <span className="text-cyan-300 font-mono font-bold">
                {metrics.bufferAheadSeconds.toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-[10px] font-bold uppercase">
              {metrics.activeDecoderPipeline.replace('_', ' ')}
            </span>
            <span className="text-slate-500 text-[10px] font-mono">
              {metrics.instantFps} FPS / {metrics.averageFps} avg
            </span>
          </div>
        </div>

        {/* Quick Stats & Filters Toolbar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Severity Counters & Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedSeverity('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedSeverity === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setSelectedSeverity('error')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'error'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-900/50'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Errors ({errorCount})</span>
            </button>
            <button
              onClick={() => setSelectedSeverity('warning')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'warning'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-900/50'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Warnings ({warningCount})</span>
            </button>
            <button
              onClick={() => setSelectedSeverity('info')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer ${
                selectedSeverity === 'info'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-900/50'
              }`}
            >
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Info ({infoCount})</span>
            </button>
          </div>

          {/* Search Box & Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search error messages, URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 text-xs text-slate-300 px-2 py-1 rounded-md focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="video_decode">Video Decode</option>
              <option value="canvas_render">Canvas Render</option>
              <option value="audio_context">Audio Master</option>
              <option value="webgl">WebGL & GPU</option>
              <option value="media_recorder">MediaRecorder</option>
              <option value="network_stream">Network Stream</option>
            </select>
          </div>
        </div>

        {/* Main Log Stream List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#05070c] font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400/60 mb-1" />
              <p className="text-sm font-semibold text-slate-300">
                No Media Decoding Errors Detected
              </p>
              <p className="text-xs max-w-sm text-slate-500">
                Live preview video decoders, audio contexts, and WebGL canvases are currently operating with 0 intercepted errors.
              </p>
              <button
                onClick={() => mediaErrorLogger.simulateTestLog('error')}
                className="mt-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-xs font-sans font-medium transition cursor-pointer"
              >
                Trigger Test Diagnostic Trace
              </button>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`rounded-lg p-3 border transition cursor-pointer ${
                    log.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-900/60 hover:bg-rose-950/30 text-rose-200'
                      : log.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-900/60 hover:bg-amber-950/30 text-amber-200'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {log.severity === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : log.severity === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-slate-700/60 text-slate-400">
                            {log.timestamp}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            log.severity === 'error' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            log.severity === 'warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}>
                            {log.category.replace('_', ' ')}
                          </span>
                          {log.clipTitle && (
                            <span className="text-[10px] text-purple-300 bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-800/60 truncate max-w-[140px]">
                              Clip: {log.clipTitle}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-100 break-all leading-snug">
                          {log.message}
                        </p>

                        {log.sourceUrl && (
                          <p className="text-[11px] text-cyan-400/80 truncate max-w-xl flex items-center gap-1">
                            <span className="text-slate-500">Source:</span> {log.sourceUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 shrink-0">
                      {isExpanded ? 'Collapse ▲' : 'Details ▼'}
                    </div>
                  </div>

                  {/* Expanded Trace Details */}
                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 bg-black/40 p-2 rounded">
                      {log.details && (
                        <div>
                          <span className="text-slate-400 font-bold block">Extended Error Trace:</span>
                          <pre className="text-slate-300 whitespace-pre-wrap overflow-x-auto text-[10px] p-1.5 bg-black/60 rounded border border-slate-800">
                            {log.details}
                          </pre>
                        </div>
                      )}
                      {log.stack && (
                        <div>
                          <span className="text-slate-400 font-bold block">Call Stack:</span>
                          <pre className="text-slate-400 whitespace-pre-wrap overflow-x-auto text-[10px] p-1.5 bg-black/60 rounded border border-slate-800">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Control Strip */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => mediaErrorLogger.clearLogs()}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-slate-400" />
              <span>Clear Logs</span>
            </button>

            <button
              onClick={handleDownloadLogs}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={() => mediaErrorLogger.simulateTestLog('warning')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-md text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Simulate Event</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-sans">
            Auto-captured from HTMLVideoElement, WebGL & AudioContext pipelines
          </div>
        </div>
      </div>
    </div>
  );
};
