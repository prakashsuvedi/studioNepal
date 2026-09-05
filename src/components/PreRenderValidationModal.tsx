import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Film, 
  Music, 
  Sparkles, 
  ShieldCheck, 
  Download, 
  X,
  FileCheck
} from 'lucide-react';
import { TimelineValidationReport } from '../types';

interface PreRenderValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: TimelineValidationReport;
  onConfirmRender: () => void;
}

export const PreRenderValidationModal: React.FC<PreRenderValidationModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirmRender
}) => {
  if (!isOpen) return null;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${report.isValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Pre-Render Diagnostic Verification</span>
                {report.isValid ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    PASSED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                    ATTENTION REQUIRED
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Verifying timeline assets, audio tracks, and duration sync before rendering.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Target Duration
              </span>
              <span className="text-lg font-mono font-bold text-indigo-300">
                {formatSecs(report.targetDuration)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Actual: {formatSecs(report.actualDuration)}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5 mb-1">
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                Timeline Scenes
              </span>
              <span className="text-lg font-mono font-bold text-emerald-300">
                {report.sceneCount} Scenes
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {report.totalAssetsCount} total assets
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5 mb-1">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Audio Layers
              </span>
              <span className="text-lg font-mono font-bold text-amber-300">
                {report.audioTrackCount} Tracks
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                {report.audioOverrun ? 'Fade-out active' : 'Perfect length'}
              </span>
            </div>
          </div>

          {/* Validation Checks Status */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Validation Checklist
            </span>

            {/* Check 1: Duration Match */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                {report.durationMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-slate-200">Output Duration Synchronization</span>
                  <p className="text-[11px] text-slate-400">
                    {report.durationMatch
                      ? 'Scene timeline duration matches requested output duration exactly.'
                      : 'Minor variance detected between total scene length and requested export duration.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Check 2: Asset Integrity */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                {report.missingAssets.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-slate-200">Asset & Media Stream Availability</span>
                  <p className="text-[11px] text-slate-400">
                    {report.missingAssets.length === 0
                      ? 'All video clips, image assets, watermarks, and graphics are loaded.'
                      : `${report.missingAssets.length} asset(s) missing or unreachable.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Check 3: Audio Fade / Bound Verification */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200">Audio Track & Waveform Alignment</span>
                  <p className="text-[11px] text-slate-400">
                    Sound tracks checked. Auto-fade applied for background music past clip boundary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Errors List */}
          {report.errors.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-500/40 p-3.5 rounded-xl space-y-1.5">
              <span className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                <XCircle className="w-4 h-4" /> Blocking Errors ({report.errors.length})
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200/90">
                {report.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings List */}
          {report.warnings.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl space-y-1.5">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4" /> Non-blocking Warnings ({report.warnings.length})
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90">
                {report.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Back to Editor
          </button>

          <button
            onClick={onConfirmRender}
            disabled={!report.isValid}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
              report.isValid
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Initiate Final Video Render</span>
          </button>
        </div>
      </div>
    </div>
  );
};
