import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Scene, 
  WorkflowStep, 
  CameraMotion, 
  TransitionType, 
  ColorFilter,
  StarterTemplate,
  AudioTrack,
  SceneWatermark,
  StudioWorkspace,
  VfxConfig,
  FrameOverlayType
} from '../types';
import { STARTER_TEMPLATES, INITIAL_AUDIO_TRACKS } from '../data';
import { SocialPublisherModal } from './SocialPublisherModal';
import { YouTubePublisherModal } from './YouTubePublisherModal';
import { RenderPresetModal, RENDER_PRESETS, RenderPreset } from './RenderPresetModal';
import { SubtitleEditorModal, SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { BrandOverlayModal, BrandOverlayConfig, WATERMARK_PRESETS } from './BrandOverlayModal';
import { AutoColorMatchModal } from './AutoColorMatchModal';
import { FrameInspectorModal } from './FrameInspectorModal';
import { SceneLibraryModal } from './SceneLibraryModal';
import { RenderSummaryOverlay } from './RenderSummaryOverlay';
import { RenderAuditLogger, RenderAuditEntry } from '../lib/renderAuditLogger';
import { ColorAdjustments } from '../types';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Copy, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Magnet, 
  Sparkles, 
  Wand2, 
  Download, 
  Check, 
  Film, 
  Volume2, 
  Sliders, 
  Type, 
  Palette, 
  Layers, 
  Share2,
  Youtube,
  FolderOpen,
  Music,
  Monitor,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  FileDown,
  Upload,
  Clock,
  RotateCcw,
  RotateCw,
  Shield,
  MessageSquare,
  FileJson,
  LayoutTemplate,
  SlidersHorizontal,
  Edit3,
  CheckCheck,
  Activity,
  Zap,
  Crosshair,
  FolderPlus,
  Briefcase,
  Command,
  Eye,
  GripVertical,
  Move,
  Tag,
  CheckSquare,
  FileText,
  Database,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SceneTemplatesModal } from './SceneTemplatesModal';
import { AssetLibrarySidebar } from './AssetLibrarySidebar';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { WorkspacesModal, INITIAL_WORKSPACES } from './WorkspacesModal';
import { LivePreviewCanvas } from './LivePreviewCanvas';
import { useStudioShortcuts } from '../hooks/useStudioShortcuts';
import { RenderQueueModal } from './RenderQueueModal';
import { TransitionManagerModal } from './TransitionManagerModal';
import { AiStoryboardModal } from './AiStoryboardModal';
import { ProjectExportModal } from './ProjectExportModal';
import { GlobalMediaLibraryModal } from './GlobalMediaLibraryModal';
import { ScenePreviewModal } from './ScenePreviewModal';
import { StoryboardPdfModal } from './StoryboardPdfModal';
import { RealtimePresence } from './RealtimePresence';
import { VersionHistoryModal } from './VersionHistoryModal';
import { AssetAndSoundLibraryModal } from './AssetAndSoundLibraryModal';
import { PreRenderValidationModal } from './PreRenderValidationModal';
import { CharacterConsistencyModal } from './CharacterConsistencyModal';
import { ScriptToSceneModal } from './ScriptToSceneModal';
import { AiMediaProcessingModal } from './AiMediaProcessingModal';
import { AutomatedAdBuilderModal } from './AutomatedAdBuilderModal';
import { TextStylingToolkitModal } from './TextStylingToolkitModal';
import { MediaLibrary, MediaAssetItem } from './MediaLibrary';
import { validateTimelineBeforeRender } from '../services/timelineValidationService';
import { TextStylePreset, TextAnimationOption, TickerConfig, TimelineValidationReport, KineticTypographyConfig } from '../types';
import { History } from 'lucide-react';
import { UserSession } from '../types';
import { CapCutTopBar } from './capcut/CapCutTopBar';
import { CapCutLeftPanel } from './capcut/CapCutLeftPanel';
import { CapCutPlayerPanel } from './capcut/CapCutPlayerPanel';
import { CapCutInspectorPanel } from './capcut/CapCutInspectorPanel';
import { CapCutTimelineToolbar } from './capcut/CapCutTimelineToolbar';
import { CapCutTimelineDeck } from './capcut/CapCutTimelineDeck';

