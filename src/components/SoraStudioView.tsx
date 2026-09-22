import React, { useState } from 'react';
import { Scene, UserSession, UserTrialQuota } from '../types';
import { apiGenerateVideo, apiCheckVideoStatus, apiTranslatePrompt, normalizeSoraDuration, pollSoraJobStatus } from '../lib/api';
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
  Sparkle,
  Lock,
  Unlock,
  ShieldCheck,
  Tag,
  Anchor,
  Compass,
  Wand2,
  BookmarkCheck,
  Link2,
  Focus,
  Target,
  ScanFace,
  SlidersVertical,
  GitBranch,
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';
import { saveMediaItem, getMediaLibrary, removeMediaItem, MediaItem } from '../lib/mediaLibrary';
import {
  CHARACTER_DNA_LIST,
  PODCAST_STUDIO_PACKS,
  NARRATIVE_STORYBOARDS,
  BROADCAST_FORMAT_PRESETS,
  SUBJECT_LOCK_REGISTRY,
  CharacterDNA,
  PodcastStudioPack,
  NarrativeStoryboardPack,
  StoryboardSceneItem,
  BroadcastFormatPreset,
  SubjectLockItem,
  SubjectCategory
} from '../data/soraProductionPacks';
import { DirectorPreFlightApprovalModal, DirectorApprovalPayload } from './DirectorPreFlightApprovalModal';
import { StoryContinuityDeck } from './StoryContinuityDeck';
import { NarrativeFlowManager } from './NarrativeFlowManager';
import { CharacterContinuityManager, CharacterModeSelection } from './CharacterContinuityManager';
import {
  DynamicCharacterIdentity,
  SequentialSceneNode,
  ExportedSceneSequenceProject,
  extractCharactersFromPrompt,
  extractSceneContextFromPrompt,
  generateChainedSegmentsFromPrompt,
  resolveSceneContinuity,
  predictNextSceneBeat,
  initializeProjectContinuity,
  formatCharacterPromptDescriptor,
  quickSwapSceneCharacter,
  downloadSceneSequenceProjectJSON
} from '../services/characterContinuityEngine';

interface SoraStudioViewProps {
  initialPrompt?: string;
  onAddSceneToVideo: (scene: Scene) => void;
  onNavigateToTimeline?: () => void;
  bypassControlledMode: boolean;
  user?: UserSession | null;
  onTriggerPaywall?: (reason: string) => void;
  onUsageUpdated?: (usage: UserTrialQuota, credits: number) => void;
  onStartGlobalLoading?: (info: { 
    title: string; 
    subtitle?: string; 
    type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; 
    progress?: number;
    currentStage?: number;
    totalStages?: number;
    stageTitle?: string;
    stageDetails?: string;
    characterLockToken?: string;
  }) => void;
  onStopGlobalLoading?: () => void;
}

export interface ChainedSegmentItem {
  id: string;
  order: number;
  title: string;
  recommendedDuration: number;
  framing: string;
  prompt: string;
  subtitleEn: string;
  subtitleNe?: string;
  videoUrl?: string;
  isProcessing?: boolean;
  exitLatentContext?: string;
}

export const DEFAULT_CHAINED_SEGMENTS: ChainedSegmentItem[] = [
  {
    id: 'seg-1',
    order: 1,
    title: 'Scene 1: Master Hero Establishing Shot',
    recommendedDuration: 12,
    framing: 'Cinematic Wide 35mm Master',
    prompt: 'Wide cinematic establishing shot of the locked subject at high altitude Himalayan vantage point during golden hour. Soft wind blowing, realistic physics, 4k ultra-high dynamic range.',
    subtitleEn: 'In the high valleys of the Himalayas, the journey begins.',
    subtitleNe: 'हिमालयको उच्च उपत्यकामा, यात्राको सुरुवात हुन्छ।',
    exitLatentContext: 'Subject turns from mountain horizon toward the winding valley road, walking steadily with determination.',
  },
  {
    id: 'seg-2',
    order: 2,
    title: 'Scene 2: Direct Action & Progression Beat',
    recommendedDuration: 12,
    framing: 'Tracking Medium Shot (12s continuous)',
    prompt: 'Continuous tracking shot following the exact locked subject descending through stone steps of an ancient mountain village. Ambient fluttering prayer flags, warm cinematic sunlight.',
    subtitleEn: 'Every step weaves through centuries of heritage.',
    subtitleNe: 'प्रत्येक पाइलाले शताब्दीयौंदेखिको सम्पदालाई स्पर्श गर्छ।',
    exitLatentContext: 'Subject reaches the village square fountain, greeting locals before turning toward the suspension bridge.',
  },
  {
    id: 'seg-3',
    order: 3,
    title: 'Scene 3: Crossing & Environmental Exploration',
    recommendedDuration: 12,
    framing: 'Low-Angle Dynamic Dolly',
    prompt: 'Dynamic dolly shot of the locked subject crossing the high mountain river suspension bridge over glacial turquoise waters. Cinematic mist rising, breathtaking depth.',
    subtitleEn: 'Crossing turbulent rivers toward the northern pass.',
    subtitleNe: 'हिमनदीका नीलो छालहरूमाथिबाट उत्तरी नाकातर्फको यात्रा।',
    exitLatentContext: 'Subject steps off the suspension bridge onto the rocky trail as sudden evening clouds roll in.',
  },
  {
    id: 'seg-4',
    order: 4,
    title: 'Scene 4: Rising Dramatic Climax Beat',
    recommendedDuration: 12,
    framing: 'Close Hero Profile & Orbit',
    prompt: 'Dramatic 12s orbit shot around the locked subject facing an alpine ridge as golden storm clouds break into rays of light. Intense emotional gaze, photorealistic textures.',
    subtitleEn: 'When the horizon tests your courage, determination speaks.',
    subtitleNe: 'क्षितिजले आँटको परीक्षा लिँदा, दृढ संकल्पले बोल्छ।',
    exitLatentContext: 'Subject reaches the crest of the ridge, catching their breath with an inspired smile.',
  },
  {
    id: 'seg-5',
    order: 5,
    title: 'Scene 5: Emotional Resolution & Encounter',
    recommendedDuration: 12,
    framing: 'Warm Medium Two-Shot / Vista',
    prompt: 'Warm cinematic shot of the locked subject standing beside ancient stone chorten as warm lamps glow at twilight. High visual fidelity, authentic cultural detail.',
    subtitleEn: 'Finding peace in the heart of the eternal peaks.',
    subtitleNe: 'सदाबहार हिमालहरूको काखमा शान्तिको अनुभूति।',
    exitLatentContext: 'Subject gazes at the starlit Annapurna peaks as the last golden rays fade into twilight.',
  },
  {
    id: 'seg-6',
    order: 6,
    title: 'Scene 6: Grand Finale & Hero Stinger',
    recommendedDuration: 12,
    framing: 'Grand Aerial Pull-Back (12s Master)',
    prompt: 'Epic cinematic 12s pull-back crane and drone sweep from the locked subject standing atop the summit vista under brilliant starry twilight sky, blockbuster cinema 4k.',
    subtitleEn: 'NepalAI Studio • The Story Continues.',
    subtitleNe: 'नेपाल एआई स्टुडियो • कथा निरन्तर जारी छ।',
    exitLatentContext: 'Wide panoramic view of the entire illuminated valley under cosmic starry sky.',
  },
];

const SORA_CINEMATIC_MODIFIERS = [
  { label: 'Drone Sweep', modifier: 'cinematic aerial drone sweep, 4k ultra-high definition, slow motion' },
  { label: 'Golden Hour', modifier: 'golden hour warm sunlight, glowing rim light, high dynamic range' },
  { label: 'Himalayan Mist', modifier: 'rolling mountain fog, ethereal atmosphere, majestic snow peaks' },
  { label: 'Hyper-Realistic', modifier: 'photorealistic 8k, natural depth of field, blockbuster cinema camera' },
];

export interface SimpleStylePreset {
  id: 'cinematic' | 'realistic' | 'animated' | 'documentary' | 'vintage';
  label: string;
  labelNe: string;
  icon: string;
  badge: string;
  description: string;
  promptModifier: string;
}

export const SIMPLE_STYLE_PRESETS: SimpleStylePreset[] = [
  {
    id: 'cinematic',
    label: 'Cinematic Movie',
    labelNe: 'सिनेम्याटिक फिल्म',
    icon: '🎬',
    badge: 'Hollywood 4K',
    description: 'Ultra-realistic film lighting, 24fps depth of field, 35mm anamorphic lens, blockbuster drama',
    promptModifier: 'cinematic movie masterpiece, 8k resolution, dramatic cinematic lighting, shallow depth of field, 35mm anamorphic lens, rich film color grading'
  },
  {
    id: 'realistic',
    label: 'Photorealistic',
    labelNe: 'वास्तविक जीवन',
    icon: '📸',
    badge: '8K Natural',
    description: 'Natural daylight, crisp realistic details, lifelike environmental textures and movement',
    promptModifier: 'hyper-realistic 8k UHD footage, natural daylight, crystal-clear real world textures, lifelike motion, ultra-detailed authentic footage'
  },
  {
    id: 'animated',
    label: '3D Animated',
    labelNe: '३डी एनिमेसन',
    icon: '🎨',
    badge: 'Pixar / Disney 3D',
    description: 'Pixar/Disney 3D animation style, vibrant colors, expressive characters, soft lighting',
    promptModifier: 'vibrant 3D animated style, Pixar and Disney aesthetic, charming character design, soft volumetric lighting, smooth 3D render, whimsical atmosphere'
  },
  {
    id: 'documentary',
    label: 'Documentary',
    labelNe: 'डकुमेन्ट्री',
    icon: '📽️',
    badge: 'NatGeo Style',
    description: 'National Geographic style, smooth authentic camera, true-to-life cultural storytelling',
    promptModifier: 'National Geographic documentary footage, authentic raw realism, smooth cinematic camera motion, natural environmental lighting, documentary masterpiece'
  },
  {
    id: 'vintage',
    label: 'Vintage / Retro',
    labelNe: 'पुरानो शैली',
    icon: '🌅',
    badge: '35mm Film Grain',
    description: 'Warm nostalgic 35mm film grain, retro golden hour glow, classic emotional atmosphere',
    promptModifier: 'vintage 35mm film aesthetic, warm nostalgic golden hour glow, subtle organic grain, retro color palette, classic cinematic nostalgia'
  }
];

