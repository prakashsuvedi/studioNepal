import React, { useState, useEffect, useRef } from 'react';
import {
  Youtube,
  Upload,
  Film,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Sparkles,
  Copy,
  ExternalLink,
  RefreshCw,
  Eye,
  Lock,
  Globe,
  Tag,
  Play,
  Pause,
  FileVideo,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Monitor,
  Clock,
  Sliders,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Scene } from '../types';
import { YouTubeConnectModal, YouTubeChannelInfo } from './YouTubeConnectModal';

export interface YouTubePublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  scenes: Scene[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  totalDuration: number;
  initialVideoUrl?: string;
  isExportSuccess?: boolean;
  isTimelineReady?: boolean;
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

const POPULAR_TAGS = [
  'NepalAI',
  'Shorts',
  'AIStudio',
  'Devanagari',
  'Kathmandu',
  'NepaliCreator',
  'CinematicAI',
  'ViralShorts',
  'TrendingNepal'
];

export const YouTubePublisherModal: React.FC<YouTubePublisherModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  scenes,
  aspectRatio,
  totalDuration,
  initialVideoUrl,
  isExportSuccess = false,
  isTimelineReady = false,
}) => {
  // Channel state
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('nepalai_youtube_token');
    } catch {
      return null;
    }
  });

  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(() => {
    try {
      const saved = localStorage.getItem('nepalai_youtube_channel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showConnectModal, setShowConnectModal] = useState(false);

  // Video Source state
  const [sourceType, setSourceType] = useState<'project' | 'upload' | 'url'>('project');
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>(initialVideoUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Technical Media Inspection State
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState<boolean>(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [showStandardsDetails, setShowStandardsDetails] = useState(true);

  // Metadata state
  const [title, setTitle] = useState(projectTitle ? `${projectTitle} #Shorts` : 'NepalAI Cinematic Production #Shorts');
  const [description, setDescription] = useState(
    `🎬 Created with NepalAI Video & Voice Studio!\n\nExperience cinematic AI video synthesis with Devanagari overlay captions and studio soundscapes.\n\n🔔 Subscribe to @${channel?.handle?.replace(/^@/, '') || 'NepalAI_Official'} for daily AI creations!\n\n#NepalAI #Shorts #VideoStudio #Nepal`
  );
  const [isShorts, setIsShorts] = useState<boolean>(aspectRatio === '9:16' || true);
  const [category, setCategory] = useState<string>('22');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [tags, setTags] = useState<string[]>(['NepalAI', 'Shorts', 'AIStudio', 'CinematicVideo']);
  const [newTagInput, setNewTagInput] = useState('');
  const [notMadeForKids, setNotMadeForKids] = useState(true);

  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStepMessage, setPublishStepMessage] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedResult, setPublishedResult] = useState<{
    videoId: string;
    watchUrl: string;
    shortsUrl: string;
    title: string;
    privacy: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync token & channel from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedToken = localStorage.getItem('nepalai_youtube_token');
        const savedChannel = localStorage.getItem('nepalai_youtube_channel');
        if (savedToken) setToken(savedToken);
        if (savedChannel) setChannel(JSON.parse(savedChannel));
      } catch (e) {
        console.warn('Error reading youtube storage:', e);
      }

      // If opening without media on project scenes, auto-suggest upload
      const hasProjectMedia = scenes.some(s => s.mediaUrl && s.mediaUrl.trim().length > 0) || (initialVideoUrl && initialVideoUrl.trim().length > 0);
      if (!hasProjectMedia && !uploadedFileUrl) {
        setSourceType('upload');
      }
    }
  }, [isOpen, scenes, initialVideoUrl, uploadedFileUrl]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (uploadedFileUrl && uploadedFileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedFileUrl);
      }
    };
  }, [uploadedFileUrl]);

  if (!isOpen) return null;

  // Resolve current active preview video URL
  const activeVideoUrl = (): string => {
    if (sourceType === 'upload') {
      return uploadedFileUrl || '';
    }
    if (sourceType === 'url') {
      return customVideoUrl.trim();
    }
    // Default project scenes
    const selected = scenes[selectedSceneIndex];
    if (selected && selected.mediaUrl && selected.mediaUrl.trim()) {
      return selected.mediaUrl.trim();
    }
    // Fallback: look for any scene with media
    const anyScene = scenes.find(s => s.mediaUrl && s.mediaUrl.trim().length > 0);
    if (anyScene && anyScene.mediaUrl) {
      return anyScene.mediaUrl.trim();
    }
    if (initialVideoUrl && initialVideoUrl.trim().length > 0) {
      return initialVideoUrl.trim();
    }
    return '';
  };

  const currentMediaUrl = activeVideoUrl();

  // Calculate Effective Duration
  const effectiveDuration = videoDuration > 0
    ? videoDuration
    : (sourceType === 'project' ? (scenes[selectedSceneIndex]?.duration || totalDuration) : 0);

  // ==========================================
  // MINIMUM STANDARDS EVALUATION ENGINE
  // ==========================================

  // Standard 1: Video Media Asset Ready
  const hasMediaSource = Boolean(currentMediaUrl && currentMediaUrl.length > 0 && !mediaLoadError);
  const isMediaReady = sourceType === 'upload'
    ? Boolean(uploadedFile && uploadedFile.size > 0 && (uploadedFileBase64 || uploadedFileUrl) && hasMediaSource)
    : sourceType === 'url'
    ? Boolean(customVideoUrl.trim().length > 8 && hasMediaSource)
    : Boolean(scenes.length > 0 && hasMediaSource);

  // Standard 2: Duration Standard (Min 3.0s, Shorts Max 60.5s)
  const isDurationAboveMin = effectiveDuration >= 3.0;
  const isDurationWithinShorts = !isShorts || effectiveDuration <= 60.5;
  const isDurationCompliant = isDurationAboveMin && isDurationWithinShorts;

  // Standard 3: Connected Channel
  const isChannelConnected = Boolean(token && channel);

  // Standard 4: Metadata Standards (Title >= 5 chars, Description >= 10 chars, #Shorts if Shorts)
  const isTitleValid = title.trim().length >= 5;
  const hasShortsTag = !isShorts || title.toLowerCase().includes('#shorts') || description.toLowerCase().includes('#shorts');
  const isDescriptionValid = description.trim().length >= 10;
  const isMetadataCompliant = isTitleValid && hasShortsTag && isDescriptionValid;

  // Standard 5: COPPA Safety Compliance
  const isCoppaCompliant = notMadeForKids === true;

  // Overall Quality Standards Result
  const allStandardsPassed = isMediaReady && isDurationCompliant && isChannelConnected && isMetadataCompliant && isCoppaCompliant;
  const passedStandardsCount = [
    isMediaReady,
    isDurationCompliant,
    isChannelConnected,
    isMetadataCompliant,
    isCoppaCompliant
  ].filter(Boolean).length;
  const totalStandardsCount = 5;

  // Quick Action Helpers
  const addShortsTagToTitle = () => {
    if (!title.toLowerCase().includes('#shorts')) {
      setTitle(prev => `${prev.trim()} #Shorts`);
    }
  };

  const switchToStandardFormat = () => {
    setIsShorts(false);
  };

  // Handle File Selection (Upload or Drag & Drop)
  const handleFileDrop = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|mkv)$/i)) {
      setPublishError('Please select a valid video file (.mp4, .mov, .webm, or .mkv)');
      return;
    }

    setPublishError(null);
    setUploadedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadedFileUrl(objectUrl);
    setSourceType('upload');
    setMediaLoaded(false);
    setMediaLoadError(null);

    // Convert to Base64 in background for API upload
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Channel connected callback
  const handleChannelConnected = (newToken: string, newChannel: YouTubeChannelInfo) => {
    setToken(newToken);
    setChannel(newChannel);
    try {
      localStorage.setItem('nepalai_youtube_token', newToken);
      localStorage.setItem('nepalai_youtube_channel', JSON.stringify(newChannel));
    } catch {}
    setShowConnectModal(false);
  };

  // Channel disconnect
  const handleDisconnectChannel = () => {
    setToken(null);
    setChannel(null);
    try {
      localStorage.removeItem('nepalai_youtube_token');
      localStorage.removeItem('nepalai_youtube_channel');
    } catch {}
  };

  // AI Title Magic Suggestions
  const handleGenerateAiTitles = () => {
    const suggestions = [
      `🇳🇵 ${projectTitle || 'Epic Nepal'} | Viral AI Cinematic Creation`,
      `Mind-Blowing AI Video of ${projectTitle || 'Nepal'} 🏔️ #Shorts`,
      `How NepalAI Created This Incredible Story in Seconds! ✨`,
      `${projectTitle || 'Nepal Cinematic'} - 4K Ultra AI Studio Production 🔥`,
    ];
    const picked = suggestions[Math.floor(Math.random() * suggestions.length)];
    setTitle(isShorts && !picked.toLowerCase().includes('#shorts') ? `${picked} #Shorts` : picked);
  };

  // Add Tag
  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Quick Description Appenders
  const appendToDescription = (text: string) => {
    setDescription(prev => `${prev}\n\n${text}`);
  };

  // Execute Real YouTube Upload
  const handlePublishVideo = async () => {
    if (!allStandardsPassed) {
      setPublishError('Video does not meet YouTube minimum standards. Please resolve the checklist requirements above.');
      return;
    }

    const currentUrl = activeVideoUrl();
    if (!uploadedFileBase64 && !currentUrl) {
      setPublishError('Please choose or upload a valid video to post.');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishProgress(15);
    setPublishStepMessage('Verifying YouTube standards & packaging metadata...');

    try {
      setTimeout(() => {
        setPublishProgress(35);
        setPublishStepMessage('Transcoding to YouTube-compliant H.264 MP4 with AAC audio...');
      }, 700);

      setTimeout(() => {
        setPublishProgress(60);
        setPublishStepMessage('Establishing YouTube Data API v3 Resumable Upload session...');
      }, 1500);

      setTimeout(() => {
        setPublishProgress(80);
        setPublishStepMessage('Streaming video chunks to YouTube servers...');
      }, 2300);

      const effectiveToken = token || 'demo_token';

      const payload: any = {
        accessToken: effectiveToken,
        title: title.trim(),
        description: `${description.trim()}\n\n${tags.map(t => `#${t}`).join(' ')}`,
        privacyStatus: privacy,
        tags,
        isShorts,
      };

      if (sourceType === 'upload' && uploadedFileBase64) {
        payload.videoBase64 = uploadedFileBase64;
      } else {
        payload.videoUrl = currentUrl;
      }

      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'YouTube API did not accept the upload request.');
      }

      setPublishProgress(100);
      setPublishStepMessage('Video published successfully!');

      const finalVideoId = data.videoId;
      const finalWatchUrl = data.watchUrl || `https://www.youtube.com/watch?v=${finalVideoId}`;
      const finalShortsUrl = data.shortsUrl || `https://youtube.com/shorts/${finalVideoId}`;

      setPublishedResult({
        videoId: finalVideoId,
        watchUrl: finalWatchUrl,
        shortsUrl: finalShortsUrl,
        title: title.trim(),
        privacy,
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Publishing error:', err);
      setPublishError(err.message || 'Failed to upload video to YouTube. Please verify channel credentials.');
      setPublishProgress(0);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyVideoLink = () => {
    if (!publishedResult) return;
    const url = isShorts ? publishedResult.shortsUrl : publishedResult.watchUrl;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border border-red-700/70 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-red-800/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    YouTube Video & Shorts Publisher
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-[10px] font-bold text-red-300">
                    Official API v3
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Publish high-definition videos and viral Shorts directly to your verified channel
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connected Channel Ribbon */}
          <div className="bg-slate-950/90 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {token && channel ? (
              <div className="flex items-center gap-2.5">
                <img
                  src={channel.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                  alt={channel.title}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{channel.title}</span>
                  <span className="text-slate-400 text-[11px] font-mono">{channel.handle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                  {channel.subscriberCount && (
                    <span className="text-[10px] text-slate-500 hidden sm:inline">
                      • {channel.subscriberCount}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No YouTube Channel currently connected. Connect now for 1-click publishing.</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>{token ? 'Switch Channel' : 'Connect Channel'}</span>
              </button>
              {token && (
                <button
                  type="button"
                  onClick={handleDisconnectChannel}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Main Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* If Successfully Published */}
            {publishedResult ? (
              <div className="p-6 bg-slate-950 rounded-2xl border border-emerald-600/60 space-y-5 text-center animate-in fade-in">
                <div className="w-16 h-16 bg-emerald-950 rounded-full border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/30">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">
                    Video Successfully Published to YouTube!
                  </h3>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Your video is processed and live. It can now be viewed on YouTube and shared worldwide.
                  </p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-w-lg mx-auto text-left space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Video Title:</span>
                    <span className="font-bold text-white truncate max-w-[280px]">{publishedResult.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Visibility:</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-800 font-mono text-emerald-400">
                      {publishedResult.privacy}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">YouTube URL:</span>
                    <a
                      href={isShorts ? publishedResult.shortsUrl : publishedResult.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-red-400 hover:underline truncate max-w-[280px] flex items-center gap-1"
                    >
                      <span>{isShorts ? publishedResult.shortsUrl : publishedResult.watchUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={isShorts ? publishedResult.shortsUrl : publishedResult.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={copyVideoLink}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Video Link'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setPublishedResult(null);
                      setPublishProgress(0);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-800"
                  >
                    Publish Another Video
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Error Banner */}
                {publishError && (
                  <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <span className="font-bold">Publishing Notice</span>
                      <p className="text-[11px] text-red-200/90 leading-relaxed">{publishError}</p>
                    </div>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white font-semibold rounded text-[10px] shrink-0 cursor-pointer"
                    >
                      Reconnect Channel
                    </button>
                  </div>
                )}

                {/* Pre-Flight YouTube Quality & Format Standards Engine Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  allStandardsPassed
                    ? 'bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        allStandardsPassed ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      }`}>
                        {allStandardsPassed ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white tracking-tight">
                            YouTube Pre-Flight Standards Check
                          </h4>
                          {allStandardsPassed ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" /> 100% Ready to Post
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" /> {passedStandardsCount}/{totalStandardsCount} Passed
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {allStandardsPassed
                            ? 'All minimum standards met. Video is fully verified and ready for immediate publishing.'
                            : 'Post to YouTube is locked until all minimum quality, duration, and channel standards pass.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowStandardsDetails(!showStandardsDetails)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{showStandardsDetails ? 'Hide Details' : 'View Standards'}</span>
                    </button>
                  </div>

                  {showStandardsDetails && (
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                      
                      {/* Check 1: Media Stream */}
                      <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        isMediaReady ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}>
                        {isMediaReady ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">1. Video Media Stream</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {uploadedFile
                              ? `Uploaded: ${uploadedFile.name} (${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                              : videoDimensions
                              ? `Decoded: ${videoDimensions.width}x${videoDimensions.height} px`
                              : currentMediaUrl
                              ? 'Timeline scene stream attached'
                              : 'No video stream detected'}
                          </span>
                          {!isMediaReady && (
                            <button
                              type="button"
                              onClick={() => {
                                setSourceType('upload');
                                fileInputRef.current?.click();
                              }}
                              className="mt-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" /> Upload MP4 Video
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Check 2: Duration Compliance */}
                      <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        isDurationCompliant ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}>
                        {isDurationCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">2. Duration Standard</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {effectiveDuration > 0
                              ? `${effectiveDuration.toFixed(1)}s (Req: ≥3.0s${isShorts ? ', ≤60s Shorts' : ''})`
                              : '0.0s (Min 3.0s required)'}
                          </span>
                          {isShorts && effectiveDuration > 60.5 && (
                            <button
                              type="button"
                              onClick={switchToStandardFormat}
                              className="mt-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                            >
                              Switch to Standard 16:9
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Check 3: YouTube Channel */}
                      <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        isChannelConnected ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}>
                        {isChannelConnected ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Youtube className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">3. Channel Authorization</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {channel ? `${channel.title} (${channel.handle})` : 'No channel connected'}
                          </span>
                          {!isChannelConnected && (
                            <button
                              type="button"
                              onClick={() => setShowConnectModal(true)}
                              className="mt-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                            >
                              <Youtube className="w-3 h-3" /> Connect Channel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Check 4: Metadata & #Shorts */}
                      <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        isMetadataCompliant ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}>
                        {isMetadataCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Tag className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">4. Metadata &amp; #Shorts Tag</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {!isTitleValid
                              ? 'Title too short (min 5 chars)'
                              : isShorts && !hasShortsTag
                              ? 'Missing #Shorts in title/desc'
                              : 'Title & metadata compliant'}
                          </span>
                          {isShorts && !hasShortsTag && (
                            <button
                              type="button"
                              onClick={addShortsTagToTitle}
                              className="mt-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                            >
                              + Add #Shorts Tag
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Check 5: COPPA Declaration */}
                      <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        isCoppaCompliant ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                      }`}>
                        {isCoppaCompliant ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">5. COPPA Declaration</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {isCoppaCompliant ? 'Declared: Not made for kids' : 'Declaration required'}
                          </span>
                          {!isCoppaCompliant && (
                            <button
                              type="button"
                              onClick={() => setNotMadeForKids(true)}
                              className="mt-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] cursor-pointer inline-flex items-center gap-1"
                            >
                              Confirm COPPA
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Overall Summary Spec */}
                      <div className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-slate-300 flex items-start gap-2">
                        <Monitor className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold block text-slate-200">Publish Target Specs</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {isShorts ? '9:16 Vertical Shorts (H.264 / AAC)' : '16:9 Standard Video (H.264 / AAC)'}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate font-mono">
                            Visibility: {privacy.toUpperCase()}
                          </span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 2-Column Grid: Left (Video Source & Preview) | Right (Metadata & Settings) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column (5 Cols): Video Source Selection & Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-slate-300 font-bold block text-xs">
                        1. Select Video to Post
                      </label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSourceType('project')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                            sourceType === 'project'
                              ? 'bg-red-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5" />
                          <span>Timeline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceType('upload')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                            sourceType === 'upload'
                              ? 'bg-red-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceType('url')}
                          className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                            sourceType === 'url'
                              ? 'bg-red-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Video URL</span>
                        </button>
                      </div>
                    </div>

                    {/* Source: Project Timeline Scenes */}
                    {sourceType === 'project' && (
                      <div className="space-y-2">
                        <span className="text-[11px] text-slate-400">Choose scene or composite:</span>
                        <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                          {scenes.map((scene, idx) => (
                            <button
                              key={scene.id}
                              type="button"
                              onClick={() => {
                                setSelectedSceneIndex(idx);
                                setMediaLoaded(false);
                                setMediaLoadError(null);
                              }}
                              className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                                selectedSceneIndex === idx
                                  ? 'border-red-500 bg-red-950/30'
                                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative">
                                {scene.mediaUrl ? (
                                  <img
                                    src={scene.mediaUrl}
                                    alt={scene.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Film className="w-4 h-4" />
                                  </div>
                                )}
                                <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono text-slate-300">
                                  {scene.duration}s
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-200 truncate">
                                {scene.title || `Scene ${idx + 1}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source: Upload File */}
                    {sourceType === 'upload' && (
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                          className="hidden"
                          onChange={(e) => handleFileDrop(e.target.files)}
                        />
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            handleFileDrop(e.dataTransfer.files);
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                            isDragOver
                              ? 'border-red-500 bg-red-950/40'
                              : uploadedFile
                              ? 'border-emerald-600/70 bg-emerald-950/20'
                              : 'border-slate-700 hover:border-red-500 bg-slate-950/50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-red-400">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block text-xs">
                              {uploadedFile ? uploadedFile.name : 'Click to select or drag & drop MP4 video'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {uploadedFile
                                ? `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for upload`
                                : 'Supports .MP4, .MOV, .WEBM (Up to 2GB)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Source: Direct URL */}
                    {sourceType === 'url' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400">Paste direct video MP4 URL:</label>
                        <input
                          type="url"
                          value={customVideoUrl}
                          onChange={(e) => {
                            setCustomVideoUrl(e.target.value);
                            setMediaLoaded(false);
                            setMediaLoadError(null);
                          }}
                          placeholder="https://.../video.mp4"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                        />
                      </div>
                    )}

                    {/* Video Player Preview Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span>Live Video Preview</span>
                          {effectiveDuration > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 font-mono text-[10px] text-slate-300">
                              {effectiveDuration.toFixed(1)}s
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {isShorts ? '9:16 Shorts' : '16:9 Video'}
                        </span>
                      </div>

                      <div className="bg-black rounded-xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
                        {currentMediaUrl ? (
                          <video
                            key={currentMediaUrl}
                            ref={videoPlayerRef}
                            src={currentMediaUrl}
                            className="max-h-full max-w-full object-contain"
                            controls
                            onLoadedMetadata={(e) => {
                              const target = e.currentTarget;
                              setVideoDuration(target.duration || 0);
                              setVideoDimensions({ width: target.videoWidth, height: target.videoHeight });
                              setMediaLoaded(true);
                              setMediaLoadError(null);
                              // Auto-format suggestion
                              if (target.duration <= 60 && target.videoWidth < target.videoHeight) {
                                setIsShorts(true);
                              } else if (target.duration > 60) {
                                setIsShorts(false);
                              }
                            }}
                            onError={() => {
                              setMediaLoaded(false);
                              setMediaLoadError('Failed to load video stream or unsupported codec.');
                            }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        ) : (
                          <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                              <Film className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-slate-300 text-xs">Video Not Ready on Video Studio</span>
                            <p className="text-slate-500 text-[11px] max-w-xs leading-relaxed">
                              The timeline has no rendered or assigned media yet. Assign media in Video Studio, or switch to Upload File to upload an MP4 directly.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSourceType('upload');
                                fileInputRef.current?.click();
                              }}
                              className="mt-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload MP4 Instead</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (7 Cols): Metadata, Format, Categories, Privacy */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Video Title */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-bold flex items-center gap-1.5">
                          <span>2. Video Title</span>
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateAiTitles}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>AI Title Magic</span>
                          </button>
                          <span className={`text-[10px] font-mono ${title.length > 90 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {title.length}/100
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        maxLength={100}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Catchy YouTube Title... #Shorts"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-medium focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Format Toggle: Shorts (9:16) vs Standard (16:9) */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block">
                        3. YouTube Format
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsShorts(true);
                            if (!title.includes('#Shorts')) {
                              setTitle(prev => `${prev.trim()} #Shorts`.substring(0, 100));
                            }
                          }}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                            isShorts
                              ? 'bg-red-950/40 border-red-600 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className={`w-5 h-5 ${isShorts ? 'text-red-400' : 'text-slate-500'}`} />
                          <div>
                            <span className="font-bold block text-xs">YouTube Shorts</span>
                            <span className="text-[10px] text-slate-400 block">
                              Vertical 9:16 • Tagged #Shorts • Mobile Feed
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsShorts(false);
                            setTitle(prev => prev.replace(/#Shorts/gi, '').trim());
                          }}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer text-left ${
                            !isShorts
                              ? 'bg-red-950/40 border-red-600 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Monitor className={`w-5 h-5 ${!isShorts ? 'text-red-400' : 'text-slate-500'}`} />
                          <div>
                            <span className="font-bold block text-xs">Standard Video</span>
                            <span className="text-[10px] text-slate-400 block">
                              Landscape 16:9 • Desktop & TV Player
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-bold">Description</label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {description.length}/5000
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={5000}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell viewers about your creation..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-red-500 resize-none font-sans"
                      />
                      {/* Quick description insert chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => appendToDescription('#Shorts #NepalAI #Viral')}
                          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] text-red-300 border border-slate-800 cursor-pointer"
                        >
                          + #Shorts Tags
                        </button>
                        <button
                          type="button"
                          onClick={() => appendToDescription('Created with NepalAI Video Studio (https://studio.nepalai.tech)')}
                          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800 cursor-pointer"
                        >
                          + Studio Credits
                        </button>
                        <button
                          type="button"
                          onClick={() => appendToDescription('Subscribe for more high-definition Nepali AI stories! 🇳🇵')}
                          className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-[10px] text-slate-300 border border-slate-800 cursor-pointer"
                        >
                          + Subscribe CTA
                        </button>
                      </div>
                    </div>

                    {/* Category & Privacy Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold block text-[11px]">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          {YOUTUBE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-300 font-bold block text-[11px]">Visibility</label>
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="unlisted">Unlisted (Recommended for Testing)</option>
                          <option value="public">Public (Visible Worldwide Immediately)</option>
                          <option value="private">Private (Only You Can View)</option>
                        </select>
                      </div>
                    </div>

                    {/* Tags Manager */}
                    <div className="space-y-1.5">
                      <label className="text-slate-300 font-bold block text-[11px]">Video Tags &amp; Keywords</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="Type tag and press Enter..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                        >
                          Add Tag
                        </button>
                      </div>

                      {/* Active Tags */}
                      <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-y-auto pt-1">
                        {tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-red-300 text-[10px] font-mono flex items-center gap-1"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-red-400 hover:text-white cursor-pointer ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Quick Popular Tags */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-slate-500">Popular:</span>
                        {POPULAR_TAGS.slice(0, 5).map(popTag => (
                          <button
                            key={popTag}
                            type="button"
                            onClick={() => {
                              if (!tags.includes(popTag)) setTags([...tags, popTag]);
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-300 cursor-pointer"
                          >
                            +{popTag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* COPPA Made for Kids */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        id="notMadeForKids"
                        checked={notMadeForKids}
                        onChange={(e) => setNotMadeForKids(e.target.checked)}
                        className="rounded accent-red-600 cursor-pointer"
                      />
                      <label htmlFor="notMadeForKids" className="cursor-pointer">
                        No, this video is not made for children (YouTube COPPA Standard Compliance)
                      </label>
                    </div>

                  </div>
                </div>

                {/* Progress Bar (During Upload) */}
                {isPublishing && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-red-800/80 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-bold flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                        <span>{publishStepMessage}</span>
                      </span>
                      <span className="text-red-400 font-mono font-bold">{publishProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                        style={{ width: `${publishProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

          </div>

          {/* Footer Bar */}
          {!publishedResult && (
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted direct upload via Google Cloud &amp; YouTube Data API v3</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPublishing}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {!allStandardsPassed && (
                    <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5 hidden sm:inline-flex bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{totalStandardsCount - passedStandardsCount} standards remaining</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handlePublishVideo}
                    disabled={isPublishing || !allStandardsPassed}
                    title={
                      !allStandardsPassed
                        ? `Cannot publish: Video must pass all minimum standards (${passedStandardsCount}/${totalStandardsCount} passed). Check requirements above.`
                        : 'Publish video directly to YouTube'
                    }
                    className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                      allStandardsPassed && !isPublishing
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-950/50 cursor-pointer'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-75'
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Publishing to YouTube...</span>
                      </>
                    ) : !allStandardsPassed ? (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Publish Locked (Check Standards)</span>
                      </>
                    ) : (
                      <>
                        <Youtube className="w-4 h-4" />
                        <span>Publish Video to YouTube</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Embedded Connect Channel Modal (When user clicks Switch / Connect) */}
      <YouTubeConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={handleChannelConnected}
        currentChannel={channel}
        isConnected={!!token}
        onDisconnect={handleDisconnectChannel}
      />
    </>
  );
};
