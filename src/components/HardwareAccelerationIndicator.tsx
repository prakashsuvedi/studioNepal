import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Info, 
  Monitor, 
  ShieldCheck, 
  X, 
  ExternalLink,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { detectHardwareCapabilities, HardwareCapabilities } from '../lib/hardwareAccelerationDetector';

interface HardwareAccelerationIndicatorProps {
  onOpenDebugger?: () => void;
  className?: string;
  showNotificationBanner?: boolean;
}

export const HardwareAccelerationIndicator: React.FC<HardwareAccelerationIndicatorProps> = ({
  onOpenDebugger,
  className = '',
  showNotificationBanner = true,
}) => {
  const [capabilities, setCapabilities] = useState<HardwareCapabilities | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const caps = detectHardwareCapabilities();
    setCapabilities(caps);
  }, []);

  if (!capabilities) return null;

  const isOptimal = capabilities.statusTier === 'optimal';
  const isSoftware = capabilities.statusTier === 'warning_software';
  const isCritical = capabilities.statusTier === 'critical_unsupported';

  return (
    <>
      {/* 1. Status Indicator Pill in UI */}
      <button
        onClick={() => setShowModal(true)}
        className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
          isOptimal
            ? 'bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
            : isSoftware
            ? 'bg-amber-950/50 hover:bg-amber-950/70 text-amber-300 border-amber-800/70 animate-pulse'
            : 'bg-rose-950/60 hover:bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
        } ${className}`}
        title={`Hardware Acceleration Status: ${capabilities.statusLabel} (${capabilities.gpuRenderer})`}
      >
        {isOptimal ? (
          <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/20 shrink-0" />
        ) : isSoftware ? (
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        ) : (
          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
        )}

        <span className="font-semibold hidden xl:inline">
          {isOptimal ? 'GPU Accel: Active' : isSoftware ? 'GPU: Software Mode' : 'GPU: Disabled'}
        </span>
        <span className="font-semibold hidden sm:inline xl:hidden">
          {isOptimal ? 'GPU' : isSoftware ? 'CPU' : 'No GPU'}
        </span>
      </button>

      {/* 2. Immediate UI Alert Banner if Hardware Acceleration / MediaRecorder is Unavailable or in Software mode */}
      {showNotificationBanner && !bannerDismissed && (isCritical || isSoftware) && (
        <div className="absolute top-12 left-0 right-0 z-40 px-4 py-2 bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-amber-950/95 border-b border-amber-600/70 backdrop-blur-md shadow-xl flex items-center justify-between gap-3 text-xs text-amber-200 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 max-w-3xl">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-300">Hardware Acceleration Notice: </span>
              <span>
                {isCritical 
                  ? 'WebGL or MediaRecorder is not detected in your browser. Live previews will use software fallback, and video exports will render via server-side FFmpeg.'
                  : 'Your browser is using CPU software rasterization (SwiftShader/llvmpipe). GPU hardware acceleration may be disabled in browser settings.'
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
            >
              View Diagnostics
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-amber-400 hover:text-white rounded transition cursor-pointer"
              title="Dismiss warning banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Detailed Hardware Acceleration & Capabilities Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
          <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isOptimal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    Hardware Acceleration & Media Capabilities
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    GPU decoding, WebGL compositor & MediaRecorder codec profile
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
              
              {/* Overall Status Banner */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                isOptimal 
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200' 
                  : isSoftware 
                  ? 'bg-amber-950/30 border-amber-800/80 text-amber-200' 
                  : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
              }`}>
                {isOptimal ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{capabilities.statusLabel}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isOptimal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {capabilities.statusTier.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {capabilities.recommendation || 'Your GPU hardware acceleration is active and supporting 60 FPS real-time canvas composition and WebGL rendering.'}
                  </p>
                </div>
              </div>

              {/* Hardware & Graphics Pipeline Grid */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  Graphics & Compositing Pipeline
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">GPU Renderer:</span>
                    <span className="text-slate-200 font-semibold break-all">{capabilities.gpuRenderer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GPU Vendor:</span>
                    <span className="text-slate-200 font-semibold">{capabilities.gpuVendor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">WebGL Version:</span>
                    <span className={capabilities.webglSupported ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {capabilities.webglVersion}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Max Texture Resolution:</span>
                    <span className="text-cyan-300 font-semibold">{capabilities.maxTextureSize}px</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CPU Threads:</span>
                    <span className="text-slate-200 font-semibold">{capabilities.hardwareConcurrency} Cores</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Offscreen / Stream Capture:</span>
                    <span className={capabilities.canvasCaptureStreamSupported ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {capabilities.canvasCaptureStreamSupported ? 'Supported' : 'Limited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MediaRecorder & Video Codecs Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  MediaRecorder & Codec Profiles
                </h4>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">MediaRecorder API:</span>
                    <span className={`font-bold font-mono ${capabilities.mediaRecorderSupported ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {capabilities.mediaRecorderSupported ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1.5">Hardware-Supported Export Codecs:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {capabilities.supportedCodecs.length > 0 ? (
                        capabilities.supportedCodecs.map((codec) => (
                          <span
                            key={codec}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700/70 text-[10px] font-mono text-purple-300"
                          >
                            {codec}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">No native WebM/MP4 hardware encoder codecs detected.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Instructions */}
              {!isOptimal && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-200 block">How to enable GPU acceleration in your browser:</span>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                    <li><strong className="text-cyan-300">Chrome / Brave / Edge:</strong> Open <code className="bg-black/60 px-1 rounded text-amber-300">chrome://settings/system</code> and toggle on <em>"Use graphics acceleration when available"</em>.</li>
                    <li><strong className="text-cyan-300">Firefox:</strong> Go to <code className="bg-black/60 px-1 rounded text-amber-300">about:preferences</code> &gt; General &gt; Performance, and enable <em>"Use recommended performance settings"</em>.</li>
                    <li><strong className="text-cyan-300">Server FFmpeg Fallback:</strong> Regardless of local GPU support, clicking <em>Export</em> will securely encode via server-side FFmpeg.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              {onOpenDebugger && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    onOpenDebugger();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Rendering Debugger Panel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="ml-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