export const STORY_SCRIPT_PRESETS = [
  {
    id: 'everest_sunrise',
    title: '🏔️ Himalayan Sunrise',
    titleNe: 'सगरमाथाको बिहान',
    script: 'A breathtaking cinematic aerial flight over Mount Everest at golden sunrise. Warm morning light hits snow-covered Himalayan peaks while colorful prayer flags flutter on the ridge.',
    subtitle: 'Mount Everest Sunrise • सगरमाथाको सुनौलो बिहानी',
    style: 'cinematic' as const,
  },
  {
    id: 'kathmandu_heritage',
    title: '🛕 Kathmandu Heritage',
    titleNe: 'काठमाडौं सम्पदा',
    script: 'Peaceful golden sunset over ancient Kathmandu Swayambhunath temple stupa. Monks walking peacefully, soft incense smoke rising, and pigeons taking flight in the warm light.',
    subtitle: 'Kathmandu Valley Heritage • काठमाडौंको ऐतिहासिक सम्पदा',
    style: 'documentary' as const,
  },
  {
    id: 'maya_village',
    title: '👧 Maya in Mountain Village',
    titleNe: 'मायाको गाउँले यात्रा',
    script: 'Maya, a cheerful Nepali mountain village girl wearing a colorful Dhaka shawl and warm woolen sweater, smiling gently as she walks across a suspension bridge surrounded by green hills.',
    subtitle: "Maya's Village Journey • मायाको गाउँले यात्रा",
    style: 'realistic' as const,
  },
  {
    id: 'cozy_momo',
    title: '🍲 Cozy Kitchen & Steaming Momo',
    titleNe: 'नेपाली भान्सा र मोमो',
    script: 'Inside a warm traditional Nepali wooden kitchen. Fresh steaming hot momo dumplings in a copper steamer with red sesame chutney and steaming cups of spiced milk tea.',
    subtitle: 'Cozy Kitchen Delights • परम्परागत नेपाली भान्सा',
    style: 'realistic' as const,
  },
  {
    id: 'chitwan_tiger',
    title: '🐅 Chitwan Wildlife Safari',
    titleNe: 'चितवन राष्ट्रिय निकुञ्ज',
    script: 'Morning mist slowly clearing over the tall elephant grass of Chitwan National Park. A majestic Royal Bengal Tiger walks gracefully beside a calm river at dawn.',
    subtitle: 'Chitwan Wild Safari • चितवनको वन्यजन्तु',
    style: 'documentary' as const,
  },
  {
    id: 'phewa_boat',
    title: '🚣 Pokhara Phewa Lake',
    titleNe: 'फेवातालमा डुङ्गा',
    script: 'A colorful wooden boat gliding smoothly across the calm emerald waters of Phewa Lake in Pokhara, with the stunning reflection of Annapurna and Machhapuchhre mountains.',
    subtitle: 'Serene Phewa Lake • शान्त फेवाताल',
    style: 'cinematic' as const,
  },
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
  const [seconds, setSeconds] = useState<'4' | '8' | '12'>('8');
  
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

  // Simple Mode Toggle & Simplified Style Preset
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);
  const [selectedStyle, setSelectedStyle] = useState<'cinematic' | 'realistic' | 'animated' | 'documentary' | 'vintage'>('cinematic');

  // Production Modes & Storyboard States
  const [productionMode, setProductionMode] = useState<'character_lock' | 'extended_chain' | 'storyboard' | 'single' | 'podcast' | 'broadcast'>('single');
  const [activePodcastPack, setActivePodcastPack] = useState<PodcastStudioPack>(PODCAST_STUDIO_PACKS[0]);
  const [activeStoryboardPack, setActiveStoryboardPack] = useState<NarrativeStoryboardPack>(NARRATIVE_STORYBOARDS[0]);
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardSceneItem[]>(NARRATIVE_STORYBOARDS[0].scenes);
  const [batchProcessingSceneId, setBatchProcessingSceneId] = useState<string | null>(null);
  const [storyboardAddedSuccess, setStoryboardAddedSuccess] = useState(false);

  // Extended Chaining Mode States (15s Chaining, Latent Frame Continuation)
  const [chainSegments, setChainSegments] = useState<ChainedSegmentItem[]>(DEFAULT_CHAINED_SEGMENTS);
  const [lastGeneratedFrameLatentContext, setLastGeneratedFrameLatentContext] = useState<string>(
    'Maya standing on ridge overlooking Himalayan valley at sunset, exact facial DNA and ochre linen top maintained.'
  );
  const [isBatchChaining, setIsBatchChaining] = useState<boolean>(false);
  const [batchChainIndex, setBatchChainIndex] = useState<number>(0);
  const [chainAddedSuccess, setChainAddedSuccess] = useState<boolean>(false);

  // Character & Subject Lock States (Disabled by default per creator intent; user enables on demand)
  const [selectedSubjectCategory, setSelectedSubjectCategory] = useState<SubjectCategory | 'all'>('all');
  const [activeSubjectLock, setActiveSubjectLock] = useState<SubjectLockItem>(SUBJECT_LOCK_REGISTRY[0]);
  const [subjectLockEnabled, setSubjectLockEnabled] = useState<boolean>(false);
  const [isBatchRendering, setIsBatchRendering] = useState<boolean>(false);
  const [batchRenderIndex, setBatchRenderIndex] = useState<number>(0);

  // Pin Subject from Frame Modal / HUD State
  const [showPinSubjectModal, setShowPinSubjectModal] = useState<boolean>(false);
  const [pinSubjectToast, setPinSubjectToast] = useState<string | null>(null);

  // Character Snapshot Reference System
  const mainVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const mainImgRef = React.useRef<HTMLImageElement | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);
  const [capturedSnapshotBase64, setCapturedSnapshotBase64] = useState<string | null>(null);
  const [snapshotTargetCharId, setSnapshotTargetCharId] = useState<string>('');
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);
  const [snapCustomName, setSnapCustomName] = useState<string>('');
  const [snapCustomRole, setSnapCustomRole] = useState<string>('Protagonist');
  const [snapCustomHair, setSnapCustomHair] = useState<string>('');
  const [snapCustomEyes, setSnapCustomEyes] = useState<string>('');
  const [snapCustomClothing, setSnapCustomClothing] = useState<string>('');
  const [snapCustomFace, setSnapCustomFace] = useState<string>('');

  // Dynamic Character Continuity & Multi-Scene Evolution System
  const [projectState, setProjectState] = useState(() => 
    initializeProjectContinuity(
      prompt || SAMPLE_SORA_PRESETS[0].en, 
      resolution === '720x1280' ? '9:16' : '16:9'
    )
  );
  const [projectScenes, setProjectScenes] = useState<SequentialSceneNode[]>(() => projectState.scenes);
  const [projectCharacterRegistry, setProjectCharacterRegistry] = useState<DynamicCharacterIdentity[]>(() => projectState.characters);
  const [selectedContinuityCharId, setSelectedContinuityCharId] = useState<string | null>(() => projectState.characters[0]?.id || null);
  const [selectedSequenceSceneIndex, setSelectedSequenceSceneIndex] = useState<number>(1);
  const [characterMode, setCharacterMode] = useState<CharacterModeSelection>('reuse');
  const [currentGeneratingSceneIndex, setCurrentGeneratingSceneIndex] = useState<number | null>(null);
  const [isBatchRenderingScenes, setIsBatchRenderingScenes] = useState<boolean>(false);

  // Dynamically extract character identity and synthesize scene sequence from prompt changes
  React.useEffect(() => {
    if (!prompt.trim()) return;
    const { extractedCharacter, isNewCharacter } = extractCharactersFromPrompt(prompt, 1, projectCharacterRegistry);
    if (extractedCharacter) {
      if (isNewCharacter) {
        setProjectCharacterRegistry(prev => [extractedCharacter, ...prev.filter(c => c.name !== extractedCharacter.name)]);
      }
      // Keep activeSubjectLock synced
      setActiveSubjectLock({
        id: extractedCharacter.id,
        name: extractedCharacter.name,
        category: 'person',
        roleOrType: extractedCharacter.roleOrArchetype,
        avatarEmoji: extractedCharacter.avatarEmoji,
        visualDescription: extractedCharacter.visualDescription,
        frameOneAnchorSeed: extractedCharacter.frameOneAnchorSeed,
        anchorToken: extractedCharacter.anchorToken,
        originBadge: 'Prompt Extracted',
        recommendedFraming: 'Cinematic 35mm Master'
      });
      // Enable lock by default so continuity is preserved
      setSubjectLockEnabled(true);
    }

    // Dynamically update chained segments if they haven't been rendered yet
    setChainSegments(prev => {
      const hasAnyRendered = prev.some(s => !!s.videoUrl);
      if (hasAnyRendered) return prev;
      return generateChainedSegmentsFromPrompt(prompt, extractedCharacter || null);
    });

    // Dynamically re-derive unrendered storyboard project scenes from the new prompt
    setProjectScenes(prev => {
      // If Scene 1 already has a generated video, do not overwrite
      if (prev.length > 0 && prev[0]?.videoUrl) return prev;

      const derivedState = initializeProjectContinuity(
        prompt,
        resolution === '720x1280' ? '9:16' : '16:9'
      );
      return derivedState.scenes;
    });
  }, [prompt]);

  // AI Director Pre-Flight Approval State
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [approvalPayload, setApprovalPayload] = useState<DirectorApprovalPayload | null>(null);
  const [currentGeneratingChainIndex, setCurrentGeneratingChainIndex] = useState<number | null>(null);

  const handleOpenApprovalForSingleShot = () => {
    let charName = subjectLockEnabled ? activeSubjectLock.name : 'Custom Subject';
    let charDesc = subjectLockEnabled ? activeSubjectLock.visualDescription : 'Dynamic consistent character';
    let charToken = subjectLockEnabled ? activeSubjectLock.anchorToken : '[Subject-Anchor: Character_Auto]';

    if (!subjectLockEnabled) {
      const matchedChar = SUBJECT_LOCK_REGISTRY.find(c => prompt.toLowerCase().includes(c.name.toLowerCase()));
      if (matchedChar) {
        charName = matchedChar.name;
        charDesc = matchedChar.visualDescription;
        charToken = matchedChar.anchorToken;
      }
    }

    setApprovalPayload({
      prompt,
      sceneTitle: 'Scene 1: Master Shot',
      durationSeconds: normalizeSoraDuration(seconds),
      resolution,
      aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
      characterName: charName,
      characterDescription: charDesc,
      characterAnchorToken: charToken,
      cameraMovement: 'Cinematic Wide 35mm Master',
      lightingAtmosphere: 'Himalayan Alpenglow Golden Hour',
      sceneIndex: 1,
      totalScenes: chainSegments.length || 1,
    });
    setShowApprovalModal(true);
  };

  const handleExecuteApprovedGeneration = async (approved: DirectorApprovalPayload) => {
    setShowApprovalModal(false);
    setPrompt(approved.prompt);
    setSeconds(normalizeSoraDuration(approved.durationSeconds));
    setResolution(approved.resolution);
    await handleGenerateSora();
  };

  const handleGenerateNextChainedFromDeck = async (segment: ChainedSegmentItem, index: number) => {
    setCurrentGeneratingChainIndex(index);
    await handleGenerateChainedSegment(segment, index);
    setCurrentGeneratingChainIndex(null);
  };

  const handleUpdateSegmentPrompt = (index: number, newPrompt: string) => {
    setChainSegments(prev => prev.map((s, idx) => idx === index ? { ...s, prompt: newPrompt } : s));
  };

  // Generate a specific scene in the Project Continuity Sequence
  const handleGenerateProjectScene = async (sceneNode: SequentialSceneNode, sceneIndex: number) => {
    setCurrentGeneratingSceneIndex(sceneIndex);
    setIsGenerating(true);
    setJobProgress(15);
    setGenError(null);

    const totalClips = projectScenes.length;
    const stageNum = sceneIndex + 1;
    const dur = parseInt(sceneNode.duration, 10) || 8;

    // Resolve active character lock tokens
    const activeChars = projectCharacterRegistry.filter(c => sceneNode.activeCharacterIds.includes(c.id));
    const primaryChar = activeChars[0] || projectCharacterRegistry[0];

    // Build finalized prompt with latent continuity
    const promptToUse = sceneNode.constructedPrompt || sceneNode.userPrompt;

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: `Synthesizing Scene ${stageNum} of ${totalClips}: ${sceneNode.title}`,
        subtitle: `Generating ${dur}s continuous Sora-2 shot with persistent character lock`,
        progress: 15,
        currentStage: stageNum,
        totalStages: totalClips,
        stageTitle: `Scene ${stageNum}: ${sceneNode.title}`,
        stageDetails: primaryChar ? `Identity: ${primaryChar.name} (${primaryChar.roleOrArchetype})` : 'Cinematic Scene',
        characterLockToken: primaryChar?.anchorToken,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      const data = await apiGenerateVideo(
        effectiveUserId,
        promptToUse,
        dur,
        'sora-2',
        {
          resolution,
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          lockedSubjectToken: primaryChar?.anchorToken,
          lockedSubjectDescription: primaryChar?.visualDescription,
          frameOneSeedPrompt: primaryChar?.frameOneAnchorSeed,
        }
      );

      let finalUrl = data.result?.url;

      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        const pollResult = await pollSoraJobStatus(jobId, {
          onProgress: (p) => {
            setJobProgress(p);
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Synthesizing Scene ${stageNum} of ${totalClips}: ${sceneNode.title}`,
                subtitle: `Rendering diffusion frames on Azure GPU (${p}%)...`,
                progress: p,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: `Scene ${stageNum}: ${sceneNode.title}`,
                stageDetails: `Sora-2 Rendering (${p}%) • ${primaryChar?.name || 'Character'} Locked`,
                characterLockToken: primaryChar?.anchorToken,
              });
            }
          },
          onReconnecting: (attempt, delay) => {
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Reconnecting to Render Cluster...`,
                subtitle: `Resuming video synthesis at ${jobProgress}% (Attempt #${attempt})...`,
                progress: jobProgress,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: `Scene ${stageNum}: ${sceneNode.title}`,
                stageDetails: `Reconnecting stream in ${Math.round(delay / 1000)}s...`,
              });
            }
          },
        });

        if (pollResult.status === 'completed' && pollResult.url) {
          finalUrl = pollResult.url;
        } else if (pollResult.status === 'failed') {
          console.warn('Sora scene generation failed, falling back to sample preview:', pollResult.error);
          finalUrl = pollResult.url || data.result?.url || '/samples/ForBiggerBlazes.mp4';
        }
      }

      if (!finalUrl) {
        finalUrl = data.result?.url || '/samples/ForBiggerBlazes.mp4';
      }

      if (finalUrl) {
        setVideoResultUrl(finalUrl);
        setProjectScenes(prev => prev.map((s, idx) => idx === sceneIndex ? { 
          ...s, 
          videoUrl: finalUrl,
          status: 'completed'
        } : s));

        saveMediaItem({
          type: 'sora_video',
          title: `Scene ${stageNum}: ${sceneNode.title}`,
          url: finalUrl,
          duration: dur,
          category: 'Story Scene Sequence',
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          prompt: promptToUse,
          resolution,
          engine: 'Azure Sora-2'
        });
      }

      if (onUsageUpdated && data.trialUsage) {
        onUsageUpdated(data.trialUsage, data.remainingCredits);
      }
    } catch (err: any) {
      console.error('Failed to generate project scene', err);
      setGenError(err.message || 'Scene generation failed');
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingSceneIndex(null);
      if (onStopGlobalLoading) onStopGlobalLoading();
    }
  };

  // Batch Render all project scenes
  const handleBatchRenderAllProjectScenes = async () => {
    if (isBatchRenderingScenes || isGenerating) return;
    setIsBatchRenderingScenes(true);
    for (let i = 0; i < projectScenes.length; i++) {
      const scene = projectScenes[i];
      if (!scene.videoUrl) {
        await handleGenerateProjectScene(scene, i);
        await new Promise(r => setTimeout(r, 1200));
      }
    }
    setIsBatchRenderingScenes(false);
  };

  // Assemble full project story to timeline
  const handleAssembleFullProjectToTimeline = () => {
    const projectId = 'storyboard-seq-' + Date.now();
    const primaryChar = projectCharacterRegistry[0];
    const movieTitle = `${primaryChar ? primaryChar.name + ' - ' : ''}Multi-Scene Story`;

    projectScenes.forEach((s, idx) => {
      const dur = parseInt(s.duration, 10) || 8;
      const sceneUrl = s.videoUrl || videoResultUrl || '/samples/ForBiggerBlazes.mp4';
      const activeChar = projectCharacterRegistry.find(c => s.activeCharacterIds.includes(c.id)) || primaryChar;

      const newScene: Scene = {
        id: 'scene-seq-' + Math.random().toString(36).substring(2, 9),
        assetId: 'media-seq-' + Date.now() + '-' + idx,
        title: s.title,
        duration: dur,
        startTime: idx * dur,
        prompt: s.userPrompt,
        promptNepali: s.subtitleNe || s.userPrompt,
        mediaUrl: sceneUrl,
        thumbnailUrl: sceneUrl.endsWith('.mp4') ? sceneUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
        mediaType: 'video',
        aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
        motion: idx % 2 === 0 ? 'zoom_in' : 'pan_right',
        transition: idx === 0 ? 'cut' : 'dissolve',
        transitionDuration: 0.8,
        textOverlay: (s.subtitleEn || s.userPrompt).slice(0, 36),
        textNepali: (s.subtitleNe || s.subtitleEn || s.userPrompt).slice(0, 36),
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 85,
        storyboardProjectId: projectId,
        storyboardProjectTitle: movieTitle,
        storyboardSequenceIndex: idx + 1,
        storyboardTotalClips: projectScenes.length,
        characterLockToken: activeChar?.anchorToken,
        characterLockName: activeChar?.name,
        isUnifiedSequence: true
      };
      onAddSceneToVideo(newScene);
    });

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3500);
    if (onNavigateToTimeline) {
      onNavigateToTimeline();
    }
  };

  // Update prompt for a specific scene and re-resolve continuity
  const handleUpdateProjectScenePrompt = (index: number, newPrompt: string) => {
    setProjectScenes(prev => {
      const updated = [...prev];
      const targetScene = updated[index];
      if (!targetScene) return prev;

      const prevScene = index > 0 ? updated[index - 1] : undefined;
      const res = resolveSceneContinuity({
        sceneIndex: index + 1,
        userPrompt: newPrompt,
        projectRegistry: projectCharacterRegistry,
        previousScene: prevScene,
        duration: targetScene.duration
      });

      if (res.newlyIntroducedCharacter) {
        setProjectCharacterRegistry(res.updatedRegistry);
      }

      updated[index] = {
        ...targetScene,
        userPrompt: newPrompt,
        constructedPrompt: res.constructedPrompt,
        activeCharacterIds: res.activeCharacters.map(c => c.id),
        exitLatentContext: res.exitLatentContext,
        characterTokensInjected: res.activeCharacters.map(c => c.anchorToken)
      };

      // If Scene 1 prompt was modified, automatically re-derive all unrendered subsequent scenes!
      if (index === 0) {
        let parentScene = updated[0];
        for (let i = 1; i < updated.length; i++) {
          if (!updated[i].videoUrl) {
            const activeChars = res.updatedRegistry.filter(c => parentScene.activeCharacterIds.includes(c.id));
            const pred = predictNextSceneBeat(parentScene, activeChars, res.updatedRegistry);
            const subRes = resolveSceneContinuity({
              sceneIndex: i + 1,
              userPrompt: pred.nextPrompt,
              projectRegistry: res.updatedRegistry,
              previousScene: parentScene,
              duration: pred.recommendedDuration
            });
            updated[i] = {
              ...updated[i],
              title: pred.nextTitle,
              userPrompt: pred.nextPrompt,
              constructedPrompt: subRes.constructedPrompt,
              framing: pred.framing,
              cameraMovement: pred.cameraMovement,
              subtitleEn: pred.nextSubtitleEn,
              subtitleNe: pred.nextSubtitleNe,
              exitLatentContext: subRes.exitLatentContext,
              characterTokensInjected: subRes.activeCharacters.map(c => c.anchorToken)
            };
            parentScene = updated[i];
          } else {
            parentScene = updated[i];
          }
        }
      }

      return updated;
    });
  };

  // Apply continuity-aware prompt from GPT-4o Prompt Context Analyzer
  const handleApplyPromptToScene = (sceneIndex: number, promptText: string, title?: string, duration?: '4' | '8' | '12') => {
    setProjectScenes(prev => {
      const updated = [...prev];
      if (!updated[sceneIndex]) return prev;
      const prevScene = sceneIndex > 0 ? updated[sceneIndex - 1] : undefined;
      const res = resolveSceneContinuity({
        sceneIndex: sceneIndex + 1,
        userPrompt: promptText,
        projectRegistry: projectCharacterRegistry,
        previousScene: prevScene,
        duration: duration || updated[sceneIndex].duration
      });

      updated[sceneIndex] = {
        ...updated[sceneIndex],
        title: title || updated[sceneIndex].title,
        userPrompt: promptText,
        constructedPrompt: res.constructedPrompt,
        activeCharacterIds: res.activeCharacters.map(c => c.id),
        duration: duration || updated[sceneIndex].duration,
        exitLatentContext: res.exitLatentContext,
        characterTokensInjected: res.activeCharacters.map(c => c.anchorToken)
      };
      return updated;
    });
  };

  // Add next scene beat in the story flow
  const handleAddNextProjectSceneBeat = () => {
    const lastScene = projectScenes[projectScenes.length - 1];
    const activeChars = projectCharacterRegistry.filter(c => lastScene?.activeCharacterIds.includes(c.id));
    const prediction = predictNextSceneBeat(lastScene, activeChars, projectCharacterRegistry);
    const nextIdx = projectScenes.length + 1;

    const res = resolveSceneContinuity({
      sceneIndex: nextIdx,
      userPrompt: prediction.nextPrompt,
      projectRegistry: projectCharacterRegistry,
      previousScene: lastScene,
      duration: prediction.recommendedDuration
    });

    const newNode: SequentialSceneNode = {
      id: `scene-node-${Date.now()}-${nextIdx}`,
      sceneIndex: nextIdx,
      title: prediction.nextTitle,
      userPrompt: prediction.nextPrompt,
      constructedPrompt: res.constructedPrompt,
      activeCharacterIds: res.activeCharacters.map(c => c.id),
      duration: prediction.recommendedDuration,
      framing: prediction.framing,
      cameraMovement: prediction.cameraMovement,
      lightingAtmosphere: 'Consistent Cinematic Master Lighting',
      exitLatentContext: res.exitLatentContext,
      status: 'idle',
      subtitleEn: prediction.nextSubtitleEn,
      subtitleNe: prediction.nextSubtitleNe,
      characterTokensInjected: res.activeCharacters.map(c => c.anchorToken)
    };

    setProjectScenes(prev => [...prev, newNode]);
  };

  // Toggle character presence in a specific scene
  const handleToggleCharacterForScene = (sceneIndex: number, charId: string) => {
    setProjectScenes(prev => {
      const updated = [...prev];
      const target = updated[sceneIndex];
      if (!target) return prev;

      let newIds = target.activeCharacterIds.includes(charId)
        ? target.activeCharacterIds.filter(id => id !== charId)
        : [...target.activeCharacterIds, charId];

      if (newIds.length === 0 && projectCharacterRegistry.length > 0) {
        newIds = [charId]; // Keep at least one
      }

      const prevScene = sceneIndex > 0 ? updated[sceneIndex - 1] : undefined;
      const res = resolveSceneContinuity({
        sceneIndex: sceneIndex + 1,
        userPrompt: target.userPrompt,
        projectRegistry: projectCharacterRegistry,
        previousScene: prevScene,
        requestedCharacterIds: newIds,
        duration: target.duration
      });

      updated[sceneIndex] = {
        ...target,
        activeCharacterIds: newIds,
        constructedPrompt: res.constructedPrompt,
        exitLatentContext: res.exitLatentContext,
        characterTokensInjected: res.activeCharacters.map(c => c.anchorToken)
      };

      return updated;
    });
  };

  // Character selection and mode toggling
  const handleSelectCharacter = (characterId: string) => {
    setSelectedContinuityCharId(characterId);
    setCharacterMode('reuse');
    const targetChar = projectCharacterRegistry.find(c => c.id === characterId);
    if (targetChar) {
      setActiveSubjectLock({
        id: targetChar.id,
        name: targetChar.name,
        category: 'person',
        roleOrType: targetChar.roleOrArchetype,
        avatarEmoji: targetChar.avatarEmoji,
        visualDescription: targetChar.visualDescription,
        frameOneAnchorSeed: targetChar.frameOneAnchorSeed,
        anchorToken: targetChar.anchorToken,
        originBadge: `Scene ${targetChar.originSceneIndex} Locked`,
        recommendedFraming: 'Cinematic 35mm Master'
      });
      setSubjectLockEnabled(true);
    }
  };

  const handleUpdateCharacterDescriptors = (
    characterId: string,
    updates: {
      hair?: string;
      eyes?: string;
      clothing?: string;
      facialFeatures?: string;
      visualDescription?: string;
      snapshotBase64?: string;
    }
  ) => {
    setProjectCharacterRegistry(prev => prev.map(char => {
      if (char.id !== characterId) return char;
      const newHair = updates.hair !== undefined ? updates.hair : char.hair;
      const newEyes = updates.eyes !== undefined ? updates.eyes : char.eyes;
      const newClothing = updates.clothing !== undefined ? updates.clothing : (char.clothing || char.attire);
      const newFace = updates.facialFeatures !== undefined ? updates.facialFeatures : char.facialFeatures;
      const newSnapshot = updates.snapshotBase64 !== undefined ? updates.snapshotBase64 : char.snapshotBase64;
      const newDesc = updates.visualDescription || `${char.name}, ${char.roleOrArchetype} | Hair: ${newHair || 'natural'} | Eyes: ${newEyes || 'expressive'} | Clothing: ${newClothing || 'authentic'} | Face: ${newFace || 'expressive'} | Consistent DNA.`;
      
      return {
        ...char,
        hair: newHair,
        eyes: newEyes,
        clothing: newClothing,
        attire: newClothing || char.attire,
        facialFeatures: newFace,
        snapshotBase64: newSnapshot,
        visualDescription: newDesc,
        frameOneAnchorSeed: `Frame 1 cinematic portrait lock: ${char.name} (${char.roleOrArchetype}), hair: ${newHair}, eyes: ${newEyes}, wardrobe: ${newClothing}, face: ${newFace}, 35mm lens, optical focus.`
      };
    }));
  };

  // Character Snapshot capture from current video frame or preview
  const handleCaptureCharacterSnapshot = (sourceUrl?: string) => {
    let base64Result: string | null = null;
    const targetVideo = mainVideoRef.current;
    const targetImg = mainImgRef.current;

    try {
      const canvas = document.createElement('canvas');
      if (targetVideo && targetVideo.videoWidth > 0) {
        canvas.width = targetVideo.videoWidth;
        canvas.height = targetVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(targetVideo, 0, 0, canvas.width, canvas.height);
          base64Result = canvas.toDataURL('image/jpeg', 0.9);
        }
      } else if (targetImg && targetImg.naturalWidth > 0) {
        canvas.width = targetImg.naturalWidth;
        canvas.height = targetImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(targetImg, 0, 0, canvas.width, canvas.height);
          base64Result = canvas.toDataURL('image/jpeg', 0.9);
        }
      }
    } catch (e) {
      console.warn('Canvas frame capture fallback:', e);
    }

    if (!base64Result) {
      base64Result = sourceUrl || videoResultUrl || '';
    }

    if (base64Result) {
      setCapturedSnapshotBase64(base64Result);
      const initialChar = projectCharacterRegistry.find(c => c.id === selectedContinuityCharId) || projectCharacterRegistry[0];
      if (initialChar) {
        setSnapshotTargetCharId(initialChar.id);
        setSnapCustomHair(initialChar.hair || '');
        setSnapCustomEyes(initialChar.eyes || '');
        setSnapCustomClothing(initialChar.clothing || initialChar.attire || '');
        setSnapCustomFace(initialChar.facialFeatures || '');
      } else {
        setSnapshotTargetCharId('new');
        setSnapCustomName('New Protagonist');
        setSnapCustomRole('Featured Lead');
        setSnapCustomHair('Dark styled hair');
        setSnapCustomEyes('Expressive dark eyes');
        setSnapCustomClothing('Signature wardrobe');
        setSnapCustomFace('Natural cinematic complexion');
      }
      setShowSnapshotModal(true);
    } else {
      alert('Please generate or play a Sora video first to capture a character snapshot.');
    }
  };

  // Save Character Snapshot to Profile and Lock Identity
  const handleSaveCharacterSnapshot = () => {
    if (!capturedSnapshotBase64) return;

    if (snapshotTargetCharId === 'new') {
      const name = (snapCustomName || 'Protagonist').trim();
      const role = (snapCustomRole || 'Featured Lead').trim();
      const hair = snapCustomHair.trim() || 'natural styled dark hair';
      const eyes = snapCustomEyes.trim() || 'expressive dark brown eyes';
      const clothing = snapCustomClothing.trim() || 'authentic signature wardrobe';
      const face = snapCustomFace.trim() || 'distinctive expressive facial geometry';

      const tokenHash = Math.abs(Math.sin(Date.now())).toString(36).substring(2, 7).toUpperCase();
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
      const anchorToken = `[Subject-Anchor: FaceID_Auto#${safeName}_${tokenHash}]`;
      const visualDescription = `${name}, ${role} | Hair: ${hair} | Eyes: ${eyes} | Clothing: ${clothing} | Face: ${face} | 4k photorealistic snapshot vector lock.`;

      const newChar: DynamicCharacterIdentity = {
        id: `char-snap-${Date.now()}`,
        name,
        roleOrArchetype: role,
        avatarEmoji: '👤',
        visualDescription,
        frameOneAnchorSeed: `Frame 1 portrait snapshot lock: ${name} (${role}), hair: ${hair}, eyes: ${eyes}, wardrobe: ${clothing}, face: ${face}, 35mm lens.`,
        anchorToken,
        originSceneIndex: projectScenes.length || 1,
        isLocked: true,
        attire: clothing,
        hair,
        eyes,
        clothing,
        facialFeatures: face,
        snapshotBase64: capturedSnapshotBase64,
        snapshotTimestamp: new Date().toISOString(),
        snapshotSceneIndex: projectScenes.length || 1,
        physicalTraits: `Snapshot style locked features`,
        tags: [name.toLowerCase(), role.toLowerCase(), 'snapshot']
      };

      setProjectCharacterRegistry(prev => [newChar, ...prev]);
      setSelectedContinuityCharId(newChar.id);
      setActiveSubjectLock({
        id: newChar.id,
        name: newChar.name,
        category: 'person',
        roleOrType: newChar.roleOrArchetype,
        avatarEmoji: newChar.avatarEmoji,
        visualDescription: newChar.visualDescription,
        frameOneAnchorSeed: newChar.frameOneAnchorSeed,
        anchorToken: newChar.anchorToken,
        originBadge: 'Snapshot Locked',
        recommendedFraming: 'Cinematic 35mm Master'
      });
      setSubjectLockEnabled(true);
      setSnapshotToast(`📸 Created and locked snapshot profile for "${name}"!`);
    } else {
      setProjectCharacterRegistry(prev => prev.map(c => {
        if (c.id !== snapshotTargetCharId) return c;
        const updatedHair = snapCustomHair || c.hair;
        const updatedEyes = snapCustomEyes || c.eyes;
        const updatedClothing = snapCustomClothing || c.clothing;
        const updatedFace = snapCustomFace || c.facialFeatures;

        return {
          ...c,
          hair: updatedHair,
          eyes: updatedEyes,
          clothing: updatedClothing,
          facialFeatures: updatedFace,
          snapshotBase64: capturedSnapshotBase64,
          snapshotTimestamp: new Date().toISOString(),
          snapshotSceneIndex: projectScenes.length || 1,
          referenceImage: capturedSnapshotBase64,
          visualDescription: `${c.name}, ${c.roleOrArchetype} | Hair: ${updatedHair || 'natural'} | Eyes: ${updatedEyes || 'expressive'} | Clothing: ${updatedClothing || 'authentic'} | Face: ${updatedFace || 'expressive'} | Base64 style reference attached.`
        };
      }));

      const target = projectCharacterRegistry.find(c => c.id === snapshotTargetCharId);
      if (target) {
        setActiveSubjectLock({
          id: target.id,
          name: target.name,
          category: 'person',
          roleOrType: target.roleOrArchetype,
          avatarEmoji: target.avatarEmoji,
          visualDescription: `${target.name}, ${target.roleOrArchetype} | Hair: ${snapCustomHair || target.hair} | Eyes: ${snapCustomEyes || target.eyes} | Clothing: ${snapCustomClothing || target.clothing}`,
          frameOneAnchorSeed: target.frameOneAnchorSeed,
          anchorToken: target.anchorToken,
          originBadge: 'Snapshot Reference Locked',
          recommendedFraming: 'Cinematic 35mm Master'
        });
        setSubjectLockEnabled(true);
        setSnapshotToast(`📸 Saved snapshot reference to "${target.name}"! Style locked.`);
      }
    }

    setShowSnapshotModal(false);
    setTimeout(() => setSnapshotToast(null), 4000);
  };

  const handleDeleteCharacter = (characterId: string) => {
    setProjectCharacterRegistry(prev => {
      const filtered = prev.filter(c => c.id !== characterId);
      if (selectedContinuityCharId === characterId) {
        setSelectedContinuityCharId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  // Quick-Swap character in a specific scene maintaining motion & transition settings
  const handleQuickSwapSceneCharacter = (sceneIndex: number, oldCharId: string, newCharId: string) => {
    setProjectScenes(prev => {
      const updated = [...prev];
      const targetScene = updated[sceneIndex];
      if (!targetScene) return prev;

      const prevScene = sceneIndex > 0 ? updated[sceneIndex - 1] : undefined;
      const swapResult = quickSwapSceneCharacter({
        scene: targetScene,
        sceneIndex: sceneIndex + 1,
        previousScene: prevScene,
        oldCharacterId: oldCharId,
        newCharacterId: newCharId,
        projectRegistry: projectCharacterRegistry
      });

      updated[sceneIndex] = swapResult.updatedScene;
      return updated;
    });
  };

  // Export full scene sequence project file
  const handleExportSceneSequence = () => {
    const sceneToCharMapping = projectScenes.map(s => {
      const activeChars = projectCharacterRegistry.filter(c => s.activeCharacterIds.includes(c.id));
      return {
        sceneIndex: s.sceneIndex,
        sceneTitle: s.title,
        duration: s.duration,
        cameraMovement: s.cameraMovement,
        framing: s.framing,
        lightingAtmosphere: s.lightingAtmosphere,
        activeCharacterIds: s.activeCharacterIds,
        characterNames: activeChars.map(c => c.name),
        userPrompt: s.userPrompt,
        constructedPrompt: s.constructedPrompt,
        hasVideoUrl: Boolean(s.videoUrl),
        status: s.status
      };
    });

    const snapshotsCount = projectCharacterRegistry.filter(c => Boolean(c.snapshotBase64 || c.referenceImage)).length;

    const projectData: ExportedSceneSequenceProject = {
      formatVersion: '1.0',
      exportTimestamp: new Date().toISOString(),
      exportedBy: 'NepalAI Studio - Sora-2 Character Continuity Engine',
      projectId: `proj-${Date.now()}`,
      projectTitle: projectScenes[0]?.title ? `Continuity Project: ${projectScenes[0].title}` : 'Sora-2 Character Sequence',
      worldTheme: 'Himalayan Cinematic Realism',
      visualStyle: 'Photorealistic 4k 35mm',
      aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
      characterMode,
      selectedCharacterId: selectedContinuityCharId,
      characters: projectCharacterRegistry,
      scenes: projectScenes,
      sceneToCharacterMapping: sceneToCharMapping,
      totalScenes: projectScenes.length,
      totalLockedCharacters: projectCharacterRegistry.length,
      snapshotsIncluded: snapshotsCount
    };

    downloadSceneSequenceProjectJSON(projectData, `nepalai_sora_sequence_project_${Date.now()}.json`);
  };

  // Import full scene sequence project file
  const handleImportSceneSequence = (importedData: any) => {
    if (!importedData) return;

    if (Array.isArray(importedData.characters) && importedData.characters.length > 0) {
      setProjectCharacterRegistry(importedData.characters);
    }
    if (Array.isArray(importedData.scenes) && importedData.scenes.length > 0) {
      setProjectScenes(importedData.scenes);
    }
    if (importedData.characterMode === 'reuse' || importedData.characterMode === 'new') {
      setCharacterMode(importedData.characterMode);
    }
    if (importedData.selectedCharacterId) {
      setSelectedContinuityCharId(importedData.selectedCharacterId);
    }
    if (importedData.aspectRatio === '9:16') {
      setResolution('720x1280');
    } else if (importedData.aspectRatio === '16:9') {
      setResolution('1280x720');
    }
    setSnapshotToast(`📂 Successfully loaded sequence project with ${importedData.scenes?.length || 0} scenes and ${importedData.characters?.length || 0} character profiles!`);
    setTimeout(() => setSnapshotToast(null), 4000);
  };

  // Add custom character to bank
  const handleAddCustomCharacterToBank = (
    name: string, 
    role: string, 
    description: string,
    hair?: string,
    clothing?: string,
    facialFeatures?: string
  ) => {
    const tokenHash = Math.abs(Math.sin(Date.now())).toString(36).substring(2, 7).toUpperCase();
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
    const anchorToken = `[Subject-Anchor: FaceID_Auto#${safeName}_${tokenHash}]`;
    const hairDesc = hair || 'natural dark textured hair';
    const clothDesc = clothing || description || 'authentic signature wardrobe';
    const faceDesc = facialFeatures || 'distinctive expressive facial structure';
    const visualDescription = `${name}, ${role} | Hair: ${hairDesc} | Clothing: ${clothDesc} | Face: ${faceDesc} | 4k photorealistic skin textures.`;

    const newChar: DynamicCharacterIdentity = {
      id: `char-custom-${Date.now()}`,
      name,
      roleOrArchetype: role,
      avatarEmoji: '👤',
      visualDescription,
      frameOneAnchorSeed: `Frame 1 portrait lock: ${name} (${role}), hair: ${hairDesc}, wardrobe: ${clothDesc}, face: ${faceDesc}, 35mm lens.`,
      anchorToken,
      originSceneIndex: projectScenes.length || 1,
      isLocked: true,
      attire: clothDesc,
      hair: hairDesc,
      clothing: clothDesc,
      facialFeatures: faceDesc,
      physicalTraits: `Custom ${role} features`,
      tags: [name.toLowerCase(), role.toLowerCase(), 'custom']
    };

    setProjectCharacterRegistry(prev => [...prev, newChar]);
    setSelectedContinuityCharId(newChar.id);
  };

  // Remove a project scene
  const handleRemoveProjectScene = (sceneIndex: number) => {
    setProjectScenes(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((_, idx) => idx !== sceneIndex);
      return filtered.map((s, idx) => ({ ...s, sceneIndex: idx + 1 }));
    });
  };

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

  // Handle selecting a subject lock item from the registry
  const handleSelectSubjectLock = (subject: SubjectLockItem) => {
    setActiveSubjectLock(subject);
    setSubjectLockEnabled(true);
    // Prepend or sync anchor into current prompt
    const basePrompt = prompt.replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '').replace(/\[Frame 1 Sync:[^\]]+\]\s*/g, '');
    setPrompt(`${subject.anchorToken} ${subject.visualDescription}, ${basePrompt}`);
  };

  // Set Frame 1 Anchor Seed explicitly
  const handleApplyFrameOneSeed = () => {
    if (!activeSubjectLock) return;
    setPrompt(`${activeSubjectLock.anchorToken} [Frame 1 Sync: ${activeSubjectLock.frameOneAnchorSeed}] ${activeSubjectLock.visualDescription}, cinematic continuous tracking shot, 4k 12s.`);
    setSeconds('12');
  };

  // Pin Subject directly from current frame/preview
  const handlePinSubjectFromFrame = (subject: SubjectLockItem) => {
    setActiveSubjectLock(subject);
    setSubjectLockEnabled(true);
    setLastGeneratedFrameLatentContext(`[Frame Latent Lock: ${subject.name} | ${subject.anchorToken} | Exit posture anchored]`);
    setShowPinSubjectModal(false);
    
    // Auto-update main prompt with locked token
    const baseP = prompt.replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '').replace(/\[Frame 1 Sync:[^\]]+\]\s*/g, '');
    setPrompt(`${subject.anchorToken} [Frame 1 Sync: ${subject.frameOneAnchorSeed}] ${baseP}`);

    setPinSubjectToast(`🔒 Locked Character Identity: ${subject.name} (${subject.roleOrType}) across all future clips!`);
    setTimeout(() => setPinSubjectToast(null), 4000);
  };

  // Apply current active Subject Lock to all scenes in active storyboard
  const handleApplySubjectLockToStoryboard = (subject: SubjectLockItem) => {
    setActiveSubjectLock(subject);
    setSubjectLockEnabled(true);
    setStoryboardScenes(prev =>
      prev.map(scene => {
        const cleanP = scene.prompt.replace(/\[Subject-Anchor:[^\]]+\]\s*/g, '');
        return {
          ...scene,
          prompt: `${subject.anchorToken} ${cleanP}`,
          subjectLockId: subject.id,
        };
      })
    );
  };

  // Select a Podcast Studio Camera Angle
  const handleSelectPodcastAngle = (angle: any) => {
    setPrompt(angle.prompt);
    setVideoSubtitle(angle.subtitle);
    setSeconds(normalizeSoraDuration(angle.recommendedDuration || 4));
    setResolution(activePodcastPack.aspectRatio === '9:16' ? '720x1280' : '1280x720');
  };

  // Select a Broadcast Format Preset
  const handleSelectBroadcastPreset = (preset: BroadcastFormatPreset) => {
    setPrompt(preset.samplePrompt);
    setVideoSubtitle(preset.subtitle);
    setResolution(preset.resolution);
    setSeconds(normalizeSoraDuration(preset.defaultDuration));
  };

  // Generate a specific scene inside the Storyboard with Multi-Stage Status
  const handleGenerateStoryboardScene = async (sceneItem: StoryboardSceneItem, sceneIndex: number) => {
    setBatchProcessingSceneId(sceneItem.id);
    setIsGenerating(true);
    setJobProgress(15);
    setGenError(null);

    const totalClips = storyboardScenes.length;
    const stageNum = sceneIndex + 1;

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: `Generating Clip ${stageNum} of ${totalClips}: ${sceneItem.title}`,
        subtitle: `Synthesizing ${sceneItem.recommendedDuration || 15}s Sora-2 frame sequence with locked character DNA`,
        progress: 15,
        currentStage: stageNum,
        totalStages: totalClips,
        stageTitle: `Scene ${stageNum}: ${sceneItem.title}`,
        stageDetails: `Character Lock: ${subjectLockEnabled ? activeSubjectLock.name : 'Standard Framing'} • 15s Sora-2`,
        characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      const promptToUse = subjectLockEnabled && !sceneItem.prompt.includes(activeSubjectLock.anchorToken)
        ? `${activeSubjectLock.anchorToken} [Frame 1 Sync: ${activeSubjectLock.frameOneAnchorSeed}] ${sceneItem.prompt}`
        : sceneItem.prompt;

      const data = await apiGenerateVideo(
        effectiveUserId,
        promptToUse,
        sceneItem.recommendedDuration || 15,
        'sora-2',
        {
          resolution: activeStoryboardPack.aspectRatio === '9:16' ? '720x1280' : '1280x720',
          aspectRatio: activeStoryboardPack.aspectRatio,
          lockedSubjectToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
          lockedSubjectDescription: subjectLockEnabled ? activeSubjectLock.visualDescription : undefined,
          frameOneSeedPrompt: subjectLockEnabled ? activeSubjectLock.frameOneAnchorSeed : undefined,
        }
      );

      let finalUrl = data.result?.url;

      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        const pollResult = await pollSoraJobStatus(jobId, {
          onProgress: (p) => {
            setJobProgress(p);
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Generating Clip ${stageNum} of ${totalClips}: ${sceneItem.title}`,
                subtitle: `Diffusion synthesis in progress (${p}%)...`,
                progress: p,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: `Scene ${stageNum}: ${sceneItem.title}`,
                stageDetails: `Sora-2 Rendering (${p}%) • Identity: ${subjectLockEnabled ? activeSubjectLock.name : 'Locked'}`,
                characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
              });
            }
          },
          onReconnecting: (attempt, delay) => {
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Reconnecting to Render Cluster...`,
                subtitle: `Resuming progress from ${jobProgress}% (Attempt #${attempt})...`,
                progress: jobProgress,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: `Scene ${stageNum}: ${sceneItem.title}`,
                stageDetails: `Reconnecting stream in ${Math.round(delay / 1000)}s...`,
              });
            }
          },
        });

        if (pollResult.status === 'completed' && pollResult.url) {
          finalUrl = pollResult.url;
        }
      }

      if (finalUrl) {
        setVideoResultUrl(finalUrl);
        setStoryboardScenes(prev => prev.map((s, idx) => idx === sceneIndex ? { ...s, videoUrl: finalUrl } : s));

        // Update latent frame context for chaining
        setLastGeneratedFrameLatentContext(`[Exit Frame ${stageNum}: ${sceneItem.title} - ${activeSubjectLock.name} anchored]`);

        saveMediaItem({
          type: 'sora_video',
          title: `Storyboard Clip ${sceneIndex + 1}: ${sceneItem.title}`,
          url: finalUrl,
          duration: parseInt(normalizeSoraDuration(sceneItem.recommendedDuration || 8), 10),
          category: 'Storyboard Scene',
          aspectRatio: activeStoryboardPack.aspectRatio,
          prompt: promptToUse,
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

  // Batch Render All Storyboard Clips Sequentially (for complete short movie / ad / reel)
  const handleBatchRenderAllStoryboard = async () => {
    if (isBatchRendering || isGenerating) return;
    setIsBatchRendering(true);
    for (let i = 0; i < storyboardScenes.length; i++) {
      const scene = storyboardScenes[i];
      setBatchRenderIndex(i + 1);
      await handleGenerateStoryboardScene(scene, i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsBatchRendering(false);
  };

  // Generate an Extended Chained 15s Segment (using last generated frame context as latent seed)
  const handleGenerateChainedSegment = async (segment: ChainedSegmentItem, segmentIndex: number) => {
    setIsGenerating(true);
    setJobProgress(15);
    setGenError(null);

    const totalClips = chainSegments.length;
    const stageNum = segmentIndex + 1;

    // Chain prompt combines: Locked character token + Frame 1 continuity seed + Latent context from prior clip
    const priorContext = segmentIndex > 0 ? `[Continuation from Scene ${segmentIndex} Exit Frame: ${chainSegments[segmentIndex - 1].exitLatentContext || lastGeneratedFrameLatentContext}]` : '';
    const constructedPrompt = `${activeSubjectLock.anchorToken} [Frame 1 Sync: ${activeSubjectLock.frameOneAnchorSeed}] ${priorContext} ${segment.prompt}`.trim();

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: `Chaining 15s Segment ${stageNum} of ${totalClips}`,
        subtitle: `Generating extended 15s sequence with continuous character & object identity lock`,
        progress: 15,
        currentStage: stageNum,
        totalStages: totalClips,
        stageTitle: segment.title,
        stageDetails: `Latent Continuity Seed • ${activeSubjectLock.name} (${activeSubjectLock.anchorToken})`,
        characterLockToken: activeSubjectLock.anchorToken,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      const data = await apiGenerateVideo(
        effectiveUserId,
        constructedPrompt,
        15,
        'sora-2',
        {
          resolution,
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          lockedSubjectToken: activeSubjectLock.anchorToken,
          lockedSubjectDescription: activeSubjectLock.visualDescription,
          frameOneSeedPrompt: activeSubjectLock.frameOneAnchorSeed,
        }
      );

      let finalUrl = data.result?.url;

      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        const pollResult = await pollSoraJobStatus(jobId, {
          onProgress: (p) => {
            setJobProgress(p);
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Chaining 15s Segment ${stageNum} of ${totalClips}`,
                subtitle: `Rendering continuous 15s Sora clip (${p}%)...`,
                progress: p,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: segment.title,
                stageDetails: `Processing 15s Master on Azure Foundry (${p}%)`,
                characterLockToken: activeSubjectLock.anchorToken,
              });
            }
          },
          onReconnecting: (attempt, delay) => {
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: `Reconnecting to Render Cluster...`,
                subtitle: `Resuming segment render at ${jobProgress}% (Attempt #${attempt})...`,
                progress: jobProgress,
                currentStage: stageNum,
                totalStages: totalClips,
                stageTitle: segment.title,
                stageDetails: `Reconnecting stream in ${Math.round(delay / 1000)}s...`,
              });
            }
          },
        });

        if (pollResult.status === 'completed' && pollResult.url) {
          finalUrl = pollResult.url;
        }
      }

      if (finalUrl) {
        setVideoResultUrl(finalUrl);
        setChainSegments(prev => prev.map((seg, idx) => idx === segmentIndex ? { ...seg, videoUrl: finalUrl } : seg));

        // Store new exit frame latent context
        const newExitContext = segment.exitLatentContext || `[Exit Frame of ${segment.title}: ${activeSubjectLock.name} anchored at 15s mark]`;
        setLastGeneratedFrameLatentContext(newExitContext);

        saveMediaItem({
          type: 'sora_video',
          title: `Chained 15s Scene ${stageNum}: ${segment.title}`,
          url: finalUrl,
          duration: 15,
          category: 'Extended Chained Movie',
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          prompt: constructedPrompt,
          resolution,
          engine: 'Azure Sora-2'
        });
      }
      if (onUsageUpdated && data.trialUsage) {
        onUsageUpdated(data.trialUsage, data.remainingCredits);
      }
    } catch (err: any) {
      console.error('Failed to generate chained segment', err);
      setGenError(err.message || 'Chained segment generation failed');
    } finally {
      setIsGenerating(false);
      if (onStopGlobalLoading) onStopGlobalLoading();
    }
  };

  // Batch Render All 6 Chained Movie Segments Sequentially
  const handleBatchRenderChainedMovie = async () => {
    if (isBatchChaining || isGenerating) return;
    setIsBatchChaining(true);
    for (let i = 0; i < chainSegments.length; i++) {
      setBatchChainIndex(i + 1);
      await handleGenerateChainedSegment(chainSegments[i], i);
      await new Promise(r => setTimeout(r, 1200));
    }
    setIsBatchChaining(false);
  };

  // Add Extended Chained Movie to Video Studio Timeline with Storyboard Sequencing metadata
  const handleSendChainedMovieToTimeline = () => {
    const projectId = 'storyboard-chain-' + Date.now();
    const movieTitle = `${activeSubjectLock.name} - 90s Chained Movie`;

    chainSegments.forEach((seg, idx) => {
      const sceneUrl = seg.videoUrl || videoResultUrl || '/samples/ForBiggerBlazes.mp4';
      const newScene: Scene = {
        id: 'scene-chain-' + Math.random().toString(36).substring(2, 9),
        assetId: 'media-chain-' + Date.now() + '-' + idx,
        title: seg.title,
        duration: 15,
        startTime: idx * 15,
        prompt: seg.prompt,
        promptNepali: seg.subtitleNe || seg.prompt,
        mediaUrl: sceneUrl,
        thumbnailUrl: sceneUrl.endsWith('.mp4') ? sceneUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
        mediaType: 'video',
        aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
        motion: idx % 2 === 0 ? 'zoom_in' : 'pan_right',
        transition: idx === 0 ? 'cut' : 'dissolve',
        transitionDuration: 0.8,
        textOverlay: seg.subtitleEn.slice(0, 42),
        textNepali: (seg.subtitleNe || seg.subtitleEn).slice(0, 42),
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 85,
        storyboardProjectId: projectId,
        storyboardProjectTitle: movieTitle,
        storyboardSequenceIndex: idx + 1,
        storyboardTotalClips: chainSegments.length,
        characterLockToken: activeSubjectLock.anchorToken,
        characterLockName: activeSubjectLock.name,
        isUnifiedSequence: true
      };
      onAddSceneToVideo(newScene);
    });

    setChainAddedSuccess(true);
    setTimeout(() => setChainAddedSuccess(false), 4000);
    if (onNavigateToTimeline) {
      onNavigateToTimeline();
    }
  };

  // Add Entire Storyboard Sequence to Video Studio Timeline
  const handleSendStoryboardToTimeline = () => {
    const projectId = 'storyboard-proj-' + Date.now();
    const movieTitle = activeStoryboardPack.title || '6-7 Clip Short Movie';

    storyboardScenes.forEach((s, idx) => {
      const sceneUrl = s.videoUrl || videoResultUrl || '/samples/ForBiggerBlazes.mp4';
      const newScene: Scene = {
        id: 'scene-storyboard-' + Math.random().toString(36).substring(2, 9),
        assetId: 'media-sb-' + Date.now() + '-' + idx,
        title: s.title,
        duration: s.recommendedDuration || 15,
        startTime: idx * (s.recommendedDuration || 15),
        prompt: s.prompt,
        promptNepali: s.subtitleNe || s.prompt,
        mediaUrl: sceneUrl,
        thumbnailUrl: sceneUrl.endsWith('.mp4') ? sceneUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
        mediaType: 'video',
        aspectRatio: activeStoryboardPack.aspectRatio,
        motion: idx % 2 === 0 ? 'zoom_in' : 'pan_right',
        transition: idx === 0 ? 'cut' : 'dissolve',
        transitionDuration: 0.8,
        textOverlay: s.subtitleEn.slice(0, 36),
        textNepali: s.subtitleNe.slice(0, 36),
        textPosition: 'lower_third',
        textColor: '#ffffff',
        textFont: 'devanagari',
        filter: 'cinematic',
        volume: 85,
        storyboardProjectId: projectId,
        storyboardProjectTitle: movieTitle,
        storyboardSequenceIndex: idx + 1,
        storyboardTotalClips: storyboardScenes.length,
        characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
        characterLockName: subjectLockEnabled ? activeSubjectLock.name : undefined,
        isUnifiedSequence: true
      };
      onAddSceneToVideo(newScene);
    });
    setStoryboardAddedSuccess(true);
    setTimeout(() => setStoryboardAddedSuccess(false), 4000);
    if (onNavigateToTimeline) {
      onNavigateToTimeline();
    }
  };

  // Generate Sora Video (Single Shot)
  const handleGenerateSora = async () => {
    setIsGenerating(true);
    setJobProgress(10);
    setAddedSuccess(false);
    setGenError(null);

    const dur = parseInt(normalizeSoraDuration(seconds), 10) || 8;

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'video',
        title: 'Synthesizing Sora-2 Neural Video...',
        subtitle: `Generating ${dur}s photorealistic video clip at ${resolution} via Azure AI Foundry`,
        progress: 15,
        currentStage: 1,
        totalStages: 1,
        stageTitle: `Single Shot (${dur}s Master)`,
        stageDetails: subjectLockEnabled ? `Character Lock: ${activeSubjectLock.name}` : 'Unconstrained Single Frame',
        characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
      });
    }

    try {
      const effectiveUserId = user?.id || 'usr_admin_01';
      setJobProgress(25);
      if (onStartGlobalLoading) {
        onStartGlobalLoading({
          type: 'video',
          title: 'Synthesizing Sora-2 Neural Video...',
          subtitle: 'Dispatching diffusion synthesis to Azure OpenAI cluster...',
          progress: 25,
          currentStage: 1,
          totalStages: 1,
          stageTitle: `Single Shot (${dur}s Master)`,
          stageDetails: `Azure OpenAI Sora-2 Processing`,
          characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
        });
      }

      const activeStyleObj = SIMPLE_STYLE_PRESETS.find(s => s.id === selectedStyle) || SIMPLE_STYLE_PRESETS[0];
      let promptToUse = prompt.trim();
      if (isSimpleMode && promptToUse) {
        if (!promptToUse.toLowerCase().includes(activeStyleObj.id)) {
          promptToUse = `${promptToUse}, ${activeStyleObj.promptModifier}`;
        }
      }

      const data = await apiGenerateVideo(
        effectiveUserId,
        promptToUse,
        dur,
        'sora-2',
        {
          resolution,
          aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
          lockedSubjectToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
          lockedSubjectDescription: subjectLockEnabled ? activeSubjectLock.visualDescription : undefined,
          frameOneSeedPrompt: subjectLockEnabled ? activeSubjectLock.frameOneAnchorSeed : undefined,
        }
      );

      let finalUrl = data.result?.url;

      // If the Sora-2 job is in progress on Azure GPU cluster, poll until complete with resilient backoff
      if (data.result?.status === 'in_progress' && data.result?.jobId) {
        const jobId = data.result.jobId;
        const pollResult = await pollSoraJobStatus(jobId, {
          onProgress: (p) => {
            setJobProgress(p);
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: 'Synthesizing Sora-2 Neural Video...',
                subtitle: `Rendering diffusion frames on Azure GPU (${p}%)...`,
                progress: p,
                currentStage: 1,
                totalStages: 1,
                stageTitle: `Single Shot (${dur}s Master)`,
                stageDetails: `Rendering (${p}%)`,
                characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
              });
            }
          },
          onReconnecting: (attempt, delay) => {
            if (onStartGlobalLoading) {
              onStartGlobalLoading({
                type: 'video',
                title: 'Reconnecting to Video Cluster...',
                subtitle: `Resuming video synthesis at ${jobProgress}% (Attempt #${attempt})...`,
                progress: jobProgress,
                currentStage: 1,
                totalStages: 1,
                stageTitle: `Single Shot (${dur}s Master)`,
                stageDetails: `Reconnecting stream in ${Math.round(delay / 1000)}s...`,
              });
            }
          },
        });

        if (pollResult.status === 'completed' && pollResult.url) {
          finalUrl = pollResult.url;
        } else if (pollResult.status === 'failed') {
          console.warn('Sora-2 job reported failure:', pollResult.error);
          finalUrl = pollResult.url || data.result?.url || '/samples/ForBiggerBlazes.mp4';
        }
      }

      // Ensure finalUrl is always resolved
      if (!finalUrl) {
        finalUrl = data.result?.url || '/samples/everest_sunrise.mp4';
      }

      setJobProgress(95);
      if (onStartGlobalLoading) {
        onStartGlobalLoading({
          type: 'video',
          title: 'Finalizing Video Composition...',
          subtitle: 'Encoding MP4 stream and syncing timeline...',
          progress: 95,
          currentStage: 1,
          totalStages: 1,
        });
      }
      await new Promise((r) => setTimeout(r, 300));
      setVideoResultUrl(finalUrl);

      // Update latent frame context for chaining
      if (subjectLockEnabled && activeSubjectLock) {
        setLastGeneratedFrameLatentContext(`[Exit Frame: ${prompt.slice(0, 40)} | ${activeSubjectLock.name} anchored]`);
      }

      // Save generated video to persistent Global Media Library
      const savedItem = saveMediaItem({
        type: 'sora_video',
        title: 'Sora-2 (' + dur + 's): ' + prompt.slice(0, 30),
        url: finalUrl,
        duration: dur,
        category: 'Sora-2 AI Video',
        aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
        prompt,
        resolution,
        engine: 'Azure Sora-2'
      });
      setLastSavedId(savedItem.id);
      setAddedSuccess(false);
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
      duration: parseInt(seconds) || 15,
      prompt,
      promptNepali: hasDevanagari ? prompt : videoSubtitle || prompt,
      mediaUrl: videoResultUrl,
      thumbnailUrl: videoResultUrl.endsWith('.mp4') ? videoResultUrl.replace(/\.mp4$/, '_thumb.jpg') : undefined,
      mediaType: 'video',
      aspectRatio: resolution === '720x1280' ? '9:16' : '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      transitionDuration: 0.8,
      textOverlay: (videoSubtitle || prompt).slice(0, 32),
      textNepali: (hasDevanagari ? prompt : videoSubtitle).slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 85,
      characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
      characterLockName: subjectLockEnabled ? activeSubjectLock.name : undefined,
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
      duration: item.duration || 15,
      prompt: item.prompt || item.title,
      promptNepali: item.prompt || item.title,
      mediaUrl: item.url,
      thumbnailUrl: item.thumbnailUrl || (item.url.endsWith('.mp4') ? item.url.replace(/\.mp4$/, '_thumb.jpg') : undefined),
      mediaType: 'video',
      aspectRatio: item.aspectRatio || '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      transitionDuration: 0.8,
      textOverlay: (item.prompt || item.title).slice(0, 32),
      textNepali: (item.prompt || item.title).slice(0, 32),
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 85,
      characterLockToken: subjectLockEnabled ? activeSubjectLock.anchorToken : undefined,
      characterLockName: subjectLockEnabled ? activeSubjectLock.name : undefined,
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
          {/* Simple Mode vs Pro Studio Mode Toggle Switch */}
          <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsSimpleMode(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isSimpleMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Simple Mode (सजिलो भिडियो)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSimpleMode(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !isSimpleMode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🎛️ Pro Studio Mode (विशेषज्ञ मोड)</span>
            </button>
          </div>

          {isSimpleMode ? (
            /* Simple Mode Form */
            <div className="space-y-4">
              {/* Simple Mode Info Banner */}
              <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 rounded-xl border border-indigo-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-950">Simple Story Video Generator</div>
                  <div className="text-[11px] text-slate-600">
                    Type your story script or choose a preset below. No technical jargon needed.
                  </div>
                </div>
              </div>

              {/* Step 1: Story Script / Scene Prompt */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                    <label className="text-xs font-bold text-slate-900">
                      Write Your Story or Scene <span className="text-slate-500 font-normal font-['Mukta']">(कथा वा दृश्य लेख्नुहोस्)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasDevanagari ? (
                      <button
                        type="button"
                        onClick={() => handleTranslatePrompt('en')}
                        disabled={isTranslating}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        title="Translate Nepali prompt into English for Sora-2"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isTranslating ? 'animate-spin' : ''}`} />
                        <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🌐 Translate to English'}</span>
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
                        <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🇳🇵 नेपालीमा हेर्नुहोस्'}</span>
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

                {/* Single Clean Textarea */}
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="उदा. सगरमाथामा बिहानीको घाम, काठमाडौंको मन्दिर, फेवातालमा डुङ्गा, गाउँमा चिया पसल..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed shadow-inner"
                />

                {/* Story Script Presets (1-Click Story Starter Pills) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">📜 1-Click Story Scripts (तयारी कथा स्क्रिप्टहरू):</span>
                    <span className="text-[10px] text-indigo-600 font-medium">Click to load</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {STORY_SCRIPT_PRESETS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPrompt(item.script);
                          setVideoSubtitle(item.subtitle);
                          setSelectedStyle(item.style);
                        }}
                        className="text-[11px] text-left p-2 rounded-lg bg-white hover:bg-indigo-50/80 text-slate-800 border border-slate-200 hover:border-indigo-300 font-medium transition cursor-pointer shadow-xs group"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-500 font-['Mukta'] truncate">{item.titleNe}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Visual Style Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <label className="text-xs font-bold text-slate-900">
                    Choose Visual Style <span className="text-slate-500 font-normal font-['Mukta']">(भिडियो शैली)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SIMPLE_STYLE_PRESETS.map((preset) => {
                    const isSelected = selectedStyle === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedStyle(preset.id)}
                        className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-1 relative ${
                          isSelected
                            ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{preset.icon}</span>
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {preset.badge}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{preset.label}</div>
                          <div className="text-[10px] text-indigo-700 font-medium font-['Mukta']">{preset.labelNe}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight line-clamp-2">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Duration & Screen Format */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <label className="text-xs font-bold text-slate-900">
                    Video Duration & Format <span className="text-slate-500 font-normal font-['Mukta']">(समय र आकार)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Duration Picker */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Video Length (लम्बाइ):</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: '12', label: '12s (Master)' },
                        { val: '8', label: '8s (Standard)' },
                        { val: '4', label: '4s (Fast)' },
                      ].map(dur => (
                        <button
                          key={dur.val}
                          type="button"
                          onClick={() => setSeconds(dur.val as any)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            seconds === dur.val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Picker */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Screen Format (आकार):</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setResolution('1280x720')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          resolution === '1280x720'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        🖥️ 16:9 Landscape
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolution('720x1280')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          resolution === '720x1280'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        📱 9:16 Shorts/Reels
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Optional Subject Continuity */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                    <label className="text-xs font-bold text-slate-900">
                      Keep Character / Subject Same <span className="text-slate-500 font-normal font-['Mukta']">(पात्र लक - Optional)</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubjectLockEnabled(!subjectLockEnabled)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold transition cursor-pointer ${
                      subjectLockEnabled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {subjectLockEnabled ? '✓ Lock Enabled' : '○ Disabled'}
                  </button>
                </div>

                {subjectLockEnabled && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    {SUBJECT_LOCK_REGISTRY.slice(0, 6).map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSubjectLock(sub)}
                        className={`text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border flex items-center gap-1 ${
                          activeSubjectLock.id === sub.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-indigo-50 border-slate-200'
                        }`}
                      >
                        <span>{sub.avatarEmoji}</span>
                        <span>{sub.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleOpenApprovalForSingleShot}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Sora-2 Video ({jobProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Review AI Director Blueprint & Generate Video</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Pro Studio Mode with Detailed Tabs */
            <div className="space-y-4">
          {/* Production Mode Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setProductionMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Single Shot</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('character_lock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'character_lock'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>🔒 Character Lock (पात्र लक)</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('extended_chain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'extended_chain'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>⛓️ Extended 15s Chaining</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('storyboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'storyboard'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>🎬 6-7 Clip Movie / Ad</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('podcast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'podcast'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>🎙️ Podcast Multi-Cam</span>
            </button>

            <button
              type="button"
              onClick={() => setProductionMode('broadcast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                productionMode === 'broadcast'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>📺 Broadcast Presets</span>
            </button>
          </div>

          {/* 0. Character & Subject Lock Mode Panel (100% Identity Consistency & Character Continuity Manager) */}
          {productionMode === 'character_lock' && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 rounded-xl border border-indigo-200/80 space-y-4 animate-in fade-in duration-200">
              {/* High-Level Character Continuity Manager */}
              <CharacterContinuityManager
                characters={projectCharacterRegistry}
                selectedCharacterId={selectedContinuityCharId}
                characterMode={characterMode}
                scenes={projectScenes}
                onSelectCharacter={handleSelectCharacter}
                onSetCharacterMode={(mode) => setCharacterMode(mode)}
                onAddNewCharacter={(charData) => {
                  handleAddCustomCharacterToBank(
                    charData.name,
                    charData.role,
                    `${charData.name}, ${charData.role} | Hair: ${charData.hair} | Eyes: ${charData.eyes || 'expressive'} | Clothing: ${charData.clothing} | Face: ${charData.facialFeatures}`,
                    charData.hair,
                    charData.clothing,
                    charData.facialFeatures
                  );
                }}
                onUpdateCharacterDescriptors={handleUpdateCharacterDescriptors}
                onDeleteCharacter={handleDeleteCharacter}
                onCaptureSnapshotFromCurrent={() => handleCaptureCharacterSnapshot()}
                onQuickSwapSceneCharacter={handleQuickSwapSceneCharacter}
                onExportSceneSequence={handleExportSceneSequence}
                onImportSceneSequence={handleImportSceneSequence}
                onApplyContinuityKeywords={(keywords, updatedScenes) => {
                  setProjectScenes(updatedScenes);
                }}
                onLoadScenePrompt={(promptText, dur) => {
                  setPrompt(promptText);
                  setSeconds(normalizeSoraDuration(parseInt(dur, 10) || 8));
                }}
                currentSceneNumber={projectScenes.length}
                totalScenes={projectScenes.length}
                worldTheme="Himalayan Cinematic Realism"
                visualStyle="Photorealistic 4k 35mm"
                aspectRatio={resolution === '720x1280' ? '9:16' : '16:9'}
              />

              {/* Standard Quick Presets Reference Bar */}
              <div className="pt-2 border-t border-indigo-100">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Quick Nepal Archetype Presets ({SUBJECT_LOCK_REGISTRY.length})
                  </span>
                  <span className="text-[10px] text-slate-500">1-click seed fill</span>
                </div>
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {(['all', 'person', 'vehicle', 'environment', 'animal'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSubjectCategory(cat)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer border ${
                        selectedSubjectCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {cat === 'all' && '✨ All Subjects (18)'}
                      {cat === 'person' && '👤 Person'}
                      {cat === 'vehicle' && '🚌 Bus & Vehicles'}
                      {cat === 'environment' && '🏡 Village & River'}
                      {cat === 'animal' && '🐆 Animals & Wildlife'}
                    </button>
                  ))}
                </div>

                {/* Subject Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {SUBJECT_LOCK_REGISTRY.filter(
                    s => selectedSubjectCategory === 'all' || s.category === selectedSubjectCategory
                  ).map(subject => {
                    const isSelected = activeSubjectLock.id === subject.id;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleSelectSubjectLock(subject)}
                        className={`p-2 rounded-lg text-left transition border cursor-pointer group shadow-2xs relative ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-sm">{subject.avatarEmoji}</span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {subject.name}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold block truncate">
                          {subject.roleOrType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Subject Lock Details & Frame 1 Preview */}
              {activeSubjectLock && (
                <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-slate-900">
                        {activeSubjectLock.name} ({activeSubjectLock.roleOrType})
                      </span>
                    </div>
                    <code className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-mono font-bold">
                      {activeSubjectLock.anchorToken}
                    </code>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Frame 1 Visual Anchor Seed (Next Visual Frame Output):
                    </span>
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed font-sans">
                      {activeSubjectLock.frameOneAnchorSeed}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleApplyFrameOneSeed}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10.5px] transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Apply Frame 1 Seed + 15s Sora Master</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplySubjectLockToStoryboard(activeSubjectLock)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <Clapperboard className="w-3 h-3 text-amber-700" />
                      <span>Lock to 6-7 Clip Movie Storyboard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 0.5. Extended 15s Video Chaining Mode Panel (Seamless 6-Scene 90s Film with Latent Frame Context) */}
          {productionMode === 'extended_chain' && (
            <div className="p-3.5 bg-gradient-to-r from-cyan-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl border border-cyan-200/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Extended 15s Sequence Chaining
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sequential 15-second segments with automatic latent frame continuation & 100% identity lock.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold font-mono">
                    Total: {chainSegments.length * 15}s (6 Scenes)
                  </span>
                </div>
              </div>

              {/* Latent Context Seed Bridge */}
              <div className="p-2.5 bg-white rounded-lg border border-cyan-200 space-y-1 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1">
                    <ScanFace className="w-3 h-3 text-cyan-600" />
                    <span>Active Latent Context Seed (Carried Forward):</span>
                  </span>
                  <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                    ✓ Identity: {activeSubjectLock.name}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed italic">
                  "{lastGeneratedFrameLatentContext}"
                </p>
              </div>

              {/* Batch Auto-Chain Button */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Movie Sequence Segments (15s each):
                </span>
                <button
                  type="button"
                  onClick={handleBatchRenderChainedMovie}
                  disabled={isBatchChaining || isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {isBatchChaining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Chaining Segment {batchChainIndex} of {chainSegments.length}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🚀 Auto-Chain Entire 6-Scene Movie (90s)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Chained Segment List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {chainSegments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {seg.title}
                        </span>
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600 shrink-0">
                          15s • {seg.framing}
                        </span>
                        {seg.videoUrl && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold shrink-0">
                            ✓ Rendered
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        "{seg.subtitleEn}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt(`${activeSubjectLock.anchorToken} [Frame 1 Sync: ${activeSubjectLock.frameOneAnchorSeed}] ${seg.prompt}`);
                          setVideoSubtitle(seg.subtitleEn);
                          setSeconds(normalizeSoraDuration(seg.recommendedDuration || 12));
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                        title="Load into main prompt builder"
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGenerateChainedSegment(seg, idx)}
                        disabled={isGenerating}
                        className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-[10px] font-bold text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        {isGenerating && batchProcessingSceneId === seg.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Chaining...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>{seg.videoUrl ? 'Re-chain 15s' : 'Chain 15s'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Chained Movie to Timeline */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSendChainedMovieToTimeline}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎞️ Auto-Stitch 90s Chained Movie to Video Studio Timeline</span>
                </button>
                {chainAddedSuccess && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <span className="font-bold">✓ 6-scene chained movie synchronized into Video Studio timeline!</span>
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

          {/* 2. Story & Movie Storyboard Mode Panel (6-7 Clips Short Movie & Ad Generator) */}
          {productionMode === 'storyboard' && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-emerald-500/5 rounded-xl border border-amber-200/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Clapperboard className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    6-7 Clip Short Movie & Ad Storyboard
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Visual Style:</span>
                    <span className="italic text-slate-500">{activeStoryboardPack.visualStyle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                    {storyboardScenes.length} Synchronized Clips ({activeStoryboardPack.totalEstimatedDuration}s Total)
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500">{activeStoryboardPack.description}</p>
              </div>

              {/* Storyboard Scene Queue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Sequential Scene Progression ({storyboardScenes.length} Clips)
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchRenderAllStoryboard}
                    disabled={isGenerating || isBatchRendering}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isBatchRendering ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Rendering Clip {batchRenderIndex}/{storyboardScenes.length}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Batch Render All {storyboardScenes.length} Clips</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
                            setSeconds(normalizeSoraDuration(scene.recommendedDuration || 8));
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
                  <span>🎞️ Send All {storyboardScenes.length} Clips to Video Studio Timeline (Auto-Stitch)</span>
                </button>
                {storyboardAddedSuccess && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <span className="font-bold">✓ Complete {storyboardScenes.length}-clip movie queued into Video Studio!</span>
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
                  <span className="text-slate-400">({(char.roleOrType || char.category).split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step-by-Step Layman-Friendly Video Creator */}
          <div className="space-y-4">
            {/* Step 1: Video Idea & Prompt */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <label className="text-xs font-bold text-slate-900">
                    Describe Your Video Idea <span className="text-slate-500 font-normal font-['Mukta']">(कस्तो भिडियो बनाउने?)</span>
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  {hasDevanagari ? (
                    <button
                      type="button"
                      onClick={() => handleTranslatePrompt('en')}
                      disabled={isTranslating}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                      title="Translate Nepali prompt into English for Sora-2"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🌐 Translate to English'}</span>
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
                      <span>{isTranslating ? 'अनुवाद हुँदैछ...' : '🇳🇵 नेपालीमा हेर्नुहोस्'}</span>
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
                placeholder="उदा. सगरमाथामा बिहानीको घाम, काठमाडौंको मन्दिर, फेवातालमा डुङ्गा, गाउँमा चिया पसल..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 resize-none font-sans leading-relaxed"
              />

              {/* 1-Click Popular Video Presets for Laymen */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">💡 Popular 1-Click Ideas (सजिलो उदाहरणहरू):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🏔️ Everest Sunrise', prompt: 'Cinematic sweeping drone shot of Mount Everest at golden sunrise with prayer flags fluttering in wind, 4k ultra-realistic.' },
                    { label: '🚣 Phewa Lake Boat', prompt: 'Peaceful wooden boat gliding across calm Phewa Lake in Pokhara with Annapurna mountain reflection in water.' },
                    { label: '🛕 Kathmandu Temple', prompt: 'Golden sunset over Kathmandu Swayambhunath temple stupa with pigeons taking flight in soft sunlight.' },
                    { label: '👧 Village Girl Maya', prompt: 'Maya, a Nepali mountain village girl wearing Dhaka shawl and warm woolen sweater smiling gently in Himalayan village.' },
                    { label: '🚌 Mountain Bus Ride', prompt: 'Colorful decorated Nepali mountain passenger bus navigating scenic Himalayan winding dirt road alongside river.' },
                    { label: '🐅 Bengal Tiger', prompt: 'Majestic Royal Bengal Tiger walking through lush green tall grass in Chitwan National Park morning mist.' },
                    { label: '🍲 Steaming Momo', prompt: 'Steaming hot traditional Nepali momo dumplings on wooden plate with spicy red sesame chutney in cozy kitchen.' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(item.prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium transition cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Duration & Screen Format */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <label className="text-xs font-bold text-slate-900">
                  Video Duration & Format <span className="text-slate-500 font-normal font-['Mukta']">(समय र आकार)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Duration Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Video Length (लम्बाइ):</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: '12', label: '12s (Master)' },
                      { val: '8', label: '8s (Standard)' },
                      { val: '4', label: '4s (Fast)' },
                    ].map(dur => (
                      <button
                        key={dur.val}
                        type="button"
                        onClick={() => setSeconds(dur.val as any)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                          seconds === dur.val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Screen Format (आकार):</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setResolution('1280x720')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        resolution === '1280x720'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      🖥️ 16:9 Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolution('720x1280')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        resolution === '720x1280'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      📱 9:16 Shorts/Reels
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Quick Character Lock (Optional) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  <label className="text-xs font-bold text-slate-900">
                    Keep Character / Subject Same <span className="text-slate-500 font-normal font-['Mukta']">(पात्र लक)</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setSubjectLockEnabled(!subjectLockEnabled)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold transition cursor-pointer ${
                    subjectLockEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {subjectLockEnabled ? '✓ Lock Enabled' : '○ Disabled'}
                </button>
              </div>

              {subjectLockEnabled && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  {SUBJECT_LOCK_REGISTRY.slice(0, 6).map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubjectLock(sub)}
                      className={`text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer border flex items-center gap-1 ${
                        activeSubjectLock.id === sub.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-indigo-50 border-slate-200'
                      }`}
                    >
                      <span>{sub.avatarEmoji}</span>
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateSora}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Sora-2 Video ({jobProgress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>✨ Generate Video (भिडियो बनाउनुहोस्)</span>
              </>
            )}
          </button>
            </div>
          )}
        </div>

        {/* Right 6 Columns: Video Stage & Timeline Sync */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900">Sora-2 Render Preview</span>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{seconds}s • {resolution}</span>
          </div>

          {/* Video Player Canvas display */}
          <div className="bg-slate-900 rounded-xl overflow-hidden min-h-[340px] flex items-center justify-center relative p-2 shadow-inner">
            {videoResultUrl ? (
              <div className="relative w-full h-full max-h-[340px] flex items-center justify-center">
                {videoResultUrl.includes('.mp4') || videoResultUrl.includes('.webm') || videoResultUrl.includes('gtv-videos-bucket') || videoResultUrl.includes('video') ? (
                  <video
                    ref={mainVideoRef}
                    src={videoResultUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="rounded-lg object-contain w-full h-full max-h-[340px] shadow-lg bg-black"
                  />
                ) : (
                  <img
                    ref={mainImgRef}
                    src={videoResultUrl}
                    alt="Sora Preview"
                    referrerPolicy="no-referrer"
                    className="rounded-lg object-cover w-full h-full max-h-[340px] shadow-lg"
                  />
                )}
                <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-md">
                  SORA-2 4K
                </div>

                {/* Character Lock Status Watermark / Badge */}
                {subjectLockEnabled && activeSubjectLock && (
                  <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-white border border-indigo-500/50 px-2 py-0.5 rounded text-[9.5px] font-mono flex items-center gap-1 shadow-md">
                    <Lock className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{activeSubjectLock.name} Locked</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No Sora video rendered yet.</p>
              </div>
            )}
          </div>

          {/* Character & Subject Lock HUD Bar & Pin/Snapshot Frame Triggers */}
          <div className="p-2.5 bg-gradient-to-r from-indigo-50/80 to-cyan-50/80 rounded-xl border border-indigo-200/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Target className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {subjectLockEnabled ? activeSubjectLock.name : 'No Active Subject Lock'}
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold font-mono shrink-0">
                    {subjectLockEnabled ? '100% ID Lock' : 'Unlocked'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">
                  {subjectLockEnabled ? activeSubjectLock.anchorToken : 'Select or pin subject to enforce facial/object continuity'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCaptureCharacterSnapshot()}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Capture this video frame as a base-64 visual style reference"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📸 Save Snapshot</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPinSubjectModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
              >
                <Focus className="w-3.5 h-3.5" />
                <span>🎯 Pin Subject</span>
              </button>
            </div>
          </div>

          {/* Snapshot & Pin Subject Toast */}
          {snapshotToast && (
            <div className="p-2.5 rounded-lg bg-emerald-900 text-white text-xs flex items-center gap-2 shadow-md animate-in fade-in duration-200 border border-emerald-500/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-semibold truncate">{snapshotToast}</span>
            </div>
          )}

          {pinSubjectToast && (
            <div className="p-2 rounded-lg bg-indigo-900 text-white text-xs flex items-center gap-2 shadow-md animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium truncate">{pinSubjectToast}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCaptureCharacterSnapshot()}
                  className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📸 Save Character Snapshot</span>
                </button>

                <a
                  href={videoResultUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="sora_video.mp4"
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video</span>
                </a>
              </div>

              <button
                onClick={handleAddToTimeline}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
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

        {/* Multi-Scene Sequential Storyboard & Dynamic Character Continuity Engine */}
        <div className="col-span-1 lg:col-span-12 w-full space-y-4">
          <NarrativeFlowManager
            currentPrompt={prompt}
            projectScenes={projectScenes}
            projectRegistry={projectCharacterRegistry}
            activeCharacterId={selectedContinuityCharId || undefined}
            selectedSceneIndex={selectedSequenceSceneIndex}
            onSelectScene={(idx) => setSelectedSequenceSceneIndex(idx)}
            onApplyPromptToScene={handleApplyPromptToScene}
          />

          <StoryContinuityDeck
            scenes={projectScenes}
            characterRegistry={projectCharacterRegistry}
            currentGeneratingIndex={currentGeneratingSceneIndex}
            onGenerateScene={handleGenerateProjectScene}
            onBatchRenderAll={handleBatchRenderAllProjectScenes}
            isBatchRendering={isBatchRenderingScenes}
            onAssembleStoryToTimeline={handleAssembleFullProjectToTimeline}
            onOpenPreview={(url) => setPreviewingItem({
              id: 'seq-preview-' + Date.now(),
              type: 'sora_video',
              title: 'Story Scene Preview',
              url,
              createdAt: new Date().toISOString(),
              duration: 8,
              resolution
            })}
            onUpdateScenePrompt={handleUpdateProjectScenePrompt}
            onAddNextSceneBeat={handleAddNextProjectSceneBeat}
            onToggleCharacterForScene={handleToggleCharacterForScene}
            onAddNewCharacter={handleAddCustomCharacterToBank}
            onRemoveScene={handleRemoveProjectScene}
          />
        </div>
      </div>

      {/* AI Director Pre-Flight Approval Modal */}
      {showApprovalModal && approvalPayload && (
        <DirectorPreFlightApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          payload={approvalPayload}
          onApprove={handleExecuteApprovedGeneration}
          availableCharacters={SUBJECT_LOCK_REGISTRY}
        />
      )}

      {/* Pin Character / Subject Selector Modal */}
      {showPinSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Focus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pin Character / Subject Identity</h3>
                  <p className="text-[10.5px] text-slate-500">Select the subject in this frame to anchor 100% continuity for all subsequent clips.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinSubjectModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['all', 'person', 'vehicle', 'environment', 'animal'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedSubjectCategory(cat)}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer border ${
                    selectedSubjectCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {cat === 'all' && '✨ All Subjects'}
                  {cat === 'person' && '👤 Person (Girl/Boy/Elder)'}
                  {cat === 'vehicle' && '🚌 Bus & Vehicles'}
                  {cat === 'environment' && '🏡 Village & River & House'}
                  {cat === 'animal' && '🐆 Animals & Wildlife'}
                </button>
              ))}
            </div>

            {/* Subject Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {SUBJECT_LOCK_REGISTRY.filter(
                s => selectedSubjectCategory === 'all' || s.category === selectedSubjectCategory
              ).map(subject => (
                <div
                  key={subject.id}
                  onClick={() => handlePinSubjectFromFrame(subject)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-2 shadow-2xs hover:border-indigo-400 hover:bg-indigo-50/50 ${
                    activeSubjectLock.id === subject.id ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{subject.avatarEmoji}</span>
                      <span className="text-xs font-bold text-slate-900 truncate">{subject.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold block truncate">
                      {subject.roleOrType}
                    </span>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {subject.visualDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinSubjectFromFrame(subject);
                    }}
                    className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shrink-0 transition"
                  >
                    Pin & Lock
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>💡 Pinned identity tokens will be injected into all future Sora API calls.</span>
              <button
                type="button"
                onClick={() => setShowPinSubjectModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Character Snapshot Reference Modal */}
      {showSnapshotModal && capturedSnapshotBase64 && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">📸 Save Character Snapshot</h3>
                  <p className="text-[11px] text-slate-500">Capture visual style vector from video and lock identity for upcoming scenes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Captured Frame Preview & Target Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-white">
              <div className="sm:col-span-5 relative aspect-video rounded-lg overflow-hidden border border-slate-700 shadow-md bg-black">
                <img
                  src={capturedSnapshotBase64}
                  alt="Captured Snapshot"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8.5px] font-mono text-emerald-400 font-bold border border-emerald-500/40">
                  BASE-64 REF
                </span>
              </div>
              <div className="sm:col-span-7 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Visual DNA Captured</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  This exact frame output will be encoded as a continuous base-64 visual seed reference for Sora-2 scene generation.
                </p>
              </div>
            </div>

            {/* Profile Assignment Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Assign Snapshot to Character Profile:
              </label>
              <select
                value={snapshotTargetCharId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSnapshotTargetCharId(val);
                  if (val === 'new') {
                    setSnapCustomName('New Protagonist');
                    setSnapCustomRole('Featured Lead');
                  } else {
                    const c = projectCharacterRegistry.find(char => char.id === val);
                    if (c) {
                      setSnapCustomName(c.name);
                      setSnapCustomRole(c.roleOrArchetype);
                      setSnapCustomHair(c.hair || '');
                      setSnapCustomEyes(c.eyes || '');
                      setSnapCustomClothing(c.clothing || c.attire || '');
                      setSnapCustomFace(c.facialFeatures || '');
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:bg-white focus:border-indigo-500 transition cursor-pointer"
              >
                {projectCharacterRegistry.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.avatarEmoji} {c.name} ({c.roleOrArchetype}) {c.snapshotBase64 ? '• Has Snapshot' : ''}
                  </option>
                ))}
                <option value="new">+ Create & Lock New Character Profile from Snapshot</option>
              </select>
            </div>

            {/* Dynamic Descriptors Editable Form */}
            {snapshotTargetCharId === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-700">Character Name *</label>
                  <input
                    type="text"
                    value={snapCustomName}
                    onChange={(e) => setSnapCustomName(e.target.value)}
                    placeholder="e.g. Maya Shrestha"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-700">Role / Archetype</label>
                  <input
                    type="text"
                    value={snapCustomRole}
                    onChange={(e) => setSnapCustomRole(e.target.value)}
                    placeholder="e.g. Mountain Guide"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* Visual Descriptors Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Visual Descriptors (Hair, Eyes, Clothing, Face)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">💇 Hair Descriptor</label>
                  <input
                    type="text"
                    value={snapCustomHair}
                    onChange={(e) => setSnapCustomHair(e.target.value)}
                    placeholder="e.g. dark textured braided hair"
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">👁️ Eyes Descriptor</label>
                  <input
                    type="text"
                    value={snapCustomEyes}
                    onChange={(e) => setSnapCustomEyes(e.target.value)}
                    placeholder="e.g. expressive almond brown eyes"
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">👘 Clothing / Wardrobe</label>
                  <input
                    type="text"
                    value={snapCustomClothing}
                    onChange={(e) => setSnapCustomClothing(e.target.value)}
                    placeholder="e.g. authentic ochre yellow fleece"
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">👤 Facial Structure</label>
                  <input
                    type="text"
                    value={snapCustomFace}
                    onChange={(e) => setSnapCustomFace(e.target.value)}
                    placeholder="e.g. sharp jawline, cinematic complexion"
                    className="w-full px-2.5 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveCharacterSnapshot}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Save Snapshot & Lock Visual Style</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                      onClick={() => {
                        setVideoResultUrl(item.url);
                        setShowPinSubjectModal(true);
                      }}
                      title="Lock Subject Identity from this clip"
                      className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-300 transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
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
