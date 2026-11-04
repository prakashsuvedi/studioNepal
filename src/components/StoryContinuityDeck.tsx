import React, { useState, useMemo } from 'react';
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
  Video
} from 'lucide-react';
import { 
  DynamicCharacterIdentity, 
  SequentialSceneNode 
} from '../services/characterContinuityEngine';

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
}) => {
  const completedScenes = scenes.filter(s => !!s.videoUrl);
  const nextUnrenderedIndex = scenes.findIndex(s => !s.videoUrl);
  const nextScene = nextUnrenderedIndex !== -1 ? scenes[nextUnrenderedIndex] : null;

  const [activeTab, setActiveTab] = useState<'storyboard' | 'characters'>('storyboard');
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [tempPromptText, setTempPromptText] = useState<string>('');
  const [showAddCharModal, setShowAddCharModal] = useState<boolean>(false);
  const [showContinuityDetails, setShowContinuityDetails] = useState<boolean>(false);

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
        <div className="flex items-center gap-2 shrink-0">
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
              {/* Scene Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {scene.sceneIndex}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">
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
                <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2.5 border border-slate-800/80 shadow-inner">
                  {isDone && scene.videoUrl ? (
                    <>
                      <video
                        src={scene.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <button
                        type="button"
                        onClick={() => onOpenPreview(scene.videoUrl!)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/90 group-hover:bg-white text-indigo-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-4 h-4 fill-indigo-900 ml-0.5" />
                        </div>
                      </button>
                    </>
                  ) : isCurrent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/40 p-3 text-center">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-1.5" />
                      <span className="text-[11px] text-indigo-200 font-bold">Rendering Sora-2 Video...</span>
                      <span className="text-[9px] text-indigo-300/80">Preserving character &amp; camera continuity</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 p-3 text-center text-slate-500">
                      <Video className="w-6 h-6 text-slate-700 mb-1" />
                      <span className="text-[10.5px] text-slate-400 font-medium">{scene.duration || 8}s Cinematic Shot</span>
                      <span className="text-[9px] text-slate-500 font-mono">{scene.framing || '35mm anamorphic'}</span>
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
                    onClick={() => handleStartEditPrompt(idx, scene.userPrompt)}
                    className="text-[11px] text-slate-300 bg-slate-950/60 hover:bg-slate-950 p-2 rounded-lg border border-slate-800/70 leading-relaxed line-clamp-2 cursor-pointer group"
                    title="Click to edit prompt"
                  >
                    <span className="group-hover:text-white transition">"{scene.userPrompt}"</span>
                    <Edit2 className="w-2.5 h-2.5 inline-block ml-1 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                )}
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
    </div>
  );
};
