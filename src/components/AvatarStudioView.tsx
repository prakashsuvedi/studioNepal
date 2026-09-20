import React, { useState, useEffect, useRef } from 'react';
import { UserSession, UserTrialQuota } from '../types';
import {
  apiGetAvatars,
  apiGetAvatarVoices,
  apiCreateCustomAvatar,
  apiGenerateAIAvatar,
  apiGenerateAvatarVideo,
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
  Film,
  Plus,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Languages,
  Clock,
  Layers,
  Sparkle,
  Trash2,
  FileText,
  Check,
  CheckCircle,
  Tv,
  Smartphone,
  Square,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Wand2,
  Users,
  X,
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
  {
    id: 'newsroom',
    name: 'Broadcast Newsroom',
    icon: Tv,
    description: 'National TV studio with live monitor backdrop',
    previewUrl: '/assets/backgrounds/newsroom.jpg',
  },
  {
    id: 'office',
    name: 'Executive Office Room',
    icon: Tv,
    description: 'Contemporary corporate high-rise office',
    previewUrl: '/assets/backgrounds/office.jpg',
  },
  {
    id: 'podcast',
    name: 'Podcast Room Studio',
    icon: Layers,
    description: 'Acoustic wood slats, warm neon & studio mic',
    previewUrl: '/assets/backgrounds/podcast.jpg',
  },
  {
    id: 'kathmandu',
    name: 'Kathmandu Valley Studio',
    icon: Sparkle,
    description: 'Himalayan mountain panorama & valley view',
    previewUrl: '/assets/backgrounds/kathmandu.jpg',
  },
  {
    id: 'green_screen',
    name: 'Chroma Green Screen',
    icon: Square,
    description: 'Pure studio green backdrop for post-production',
    previewUrl: '/assets/backgrounds/green_screen.png',
  },
];

