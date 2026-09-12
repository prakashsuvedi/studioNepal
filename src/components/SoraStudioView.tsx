import React, { useState } from 'react';
import { Scene, UserSession, UserTrialQuota } from '../types';
import { apiGenerateVideo, apiCheckVideoStatus, apiTranslatePrompt } from '../lib/api';
import { 
  Video, 
  Sparkles, 
  Film, 
  Play, 
  Check, 
  Clock, 
  RefreshCw, 
  Download, 
  AlertCircle,
  ExternalLink,
  Languages,
  Copy,
  CheckCheck,
  SlidersHorizontal,
  Sliders,
  Trash2,
  Plus,
  CheckCircle2,
  FolderHeart,
  Users,
  Camera,
  Layers,
  Tv,
  Clapperboard,
  Sparkle
} from 'lucide-react';
import { saveMediaItem, getMediaLibrary, removeMediaItem, MediaItem } from '../lib/mediaLibrary';
import {
  CHARACTER_DNA_LIST,
  PODCAST_STUDIO_PACKS,
  NARRATIVE_STORYBOARDS,
  BROADCAST_FORMAT_PRESETS,
  CharacterDNA,
  PodcastStudioPack,
  NarrativeStoryboardPack,
  StoryboardSceneItem,
  BroadcastFormatPreset
} from '../data/soraProductionPacks';

