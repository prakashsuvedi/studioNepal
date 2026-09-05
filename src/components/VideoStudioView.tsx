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
  StudioWorkspace
} from '../types';
import { STARTER_TEMPLATES, INITIAL_AUDIO_TRACKS } from '../data';
import { SocialPublisherModal } from './SocialPublisherModal';
import { RenderPresetModal, RENDER_PRESETS, RenderPreset } from './RenderPresetModal';
import { SubtitleEditorModal, SubtitleItem, SubtitleBurnOptions } from './SubtitleEditorModal';
import { BrandOverlayModal, BrandOverlayConfig, WATERMARK_PRESETS } from './BrandOverlayModal';
import { AutoColorMatchModal } from './AutoColorMatchModal';
import { FrameInspectorModal } from './FrameInspectorModal';
import { SceneLibraryModal } from './SceneLibraryModal';
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
  Download, 
  Check, 
  Film, 
  Volume2, 
  Sliders, 
  Type, 
  Palette, 
  Layers, 
  Share2,
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
  Database
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
import { TextStylingToolkitModal } from './TextStylingToolkitModal';
import { MediaLibrary, MediaAssetItem } from './MediaLibrary';
import { validateTimelineBeforeRender } from '../services/timelineValidationService';
import { TextStylePreset, TextAnimationOption, TickerConfig, TimelineValidationReport, KineticTypographyConfig } from '../types';
import { History } from 'lucide-react';
import { UserSession } from '../types';