const SCRIPT_TEMPLATES = [
  {
    title: '👥 दुई प्रस्तोता समाचार (Dual Anchor News)',
    lang: 'ne-NP',
    voice: 'ne-NP-SagarNeural',
    secVoice: 'ne-NP-HemkalaNeural',
    mode: 'dual_anchor',
    text: `सागर: नमस्कार दर्शकवृन्द! नेपाल एआई स्टुडियोको प्रत्यक्ष राष्ट्रिय समाचार बुलेटिनमा हार्दिक स्वागत छ। म सागर शर्मा।
हेमकला: र म हेमकला अधिकारी। आज हामी देश तथा विदेशका प्रमुख प्रविधि र आर्थिक विकासका ताजा घटनाक्रम प्रस्तुत गर्दैछौं।
सागर: पहिलो मुख्य समाचार: नेपालमा आर्टिफिसियल इन्टेलिजेन्स र डिजिटल मिडिया क्रान्तिको सुरुवात भएको छ।
हेमकला: हजुर, अब जो कोहीले पनि आफ्नै भाषामा उच्च गुणस्तरीय डिजिटल भिडियो उत्पादन गर्न सक्नेछन्।`,
  },
  {
    title: '🎙️ प्रस्तोता संवाद (Co-Host Studio Talk)',
    lang: 'ne-NP',
    voice: 'ne-NP-SagarNeural',
    secVoice: 'ne-NP-HemkalaNeural',
    mode: 'dual_anchor',
    text: `सागर: हेमकला जी, आजको स्टुडियो प्रस्तुति साँच्चै भव्य र ऐतिहासिक बनेको छ। तपाईंलाई कस्तो लाग्दैछ?
हेमकला: एकदमै उत्कृष्ट सागर जी! दुवै प्रस्तोता स्टुडियो डेस्कमा बसेर आफ्नै आवाजमा कुरा गर्न पाउँदा दर्शकहरूलाई पूर्ण प्रत्यक्ष समाचार कक्षको अनुभूति हुनेछ।
सागर: बिल्कुल सही भन्नुभयो। अब आउनुहोस् विस्तृत चर्चा सुरु गरौं।`,
  },
  {
    title: 'नेपाली समाचार बुलेटिन (Solo News)',
    lang: 'ne-NP',
    voice: 'ne-NP-SagarNeural',
    secVoice: '',
    mode: 'solo',
    text: 'शुभ सन्ध्या! नेपाल एआई स्टुडियोको विशेष समाचार बुलेटिनमा स्वागत छ। आज देश तथा विदेशका मुख्य आर्थिक, प्रविधि र समसामयिक घटनाहरूको विस्तृत विवरण प्रस्तुत गर्दैछौं।',
  },
  {
    title: 'नमस्ते तथा स्वागत (Greeting)',
    lang: 'ne-NP',
    voice: 'ne-NP-HemkalaNeural',
    secVoice: '',
    mode: 'solo',
    text: 'नमस्ते! म नेपाल एआई स्टुडियोको डिजिटल प्रस्तोता हुँ। अब तपाईं नेपाली भाषामा आफ्ना सन्देश, विज्ञापन र प्रस्तुतीहरू सहजै उच्च गुणस्तरीय भिडियोमा रूपान्तरण गर्न सक्नुहुन्छ।',
  },
  {
    title: 'Himalayan Tourism Guide',
    lang: 'en-US',
    voice: 'en-US-JennyNeural',
    secVoice: 'en-US-GuyNeural',
    mode: 'solo',
    text: 'Welcome to Nepal, the land of Mount Everest and rich cultural heritage. Today we take you on a breathtaking visual journey through the majestic Himalayas and ancient temples.',
  },
  {
    title: 'Tech & AI Product Launch',
    lang: 'en-US',
    voice: 'en-US-GuyNeural',
    secVoice: 'en-US-JennyNeural',
    mode: 'solo',
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
  const [studioMode, setStudioMode] = useState<'solo' | 'dual_anchor' | 'storyteller'>('solo');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [secondaryAvatarId, setSecondaryAvatarId] = useState<string>('');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('ne-NP-HemkalaNeural');
  const [secondaryVoiceId, setSecondaryVoiceId] = useState<string>('ne-NP-SagarNeural');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ne-NP');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [backgroundPreset, setBackgroundPreset] = useState<string>('newsroom');
  const [selectedPose, setSelectedPose] = useState<'seated' | 'standing'>('seated');

  // Voice Tuners
  const [speechSpeed, setSpeechSpeed] = useState<string>('normal');
  const [speechPitch, setSpeechPitch] = useState<string>('0%');

  // Script & Text State
  const [script, setScript] = useState<string>(
    'नमस्ते! नेपाल एआई स्टुडियोको डिजिटल प्रस्तोता स्टुडियोमा स्वागत छ। आज हामी तपाईंको लागि नयाँ भिडियो प्रस्तुत गर्दैछौं।'
  );

  // Legal Consent State (Mandatory Gate)
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(true);
  const [signerFullName, setSignerFullName] = useState<string>(user?.name || 'Verified Creator');

  // Custom Avatar Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creationMode, setCreationMode] = useState<'upload' | 'ai_prompt'>('upload');
  
  // Upload picture mode
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string>('');
  const [newAvatarName, setNewAvatarName] = useState<string>('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female' | 'non-binary'>('female');
  const [newAvatarSignerName, setNewAvatarSignerName] = useState<string>(user?.name || '');
  const [newAvatarConsentChecked, setNewAvatarConsentChecked] = useState<boolean>(true);
  const [isCreatingAvatar, setIsCreatingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Prompt Avatar mode
  const [aiPrompt, setAiPrompt] = useState<string>('Nepali professional female news anchor in dark blue blazer, studio lighting, photorealistic 8k portrait');
  const [aiGeneratedAvatarPreview, setAiGeneratedAvatarPreview] = useState<string>('');
  const [isGeneratingAiAvatar, setIsGeneratingAiAvatar] = useState<boolean>(false);

  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyJobs, setHistoryJobs] = useState<any[]>([]);

  // Video Player Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Real Video Dual-Anchor Studio State (Full motion real presenters)
  const [realVideoPreset, setRealVideoPreset] = useState<'studio' | 'primetime' | 'custom'>('studio');
  const [customSoraVideoUrl, setCustomSoraVideoUrl] = useState<string>('');
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(true);
  const [previewMuted, setPreviewMuted] = useState<boolean>(true);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Azure Sora-2 Studio Generator Modal State
  const [showSoraStudioModal, setShowSoraStudioModal] = useState<boolean>(false);
  const [soraStudioPrompt, setSoraStudioPrompt] = useState<string>(
    'Two professional news anchors, a male anchor in navy suit and female anchor in crimson blazer, seated side-by-side at a curved broadcast newsroom desk, presenting live television news bulletin together. Realistic broadcast studio with video wall in background, natural body posture, speaking to camera, 4K television broadcast.'
  );
  const [isGeneratingSoraStudio, setIsGeneratingSoraStudio] = useState<boolean>(false);
  const [soraStudioProgress, setSoraStudioProgress] = useState<number>(0);

  // Quota & Free Render State
  const avatarCount = trialUsage?.avatarCount ?? 0;
  const freeAvatarUsed = Boolean(trialUsage?.freeAvatarRenderUsed || avatarCount >= 1);
  const isFreeRenderEligible = !freeAvatarUsed && (user?.tier === 'free_trial' || !user?.credits || user.credits === 0);
  const isAdmin = user?.role === 'admin';

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
        if (data.avatars.length > 1 && !secondaryAvatarId) {
          setSecondaryAvatarId(data.avatars[1].id);
          if (data.avatars[1].defaultVoiceId) {
            setSecondaryVoiceId(data.avatars[1].defaultVoiceId);
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
    try {
      const data = await apiGetAvatarHistory(user.id);
      if (data.success) {
        setHistoryJobs(data.jobs || []);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    }
  };

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId) || avatars[0];
  const selectedSecondaryAvatar = avatars.find((a) => a.id === secondaryAvatarId) || (avatars.length > 1 ? avatars[1] : avatars[0]);
  const selectedBackground = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0];

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

  // Estimate Script Duration
  const calculateEstimatedDuration = () => {
    const trimmed = script.trim();
    if (!trimmed) return 0;
    const words = trimmed.split(/\s+/).length;
    return Math.max(3, Math.round((words / 2.3) * 10) / 10);
  };

  // Handle Picture File Upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedImageDataUrl(dataUrl);
      if (!newAvatarName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewAvatarName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Avatar from Uploaded Picture
  const handleSaveUploadedAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('user');
      return;
    }
    if (!uploadedImageDataUrl) {
      alert('Please upload your portrait image.');
      return;
    }
    if (!newAvatarName.trim()) {
      alert('Please enter a name for your avatar presenter.');
      return;
    }
    if (!newAvatarConsentChecked) {
      alert('Please confirm the Likeness Rights & Broadcast Consent declaration.');
      return;
    }

    setIsCreatingAvatar(true);
    try {
      const res = await apiCreateCustomAvatar({
        userId: user.id,
        name: newAvatarName.trim(),
        gender: newAvatarGender,
        imageUrl: uploadedImageDataUrl,
        signerFullName: newAvatarSignerName.trim() || user.name || 'Creator User',
        signerRelationship: 'Direct Rights Holder / Authorized Creator',
        consentConfirmed: newAvatarConsentChecked,
      });

      if (res.success && res.avatar) {
        setAvatars((prev) => [res.avatar, ...prev]);
        setSelectedAvatarId(res.avatar.id);
        setShowCreateModal(false);
        setUploadedImageDataUrl('');
        setNewAvatarName('');
      }
    } catch (err: any) {
      alert(`Avatar creation error: ${err.message}`);
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  // Generate AI Avatar via Prompt
  const handleGenerateAiAvatar = async () => {
    if (!user) {
      onOpenAuth('user');
      return;
    }
    if (!aiPrompt.trim()) {
      alert('Please enter a description prompt for the AI presenter portrait.');
      return;
    }

    setIsGeneratingAiAvatar(true);
    try {
      const res = await apiGenerateAIAvatar({
        userId: user.id,
        prompt: aiPrompt.trim(),
        name: newAvatarName.trim() || undefined,
        gender: newAvatarGender,
        signerFullName: newAvatarSignerName.trim() || user.name || 'Creator User',
      });

      if (res.success && res.avatar) {
        setAiGeneratedAvatarPreview(res.avatar.imageUrl);
        setAvatars((prev) => [res.avatar, ...prev]);
        setSelectedAvatarId(res.avatar.id);
        setShowCreateModal(false);
      }
    } catch (err: any) {
      alert(`AI Avatar generation error: ${err.message}`);
    } finally {
      setIsGeneratingAiAvatar(false);
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
      alert('Please confirm likeness rights and voice consent before generating.');
      return;
    }

    // Check credits: allow free render for Google login / free users on first render!
    if (!isFreeRenderEligible && (user.credits ?? 0) < 15 && !isAdmin) {
      onOpenPaywall();
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const res = await apiGenerateAvatarVideo({
        userId: user.id,
        avatarId: selectedAvatarId,
        secondaryAvatarId: studioMode === 'dual_anchor' ? secondaryAvatarId : undefined,
        studioMode,
        realVideoPreset:
          studioMode === 'dual_anchor'
            ? customSoraVideoUrl
              ? customSoraVideoUrl
              : realVideoPreset
            : undefined,
        script: script.trim(),
        language: selectedLanguage,
        voiceId: selectedVoiceId,
        secondaryVoiceId: studioMode === 'dual_anchor' ? secondaryVoiceId : undefined,
        speed: speechSpeed,
        pitch: speechPitch,
        aspectRatio,
        backgroundPreset,
        pose: selectedPose,
        consentConfirmed: true,
        signerFullName: signerFullName.trim() || user.name || 'Verified User',
      });

      if (res.success) {
        setGeneratedResult(res);
        loadHistory();
      }
    } catch (err: any) {
      console.error('Avatar generation error:', err);
      setErrorMessage(extractErrorText(err, 'Avatar video generation failed.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Custom Real Studio Video via Azure Sora-2
  const handleGenerateSoraStudioVideo = async () => {
    if (!user) {
      onOpenAuth('user');
      return;
    }
    if (!soraStudioPrompt.trim()) return;

    setIsGeneratingSoraStudio(true);
    setSoraStudioProgress(15);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/video/azure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: soraStudioPrompt.trim(),
          model: 'sora-2',
          size: '1280x720',
          seconds: '8',
          adminBypass: isAdmin,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.jobId) {
        throw new Error(data.error || 'Failed to dispatch Sora-2 video generation');
      }

      // Poll status
      const pollInterval = setInterval(async () => {
        try {
          const sRes = await fetch(`/api/video/status/${data.jobId}`);
          const sData = await sRes.json();
          if (sData.progress) {
            setSoraStudioProgress(sData.progress);
          }
          if (sData.status === 'completed' || sData.status === 'succeeded') {
            clearInterval(pollInterval);
            setIsGeneratingSoraStudio(false);
            const videoUrl = sData.url || `/api/video/content/${data.jobId}`;
            setCustomSoraVideoUrl(videoUrl);
            setRealVideoPreset('custom');
            setShowSoraStudioModal(false);
            alert('✅ New custom 4K real studio video generated successfully with Azure Sora-2!');
          } else if (sData.status === 'failed') {
            clearInterval(pollInterval);
            setIsGeneratingSoraStudio(false);
            setErrorMessage(sData.error || 'Sora-2 video generation failed.');
          }
        } catch (e) {
          console.warn('Polling error:', e);
        }
      }, 3000);
    } catch (err: any) {
      setIsGeneratingSoraStudio(false);
      setErrorMessage(err.message || 'Sora-2 generation request failed.');
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
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-0 overflow-y-auto">
      {/* Studio Header Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Avatar Presenter Studio
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60">
                  Neural Studio v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Photorealistic AI presenters with synchronized speech, studio backdrops, and bold lower-third script.
              </p>
            </div>
          </div>

          {/* Credits & Free Render Policy Badge */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/50 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 font-bold">Admin Unlimited Bypass</span>
              </div>
            ) : isFreeRenderEligible ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-700 text-xs shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">1 Free Video Render Available!</span>
                <span className="text-[10px] text-emerald-400/80 hidden sm:inline">(NepalAI logo)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/40 border border-teal-800/50 text-xs">
                <span className="text-slate-400">Cost:</span>
                <span className="text-teal-300 font-bold">15 Credits / Master Video</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Free Tier Notice Banner */}
      {isFreeRenderEligible && (
        <div className="bg-gradient-to-r from-teal-950/80 via-indigo-950/80 to-slate-950 border-b border-teal-800/40 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-teal-200">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎁</span>
              <span>
                <strong>Welcome Google Login Creator:</strong> You have <strong>1 Free Full-Resolution Avatar Video Render</strong> included with NepalAI Studio logo watermark!
              </span>
            </div>
            <span className="text-[10px] text-teal-400 uppercase tracking-wide font-mono font-bold bg-teal-900/50 px-2 py-0.5 rounded border border-teal-700/50">
              Free Trial Ready
            </span>
          </div>
        </div>
      )}

      {/* Main Studio Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Presenter Selection, Voice & Controls */}
        <div className="lg:col-span-5 space-y-5">

          {/* Studio Production Mode Selector */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Studio Format</span>
              </div>
              <span className="text-[10px] text-teal-400 font-mono font-bold bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                {studioMode === 'dual_anchor' ? '👥 2 People Seated in Studio' : studioMode === 'storyteller' ? '📖 Storyteller Host' : '🎙️ Solo Newsreader'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setStudioMode('solo')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                  studioMode === 'solo'
                    ? 'bg-teal-950/80 border-teal-500 text-teal-300 ring-1 ring-teal-500/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="text-[10px]">Solo Anchor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioMode('dual_anchor');
                  if (aspectRatio !== '16:9') setAspectRatio('16:9');
                }}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                  studioMode === 'dual_anchor'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px]">Dual Anchor (2)</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioMode('storyteller')}
                className={`py-2 px-1.5 rounded-lg text-xs font-bold border transition flex flex-col items-center gap-1 cursor-pointer ${
                  studioMode === 'storyteller'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkle className="w-3.5 h-3.5" />
                <span className="text-[10px]">Storyteller</span>
              </button>
            </div>
          </div>

          {/* Real Video Dual-Anchor Studio Environment Picker */}
          {studioMode === 'dual_anchor' && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    Real Video Studio Setup (2 Seated Anchors)
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono font-bold">
                  4K Real Motion Video
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full-production studio environment featuring real television presenters seated together at the news desk with authentic movement, camera eye-contact, and live newsroom monitors (not static cutouts).
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option 1: National Newsroom */}
                <button
                  type="button"
                  onClick={() => {
                    setRealVideoPreset('studio');
                    setCustomSoraVideoUrl('');
                  }}
                  className={`p-2 rounded-xl border text-left transition flex flex-col gap-1.5 cursor-pointer relative overflow-hidden ${
                    realVideoPreset === 'studio' && !customSoraVideoUrl
                      ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900">
                    <img
                      src="/samples/dual_anchor_studio_poster.jpg"
                      alt="National Broadcast Studio"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-500/30">
                      National 4K
                    </span>
                  </div>
                  <div className="px-0.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>National Newsroom</span>
                      {realVideoPreset === 'studio' && !customSoraVideoUrl && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      Two co-hosts, curved news desk
                    </p>
                  </div>
                </button>

                {/* Option 2: Primetime Evening News */}
                <button
                  type="button"
                  onClick={() => {
                    setRealVideoPreset('primetime');
                    setCustomSoraVideoUrl('');
                  }}
                  className={`p-2 rounded-xl border text-left transition flex flex-col gap-1.5 cursor-pointer relative overflow-hidden ${
                    realVideoPreset === 'primetime' && !customSoraVideoUrl
                      ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-900">
                    <img
                      src="/samples/dual_anchor_primetime_poster.jpg"
                      alt="Primetime Broadcast Studio"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-cyan-500/30">
                      Primetime 8s
                    </span>
                  </div>
                  <div className="px-0.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>Primetime Edition</span>
                      {realVideoPreset === 'primetime' && !customSoraVideoUrl && (
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      Navy & crimson attire, video wall
                    </p>
                  </div>
                </button>
              </div>

              {/* Custom Sora-2 Video Status or Generator Trigger */}
              {customSoraVideoUrl ? (
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-medium truncate">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Custom Sora-2 Studio Video Active</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSoraStudioModal(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-200 underline shrink-0 cursor-pointer font-semibold"
                  >
                    Change Prompt
                  </button>
                </div>
              ) : (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowSoraStudioModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-950/90 border border-slate-700/80 hover:border-cyan-400/60 text-slate-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate New Custom Studio Video via Azure Sora-2</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 1. Presenter Avatars Picker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {studioMode === 'dual_anchor' ? '1. Lead Anchor (Speaker 1)' : '1. Choose Presenter'}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Same-to-Same</span>
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
                      <div className="text-[9px] text-teal-300 font-medium capitalize truncate">
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

            {selectedAvatar && (
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-center gap-3">
                <img
                  src={selectedAvatar.imageUrl}
                  alt={selectedAvatar.name}
                  className="w-9 h-9 rounded-full object-cover border border-teal-500/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">
                    {studioMode === 'dual_anchor' ? `Lead Anchor (Left Desk): ${selectedAvatar.name}` : selectedAvatar.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{selectedAvatar.description}</div>
                </div>
              </div>
            )}

            {/* Dual Anchor: Co-Anchor (Right Desk) Selection */}
            {studioMode === 'dual_anchor' && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>Co-Anchor (Speaker 2, Right Desk)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Conversational Host</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                  {avatars.map((avt) => {
                    const isCoSelected = secondaryAvatarId === avt.id;
                    return (
                      <div
                        key={`co-${avt.id}`}
                        onClick={() => {
                          setSecondaryAvatarId(avt.id);
                          if (avt.defaultVoiceId) {
                            setSecondaryVoiceId(avt.defaultVoiceId);
                          }
                        }}
                        className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all aspect-square flex flex-col justify-end p-2 ${
                          isCoSelected
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                        }`}
                      >
                        <img
                          src={avt.imageUrl}
                          alt={avt.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        <div className="relative z-10 text-[10px] font-bold text-white leading-tight truncate">
                          {avt.name}
                        </div>
                        {isCoSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedSecondaryAvatar && (
                  <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs flex items-center gap-2.5">
                    <img
                      src={selectedSecondaryAvatar.imageUrl}
                      alt={selectedSecondaryAvatar.name}
                      className="w-8 h-8 rounded-full object-cover border border-cyan-400/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-cyan-200 text-xs truncate">Co-Anchor: {selectedSecondaryAvatar.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">Seated at right studio desk</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Studio Background & Staging */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Studio Room Backdrop
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">High Quality 1080p</span>
            </div>

            {/* Virtual Background Presets with Image Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BACKGROUND_PRESETS.map((bg) => {
                const isSelected = backgroundPreset === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundPreset(bg.id)}
                    className={`group relative rounded-lg overflow-hidden text-left border transition p-2 flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-9 rounded overflow-hidden relative shrink-0 bg-slate-900 border border-slate-800">
                      <img
                        src={bg.previewUrl}
                        alt={bg.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {bg.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {bg.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Aspect Ratio Buttons */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Video Framing Ratio</div>
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
                  <span>16:9 Broadcast</span>
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
                  <span>9:16 Shorts/Reel</span>
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
                  <span>1:1 Square</span>
                </button>
              </div>
            </div>

            {/* Presenter Staging Pose (Seated Anchor vs Standing) */}
            <div className="pt-2.5 border-t border-slate-800/80">
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold flex items-center justify-between">
                <span>Presenter Staging Pose</span>
                <span className="text-[9px] text-teal-400 font-normal">Real-time Lipsync Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPose('seated')}
                  className={`flex items-center justify-start gap-2.5 p-2 rounded-lg text-xs border transition ${
                    selectedPose === 'seated'
                      ? 'bg-teal-950/60 border-teal-500 text-teal-300 font-bold ring-1 ring-teal-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">Anchor Desk (Seated)</div>
                    <div className="text-[9px] text-slate-400 font-normal truncate">Executive chair & news desk</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPose('standing')}
                  className={`flex items-center justify-start gap-2.5 p-2 rounded-lg text-xs border transition ${
                    selectedPose === 'standing'
                      ? 'bg-teal-950/60 border-teal-500 text-teal-300 font-bold ring-1 ring-teal-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    <Sparkle className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">Standing Studio</div>
                    <div className="text-[9px] text-slate-400 font-normal truncate">Full portrait presenter</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Neural Voice & Tone Picker */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  3. Neural Voice & Cadence
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Nepali & English</span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {voices.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVoice(v.id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="slow">Slow (-15%)</option>
                  <option value="normal">Normal Pace (1.0x)</option>
                  <option value="fast">Fast (+15%)</option>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="-10%">Deep / Warm (-10%)</option>
                  <option value="0%">Natural / Studio (0%)</option>
                  <option value="+10%">Bright / Energetic (+10%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Script Editor, Live Visual Teleprompter & Video Player */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Script Editor Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bold Written Script & Teleprompter
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
              rows={4}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Type your presenter script in Nepali (Devanagari) or English. This text will be spoken and rendered on the broadcast lower-third bar..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition resize-y leading-relaxed font-sans"
            />

            {/* Likeness & Rights Consent Confirmation */}
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
                  I confirm that I hold commercial rights to broadcast this avatar and synthesized voiceover.
                </div>
              </label>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-900/40">
                <span>Signer: <strong className="text-slate-200">{signerFullName}</strong></span>
                <span className="text-emerald-400 font-mono">AUDIT_CERTIFIED_OK</span>
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
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition cursor-pointer ${
                  isGenerating || !script.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isFreeRenderEligible
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-500/25 hover:scale-[1.01]'
                    : 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/25 hover:scale-[1.01]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Rendering Real Studio Video (FFmpeg + Audio Sync)...</span>
                  </>
                ) : studioMode === 'dual_anchor' ? (
                  <>
                    <Film className="w-4 h-4 text-cyan-300" />
                    <span>Generate Real Dual-Anchor Video (Two Seated Presenters • 4K)</span>
                  </>
                ) : isFreeRenderEligible ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Free Avatar Video (Watermarked • 0 Credits)</span>
                  </>
                ) : isAdmin ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Master Video (Admin Bypass)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Broadcast Video (15 Credits)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Studio Output Stage & Video Player */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {generatedResult?.videoUrl ? 'Rendered Broadcast Master' : 'Live Studio Preview & Teleprompter'}
                </h2>
              </div>

              {generatedResult?.videoUrl && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendToTimeline}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Add to Timeline</span>
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
            <div
              className={`relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-video w-full'
              }`}
            >
              {isGenerating ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-500/50 flex items-center justify-center mx-auto animate-pulse">
                    <Sparkles className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-100">
                      Generating Neural Presenter Video
                    </div>
                    <div className="text-xs text-teal-400 animate-pulse">
                      Synthesizing audio voiceover, studio backdrop & script subtitles...
                    </div>
                  </div>
                </div>
              ) : generatedResult?.videoUrl ? (
                <div className="relative w-full h-full group bg-black">
                  <video
                    ref={videoRef}
                    src={generatedResult.videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setVideoDuration(videoRef.current?.duration || 0)}
                  />

                  {/* Player Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-3 pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
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
                /* Real-time Staging & Teleprompter Visual Preview */
                <div className="relative w-full h-full overflow-hidden flex items-end justify-center bg-slate-950">
                  {/* Studio Background Layer */}
                  <img
                    src={selectedBackground.previewUrl}
                    alt={selectedBackground.name}
                    className="absolute inset-0 w-full h-full object-cover filter blur-[0.5px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent pointer-events-none" />

                  {/* Watermark Preview for Free Tier */}
                  {isFreeRenderEligible && (
                    <div className="absolute top-4 right-4 z-30 bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 rounded px-2 py-1 flex items-center gap-1.5 shadow-md">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-white tracking-wider">NepalAI Studio</span>
                    </div>
                  )}

                  {/* Studio Environment Composition */}
                  {studioMode === 'dual_anchor' ? (
                    <div className="relative w-full h-full overflow-hidden flex flex-col justify-between bg-slate-950">
                      {/* Real Video Broadcast Layer of Two Seated Anchors */}
                      <video
                        ref={previewVideoRef}
                        key={
                          customSoraVideoUrl
                            ? customSoraVideoUrl
                            : realVideoPreset === 'primetime'
                            ? '/samples/dual_anchor_primetime_16s.mp4'
                            : '/samples/dual_anchor_studio_16s.mp4'
                        }
                        src={
                          customSoraVideoUrl
                            ? customSoraVideoUrl
                            : realVideoPreset === 'primetime'
                            ? '/samples/dual_anchor_primetime_16s.mp4'
                            : '/samples/dual_anchor_studio_16s.mp4'
                        }
                        autoPlay
                        loop
                        playsInline
                        muted={previewMuted}
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Professional Studio Broadcast Vignette & Lighting Grading */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

                      {/* Live Broadcast Header Badge & Controls Bar */}
                      <div className="relative z-20 flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/90 text-white font-bold text-[10px] tracking-wider uppercase shadow-md animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            LIVE ON AIR
                          </div>
                          <div className="px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Real Seated Presenters (4K Motion)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Play/Pause Video Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!previewVideoRef.current) return;
                              if (previewPlaying) {
                                previewVideoRef.current.pause();
                                setPreviewPlaying(false);
                              } else {
                                previewVideoRef.current.play();
                                setPreviewPlaying(true);
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700 hover:border-slate-500 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition shadow"
                          >
                            {previewPlaying ? (
                              <>
                                <Pause className="w-3 h-3 text-amber-400" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 text-emerald-400" />
                                <span>Play</span>
                              </>
                            )}
                          </button>

                          {/* Audio Mute/Unmute */}
                          <button
                            type="button"
                            onClick={() => {
                              if (previewVideoRef.current) {
                                previewVideoRef.current.muted = !previewMuted;
                              }
                              setPreviewMuted(!previewMuted);
                            }}
                            className="p-1.5 rounded-md bg-slate-900/85 backdrop-blur-md border border-slate-700 hover:border-slate-500 text-white text-[11px] cursor-pointer transition shadow"
                            title={previewMuted ? 'Unmute studio preview' : 'Mute studio preview'}
                          >
                            {previewMuted ? (
                              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Anchor Speaker Tally Badges Over Desk */}
                      <div className="relative z-20 flex justify-between px-4 sm:px-8 mb-2 pointer-events-none">
                        <div className="px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 flex items-center gap-2 shadow-xl">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[11px] font-bold text-white tracking-wide">
                            {selectedAvatar?.name || 'Aarav Sharma'} (Lead Anchor)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold">
                            MIC 1 ON
                          </span>
                        </div>

                        <div className="px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-pink-500/50 flex items-center gap-2 shadow-xl">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[11px] font-bold text-white tracking-wide">
                            {selectedSecondaryAvatar?.name || 'Hemkala Thapa'} (Co-Host)
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 font-mono font-bold">
                            MIC 2 ON
                          </span>
                        </div>
                      </div>

                      {/* Broadcast Lower-Third Banner with Bold Written Script */}
                      <div className="relative z-30 w-full p-3 sm:p-4">
                        <div className="rounded-xl bg-slate-950/92 backdrop-blur-md border border-slate-800 shadow-2xl overflow-hidden">
                          {/* Top Accent Stripe */}
                          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-cyan-400" />

                          <div className="p-3 space-y-1.5">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[9px] tracking-wider uppercase shadow-sm">
                                  BREAKING NEWS
                                </span>
                                <span className="text-cyan-400 font-bold text-xs">
                                  NEPAL AI NEWS • प्रत्यक्ष समाचार प्रसारण
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} NPT
                              </span>
                            </div>

                            {/* Script Text Teleprompter Display */}
                            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed line-clamp-2">
                              {script || 'सागर: नमस्कार दर्शकवृन्द! नेपाल एआई स्टुडियोको प्रत्यक्ष समाचार बुलेटिनमा स्वागत छ।'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 w-full h-full flex items-end justify-center">
                      {/* Solo Executive Chair Behind */}
                      <div className="absolute bottom-6 w-[45%] max-w-[280px] h-[85%] flex items-end justify-center">
                        <div className="absolute top-[10%] w-[78%] h-[56%] rounded-t-3xl bg-gradient-to-b from-slate-800 via-slate-900 to-black border-t-2 border-x-2 border-slate-700/60 shadow-2xl -z-10 flex flex-col items-center">
                          <div className="w-16 h-3 mt-1 rounded-full bg-slate-700/40" />
                        </div>
                        <img
                          src={selectedAvatar?.imageUrl}
                          alt={selectedAvatar?.name || 'Presenter'}
                          className="max-h-full object-contain drop-shadow-2xl z-10 filter contrast-[1.02]"
                        />
                      </div>

                      {/* Solo Broadcast Desk in front */}
                      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
                        <svg viewBox="0 0 1000 200" className="w-full h-auto drop-shadow-[0_-8px_16px_rgba(0,0,0,0.6)]" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="pvSoloDeskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0f172a" />
                              <stop offset="50%" stopColor="#1e293b" />
                              <stop offset="100%" stopColor="#090d16" />
                            </linearGradient>
                            <linearGradient id="pvSoloDeskRim" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="50%" stopColor="#38bdf8" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                          <path d="M 0 130 Q 500 65 1000 130 L 1000 200 L 0 200 Z" fill="url(#pvSoloDeskGrad)" />
                          <path d="M 0 130 Q 500 65 1000 130" stroke="url(#pvSoloDeskRim)" strokeWidth="4" fill="none" />
                          {/* Center Mic */}
                          <path d="M 500 110 L 500 65" stroke="#475569" strokeWidth="4" strokeLinecap="round" fill="none" />
                          <rect x="492" y="45" width="16" height="22" rx="3" fill="#1e293b" stroke="#06b6d4" strokeWidth="1" />
                          <circle cx="500" cy="56" r="2.5" fill="#ef4444" />
                        </svg>
                      </div>

                      {/* Broadcast Lower-Third Banner with Bold Written Script for Solo */}
                      <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 mb-0.5">
                          <span>प्रस्तोता: {selectedAvatar?.name || 'Aarav Sharma'}</span>
                          <span className="text-[9px] text-amber-400 font-mono">LIVE STUDIO</span>
                        </div>
                        <div className="text-xs text-white font-semibold line-clamp-2 leading-relaxed font-sans">
                          {script || 'Type your script above to see the live teleprompter preview...'}
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Modal: Create Custom Presenter Avatar (Upload Picture or AI Prompt) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Create Custom Presenter Avatar</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setCreationMode('upload')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  creationMode === 'upload'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Picture</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode('ai_prompt')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  creationMode === 'ai_prompt'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Prompt Portrait</span>
              </button>
            </div>

            {creationMode === 'upload' ? (
              /* Mode 1: Upload Portrait Picture */
              <form onSubmit={handleSaveUploadedAvatar} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Upload Portrait Picture (PNG/JPG)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer bg-slate-950 transition flex flex-col items-center justify-center gap-2"
                  >
                    {uploadedImageDataUrl ? (
                      <div className="space-y-2">
                        <img
                          src={uploadedImageDataUrl}
                          alt="Uploaded Preview"
                          className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-teal-500 shadow-md"
                        />
                        <div className="text-[11px] text-teal-300 font-semibold">
                          Click to choose a different photo
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <div className="text-slate-200 font-medium">Click to select portrait photo</div>
                        <div className="text-[10px] text-slate-500">Supports PNG, JPG, WebP up to 10MB</div>
                      </>
                    )}
                  </div>
                </div>

                {/* 100% Exact Likeness Guarantee Banner */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-emerald-300">100% Same-to-Same Likeness Guarantee</div>
                    <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                      Your uploaded portrait is preserved with 100% exact facial fidelity, skin tone, hair, and clothing, automatically seated in an executive leather chair behind the broadcast newsroom desk with audio lip-sync.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Presenter Name</label>
                    <input
                      type="text"
                      required
                      value={newAvatarName}
                      onChange={(e) => setNewAvatarName(e.target.value)}
                      placeholder="e.g. Dr. Anjali Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Gender Demeanor</label>
                    <select
                      value={newAvatarGender}
                      onChange={(e) => setNewAvatarGender(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-Binary</option>
                    </select>
                  </div>
                </div>

                {/* Legal Confirmation within Modal */}
                <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/40 space-y-2">
                  <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wide">
                    Likeness Rights & Identity Consent
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Signer Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={newAvatarSignerName}
                      onChange={(e) => setNewAvatarSignerName(e.target.value)}
                      placeholder="e.g. Full Legal Name"
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
                      I declare that I hold full commercial likeness and voice broadcasting rights for this portrait persona.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAvatar || !uploadedImageDataUrl || !newAvatarName.trim()}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCreatingAvatar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Presenter</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: AI Prompt Avatar Generation */
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Describe Your AI Presenter
                  </label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Nepali professional female news anchor in dark blue blazer, studio lighting, photorealistic 8k portrait..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setAiPrompt('Nepali news anchor in professional blazer, broadcast studio lighting, cinematic 8k')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                    >
                      News Anchor
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPrompt('Executive tech startup founder in modern minimalist office, confident warm smile')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                    >
                      Tech Founder
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPrompt('Himalayan cultural ambassador in traditional Nepali attire, Kathmandu temple background')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                    >
                      Cultural Host
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Avatar Name</label>
                    <input
                      type="text"
                      value={newAvatarName}
                      onChange={(e) => setNewAvatarName(e.target.value)}
                      placeholder="e.g. AI News Host"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Gender Tone</label>
                    <select
                      value={newAvatarGender}
                      onChange={(e) => setNewAvatarGender(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateAiAvatar}
                    disabled={isGeneratingAiAvatar || !aiPrompt.trim()}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isGeneratingAiAvatar ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating AI Portrait...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate & Save Presenter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Azure Sora-2 Studio Generator Modal */}
      {showSoraStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Azure Sora-2 Custom Studio Generator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Real 4K Video
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate brand new video of two people sitting in a studio with custom decor and attire.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSoraStudioModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Studio Scene Prompt (OpenAI Sora-2 Engine)
              </label>
              <textarea
                value={soraStudioPrompt}
                onChange={(e) => setSoraStudioPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the studio setting, the two presenters, their seating position, attire, and lighting..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
              />

              {/* Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-semibold self-center mr-1">Quick Prompts:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSoraStudioPrompt(
                      'Two professional news anchors, a male anchor and female anchor in modern formal attire, seated side-by-side at a curved broadcast desk in a national television newsroom studio, presenting evening news bulletin together. Studio monitors, professional lighting, photorealistic 4k.'
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                >
                  📺 National Newsroom
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSoraStudioPrompt(
                      'Kathmandu Primetime Newsroom: Two seated anchors in traditional Nepali formal blazer and Dhaka topi, presenting live evening bulletin together at a hi-tech curved news desk with Himalayan backdrop monitors. Realistic broadcast studio lighting, cinematic 4k.'
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                >
                  🇳🇵 Nepali Cultural Desk
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSoraStudioPrompt(
                      'Modern Silicon Valley Tech Newsroom: Two hosts seated side-by-side at a sleek minimalist glass desk, discussing artificial intelligence innovations with holographic charts and soft cinematic cyan studio rim lighting.'
                    )
                  }
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                >
                  ⚡ High-Tech Modern
                </button>
              </div>
            </div>

            {/* Generation Progress */}
            {isGeneratingSoraStudio && (
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-semibold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Azure Sora-2 Neural Synthesis in progress...
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{soraStudioProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${soraStudioProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Sora-2 takes approximately 30–60 seconds to render high-resolution 1280x720 24fps motion video.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSoraStudioModal(false)}
                disabled={isGeneratingSoraStudio}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateSoraStudioVideo}
                disabled={isGeneratingSoraStudio || !soraStudioPrompt.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingSoraStudio ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Sora-2 Video...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Studio Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
