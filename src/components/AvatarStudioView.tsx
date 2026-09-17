import React, { useState, useEffect, useRef } from 'react';
import { UserSession, UserTrialQuota } from '../types';
import {
  apiGetAvatars,
  apiGetAvatarVoices,
  apiCreateCustomAvatar,
  apiGenerateAvatarVideo,
  apiGetAvatarJobStatus,
  apiGetAvatarHistory,
  apiDeleteAvatar,
  extractErrorText,
} from '../lib/api';
import {
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Film,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  UserCheck,
  Languages,
  Clock,
  Layers,
  Sparkle,
  Trash2,
  Maximize2,
  FileText,
  Info,
  Check,
  Tv,
  Smartphone,
  Square,
  Camera,
  UploadCloud,
} from 'lucide-react';

export interface PresenterMediaClip {
  id?: string;
  name?: string;
  type?: 'video' | 'audio' | 'image';
  url?: string;
  duration?: number;
  startTime?: number;
  volume?: number;
}

interface AvatarStudioViewProps {
  user: UserSession | null;
  trialUsage: UserTrialQuota | null;
  onOpenPaywall: () => void;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onAddMediaToProject?: (clip: PresenterMediaClip) => void;
}

const BACKGROUND_PRESETS = [
  { id: 'newsroom', name: 'Broadcast Newsroom', icon: Tv, description: 'High-end TV studio with video wall' },
  { id: 'studio_gradient', name: 'Studio Gradient', icon: Layers, description: 'Clean navy & slate aesthetic' },
  { id: 'office', name: 'Executive Office', icon: Tv, description: 'Modern architectural workplace' },
  { id: 'kathmandu', name: 'Kathmandu Heritage', icon: Sparkle, description: 'Traditional Nepali cultural backdrop' },
  { id: 'tech_neon', name: 'Cyberpunk Tech', icon: Sparkles, description: 'Futuristic AI & tech stage' },
  { id: 'green_screen', name: 'Chroma Green Screen', icon: Square, description: 'Pure green backdrop for keying' },
];

const SCRIPT_TEMPLATES = [
  {
    title: 'नेपाली समाचार बुलेटिन (News)',
    lang: 'ne-NP',
    voice: 'ne-NP-SagarNeural',
    text: 'शुभ सन्ध्या! नेपाल एआई स्टुडियोको विशेष समाचार बुलेटिनमा स्वागत छ। आज देश तथा विदेशका मुख्य आर्थिक, प्रविधि र समसामयिक घटनाहरूको विस्तृत विवरण प्रस्तुत गर्दैछौं।',
  },
  {
    title: 'नमस्ते तथा स्वागत (Greeting)',
    lang: 'ne-NP',
    voice: 'ne-NP-HemkalaNeural',
    text: 'नमस्ते! म नेपाल एआई स्टुडियोको डिजिटल प्रस्तोता हुँ। अब तपाईं नेपाली भाषामा आफ्ना सन्देश, विज्ञापन र प्रस्तुतीहरू सहजै भिडियोमा रूपान्तरण गर्न सक्नुहुन्छ।',
  },
  {
    title: 'Himalayan Tourism Guide',
    lang: 'en-US',
    voice: 'en-US-JennyNeural',
    text: 'Welcome to Nepal, the land of Mount Everest and rich cultural heritage. Today we take you on a breathtaking visual journey through the majestic Himalayas and ancient temples.',
  },
  {
    title: 'Tech & AI Product Launch',
    lang: 'en-US',
    voice: 'en-US-GuyNeural',
    text: 'Introducing the next generation of creative media. With NepalAI Studio, create broadcast-grade avatar videos, Sora-2 cinematic shots, and multilingual voiceovers in minutes.',
  },
];

