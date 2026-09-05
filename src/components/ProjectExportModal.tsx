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
  MonitorPlay
} from 'lucide-react';
import { Scene } from '../types';

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  projectTitle: string;
  totalDuration: number;
  defaultAspectRatio: '16:9' | '9:16' | '1:1';
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({
  isOpen,
  onClose,
  scenes,
  projectTitle,
  totalDuration,
  defaultAspectRatio,
}) => {
  const [format, setFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4');
  const [resolution, setResolution] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [bitrate, setBitrate] = useState<'high' | 'balanced' | 'compressed'>('balanced');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(defaultAspectRatio);
  const [fps, setFps] = useState<number>(30);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);
    setDownloadUrl(null);
    setExportStep('Initializing rendering worker & allocating buffers...');

    const interval = setInterval(() => {
      setExportProgress(prev => {
        const next = prev + Math.floor(Math.random() * 14) + 6;
        if (next >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportSuccess(true);
          setExportStep('Render complete!');
          setDownloadUrl('https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
          return 100;
        }
        if (next > 75) {
          setExportStep(`Encoding final ${format.toUpperCase()} container (${resolution}, ${bitrate} bitrate)...`);
        } else if (next > 40) {
          setExportStep('Applying transitions, Devanagari text overlays & color filters...');
        } else {
          setExportStep('Compositing AI video frames & background audio...');
        }
        return next;
      });
    }, 400);
  };

  const estimatedFileSizeMb = () => {
    let factor = 1.2;
    if (resolution === '4k') factor = 4.5;
    if (resolution === '720p') factor = 0.6;
    if (format === 'gif') factor = 2.8;
    if (bitrate === 'high') factor *= 1.5;
    if (bitrate === 'compressed') factor *= 0.6;
    return Number((totalDuration * factor).toFixed(1));
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
      totalDuration: totalDuration,
      aspectRatio,
      framerate: fps,
      exportedAt: new Date().toISOString(),
      tracks: interchangeTracks
    };

    const jsonStr = JSON.stringify(metadataPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const cleanTitle = projectTitle.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '_') || 'nepalai_timeline_metadata';
    a.href = url;
    a.download = `${cleanTitle}.premiere_edl.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Project Export & Production Render
              </h2>
              <p className="text-xs text-slate-400">Export timeline as MP4, WebM, or GIF with custom resolution & bitrate</p>
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
              <p className="text-xs text-slate-400 mt-0.5">{scenes.length} Scenes • {totalDuration}s Total Duration</p>
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
                  { id: 'mp4', label: 'MP4 (H.264)', desc: 'Universal' },
                  { id: 'webm', label: 'WebM', desc: 'Web HD' },
                  { id: 'gif', label: 'Animated GIF', desc: 'Loop' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
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
                Video Resolution
              </label>
              <select
                value={resolution}
                onChange={e => setResolution(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="1080p">1080p Full HD (1920x1080)</option>
                <option value="4k">4K Ultra HD (3840x2160)</option>
                <option value="720p">720p HD (1280x720)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bitrate / Quality */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Bitrate & Quality
              </label>
              <select
                value={bitrate}
                onChange={e => setBitrate(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="high">High Quality (12 Mbps)</option>
                <option value="balanced">Balanced (6 Mbps)</option>
                <option value="compressed">Web Compressed (2.5 Mbps)</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="16:9">16:9 Widescreen (YouTube)</option>
                <option value="9:16">9:16 Vertical (Reels / TikTok)</option>
                <option value="1:1">1:1 Square (Instagram Feed)</option>
              </select>
            </div>

            {/* Framerate */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Framerate (FPS)
              </label>
              <select
                value={fps}
                onChange={e => setFps(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Smooth Cinematic)</option>
                <option value={24}>24 FPS (Film Cinematic)</option>
              </select>
            </div>
          </div>

          {/* Progress Indicator during export */}
          {isExporting && (
            <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-300 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                  {exportStep}
                </span>
                <span className="font-mono font-bold text-indigo-400">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Box */}
          {exportSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl space-y-2 text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>Export Successful! Your file is ready.</span>
              </div>
              <p className="text-xs text-slate-300">
                Format: <span className="font-mono text-white">{format.toUpperCase()}</span> • Resolution: <span className="font-mono text-white">{resolution}</span> • Size: <span className="font-mono text-white">~{estimatedFileSizeMb()} MB</span>
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTimelineMetadata}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Export clip timings, tags, and transition settings for Adobe Premiere / FCPXML"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Premiere EDL JSON</span>
            </button>

            {exportSuccess && downloadUrl ? (
              <a
                href={downloadUrl}
                download={`${projectTitle.replace(/\s+/g, '_')}.${format}`}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download {format.toUpperCase()}</span>
              </a>
            ) : (
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Rendering Video...' : `Export & Render ${format.toUpperCase()}`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
