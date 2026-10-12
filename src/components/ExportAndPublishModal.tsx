import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Film, 
  Sliders, 
  Check, 
  Video, 
  FileVideo, 
  FolderDown, 
  Youtube, 
  Share2, 
  Globe, 
  Lock, 
  Tag, 
  ExternalLink, 
  Copy, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Activity, 
  RotateCw, 
  AlertCircle,
  HelpCircle,
  Smartphone,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Scene, AudioTrack, BrandOverlayConfig, VfxConfig } from '../types';
import { SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { renderTimelineToVideoBlob } from '../lib/videoCombiner';
import { exportProjectAssetsToZip } from '../lib/projectAssetExporter';
import { RenderAuditLogger, RenderAuditEntry } from '../lib/renderAuditLogger';
import { YouTubeConnectModal, YouTubeChannelInfo } from './YouTubeConnectModal';
import { TikTokConnectModal, TikTokAccountInfo } from './TikTokConnectModal';

export interface ExportAndPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'render' | 'youtube' | 'social';
  projectTitle: string;
  scenes: Scene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDuration: number;
  audioTracks?: AudioTrack[];
  brandOverlayConfig?: BrandOverlayConfig;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
  vfxConfig?: VfxConfig;
  initialVideoUrl?: string;
  onVideoRendered?: (blobUrl: string) => void;
}