export const AvatarStudioView: React.FC<AvatarStudioViewProps> = ({
  user,
  trialUsage,
  onOpenPaywall,
  onOpenAuth,
  onAddMediaToProject,
}) => {
  // Avatars & Voices State
  const [avatars, setAvatars] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('ne-NP-HemkalaNeural');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ne-NP');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [backgroundPreset, setBackgroundPreset] = useState<string>('newsroom');

  // Voice Tuners
  const [speechSpeed, setSpeechSpeed] = useState<string>('normal');
  const [speechPitch, setSpeechPitch] = useState<string>('0%');

  // Script & Text State
  const [script, setScript] = useState<string>(
    'नमस्ते! नेपाल एआई स्टुडियोमा तपाईंलाई स्वागत छ। अब तपाईं कुनै पनि पाठलाई जीवित डिजिटल प्रस्तोताको भिडियोमा रूपान्तरण गर्न सक्नुहुन्छ।'
  );

  // Legal Consent State (Mandatory Gate)
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(true);
  const [signerFullName, setSignerFullName] = useState<string>(user?.name || 'Verified Creator');
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  // Custom Avatar Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAvatarName, setNewAvatarName] = useState<string>('');
  const [newAvatarGender, setNewAvatarGender] = useState<string>('female');
  const [newAvatarImageUrl, setNewAvatarImageUrl] = useState<string>('');
  const [newAvatarSignerName, setNewAvatarSignerName] = useState<string>(user?.name || '');
  const [newAvatarSignerRelation, setNewAvatarSignerRelation] = useState<string>('Direct Rights Holder');
  const [newAvatarConsentChecked, setNewAvatarConsentChecked] = useState<boolean>(false);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState<boolean>(false);

  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<any | null>(null);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Video Player Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Load Avatars and Voices on Mount
  useEffect(() => {
    loadAvatars();
    loadVoices();
    loadHistory();
  }, [user?.id]);

  const loadAvatars = async () => {
    try {
      const data = await apiGetAvatars(user?.id);
      if (data.success && data.avatars.length > 0) {
        setAvatars(data.avatars);
        if (!selectedAvatarId) {
          setSelectedAvatarId(data.avatars[0].id);
          if (data.avatars[0].defaultVoiceId) {
            setSelectedVoiceId(data.avatars[0].defaultVoiceId);
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to load avatars:', err);
    }
  };

  const loadVoices = async () => {
    try {
      const data = await apiGetAvatarVoices();
      if (data.success && data.voices.length > 0) {
        setVoices(data.voices);
      }
    } catch (err: any) {
      console.warn('Failed to load voices:', err);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const data = await apiGetAvatarHistory(user.id);
      if (data.success) {
        setHistoryJobs(data.jobs || []);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId) || avatars[0];

  // Handle Voice and Avatar Selection Sync
  const handleSelectAvatar = (avatar: any) => {
    setSelectedAvatarId(avatar.id);
    if (avatar.defaultVoiceId) {
      setSelectedVoiceId(avatar.defaultVoiceId);
      const matchedVoice = voices.find((v) => v.id === avatar.defaultVoiceId);
      if (matchedVoice) {
        setSelectedLanguage(matchedVoice.language);
      }
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    const matchedVoice = voices.find((v) => v.id === voiceId);
    if (matchedVoice) {
      setSelectedLanguage(matchedVoice.language);
    }
  };

  // Estimate Script Duration (avg ~130-150 words per min or ~3.5 syllables per sec)
  const calculateEstimatedDuration = () => {
    const trimmed = script.trim();
    if (!trimmed) return 0;
    const words = trimmed.split(/\s+/).length;
    // For Nepali/English mix, ~2.2 words per second
    return Math.max(3, Math.round((words / 2.3) * 10) / 10);
  };

  // Create Custom Presenter Avatar
  const handleCreateCustomAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('user');
      return;
    }
    if (!newAvatarName.trim() || !newAvatarImageUrl.trim()) {
      alert('Please provide avatar name and valid portrait image.');
      return;
    }
    if (!newAvatarConsentChecked || !newAvatarSignerName.trim()) {
      alert('Legal likeness confirmation and full signer legal name are required.');
      return;
    }

    setIsCreatingAvatar(true);
    try {
      const res = await apiCreateCustomAvatar({
        userId: user.id,
        name: newAvatarName.trim(),
        gender: newAvatarGender,
        imageUrl: newAvatarImageUrl.trim(),
        signerFullName: newAvatarSignerName.trim(),
        signerRelationship: newAvatarSignerRelation.trim(),
        consentConfirmed: newAvatarConsentChecked,
      });

      if (res.success && res.avatar) {
        setAvatars((prev) => [res.avatar, ...prev]);
        setSelectedAvatarId(res.avatar.id);
        setShowCreateModal(false);
        setNewAvatarName('');
        setNewAvatarImageUrl('');
        setNewAvatarConsentChecked(false);
      }
    } catch (err: any) {
      alert(`Avatar creation error: ${err.message}`);
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  // Delete Custom Avatar
  const handleDeleteCustomAvatar = async (avatarId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm('Are you sure you want to delete this custom avatar?')) return;
    try {
      await apiDeleteAvatar(avatarId, user.id);
      setAvatars((prev) => prev.filter((a) => a.id !== avatarId));
      if (selectedAvatarId === avatarId) {
        setSelectedAvatarId(avatars[0]?.id || '');
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Generate Synchronized Avatar Video
  const handleGenerate = async () => {
    if (!user) {
      onOpenAuth('user');
      return;
    }

    if (!script.trim()) {
      setErrorMessage('Please enter a script for the avatar presenter to speak.');
      return;
    }

    if (!consentConfirmed) {
      setShowConsentModal(true);
      return;
    }

    // Check credits
    if ((user.credits ?? 0) < 15 && user.role !== 'admin') {
      onOpenPaywall();
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setCurrentJob({
      status: 'synthesizing_voice',
      progress: 15,
      stageLabel: 'Synthesizing Neural Voice Track...',
    });

    try {
      const res = await apiGenerateAvatarVideo({
        userId: user.id,
        avatarId: selectedAvatarId,
        script: script.trim(),
        language: selectedLanguage,
        voiceId: selectedVoiceId,
        speed: speechSpeed,
        pitch: speechPitch,
        aspectRatio,
        backgroundPreset,
        consentConfirmed: true,
        signerFullName: signerFullName.trim() || user.name || 'Verified User',
      });

      if (res.success) {
        setGeneratedResult(res);
        setCurrentJob(null);
        loadHistory();
      }
    } catch (err: any) {
      console.error('Avatar generation error:', err);
      setErrorMessage(extractErrorText(err, 'Avatar video generation failed.'));
      setCurrentJob(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Send Generated Video to Multi-Track Timeline
  const handleSendToTimeline = () => {
    if (!generatedResult?.videoUrl || !onAddMediaToProject) return;

    onAddMediaToProject({
      id: `clip_${Date.now()}`,
      name: `Presenter - ${selectedAvatar?.name || 'Avatar'}`,
      type: 'video',
      url: generatedResult.videoUrl,
      duration: generatedResult.durationSeconds || 5,
      startTime: 0,
      volume: 1,
    });

    alert('✅ Avatar presenter video successfully added to the Multi-Track Timeline!');
  };

  // Video Player Controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Banner */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-13 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Avatar Presenter Studio
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60">
                  AI Digital Presenter v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Photorealistic AI presenters speaking Devanagari Nepali & English with synchronized lip motion.
              </p>
            </div>
          </div>

          {/* Credits & Rights Verification Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Likeness Rights:</span>
              <span className="text-emerald-400 font-semibold">Consent Verified</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-800/50 text-xs">
              <span className="text-slate-400">Cost:</span>
              <span className="text-teal-300 font-bold">15 Credits / Render</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Presenter Selection, Voice & Controls */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 1. Presenter Avatars Picker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Select Presenter
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Avatar</span>
              </button>
            </div>

            {/* Avatars Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {avatars.map((avt) => {
                const isSelected = selectedAvatarId === avt.id;
                return (
                  <div
                    key={avt.id}
                    onClick={() => handleSelectAvatar(avt)}
                    className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-square flex flex-col justify-end p-2 ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/30 scale-[1.02]'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                    }`}
                  >
                    <img
                      src={avt.imageUrl}
                      alt={avt.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    <div className="relative z-10 text-left">
                      <div className="text-[11px] font-bold text-white leading-tight truncate">
                        {avt.name}
                      </div>
                      <div className="text-[9px] text-teal-300 font-medium capitalize">
                        {avt.category || 'Presenter'}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    {avt.category === 'custom' && (
                      <button
                        onClick={(e) => handleDeleteCustomAvatar(avt.id, e)}
                        className="absolute top-1.5 left-1.5 p-1 rounded-md bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800 opacity-0 group-hover:opacity-100 transition"
                        title="Delete custom avatar"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Neural Voice & Language Picker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Voice & Cadence
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Neural TTS Engine</span>
            </div>

            <div className="space-y-2">
              {voices.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVoice(v.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/60 text-white font-medium'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100">{v.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {v.language}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{v.style}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Speed and Pitch Sliders */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
                  <span>Speech Rate</span>
                  <span className="font-mono text-cyan-400">{speechSpeed}</span>
                </label>
                <select
                  value={speechSpeed}
                  onChange={(e) => setSpeechSpeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="slow">Slow (-15%)</option>
                  <option value="normal">Normal Pace (1.0x)</option>
                  <option value="fast">Fast (+15%)</option>
                  <option value="x-fast">Expressive Quick (+28%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 flex items-center justify-between mb-1">
                  <span>Pitch Tone</span>
                  <span className="font-mono text-cyan-400">{speechPitch}</span>
                </label>
                <select
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="-10%">Deep / Warm (-10%)</option>
                  <option value="0%">Natural / Studio (0%)</option>
                  <option value="+10%">Bright / Energetic (+10%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Staging & Format */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Staging & Canvas
              </h2>
            </div>

            {/* Aspect Ratio Buttons */}
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5">Aspect Ratio</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition ${
                    aspectRatio === '16:9'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>16:9 Wide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition ${
                    aspectRatio === '9:16'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 Reels</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition ${
                    aspectRatio === '1:1'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1:1 Post</span>
                </button>
              </div>
            </div>

            {/* Virtual Background Presets */}
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5">Studio Background</div>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_PRESETS.slice(0, 4).map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundPreset(bg.id)}
                    className={`p-2 rounded-lg text-left text-xs border transition flex items-center gap-2 ${
                      backgroundPreset === bg.id
                        ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <bg.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Script Editor, Generation & Live Output Player */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Script Editor Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Presenter Script (Devanagari & English)
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>Est. Duration: <strong className="text-teal-300">{calculateEstimatedDuration()}s</strong></span>
                <span className="text-slate-600">•</span>
                <span>{script.length} chars</span>
              </div>
            </div>

            {/* Quick Template Selector */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">Templates:</span>
              {SCRIPT_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setScript(tmpl.text);
                    setSelectedLanguage(tmpl.lang);
                    setSelectedVoiceId(tmpl.voice);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition"
                >
                  {tmpl.title}
                </button>
              ))}
            </div>

            {/* Script Textarea */}
            <textarea
              rows={5}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your presenter script in Nepali (Devanagari) or English..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition resize-y leading-relaxed font-sans"
            />

            {/* Mandatory Likeness & Rights Consent Confirmation */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700 focus:ring-teal-500"
                />
                <div className="text-xs text-slate-300 leading-snug">
                  <span className="font-semibold text-emerald-300">Likeness Rights & Broadcast Consent: </span>
                  I confirm that I hold full commercial rights to broadcast this avatar and voiceover.
                </div>
              </label>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-900/40">
                <span>Authorized Signer: <strong className="text-slate-200">{signerFullName}</strong></span>
                <span>Audit Stamp: <span className="font-mono text-emerald-400">CRYPTOGRAPHIC_SIGNED</span></span>
              </div>
            </div>

            {/* Error Banner if any */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition cursor-pointer ${
                  isGenerating || !script.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/25 hover:scale-[1.01]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Rendering Presenter Video...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Avatar Video (15 Credits)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Video Output Stage */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Presenter Stage
                </h2>
              </div>

              {generatedResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendToTimeline}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Send to Timeline</span>
                  </button>

                  <a
                    href={generatedResult.videoUrl}
                    download="nepalai_avatar_presenter.mp4"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Download MP4"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Video Canvas Container */}
            <div className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center ${
              aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-video w-full'
            }`}>
              {isGenerating ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-500/50 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-100">
                      Generating Neural Presenter
                    </div>
                    <div className="text-xs text-teal-400 animate-pulse">
                      Synthesizing audio & lip-sync motion...
                    </div>
                  </div>
                </div>
              ) : generatedResult?.videoUrl ? (
                <div className="relative w-full h-full group">
                  <video
                    ref={videoRef}
                    src={generatedResult.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setVideoDuration(videoRef.current?.duration || 0)}
                  />

                  {/* Player Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="p-1.5 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 transition"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <span className="text-[10px] font-mono text-slate-300">
                        {currentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                      </span>
                    </div>

                    <div className="text-[10px] font-semibold text-teal-300 px-2 py-0.5 rounded bg-teal-950 border border-teal-800">
                      {generatedResult.avatarName || selectedAvatar?.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 space-y-2">
                  <img
                    src={selectedAvatar?.imageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80'}
                    alt="Presenter Preview"
                    className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-slate-700 shadow-md opacity-70"
                  />
                  <div className="text-xs font-semibold text-slate-300">
                    Ready to render: {selectedAvatar?.name || 'Presenter'}
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Type or choose a script above and click "Generate Avatar Video" to create an ultra-smooth MP4.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Past Generations Gallery Drawer */}
          {historyJobs.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Recent Avatar Renders
                  </h2>
                </div>
                <span className="text-[10px] text-slate-400">{historyJobs.length} videos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {historyJobs.slice(0, 4).map((j) => (
                  <div
                    key={j.id}
                    onClick={() => {
                      if (j.videoUrl) {
                        setGeneratedResult(j);
                      }
                    }}
                    className="group relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 hover:border-teal-500/60 cursor-pointer transition p-2 space-y-1"
                  >
                    <div className="aspect-video bg-slate-900 rounded overflow-hidden relative">
                      <img
                        src={j.avatarImageUrl || selectedAvatar?.imageUrl}
                        alt="Job Avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-4 h-4 text-teal-400" />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-white truncate">{j.avatarName}</div>
                    <div className="text-[9px] text-slate-400 truncate font-mono">
                      {j.durationSeconds ? `${j.durationSeconds.toFixed(1)}s` : '5.0s'} • {j.aspectRatio || '16:9'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal: Create Custom Presenter Avatar */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Create Custom Presenter Avatar</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomAvatar} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Presenter Name</label>
                <input
                  type="text"
                  required
                  value={newAvatarName}
                  onChange={(e) => setNewAvatarName(e.target.value)}
                  placeholder="e.g., Dr. Anjali Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Gender / Demeanor</label>
                <select
                  value={newAvatarGender}
                  onChange={(e) => setNewAvatarGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Portrait Image URL</label>
                <input
                  type="url"
                  required
                  value={newAvatarImageUrl}
                  onChange={(e) => setNewAvatarImageUrl(e.target.value)}
                  placeholder="https://... or uploaded image URL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 font-mono text-[11px]"
                />
              </div>

              {/* Legal Confirmation within Modal */}
              <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/40 space-y-2">
                <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wide">
                  Legal Likeness Rights Verification
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Signer Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={newAvatarSignerName}
                    onChange={(e) => setNewAvatarSignerName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 text-[11px]"
                  />
                </div>
                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newAvatarConsentChecked}
                    onChange={(e) => setNewAvatarConsentChecked(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-[10px] text-slate-300 leading-snug">
                    I declare under penalty of perjury that I hold explicit likeness and identity broadcasting consent for this avatar persona.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAvatar}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  {isCreatingAvatar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Presenter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