interface VideoStudioViewProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  currentUser?: UserSession | null;
  onOpenImageStudio: () => void;
  onOpenSoraStudio: () => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
  audioTracks?: AudioTrack[];
  setAudioTracks?: React.Dispatch<React.SetStateAction<AudioTrack[]>>;
  subtitles?: SubtitleItem[];
  setSubtitles?: React.Dispatch<React.SetStateAction<SubtitleItem[]>>;
  initialOpenModal?: 'character_studio' | 'ad_builder' | null;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  scenes,
  setScenes,
  currentUser = null,
  onOpenImageStudio,
  onOpenSoraStudio,
  onStartGlobalLoading,
  onStopGlobalLoading,
  audioTracks: propsAudioTracks,
  setAudioTracks: propsSetAudioTracks,
  subtitles: propsSubtitles,
  setSubtitles: propsSetSubtitles,
  initialOpenModal = null,
}) => {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('polish');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scenes[0]?.id || '');

  // Version History Modal state
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  
  // Project Title & Persistence state
  const [projectTitle, setProjectTitle] = useState<string>(() => {
    return localStorage.getItem('nepalai_video_project_title') || 'Nepal Tourism Reel';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasExistingAutoSave, setHasExistingAutoSave] = useState(false);
  const [projectNotice, setProjectNotice] = useState<string | null>(null);

  // Session Restore Prompt state
  const [showSessionRestoreBanner, setShowSessionRestoreBanner] = useState(false);
  const [restorableDraftInfo, setRestorableDraftInfo] = useState<{ savedAt: string; title: string; count: number } | null>(null);

  // Scene Preview Modal state
  const [previewModalSceneIndex, setPreviewModalSceneIndex] = useState<number | null>(null);

  // Drag-and-Drop Reordering state
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  // Preview Mode: 'canvas' (Live Canvas API Proxy with real-time transitions) | 'interactive'
  const [previewMode, setPreviewMode] = useState<'canvas' | 'interactive'>('canvas');

  // Asset Library Sidebar Drawer
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);

  // Keyboard Shortcuts Modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // New Modals state
  const [showRenderQueueModal, setShowRenderQueueModal] = useState(false);
  const [showAiStoryboardModal, setShowAiStoryboardModal] = useState(false);
  const [showTransitionManagerModal, setShowTransitionManagerModal] = useState(false);
  const [showProjectExportModal, setShowProjectExportModal] = useState(false);
  const [showGlobalMediaLibrary, setShowGlobalMediaLibrary] = useState(false);
  const [showStoryboardPdfModal, setShowStoryboardPdfModal] = useState(false);
  const [transitionTargetSceneIndex, setTransitionTargetSceneIndex] = useState(0);

  // Multi-scene Batch Selection & Tagging state
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [isBatchSelectMode, setIsBatchSelectMode] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  // Multi-track audio volumes
  const [bgmVolume, setBgmVolume] = useState<number>(80);
  const [voVolume, setVoVolume] = useState<number>(90);
  const [sfxVolume, setSfxVolume] = useState<number>(75);

  // VFX & Frame Overlays Configuration (Rendered lively on LivePreviewCanvas)
  const [vfxConfig, setVfxConfig] = useState<VfxConfig>({
    filmGrain: true,
    filmGrainIntensity: 0.15,
    lightLeaks: false,
    rgbGlitch: false,
    vignette: true,
    goldenHour: false,
    dreamyGlow: false,
    frameType: 'none',
  });

  // Sound Effects (SFX) Track Library & Active Selection
  const INITIAL_SFX_LIST: AudioTrack[] = [
    { id: 'sfx-whoosh', title: 'Cinematic Whoosh & Swoosh', artist: 'Atmos FX', url: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3', duration: 2, volume: 80, genre: 'Transition', type: 'sfx' },
    { id: 'sfx-bell', title: 'Temple Bell & Chimes', artist: 'Himalayan Heritage', url: 'https://cdn.freesound.org/previews/568/568779_6142149-lq.mp3', duration: 4, volume: 75, genre: 'Heritage', type: 'sfx' },
    { id: 'sfx-wind', title: 'Himalayan Mountain Wind Atmos', artist: 'Alpine Field', url: 'https://cdn.freesound.org/previews/518/518290_7037-lq.mp3', duration: 6, volume: 70, genre: 'Atmosphere', type: 'sfx' },
    { id: 'sfx-flute', title: 'Mountain Bamboo Flute Echo', artist: 'Folk Master', url: 'https://cdn.freesound.org/previews/522/522247_11861866-lq.mp3', duration: 4, volume: 75, genre: 'Acoustic', type: 'sfx' },
    { id: 'sfx-impact', title: 'Deep Sub-Bass Cinematic Drop', artist: 'Impact Labs', url: 'https://cdn.freesound.org/previews/443/443806_9159316-lq.mp3', duration: 3, volume: 85, genre: 'Impact', type: 'sfx' },
    { id: 'sfx-rain', title: 'Kathmandu Monsoon Rain & Thunder', artist: 'Nature Audio', url: 'https://cdn.freesound.org/previews/612/612887_11861866-lq.mp3', duration: 5, volume: 70, genre: 'Weather', type: 'sfx' },
  ];
  const [sfxTracks, setSfxTracks] = useState<AudioTrack[]>(INITIAL_SFX_LIST);
  const [selectedSfxId, setSelectedSfxId] = useState<string>('sfx-whoosh');
  const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const voFileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const sfxFileInputRef = useRef<HTMLInputElement | null>(null);

  // 5 Production Studio Modules State
  const [showCharacterConsistencyModal, setShowCharacterConsistencyModal] = useState(initialOpenModal === 'character_studio');
  const [showScriptToSceneModal, setShowScriptToSceneModal] = useState(false);
  const [showAiMediaProcessingModal, setShowAiMediaProcessingModal] = useState(false);
  const [showAutomatedAdBuilderModal, setShowAutomatedAdBuilderModal] = useState(initialOpenModal === 'ad_builder');
  const [activeCharacterToken, setActiveCharacterToken] = useState<string>('');

  // Asset Modals & Drag State
  const [showVfxModal, setShowVfxModal] = useState(false);
  const [showAudioAddModal, setShowAudioAddModal] = useState(false);
  const [showSfxModal, setShowSfxModal] = useState(false);
  const [isTimelineDragActive, setIsTimelineDragActive] = useState(false);

  // Workspaces & Collaboration
  const [showWorkspacesModal, setShowWorkspacesModal] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<StudioWorkspace>(() => {
    const saved = localStorage.getItem('nepalai_active_workspace');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_WORKSPACES[0];
      }
    }
    return INITIAL_WORKSPACES[0];
  });

  // Undo / Redo History Stack
  const historyRef = useRef<Scene[][]>([scenes]);
  const historyIndexRef = useRef<number>(0);

  const pushToHistory = (newScenes: Scene[]) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current = [...trimmed, newScenes];
    historyIndexRef.current = historyRef.current.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevScenes = historyRef.current[historyIndexRef.current];
      setScenes(prevScenes);
      setProjectNotice('Undo: Reverted timeline edit');
      setTimeout(() => setProjectNotice(null), 2000);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextScenes = historyRef.current[historyIndexRef.current];
      setScenes(nextScenes);
      setProjectNotice('Redo: Restored timeline edit');
      setTimeout(() => setProjectNotice(null), 2000);
    }
  };

  // Batch-Tagging helper handlers
  const toggleSceneBatchSelection = (sceneId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSceneIds(prev => 
      prev.includes(sceneId) ? prev.filter(id => id !== sceneId) : [...prev, sceneId]
    );
  };

  const handleSelectAllScenes = () => {
    setSelectedSceneIds(scenes.map(s => s.id));
  };

  const handleClearBatchSelection = () => {
    setSelectedSceneIds([]);
    setIsBatchSelectMode(false);
  };

  const handleApplyBatchTags = (tagsToApply: string[]) => {
    if (selectedSceneIds.length === 0) return;
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => {
      if (selectedSceneIds.includes(s.id)) {
        const existing = s.tags || [];
        const merged = Array.from(new Set([...existing, ...tagsToApply]));
        return { ...s, tags: merged };
      }
      return s;
    }));
    setProjectNotice(`Applied batch tags (${tagsToApply.join(', ')}) to ${selectedSceneIds.length} scenes!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleRemoveBatchTags = () => {
    if (selectedSceneIds.length === 0) return;
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => selectedSceneIds.includes(s.id) ? { ...s, tags: [] } : s));
    setProjectNotice(`Cleared all tags from ${selectedSceneIds.length} selected scenes.`);
    setTimeout(() => setProjectNotice(null), 2500);
  };

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGridInterval, setSnapGridInterval] = useState<number>(0.5); // 0.25s, 0.5s, 1s, 2s
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  
  // Audio state
  const [internalAudioTracks, setInternalAudioTracks] = useState<AudioTrack[]>(INITIAL_AUDIO_TRACKS);
  const audioTracks = propsAudioTracks ?? internalAudioTracks;
  const setAudioTracks = propsSetAudioTracks ?? setInternalAudioTracks;
  const [selectedAudioId, setSelectedAudioId] = useState<string>(() => audioTracks[0]?.id || INITIAL_AUDIO_TRACKS[0]?.id || '');
  const [showAssetAndSoundLibraryModal, setShowAssetAndSoundLibraryModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voAudioRef = useRef<HTMLAudioElement | null>(null);

  // Proxy Rendering Mode & Advanced Production Suite Modals State
  const [rightTab, setRightTab] = useState<'inspector' | 'medialib'>('inspector');
  const [isProxyMode, setIsProxyMode] = useState<boolean>(false);
  const [showColorMatchModal, setShowColorMatchModal] = useState<boolean>(false);
  const [showFrameInspectorModal, setShowFrameInspectorModal] = useState<boolean>(false);
  const [showSceneLibraryModal, setShowSceneLibraryModal] = useState<boolean>(false);

  // Export & Production Suite Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTextStylingToolkitModal, setShowTextStylingToolkitModal] = useState(false);
  const [showPreRenderValidationModal, setShowPreRenderValidationModal] = useState(false);
  const [validationReport, setValidationReport] = useState<TimelineValidationReport | null>(null);
  const [showSocialPublisherModal, setShowSocialPublisherModal] = useState(false);
  const [showYouTubePublisherModal, setShowYouTubePublisherModal] = useState(false);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('nepalai_youtube_token');
    } catch {
      return false;
    }
  });

  // Keep YouTube connection status reactive
  useEffect(() => {
    const checkYt = () => {
      try {
        setIsYouTubeConnected(!!localStorage.getItem('nepalai_youtube_token'));
      } catch {}
    };
    window.addEventListener('storage', checkYt);
    const interval = setInterval(checkYt, 3000);
    return () => {
      window.removeEventListener('storage', checkYt);
      clearInterval(interval);
    };
  }, []);
  const [showRenderPresetModal, setShowRenderPresetModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showSessionRestoreModal, setShowSessionRestoreModal] = useState(false);
  const [showRenderSummaryOverlay, setShowRenderSummaryOverlay] = useState(false);
  const [latestAuditEntry, setLatestAuditEntry] = useState<RenderAuditEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Subtitles & Brand Overlay State
  const [internalSubtitles, setInternalSubtitles] = useState<SubtitleItem[]>([]);
  const subtitles = propsSubtitles ?? internalSubtitles;
  const setSubtitles = propsSetSubtitles ?? setInternalSubtitles;
  const [subtitleBurnOptions, setSubtitleBurnOptions] = useState<SubtitleBurnOptions>({
    burnIn: true,
    fontSize: 'medium',
    textColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    position: 'bottom',
    bilingualDevanagari: true,
  });
  const [brandOverlayConfig, setBrandOverlayConfig] = useState<BrandOverlayConfig>({
    enabled: true,
    logoUrl: WATERMARK_PRESETS[0].url,
    position: 'bottom-right',
    scalePercent: 20,
    opacityPercent: 85,
    marginPx: 16,
    brandText: 'NepalAI Studio',
    showBrandText: true,
  });
  const [activeRenderPreset, setActiveRenderPreset] = useState<RenderPreset>(RENDER_PRESETS[0]);

  // Template loader drawer & Scene Templates Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSceneTemplatesModal, setShowSceneTemplatesModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectRatio, setNewProjectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [newProjectName, setNewProjectName] = useState('My CapCut Project');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Starter sequence template loader
  const handleLoadStarterSequence = (templateId: string) => {
    pushToHistory(scenes);
    if (templateId === 'nepal_tourism') {
      setProjectTitle('Nepal Tourism & Heritage');
      setAspectRatio('16:9');
      setScenes([
        {
          id: `scene-${Date.now()}-1`,
          title: 'Himalayan Sunrise at Dawn',
          duration: 4,
          prompt: 'Golden sunlight hitting snow-capped Mount Everest summit',
          mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop',
          mediaType: 'image',
          aspectRatio: '16:9',
          motion: 'zoom_in',
          transition: 'dissolve',
          transitionDuration: 0.8,
          textOverlay: 'स्वर्गभूमि नेपाल',
          textNepali: 'स्वर्गभूमि नेपाल',
          textColor: '#ffffff',
          textFont: 'sans',
          textPosition: 'lower_third',
          filter: 'warm',
          volume: 90
        },
        {
          id: `scene-${Date.now()}-2`,
          title: 'Kathmandu Durbar Square Heritage',
          duration: 4.5,
          prompt: 'Ancient pagoda temples of Kathmandu Durbar Square',
          mediaUrl: 'https://images.unsplash.com/photo-1582650625119-3a31f841839d?q=80&w=1000&auto=format&fit=crop',
          mediaType: 'image',
          aspectRatio: '16:9',
          motion: 'pan_right',
          transition: 'dissolve',
          transitionDuration: 0.8,
          textOverlay: 'काठमाडौँ उपत्यकाको सम्पदा',
          textNepali: 'काठमाडौँ उपत्यकाको सम्पदा',
          textColor: '#facc15',
          textFont: 'sans',
          textPosition: 'lower_third',
          filter: 'cinematic',
          volume: 90
        },
        {
          id: `scene-${Date.now()}-3`,
          title: 'Pokhara Phewa Lake Serenity',
          duration: 4.5,
          prompt: 'Tranquil wooden boats reflecting Machhapuchhre peak',
          mediaUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
          mediaType: 'image',
          aspectRatio: '16:9',
          motion: 'dolly',
          transition: 'dissolve',
          transitionDuration: 0.8,
          textOverlay: 'Pokhara Valley',
          textNepali: 'पोखराको शान्त वातावरण',
          textColor: '#22d3ee',
          textFont: 'sans',
          textPosition: 'lower_third',
          filter: 'cool',
          volume: 90
        }
      ]);
      setProjectNotice('Loaded "Nepal Tourism Reel" into timeline!');
    } else if (templateId === 'tiktok_montage') {
      setProjectTitle('TikTok Vertical Reel');
      setAspectRatio('9:16');
      setScenes([
        {
          id: `scene-${Date.now()}-1`,
          title: 'Mountain Ascent Hook',
          duration: 3,
          prompt: 'Fast aerial flyover of Himalayan mountain ridge',
          mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
          mediaType: 'image',
          aspectRatio: '9:16',
          motion: 'zoom_in',
          transition: 'zoom_in',
          transitionDuration: 0.5,
          textOverlay: 'WAIT TILL THE PEAK! 🏔️',
          textColor: '#facc15',
          textFont: 'sans',
          textPosition: 'center',
          filter: 'vibrant',
          volume: 90
        },
        {
          id: `scene-${Date.now()}-2`,
          title: 'Summit Victory Panorama',
          duration: 3.5,
          prompt: 'Climbers at summit waving flag in wind',
          mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop',
          mediaType: 'image',
          aspectRatio: '9:16',
          motion: 'pan_right',
          transition: 'dissolve',
          transitionDuration: 0.8,
          textOverlay: 'TOP OF THE WORLD ✨',
          textColor: '#ffffff',
          textFont: 'neon',
          textPosition: 'lower_third',
          filter: 'warm',
          volume: 90
        }
      ]);
      setProjectNotice('Loaded "TikTok Vertical Reel" into timeline!');
    }
    setCurrentTime(0);
    setTimeout(() => setProjectNotice(null), 3500);
  };

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    };
    if (showToolsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsDropdown]);

  // Refs for Timeline and Project File Import
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const selectedScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];

  // Timeline zoom calculations
  const pixelsPerSecond = Math.max(18, Math.round(36 * timelineZoom));

  // Check for existing auto-save on initial mount (sessionStorage & localStorage)
  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem('nepalai_video_project_autosave');
      const savedLocal = localStorage.getItem('nepalai_video_project_autosave');
      const saved = savedSession || savedLocal;

      if (saved) {
        const parsed = JSON.parse(saved);
        const savedTime = parsed.lastSavedAt ? new Date(parsed.lastSavedAt).getTime() : 0;
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        if (savedTime > 0 && Date.now() - savedTime > SEVEN_DAYS_MS) {
          sessionStorage.removeItem('nepalai_video_project_autosave');
          localStorage.removeItem('nepalai_video_project_autosave');
          setHasExistingAutoSave(false);
          setShowSessionRestoreBanner(false);
        } else if (parsed?.scenes?.length > 0) {
          setHasExistingAutoSave(true);
          const savedTimeStr = parsed.lastSavedAt 
            ? new Date(parsed.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : 'recently';
          
          setRestorableDraftInfo({
            savedAt: savedTimeStr,
            title: parsed.projectTitle || 'Auto-Saved Project',
            count: parsed.scenes.length,
          });
          setShowSessionRestoreBanner(true);
          setShowSessionRestoreModal(true);

          if (parsed.lastSavedAt) {
            setLastAutoSavedTime(savedTimeStr);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read existing autosave:', e);
    }
  }, []);

  // Global Keyboard Shortcuts for Undo (Ctrl+Z / Cmd+Z) & Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;

      if (isModifierPressed && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isModifierPressed && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced Auto-Save Mechanism: Syncs timeline, scenes, metadata, subtitles & brand overlay to sessionStorage & localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setIsAutoSaving(true);
        const projectData = {
          schemaVersion: '1.30.0-A',
          application: 'NepalAI Video Studio',
          projectTitle,
          aspectRatio,
          selectedAudioId,
          totalDuration,
          scenes,
          subtitles,
          subtitleBurnOptions,
          brandOverlayConfig,
          lastSavedAt: new Date().toISOString(),
        };
        const serialized = JSON.stringify(projectData);
        sessionStorage.setItem('nepalai_video_project_autosave', serialized);
        localStorage.setItem('nepalai_video_project_autosave', serialized);
        localStorage.setItem('nepalai_video_project_title', projectTitle);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutoSavedTime(timeStr);
        setHasExistingAutoSave(true);
      } catch (err) {
        console.warn('Auto-save error:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [scenes, projectTitle, aspectRatio, selectedAudioId, totalDuration, subtitles, subtitleBurnOptions, brandOverlayConfig]);

  // Periodic 30-second interval Auto-Save to sessionStorage & localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const projectData = {
          schemaVersion: '1.30.0-A',
          application: 'NepalAI Video Studio',
          projectTitle,
          aspectRatio,
          selectedAudioId,
          totalDuration,
          scenes,
          subtitles,
          subtitleBurnOptions,
          brandOverlayConfig,
          lastSavedAt: new Date().toISOString(),
        };
        const serialized = JSON.stringify(projectData);
        sessionStorage.setItem('nepalai_video_project_autosave', serialized);
        localStorage.setItem('nepalai_video_project_autosave', serialized);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutoSavedTime(timeStr);
        setHasExistingAutoSave(true);
      } catch (err) {
        console.warn('30s interval auto-save error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [scenes, projectTitle, aspectRatio, selectedAudioId, totalDuration, subtitles, subtitleBurnOptions, brandOverlayConfig]);

  // Auto-scroll timeline to keep playhead in view during playback
  useEffect(() => {
    if (isPlaying && timelineScrollRef.current) {
      const container = timelineScrollRef.current;
      const playheadPx = currentTime * pixelsPerSecond;
      const viewStart = container.scrollLeft;
      const viewEnd = viewStart + container.clientWidth;

      if (playheadPx > viewEnd - 80 || playheadPx < viewStart) {
        container.scrollTo({
          left: Math.max(0, playheadPx - container.clientWidth * 0.25),
          behavior: 'smooth',
        });
      }
    }
  }, [currentTime, isPlaying, pixelsPerSecond]);

  // High-precision sub-second playback timer loop (60FPS animation frame sync)
  const animFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      lastTickTimeRef.current = performance.now();
      const tick = (now: number) => {
        if (lastTickTimeRef.current !== null) {
          const delta = (now - lastTickTimeRef.current) / 1000; // in seconds
          setCurrentTime(prev => {
            const next = prev + delta;
            if (next >= totalDuration) {
              setIsPlaying(false);
              return 0;
            }
            return next;
          });
        }
        lastTickTimeRef.current = now;
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTickTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Handler for Pre-Render Validation Check
  const handleInitiatePreRenderCheck = () => {
    const report = validateTimelineBeforeRender({
      scenes,
      audioTracks,
      targetDuration: totalDuration,
      brandLogoUrl: brandOverlayConfig.enabled ? brandOverlayConfig.logoUrl : undefined,
    });
    setValidationReport(report);
    setShowPreRenderValidationModal(true);
  };

  // Determine active scene based on currentTime (updates real-time video preview during playback AND playhead scrubbing)
  useEffect(() => {
    if (scenes.length > 0) {
      let accumulated = 0;
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        accumulated += scene.duration;
        if (currentTime <= accumulated || i === scenes.length - 1) {
          if (selectedSceneId !== scene.id) {
            setSelectedSceneId(scene.id);
          }
          break;
        }
      }
    }
  }, [currentTime, scenes]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Step single frame forward or backward (30 FPS standard frame precision)
  const handleStepFrame = (deltaFrames: number) => {
    setIsPlaying(false);
    const frameSec = 1 / 30;
    setCurrentTime(prev => Math.max(0, Math.min(totalDuration, Number((prev + deltaFrames * frameSec).toFixed(3)))));
  };

  // Active BGM and Voiceover tracks
  const bgmTrack = audioTracks.find(a => a.id === selectedAudioId) || audioTracks.find(a => a.type !== 'voiceover') || audioTracks[0];
  const voTrack = audioTracks.find(a => a.type === 'voiceover');

  // Multi-Track Audio Playback Sync & Intelligent Auto-Ducking
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (bgmTrack?.url) {
        // Auto-ducking: when a voiceover track is active or current scene has dialogue, duck BGM
        const isVoiceActive = Boolean(voTrack?.url) || Boolean(selectedScene?.scriptText || selectedScene?.narrationVoice);
        const baseVol = (bgmVolume ?? 75) / 100;
        audioRef.current.volume = isVoiceActive ? Math.max(0.1, baseVol * 0.28) : baseVol;
        audioRef.current.play().catch(e => console.warn('BGM play notice:', e));
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, bgmTrack, voTrack, bgmVolume, selectedScene]);

  // Voiceover audio playback sync
  useEffect(() => {
    if (!voAudioRef.current) return;
    if (isPlaying && voTrack?.url) {
      voAudioRef.current.volume = (voVolume ?? 90) / 100;
      voAudioRef.current.play().catch(e => console.warn('VO play notice:', e));
    } else if (voAudioRef.current) {
      voAudioRef.current.pause();
    }
  }, [isPlaying, voTrack, voVolume]);

  // SFX audio playback sync
  const sfxTrack = sfxTracks.find(s => s.id === selectedSfxId) || sfxTracks[0];
  useEffect(() => {
    if (!sfxAudioRef.current) return;
    if (isPlaying && sfxTrack?.url) {
      sfxAudioRef.current.volume = (sfxVolume ?? 75) / 100;
      sfxAudioRef.current.play().catch(e => console.warn('SFX play notice:', e));
    } else if (sfxAudioRef.current) {
      sfxAudioRef.current.pause();
    }
  }, [isPlaying, sfxTrack, sfxVolume]);

  // Audio Playhead Seek Sync
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.4) {
      try {
        audioRef.current.currentTime = Math.min(audioRef.current.duration || totalDuration, currentTime);
      } catch (e) {}
    }
    if (voAudioRef.current && Math.abs(voAudioRef.current.currentTime - currentTime) > 0.4) {
      try {
        voAudioRef.current.currentTime = Math.min(voAudioRef.current.duration || totalDuration, currentTime);
      } catch (e) {}
    }
    if (sfxAudioRef.current && Math.abs(sfxAudioRef.current.currentTime - currentTime) > 0.4) {
      try {
        sfxAudioRef.current.currentTime = Math.min(sfxAudioRef.current.duration || totalDuration, currentTime);
      } catch (e) {}
    }
  }, [currentTime, totalDuration]);

  // Handle Drag and Drop Media/Audio Files directly into Timeline
  const handleAudioUpload = (file: File, trackType: 'bgm' | 'voiceover' | 'sfx' = 'bgm') => {
    try {
      const url = URL.createObjectURL(file);
      const newTrack: AudioTrack = {
        id: `custom-audio-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Studio Local Upload',
        url,
        duration: 30,
        volume: trackType === 'voiceover' ? 90 : 80,
        genre: 'User Audio',
        type: trackType
      };

      if (trackType === 'sfx') {
        setSfxTracks(prev => [newTrack, ...prev]);
        setSelectedSfxId(newTrack.id);
        setProjectNotice(`SFX Asset Loaded: "${newTrack.title}"`);
      } else if (trackType === 'voiceover') {
        setAudioTracks(prev => [...prev.filter(t => t.type !== 'voiceover'), newTrack]);
        setProjectNotice(`Voiceover Track Loaded: "${newTrack.title}"`);
      } else {
        setAudioTracks(prev => [...prev, newTrack]);
        setSelectedAudioId(newTrack.id);
        setProjectNotice(`BGM Audio Track Loaded: "${newTrack.title}"`);
      }
      setTimeout(() => setProjectNotice(null), 3000);
    } catch (err) {
      console.error('Audio upload error:', err);
    }
  };

  const handleMediaUpload = (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const newScene: Scene = {
        id: `scene-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        duration: 4,
        prompt: `Custom imported asset: ${file.name}`,
        mediaUrl: url,
        mediaType: isVideo ? 'video' : 'image',
        aspectRatio,
        motion: 'pan_right',
        transition: 'dissolve',
        transitionDuration: 0.8,
        textOverlay: '',
        textColor: '#ffffff',
        textFont: 'sans',
        textPosition: 'lower_third',
        filter: 'cinematic',
        volume: 90
      };
      pushToHistory(scenes);
      setScenes(prev => [...prev, newScene]);
      setSelectedSceneId(newScene.id);
      setProjectNotice(`Asset Added to Timeline: "${newScene.title}"`);
      setTimeout(() => setProjectNotice(null), 3000);
    } catch (err) {
      console.error('Media upload error:', err);
    }
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTimelineDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      files.forEach(file => {
        if (file.type.startsWith('audio/')) {
          handleAudioUpload(file, 'bgm');
        } else if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          handleMediaUpload(file);
        }
      });
    }
  };

  // Jump to Previous Scene
  const handlePrevScene = () => {
    const idx = scenes.findIndex(s => s.id === selectedSceneId);
    if (idx > 0) {
      const targetScene = scenes[idx - 1];
      setSelectedSceneId(targetScene.id);
      let t = 0;
      for (let i = 0; i < idx - 1; i++) t += scenes[i].duration;
      setCurrentTime(t);
    } else {
      setCurrentTime(0);
    }
  };

  // Jump to Next Scene
  const handleNextScene = () => {
    const idx = scenes.findIndex(s => s.id === selectedSceneId);
    if (idx < scenes.length - 1) {
      const targetScene = scenes[idx + 1];
      setSelectedSceneId(targetScene.id);
      let t = 0;
      for (let i = 0; i <= idx; i++) t += scenes[i].duration;
      setCurrentTime(t);
    }
  };

  // Split-at-playhead feature (crucial from v1.30.0-A)
  const handleSplitAtPlayhead = () => {
    if (!selectedScene) return;
    const idx = scenes.findIndex(s => s.id === selectedSceneId);
    if (idx === -1) return;

    // Calculate relative time within the selected scene
    let sceneStartTime = 0;
    for (let i = 0; i < idx; i++) sceneStartTime += scenes[i].duration;
    const sceneOffset = currentTime - sceneStartTime;

    // Only split if playhead is strictly inside the clip (at least 1s from either edge)
    if (sceneOffset <= 1 || sceneOffset >= selectedScene.duration - 1) {
      alert("Move the playhead inside the scene (at least 1 second from edges) to split.");
      return;
    }

    const firstDuration = Math.round(sceneOffset);
    const secondDuration = Math.round(selectedScene.duration - firstDuration);

    const firstClip: Scene = {
      ...selectedScene,
      id: selectedScene.id,
      title: `${selectedScene.title} (Part 1)`,
      duration: firstDuration
    };

    const secondClip: Scene = {
      ...selectedScene,
      id: 'scene-' + Math.random().toString(36).substring(2, 9),
      title: `${selectedScene.title} (Part 2)`,
      duration: secondDuration,
      textOverlay: selectedScene.textOverlay ? `${selectedScene.textOverlay} (Cont.)` : ''
    };

    const updated = [...scenes];
    updated.splice(idx, 1, firstClip, secondClip);
    pushToHistory(scenes);
    setScenes(updated);
    setSelectedSceneId(secondClip.id);
  };

  // Duplicate Scene
  const handleDuplicateScene = () => {
    if (!selectedScene) return;
    const idx = scenes.findIndex(s => s.id === selectedSceneId);
    const duplicated: Scene = {
      ...selectedScene,
      id: 'scene-' + Math.random().toString(36).substring(2, 9),
      title: `${selectedScene.title} (Copy)`
    };
    const updated = [...scenes];
    updated.splice(idx + 1, 0, duplicated);
    pushToHistory(scenes);
    setScenes(updated);
    setSelectedSceneId(duplicated.id);
  };

  // Delete Scene
  const handleDeleteScene = () => {
    if (scenes.length <= 1) {
      alert("A video must have at least one scene.");
      return;
    }
    const idx = scenes.findIndex(s => s.id === selectedSceneId);
    const updated = scenes.filter(s => s.id !== selectedSceneId);
    pushToHistory(scenes);
    setScenes(updated);
    const nextIdx = Math.max(0, idx - 1);
    setSelectedSceneId(updated[nextIdx].id);
  };

  // Fit timeline to window width
  const handleFitToWindow = () => {
    if (timelineScrollRef.current && totalDuration > 0) {
      const availableWidth = Math.max(300, timelineScrollRef.current.clientWidth - 160);
      const computedZoom = (availableWidth / totalDuration) / 36;
      setTimelineZoom(Math.max(0.5, Math.min(2.5, Number(computedZoom.toFixed(2)))));
    } else {
      setTimelineZoom(1);
    }
  };

  // Export full project state as JSON file
  const handleExportProjectJson = () => {
    const projectData = {
      schemaVersion: '1.30.0-A',
      application: 'NepalAI Video Studio',
      projectTitle,
      aspectRatio,
      selectedAudioId,
      totalDuration,
      scenesCount: scenes.length,
      exportedAt: new Date().toISOString(),
      scenes,
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const cleanTitle = projectTitle.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '_') || 'nepalai_video_project';
    a.href = url;
    a.download = `${cleanTitle}.nepalai.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setProjectNotice(`Project saved locally as "${cleanTitle}.nepalai.json"!`);
    setTimeout(() => setProjectNotice(null), 4000);
  };

  // Import project from JSON file
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
          alert('Invalid project JSON: No scenes found in the selected file.');
          return;
        }
        setScenes(data.scenes);
        if (data.projectTitle) setProjectTitle(data.projectTitle);
        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.selectedAudioId) setSelectedAudioId(data.selectedAudioId);
        setSelectedSceneId(data.scenes[0].id);
        setCurrentTime(0);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setProjectNotice(`Project "${data.projectTitle || 'Imported'}" loaded (${data.scenes.length} scenes)!`);
        setTimeout(() => setProjectNotice(null), 4000);
      } catch (err) {
        alert('Failed to parse project JSON file. Please ensure it is a valid .nepalai.json export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Restore project from sessionStorage or localStorage auto-save
  const handleRestoreAutoSave = () => {
    try {
      const savedSession = sessionStorage.getItem('nepalai_video_project_autosave');
      const savedLocal = localStorage.getItem('nepalai_video_project_autosave');
      const saved = savedSession || savedLocal;

      if (!saved) {
        alert('No auto-saved session found in your browser storage.');
        return;
      }
      const data = JSON.parse(saved);
      if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
        setScenes(data.scenes);
        if (data.projectTitle) setProjectTitle(data.projectTitle);
        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.selectedAudioId) setSelectedAudioId(data.selectedAudioId);
        if (data.subtitles) setSubtitles(data.subtitles);
        if (data.subtitleBurnOptions) setSubtitleBurnOptions(data.subtitleBurnOptions);
        if (data.brandOverlayConfig) setBrandOverlayConfig(data.brandOverlayConfig);

        setSelectedSceneId(data.scenes[0].id);
        setCurrentTime(0);
        setShowSessionRestoreModal(false);
        setShowSessionRestoreBanner(false);
        setProjectNotice(`Restored auto-saved project from ${data.lastSavedAt ? new Date(data.lastSavedAt).toLocaleTimeString() : 'browser storage'}!`);
        setTimeout(() => setProjectNotice(null), 4000);
      }
    } catch (err) {
      alert('Could not restore auto-saved session.');
    }
  };

  // Watermark management handlers
  const handleApplyWatermark = (watermark: SceneWatermark, applyToAll = false) => {
    pushToHistory(scenes);
    if (applyToAll) {
      setScenes(prev => prev.map(s => ({ ...s, watermark })));
      setProjectNotice('Watermark stamped onto ALL scenes in timeline!');
    } else {
      setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, watermark } : s));
      setProjectNotice(`Watermark stamped onto scene "${selectedScene?.title || ''}"`);
    }
    setTimeout(() => setProjectNotice(null), 3000);
  };

  // Color Grade & Auto-Color Match handlers
  const handleApplyColorAdjustments = (sceneId: string, adj: ColorAdjustments) => {
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, colorAdjustments: adj } : s));
    const targetIdx = scenes.findIndex(s => s.id === sceneId);
    setProjectNotice(`Applied auto-color match parameters to Scene #${targetIdx + 1}!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleBatchApplyColorAdjustments = (map: Record<string, ColorAdjustments>) => {
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => map[s.id] ? { ...s, colorAdjustments: map[s.id] } : s));
    setProjectNotice(`Normalized exposure & temperature across ${Object.keys(map).length} scenes!`);
    setTimeout(() => setProjectNotice(null), 3500);
  };

  // Scene Library handlers
  const handleInsertSceneFromLibrary = (sceneData: Omit<Scene, 'id'>) => {
    pushToHistory(scenes);
    const newScene: Scene = {
      ...sceneData,
      id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneId(newScene.id);
    setProjectNotice(`Inserted library template "${sceneData.title}" into sequence!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleReplaceSelectedScene = (sceneData: Omit<Scene, 'id'>) => {
    if (!selectedScene) return;
    const idx = scenes.findIndex(s => s.id === selectedScene.id);
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => s.id === selectedScene.id ? { ...sceneData, id: s.id } : s));
    setProjectNotice(`Replaced Scene #${idx + 1} with template "${sceneData.title}"!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleSplitSceneAtTime = (sceneId: string, splitTimeSec: number) => {
    const target = scenes.find(s => s.id === sceneId);
    if (!target) return;
    const idx = scenes.findIndex(s => s.id === sceneId);
    if (splitTimeSec <= 0.2 || splitTimeSec >= target.duration - 0.2) return;

    pushToHistory(scenes);
    const leftDuration = Number(splitTimeSec.toFixed(2));
    const rightDuration = Number((target.duration - splitTimeSec).toFixed(2));

    const leftScene: Scene = { ...target, duration: leftDuration };
    const rightScene: Scene = {
      ...target,
      id: `scene_${Date.now()}_split`,
      title: `${target.title} (Part 2)`,
      duration: rightDuration,
    };

    const newScenes = [...scenes];
    newScenes.splice(idx, 1, leftScene, rightScene);
    setScenes(newScenes);
    setSelectedSceneId(leftScene.id);
    setProjectNotice(`Split Scene #${idx + 1} at ${splitTimeSec}s!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleUpdateSceneDuration = (sceneId: string, newDurationSec: number) => {
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, duration: newDurationSec } : s));
    setProjectNotice(`Trimmed Scene duration to ${newDurationSec}s`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleRemoveWatermark = (applyToAll = false) => {
    pushToHistory(scenes);
    if (applyToAll) {
      setScenes(prev => prev.map(s => {
        const { watermark, ...rest } = s;
        return rest as Scene;
      }));
      setProjectNotice('Watermark removed from all scenes');
    } else {
      setScenes(prev => prev.map(s => {
        if (s.id === selectedSceneId) {
          const { watermark, ...rest } = s;
          return rest as Scene;
        }
        return s;
      }));
      setProjectNotice('Watermark removed from current scene');
    }
    setTimeout(() => setProjectNotice(null), 2500);
  };

  // Professional Global Hotkeys & NLE Shortcuts
  useStudioShortcuts({
    onTogglePlay: togglePlay,
    onSaveProject: () => {
      handleExportProjectJson();
      setProjectNotice('Saved project snapshot (Ctrl+S)');
      setTimeout(() => setProjectNotice(null), 3000);
    },
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSplit: handleSplitAtPlayhead,
    onDeleteScene: handleDeleteScene,
    onStepBack: () => setCurrentTime(prev => Math.max(0, prev - 1)),
    onStepForward: () => setCurrentTime(prev => Math.min(totalDuration, prev + 1)),
    onJumpStart: () => setCurrentTime(0),
    onJumpEnd: () => setCurrentTime(totalDuration),
    onOpenTemplates: () => setShowSceneTemplatesModal(true),
    onOpenAssets: () => setShowAssetLibrary(prev => !prev),
    onOpenWorkspaces: () => setShowWorkspacesModal(prev => !prev),
    onOpenHelp: () => setShowShortcutsModal(true),
    onFitToWindow: handleFitToWindow,
  });

  // Mouse wheel interaction over timeline: Ctrl/Cmd + Wheel to Zoom, standard Wheel to Scroll
  const handleTimelineWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
      setTimelineZoom(prev => Math.max(0.5, Math.min(3.0, Number((prev + zoomDelta).toFixed(1)))));
    } else if (timelineScrollRef.current) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      timelineScrollRef.current.scrollLeft += delta;
    }
  };

  // Calculate time in seconds from clientX position relative to the timeline container
  const calcTimeFromX = useCallback((clientX: number) => {
    if (!timelineScrollRef.current) return 0;
    const rect = timelineScrollRef.current.getBoundingClientRect();
    // Relative X inside the scroll container minus the 80px left label column offset
    const relativeX = clientX - rect.left + timelineScrollRef.current.scrollLeft - 80;
    let rawTime = Math.max(0, Math.min(totalDuration, relativeX / pixelsPerSecond));

    if (snapEnabled) {
      // Snap to grid interval
      const snappedGrid = Math.round(rawTime / snapGridInterval) * snapGridInterval;
      let nearestPoint = snappedGrid;
      let minDiff = Math.abs(rawTime - snappedGrid);

      // Also snap to nearest scene boundary if within threshold (0.4s)
      let acc = 0;
      const boundaries = [0];
      for (const sc of scenes) {
        acc += sc.duration;
        boundaries.push(acc);
      }
      for (const b of boundaries) {
        const diff = Math.abs(rawTime - b);
        if (diff < minDiff && diff < 0.4) {
          minDiff = diff;
          nearestPoint = b;
        }
      }
      rawTime = nearestPoint;
    }

    return Number(rawTime.toFixed(1));
  }, [totalDuration, pixelsPerSecond, snapEnabled, snapGridInterval, scenes]);

  // Draggable Playhead Scrubbing Pointer Handlers
  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if ('button' in e && e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);

    const newTime = calcTimeFromX(e.clientX);
    setCurrentTime(newTime);

    const handlePointerMove = (moveEv: PointerEvent | MouseEvent) => {
      moveEv.preventDefault();
      const t = calcTimeFromX(moveEv.clientX);
      setCurrentTime(t);
    };

    const handlePointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
  };

  // Scene Template Handlers
  const handleAppendScene = (newScene: Scene) => {
    pushToHistory(scenes);
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneId(newScene.id);
    setCurrentTime(totalDuration);
    setProjectNotice(`Added scene "${newScene.title}" from template!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleInsertAfterScene = (newScene: Scene, afterId: string) => {
    const idx = scenes.findIndex(s => s.id === afterId);
    if (idx === -1) {
      handleAppendScene(newScene);
      return;
    }
    const updated = [...scenes];
    updated.splice(idx + 1, 0, newScene);
    pushToHistory(scenes);
    setScenes(updated);
    setSelectedSceneId(newScene.id);
    let t = 0;
    for (let i = 0; i <= idx; i++) t += updated[i].duration;
    setCurrentTime(t);
    setProjectNotice(`Inserted scene "${newScene.title}" after current clip!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  const handleReplaceScene = (newScene: Scene, targetId: string) => {
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => s.id === targetId ? newScene : s));
    setSelectedSceneId(newScene.id);
    setProjectNotice(`Replaced scene with "${newScene.title}"!`);
    setTimeout(() => setProjectNotice(null), 3000);
  };

  // Load a Starter Template
  const handleLoadTemplate = (tpl: StarterTemplate) => {
    const newScenes: Scene[] = tpl.scenes.map((s, i) => ({
      ...s,
      id: `scene-${tpl.id}-${i + 1}`
    }));
    pushToHistory(scenes);
    setScenes(newScenes);
    setSelectedSceneId(newScenes[0].id);
    setCurrentTime(0);
    setShowTemplatesModal(false);
  };

  // Update selected scene property
  const updateSelectedScene = (field: keyof Scene, value: any) => {
    pushToHistory(scenes);
    setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, [field]: value } : s));
  };

  // Run Export Simulation
  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);

    if (onStartGlobalLoading) {
      onStartGlobalLoading({
        type: 'render',
        title: 'Rendering Production Video...',
        subtitle: `Compositing ${scenes.length} scenes in ${aspectRatio} format with synced audio track`,
        progress: 10,
      });
    }

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setExportProgress(100);
        setIsExporting(false);
        setExportSuccess(true);
        if (onStopGlobalLoading) {
          onStopGlobalLoading();
        }
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Compute technical telemetry and record in 'nepalai-media' Supabase bucket
        const resolutionPx = aspectRatio === '9:16' ? '1080x1920' : aspectRatio === '1:1' ? '1080x1080' : '1920x1080';
        const calculatedSizeMb = Number((totalDuration * 1.25).toFixed(2));
        
        RenderAuditLogger.logRender({
          projectTitle,
          status: 'pass',
          outputResolution: resolutionPx,
          durationSeconds: totalDuration,
          fileSizeBytes: Math.round(calculatedSizeMb * 1024 * 1024),
          fileSizeMb: calculatedSizeMb,
          format: 'mp4',
          codec: 'H.264 / AAC (High Profile Level 4.1)',
          fps: 30,
          apiLatencyMs: 122,
          renderTimeMs: 2450,
          layers: {
            videoClipsCount: scenes.length,
            audioTracksCount: audioTracks.filter(t => !!t.url).length || 1,
            hasWatermarkLogo: Boolean(brandOverlayConfig?.enabled),
            subtitlesCount: subtitles.length,
            transitionsCount: Math.max(0, scenes.length - 1),
          },
          downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        }).then(entry => {
          setLatestAuditEntry(entry);
          setShowRenderSummaryOverlay(true);
        });
      } else {
        setExportProgress(p);
        if (onStartGlobalLoading) {
          onStartGlobalLoading({
            type: 'render',
            title: 'Rendering Production Video...',
            subtitle: `Encoding video frames and audio multiplexing (${p}%)...`,
            progress: p,
          });
        }
      }
    }, 300);
  };

  // Format timecode
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="w-full h-[calc(100vh-4.1rem)] bg-[#07090e] text-slate-100 flex flex-col overflow-hidden select-none -mt-4 -mb-8">
      {/* Hidden File Input for Importing Project JSON */}
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleImportProjectJson}
        accept=".json,.nepalai.json"
        className="hidden"
      />

      {/* Hidden File Inputs for Audio/SFX */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            (Array.from(e.target.files) as File[]).forEach(f => handleAudioUpload(f, 'bgm'));
          }
        }}
      />
      <input
        ref={voFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleAudioUpload(e.target.files[0], 'voiceover');
          }
        }}
      />
      <input
        ref={sfxFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleAudioUpload(e.target.files[0], 'sfx');
          }
        }}
      />

      {/* Auto-Save Session Restore Prompt Banner */}
      {showSessionRestoreBanner && restorableDraftInfo && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-4 py-2 border-b border-indigo-700/80 flex items-center justify-between gap-3 text-xs shrink-0 z-40">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>
              Found draft <strong>"{restorableDraftInfo.title}"</strong> ({restorableDraftInfo.count} scenes) auto-saved at {restorableDraftInfo.savedAt}.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleRestoreAutoSave();
                setShowSessionRestoreBanner(false);
              }}
              className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              Restore Draft
            </button>
            <button
              onClick={() => setShowSessionRestoreBanner(false)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Project Feedback Notification Toast */}
      {projectNotice && (
        <div className="bg-cyan-600 text-slate-950 font-bold px-4 py-1.5 text-xs flex items-center justify-between shadow-md shrink-0 z-40 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{projectNotice}</span>
          </div>
          <button
            onClick={() => setProjectNotice(null)}
            className="text-slate-950 font-bold text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. CapCut Studio Top Bar */}
      <CapCutTopBar
        projectTitle={projectTitle}
        setProjectTitle={setProjectTitle}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        onExport={() => setShowProjectExportModal(true)}
        onNewProject={() => {
          setNewProjectName('Untitled Project');
          setNewProjectRatio(aspectRatio);
          setShowNewProjectModal(true);
        }}
        onClearTimeline={() => {
          pushToHistory(scenes);
          setScenes([]);
          setSelectedSceneId('');
          setCurrentTime(0);
          setIsPlaying(false);
          setProjectNotice('Timeline cleared. Ready for new media clips!');
          setTimeout(() => setProjectNotice(null), 3500);
        }}
        onImportProject={() => projectFileInputRef.current?.click()}
        onSave={() => {
          const exportData = {
            version: '2.0',
            title: projectTitle,
            savedAt: new Date().toISOString(),
            scenes,
            audioTracks,
            subtitles,
            aspectRatio,
            brandOverlayConfig
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.nepalai.json`;
          a.click();
          URL.revokeObjectURL(url);
          setProjectNotice('Saved and downloaded project JSON!');
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onOpenStoryboards={() => setShowAiStoryboardModal(true)}
        autoSaveTime={lastAutoSavedTime || 'Just now'}
      />

      {/* 2. Upper Deck: 3 Non-Overlapping Studio Columns */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-[#07090e]">
        {/* Left: Media / Audio / Text / Effects Asset Browser */}
        <CapCutLeftPanel
          onAddSceneToTimeline={(newScene) => {
            pushToHistory(scenes);
            setScenes(prev => [...prev, newScene]);
            setSelectedSceneId(newScene.id);
            setProjectNotice(`Added "${newScene.title}" to timeline!`);
            setTimeout(() => setProjectNotice(null), 3000);
          }}
          onAddAudioToTimeline={(track) => {
            setAudioTracks(prev => [...prev, track]);
            setSelectedAudioId(track.id);
            setProjectNotice(`Added audio track "${track.title}"!`);
            setTimeout(() => setProjectNotice(null), 3000);
          }}
          selectedSceneId={selectedSceneId}
          onUpdateScene={(sceneId, updatedProps) => {
            pushToHistory(scenes);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updatedProps } : s));
          }}
          onLoadStarterTemplate={handleLoadStarterSequence}
          onOpenImageStudio={onOpenImageStudio}
          onOpenSoraStudio={onOpenSoraStudio}
          onOpenVoiceStudio={() => setShowCharacterConsistencyModal(true)}
          onOpenSubtitleEditor={() => setShowSubtitleModal(true)}
          onOpenSceneTemplates={() => setShowSceneTemplatesModal(true)}
          onOpenBrandWatermark={() => setShowBrandModal(true)}
          scenes={scenes}
          audioTracks={audioTracks}
        />

        {/* Center: Real-Time High-Res Player Canvas */}
        <CapCutPlayerPanel
          scenes={scenes}
          selectedScene={selectedScene || scenes[0] || null}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          currentTime={currentTime}
          totalDuration={totalDuration}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          onPrevScene={handlePrevScene}
          onNextScene={handleNextScene}
          onStepFrame={handleStepFrame}
          onOpenMediaLibrary={() => setShowGlobalMediaLibrary(true)}
          brandOverlayConfig={brandOverlayConfig}
          previewMode={previewMode === 'interactive' ? 'stage' : 'canvas'}
          setPreviewMode={(m) => setPreviewMode(m === 'stage' ? 'interactive' : 'canvas')}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onToggleCurrentTicker={() => {
            const targetScene = selectedScene || scenes[0];
            if (!targetScene) return;
            const currentEnabled = Boolean(targetScene.tickerConfig?.enabled);
            const updatedTicker = {
              ...(targetScene.tickerConfig || {
                badgeText: 'BREAKING',
                headlineText: targetScene.textNepali || targetScene.title || 'Live Broadcast Update',
                speed: 'normal' as const,
                style: 'breaking_red' as const,
              }),
              enabled: !currentEnabled,
            };
            pushToHistory(scenes);
            setScenes(prev => prev.map(s => s.id === targetScene.id ? { ...s, tickerConfig: updatedTicker } : s));
            setProjectNotice(updatedTicker.enabled ? 'Enabled scrolling ticker overlay!' : 'Disabled scrolling ticker overlay!');
            setTimeout(() => setProjectNotice(null), 2500);
          }}
        />

        {/* Right: Inspector Properties Panel */}
        <CapCutInspectorPanel
          selectedScene={selectedScene || scenes[0] || null}
          onUpdateScene={(updatedProps) => {
            const targetId = selectedSceneId || scenes[0]?.id;
            if (!targetId) return;
            pushToHistory(scenes);
            setScenes(prev => prev.map(s => s.id === targetId ? { ...s, ...updatedProps } : s));
          }}
          onDuplicateScene={handleDuplicateScene}
          onDeleteScene={() => {
            if (scenes.length <= 1) {
              setProjectNotice('Cannot delete the last remaining scene');
              setTimeout(() => setProjectNotice(null), 3000);
              return;
            }
            pushToHistory(scenes);
            const remaining = scenes.filter(s => s.id !== selectedSceneId);
            setScenes(remaining);
            setSelectedSceneId(remaining[0]?.id || '');
          }}
          bgmTrack={bgmTrack}
          voTrack={voTrack}
          bgmVolume={bgmVolume}
          setBgmVolume={setBgmVolume}
          voVolume={voVolume}
          setVoVolume={setVoVolume}
        />
      </div>

      {/* 3. Mid Divider: Timeline Edit Toolbar */}
      <CapCutTimelineToolbar
        onSplitClip={handleSplitAtPlayhead}
        onDeleteClip={() => {
          if (scenes.length === 0) return;
          pushToHistory(scenes);
          const remaining = scenes.filter(s => s.id !== selectedSceneId);
          setScenes(remaining);
          setSelectedSceneId(remaining[0]?.id || '');
        }}
        onDuplicateClip={handleDuplicateScene}
        onAddMedia={() => setShowGlobalMediaLibrary(true)}
        onAddAudio={() => setShowAudioAddModal(true)}
        onAddSceneTemplate={() => setShowSceneTemplatesModal(true)}
        zoomLevel={pixelsPerSecond}
        setZoomLevel={(z) => setTimelineZoom(z / 36)}
        isSnapping={snapEnabled}
        setIsSnapping={setSnapEnabled}
        hasSelectedClip={!!selectedScene}
      />

      {/* 4. Bottom Deck: CapCut Multi-Track Timeline */}
      <div className="h-52 sm:h-60 shrink-0 flex flex-col bg-[#090b12]">
        <CapCutTimelineDeck
          scenes={scenes}
          selectedSceneId={selectedSceneId}
          onSelectScene={(id) => {
            setSelectedSceneId(id);
            const idx = scenes.findIndex(s => s.id === id);
            if (idx >= 0) {
              let t = 0;
              for (let i = 0; i < idx; i++) t += scenes[i].duration;
              setCurrentTime(t);
            }
          }}
          onReorderScenes={(newScenes) => {
            pushToHistory(scenes);
            setScenes(newScenes);
          }}
          onUpdateScene={(sceneId, updatedProps) => {
            pushToHistory(scenes);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updatedProps } : s));
          }}
          onDeleteScene={(sceneId) => {
            pushToHistory(scenes);
            const remaining = scenes.filter(s => s.id !== sceneId);
            setScenes(remaining);
            setSelectedSceneId(remaining[0]?.id || '');
          }}
          onDuplicateScene={handleDuplicateScene}
          currentTime={currentTime}
          totalDuration={totalDuration}
          onSeek={(t) => setCurrentTime(t)}
          zoomLevel={pixelsPerSecond}
          audioTracks={audioTracks}
          selectedAudioId={selectedAudioId}
          onSelectAudioId={setSelectedAudioId}
          voTrack={voTrack}
          onAddMedia={() => setShowGlobalMediaLibrary(true)}
          onAddAudio={() => setShowAudioAddModal(true)}
          onOpenSceneTemplates={() => setShowSceneTemplatesModal(true)}
          onOpenImageStudio={onOpenImageStudio}
          onOpenSoraStudio={onOpenSoraStudio}
        />
      </div>

      {/* New Project Dialog Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#0e121d] border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Create New Project</h3>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Nepal Tourism Highlight Reel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Aspect Ratio Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Canvas Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '16:9', label: '16:9', sub: 'YouTube / TV' },
                    { id: '9:16', label: '9:16', sub: 'TikTok / Reel' },
                    { id: '1:1', label: '1:1', sub: 'Instagram' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setNewProjectRatio(r.id as any)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        newProjectRatio === r.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-bold font-mono">{r.label}</span>
                      <span className="text-[10px] text-slate-500">{r.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  pushToHistory(scenes);
                  setProjectTitle(newProjectName.trim() || 'Untitled Project');
                  setAspectRatio(newProjectRatio);
                  setScenes([]);
                  setSelectedSceneId('');
                  setCurrentTime(0);
                  setIsPlaying(false);
                  setShowNewProjectModal(false);
                  setProjectNotice(`Created "${newProjectName || 'Untitled Project'}" with clean timeline!`);
                  setTimeout(() => setProjectNotice(null), 3500);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25 transition cursor-pointer"
              >
                Start Blank Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modular Scene Templates Library Modal */}
      {showSceneTemplatesModal && (
        <SceneTemplatesModal
          aspectRatio={aspectRatio}
          selectedSceneId={selectedSceneId}
          onAppendScene={handleAppendScene}
          onInsertAfterScene={handleInsertAfterScene}
          onReplaceScene={handleReplaceScene}
          onClose={() => setShowSceneTemplatesModal(false)}
        />
      )}

      {/* Asset Library Sidebar Drawer */}
      <AssetLibrarySidebar
        isOpen={showAssetLibrary}
        onClose={() => setShowAssetLibrary(false)}
        onApplyWatermark={handleApplyWatermark}
        onRemoveWatermark={handleRemoveWatermark}
        currentWatermark={selectedScene?.watermark}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Team Workspaces & Collaboration Modal */}
      <WorkspacesModal
        isOpen={showWorkspacesModal}
        onClose={() => setShowWorkspacesModal(false)}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          setProjectNotice(`Switched to workspace "${ws.name}"!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Render Queue Modal */}
      <RenderQueueModal
        isOpen={showRenderQueueModal}
        onClose={() => setShowRenderQueueModal(false)}
        currentScenes={scenes}
        projectTitle={projectTitle}
        onLoadRenderedVideo={(url) => {
          setProjectNotice(`Loaded rendered video from queue into preview!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Transition Manager Modal */}
      {showTransitionManagerModal && scenes[transitionTargetSceneIndex] && (
        <TransitionManagerModal
          isOpen={showTransitionManagerModal}
          onClose={() => setShowTransitionManagerModal(false)}
          sceneA={scenes[transitionTargetSceneIndex]}
          sceneB={scenes[transitionTargetSceneIndex + 1]}
          sceneIndex={transitionTargetSceneIndex}
          onUpdateTransition={(sceneId, type, duration) => {
            pushToHistory(scenes);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, transition: type, transitionDuration: duration } : s));
            setProjectNotice(`Updated transition to ${type} (${duration}s)`);
            setTimeout(() => setProjectNotice(null), 2500);
          }}
        />
      )}

      {/* AI Script-to-Storyboard Generator Modal */}
      <AiStoryboardModal
        isOpen={showAiStoryboardModal}
        onClose={() => setShowAiStoryboardModal(false)}
        onApplyStoryboard={(newScenes) => {
          pushToHistory(scenes);
          setScenes(newScenes);
          setSelectedSceneId(newScenes[0]?.id || '');
          setCurrentTime(0);
          setProjectNotice('Successfully imported AI Storyboard into timeline!');
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Project Export Modal */}
      <ProjectExportModal
        isOpen={showProjectExportModal}
        onClose={() => setShowProjectExportModal(false)}
        scenes={scenes}
        projectTitle={projectTitle}
        totalDuration={totalDuration}
        defaultAspectRatio={aspectRatio}
        audioTracks={audioTracks}
        brandOverlayConfig={brandOverlayConfig}
        subtitles={subtitles}
      />

      {/* Global Media Library Modal */}
      <GlobalMediaLibraryModal
        isOpen={showGlobalMediaLibrary}
        onClose={() => setShowGlobalMediaLibrary(false)}
        onAddSceneToTimeline={(newScene) => {
          pushToHistory(scenes);
          setScenes(prev => [...prev, newScene]);
          setSelectedSceneId(newScene.id);
          setProjectNotice(`Added "${newScene.title}" to timeline!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Storyboard PDF Printable Export Modal */}
      <StoryboardPdfModal
        isOpen={showStoryboardPdfModal}
        onClose={() => setShowStoryboardPdfModal(false)}
        projectTitle={projectTitle}
        scenes={scenes}
        aspectRatio={aspectRatio}
      />

      {/* Scene Preview Modal */}
      {previewModalSceneIndex !== null && scenes[previewModalSceneIndex] && (
        <ScenePreviewModal
          isOpen={previewModalSceneIndex !== null}
          onClose={() => setPreviewModalSceneIndex(null)}
          scene={scenes[previewModalSceneIndex]}
          sceneIndex={previewModalSceneIndex}
          totalScenes={scenes.length}
          onPrevScene={() => setPreviewModalSceneIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
          onNextScene={() => setPreviewModalSceneIndex(prev => prev !== null && prev < scenes.length - 1 ? prev + 1 : prev)}
          onUpdateSceneNotes={(newNotes) => {
            pushToHistory(scenes);
            const targetIdx = previewModalSceneIndex;
            if (targetIdx !== null && scenes[targetIdx]) {
              const updated = [...scenes];
              updated[targetIdx] = { ...updated[targetIdx], notes: newNotes };
              setScenes(updated);
              setProjectNotice(`Saved notes for Scene ${targetIdx + 1}`);
              setTimeout(() => setProjectNotice(null), 2500);
            }
          }}
        />
      )}

      {/* Dedicated YouTube Video & Shorts Publisher Modal */}
      <YouTubePublisherModal
        isOpen={showYouTubePublisherModal}
        onClose={() => setShowYouTubePublisherModal(false)}
        projectTitle={projectTitle}
        scenes={scenes}
        aspectRatio={aspectRatio}
        totalDuration={totalDuration}
        initialVideoUrl={selectedScene?.mediaUrl}
        isExportSuccess={exportSuccess}
        isTimelineReady={scenes.some(s => !!s.mediaUrl)}
      />

      {/* Social Media Publisher Suite Modal */}
      <SocialPublisherModal
        isOpen={showSocialPublisherModal}
        onClose={() => setShowSocialPublisherModal(false)}
        projectTitle={projectTitle}
        scenes={scenes}
        aspectRatio={aspectRatio}
        totalDuration={totalDuration}
      />

      {/* Render Preset Selection Modal */}
      <RenderPresetModal
        isOpen={showRenderPresetModal}
        onClose={() => setShowRenderPresetModal(false)}
        activePreset={activeRenderPreset}
        onSelectPreset={(preset) => {
          setActiveRenderPreset(preset);
          setAspectRatio(preset.aspectRatio);
          setProjectNotice(`Applied preset: ${preset.name} (${preset.resolution}, ${preset.fps} FPS)`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onStartExportWithPreset={(preset) => {
          setActiveRenderPreset(preset);
          setAspectRatio(preset.aspectRatio);
          setShowExportModal(true);
        }}
      />

      {/* Auto-Generate Subtitles & Visual SRT Editor Modal */}
      <SubtitleEditorModal
        isOpen={showSubtitleModal}
        onClose={() => setShowSubtitleModal(false)}
        scenes={scenes}
        subtitles={subtitles}
        onSaveSubtitles={(updatedSubtitles, burnOpts) => {
          setSubtitles(updatedSubtitles);
          setSubtitleBurnOptions(burnOpts);
          setProjectNotice(`Applied ${updatedSubtitles.length} subtitle captions to sequence!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Brand Overlay Watermark Modal */}
      <BrandOverlayModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        brandConfig={brandOverlayConfig}
        onSaveBrandConfig={(config) => {
          setBrandOverlayConfig(config);
          setProjectNotice(config.enabled ? `Watermark overlay active at ${config.position}` : 'Watermark disabled');
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        aspectRatio={aspectRatio}
      />

      {/* Startup "Restore Unsaved Session" Dialog */}
      {showSessionRestoreModal && restorableDraftInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Restore Unsaved Session?</h3>
                <p className="text-xs text-slate-400">Previous timeline state detected from browser storage.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Project Title:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{restorableDraftInfo.title}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Last Auto-Saved:</span>
                <span className="font-mono text-indigo-300">{restorableDraftInfo.savedAt}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Scenes Count:</span>
                <span className="font-mono text-emerald-400">{restorableDraftInfo.count} scenes</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  sessionStorage.removeItem('nepalai_video_project_autosave');
                  localStorage.removeItem('nepalai_video_project_autosave');
                  setShowSessionRestoreModal(false);
                  setShowSessionRestoreBanner(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Discard Draft
              </button>

              <button
                onClick={handleRestoreAutoSave}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Color Match Utility Modal */}
      <AutoColorMatchModal
        isOpen={showColorMatchModal}
        onClose={() => setShowColorMatchModal(false)}
        scenes={scenes}
        selectedSceneId={selectedSceneId}
        onApplyColorAdjustments={handleApplyColorAdjustments}
        onBatchApplyColorAdjustments={handleBatchApplyColorAdjustments}
      />

      {/* Frame Inspector & Precision Cut Point Modal */}
      <FrameInspectorModal
        isOpen={showFrameInspectorModal}
        onClose={() => setShowFrameInspectorModal(false)}
        scene={selectedScene || null}
        onUpdateSceneDuration={handleUpdateSceneDuration}
        onSplitSceneAtTime={handleSplitSceneAtTime}
      />

      {/* Scene Template Library Modal */}
      <SceneLibraryModal
        isOpen={showSceneLibraryModal}
        onClose={() => setShowSceneLibraryModal(false)}
        currentSceneToSave={selectedScene || null}
        onInsertSceneFromLibrary={handleInsertSceneFromLibrary}
        onReplaceSelectedScene={handleReplaceSelectedScene}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersionHistoryModal}
        onClose={() => setShowVersionHistoryModal(false)}
        projectId={`project_${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
        scenes={scenes}
        user={currentUser}
        onRestoreVersion={(restoredScenes, _, title) => {
          pushToHistory(scenes);
          setScenes(restoredScenes);
          if (restoredScenes[0]) setSelectedSceneId(restoredScenes[0].id);
          setCurrentTime(0);
          setProjectNotice(`Restored timeline to "${title}" (${restoredScenes.length} scenes)`);
          setTimeout(() => setProjectNotice(null), 4000);
        }}
      />

      {/* Production Asset & Sound Library Modal */}
      <AssetAndSoundLibraryModal
        isOpen={showAssetAndSoundLibraryModal}
        onClose={() => setShowAssetAndSoundLibraryModal(false)}
        onAddAudioTrack={(track) => {
          setAudioTracks(prev => [...prev, track]);
          setSelectedAudioId(track.id);
          setProjectNotice(`Added audio track "${track.title}" to timeline!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onAddSceneToTimeline={(newSceneData) => {
          const newScene: Scene = {
            ...newSceneData,
            id: 'scene-' + Math.random().toString(36).substring(2, 9),
          };
          pushToHistory(scenes);
          setScenes(prev => [...prev, newScene]);
          setSelectedSceneId(newScene.id);
          setProjectNotice(`Added stock scene "${newScene.title}" to timeline!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onApplyWatermarkToSelectedScene={(wm) => {
          if (!selectedScene) return;
          pushToHistory(scenes);
          setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, watermark: wm, brandLogo: wm } : s));
          setProjectNotice(`Applied watermark "${wm.name}" to selected scene!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onApplyTickerToSelectedScene={(ticker) => {
          if (!selectedScene) return;
          pushToHistory(scenes);
          setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, tickerConfig: ticker } : s));
          setProjectNotice(`Attached scrolling news ticker to selected scene!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        onApplyTextStyleToSelectedScene={(style, anim) => {
          if (!selectedScene) return;
          pushToHistory(scenes);
          setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, textStyle: style, textAnimation: anim } : s));
          setProjectNotice(`Applied custom text style & animation to selected scene!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
        selectedScene={selectedScene}
      />

      {/* Pre-Render Validation Diagnostic Modal */}
      {validationReport && (
        <PreRenderValidationModal
          isOpen={showPreRenderValidationModal}
          onClose={() => setShowPreRenderValidationModal(false)}
          report={validationReport}
          onConfirmRender={() => {
            setShowPreRenderValidationModal(false);
            setShowExportModal(true);
          }}
        />
      )}

      {/* Text Styling & Lower-Third Toolkit Modal */}
      <TextStylingToolkitModal
        isOpen={showTextStylingToolkitModal}
        onClose={() => setShowTextStylingToolkitModal(false)}
        selectedScene={selectedScene || null}
        onApplyTextToolkit={(sceneId, updates) => {
          pushToHistory(scenes);
          setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updates } : s));
          setProjectNotice(`Updated kinetic typography and lower-third for scene!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Module 1: Character Consistency & FaceID Biometric Modal */}
      <CharacterConsistencyModal
        isOpen={showCharacterConsistencyModal}
        onClose={() => setShowCharacterConsistencyModal(false)}
        onSaveAvatar={(avatar) => {
          setActiveCharacterToken(avatar.consistencyToken);
          setProjectNotice(`Character "${avatar.name}" locked for 100% facial consistency across studio!`);
          setTimeout(() => setProjectNotice(null), 4000);
        }}
      />

      {/* Module 2: Advanced AI Video & Audio Generation (Sora-2 12s Frame Intervals) */}
      <ScriptToSceneModal
        isOpen={showScriptToSceneModal}
        onClose={() => setShowScriptToSceneModal(false)}
        onAddScenesToTimeline={(newScenes) => {
          pushToHistory(scenes);
          setScenes(prev => [...prev, ...newScenes]);
          if (newScenes[0]) setSelectedSceneId(newScenes[0].id);
          setProjectNotice(`Sequenced ${newScenes.length} 12-second Sora scenes into NLE timeline!`);
          setTimeout(() => setProjectNotice(null), 4000);
        }}
        lockedCharacterToken={activeCharacterToken}
      />

      {/* Module 3: Pro-Grade NLE AI Media Processing Suite (BG Remover, Smart Crop, 4K Super-Resolution) */}
      <AiMediaProcessingModal
        isOpen={showAiMediaProcessingModal}
        onClose={() => setShowAiMediaProcessingModal(false)}
        targetScene={selectedScene || scenes[0] || null}
        onApplyProcessedMedia={(sceneId, updatedProps) => {
          pushToHistory(scenes);
          setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...updatedProps } : s));
          setProjectNotice(`Applied AI processing (BG Cutout / 4K Super-Res) to scene!`);
          setTimeout(() => setProjectNotice(null), 3000);
        }}
      />

      {/* Module 4: Automated Ad & Template Builder */}
      <AutomatedAdBuilderModal
        isOpen={showAutomatedAdBuilderModal}
        onClose={() => setShowAutomatedAdBuilderModal(false)}
        onDeployAdToTimeline={(adScenes, audioTrack) => {
          pushToHistory(scenes);
          setScenes(prev => [...prev, ...adScenes]);
          if (audioTrack) {
            setAudioTracks(prev => [...prev, audioTrack]);
          }
          if (adScenes[0]) setSelectedSceneId(adScenes[0].id);
          setProjectNotice(`Deployed 3-scene high-converting brand commercial to timeline!`);
          setTimeout(() => setProjectNotice(null), 4000);
        }}
        lockedCharacterToken={activeCharacterToken}
      />

      {/* Module 5: Multi-Channel Social Publisher */}
      <SocialPublisherModal
        isOpen={showSocialPublisherModal}
        onClose={() => setShowSocialPublisherModal(false)}
        projectTitle={projectTitle}
        scenes={scenes}
        aspectRatio={aspectRatio}
        totalDuration={totalDuration}
      />

      {/* Render Technical Summary & Supabase Audit Overlay */}
      <RenderSummaryOverlay
        isOpen={showRenderSummaryOverlay}
        onClose={() => setShowRenderSummaryOverlay(false)}
        auditEntry={latestAuditEntry}
        onPostToYouTube={() => setShowYouTubePublisherModal(true)}
        onPostToSocial={() => setShowSocialPublisherModal(true)}
      />

      {/* Hidden Multi-Track Audio Elements for Real-Time Playback Synchronization */}
      <audio
        ref={audioRef}
        src={bgmTrack?.url}
        preload="auto"
        muted={isMuted}
        className="hidden"
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            if (isPlaying) audioRef.current.play().catch(() => {});
          }
        }}
      />
      <audio
        ref={voAudioRef}
        src={voTrack?.url}
        preload="auto"
        muted={isMuted}
        className="hidden"
      />
      <audio
        ref={sfxAudioRef}
        src={sfxTrack?.url}
        preload="auto"
        muted={isMuted}
        className="hidden"
      />
    </div>
  );
};
