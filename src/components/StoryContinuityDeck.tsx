import React, { useState } from 'react';
import { 
  Sparkles, 
  Film, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Play, 
  ShieldCheck, 
  Clapperboard, 
  Check, 
  UserPlus, 
  Users, 
  SlidersHorizontal, 
  Lock, 
  Eye, 
  Trash2,
  ChevronRight,
  Info,
  Wand2
} from 'lucide-react';
import { 
  DynamicCharacterIdentity, 
  SequentialSceneNode, 
  predictNextSceneBeat, 
  resolveSceneContinuity,
  extractCharactersFromPrompt
} from '../services/characterContinuityEngine';

interface StoryContinuityDeckProps {
  scenes: SequentialSceneNode[];
  characterRegistry: DynamicCharacterIdentity[];
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
}

export const StoryContinuityDeck: React.FC<StoryContinuityDeckProps> = ({
  scenes,
  characterRegistry,
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
  onRemoveScene
}) => {
  const completedScenes = scenes.filter(s => !!s.videoUrl);
  const nextUnrenderedIndex = scenes.findIndex(s => !s.videoUrl);
  const nextScene = nextUnrenderedIndex !== -1 ? scenes[nextUnrenderedIndex] : null;

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(nextScene ? nextScene.userPrompt : '');
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [newCharHair, setNewCharHair] = useState('');
  const [newCharClothing, setNewCharClothing] = useState('');
  const [newCharFace, setNewCharFace] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'storyboard' | 'characters'>('storyboard');

  React.useEffect(() => {
    if (nextScene) {
      setEditedPrompt(nextScene.userPrompt);
    }
  }, [nextScene]);

  const handleCreateNewChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    const finalDesc = newCharDesc.trim() || `${newCharName}, ${newCharRole || 'Protagonist'} | Hair: ${newCharHair || 'natural styled'} | Clothing: ${newCharClothing || 'authentic wardrobe'} | Face: ${newCharFace || 'expressive natural focus'}`;
    onAddNewCharacter(
      newCharName.trim(),
      newCharRole.trim() || 'Featured Protagonist',
      finalDesc,
      newCharHair.trim() || 'Natural dark textured hair',
      newCharClothing.trim() || 'Authentic signature wardrobe',
      newCharFace.trim() || 'Authentic facial structure, expressive eyes'
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
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
      
      {/* Top Deck Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
            <Clapperboard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Multi-Scene Sequential Storyboard & Character Lock</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                {completedScenes.length} of {scenes.length} Scenes Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Characters locked from Scene 1 carry seamlessly to Scene 2 & 3. New characters integrate without resetting previous locks.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'storyboard' ? 'characters' : 'storyboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
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
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {isBatchRendering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Sequence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Render All {scenes.length} Scenes</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Active Project Character Bank Bar */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Locked Project Characters:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {characterRegistry.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic">
                No character locked yet. Enter prompt in Scene 1 to auto-extract and lock!
              </span>
            ) : (
              characterRegistry.map((char) => (
                <div
                  key={char.id}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-white flex items-center gap-1.5 shadow-2xs group"
                >
                  <span className="text-sm">{char.avatarEmoji}</span>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">
                      <span>{char.name}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-[8.5px] font-mono text-indigo-300 block">
                      Scene {char.originSceneIndex} Anchor
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCharModal(true)}
          className="text-[10.5px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-700 font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          <UserPlus className="w-3 h-3 text-indigo-400" />
          <span>+ Add New Character</span>
        </button>
      </div>

      {/* Characters View Tab */}
      {activeTab === 'characters' && (
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Dynamic Character Lock Bank ({characterRegistry.length} Entities)
            </h4>
            <span className="text-[10.5px] text-slate-400">
              Identity, attire, and facial DNA are mathematically injected into Sora-2 prompts.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {characterRegistry.map((char) => (
              <div
                key={char.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {char.avatarEmoji}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{char.name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-slate-400">{char.roleOrArchetype}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Scene {char.originSceneIndex}
                  </span>
                </div>

                <div className="text-[10.5px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 line-clamp-3">
                  {char.visualDescription}
                </div>

                <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-indigo-300">
                  <span className="truncate max-w-[180px]">{char.anchorToken}</span>
                  <span className="text-emerald-400 font-sans font-bold">✓ 100% ID Locked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sequential Scene Storyboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scenes.map((scene, idx) => {
          const isDone = !!scene.videoUrl;
          const isCurrent = currentGeneratingIndex === idx;
          const isNext = nextUnrenderedIndex === idx;

          return (
            <div
              key={scene.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden space-y-3 ${
                isDone
                  ? 'bg-slate-950/90 border-emerald-500/60 text-white shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                  : isCurrent
                  ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                  : isNext
                  ? 'bg-slate-950/80 border-indigo-500/50 hover:border-indigo-400'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-80'
              }`}
            >
              {/* Scene Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {scene.sceneIndex}
                    </span>
                    {scene.title}
                  </span>

                  {isDone ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9.5px] font-bold border border-indigo-500/30 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Rendering</span>
                    </span>
                  ) : isNext ? (
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/40">
                      NEXT UP
                    </span>
                  ) : (
                    <span className="text-[9.5px] text-slate-500">Queued</span>
                  )}
                </div>

                {/* Video Preview or Placeholder Stage */}
                <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2.5 border border-slate-800 shadow-inner">
                  {isDone && scene.videoUrl ? (
                    <>
                      <video
                        src={scene.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div 
                        onClick={() => onOpenPreview(scene.videoUrl!)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-white/90 group-hover:bg-white text-indigo-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-4 h-4 fill-indigo-900 ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : isCurrent ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/50 p-3 text-center">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mb-1.5" />
                      <span className="text-[10px] text-indigo-200 font-bold">Synthesizing Sora-2 Video...</span>
                      <span className="text-[9px] text-indigo-300/80">Preserving exact character & camera continuity</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 p-3 text-center text-slate-500">
                      <Clapperboard className="w-6 h-6 text-slate-700 mb-1" />
                      <span className="text-[10px] text-slate-400 font-semibold">{scene.duration}s Cinematic Shot</span>
                      <span className="text-[8.5px] text-slate-600">{scene.framing}</span>
                    </div>
                  )}
                </div>

                {/* Active Characters for This Specific Scene */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                    <span>Active Character(s) in Scene {scene.sceneIndex}:</span>
                    <span className="text-[9px] text-indigo-400 font-semibold">Click to toggle</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {characterRegistry.map((char) => {
                      const isActive = scene.activeCharacterIds.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => onToggleCharacterForScene(idx, char.id)}
                          className={`text-[9.5px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer border flex items-center gap-1 ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span>{char.avatarEmoji}</span>
                          <span>{char.name}</span>
                          {isActive && <Check className="w-2.5 h-2.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Display / Edit */}
                <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed line-clamp-3">
                  "{scene.userPrompt}"
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[10px]">
                <div className="text-slate-400 font-mono">
                  {scene.duration}s • {scene.cameraMovement || 'Continuous'}
                </div>

                <div className="flex items-center gap-1.5">
                  {onRemoveScene && scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveScene(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Remove scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                        <span>{isDone ? 'Re-render' : `Render Scene ${scene.sceneIndex}`}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Sequential Scene Action Banner */}
      {nextScene && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/90 via-slate-950 to-indigo-950/90 border border-indigo-500/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-bold text-white">
                Next in Flow: {nextScene.title}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                className="text-[11px] text-indigo-300 hover:text-white font-semibold transition cursor-pointer"
              >
                {isEditingPrompt ? '✓ Done Editing' : '✏️ Edit Scene Prompt'}
              </button>
            </div>
          </div>

          {isEditingPrompt ? (
            <textarea
              value={editedPrompt}
              onChange={(e) => {
                setEditedPrompt(e.target.value);
                onUpdateScenePrompt(nextUnrenderedIndex, e.target.value);
              }}
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          ) : (
            <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed">
              "{nextScene.userPrompt}"
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Preserving exact character DNA & exit frame continuity from Scene {Math.max(1, nextUnrenderedIndex)}.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAddNextSceneBeat}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Scene {scenes.length + 1}</span>
              </button>

              <button
                type="button"
                onClick={() => onGenerateScene(nextScene, nextUnrenderedIndex)}
                disabled={currentGeneratingIndex !== null || isBatchRendering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {currentGeneratingIndex === nextUnrenderedIndex ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Scene {nextScene.sceneIndex}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Scene {nextScene.sceneIndex}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Timeline Assembly Bar */}
      {completedScenes.length >= 1 && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200">
              {completedScenes.length} consistent scene clips ready to assemble into master timeline with audio & subtitles
            </span>
          </div>

          <button
            type="button"
            onClick={onAssembleStoryToTimeline}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span>Assemble Full Story in Video Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Custom Character Modal */}
      {showAddCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Add New Character to Lock Bank</h4>
              </div>
              <button
                onClick={() => setShowAddCharModal(false)}
                className="text-slate-400 hover:text-white"
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
                  placeholder="e.g. Tenzing, Maya, Dr. Rohan, Snow Leopard..."
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
                  placeholder="e.g. Himalayan Sherpa Guide, Tech Scientist, Temple Priest..."
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
                    placeholder="e.g. Jet black wavy hair, tied in bun"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Clothing / Attire:</label>
                  <input
                    type="text"
                    value={newCharClothing}
                    onChange={(e) => setNewCharClothing(e.target.value)}
                    placeholder="e.g. Red down parka with fur hood"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Facial Features:</label>
                  <input
                    type="text"
                    value={newCharFace}
                    onChange={(e) => setNewCharFace(e.target.value)}
                    placeholder="e.g. High cheekbones, warm amber eyes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Comprehensive Visual DNA & Synthesis:</label>
                <textarea
                  rows={2}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="e.g. 30-year-old with weathered face, silver earring, wearing an ochre yellow mountain jacket with hand-knitted woolen gloves..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCharModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Save & Lock Character
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