interface SoraStudioViewProps {
  initialPrompt?: string;
  onAddSceneToVideo: (scene: Scene) => void;
  onNavigateToTimeline?: () => void;
  bypassControlledMode: boolean;
  user?: UserSession | null;
  onTriggerPaywall?: (reason: string) => void;
  onUsageUpdated?: (usage: UserTrialQuota, credits: number) => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

const SORA_CINEMATIC_MODIFIERS = [
  { label: 'Drone Sweep', modifier: 'cinematic aerial drone sweep, 4k ultra-high definition, slow motion' },
  { label: 'Golden Hour', modifier: 'golden hour warm sunlight, glowing rim light, high dynamic range' },
  { label: 'Himalayan Mist', modifier: 'rolling mountain fog, ethereal atmosphere, majestic snow peaks' },
  { label: 'Hyper-Realistic', modifier: 'photorealistic 8k, natural depth of field, blockbuster cinema camera' },
];

const SAMPLE_SORA_PRESETS = [
  {
    en: 'A cinematic drone flight skimming over snow-dusted Himalayan pine forests at golden hour, 4k photorealistic',
    ne: 'सुनौलो साँझमा हिउँले ढाकिएका सल्लाका रुखहरू माथि ड्रोनबाट खिचिएको मनोरम दृश्य'
  },
  {
    en: 'Slow-motion aerial shot circling the ancient golden spire of Swayambhunath temple under dramatic sunset clouds',
    ne: 'नाटकीय सूर्यास्तको बादलमुनि स्वयम्भूनाथ मन्दिरको स्वर्ण गजुरको स्लो-मोशन एरियल दृश्य'
  },
  {
    en: 'Crystal clear emerald waters of Phewa Lake in Pokhara with reflection of Machhapuchhre mountain, morning calm',
    ne: 'पोखराको फेवातालमा माछापुच्छ्रे हिमालको सुन्दर छाया, बिहानीको शान्त र मनमोहक दृश्य'
  }
];

export const SoraStudioView: React.FC<SoraStudioViewProps> = ({
  initialPrompt,
  onAddSceneToVideo,
  onNavigateToTimeline,
  bypassControlledMode,
  user,
  onTriggerPaywall,
  onUsageUpdated,
  onStartGlobalLoading,
  onStopGlobalLoading,
}) => {
  const [prompt, setPrompt] = useState(
    () => initialPrompt || SAMPLE_SORA_PRESETS[0].en
  );

  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const [videoSubtitle, setVideoSubtitle] = useState('');
  const [presetLang, setPresetLang] = useState<'en' | 'ne'>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [model] = useState<'sora-2'>('sora-2');
  const [resolution, setResolution] = useState<'720x1280' | '1280x720'>('1280x720');
  const [seconds, setSeconds] = useState<'4' | '8'>('4');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [videoResultUrl, setVideoResultUrl] = useState<string>(
    '/samples/ForBiggerBlazes.mp4'
  );
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [historyVideos, setHistoryVideos] = useState<MediaItem[]>(() => 
    getMediaLibrary().filter(m => m.type === 'sora_video')
  );
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [historyAddedId, setHistoryAddedId] = useState<string | null>(null);
  const [previewingItem, setPreviewingItem] = useState<MediaItem | null>(null);

  // Production Modes & Storyboard States
  const [productionMode, setProductionMode] = useState<'single' | 'podcast' | 'storyboard' | 'broadcast'>('single');
  const [activePodcastPack, setActivePodcastPack] = useState<PodcastStudioPack>(PODCAST_STUDIO_PACKS[0]);
  const [activeStoryboardPack, setActiveStoryboardPack] = useState<NarrativeStoryboardPack>(NARRATIVE_STORYBOARDS[0]);
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardSceneItem[]>(NARRATIVE_STORYBOARDS[0].scenes);
  const [selectedCharacterDna, setSelectedCharacterDna] = useState<string>('sagar');
  const [batchProcessingSceneId, setBatchProcessingSceneId] = useState<string | null>(null);
  const [storyboardAddedSuccess, setStoryboardAddedSuccess] = useState(false);

  React.useEffect(() => {
    setStoryboardScenes(activeStoryboardPack.scenes);
  }, [activeStoryboardPack]);

  React.useEffect(() => {
    const handleUpdate = () => {
      setHistoryVideos(getMediaLibrary().filter(m => m.type === 'sora_video'));
    };
    window.addEventListener('nepalai_media_library_updated', handleUpdate);
    return () => window.removeEventListener('nepalai_media_library_updated', handleUpdate);
  }, []);

  // Devanagari detection
  const hasDevanagari = /[\u0900-\u097F]/.test(prompt);

  // Translate prompt between Nepali and English
  const handleTranslatePrompt = async (target: 'en' | 'ne') => {
    if (!prompt.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await apiTranslatePrompt(prompt, target);
      if (translated && translated.trim()) {
        setPrompt(translated.trim());
      }
    } catch (err) {
      console.warn('Translate Sora prompt failed', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const applyCinematicModifier = (modifier: string) => {
    if (!prompt.includes(modifier)) {
      setPrompt(prev => prev.trim() ? `${prev.trim()}, ${modifier}` : modifier);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Inject Character Visual DNA into prompt for consistent multi-scene look
  const handleInjectCharacterDna = (charId: string) => {
    const charObj = CHARACTER_DNA_LIST.find(c => c.id === charId);
    if (!charObj) return;
    if (!prompt.includes(charObj.name)) {
      setPrompt(prev => prev.trim() ? `${charObj.visualDescription}, ${prev.trim()}` : charObj.visualDescription);
    }
  };

  // Select a Podcast Studio Camera Angle
  const handleSelectPodcastAngle = (angle: any) => {
    setPrompt(angle.prompt);
    setVideoSubtitle(angle.subtitle);
    setSeconds((angle.recommendedDuration || 4).toString() as '4' | '8');
    setResolution(activePodcastPack.aspectRatio === '9:16' ? '720x1280' : '1280x720');
  };

  // Select a Broadcast Format Preset
  const handleSelectBroadcastPreset = (preset: BroadcastFormatPreset) => {
    setPrompt(preset.samplePrompt);
    setVideoSubtitle(preset.subtitle);
    setResolution(preset.resolution);
    setSeconds(preset.defaultDuration);
  };

  // Generate a specific scene inside the Storyboard
  const handleGenerateStoryboardScene = async (sceneItem: StoryboardSceneItem, sceneIndex: number) => {
    setBatchProcessingSceneId(sceneItem.id);
    setIsGenerating(true);
    setJobProgress(15);
    setGenError(null);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: `Synthesizing ${sceneItem.title}...`,
        subtitle: `Generating ${sceneItem.recommendedDuration}s photorealistic video via Azure Sora-2`,
        progress: 15,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      const data = await apiGenerateVideo(
        effectiveUserId,
        sceneItem.prompt,
        sceneItem.recommendedDuration || 4,
        'sora-2',
        {
          resolution: activeStoryboardPack.aspectRatio === '9:16' ? '720x1280' : '1280x720',
          aspectRatio: activeStoryboardPack.aspectRatio,
        }
      );

      let finalUrl = data.result?.url;

      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        let done = false;
        let retries = 0;
        const maxRetries = 40;

        while (!done && retries < maxRetries) {
          retries++;
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const statusData = await apiCheckVideoStatus(jobId);
            const p = Math.min(98, Math.max(30, statusData.progress || 30 + retries * 2));
            setJobProgress(p);
            if (statusData.status === 'completed' && statusData.url) {
              finalUrl = statusData.url;
              done = true;
              break;
            } else if (statusData.status === 'failed') {
              break;
            }
          } catch (pollErr) {
            console.warn('Sora scene polling notice:', pollErr);
          }
        }
      }

      if (finalUrl) {
        setVideoResultUrl(finalUrl);
        setStoryboardScenes(prev => prev.map((s, idx) => idx === sceneIndex ? { ...s, videoUrl: finalUrl } : s));

        saveMediaItem({
          type: 'sora_video',
          title: `Storyboard: ${sceneItem.title}`,
          url: finalUrl,
          duration: sceneItem.recommendedDuration || 4,
          category: 'Storyboard Scene',
          aspectRatio: activeStoryboardPack.aspectRatio,
          prompt: sceneItem.prompt,
          resolution: activeStoryboardPack.aspectRatio === '9:16' ? '720x1280' : '1280x720',
          engine: 'Azure Sora-2'
        });
      }
      if (onUsageUpdated && data.trialUsage) {
        onUsageUpdated(data.trialUsage, data.remainingCredits);
      }
    } catch (err: any) {
      console.error('Failed to generate storyboard scene', err);
      setGenError(err.message || 'Scene generation failed');
    } finally {
      setIsGenerating(false);
      setBatchProcessingSceneId(null);
      if (onStopGlobalLoading) onStopGlobalLoading();
    }
  };

  // Add Entire Storyboard Sequence to Video Studio Timeline
  const handleSendStoryboardToTimeline = () => {
    storyboardScenes.forEach((s, idx) => {
      const sceneUrl = s.videoUrl || videoResultUrl || '/samples/ForBiggerBlazes.mp4';
      const newScene: Scene = {
        id: 'scene-storyboard-' + Math.random().toString(36).substring(2, 9),
        assetId: 'media-sb-' + Date.now() + '-' + idx,
        title: s.title,
        duration: s.recommendedDuration || 4,
        prompt: s.prompt,
        promptNepali: s.subtitleNe || s.prompt,
        mediaUrl: sceneUrl,
        thumbnailUrl: sceneUrl.endsWith('.mp4') ? sceneUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
        mediaType: 'video',
        aspectRatio: activeStoryboardPack.aspectRatio,
        motion: idx % 2 === 0 ? 'zoom_in' : 'pan_right',
        transition: idx === 0 ? 'cut' : 'dissolve',
        textOverlay: s.subtitleEn.slice(0, 36),
        textNepali: s.subtitleNe.slice(0, 36),
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 85
      };
      onAddSceneToVideo(newScene);
    });
    setStoryboardAddedSuccess(true);
    setTimeout(() => setStoryboardAddedSuccess(false), 4000);
  };

  // Generate Sora Video
  const handleGenerateSora = async () => {
    setIsGenerating(true);
    setJobProgress(10);
    setAddedSuccess(false);
    setGenError(null);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: 'Synthesizing Sora-2 Neural Video...',
        subtitle: `Generating ${seconds}s photorealistic video clip at ${resolution} via Azure AI Foundry`,
        progress: 15,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      setJobProgress(25);
      if (onStartGlobalLoading) {
        onStartGlobalLoading({
          type: 'video',
          title: 'Synthesizing Sora-2 Neural Video...',
          subtitle: 'Dispatching diffusion synthesis to Azure OpenAI cluster (prakashsuvedi-7749-resource)...',
          progress: 25,
        });
      }

      const data = await apiGenerateVideo(
        effectiveUserId,
        prompt,
        parseInt(seconds) || 4,
        'sora-2',
        {
          resolution,
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
        }
      );

      let finalUrl = data.result?.url;

      // If the Sora-2 job is in progress on Azure GPU cluster, poll until complete
      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        let done = false;
        let retries = 0;
        const maxRetries = 40; // 40 * 3s = ~120s

        while (!done && retries < maxRetries) {
          retries++;
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const statusData = await apiCheckVideoStatus(jobId);
            const p = Math.min(98, Math.max(30, statusData.progress || 30 + retries * 2));
            setJobProgress(p);
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: 'Synthesizing Sora-2 Neural Video...',
                subtitle: `Rendering diffusion frames on Azure GPU (${p}%)...`,
                progress: p,
              });
            }

            if (statusData.status === 'completed' && statusData.url) {
              finalUrl = statusData.url;
              done = true;
              break;
            } else if (statusData.status === 'failed') {
              console.warn('Sora-2 job reported failure:', statusData.error);
              break;
            }
          } catch (pollErr) {
            console.warn('Sora polling notice:', pollErr);
          }
        }
      }

      setJobProgress(95);
      if (onStartGlobalLoading) {
        onStartGlobalLoading({
          type: 'video',
          title: 'Finalizing Video Composition...',
          subtitle: 'Encoding MP4 stream and syncing timeline...',
          progress: 95,
        });
      }
      await new Promise((r) => setTimeout(r, 400));
      if (finalUrl) {
        setVideoResultUrl(finalUrl);

        // Save generated video to persistent Global Media Library
        const savedItem = saveMediaItem({
          type: 'sora_video',
          title: 'Sora-2: ' + prompt.slice(0, 30),
          url: finalUrl,
          duration: parseInt(seconds) || 4,
          category: 'Sora-2 AI Video',
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          prompt,
          resolution,
          engine: 'Azure Sora-2'
        });
        setLastSavedId(savedItem.id);
        setAddedSuccess(false);
      }
      setJobProgress(100);
      if (onUsageUpdated && data.trialUsage) {
        onUsageUpdated(data.trialUsage, data.remainingCredits);
      }
    } catch (e: any) {
      console.error(e);
      setGenError(e.message || 'Video generation failed');
      if (e.message?.includes('trial') || e.message?.includes('credit') || e.message?.includes('limit')) {
        if (onTriggerPaywall) onTriggerPaywall(e.message);
      }
    } finally {
      setIsGenerating(false);
      if (onStopGlobalLoading) {
        onStopGlobalLoading();
      }
    }
  };

  // Add to Video Studio
  const handleAddToTimeline = () => {
    const newScene: Scene = {
      id: 'scene-sora-' + Math.random().toString(36).substring(2, 9),
      assetId: lastSavedId || ('media-sora-' + Date.now()),
      title: 'Sora-2: ' + prompt.slice(0, 20),
      duration: parseInt(seconds) || 5,
      prompt,
      promptNepali: hasDevanagari ? prompt : videoSubtitle || prompt,
      mediaUrl: videoResultUrl,
      thumbnailUrl: videoResultUrl.endsWith('.mp4') ? videoResultUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
      mediaType: 'video',
      aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      textOverlay: (videoSubtitle || prompt).slice(0, 32),
      textNepali: (hasDevanagari ? prompt : videoSubtitle).slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 85
    };
    onAddSceneToVideo(newScene);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3500);
  };

  // Add an item from persistent history to timeline
  const handleAddHistoryItemToTimeline = (item: MediaItem) => {
    const newScene: Scene = {
      id: 'scene-sora-' + Math.random().toString(36).substring(2, 9),
      assetId: item.id,
      title: item.title || 'Sora Video Scene',
      duration: item.duration || 5,
      prompt: item.prompt || item.title,
      promptNepali: item.prompt || item.title,
      mediaUrl: item.url,
      thumbnailUrl: item.thumbnailUrl || (item.url.endsWith('.mp4') ? item.url.replace(/\.mp4$/, '_thumb.jpg') : undefined),
      mediaType: 'video',
      aspectRatio: item.aspectRatio || '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      textOverlay: (item.prompt || item.title).slice(0, 32),
      textNepali: (item.prompt || item.title).slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 85
    };
    onAddSceneToVideo(newScene);
    setHistoryAddedId(item.id);
    setTimeout(() => setHistoryAddedId(null), 3000);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeMediaItem(id);
    setHistoryVideos(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Azure Sora-2 Video Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200">
              OpenAI Sora-2 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate high-temporal AI video clips using your configured Azure AI Foundry Sora endpoint.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Target Endpoint:</span>
          <code className="text-xs bg-slate-100 px-2.5 py-1 rounded-md text-emerald-700 border border-slate-200 font-mono font-medium">
            /videos (POST)
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Sora Prompt & Parameters */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          {/* Production Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setProductionMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'single'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Single Shot</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('podcast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'podcast'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>🎙️ Podcast Multi-Cam</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('storyboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'storyboard'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-500" />
              <span>🎬 Story & Movie</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('broadcast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'broadcast'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-emerald-500" />
              <span>📺 Broadcast Presets</span>
            </button>
          </div>

          {/* 1. Podcast Multi-Camera Studio Mode Panel */}
          {productionMode === 'podcast' && (
            <div className="p-3.5 bg-gradient-to-r from-rose-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl border border-rose-200/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Podcast Studio Multi-Camera Anchor
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {PODCAST_STUDIO_PACKS.map(pack => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setActivePodcastPack(pack)}
                      className={`text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border ${
                        activePodcastPack.id === pack.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {pack.badge}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activePodcastPack.description} Click any camera angle below to load synchronized framing:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePodcastPack.cameraAngles.map(angle => (
                  <button
                    key={angle.id}
                    type="button"
                    onClick={() => handleSelectPodcastAngle(angle)}
                    className="p-2.5 rounded-lg bg-white hover:bg-rose-50/70 border border-slate-200 hover:border-rose-300 text-left transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                        {angle.title}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-700 font-mono font-bold">
                        {angle.recommendedDuration}s
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {angle.subtitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Story & Movie Storyboard Mode Panel */}
          {productionMode === 'storyboard' && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-emerald-500/5 rounded-xl border border-amber-200/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Clapperboard className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Narrative Storyboard & Visual Consistency
                  </span>
                </div>
                <select
                  value={activeStoryboardPack.id}
                  onChange={(e) => {
                    const pack = NARRATIVE_STORYBOARDS.find(p => p.id === e.target.value);
                    if (pack) setActiveStoryboardPack(pack);
                  }}
                  className="text-[11px] bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-800"
                >
                  {NARRATIVE_STORYBOARDS.map(pack => (
                    <option key={pack.id} value={pack.id}>
                      {pack.badge} • {pack.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">Visual Style:</span>
                  <span className="italic text-slate-500">{activeStoryboardPack.visualStyle}</span>
                </div>
                <p className="text-[10.5px] text-slate-500">{activeStoryboardPack.description}</p>
              </div>

              {/* Storyboard Scene Queue */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Sequential Scene Progression ({storyboardScenes.length} Scenes)
                </span>
                <div className="space-y-2">
                  {storyboardScenes.map((scene, idx) => (
                    <div
                      key={scene.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {scene.title}
                          </span>
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                            {scene.framing} • {scene.recommendedDuration}s
                          </span>
                          {scene.videoUrl && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">
                              ✓ Rendered
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                          "{scene.subtitleEn}"
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPrompt(scene.prompt);
                            setVideoSubtitle(scene.subtitleEn);
                            setSeconds((scene.recommendedDuration || 4).toString() as '4' | '8');
                            setResolution(activeStoryboardPack.aspectRatio === '9:16' ? '720x1280' : '1280x720');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                          title="Load into main prompt builder"
                        >
                          Load
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGenerateStoryboardScene(scene, idx)}
                          disabled={isGenerating}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-[10px] font-bold text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          {batchProcessingSceneId === scene.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Rendering...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>{scene.videoUrl ? 'Re-render' : 'Render'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Send Storyboard to Video Timeline Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendStoryboardToTimeline}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎞️ Send All {storyboardScenes.length} Scenes to Video Studio Timeline</span>
                </button>
                {storyboardAddedSuccess && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <span className="font-bold">✓ Storyboard scenes queued into Video Studio!</span>
                    {onNavigateToTimeline && (
                      <button
                        type="button"
                        onClick={onNavigateToTimeline}
                        className="text-[11px] underline font-bold hover:text-emerald-950"
                      >
                        Open Timeline →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Broadcast Format Presets Panel */}
          {productionMode === 'broadcast' && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-indigo-500/5 rounded-xl border border-emerald-200/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-emerald-600" />
                  Broadcast & Streaming Format Master Presets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BROADCAST_FORMAT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectBroadcastPreset(preset)}
                    className="p-2.5 rounded-lg bg-white hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 text-left transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {preset.title}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 font-mono font-bold">
                        {preset.aspectRatio}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      {preset.subtitle}
                    </span>
                    <span className="text-[9.5px] text-emerald-700 font-medium block mt-1">
                      💡 {preset.pacingNote}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Character Visual DNA Injector Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1">
                <Sparkle className="w-3 h-3 text-amber-500" />
                <span>Character Visual DNA (Maintain Consistency)</span>
              </span>
              <span className="text-[9.5px] text-slate-400 font-medium">1-Click Prompt Inject</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CHARACTER_DNA_LIST.map(char => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleInjectCharacterDna(char.id)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200 font-medium transition flex items-center gap-1 cursor-pointer"
                  title={char.visualDescription}
                >
                  <span>{char.avatarEmoji}</span>
                  <span className="font-bold">{char.name}</span>
                  <span className="text-slate-400">({char.role.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Single Unified Prompt & Model Input */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Video Generation Prompt</span>
                  <span className="text-[11px] font-normal text-slate-500 font-['Mukta']">(प्रम्प्ट)</span>
                </label>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Sora-2 Input
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasDevanagari ? (
                  <button
                    type="button"
                    onClick={() => handleTranslatePrompt('en')}
                    disabled={isTranslating}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                    title="Translate Nepali prompt into rich English for optimal Sora-2 motion synthesis"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isTranslating ? 'animate-spin' : ''}`} />
                    <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🌐 Translate to English for Sora-2'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTranslatePrompt('ne')}
                    disabled={isTranslating}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50 font-['Mukta']"
                    title="Translate prompt into Nepali"
                  >
                    <Languages className={`w-3.5 h-3.5 text-amber-600 ${isTranslating ? 'animate-spin' : ''}`} />
                    <span>{isTranslating ? 'Translating...' : '🇳🇵 नेपालीमा अनुवाद'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-100 border border-slate-200"
                >
                  {copiedPrompt ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Single Unified Prompt Textarea */}
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe cinematic camera motion, subject, lighting, and scene in English or नेपाली..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
            />

            {/* Direct Model Payload Indicator */}
            <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-slate-700 shrink-0">Payload to Sora-2:</span>
                <span className="truncate italic text-slate-500">"{prompt.trim() || 'Himalayan cinematic scene'}"</span>
              </div>
              <span className="shrink-0 text-[10px] text-emerald-700 font-medium ml-2 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                100% Direct Model Input
              </span>
            </div>
          </div>

          {/* Cinematic Motion Chips */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Cinematic Motion & Lighting Modifiers</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SORA_CINEMATIC_MODIFIERS.map((mod, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyCinematicModifier(mod.modifier)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium transition cursor-pointer"
                >
                  + {mod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Scene Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">Quick Video Presets:</span>
              <div className="flex items-center text-[10px] border border-slate-200 rounded-md overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setPresetLang('en')}
                  className={`px-2 py-0.5 font-medium transition cursor-pointer ${presetLang === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPresetLang('ne')}
                  className={`px-2 py-0.5 font-medium font-['Mukta'] transition cursor-pointer ${presetLang === 'ne' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  नेपाली
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {SAMPLE_SORA_PRESETS.map((p, idx) => {
                const textVal = presetLang === 'en' ? p.en : p.ne;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(textVal)}
                    className="text-[10px] p-2 text-left rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 border border-slate-200 transition cursor-pointer group"
                    title={textVal}
                  >
                    <span className="font-bold block text-slate-900 group-hover:text-indigo-700">Scene {idx + 1}</span>
                    <span className="truncate block opacity-80">{textVal.slice(0, 26)}...</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Video Subtitle / Overlay */}
          <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Video Subtitle & Title Track</span>
                <span className="text-[10px] font-normal text-slate-400">(Optional • Timeline Display)</span>
              </label>
            </div>
            <input
              type="text"
              value={videoSubtitle}
              onChange={e => setVideoSubtitle(e.target.value)}
              placeholder="Optional subtitle text to stamp on the video player (Nepali or English)..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Parameter Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Model</label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-indigo-700">
                sora-2
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Resolution</label>
              <select
                value={resolution}
                onChange={e => setResolution(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="1280x720">1280x720 (16:9)</option>
                <option value="720x1280">720x1280 (9:16)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Duration</label>
              <select
                value={seconds}
                onChange={e => setSeconds(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="4">4 Seconds</option>
                <option value="8">8 Seconds</option>
              </select>
            </div>
          </div>

          {/* Developer Settings / Raw API Contract - Superadmin Only */}
          {user?.role === 'admin' && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 shadow-inner">
              <div className="text-amber-400 font-bold flex items-center justify-between">
                <span>Azure Request Contract (Superadmin Diagnostics):</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">ADMIN</span>
              </div>
              <div className="text-indigo-400 font-semibold truncate">
                POST https://prakashsuvedi-7749-resource.services.ai.azure.com/videos
              </div>
              <div className="text-slate-300">
                {JSON.stringify({ prompt: prompt.slice(0, 30) + '...', model: 'sora-2', size: resolution, seconds }, null, 2)}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateSora}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Sora-2 Video ({jobProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Sora-2 Video Clip</span>
              </>
            )}
          </button>
        </div>

        {/* Right 6 Columns: Video Stage & Timeline Sync */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900">Sora-2 Render Preview</span>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{seconds}s • {resolution}</span>
          </div>

          {/* Canvas display */}
          <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center relative p-2 shadow-inner">
            {videoResultUrl ? (
              <div className="relative w-full h-full max-h-[340px] flex items-center justify-center">
                {videoResultUrl.includes('.mp4') || videoResultUrl.includes('.webm') || videoResultUrl.includes('gtv-videos-bucket') || videoResultUrl.includes('video') ? (
                  <video
                    src={videoResultUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="rounded-lg object-contain w-full h-full max-h-[340px] shadow-lg bg-black"
                  />
                ) : (
                  <img
                    src={videoResultUrl}
                    alt="Sora Preview"
                    referrerPolicy="no-referrer"
                    className="rounded-lg object-cover w-full h-full max-h-[340px] shadow-lg"
                  />
                )}
                <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-md">
                  SORA-2 4K
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No Sora video rendered yet.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={videoResultUrl}
                target="_blank"
                rel="noreferrer"
                download="sora_video.mp4"
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video</span>
              </a>

              <button
                onClick={handleAddToTimeline}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>+ Add to Video Studio Timeline</span>
              </button>
            </div>

            {addedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">Sora scene inserted into Video Studio Timeline!</span>
                </div>
                {onNavigateToTimeline && (
                  <button
                    type="button"
                    onClick={onNavigateToTimeline}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Open Timeline</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Sora Videos Gallery & History Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <FolderHeart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generated Sora Video History & Persistent Library</h3>
              <p className="text-xs text-slate-500">
                All Sora videos generated here persist automatically. Add them to your Video Studio timeline at any time using stable asset IDs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold font-mono">
              {historyVideos.length} Video Clips
            </span>
            {onNavigateToTimeline && (
              <button
                type="button"
                onClick={onNavigateToTimeline}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-slate-600" />
                <span>View Timeline</span>
              </button>
            )}
          </div>
        </div>

        {historyVideos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Video className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">No generated Sora videos in library yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Generate a video clip above to automatically save and reference it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {historyVideos.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-50 rounded-xl border border-slate-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
              >
                <div 
                  onClick={() => setPreviewingItem(item)}
                  className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer"
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <video
                      src={item.url}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition">
                    <div className="w-9 h-9 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition">
                      <Play className="w-4 h-4 text-indigo-600 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                      Sora-2
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white">
                      {item.duration || 4}s
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                      {item.title}
                    </h4>
                    {item.prompt && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={item.prompt}>
                        {item.prompt}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddHistoryItemToTimeline(item)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer ${
                        historyAddedId === item.id 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {historyAddedId === item.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Studio</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewingItem(item)}
                      title="Play Preview"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      download={`${item.title || 'sora_clip'}.mp4`}
                      title="Download Video"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      title="Delete from Library"
                      className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-md">{previewingItem.title}</h4>
                <p className="text-xs text-slate-400 font-mono">{previewingItem.duration || 4}s • {previewingItem.resolution || '1280x720'}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingItem(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[60vh] overflow-hidden p-2">
              <video
                src={previewingItem.url}
                controls
                autoPlay
                playsInline
                className="max-h-[56vh] w-auto max-w-full rounded-lg"
              />
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400 line-clamp-1 italic">{previewingItem.prompt || previewingItem.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewingItem.url}
                  target="_blank"
                  rel="noreferrer"
                  download="sora_video.mp4"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    handleAddHistoryItemToTimeline(previewingItem);
                    setPreviewingItem(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>+ Add to Video Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
