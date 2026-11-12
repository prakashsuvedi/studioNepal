import React, { useState, useMemo, useRef } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Play, 
  Check, 
  RefreshCw, 
  Lock, 
  UserPlus, 
  Users, 
  Trash2, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Sun, 
  SlidersHorizontal,
  Edit2,
  ShieldCheck,
  Video,
  Upload,
  Link as LinkIcon,
  Save,
  X,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { 
  DynamicCharacterIdentity, 
  SequentialSceneNode 
} from '../services/characterContinuityEngine';
import { UploadReferenceImage } from './UploadReferenceImage';

interface StoryContinuityDeckProps {
  scenes: SequentialSceneNode[];
  characterRegistry: DynamicCharacterIdentity[];
  activeCharacterId?: string;
  currentGeneratingIndex: number | null;
  onGenerateScene: (scene: SequentialSceneNode, index: number) => void;
  onBatchRenderAll?: () => void;
  isBatchRendering?: boolean;
  onAssembleStoryToTimeline: () => void;
  onOpenPreview: (url: string) => void;
  onUpdateScenePrompt: (index: number, newPrompt: string) => void;
  onAddNextSceneBeat: () => void;
  onToggleCharacterForScene: (sceneIndex: number, charId: string) => void;
  onAddNewCharacter: (name: string, role: string, description: string, hair?: string, clothing?: string, facialFeatures?: string) => void;
  onRemoveScene?: (sceneIndex: number) => void;
  onApplyPromptToScene?: (sceneIndex: number, promptText: string, title?: string, duration?: '4' | '8' | '12') => void;
  onLoadPromptToStudio?: (promptText: string, duration?: '4' | '8' | '12') => void;
  onSetSceneMediaUrl?: (sceneIndex: number, mediaUrl: string) => void;
  onResynthesizeStoryboard?: () => void;
  currentPrompt?: string;
}

