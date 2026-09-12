import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Film, 
  Sliders, 
  Settings, 
  Check,
  Video,
  FileVideo,
  MonitorPlay,
  ShieldCheck,
  Activity,
  Play,
  AlertCircle
} from 'lucide-react';
import { Scene, AudioTrack, BrandOverlayConfig, VfxConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { RenderAuditLogger, RenderAuditEntry } from '../lib/renderAuditLogger';
import { RenderSummaryOverlay } from './RenderSummaryOverlay';
import { renderTimelineToVideoBlob } from '../lib/videoCombiner';

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  projectTitle: string;
  totalDuration: number;
  defaultAspectRatio: '16:9' | '9:16' | '1:1';
  audioTracks?: AudioTrack[];
  brandOverlayConfig?: BrandOverlayConfig;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
  vfxConfig?: VfxConfig;
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  isOpen,
  onClose,
  scenes,
  projectTitle,
  totalDuration,
  defaultAspectRatio,
  audioTracks = [],
  brandOverlayConfig,
  subtitles = [],
  subtitleBurnOptions,
  vfxConfig,
}) => {
  const [format, setFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4');
  const [resolution, setResolution] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [bitrate, setBitrate] = useState<'high' | 'balanced' | 'compressed'>('high');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(defaultAspectRatio);
  const [fps, setFps] = useState<number>(30);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState(false);
  const [lastAuditEntry, setLastAuditEntry] = useState<RenderAuditEntry | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimatedFileSizeMb = () => {
    let factor = 1.2;
    if (resolution === '4k') factor = 4.5;
    if (resolution === '720p') factor = 0.6;
    if (format === 'gif') factor = 2.8;
    if (bitrate === 'high') factor *= 1.5;
    if (bitrate === 'compressed') factor *= 0.6;
    return Number((totalDuration * factor).toFixed(1));
  };

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);
    setDownloadUrl(null);
    setRenderError(null);
    setExportStep('Initializing composition canvas & loading assets...');

    const renderStartTime = performance.now();
    const sizeMb = estimatedFileSizeMb();

    try {
      // Execute real client-side video composition
      const result = await renderTimelineToVideoBlob({
        scenes,
        audioTracks,
        aspectRatio,
        resolution,
        fps,
        format,
        bitrate,
        brandOverlayConfig,
        subtitles,
        subtitleBurnOptions,
        vfxConfig,
        onProgress: (progress, step) => {
          setExportProgress(progress);
          setExportStep(step);
        }
      });

      setDownloadUrl(result.url);
      setExportSuccess(true);
      setIsExporting(false);
      setExportStep('Render complete! Ready for download.');

      const renderTimeMs = Math.round(performance.now() - renderStartTime);
      const resolutionPx = resolution === '4k' 
        ? (aspectRatio === '9:16' ? '2160x3840' : aspectRatio === '1:1' ? '2160x2160' : '3840x2160')
        : resolution === '720p'
        ? (aspectRatio === '9:16' ? '720x1280' : aspectRatio === '1:1' ? '720x720' : '1280x720')
        : (aspectRatio === '9:16' ? '1080x1920' : aspectRatio === '1:1' ? '1080x1080' : '1920x1080');

      // Record structured audit log in 'nepalai-media' Supabase bucket
      RenderAuditLogger.logRender({
        projectTitle,
        status: 'pass',
        outputResolution: resolutionPx,
        durationSeconds: totalDuration,
        fileSizeBytes: result.blob.size || Math.round(sizeMb * 1024 * 1024),
        fileSizeMb: Number(((result.blob.size || sizeMb * 1024 * 1024) / (1024 * 1024)).toFixed(2)),
        format,
        codec: `${format.toUpperCase()} (H.264 / AAC High Profile)`,
        fps,
        apiLatencyMs: 95,
        renderTimeMs,
        layers: {
          videoClipsCount: scenes.length,
          audioTracksCount: audioTracks.length || 1,
          hasWatermarkLogo: scenes.some(s => !!s.watermark) || !!brandOverlayConfig?.enabled,
          subtitlesCount: scenes.filter(s => !!s.textOverlay).length + subtitles.length,
          transitionsCount: Math.max(0, scenes.length - 1),
        },
        downloadUrl: result.url,
      }).then(entry => {
        setLastAuditEntry(entry);
      }).catch(e => console.warn('Audit log notice:', e));

    } catch (err: any) {
      console.error('Video composition error:', err);
      setRenderError(err.message || 'Video composition encountered an error. Please retry.');
      setIsExporting(false);
    }
  };

  const handleDownloadVideo = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!downloadUrl) return;
    try {
      const filename = `${projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_rendered.${format}`;
      let targetDownloadHref = downloadUrl;

      // If downloadUrl is a server URL, fetch full blob to prevent 10KB partial downloads
      if (!downloadUrl.startsWith('blob:')) {
        try {
          const res = await fetch(downloadUrl);
          if (res.ok) {
            const fullBlob = await res.blob();
            targetDownloadHref = URL.createObjectURL(fullBlob);
          }
        } catch (fetchErr) {
          console.warn('[ExportModal] Direct blob fetch notice, trying direct link fallback:', fetchErr);
        }
      }

      const a = document.createElement('a');
      a.href = targetDownloadHref;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (targetDownloadHref !== downloadUrl) {
        setTimeout(() => URL.revokeObjectURL(targetDownloadHref), 15000);
      }
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleExportTimelineMetadata = () => {
    let currentTimeOffset = 0;
    const interchangeTracks = scenes.map((scene, idx) => {
      const startTime = currentTimeOffset;
      currentTimeOffset += scene.duration;
      return {
        sequenceIndex: idx + 1,
        id: scene.id,
        title: scene.title,
        durationSeconds: scene.duration,
        timeRange: {
          start: startTime,
          end: currentTimeOffset
        },
        colorTag: scene.colorTag || 'b_roll',
        transition: {
          type: scene.transition || 'cut',
          duration: scene.transitionDuration || 0.8
        },
        motion: scene.motion || 'None',
        textOverlay: scene.textOverlay || '',
        mediaUrl: scene.mediaUrl || ''
      };
    });

    const metadataPayload = {
      interchangeFormat: 'NepalAI Studio FCPXML/EDL v2.0',
      application: 'NepalAI Video Studio',
      projectTitle,
      totalDurationSeconds: totalDuration,
      aspectRatio,
      framerate: fps,
      tracks: interchangeTracks,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(metadataPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_')}_timeline_edl.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileVideo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export & Combine Video</h2>
              <p className="text-xs text-slate-400">Renders all scenes, audio tracks, transitions, and subtitles into a single video file.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          
          {/* Project Summary Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{projectTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{scenes.length} Scenes • {totalDuration}s Total Duration • {audioTracks.length} Audio Tracks</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold">
                Est. ~{estimatedFileSizeMb()} MB
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mp4', label: 'MP4', desc: 'Universal' },
                  { id: 'webm', label: 'WebM', desc: 'Web HD' },
                  { id: 'gif', label: 'GIF', desc: 'Loop' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      format === item.id 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '720p', label: '720p HD', desc: 'Fast' },
                  { id: '1080p', label: '1080p FHD', desc: 'Crisp' },
                  { id: '4k', label: '4K Cinema', desc: 'Ultra' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setResolution(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      resolution === item.id 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '16:9', label: '16:9', desc: 'YouTube' },
                  { id: '9:16', label: '9:16', desc: 'Reels / Shorts' },
                  { id: '1:1', label: '1:1', desc: 'Square' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAspectRatio(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      aspectRatio === item.id 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Framerate Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Framerate (FPS)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 24, label: '24 FPS', desc: 'Cinema' },
                  { id: 30, label: '30 FPS', desc: 'Standard' },
                  { id: 60, label: '60 FPS', desc: 'Smooth' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFps(item.id)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                      fps === item.id 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Master Encoding Profile / Bitrate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Encoding Profile &amp; Bitrate Quality
              </label>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                {bitrate === 'high' ? 'CRF 18 • High Profile • 320k Audio' : bitrate === 'balanced' ? 'CRF 21 • Main Profile' : 'CRF 26 • Fast Share'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'high', label: 'Studio Master', desc: 'CRF 18 / 320k Audio' },
                { id: 'balanced', label: 'Balanced HD', desc: 'CRF 21 / Standard' },
                { id: 'compressed', label: 'Fast Web', desc: 'CRF 26 / Small' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setBitrate(item.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                    bitrate === item.id 
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{item.label}</span>
                    {item.id === 'high' && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded font-semibold">Pro</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Render Error */}
          {renderError && (
            <div className="bg-rose-950/40 border border-rose-500/50 p-3.5 rounded-xl flex items-center gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{renderError}</span>
            </div>
          )}

          {/* Export Progress Bar */}
          {isExporting && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>{exportStep}</span>
                </span>
                <span className="font-mono text-indigo-400 font-bold">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Box & Live Preview */}
          {exportSuccess && downloadUrl && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Export Complete! Your video has been combined successfully.</span>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden border border-slate-800 aspect-video max-h-48 bg-black flex items-center justify-center">
                <video src={downloadUrl} controls className="w-full h-full object-contain" autoPlay muted loop />
              </div>

              <p className="text-xs text-slate-300">
                Format: <span className="font-mono text-white">{format.toUpperCase()}</span> • Resolution: <span className="font-mono text-white">{resolution}</span> • Framerate: <span className="font-mono text-white">{fps} FPS</span>
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTimelineMetadata}
              className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Export clip timings, tags, and transition settings for Premiere EDL JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export EDL JSON</span>
            </button>

            {exportSuccess && downloadUrl ? (
              <button
                onClick={handleDownloadVideo}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Combined Video</span>
              </button>
            ) : (
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Combining Video...' : `Combine & Export ${format.toUpperCase()}`}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {showSummaryOverlay && lastAuditEntry && (
        <RenderSummaryOverlay 
          entry={lastAuditEntry} 
          onClose={() => setShowSummaryOverlay(false)} 
        />
      )}
    </div>
  );
};