interface VideoStudioViewProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  currentUser?: UserSession | null;
  onOpenImageStudio: () => void;
  onOpenSoraStudio: () => void;
  onStartGlobalLoading?: (info: { title: string; subtitle?: string; type?: 'video' | 'image' | 'voice' | 'render' | 'hamroai'; progress?: number }) => void;
  onStopGlobalLoading?: () => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  scenes,
  setScenes,
  currentUser = null,
  onOpenImageStudio,
  onOpenSoraStudio,
  onStartGlobalLoading,
  onStopGlobalLoading,
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
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGridInterval, setSnapGridInterval] = useState<number>(0.5); // 0.25s, 0.5s, 1s, 2s
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  
  // Audio state
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>(INITIAL_AUDIO_TRACKS);
  const [selectedAudioId, setSelectedAudioId] = useState<string>(INITIAL_AUDIO_TRACKS[0]?.id || '');
  const [showAssetAndSoundLibraryModal, setShowAssetAndSoundLibraryModal] = useState(false);

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
  const [showRenderPresetModal, setShowRenderPresetModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showSessionRestoreModal, setShowSessionRestoreModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Subtitles & Brand Overlay State
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hidden File Input for Importing Project JSON */}
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleImportProjectJson}
        accept=".json,.nepalai.json"
        className="hidden"
      />

      {/* Auto-Save Session Restore Prompt Banner */}
      {showSessionRestoreBanner && restorableDraftInfo && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl border border-indigo-700/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-indigo-600/40 rounded-xl shrink-0 border border-indigo-400/30">
              <RotateCcw className="w-5 h-5 text-indigo-300 animate-spin-once" />
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-white text-sm block flex items-center gap-2">
                <span>Auto-Saved Session Draft Detected</span>
                <span className="px-2 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] border border-indigo-400/30">
                  {restorableDraftInfo.count} Scenes
                </span>
              </span>
              <p className="text-indigo-200">
                Found previous project draft <strong className="text-white">"{restorableDraftInfo.title}"</strong> auto-saved at {restorableDraftInfo.savedAt}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                handleRestoreAutoSave();
                setShowSessionRestoreBanner(false);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-100" />
              <span>Restore Draft Session</span>
            </button>
            <button
              onClick={() => setShowSessionRestoreBanner(false)}
              className="px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold border border-indigo-700/60 transition"
            >
              Dismiss / Keep Current
            </button>
          </div>
        </div>
      )}

      {/* Project Feedback Notification Banner */}
      {projectNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{projectNotice}</span>
          </div>
          <button
            onClick={() => setProjectNotice(null)}
            className="text-emerald-100 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-emerald-700/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Step Production Stepper & Project Command Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Project Title & Auto-Save Badge */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                    autoFocus
                    className="text-sm font-bold text-slate-900 border-b-2 border-indigo-600 bg-slate-50 px-2 py-0.5 rounded outline-none w-48 sm:w-60"
                  />
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="text-xs text-indigo-600 font-bold px-1 hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 group cursor-pointer"
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to rename project"
                >
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {projectTitle}
                  </h2>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              )}
              {/* Active Team Workspace Badge */}
              <button
                onClick={() => setShowWorkspacesModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 text-[11px] font-medium transition cursor-pointer"
                title="Active workspace & shared folder - Click to manage or switch"
              >
                <span>{activeWorkspace.icon}</span>
                <span className="font-semibold">{activeWorkspace.name}</span>
                <span className="text-indigo-300">/</span>
                <span className="text-indigo-600">{activeWorkspace.folders[0]?.name || 'Main'}</span>
              </button>

              {/* Realtime Supabase Presence Component */}
              <RealtimePresence
                projectId={`project_${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                user={currentUser}
                currentSceneId={selectedSceneId}
                onFocusScene={(sceneId) => setSelectedSceneId(sceneId)}
              />
            </div>

            {/* Auto-Save Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {isAutoSaving ? (
                <span className="flex items-center gap-1 text-amber-600 font-medium text-[11px]">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Auto-saving...</span>
                </span>
              ) : lastAutoSavedTime ? (
                <span className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Auto-saved at {lastAutoSavedTime}</span>
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">Auto-save active</span>
              )}

              {hasExistingAutoSave && (
                <button
                  onClick={handleRestoreAutoSave}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 flex items-center gap-0.5 ml-1 transition-colors"
                  title="Restore previous auto-saved project state"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Restore</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full xl:w-auto justify-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setCurrentStep('story')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentStep === 'story'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              currentStep === 'story' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>1</span>
            <span>Build Story</span>
          </button>

          <span className="text-slate-400 text-xs">→</span>

          <button
            onClick={() => setCurrentStep('polish')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentStep === 'polish'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              currentStep === 'polish' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>2</span>
            <span>Polish Edit</span>
          </button>

          <span className="text-slate-400 text-xs">→</span>

          <button
            onClick={() => {
              setCurrentStep('export');
              setShowProjectExportModal(true);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentStep === 'export'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              currentStep === 'export' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
            }`}>3</span>
            <span>Export & Share</span>
          </button>
        </div>

        {/* Top Project & Template Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          {/* Global Media Library Trigger */}
          <button
            onClick={() => setShowGlobalMediaLibrary(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Open Global Media Library (Uploads, AI Images, Sora Videos)"
          >
            <Film className="w-3.5 h-3.5 text-indigo-600" />
            <span>Media Library</span>
          </button>

          {/* Asset Library Trigger */}
          <button
            onClick={() => setShowAssetLibrary(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Open Asset Library (Watermarks, logos, brand graphics) - Shortcut: B"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Asset Library</span>
          </button>

          {/* Workspaces & Team Folders Trigger */}
          <button
            onClick={() => setShowWorkspacesModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Workspaces & Shared Folders - Shortcut: W"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Workspaces</span>
          </button>

          {/* Version History Trigger */}
          <button
            onClick={() => setShowVersionHistoryModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Open Supabase Storage Version History & Checkpoints"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Version History</span>
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="px-2 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
            title="Keyboard Shortcuts Cheatsheet - Shortcut: ?"
          >
            <Command className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded border">?</span>
          </button>

          {/* Scene Templates Trigger */}
          <button
            onClick={() => setShowSceneTemplatesModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Browse modular scene templates (Intro, Outro, Lower-Thirds, News Banners) - Shortcut: T"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
            <span>Templates</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">8</span>
          </button>

          {/* Render Queue */}
          <button
            onClick={() => setShowRenderQueueModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Batch render queue for multi-scene projects"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Render Queue</span>
          </button>

          {/* AI Storyboard Generator */}
          <button
            onClick={() => setShowAiStoryboardModal(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="AI Script-to-Storyboard Generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Storyboard</span>
          </button>

          {/* Storyboard PDF Printable Export */}
          <button
            onClick={() => setShowStoryboardPdfModal(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Generate and download a static 'Storyboard' PDF capturing thumbnails & scene metadata for client review"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Storyboard PDF</span>
          </button>

          {/* Save Project to JSON */}
          <button
            onClick={handleExportProjectJson}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Export project scenes, title and metadata as a JSON file to save progress locally (Ctrl+S)"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Save</span> JSON
          </button>

          {/* Import Project from JSON */}
          <button
            onClick={() => projectFileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Load project progress from a saved .nepalai.json file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Open</span> JSON
          </button>

          {/* Starter Project Templates */}
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            title="Load starter project packs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Kits</span>
          </button>

          {/* Export Render Presets Button */}
          <button
            onClick={() => setShowRenderPresetModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Select professional export render presets (TikTok 9:16, YouTube 16:9, IG Reel)"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Presets</span>
          </button>

          {/* Auto-Subtitles Button */}
          <button
            onClick={() => setShowSubtitleModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Auto-generate subtitles from voice tracks and edit visual .SRT transcriptions"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Subtitles</span>
          </button>

          {/* Brand Overlay Watermark Button */}
          <button
            onClick={() => setShowBrandModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure fixed brand watermark overlay and logo stamp"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Watermark</span>
          </button>

          {/* Auto-Color Match Button */}
          <button
            onClick={() => setShowColorMatchModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Normalize exposure and color temperature across consecutive scenes"
          >
            <Palette className="w-3.5 h-3.5 text-violet-600" />
            <span>Color Match</span>
          </button>

          {/* Frame Inspector Button */}
          <button
            onClick={() => setShowFrameInspectorModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Step frame-by-frame through selected scene for precision cut points"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-600" />
            <span>Frame Inspector</span>
          </button>

          {/* Scene Library Button */}
          <button
            onClick={() => setShowSceneLibraryModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Save and reuse common scene templates across projects"
          >
            <FolderPlus className="w-3.5 h-3.5 text-teal-600" />
            <span>Scene Library</span>
          </button>

          {/* Social Publisher Button */}
          <button
            onClick={() => setShowSocialPublisherModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm shadow-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Post output directly to YouTube, X, TikTok, & Instagram Reels"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-200" />
            <span>Post to Socials</span>
          </button>

          {/* Production Export Button */}
          <button
            onClick={handleInitiatePreRenderCheck}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Video</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid: Stage Preview & Scene Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Stage Preview Canvas */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
          {/* Stage Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Stage Preview</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200/60 max-w-[150px] truncate">
                {selectedScene ? selectedScene.title : 'No scene'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Text Styling & Kinetic Typography Toolkit Button */}
              <button
                type="button"
                onClick={() => setShowTextStylingToolkitModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                title="Open Kinetic Typography & Lower-Third Generator"
              >
                <Type className="w-3.5 h-3.5 text-purple-200" />
                <span>Text Toolkit</span>
              </button>

              {/* Asset & Sound Library Button */}
              <button
                type="button"
                onClick={() => setShowAssetAndSoundLibraryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                title="Browse predefined sounds, BGM, SFX, tickers, watermarks, and text styles"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Asset & Sound Library</span>
              </button>

              {/* Proxy Rendering Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsProxyMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                  isProxyMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title="Enable low-resolution proxy mode for real-time 60fps timeline editing performance"
              >
                <Zap className={`w-3.5 h-3.5 ${isProxyMode ? 'fill-slate-950' : 'text-amber-500'}`} />
                <span>{isProxyMode ? '⚡ Proxy 360p Active' : 'Proxy Mode'}</span>
              </button>

              {/* Preview Mode Switcher (Canvas API vs Interactive DOM) */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('canvas')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-semibold ${
                    previewMode === 'canvas'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Canvas API real-time proxy engine: renders crossfades, wipes, and video proxies at 60fps"
                >
                  <Activity className="w-3 h-3" />
                  <span>Live Canvas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('interactive')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-semibold ${
                    previewMode === 'interactive'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Interactive DOM Stage with direct element overlays"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Stage DOM</span>
                </button>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    aspectRatio === '16:9' ? 'bg-indigo-600 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="16:9 Cinema / YouTube"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="text-[10px]">16:9</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    aspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="9:16 TikTok / Reels"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="text-[10px]">9:16</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    aspectRatio === '1:1' ? 'bg-indigo-600 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="1:1 Square"
                >
                  <span className="text-[10px] font-bold">1:1</span>
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Box: Either Live Canvas API Proxy or Interactive Stage */}
          <div 
            className="w-full flex items-center justify-center bg-slate-950 rounded-xl p-2 min-h-[340px] relative overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData('application/json');
              if (raw) {
                try {
                  const asset = JSON.parse(raw);
                  if (asset && asset.url) {
                    handleApplyWatermark({
                      assetId: asset.id,
                      url: asset.url,
                      name: asset.name,
                      position: 'bottom-right',
                      opacity: 0.85,
                      scale: 1,
                    });
                  }
                } catch (err) {}
              }
            }}
          >
            {/* Proxy Mode Active Badge Overlay */}
            {isProxyMode && (
              <div className="absolute top-3 left-3 z-30 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-mono text-[10px] font-extrabold shadow-lg flex items-center gap-1.5 border border-amber-300">
                <Zap className="w-3 h-3 fill-slate-950" />
                <span>PROXY 360p ACTIVE (FAST TIMELINE EDITING)</span>
              </div>
            )}

            {previewMode === 'canvas' ? (
              <LivePreviewCanvas
                scenes={scenes}
                currentTime={currentTime}
                isPlaying={isPlaying}
                aspectRatio={aspectRatio}
                brandOverlayConfig={brandOverlayConfig}
                onTogglePlay={togglePlay}
                selectedSceneId={selectedSceneId}
                onSelectScene={(id) => setSelectedSceneId(id)}
              />
            ) : (
              <div 
                className={`relative bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center ${
                  aspectRatio === '16:9' 
                    ? 'w-full aspect-video max-w-2xl' 
                    : aspectRatio === '9:16'
                    ? 'h-[360px] aspect-[9/16]'
                    : 'w-[320px] aspect-square'
                }`}
              >
                {selectedScene?.mediaUrl ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={selectedScene.mediaUrl}
                      alt={selectedScene.title}
                      referrerPolicy="no-referrer"
                      style={selectedScene.colorAdjustments ? {
                        filter: `brightness(${100 + (selectedScene.colorAdjustments.brightness || 0) + (selectedScene.colorAdjustments.exposure || 0) * 0.5}%) contrast(${100 + (selectedScene.colorAdjustments.contrast || 0)}%) saturate(${100 + (selectedScene.colorAdjustments.saturation || 0)}%) sepia(${(selectedScene.colorAdjustments.colorTemp || 0) > 0 ? (selectedScene.colorAdjustments.colorTemp || 0) * 0.2 : 0}%) hue-rotate(${(selectedScene.colorAdjustments.tint || 0) * 0.5}deg)`
                      } : undefined}
                      className={`w-full h-full object-cover transition-transform duration-1000 ${
                        isPlaying
                          ? selectedScene.motion === 'pan_right'
                            ? 'scale-110 translate-x-4'
                            : selectedScene.motion === 'zoom_in'
                            ? 'scale-125'
                            : selectedScene.motion === 'zoom_out'
                            ? 'scale-100'
                            : selectedScene.motion === 'dolly'
                            ? 'scale-115 translate-y-2'
                            : 'scale-105'
                          : 'scale-100'
                      } ${
                        selectedScene.filter === 'cinematic' ? 'contrast-125 saturate-110' :
                        selectedScene.filter === 'warm' ? 'sepia-[0.3] saturate-125' :
                        selectedScene.filter === 'cool' ? 'hue-rotate-15 saturate-90' :
                        selectedScene.filter === 'vibrant' ? 'saturate-150 contrast-110' : ''
                      }`}
                    />
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No media generated yet.</p>
                  </div>
                )}

                {/* Subtitle / Devanagari text overlay */}
                {(selectedScene?.textOverlay || selectedScene?.textNepali) && (
                  <div 
                    className={`absolute inset-x-4 pointer-events-none text-center px-4 py-2 transition-all ${
                      selectedScene.textPosition === 'top' 
                        ? 'top-4' 
                        : selectedScene.textPosition === 'center'
                        ? 'top-1/2 -translate-y-1/2'
                        : 'bottom-4'
                    }`}
                  >
                    <div className="inline-block bg-black/75 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-white/10 shadow-lg">
                      {selectedScene.textNepali && (
                        <p className="font-['Mukta'] font-semibold text-sm sm:text-base text-amber-300 drop-shadow">
                          {selectedScene.textNepali}
                        </p>
                      )}
                      {selectedScene.textOverlay && (
                        <p 
                          style={{ color: selectedScene.textColor || '#ffffff' }}
                          className="text-xs sm:text-sm font-medium tracking-wide drop-shadow"
                        >
                          {selectedScene.textOverlay}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Scene Watermark / Brand Stamp */}
                {selectedScene?.watermark ? (
                  <div
                    className={`absolute pointer-events-none transition-all z-20 ${
                      selectedScene.watermark.position === 'top-left' ? 'top-3 left-3' :
                      selectedScene.watermark.position === 'top-right' ? 'top-3 right-3' :
                      selectedScene.watermark.position === 'bottom-left' ? 'bottom-3 left-3' :
                      selectedScene.watermark.position === 'bottom-right' ? 'bottom-3 right-3' :
                      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    }`}
                    style={{
                      opacity: selectedScene.watermark.opacity,
                      transform: `scale(${selectedScene.watermark.scale})`,
                    }}
                  >
                    <img
                      src={selectedScene.watermark.url}
                      alt={selectedScene.watermark.name}
                      className="max-h-12 max-w-28 object-contain drop-shadow-md"
                    />
                  </div>
                ) : brandOverlayConfig.enabled ? (
                  <div 
                    className={`absolute pointer-events-none transition-all z-20 flex items-center gap-1.5 ${
                      brandOverlayConfig.position === 'top-left' ? 'top-3 left-3' :
                      brandOverlayConfig.position === 'top-right' ? 'top-3 right-3' :
                      brandOverlayConfig.position === 'bottom-left' ? 'bottom-3 left-3' :
                      'bottom-3 right-3'
                    }`}
                    style={{
                      opacity: brandOverlayConfig.opacityPercent / 100,
                      transform: `scale(${brandOverlayConfig.scalePercent / 20})`,
                    }}
                  >
                    <img
                      src={brandOverlayConfig.logoUrl}
                      alt="Brand Watermark"
                      className="w-6 h-6 rounded-full object-cover border border-amber-400 shadow"
                    />
                    {brandOverlayConfig.showBrandText && brandOverlayConfig.brandText && (
                      <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        {brandOverlayConfig.brandText}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/50 text-[10px] font-semibold text-white/70 border border-white/10">
                    NepalAI Studio
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Media Action Bar under Canvas */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Generate for this scene:</span>
              <button
                onClick={onOpenImageStudio}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Azure GPT-Image</span>
              </button>
              <button
                onClick={onOpenSoraStudio}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 flex items-center gap-1 transition-colors"
              >
                <Film className="w-3 h-3 text-purple-600" />
                <span>Azure Sora Video</span>
              </button>
            </div>

            <div className="text-xs font-mono text-slate-500">
              {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Selected-Scene Inspector OR Media Library */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRightTab('inspector')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                  rightTab === 'inspector'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab('medialib')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition ${
                  rightTab === 'medialib'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Production Assets</span>
              </button>
            </div>

            {rightTab === 'inspector' && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-100">
                {selectedScene?.id}
              </span>
            )}
          </div>

          {rightTab === 'medialib' ? (
            <MediaLibrary
              onAddAudioTrack={(track) => {
                setAudioTracks(prev => [...prev, track]);
                setSelectedAudioId(track.id);
                setProjectNotice(`Added audio track "${track.title}"!`);
                setTimeout(() => setProjectNotice(null), 3000);
              }}
              onAddScene={(newSceneData) => {
                const newScene: Scene = {
                  ...newSceneData,
                  id: 'scene-' + Math.random().toString(36).substring(2, 9),
                };
                pushToHistory(scenes);
                setScenes(prev => [...prev, newScene]);
                setSelectedSceneId(newScene.id);
                setProjectNotice(`Added asset scene "${newScene.title}" to timeline!`);
                setTimeout(() => setProjectNotice(null), 3000);
              }}
              onApplyWatermark={(wm) => {
                if (!selectedScene) return;
                pushToHistory(scenes);
                setScenes(prev => prev.map(s => s.id === selectedSceneId ? { ...s, watermark: wm, brandLogo: wm } : s));
                setProjectNotice(`Applied watermark "${wm.name}"!`);
                setTimeout(() => setProjectNotice(null), 3000);
              }}
            />
          ) : selectedScene ? (
            <div className="space-y-4 text-xs overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
              {/* Scene Title */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Scene Title</label>
                <input
                  type="text"
                  value={selectedScene.title}
                  onChange={e => updateSelectedScene('title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                />
              </div>

              {/* Duration Slider with Snap Grid Support */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <label className="font-semibold flex items-center gap-1">
                    <span>Duration</span>
                    {snapEnabled && (
                      <span className="text-[10px] text-indigo-600 font-normal font-mono">({snapGridInterval}s step)</span>
                    )}
                  </label>
                  <span className="font-mono text-indigo-600 font-bold">{selectedScene.duration}s</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={20}
                  step={snapEnabled ? snapGridInterval : 0.5}
                  value={selectedScene.duration}
                  onChange={e => {
                    const rawVal = parseFloat(e.target.value);
                    const val = snapEnabled 
                      ? Number((Math.round(rawVal / snapGridInterval) * snapGridInterval).toFixed(2)) 
                      : rawVal;
                    updateSelectedScene('duration', val);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Camera Motion */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Camera Motion (Dynamic Zoom / Pan)</label>
                <select
                  value={selectedScene.motion}
                  onChange={e => updateSelectedScene('motion', e.target.value as CameraMotion)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                >
                  <option value="static">Static (No Camera Motion)</option>
                  <option value="pan_right">Cinematic Pan Right →</option>
                  <option value="pan_left">Cinematic Pan Left ←</option>
                  <option value="zoom_in">Slow Dramatic Zoom In</option>
                  <option value="zoom_out">Slow Expansive Zoom Out</option>
                  <option value="dolly">Dolly Forward</option>
                  <option value="orbit">Orbit Sweep</option>
                </select>
              </div>

              {/* Transition */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Scene Transition</label>
                <select
                  value={selectedScene.transition}
                  onChange={e => updateSelectedScene('transition', e.target.value as TransitionType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                >
                  <option value="fade">Smooth Crossfade</option>
                  <option value="dissolve">Film Dissolve</option>
                  <option value="cut">Direct Hard Cut</option>
                  <option value="wipe_right">Wipe Right</option>
                  <option value="wipe_left">Wipe Left</option>
                  <option value="slide_left">Slide Left</option>
                  <option value="slide_right">Slide Right</option>
                  <option value="zoom_in">Zoom In</option>
                  <option value="zoom_out">Zoom Out</option>
                  <option value="flash_white">Flash White</option>
                  <option value="blur_dissolve">Blur Dissolve</option>
                </select>
              </div>

              {/* Clip Color Tag & Organization */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Clip Color Tag & Organization</label>
                <select
                  value={selectedScene.colorTag || 'b_roll'}
                  onChange={e => updateSelectedScene('colorTag', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                >
                  <option value="b_roll">🎬 B-roll (Indigo)</option>
                  <option value="a_roll">🌟 A-roll (Emerald)</option>
                  <option value="ai_gen">✨ AI-Gen (Purple)</option>
                  <option value="interview">🎙️ Interview (Amber)</option>
                  <option value="bramhanand">🏔️ Bramhanand (Rose)</option>
                  <option value="custom">🏷️ Custom Tag</option>
                </select>
              </div>

              {/* Transition Manager Trigger */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    const idx = scenes.findIndex(s => s.id === selectedSceneId);
                    setTransitionTargetSceneIndex(idx !== -1 ? idx : 0);
                    setShowTransitionManagerModal(true);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 flex items-center justify-center gap-1.5 transition shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Configure Transition Manager →</span>
                </button>
              </div>

              {/* Devanagari Subtitle / Nepali Text */}
              <div className="space-y-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-amber-900 font-semibold flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-700" />
                    <span>नेपाली टेक्स्ट (Nepali Subtitle)</span>
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium">Devanagari</span>
                </div>
                <input
                  type="text"
                  placeholder="उदा: सगरमाथाको सुन्दर बिहानी..."
                  value={selectedScene.textNepali || ''}
                  onChange={e => updateSelectedScene('textNepali', e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900 font-['Mukta'] text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* English Subtitle */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">English Subtitle / Lower Third</label>
                <input
                  type="text"
                  placeholder="e.g. The Rooftop of the World"
                  value={selectedScene.textOverlay}
                  onChange={e => updateSelectedScene('textOverlay', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                />
              </div>

              {/* Color Filter */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Color Grade / Filter</label>
                <select
                  value={selectedScene.filter}
                  onChange={e => updateSelectedScene('filter', e.target.value as ColorFilter)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                >
                  <option value="none">Standard Natural</option>
                  <option value="cinematic">Cinematic High Contrast</option>
                  <option value="warm">Himalayan Golden Warmth</option>
                  <option value="cool">Mountain Alpine Cool</option>
                  <option value="vibrant">Vibrant Festive Color</option>
                </select>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-700">
                  <label className="font-semibold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Scene Audio Level</span>
                  </label>
                  <span className="font-mono text-indigo-600 font-bold">{selectedScene.volume}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedScene.volume}
                  onChange={e => updateSelectedScene('volume', parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Scene Watermark / Brand Logo */}
              <div className="space-y-2 p-3 rounded-xl border border-indigo-100 bg-indigo-50/40">
                <div className="flex items-center justify-between">
                  <label className="text-indigo-950 font-semibold flex items-center gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scene Watermark & Brand Stamp</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAssetLibrary(true)}
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    {selectedScene.watermark ? 'Change Asset' : '+ Choose Asset'}
                  </button>
                </div>
                {selectedScene.watermark ? (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-200 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedScene.watermark.url}
                        alt="Watermark"
                        className="w-8 h-8 object-contain rounded bg-slate-50 border p-0.5"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{selectedScene.watermark.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {selectedScene.watermark.position} • {Math.round(selectedScene.watermark.opacity * 100)}% opacity
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWatermark(false)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Remove watermark from this scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    No watermark applied. Open the Asset Library or drag a logo onto the stage box above.
                  </p>
                )}
              </div>

              {/* Scene Production Notes & Client Feedback */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-semibold flex items-center gap-1.5 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Production Instructions & Notes</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Persisted in JSON</span>
                </div>
                <textarea
                  rows={2}
                  value={selectedScene.notes || ''}
                  onChange={e => updateSelectedScene('notes', e.target.value)}
                  placeholder="e.g. Director note: Fade music at 3s; increase warm filter..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Scene Batch Tags Display */}
              <div className="space-y-1 p-2.5 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between">
                  <label className="text-purple-950 font-semibold flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>Scene Tags & Status Labels</span>
                  </label>
                </div>
                {selectedScene.tags && selectedScene.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedScene.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold">
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No batch tags assigned. Use the timeline Batch Tagging toolbar to apply status labels.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a scene from the timeline to edit properties.</p>
          )}

          {/* Scene Operations Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleDuplicateScene}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleDeleteScene}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Scene</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Timeline Dock (Core engineering implementation from v1.30.0-A) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Dock Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevScene}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Previous Scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              id="timeline-play-btn"
              onClick={togglePlay}
              className={`p-2.5 rounded-xl transition-colors ${
                isPlaying
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => { setIsPlaying(false); setCurrentTime(0); }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Stop and Reset"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextScene}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Next Scene"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Timecode display */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-indigo-700 font-bold ml-2">
              {formatTimecode(currentTime)} <span className="text-slate-400 font-normal">/</span> {formatTimecode(totalDuration)}
            </div>
          </div>

          {/* Edit Actions: Undo, Redo, Batch Render Queue, Split, Snap, Zoom, Fit */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Undo & Redo History Stack Controls */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={handleUndo}
                disabled={historyIndexRef.current <= 0}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-200/80 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                title="Undo last action (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndexRef.current >= historyRef.current.length - 1}
                className="px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white border border-slate-200/80 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                title="Redo change (Ctrl+Y)"
              >
                <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Redo</span>
              </button>
            </div>

            {/* Batch Render Queue Button */}
            <button
              onClick={() => setShowRenderQueueModal(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Queue multiple scenes for sequential rendering & progress tracking"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-200" />
              <span>Batch Render Queue</span>
            </button>

            {/* Split at playhead */}
            <button
              id="btn-split-playhead"
              onClick={handleSplitAtPlayhead}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Split active scene into two clips at playhead time"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-600" />
              <span>Split</span>
            </button>

            {/* Batch Select & Tagging Mode Toggle */}
            <button
              onClick={() => {
                if (isBatchSelectMode) {
                  handleClearBatchSelection();
                } else {
                  setIsBatchSelectMode(true);
                  if (selectedSceneIds.length === 0) {
                    setSelectedSceneIds([selectedSceneId]);
                  }
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isBatchSelectMode || selectedSceneIds.length > 0
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Batch select multiple scenes to apply custom labels like Draft, Final, or Needs Review"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Batch Tagging</span>
              {selectedSceneIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-purple-700 font-bold text-[10px]">
                  {selectedSceneIds.length}
                </span>
              )}
            </button>

            {/* Snap-to-Grid Controls */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              snapEnabled
                ? 'bg-indigo-50/90 text-indigo-900 border-indigo-200 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  snapEnabled
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
                title={snapEnabled ? 'Snap-to-Grid is ON (click to disable)' : 'Enable Snap-to-Grid alignment'}
              >
                <Magnet className="w-3.5 h-3.5" />
                <span>Snap Grid</span>
              </button>

              {snapEnabled && (
                <div className="flex items-center gap-1">
                  <select
                    value={snapGridInterval}
                    onChange={(e) => setSnapGridInterval(parseFloat(e.target.value))}
                    className="bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 focus:outline-none cursor-pointer"
                    title="Select snap-to-grid time interval"
                  >
                    <option value={0.25}>0.25s Grid</option>
                    <option value={0.5}>0.5s Grid</option>
                    <option value={1.0}>1.0s Grid</option>
                    <option value={2.0}>2.0s Grid</option>
                  </select>
                </div>
              )}
            </div>

            {/* Precision Timeline Zoom Slider Component */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden md:inline">Zoom:</span>
              <button
                onClick={() => setTimelineZoom(prev => Math.max(0.5, Number((prev - 0.2).toFixed(1))))}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-200 transition"
                title="Zoom Out Time-Axis Scale (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Precision Time-Axis Range Slider */}
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                className="w-16 sm:w-24 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                title={`Timeline Zoom Scale: ${Math.round(timelineZoom * 100)}% (${pixelsPerSecond} px/sec)`}
              />

              <button
                onClick={() => setTimelineZoom(prev => Math.min(3.0, Number((prev + 0.2).toFixed(1))))}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-200 transition"
                title="Zoom In Time-Axis Scale (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] text-slate-800 font-mono px-1 font-bold min-w-[38px] text-center bg-white rounded border border-slate-200/80 py-0.5">
                {Math.round(timelineZoom * 100)}%
              </span>

              {/* Quick Zoom Presets */}
              <div className="hidden sm:flex items-center gap-0.5 border-l border-slate-200 pl-1">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map(zoomLevel => (
                  <button
                    key={zoomLevel}
                    onClick={() => setTimelineZoom(zoomLevel)}
                    className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded transition ${
                      Math.abs(timelineZoom - zoomLevel) < 0.05
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {zoomLevel}x
                  </button>
                ))}
              </div>

              {/* Fit to window button */}
              <button
                onClick={handleFitToWindow}
                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-200 border-l border-slate-200 pl-1.5 transition"
                title="Fit timeline tracks to window width"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* FLOATING BATCH TAGGING DOCK TOOLBAR */}
        {(isBatchSelectMode || selectedSceneIds.length > 0) && (
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3 rounded-xl border border-purple-800 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 pr-2 border-r border-purple-800/80">
                <Tag className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">
                  Batch Tagging ({selectedSceneIds.length} / {scenes.length} selected)
                </span>
              </div>

              {/* Selection Toggles */}
              <button
                onClick={handleSelectAllScenes}
                className="px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold border border-purple-700/60 transition"
              >
                Select All
              </button>
              <button
                onClick={handleClearBatchSelection}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Deselect
              </button>

              {/* Preset Tag Chips */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-purple-800/80">
                <span className="text-[10px] text-purple-300 uppercase font-bold">Apply Preset:</span>
                {['Draft', 'Final', 'Needs Review', 'A-Roll', 'B-Roll'].map(presetTag => (
                  <button
                    key={presetTag}
                    onClick={() => handleApplyBatchTags([presetTag])}
                    disabled={selectedSceneIds.length === 0}
                    className="px-2 py-0.5 rounded-md bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                  >
                    + {presetTag}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTagInput.trim()) {
                    handleApplyBatchTags([customTagInput.trim()]);
                    setCustomTagInput('');
                  }
                }}
                placeholder="Custom label..."
                className="bg-slate-900 border border-purple-800/80 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-32"
              />
              <button
                onClick={() => {
                  if (customTagInput.trim()) {
                    handleApplyBatchTags([customTagInput.trim()]);
                    setCustomTagInput('');
                  }
                }}
                disabled={selectedSceneIds.length === 0 || !customTagInput.trim()}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-40 transition shadow-sm"
              >
                Add Tag
              </button>

              {/* Clear All Tags */}
              <button
                onClick={handleRemoveBatchTags}
                disabled={selectedSceneIds.length === 0}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold border border-rose-800/60 disabled:opacity-40 transition"
                title="Remove all tags from selected scenes"
              >
                Clear Tags
              </button>
            </div>
          </div>
        )}

        {/* Visual Timeline Tracks Container with Scroll & Wheel Handlers */}
        <div
          ref={timelineScrollRef}
          onWheel={handleTimelineWheel}
          className="relative space-y-2 overflow-x-auto pb-4 pt-1 scrollbar-thin select-none rounded-xl border border-slate-200 bg-slate-50/70 p-2"
        >
          {/* Active Red Draggable Playhead Scrub Indicator & Real-Time Badge */}
          <div
            onPointerDown={handleScrubPointerDown}
            className={`absolute top-0 bottom-0 z-30 flex flex-col items-center cursor-grab active:cursor-grabbing transition-left duration-75 group ${
              isScrubbing ? 'cursor-grabbing' : ''
            }`}
            style={{ left: `${80 + currentTime * pixelsPerSecond}px` }}
          >
            {/* Draggable Playhead Head / Handle */}
            <div 
              className={`-translate-x-1/2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white font-mono text-[10px] font-bold shadow-lg border border-rose-300/60 flex items-center gap-1 shrink-0 transition-transform select-none ${
                isScrubbing 
                  ? 'scale-110 shadow-rose-500/40 ring-2 ring-rose-400 ring-offset-1 bg-rose-600' 
                  : 'hover:scale-105'
              }`}
              title="Drag playhead to scrub timeline & update preview in real-time"
            >
              <GripVertical className="w-3 h-3 text-rose-200 shrink-0" />
              <span>{formatTimecode(currentTime)}</span>
              {isScrubbing && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping ml-0.5 shrink-0" />
              )}
            </div>

            {/* Downward pointing handle diamond tip */}
            <div className="-translate-x-1/2 -mt-0.5 w-2.5 h-2.5 bg-rose-600 rotate-45 border-r border-b border-rose-400 shadow-xs shrink-0 pointer-events-none" />

            {/* Playhead vertical line extending across tracks */}
            <div className={`w-0.5 flex-1 bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 shadow-sm opacity-90 transition-all ${
              isScrubbing ? 'w-1 bg-rose-500 shadow-rose-500/60 opacity-100' : 'group-hover:w-1 group-hover:bg-rose-500'
            }`} />

            {/* Bottom anchor cap */}
            <div className="-translate-x-1/2 w-3 h-1.5 bg-rose-700 rounded-b-md shadow-xs shrink-0 pointer-events-none" />
          </div>

          {/* Timecode Interactive Ruler */}
          <div
            onPointerDown={handleScrubPointerDown}
            className="flex items-center text-[10px] font-mono text-slate-400 border-b border-slate-200 pb-1 cursor-pointer hover:bg-slate-100/60 rounded transition-colors relative select-none"
            title="Click or drag across ruler to scrub playhead"
          >
            <div className="w-20 shrink-0 flex flex-col justify-center pl-1">
              <span className="font-bold text-slate-600 text-[11px]">TRACKS</span>
              {snapEnabled && (
                <span className="text-[8px] font-mono font-bold text-indigo-600 flex items-center gap-0.5">
                  <Magnet className="w-2.5 h-2.5" />
                  <span>{snapGridInterval}s Snap</span>
                </span>
              )}
            </div>
            <div
              className="relative h-5 flex items-center"
              style={{ width: `${Math.max(600, Math.ceil(totalDuration * pixelsPerSecond))}px` }}
            >
              {/* Optional Snap-to-Grid Sub-tick Guidelines */}
              {snapEnabled && Array.from({ length: Math.ceil(totalDuration / snapGridInterval) + 1 }).map((_, gIdx) => {
                const gSec = gIdx * snapGridInterval;
                return (
                  <div
                    key={`grid-${gIdx}`}
                    className="absolute top-0 bottom-0 w-px bg-indigo-300/40 pointer-events-none"
                    style={{ left: `${gSec * pixelsPerSecond}px` }}
                  />
                );
              })}

              {/* Dynamic Ruler tick marks every step seconds */}
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => {
                const step = timelineZoom < 0.8 ? 5 : timelineZoom < 1.4 ? 2 : 1;
                const isMajor = sec % step === 0;
                if (!isMajor && timelineZoom < 1.5) return null;

                return (
                  <div
                    key={sec}
                    className="absolute top-0 flex flex-col items-center pointer-events-none z-10"
                    style={{ left: `${sec * pixelsPerSecond}px` }}
                  >
                    <div className={`w-px ${isMajor ? 'h-2.5 bg-slate-500' : 'h-1 bg-slate-400'}`} />
                    {isMajor && (
                      <span className="text-[9px] text-slate-600 font-mono -translate-x-1/2 mt-0.5 font-semibold">
                        {formatTimecode(sec)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video Scene Blocks Row */}
          <div className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-xs font-semibold text-slate-700 flex items-center gap-1.5 pl-1">
              <Film className="w-3.5 h-3.5 text-indigo-600" />
              <span>Video</span>
            </div>

            <div
              className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs min-w-max"
            >
              {scenes.map((scene, idx) => {
                const isSelected = scene.id === selectedSceneId;
                const sceneWidthPx = Math.max(110, Math.round(scene.duration * pixelsPerSecond));
                const isBeingDragged = draggedSceneIndex === idx;
                const isTargetedDrop = dragOverSceneIndex === idx;

                return (
                  <React.Fragment key={scene.id}>
                    <div
                      draggable={true}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDraggedSceneIndex(idx);
                        e.dataTransfer.setData('text/plain', String(idx));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverSceneIndex !== idx) {
                          setDragOverSceneIndex(idx);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        if (dragOverSceneIndex === idx) {
                          setDragOverSceneIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedSceneIndex !== null && draggedSceneIndex !== idx) {
                          pushToHistory(scenes);
                          const reordered = [...scenes];
                          const [moved] = reordered.splice(draggedSceneIndex, 1);
                          reordered.splice(idx, 0, moved);
                          setScenes(reordered);
                          setSelectedSceneId(moved.id);
                          setProjectNotice(`Reordered: Moved "${moved.title}" to position #${idx + 1}`);
                          setTimeout(() => setProjectNotice(null), 3000);
                        }
                        setDraggedSceneIndex(null);
                        setDragOverSceneIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedSceneIndex(null);
                        setDragOverSceneIndex(null);
                      }}
                      onClick={() => {
                        setSelectedSceneId(scene.id);
                        let t = 0;
                        for (let i = 0; i < idx; i++) t += scenes[i].duration;
                        setCurrentTime(t);
                      }}
                      style={{ width: `${sceneWidthPx}px` }}
                      className={`h-22 rounded-lg p-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between border select-none shrink-0 ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-indigo-500 bg-indigo-50 scale-95'
                          : isTargetedDrop
                          ? 'border-indigo-600 ring-2 ring-indigo-500/80 bg-indigo-100 scale-105 z-20 shadow-md'
                          : isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/90 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 shadow-2xs hover:bg-white'
                      }`}
                    >
                      {/* Scene Background Thumbnail */}
                      {scene.mediaUrl && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <img 
                            src={scene.mediaUrl} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}

                      <div className="relative z-10 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedSceneIds.includes(scene.id)}
                            onChange={(e) => toggleSceneBatchSelection(scene.id, e as any)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer shrink-0"
                            title="Select scene for batch operations"
                          />
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0 hover:text-indigo-600 transition-colors" title="Drag to reorder sequence" />
                          <span className="text-[10px] font-bold text-slate-900 truncate">
                            {idx + 1}. {scene.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModalSceneIndex(idx);
                            }}
                            className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-2xs transition-colors"
                            title="Preview scene media, text overlays & metadata"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </button>
                          <span className="px-1 py-0.2 rounded bg-slate-200/90 text-[9px] font-mono text-slate-700 border border-slate-300/60 font-semibold">
                            {scene.duration}s
                          </span>
                        </div>
                      </div>

                      {/* Batch Tags & Production Notes Badges */}
                      <div className="relative z-10 flex items-center gap-1 my-0.5 overflow-x-hidden">
                        {scene.tags && scene.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-1 py-0.2 rounded bg-purple-600 text-white text-[8px] font-bold shrink-0">
                            🏷️ {tag}
                          </span>
                        ))}
                        {scene.notes && (
                          <span className="px-1 py-0.2 rounded bg-amber-500 text-white text-[8px] font-bold shrink-0" title={`Production Note: ${scene.notes}`}>
                            📝 Note
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-500 gap-1">
                        <span className="truncate max-w-[65px] font-medium">{scene.motion}</span>
                        <span className="px-1 py-0.2 rounded bg-indigo-100 text-[8px] text-indigo-700 font-semibold shrink-0 capitalize">
                          {scene.transition || 'dissolve'}
                        </span>
                      </div>
                    </div>

                    {/* Inter-Scene Transition Node Selector */}
                    {idx < scenes.length - 1 && (
                      <div className="relative shrink-0 flex items-center px-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransitionTargetSceneIndex(idx);
                            setShowTransitionManagerModal(true);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-slate-700 hover:border-indigo-400 text-[10px] font-bold flex items-center gap-1 transition-all shadow-md hover:scale-105 z-10 group cursor-pointer"
                          title={`Transition between Scene ${idx + 1} & Scene ${idx + 2}: ${scene.transition || 'dissolve'} (${scene.transitionDuration || 0.8}s) - Click to change`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                          <span className="capitalize font-mono text-[9px]">
                            {scene.transition ? scene.transition.replace('_', ' ') : 'dissolve'}
                          </span>
                          <span className="text-[9px] font-mono opacity-80">
                            ({scene.transitionDuration || 0.8}s)
                          </span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Quick Append Scene Template Button */}
              <button
                onClick={() => setShowSceneTemplatesModal(true)}
                className="h-22 px-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 hover:bg-amber-100/80 hover:border-amber-400 text-amber-900 flex flex-col items-center justify-center gap-1 transition-colors shrink-0 text-center"
                title="Append pre-configured scene template (Intro, Outro, Lower-Thirds, News Banners)"
              >
                <LayoutTemplate className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-bold whitespace-nowrap">+ Scene Template</span>
              </button>
            </div>
          </div>

          {/* Multi-Track Audio Rows: Background Music, Voiceover, SFX */}
          <div className="space-y-2">
            {/* 1. Background Music Track */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 text-xs font-semibold text-purple-800 flex items-center gap-1.5 pl-1">
                <Music className="w-3.5 h-3.5 text-purple-600" />
                <span>BGM Track</span>
              </div>
              <div
                className="p-2 bg-purple-50/80 rounded-xl border border-purple-200/80 flex items-center justify-between text-xs gap-4 shadow-2xs"
                style={{ width: `${Math.max(500, Math.ceil(totalDuration * pixelsPerSecond))}px` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  <span className="text-slate-900 font-bold truncate">
                    {audioTracks.find(a => a.id === selectedAudioId)?.title || 'Background Cinematic Theme'}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-60">
                    {[4, 8, 12, 6, 14, 10, 5, 9, 13, 7].map((h, i) => (
                      <div key={i} className="w-1 bg-purple-600 rounded-full" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Vol:</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bgmVolume} 
                      onChange={e => setBgmVolume(Number(e.target.value))}
                      className="w-20 accent-purple-600 h-1 bg-purple-200 rounded-lg cursor-pointer" 
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-700 w-7">{bgmVolume}%</span>
                  </div>
                  <select
                    value={selectedAudioId}
                    onChange={e => setSelectedAudioId(e.target.value)}
                    className="bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:outline-none focus:border-purple-500 shadow-2xs"
                  >
                    {audioTracks.map(track => (
                      <option key={track.id} value={track.id}>{track.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Voiceover (VO) Track */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 text-xs font-semibold text-indigo-800 flex items-center gap-1.5 pl-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Voiceover (VO)</span>
              </div>
              <div
                className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-200/80 flex items-center justify-between text-xs gap-4 shadow-2xs"
                style={{ width: `${Math.max(500, Math.ceil(totalDuration * pixelsPerSecond))}px` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-slate-900 font-bold truncate">
                    Nepali / Hindi Neural Voiceover (Studio Master)
                  </span>
                  <div className="flex items-center gap-0.5 opacity-60">
                    {[6, 12, 8, 14, 10, 16, 7, 11, 13, 9].map((h, i) => (
                      <div key={i} className="w-1 bg-indigo-600 rounded-full" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Vol:</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={voVolume} 
                      onChange={e => setVoVolume(Number(e.target.value))}
                      className="w-20 accent-indigo-600 h-1 bg-indigo-200 rounded-lg cursor-pointer" 
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-700 w-7">{voVolume}%</span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                    AI TTS Active
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Sound Effects (SFX) Track */}
            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0 text-xs font-semibold text-amber-800 flex items-center gap-1.5 pl-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>SFX Track</span>
              </div>
              <div
                className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs gap-4 shadow-2xs"
                style={{ width: `${Math.max(500, Math.ceil(totalDuration * pixelsPerSecond))}px` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-slate-900 font-bold truncate">
                    Cinematic Whoosh, Risers & Environment Atmos
                  </span>
                  <div className="flex items-center gap-0.5 opacity-60">
                    {[3, 10, 5, 12, 8, 15, 6, 11, 4, 13].map((h, i) => (
                      <div key={i} className="w-1 bg-amber-600 rounded-full" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Vol:</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sfxVolume} 
                      onChange={e => setSfxVolume(Number(e.target.value))}
                      className="w-20 accent-amber-600 h-1 bg-amber-200 rounded-lg cursor-pointer" 
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-700 w-7">{sfxVolume}%</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    Auto-Synced
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Starter Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Starter Video Templates</h3>
                <p className="text-xs text-slate-500">Load pre-composed cinematic sequences or commercial ads.</p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STARTER_TEMPLATES.map(tpl => (
                <div 
                  key={tpl.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-indigo-300 transition-colors cursor-pointer flex flex-col justify-between"
                  onClick={() => handleLoadTemplate(tpl)}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {tpl.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{tpl.title}</h4>
                    <p className="text-xs text-slate-600">{tpl.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                    <span className="text-slate-500">{tpl.scenesCount} Scenes • {tpl.totalDuration}s</span>
                    <span className="text-indigo-600 font-semibold">Load Template →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export & Share Modal with Preflight Checks */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Export & Production Render</span>
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Preflight Verification Checklist */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-900 block mb-2">Preflight Verification Checks</span>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Scenes validated ({scenes.length} scenes, {totalDuration}s total duration)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Aspect ratio locked to {aspectRatio}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Devanagari text encoding confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Audio sync configured with background track</span>
              </div>
            </div>

            {/* Progress bar if exporting */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Rendering cinematic composite...</span>
                  <span className="font-mono text-indigo-600 font-bold">{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {exportSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Video Rendered & Exported Successfully!
                </p>
                <p className="text-slate-600">
                  Composite MP4 ready for social distribution or download.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setShowSocialPublisherModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-purple-200" />
                <span>Post to YouTube / X / TikTok / Reels</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleStartExport}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Rendering...' : 'Render & Download MP4'}</span>
                </button>
              </div>
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
    </div>
  );
};