export const StoryContinuityDeck: React.FC<StoryContinuityDeckProps> = ({
  scenes,
  characterRegistry,
  activeCharacterId,
  currentGeneratingIndex,
  onGenerateScene,
  onBatchRenderAll,
  isBatchRendering = false,
  onAssembleStoryToTimeline,
  onOpenPreview,
  onUpdateScenePrompt,
  onAddNextSceneBeat,
  onToggleCharacterForScene,
  onAddNewCharacter,
  onRemoveScene,
  onApplyPromptToScene,
  onLoadPromptToStudio,
  onSetSceneMediaUrl,
  onResynthesizeStoryboard,
  currentPrompt = '',
}) => {
  const completedScenes = scenes.filter(s => !!s.videoUrl);
  const nextUnrenderedIndex = scenes.findIndex(s => !s.videoUrl);
  const nextScene = nextUnrenderedIndex !== -1 ? scenes[nextUnrenderedIndex] : null;

  const [activeTab, setActiveTab] = useState<'storyboard' | 'characters'>('storyboard');
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [tempPromptText, setTempPromptText] = useState<string>('');
  const [showAddCharModal, setShowAddCharModal] = useState<boolean>(false);
  const [showContinuityDetails, setShowContinuityDetails] = useState<boolean>(false);

  // Dedicated Scene Editor Modal state
  const [selectedSceneForEdit, setSelectedSceneForEdit] = useState<{ scene: SequentialSceneNode; index: number } | null>(null);
  const [editPromptValue, setEditPromptValue] = useState<string>('');
  const [editDuration, setEditDuration] = useState<'4' | '8' | '12'>('8');
  const [customMediaInput, setCustomMediaInput] = useState<string>('');
  const [sceneReferenceImage, setSceneReferenceImage] = useState<string | null>(null);
  const [sceneReferenceImageName, setSceneReferenceImageName] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const sceneFileRef = useRef<HTMLInputElement>(null);

  // New character form state
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [newCharHair, setNewCharHair] = useState('');
  const [newCharClothing, setNewCharClothing] = useState('');
  const [newCharFace, setNewCharFace] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');

  // Primary locked character for this story
  const primaryLockedChar = useMemo(() => {
    if (activeCharacterId) {
      const found = characterRegistry.find(c => c.id === activeCharacterId);
      if (found) return found;
    }
    return characterRegistry[0] || null;
  }, [characterRegistry, activeCharacterId]);

  const scene1 = scenes[0] || null;

  const handleOpenSceneEditor = (scene: SequentialSceneNode, index: number) => {
    setSelectedSceneForEdit({ scene, index });
    setEditPromptValue(scene.userPrompt);
    setEditDuration((scene.duration as any) || '8');
    setCustomMediaInput(scene.videoUrl || '');

    // Extract any existing reference image or avatar anchor in prompt
    const anchorMatch = scene.userPrompt.match(/\[(?:Visual Reference Anchor|Subject Visual Anchor|Subject Reference Lock|Visual Style Reference Lock): ([^|(]+)(?: \| |\()([^)]+)\)?\]/i);
    if (anchorMatch) {
      setSceneReferenceImageName(anchorMatch[1].trim());
      setSceneReferenceImage(anchorMatch[2].replace(/\)$/, '').trim());
    } else {
      setSceneReferenceImage(null);
      setSceneReferenceImageName(null);
    }
  };

  const handleSaveSceneEditor = () => {
    if (!selectedSceneForEdit) return;
    const { index, scene } = selectedSceneForEdit;
    const finalPrompt = editPromptValue.trim() || scene.userPrompt;
    if (onApplyPromptToScene) {
      onApplyPromptToScene(index, finalPrompt, scene.title, editDuration);
    } else {
      onUpdateScenePrompt(index, finalPrompt);
    }
    if (customMediaInput.trim() && onSetSceneMediaUrl) {
      onSetSceneMediaUrl(index, customMediaInput.trim());
    }
    setSelectedSceneForEdit(null);
  };

  const handleFileUploadForScene = async (e: React.ChangeEvent<HTMLInputElement>, sceneIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `scene_${sceneIndex + 1}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`,
            fileData: base64Data,
            mimeType: file.type || 'video/mp4',
          }),
        });
        const data = await res.json();
        if (data.url) {
          if (onSetSceneMediaUrl) {
            onSetSceneMediaUrl(sceneIndex, data.url);
          }
          setCustomMediaInput(data.url);
          if (selectedSceneForEdit) {
            setSelectedSceneForEdit(prev => prev ? {
              ...prev,
              scene: { ...prev.scene, videoUrl: data.url }
            } : null);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload scene media:', err);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePasteStudioPromptToScene = (idx: number) => {
    if (!currentPrompt.trim()) return;
    if (onApplyPromptToScene) {
      onApplyPromptToScene(idx, currentPrompt.trim());
    } else {
      onUpdateScenePrompt(idx, currentPrompt.trim());
    }
  };

  const handleStartEditPrompt = (idx: number, currentText: string) => {
    setEditingSceneIdx(idx);
    setTempPromptText(currentText);
  };

  const handleSavePrompt = (idx: number) => {
    if (tempPromptText.trim()) {
      onUpdateScenePrompt(idx, tempPromptText.trim());
    }
    setEditingSceneIdx(null);
  };

  const handleCreateNewChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const finalDesc = newCharDesc.trim() || `${newCharName}, ${newCharRole || 'Lead Protagonist'} | Hair: ${newCharHair || 'natural styled'} | Clothing: ${newCharClothing || 'signature wardrobe'} | Face: ${newCharFace || 'expressive natural focus'}`;
    onAddNewCharacter(
      newCharName.trim(),
      newCharRole.trim() || 'Lead Protagonist',
      finalDesc,
      newCharHair.trim() || 'Natural styled dark hair',
      newCharClothing.trim() || 'Authentic signature wardrobe',
      newCharFace.trim() || 'Expressive eyes and natural complexion'
    );
    setNewCharName('');
    setNewCharRole('');
    setNewCharHair('');
    setNewCharClothing('');
    setNewCharFace('');
    setNewCharDesc('');
    setShowAddCharModal(false);
  };

  return (
    <div id="project-storyboard-deck" className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
      {/* 1. Header Bar: Title, Progress, and Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Project Storyboard</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                {completedScenes.length} of {scenes.length} Scenes Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-scene sequential video production with continuous character and visual anchor lock.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onResynthesizeStoryboard && (
            <button
              type="button"
              onClick={onResynthesizeStoryboard}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Decompose current prompt into 3 narrative scenes"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync Story to Prompt</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'storyboard' ? 'characters' : 'storyboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Character Bank ({characterRegistry.length})</span>
          </button>

          {onBatchRenderAll && scenes.length > 1 && (
            <button
              type="button"
              onClick={onBatchRenderAll}
              disabled={isBatchRendering || currentGeneratingIndex !== null}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {isBatchRendering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Scenes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Render All {scenes.length} Scenes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Character Consistency Identity Pill */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {primaryLockedChar ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-lg shrink-0">
                {primaryLockedChar.avatarEmoji || '👤'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{primaryLockedChar.name}</span>
                  <span className="text-[10px] text-slate-400 truncate">({primaryLockedChar.roleOrArchetype || 'Protagonist'})</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Identity, attire &amp; face locked across scenes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-4 h-4 text-slate-500" />
              <span>No protagonist locked yet. Add a character or render Scene 1 to lock identity.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowContinuityDetails(!showContinuityDetails)}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            title="Inspect camera and lighting anchor parameters"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>Continuity Anchors</span>
            {showContinuityDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setShowAddCharModal(true)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-medium flex items-center gap-1 transition cursor-pointer"
          >
            <UserPlus className="w-3 h-3 text-indigo-400" />
            <span>+ Add Character</span>
          </button>
        </div>
      </div>

      {/* 2.5 Optional Collapsed Continuity Details Accordion */}
      {showContinuityDetails && (
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs space-y-2 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="flex items-start gap-2 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Lighting &amp; Grade Anchor: </span>
                <span className="text-slate-200">
                  {scene1?.lightingAtmosphere || 'Matched to Master Scene 1 golden hour alpenglow & color tonality'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-300">
              <Camera className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Camera Movement Anchor: </span>
                <span className="text-slate-200">
                  {scene1?.cameraMovement || 'Fluid cinematic steadicam tracking'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Character Bank Modal / Tab View */}
      {activeTab === 'characters' && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Character Identity Bank ({characterRegistry.length})
            </h4>
            <span className="text-[11px] text-slate-400">
              Select or customize character identities for your multi-scene film.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {characterRegistry.map((char) => (
              <div
                key={char.id}
                className={`p-3 rounded-xl border space-y-2 transition ${
                  primaryLockedChar?.id === char.id
                    ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-750'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {char.avatarEmoji || '👤'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{char.name}</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400">{char.roleOrArchetype}</span>
                    </div>
                  </div>
                  {primaryLockedChar?.id === char.id && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>

                <div className="text-[10.5px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 line-clamp-2">
                  {char.visualDescription}
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-slate-400 font-mono">Scene {char.originSceneIndex || 1}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Locked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Visual Scene Progression Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scenes.map((scene, idx) => {
          const isDone = !!scene.videoUrl;
          const isCurrent = currentGeneratingIndex === idx;
          const isNext = nextUnrenderedIndex === idx;
          const isMaster = idx === 0;

          return (
            <div
              key={scene.id || idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative space-y-3 ${
                isDone
                  ? 'bg-slate-950/90 border-emerald-500/50 text-white shadow-md ring-1 ring-emerald-500/20'
                  : isCurrent
                  ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg'
                  : isNext
                  ? 'bg-slate-950/80 border-indigo-500/40 hover:border-indigo-400'
                  : 'bg-slate-950/50 border-slate-800/80'
              }`}
            >
              {/* Scene Header (Click to Open Full Scene & Media Editor) */}
              <div>
                <div 
                  onClick={() => handleOpenSceneEditor(scene, idx)}
                  className="flex items-center justify-between mb-2 cursor-pointer group"
                  title="Click to edit prompt, duration, character, or upload media"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold transition">
                      {scene.sceneIndex}
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate max-w-[170px] transition">
                      {scene.title || `Scene ${scene.sceneIndex}`}
                    </span>
                    {isMaster && (
                      <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        Master
                      </span>
                    )}
                  </div>

                  {isDone ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Rendering</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {scene.duration || 8}s • {scene.aspectRatio || '16:9'}
                    </span>
                  )}
                </div>

                {/* Video Preview or Placeholder */}
                <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2.5 border border-slate-800/80 shadow-inner group">
                  {isDone && scene.videoUrl ? (
                    <>
                      <video
                        src={scene.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition">
                        <button
                          type="button"
                          onClick={() => onOpenPreview(scene.videoUrl!)}
                          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-indigo-900 flex items-center justify-center shadow-xl hover:scale-110 transition cursor-pointer"
                          title="Play Scene Video"
                        >
                          <Play className="w-4 h-4 fill-indigo-900 ml-0.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-1.5 inset-x-2 flex items-center justify-between pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSceneEditor(scene, idx);
                          }}
                          className="px-2 py-0.5 rounded bg-black/80 hover:bg-indigo-600 text-white text-[10px] font-semibold backdrop-blur-xs border border-white/20 transition cursor-pointer flex items-center gap-1"
                          title="Edit scene prompt, duration, or upload new video"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit Prompt &amp; Video</span>
                        </button>
                        <span className="text-[9px] text-white/90 font-mono bg-black/70 px-1.5 py-0.5 rounded">
                          {scene.duration || 8}s
                        </span>
                      </div>
                    </>
                  ) : isCurrent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/40 p-3 text-center">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-1.5" />
                      <span className="text-[11px] text-indigo-200 font-bold">Rendering Sora-2 Video...</span>
                      <span className="text-[9px] text-indigo-300/80">Preserving character &amp; camera continuity</span>
                    </div>
                  ) : (
                    <div 
                      onClick={() => handleOpenSceneEditor(scene, idx)}
                      className="w-full h-full flex flex-col items-center justify-center bg-slate-900/95 hover:bg-indigo-950/40 border-2 border-dashed border-slate-700/80 hover:border-indigo-500/80 p-3 text-center text-slate-400 hover:text-white cursor-pointer transition group"
                      title="Click to add prompt, reference avatar or upload video for this scene"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 group-hover:bg-indigo-600 border border-indigo-500/40 group-hover:border-indigo-400 flex items-center justify-center text-indigo-400 group-hover:text-white transition mb-1.5">
                        <Video className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-indigo-200 transition">
                        Click to Set Scene {scene.sceneIndex} Prompt &amp; Video
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-mono mt-0.5">
                        Add scene prompt, upload clip, or select avatar • {scene.duration || 8}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Prompt Preview / Edit */}
                {editingSceneIdx === idx ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={tempPromptText}
                      onChange={(e) => setTempPromptText(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 border border-indigo-500 rounded-lg p-2 text-xs text-white focus:outline-none resize-none font-sans"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingSceneIdx(null)}
                        className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePrompt(idx)}
                        className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleOpenSceneEditor(scene, idx)}
                    className="text-[11px] text-slate-300 bg-slate-950/60 hover:bg-slate-950 hover:border-indigo-500/50 p-2 rounded-lg border border-slate-800/70 leading-relaxed line-clamp-2 cursor-pointer group transition"
                    title="Click to open prompt and video editor"
                  >
                    <span className="group-hover:text-white transition">"{scene.userPrompt}"</span>
                    <Edit2 className="w-2.5 h-2.5 inline-block ml-1 text-indigo-400 opacity-70 group-hover:opacity-100 transition" />
                  </div>
                )}

                {/* Quick Scene Action Strip */}
                <div className="grid grid-cols-3 gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSceneEditor(scene, idx)}
                    className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-medium border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition"
                    title="Open Scene Editor dialog"
                  >
                    <Edit2 className="w-2.5 h-2.5 text-indigo-400" />
                    <span>Edit Scene</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePasteStudioPromptToScene(idx)}
                    disabled={!currentPrompt.trim()}
                    className="py-1 px-1.5 rounded bg-indigo-950/40 hover:bg-indigo-900/60 disabled:opacity-30 text-indigo-300 hover:text-white text-[10px] font-medium border border-indigo-800/40 flex items-center justify-center gap-1 cursor-pointer transition truncate"
                    title="Apply the main studio prompt to this scene"
                  >
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    <span>Paste Prompt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadPromptToStudio && onLoadPromptToStudio(scene.userPrompt, scene.duration as any)}
                    className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-medium border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition truncate"
                    title="Copy this scene's prompt to the main studio prompt textarea"
                  >
                    <Download className="w-2.5 h-2.5 text-amber-400" />
                    <span>Load Studio</span>
                  </button>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
                {/* Character Assignment Pill */}
                <div className="flex items-center gap-1 overflow-hidden">
                  {characterRegistry.map((char) => {
                    const isActive = scene.activeCharacterIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => onToggleCharacterForScene(idx, char.id)}
                        className={`text-[9.5px] px-2 py-0.5 rounded font-medium transition cursor-pointer border flex items-center gap-1 ${
                          isActive
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                        title={`Toggle ${char.name} in this scene`}
                      >
                        <span>{char.avatarEmoji || '👤'}</span>
                        <span className="truncate max-w-[60px]">{char.name}</span>
                        {isActive && <Check className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onRemoveScene && scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveScene(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove scene"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onGenerateScene(scene, idx)}
                    disabled={currentGeneratingIndex !== null || isBatchRendering}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs ${
                      isDone
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Rendering...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>{isDone ? 'Re-render' : 'Render'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Next in Flow Action Banner */}
      {nextScene && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-950 to-indigo-950/50 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Next Scene: Scene {nextScene.sceneIndex} · {nextScene.title}
              </span>
              <p className="text-[10.5px] text-slate-400 truncate">
                "{nextScene.userPrompt}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onAddNextSceneBeat}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Scene Beat</span>
            </button>

            <button
              type="button"
              onClick={() => onGenerateScene(nextScene, nextUnrenderedIndex)}
              disabled={currentGeneratingIndex !== null || isBatchRendering}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {currentGeneratingIndex === nextUnrenderedIndex ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Scene {nextScene.sceneIndex}</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. Master Video Timeline Assembly Bar */}
      {completedScenes.length >= 1 && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>{completedScenes.length} consistent scene clips ready.</strong> Assemble them directly into the multi-track video timeline.
            </span>
          </div>

          <button
            type="button"
            onClick={onAssembleStoryToTimeline}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Layers className="w-4 h-4" />
            <span>Assemble in Video Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 7. Add Custom Character Modal */}
      {showAddCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Add Character to Storyboard</h4>
              </div>
              <button
                onClick={() => setShowAddCharModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewChar} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Character Name:</label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="e.g. Aarav, Maya, Dr. Rohan..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Role / Archetype:</label>
                <input
                  type="text"
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  placeholder="e.g. Mountain Climber, Tech Scientist, News Presenter..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Hair Details:</label>
                  <input
                    type="text"
                    value={newCharHair}
                    onChange={(e) => setNewCharHair(e.target.value)}
                    placeholder="e.g. Short dark hair"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Wardrobe / Attire:</label>
                  <input
                    type="text"
                    value={newCharClothing}
                    onChange={(e) => setNewCharClothing(e.target.value)}
                    placeholder="e.g. Red winter parka"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Facial Features:</label>
                  <input
                    type="text"
                    value={newCharFace}
                    onChange={(e) => setNewCharFace(e.target.value)}
                    placeholder="e.g. Expressive eyes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Visual DNA Description:</label>
                <textarea
                  rows={2}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="e.g. 28-year-old Nepali trekker with warm smile and woolen beanie..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCharModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save &amp; Lock Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Full Scene Prompt & Media Editor Modal */}
      {selectedSceneForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {selectedSceneForEdit.index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Scene {selectedSceneForEdit.index + 1}: {selectedSceneForEdit.scene.title || `Scene Beat ${selectedSceneForEdit.index + 1}`}</span>
                    {selectedSceneForEdit.index === 0 && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                        Master Anchor
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Customize scene prompt, duration, assigned characters, or upload your own video clip.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSceneForEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Scene Prompt &amp; Visual Direction:
                </label>
                {currentPrompt.trim() && (
                  <button
                    type="button"
                    onClick={() => setEditPromptValue(currentPrompt)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Copy from Main Studio Prompt</span>
                  </button>
                )}
              </div>
              <textarea
                value={editPromptValue}
                onChange={(e) => setEditPromptValue(e.target.value)}
                rows={4}
                placeholder="Describe what happens in this scene, camera movements, lighting, and character actions..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none resize-none transition"
              />

              {/* Reference Image & Character / Style Avatar Component */}
              <UploadReferenceImage
                selectedImageUrl={sceneReferenceImage}
                selectedImageName={sceneReferenceImageName}
                label="Scene Reference Image &amp; Character / Style Avatar"
                subLabel="Select an avatar or style image that gets sent to the backend as part of prompt injection"
                currentPrompt={editPromptValue}
                onSelectImage={(url, name, promptInjection) => {
                  setSceneReferenceImage(url);
                  setSceneReferenceImageName(name);
                  setEditPromptValue(prev => {
                    if (prev.includes(url)) return prev;
                    return prev.trim() ? `${prev.trim()}, ${promptInjection}` : promptInjection;
                  });
                }}
                onClearImage={() => {
                  setSceneReferenceImage(null);
                  setSceneReferenceImageName(null);
                }}
                onAppendToPrompt={(newPrompt) => {
                  setEditPromptValue(newPrompt);
                }}
              />
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                Scene Duration (Sora-2 Supported):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['4', '8', '12'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setEditDuration(dur)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      editDuration === dur
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{dur} Seconds</span>
                    {dur === '8' && <span className="text-[9px] text-indigo-300 bg-indigo-900/50 px-1 rounded">Standard</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Character Assignment */}
            {characterRegistry.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">
                  Assigned Characters in this Scene:
                </label>
                <div className="flex flex-wrap gap-2">
                  {characterRegistry.map((char) => {
                    const isActive = selectedSceneForEdit.scene.activeCharacterIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          onToggleCharacterForScene(selectedSceneForEdit.index, char.id);
                          setSelectedSceneForEdit(prev => {
                            if (!prev) return null;
                            const curActive = prev.scene.activeCharacterIds;
                            const nextActive = curActive.includes(char.id)
                              ? curActive.filter(id => id !== char.id)
                              : [...curActive, char.id];
                            return {
                              ...prev,
                              scene: { ...prev.scene, activeCharacterIds: nextActive }
                            };
                          });
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <span>{char.avatarEmoji || '👤'}</span>
                        <span>{char.name}</span>
                        {isActive && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Upload / Video Source */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">
                Scene Media Clip (Upload Video/Image or Paste URL):
              </label>

              <input
                ref={sceneFileRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => handleFileUploadForScene(e, selectedSceneForEdit.index)}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => sceneFileRef.current?.click()}
                  disabled={isUploadingMedia}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {isUploadingMedia ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Upload Clip</span>
                    </>
                  )}
                </button>

                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={customMediaInput}
                    onChange={(e) => setCustomMediaInput(e.target.value)}
                    placeholder="https://... or /dist/uploads/... (video or image URL)"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Preview if URL exists */}
              {customMediaInput.trim() && (
                <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden border border-slate-700 shadow-inner">
                  {customMediaInput.match(/\.(mp4|webm|mov)(\?.*)?$/i) || customMediaInput.includes('/api/video') ? (
                    <video
                      src={customMediaInput}
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={customMediaInput}
                      alt="Scene preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setCustomMediaInput('')}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/90 text-white text-xs transition"
                    title="Clear media"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (!selectedSceneForEdit) return;
                  const idx = selectedSceneForEdit.index;
                  const finalPrompt = editPromptValue.trim() || selectedSceneForEdit.scene.userPrompt;
                  const updatedNode: SequentialSceneNode = {
                    ...selectedSceneForEdit.scene,
                    userPrompt: finalPrompt,
                    constructedPrompt: finalPrompt,
                    duration: editDuration,
                    videoUrl: customMediaInput.trim() || selectedSceneForEdit.scene.videoUrl,
                  };
                  if (onApplyPromptToScene) {
                    onApplyPromptToScene(idx, finalPrompt, selectedSceneForEdit.scene.title, editDuration);
                  } else {
                    onUpdateScenePrompt(idx, finalPrompt);
                  }
                  if (customMediaInput.trim() && onSetSceneMediaUrl) {
                    onSetSceneMediaUrl(idx, customMediaInput.trim());
                  }
                  setSelectedSceneForEdit(null);
                  onGenerateScene(updatedNode, idx);
                }}
                disabled={currentGeneratingIndex !== null || isBatchRendering}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Save &amp; Generate Sora-2 Video</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSceneForEdit(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveSceneEditor}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Scene</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