const YOUTUBE_CATEGORIES = [
  { id: '22', name: 'People & Blogs' },
  { id: '1', name: 'Film & Animation' },
  { id: '24', name: 'Entertainment' },
  { id: '28', name: 'Science & Technology' },
  { id: '27', name: 'Education' },
  { id: '10', name: 'Music' },
  { id: '19', name: 'Travel & Events' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
];

export const ExportAndPublishModal: React.FC<ExportAndPublishModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'render',
  projectTitle,
  scenes,
  aspectRatio: defaultAspectRatio,
  totalDuration,
  audioTracks = [],
  brandOverlayConfig,
  subtitles = [],
  subtitleBurnOptions,
  vfxConfig,
  initialVideoUrl,
  onVideoRendered,
}) => {
  const [activeTab, setActiveTab] = useState<'render' | 'youtube' | 'social'>(initialTab);

  // Sync initial tab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Shared Video Asset State across tabs
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(initialVideoUrl || null);

  // ----------------------------------------------------
  // TAB 1: FILE RENDER & PRESETS STATE
  // ----------------------------------------------------
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [resolution, setResolution] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [bitrate, setBitrate] = useState<'high' | 'balanced' | 'compressed'>('high');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(defaultAspectRatio);
  const [fps, setFps] = useState<number>(30);
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(Boolean(subtitleBurnOptions?.burnInSubtitles));

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipStep, setZipStep] = useState('');

  // ----------------------------------------------------
  // TAB 2: YOUTUBE DIRECT PUBLISHER STATE
  // ----------------------------------------------------
  const [showYtConnectModal, setShowYtConnectModal] = useState(false);
  const [ytChannel, setYtChannel] = useState<YouTubeChannelInfo | null>(() => {
    try {
      const saved = localStorage.getItem('nepalai_yt_channel');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [ytTitle, setYtTitle] = useState(projectTitle);
  const [ytDescription, setYtDescription] = useState(
    `Produced with NepalAI Studio - Nepal's premier generative AI video engine.\n\n#NepalAI #MadeInNepal #GenerativeAI`
  );
  const [ytTags, setYtTags] = useState('nepal, ai, film, nepalai');
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [ytCategoryId, setYtCategoryId] = useState('22');
  const [ytMadeForKids, setYtMadeForKids] = useState(false);
  const [isYtUploading, setIsYtUploading] = useState(false);
  const [ytUploadProgress, setYtUploadProgress] = useState(0);
  const [ytPublishResult, setYtPublishResult] = useState<{ url: string; videoId: string } | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);

  // ----------------------------------------------------
  // TAB 3: MULTI-PLATFORM SOCIAL STATE
  // ----------------------------------------------------
  const [showTikTokConnectModal, setShowTikTokConnectModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'instagram']);
  const [socialCaption, setSocialCaption] = useState(projectTitle);
  const [socialHashtags, setSocialHashtags] = useState<string[]>([
    'NepalAI',
    'AIReels',
    'TechNepal',
    'ViralNepal'
  ]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSocialPublishing, setIsSocialPublishing] = useState(false);
  const [socialProgress, setSocialProgress] = useState<Record<string, { status: string; percent: number }>>({});
  const [socialResults, setSocialResults] = useState<Record<string, { success: boolean; url?: string; error?: string }>>({});

  if (!isOpen) return null;

  // ----------------------------------------------------
  // HANDLERS: VIDEO RENDER & DOWNLOAD
  // ----------------------------------------------------
  const handleStartRender = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setExportStep('Initializing audio-visual compositing pipeline...');
    setRenderError(null);
    setExportSuccess(false);

    try {
      const activeAudio = audioTracks.filter(t => !t.isMuted && (t.volume ?? 100) > 0);

      const res = await renderTimelineToVideoBlob({
        scenes,
        audioTracks: activeAudio,
        aspectRatio,
        format,
        resolution,
        fps,
        bitrate,
        subtitles: burnSubtitles ? subtitles : [],
        subtitleBurnOptions,
        brandOverlayConfig,
        vfxConfig,
        onProgress: (p, msg) => {
          setExportProgress(Math.min(99, Math.max(10, Math.round(p))));
          if (msg) setExportStep(msg);
        },
      });

      setExportProgress(100);
      setExportStep('Render Complete! Video ready for download and publishing.');
      setExportSuccess(true);
      setRenderedBlobUrl(res.url);
      if (onVideoRendered) {
        onVideoRendered(res.url);
      }
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('[ExportAndPublishModal] Render failed:', err);
      setRenderError(err.message || 'Video rendering failed. Please try a lower resolution or standard format.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    setZipStep('Archiving media files into ZIP bundle...');
    try {
      const result = await exportProjectAssetsToZip(
        projectTitle,
        scenes,
        audioTracks,
        aspectRatio,
        (p) => setZipStep(`${p.step} (${Math.round(p.percent)}%)`)
      );
      if (result && result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        alert('Failed to bundle project ZIP');
      }
    } catch (e: any) {
      alert('Export failed: ' + (e.message || String(e)));
    } finally {
      setIsExportingZip(false);
      setZipStep('');
    }
  };

  const handleExportJson = () => {
    const projectData = {
      version: '2.5.0',
      projectTitle,
      exportedAt: new Date().toISOString(),
      aspectRatio,
      totalDuration,
      scenes,
      audioTracks,
      subtitles,
      brandOverlayConfig,
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.nepalai.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // HANDLERS: YOUTUBE DIRECT UPLOAD
  // ----------------------------------------------------
  const handlePublishYouTube = async () => {
    if (!ytChannel) {
      setShowYtConnectModal(true);
      return;
    }

    const videoUrlToUpload = renderedBlobUrl || scenes[0]?.mediaUrl;
    if (!videoUrlToUpload) {
      setYtError('No video source available. Please render your project first in the Video Export tab.');
      return;
    }

    setIsYtUploading(true);
    setYtUploadProgress(15);
    setYtError(null);
    setYtPublishResult(null);

    try {
      const isShorts = aspectRatio === '9:16' || totalDuration <= 60;
      const formattedTitle = isShorts && !ytTitle.includes('#Shorts')
        ? `${ytTitle} #Shorts`
        : ytTitle;

      setYtUploadProgress(40);

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formattedTitle,
          description: ytDescription,
          tags: ytTags.split(',').map(t => t.trim()).filter(Boolean),
          privacy: ytPrivacy,
          categoryId: ytCategoryId,
          madeForKids: ytMadeForKids,
          videoUrl: videoUrlToUpload,
          channelId: ytChannel.channelId,
        }),
      });

      setYtUploadProgress(85);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'YouTube upload request failed.');
      }

      setYtUploadProgress(100);
      setYtPublishResult({
        url: data.videoUrl || `https://www.youtube.com/watch?v=${data.videoId}`,
        videoId: data.videoId || 'nepalai_yt_sample',
      });
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('[YouTube Publish] Error:', err);
      setYtError(err.message || 'Failed to publish to YouTube. Check channel authorization.');
    } finally {
      setIsYtUploading(false);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: SOCIAL MULTI-CHANNEL PUBLISH
  // ----------------------------------------------------
  const handlePublishSocial = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one social media channel.');
      return;
    }

    setIsSocialPublishing(true);
    setSocialResults({});

    const videoUrl = renderedBlobUrl || scenes[0]?.mediaUrl;

    for (const platform of selectedPlatforms) {
      setSocialProgress(prev => ({
        ...prev,
        [platform]: { status: 'Publishing...', percent: 45 },
      }));

      try {
        const res = await fetch('/api/social/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            title: socialCaption,
            hashtags: socialHashtags,
            videoUrl,
            aspectRatio,
          }),
        });

        const data = await res.json();
        setSocialProgress(prev => ({
          ...prev,
          [platform]: { status: data.success ? 'Published' : 'Failed', percent: 100 },
        }));
        setSocialResults(prev => ({
          ...prev,
          [platform]: {
            success: data.success,
            url: data.postUrl,
            error: data.error,
          },
        }));
      } catch (e: any) {
        setSocialProgress(prev => ({
          ...prev,
          [platform]: { status: 'Failed', percent: 100 },
        }));
        setSocialResults(prev => ({
          ...prev,
          [platform]: { success: false, error: e.message },
        }));
      }
    }

    setIsSocialPublishing(false);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header & Tab Deck */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Export & Publish Hub</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase tracking-wider border border-cyan-500/30">
                  Universal Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {projectTitle} • {scenes.length} Scenes • {totalDuration.toFixed(1)}s • {aspectRatio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 3-Tab Segmented Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('render')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'render'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('youtube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'youtube'
                    ? 'bg-red-600 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Suite</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Export Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* ======================================================== */}
          {/* TAB 1: VIDEO FILE RENDER & PRESETS                       */}
          {/* ======================================================== */}
          {activeTab === 'render' && (
            <div className="space-y-6">
              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div 
                  onClick={() => { setResolution('1080p'); setFormat('mp4'); setBitrate('high'); setFps(30); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    resolution === '1080p' && format === 'mp4'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Full HD Master (1080p)</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/80">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Crisp 1920x1080 export optimized for YouTube, Instagram Reels, and broadcast presentations.
                  </p>
                  <span className="text-[10px] font-mono text-slate-500">H.264 • 30 FPS • ~12 Mbps</span>
                </div>

                <div 
                  onClick={() => { setResolution('4k'); setFormat('mp4'); setBitrate('high'); setFps(60); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    resolution === '4k'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Cinema 4K Ultra HD</span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800/80">
                      Pro Studio
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Maximum fidelity 3840x2160 with deep dynamic range for client masters and cinema displays.
                  </p>
                  <span className="text-[10px] font-mono text-slate-500">ProRes Profile • 60 FPS • High Bitrate</span>
                </div>

                <div 
                  onClick={() => { setResolution('720p'); setFormat('webm'); setBitrate('compressed'); setFps(30); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    resolution === '720p'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Fast Web Draft (720p)</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/80">
                      Lightweight
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Rapid rendering with compact file size for Discord, WhatsApp, and quick team approvals.
                  </p>
                  <span className="text-[10px] font-mono text-slate-500">WebM/VP9 • Fast Transcode • Low Size</span>
                </div>
              </div>

              {/* Rendering Parameters Strip */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Render Pipeline Settings</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Format */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Container Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="mp4">MP4 (H.264 Universal)</option>
                      <option value="webm">WebM (VP9 Open Standard)</option>
                    </select>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Canvas Aspect</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="16:9">16:9 Landscape (YouTube/TV)</option>
                      <option value="9:16">9:16 Vertical (TikTok/Reels)</option>
                      <option value="1:1">1:1 Square (Feed/Instagram)</option>
                    </select>
                  </div>

                  {/* Bitrate */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Encoding Bitrate</label>
                    <select
                      value={bitrate}
                      onChange={(e) => setBitrate(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="high">High Fidelity (VBR 2-Pass)</option>
                      <option value="balanced">Balanced (Standard Web)</option>
                      <option value="compressed">Compressed (Fast Draft)</option>
                    </select>
                  </div>

                  {/* Framerate */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Framerate</label>
                    <select
                      value={fps}
                      onChange={(e) => setFps(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value={30}>30 FPS (Standard Broadcast)</option>
                      <option value={60}>60 FPS (Ultra Smooth Motion)</option>
                      <option value={24}>24 FPS (Cinematic 24p)</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle Burn-In & Brand Watermark Toggles */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={burnSubtitles}
                      onChange={(e) => setBurnSubtitles(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
                    />
                    <span>Burn Devanagari / English subtitles permanently into video frames ({subtitles.length} lines)</span>
                  </label>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hardware Audio Normalization Active</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar / Error Notices */}
              {isExporting && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>{exportStep || 'Rendering video frames...'}</span>
                    </span>
                    <span className="font-mono">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-300 rounded-full"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {renderError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{renderError}</span>
                </div>
              )}

              {exportSuccess && renderedBlobUrl && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Rendering Finished Successfully!</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      Ready for Export & Direct Publish
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={renderedBlobUrl}
                      download={`${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${resolution}.${format}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video File ({format.toUpperCase()})</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setActiveTab('youtube')}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-red-600/20"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Publish Directly to YouTube</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('social')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Distribute to TikTok & Reels</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isExportingZip}
                    onClick={handleExportZip}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    title="Export all video, image, audio, and subtitle assets into a ZIP file"
                  >
                    <FolderDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isExportingZip ? zipStep : 'Export Project ZIP'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Save portable .nepalai.json project file"
                  >
                    <FileVideo className="w-3.5 h-3.5 text-purple-400" />
                    <span>Project JSON Backup</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleStartRender}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isExporting ? 'Compositing Video...' : 'Start Video Render'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: YOUTUBE DIRECT PUBLISHER                          */}
          {/* ======================================================== */}
          {activeTab === 'youtube' && (
            <div className="space-y-5">
              {/* Channel Authorization Header */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    {ytChannel ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{ytChannel.title}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                            Connected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          Channel ID: {ytChannel.channelId}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-white">No YouTube Channel Connected</p>
                        <p className="text-[11px] text-slate-400">
                          Authenticate with Google OAuth to enable 1-click video publishing
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowYtConnectModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{ytChannel ? 'Switch Channel' : 'Connect Channel'}</span>
                </button>
              </div>

              {/* YouTube Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Video Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      maxLength={100}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-red-500"
                      placeholder="e.g. Exploring Hidden Nepal • 4K AI Documentary"
                    />
                    <span className="text-[10px] text-slate-500 block text-right mt-0.5">
                      {ytTitle.length} / 100
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={ytDescription}
                      onChange={(e) => setYtDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500 resize-none font-sans"
                      placeholder="Add timestamps, credits, and links..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Search Tags (Comma separated)</label>
                    <input
                      type="text"
                      value={ytTags}
                      onChange={(e) => setYtTags(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
                      placeholder="nepal, ai, generative video, travel"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Privacy Level</label>
                      <select
                        value={ytPrivacy}
                        onChange={(e) => setYtPrivacy(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="public">🌐 Public (Immediate)</option>
                        <option value="unlisted">🔒 Unlisted (Link only)</option>
                        <option value="private">👁️ Private (Draft)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                      <select
                        value={ytCategoryId}
                        onChange={(e) => setYtCategoryId(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                      >
                        {YOUTUBE_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ytMadeForKids}
                        onChange={(e) => setYtMadeForKids(e.target.checked)}
                        className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-slate-950 border-slate-700"
                      />
                      <span>Made for Kids (COPPA Compliant)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isYtUploading && (
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-red-300">
                    <span className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-red-400" />
                      <span>Uploading to YouTube Data API v3...</span>
                    </span>
                    <span className="font-mono">{ytUploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 rounded-full"
                      style={{ width: `${ytUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {ytError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{ytError}</span>
                </div>
              )}

              {ytPublishResult && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Published to YouTube Successfully!</span>
                    </span>
                    <a
                      href={ytPublishResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Watch Video</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Publish Action Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  {renderedBlobUrl ? '✅ Using locally rendered video master' : '⚡ Cloud rendering will be packaged on submit'}
                </p>

                <button
                  type="button"
                  disabled={isYtUploading}
                  onClick={handlePublishYouTube}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isYtUploading ? 'Publishing...' : 'Publish to YouTube'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MULTI-PLATFORM SOCIAL SUITE                       */}
          {/* ======================================================== */}
          {activeTab === 'social' && (
            <div className="space-y-5">
              {/* Channel Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Select Target Platforms</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'tiktok', name: 'TikTok', color: 'from-cyan-500 to-rose-500', format: '9:16 Shorts' },
                    { id: 'instagram', name: 'Instagram', color: 'from-purple-600 to-pink-500', format: 'Reels / Feed' },
                    { id: 'facebook', name: 'Facebook', color: 'from-blue-600 to-indigo-600', format: 'Watch / Stories' },
                    { id: 'x', name: 'X / Twitter', color: 'from-slate-700 to-slate-900', format: 'HD Video Feed' },
                  ].map(platform => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <div
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            isSelected ? prev.filter(p => p !== platform.id) : [...prev, platform.id]
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-pink-500 bg-pink-950/20 ring-1 ring-pink-500/50'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{platform.name}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-pink-500 border-pink-400 text-white' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{platform.format}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Caption & Viral Hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Post Caption</label>
                  <textarea
                    rows={4}
                    value={socialCaption}
                    onChange={(e) => setSocialCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500 resize-none font-sans"
                    placeholder="Enter short-form viral hook caption..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Viral Hashtags</label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-950 border border-slate-700 min-h-[70px]">
                    {socialHashtags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-pink-950/80 border border-pink-800/80 text-pink-300 text-[11px] font-bold flex items-center gap-1"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => setSocialHashtags(prev => prev.filter(t => t !== tag))}
                          className="hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          e.preventDefault();
                          const cleaned = newTagInput.replace(/#/g, '').trim();
                          if (cleaned && !socialHashtags.includes(cleaned)) {
                            setSocialHashtags(prev => [...prev, cleaned]);
                            setNewTagInput('');
                          }
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-pink-500"
                      placeholder="Add tag and press Enter (e.g. KathmanduVibes)"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cleaned = newTagInput.replace(/#/g, '').trim();
                        if (cleaned && !socialHashtags.includes(cleaned)) {
                          setSocialHashtags(prev => [...prev, cleaned]);
                          setNewTagInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Status List */}
              {Object.keys(socialProgress).length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300">Publishing Dispatch Status</span>
                  <div className="space-y-1.5">
                    {Object.entries(socialProgress).map(([plat, prg]: [string, any]) => (
                      <div key={plat} className="flex items-center justify-between text-xs">
                        <span className="capitalize font-semibold text-slate-300">{plat}</span>
                        <span className={`font-mono text-[11px] font-bold ${
                          prg?.status === 'Published' ? 'text-emerald-400' : 'text-cyan-400'
                        }`}>
                          {prg?.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {selectedPlatforms.length} social platforms queued
                </span>

                <button
                  type="button"
                  disabled={isSocialPublishing || selectedPlatforms.length === 0}
                  onClick={handlePublishSocial}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-pink-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSocialPublishing ? 'Distributing...' : 'Publish Across Selected Channels'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Child OAuth Connect Modals */}
      <YouTubeConnectModal
        isOpen={showYtConnectModal}
        onClose={() => setShowYtConnectModal(false)}
        onConnected={(channel) => {
          setYtChannel(channel);
          try {
            localStorage.setItem('nepalai_yt_channel', JSON.stringify(channel));
          } catch (e) {}
          setShowYtConnectModal(false);
        }}
      />

      <TikTokConnectModal
        isOpen={showTikTokConnectModal}
        onClose={() => setShowTikTokConnectModal(false)}
        onConnected={() => {
          setShowTikTokConnectModal(false);
        }}
      />
    </div>
  );
};
