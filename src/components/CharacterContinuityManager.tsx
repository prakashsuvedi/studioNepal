import React, { useState, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  Check, 
  Plus, 
  Layers, 
  Shirt, 
  Eye, 
  UserCheck, 
  Palette, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Sparkle,
  Copy,
  Info,
  Sliders,
  ZoomIn,
  ArrowLeftRight,
  Download,
  Upload,
  Film,
  Zap,
  CheckCheck,
  Tag
} from 'lucide-react';
import { 
  DynamicCharacterIdentity, 
  SequentialSceneNode, 
  ExportedSceneSequenceProject, 
  downloadSceneSequenceProjectJSON,
  quickSwapSceneCharacter,
  ContinuityKeyword,
  extractContinuityKeywordsFromScene,
  formatContinuityKeywordsPrefix,
  applyContinuityKeywordsToSequence
} from '../services/characterContinuityEngine';
import { SequencePreviewWireframe } from './SequencePreviewWireframe';
import { ContinuityKeywordsPanel } from './ContinuityKeywordsPanel';

export type CharacterModeSelection = 'reuse' | 'new';

interface CharacterContinuityManagerProps {
  characters: DynamicCharacterIdentity[];
  selectedCharacterId: string | null;
  characterMode: CharacterModeSelection;
  scenes?: SequentialSceneNode[];
  onSelectCharacter: (characterId: string) => void;
  onSetCharacterMode: (mode: CharacterModeSelection) => void;
  onAddNewCharacter: (character: {
    name: string;
    role: string;
    hair: string;
    eyes?: string;
    clothing: string;
    facialFeatures: string;
    avatarEmoji?: string;
    snapshotBase64?: string;
  }) => void;
  onUpdateCharacterDescriptors: (
    characterId: string,
    updates: {
      hair?: string;
      eyes?: string;
      clothing?: string;
      facialFeatures?: string;
      visualDescription?: string;
      snapshotBase64?: string;
      snapshotSceneIndex?: number;
    }
  ) => void;
  onDeleteCharacter?: (characterId: string) => void;
  onCaptureSnapshotFromCurrent?: (characterId: string) => void;
  onQuickSwapSceneCharacter?: (sceneIndex: number, oldCharId: string, newCharId: string) => void;
  onExportSceneSequence?: () => void;
  onImportSceneSequence?: (importedData: any) => void;
  onApplyContinuityKeywords?: (keywords: ContinuityKeyword[], updatedScenes: SequentialSceneNode[]) => void;
  onLoadScenePrompt?: (prompt: string, duration: string) => void;
  initialKeywords?: ContinuityKeyword[];
  initialKeywordsEnabled?: boolean;
  currentSceneNumber?: number;
  totalScenes?: number;
  worldTheme?: string;
  visualStyle?: string;
  aspectRatio?: '16:9' | '9:16';
}

export const CharacterContinuityManager: React.FC<CharacterContinuityManagerProps> = ({
  characters,
  selectedCharacterId,
  characterMode,
  scenes = [],
  onSelectCharacter,
  onSetCharacterMode,
  onAddNewCharacter,
  onUpdateCharacterDescriptors,
  onDeleteCharacter,
  onCaptureSnapshotFromCurrent,
  onQuickSwapSceneCharacter,
  onExportSceneSequence,
  onImportSceneSequence,
  onApplyContinuityKeywords,
  onLoadScenePrompt,
  initialKeywords,
  initialKeywordsEnabled = true,
  currentSceneNumber = 1,
  totalScenes = 1,
  worldTheme = 'Himalayan Cinematic Realism',
  visualStyle = 'Photorealistic 4k 35mm',
  aspectRatio = '16:9'
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'quick_swap' | 'sequence_preview' | 'continuity_keywords' | 'mode_selector'>('gallery');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [previewingSnapshot, setPreviewingSnapshot] = useState<{ name: string; base64: string; token: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectJsonInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadCharId, setTargetUploadCharId] = useState<string | null>(null);

  // Quick-Swap local state
  const [quickSwapSceneIdx, setQuickSwapSceneIdx] = useState<number>(0);
  const [quickSwapOldCharId, setQuickSwapOldCharId] = useState<string>('');
  const [quickSwapNewCharId, setQuickSwapNewCharId] = useState<string>('');

  // Sync Quick-Swap default selection when scene or characters change
  React.useEffect(() => {
    if (scenes && scenes.length > 0) {
      const validSceneIdx = Math.min(quickSwapSceneIdx, scenes.length - 1);
      const activeScene = scenes[validSceneIdx];
      if (activeScene && activeScene.activeCharacterIds.length > 0) {
        if (!activeScene.activeCharacterIds.includes(quickSwapOldCharId)) {
          setQuickSwapOldCharId(activeScene.activeCharacterIds[0]);
        }
      }
    }
  }, [scenes, quickSwapSceneIdx]);

  React.useEffect(() => {
    if (characters.length > 0 && !quickSwapNewCharId) {
      const otherChar = characters.find(c => c.id !== quickSwapOldCharId) || characters[0];
      setQuickSwapNewCharId(otherChar.id);
    }
  }, [characters, quickSwapOldCharId]);

  // New character form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newHair, setNewHair] = useState('');
  const [newEyes, setNewEyes] = useState('');
  const [newClothing, setNewClothing] = useState('');
  const [newFacialFeatures, setNewFacialFeatures] = useState('');
  const [newEmoji, setNewEmoji] = useState('👤');
  const [newSnapshotBase64, setNewSnapshotBase64] = useState<string>('');

  // Edit descriptors form state
  const [editHair, setEditHair] = useState('');
  const [editEyes, setEditEyes] = useState('');
  const [editClothing, setEditClothing] = useState('');
  const [editFacialFeatures, setEditFacialFeatures] = useState('');
  const [editSnapshot, setEditSnapshot] = useState<string | undefined>(undefined);

  const activeChar = characters.find(c => c.id === selectedCharacterId) || characters[0];

  const handleStartEdit = (char: DynamicCharacterIdentity) => {
    setEditingCharId(char.id);
    setEditHair(char.hair || 'Natural dark textured hair with clean highlights');
    setEditEyes(char.eyes || 'Expressive dark brown eyes, sharp optical focus');
    setEditClothing(char.clothing || char.attire || 'Signature authentic wardrobe with realistic fabric texture');
    setEditFacialFeatures(char.facialFeatures || 'Distinctive authentic facial structure, sharp natural focus');
    setEditSnapshot(char.snapshotBase64 || char.referenceImage);
  };

  const handleSaveEdit = (charId: string) => {
    onUpdateCharacterDescriptors(charId, {
      hair: editHair,
      eyes: editEyes,
      clothing: editClothing,
      facialFeatures: editFacialFeatures,
      snapshotBase64: editSnapshot
    });
    setEditingCharId(null);
  };

  const handleCreateNewCharSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddNewCharacter({
      name: newName.trim(),
      role: newRole.trim() || 'Featured Character',
      hair: newHair.trim() || 'Distinctive natural styled hair',
      eyes: newEyes.trim() || 'Expressive dark brown eyes, authentic gaze',
      clothing: newClothing.trim() || 'Authentic wardrobe with rich fabric texture',
      facialFeatures: newFacialFeatures.trim() || 'Authentic facial structure, expressive eyes',
      avatarEmoji: newEmoji,
      snapshotBase64: newSnapshotBase64 || undefined
    });

    setNewName('');
    setNewRole('');
    setNewHair('');
    setNewEyes('');
    setNewClothing('');
    setNewFacialFeatures('');
    setNewSnapshotBase64('');
    setShowAddModal(false);
  };

  const handleCopyAnchorToken = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        if (targetUploadCharId) {
          onUpdateCharacterDescriptors(targetUploadCharId, {
            snapshotBase64: base64,
            snapshotSceneIndex: currentSceneNumber
          });
          setTargetUploadCharId(null);
        } else if (showAddModal) {
          setNewSnapshotBase64(base64);
        } else if (editingCharId) {
          setEditSnapshot(base64);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Export Scene Sequence JSON Handler
  const handleTriggerExportJSON = () => {
    if (onExportSceneSequence) {
      onExportSceneSequence();
      return;
    }

    const sceneToCharMapping = scenes.map(s => {
      const activeChars = characters.filter(c => s.activeCharacterIds.includes(c.id));
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

    const snapshotsCount = characters.filter(c => Boolean(c.snapshotBase64 || c.referenceImage)).length;

    const projectData: ExportedSceneSequenceProject = {
      formatVersion: '1.0',
      exportTimestamp: new Date().toISOString(),
      exportedBy: 'NepalAI Studio - Sora-2 Character Continuity Engine',
      projectId: `proj-${Date.now()}`,
      projectTitle: scenes[0]?.title ? `Continuity Project: ${scenes[0].title}` : 'Sora-2 Character Sequence',
      worldTheme,
      visualStyle,
      aspectRatio: (aspectRatio === '9:16' ? '9:16' : '16:9') as '16:9' | '9:16',
      characterMode,
      selectedCharacterId,
      characters,
      scenes,
      sceneToCharacterMapping: sceneToCharMapping,
      totalScenes: scenes.length,
      totalLockedCharacters: characters.length,
      snapshotsIncluded: snapshotsCount
    };

    downloadSceneSequenceProjectJSON(projectData, `sora_sequence_project_${Date.now()}.json`);
    setToastMessage(`💾 Exported Scene Sequence JSON (${scenes.length} scenes, ${characters.length} characters, ${snapshotsCount} snapshots)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Import Project JSON Handler
  const handleTriggerImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (onImportSceneSequence) {
          onImportSceneSequence(parsed);
        } else {
          setToastMessage(`📂 Read JSON Project file with ${parsed.scenes?.length || 0} scenes and ${parsed.characters?.length || 0} characters.`);
          setTimeout(() => setToastMessage(null), 3500);
        }
      } catch (err) {
        alert('Invalid JSON file. Please provide a valid exported Sora Sequence project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Quick-Swap Execution
  const handleExecuteQuickSwap = () => {
    if (!quickSwapOldCharId || !quickSwapNewCharId) {
      alert('Please select both the character to replace and the replacement character.');
      return;
    }

    if (quickSwapOldCharId === quickSwapNewCharId) {
      alert('The replacement character must be different from the current character.');
      return;
    }

    if (onQuickSwapSceneCharacter) {
      onQuickSwapSceneCharacter(quickSwapSceneIdx, quickSwapOldCharId, quickSwapNewCharId);
    }

    const oldName = characters.find(c => c.id === quickSwapOldCharId)?.name || 'Character';
    const newName = characters.find(c => c.id === quickSwapNewCharId)?.name || 'Target';
    setToastMessage(`⚡ Quick-Swapped Scene ${quickSwapSceneIdx + 1}: Replaced "${oldName}" with "${newName}" while maintaining all motion & camera settings!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const currentSelectedScene = scenes[quickSwapSceneIdx] || scenes[0];
  const oldCharObj = characters.find(c => c.id === quickSwapOldCharId);
  const newCharObj = characters.find(c => c.id === quickSwapNewCharId);

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 text-white">
      
      {/* Hidden file input for Base64 Snapshot Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden file input for Project Sequence JSON Imports */}
      <input
        type="file"
        ref={projectJsonInputRef}
        onChange={handleTriggerImportJSON}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Character Continuity Manager</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {characters.length} {characters.length === 1 ? 'Profile' : 'Profiles'} Locked
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Visual descriptors (hair, eyes, clothing, face) &amp; base-64 snapshots locked across Sora-2 clips.
            </p>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export JSON Download Button */}
          <button
            type="button"
            onClick={handleTriggerExportJSON}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-emerald-500/50"
            title="Download full character configuration, snapshots, and scene mapping as a reusable JSON project file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sequence (.json)</span>
          </button>

          {/* Import JSON Button */}
          <button
            type="button"
            onClick={() => projectJsonInputRef.current?.click()}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Import an existing sequence JSON project file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import JSON</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Visual Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick_swap')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'quick_swap'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Quick-Swap</span>
              {scenes.length > 0 && (
                <span className="ml-0.5 text-[9px] px-1 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                  {scenes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sequence_preview')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'sequence_preview'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3 text-cyan-300" />
              <span>Sequence Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('continuity_keywords')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'continuity_keywords'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Continuity Keywords</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mode_selector')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'mode_selector'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Next Scene Mode</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ New Profile</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Mode Selector Mini Bar */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Next Scene Sequence Mode:</span>
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                characterMode === 'reuse' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}>
                {characterMode === 'reuse' ? (
                  <>
                    <UserCheck className="w-3 h-3 text-indigo-400" />
                    <span>Reusing Locked Profile ({activeChar?.name || 'Selected'})</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Generate New Character ID</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSetCharacterMode('reuse')}
                className={`text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                  characterMode === 'reuse'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Reuse Existing ID
              </button>
              <button
                type="button"
                onClick={() => onSetCharacterMode('new')}
                className={`text-[10.5px] px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                  characterMode === 'new'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Generate New ID
              </button>
            </div>
          </div>

          {/* TAB 1: VISUAL GALLERY OF CURRENTLY LOCKED CHARACTER PROFILES */}
          {activeTab === 'gallery' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">Visual Character Profile Gallery</span>
                  <span className="text-slate-500 font-normal">({characters.length} registered visual styles)</span>
                </div>
                <span className="text-[10px] text-indigo-400">Click any profile to lock or inspect visual DNA</span>
              </div>

              {/* Gallery Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {characters.map((char) => {
                  const isSelected = selectedCharacterId === char.id || (!selectedCharacterId && activeChar?.id === char.id);
                  const hasSnapshot = Boolean(char.snapshotBase64 || char.referenceImage);
                  const snapshotImg = char.snapshotBase64 || char.referenceImage;

                  return (
                    <div
                      key={char.id}
                      onClick={() => onSelectCharacter(char.id)}
                      className={`rounded-xl border transition cursor-pointer flex flex-col justify-between relative group overflow-hidden ${
                        isSelected
                          ? 'bg-slate-950/90 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      {/* Top Visual Banner / Snapshot Stage */}
                      <div className="relative h-28 w-full bg-slate-900 overflow-hidden border-b border-slate-800/80 flex items-center justify-center">
                        {hasSnapshot && snapshotImg ? (
                          <div className="relative w-full h-full group/img">
                            <img
                              src={snapshotImg}
                              alt={char.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                            
                            {/* Zoom Snapshot Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewingSnapshot({
                                  name: char.name,
                                  base64: snapshotImg,
                                  token: char.anchorToken
                                });
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition backdrop-blur-xs cursor-pointer shadow-xs opacity-0 group-hover/img:opacity-100"
                              title="Zoom snapshot visual style"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>

                            <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 backdrop-blur-xs">
                                <Camera className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Snapshot Captured</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-3 text-center">
                            <span className="text-3xl mb-1 filter drop-shadow-md">{char.avatarEmoji}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Latent Vector Lock</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetUploadCharId(char.id);
                                fileInputRef.current?.click();
                              }}
                              className="mt-1 text-[9.5px] px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-600 text-indigo-200 hover:text-white transition flex items-center gap-1 cursor-pointer border border-indigo-700/50"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>Attach Snapshot</span>
                            </button>
                          </div>
                        )}

                        {/* Top Left Selection Status Pill */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {isSelected ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-3 h-3 text-emerald-300" />
                              <span>ACTIVE LOCK</span>
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-900/80 text-slate-400 border border-slate-700/80 backdrop-blur-xs">
                              Scene {char.originSceneIndex}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content & Structured Visual Descriptors */}
                      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        
                        {/* Title & Archetype */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{char.name}</span>
                              <span className="text-xs">{char.avatarEmoji}</span>
                            </h4>
                            <span className="text-[10.5px] text-indigo-300 font-medium block truncate">
                              {char.roleOrArchetype}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleCopyAnchorToken(char.anchorToken, e)}
                            className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 font-mono border border-slate-800 transition flex items-center gap-1 shrink-0"
                            title="Copy Anchor Token for Sora prompt"
                          >
                            {copiedToken === char.anchorToken ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                            <span className="truncate max-w-[80px]">{char.anchorToken.slice(0, 15)}...</span>
                          </button>
                        </div>

                        {/* Visual Descriptors Checklist Matrix (Hair, Eyes, Clothing, Face) */}
                        <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-[10px]">
                          
                          {/* 1. Hair */}
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1">
                              <Palette className="w-3 h-3 text-amber-400" />
                              <span>Hair:</span>
                            </span>
                            <span className="text-slate-200 line-clamp-1">
                              {char.hair || 'Natural dark textured hair with authentic styling'}
                            </span>
                          </div>

                          {/* 2. Eyes */}
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-blue-400 font-bold shrink-0 flex items-center gap-1">
                              <Eye className="w-3 h-3 text-blue-400" />
                              <span>Eyes:</span>
                            </span>
                            <span className="text-slate-200 line-clamp-1">
                              {char.eyes || 'Expressive dark brown eyes, authentic gaze'}
                            </span>
                          </div>

                          {/* 3. Clothing / Attire */}
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-cyan-400 font-bold shrink-0 flex items-center gap-1">
                              <Shirt className="w-3 h-3 text-cyan-400" />
                              <span>Clothing:</span>
                            </span>
                            <span className="text-slate-200 line-clamp-1">
                              {char.clothing || char.attire || 'Signature cultural attire with rich fabric texture'}
                            </span>
                          </div>

                          {/* 4. Facial Structure */}
                          <div className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Face:</span>
                            </span>
                            <span className="text-slate-200 line-clamp-1">
                              {char.facialFeatures || 'Distinctive authentic facial geometry, photorealistic skin'}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-800/80 text-[10.5px] gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(char);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1"
                            >
                              <Sliders className="w-3 h-3 text-indigo-400" />
                              <span>Edit DNA</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetUploadCharId(char.id);
                                fileInputRef.current?.click();
                              }}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1"
                              title="Update base-64 reference snapshot image"
                            >
                              <Camera className="w-3 h-3 text-emerald-400" />
                              <span>{hasSnapshot ? 'Replace Pic' : '+ Snapshot'}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Quick-Swap Target Button */}
                            {scenes.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickSwapNewCharId(char.id);
                                  setActiveTab('quick_swap');
                                }}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 font-bold transition cursor-pointer flex items-center gap-1 border border-amber-500/30"
                                title="Swap this character into a specific scene"
                              >
                                <Zap className="w-2.5 h-2.5 text-amber-400" />
                                <span>Swap Into...</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCharacter(char.id);
                                onSetCharacterMode('reuse');
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>{isSelected ? 'Locked' : 'Lock ID'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: QUICK-SWAP CHARACTER FUNCTIONALITY */}
          {activeTab === 'quick_swap' && (
            <div className="space-y-4">
              {/* Quick-Swap Intro & Motion Guarantee Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <span>⚡ Quick-Swap Character in Specific Scene</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                        Motion &amp; Camera Preserved
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Replaces character identity &amp; DNA in any scene while strictly maintaining camera movement, framing, lighting atmosphere, speed, and transition settings.
                    </p>
                  </div>
                </div>
              </div>

              {scenes.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <Film className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No scenes created yet in the story sequence.</p>
                  <p className="text-[11px] text-slate-500">Generate or add a scene beat in the Storyboard deck below to enable Quick-Swapping.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step 1: Select Target Scene */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      <span>1. Select Target Scene to Modify:</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {scenes.map((scene, idx) => {
                        const isSceneSelected = quickSwapSceneIdx === idx;
                        const assignedChars = characters.filter(c => scene.activeCharacterIds.includes(c.id));
                        return (
                          <div
                            key={scene.id}
                            onClick={() => {
                              setQuickSwapSceneIdx(idx);
                              if (scene.activeCharacterIds.length > 0) {
                                setQuickSwapOldCharId(scene.activeCharacterIds[0]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1.5 ${
                              isSceneSelected
                                ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1">
                                <span>Scene {scene.sceneIndex}</span>
                                {scene.videoUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">{scene.duration}s</span>
                            </div>

                            <p className="text-[11px] text-slate-300 line-clamp-1 font-medium">{scene.title}</p>

                            <div className="flex items-center gap-1 text-[10px] text-indigo-300">
                              <span>Actor:</span>
                              <span className="font-bold text-white truncate">
                                {assignedChars.map(c => `${c.avatarEmoji} ${c.name}`).join(', ') || 'None'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Preserved Cinematography & Motion Settings Display */}
                  {currentSelectedScene && (
                    <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Preserved Motion &amp; Cinematography Settings for Scene {currentSelectedScene.sceneIndex}</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          100% Locked &amp; Maintained
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">🎥 Camera Movement</span>
                          <span className="text-[11px] font-bold text-indigo-300 line-clamp-1">
                            {currentSelectedScene.cameraMovement || 'Smooth Dynamic Dolly'}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">📐 Framing</span>
                          <span className="text-[11px] font-bold text-indigo-300 line-clamp-1">
                            {currentSelectedScene.framing || 'Cinematic Wide 35mm'}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">💡 Lighting Atmosphere</span>
                          <span className="text-[11px] font-bold text-indigo-300 line-clamp-1">
                            {currentSelectedScene.lightingAtmosphere || 'Natural Alpenglow Warm'}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">⏱️ Duration</span>
                          <span className="text-[11px] font-bold text-indigo-300">
                            {currentSelectedScene.duration} Seconds
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Interactive Side-by-Side Character Swap Console */}
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                    
                    {/* Left: Old Character Currently in Scene */}
                    <div className="md:col-span-5 space-y-2">
                      <label className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block flex items-center gap-1">
                        <span>Current Character in Scene {currentSelectedScene?.sceneIndex || 1}</span>
                      </label>

                      <select
                        value={quickSwapOldCharId}
                        onChange={(e) => setQuickSwapOldCharId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                      >
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.avatarEmoji} {c.name} ({c.roleOrArchetype})
                          </option>
                        ))}
                      </select>

                      {oldCharObj && (
                        <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-lg space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-200">{oldCharObj.avatarEmoji} {oldCharObj.name}</span>
                            <span className="text-[10px] text-rose-300 font-mono">Current Actor</span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 line-clamp-2">
                            {oldCharObj.visualDescription}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Middle: Swap Arrow Indicator */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-md">
                        <ArrowLeftRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Right: Replacement Character from Gallery */}
                    <div className="md:col-span-5 space-y-2">
                      <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
                        <span>Replacement Character from Gallery</span>
                      </label>

                      <select
                        value={quickSwapNewCharId}
                        onChange={(e) => setQuickSwapNewCharId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.avatarEmoji} {c.name} ({c.roleOrArchetype}) {c.snapshotBase64 ? '• Has Snapshot' : ''}
                          </option>
                        ))}
                      </select>

                      {newCharObj && (
                        <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-200">{newCharObj.avatarEmoji} {newCharObj.name}</span>
                            <span className="text-[10px] text-emerald-300 font-mono">New Injected Actor</span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 line-clamp-2">
                            {newCharObj.visualDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Execute Quick-Swap Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-[11px] text-slate-400">
                      ⚡ Ready to update Scene {currentSelectedScene?.sceneIndex || 1} prompt with <span className="text-white font-bold">{newCharObj?.name || 'Target'}</span>'s visual DNA &amp; anchor token.
                    </p>

                    <button
                      type="button"
                      onClick={handleExecuteQuickSwap}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-200" />
                      <span>⚡ Quick-Swap Character in Scene {currentSelectedScene?.sceneIndex || 1}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTINUITY MODE CONFIGURATION & INSPECTOR */}
          {activeTab === 'mode_selector' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Reuse Existing Character */}
                <button
                  type="button"
                  onClick={() => onSetCharacterMode('reuse')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer relative ${
                    characterMode === 'reuse'
                      ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    characterMode === 'reuse' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Reuse Existing Character</span>
                      {characterMode === 'reuse' && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Carries locked identity, hair, eyes, clothing, and facial descriptors from Scene 1 to Scene N.
                    </p>
                  </div>
                </button>

                {/* Option 2: Generate New Character */}
                <button
                  type="button"
                  onClick={() => onSetCharacterMode('new')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer relative ${
                    characterMode === 'new'
                      ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/40 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    characterMode === 'new' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Generate New Character</span>
                      {characterMode === 'new' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Synthesizes a fresh protagonist ID while keeping existing locked characters safe in the registry.
                    </p>
                  </div>
                </button>
              </div>

              {/* Active Profile Visual DNA Blueprint */}
              {activeChar && characterMode === 'reuse' && (
                <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Active Sora-2 Continuity Injection: <span className="text-indigo-300 font-bold">{activeChar.name}</span> ({activeChar.roleOrArchetype})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(activeChar)}
                      className="text-[11px] text-indigo-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Edit Descriptors</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        <span>Hair Style &amp; Color:</span>
                      </span>
                      <p className="text-[11px] text-slate-200 line-clamp-2">
                        {activeChar.hair || 'Natural dark textured hair'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Eyes &amp; Gaze:</span>
                      </span>
                      <p className="text-[11px] text-slate-200 line-clamp-2">
                        {activeChar.eyes || 'Expressive dark brown eyes'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                        <Shirt className="w-3 h-3" />
                        <span>Clothing / Attire:</span>
                      </span>
                      <p className="text-[11px] text-slate-200 line-clamp-2">
                        {activeChar.clothing || activeChar.attire || 'Authentic wardrobe'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Facial Features:</span>
                      </span>
                      <p className="text-[11px] text-slate-200 line-clamp-2">
                        {activeChar.facialFeatures || 'Authentic facial structure'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEQUENCE PREVIEW & ANIMATED STORYBOARD WIREFRAME */}
          {activeTab === 'sequence_preview' && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 animate-in fade-in duration-200">
              <SequencePreviewWireframe
                scenes={scenes}
                characters={characters}
                aspectRatio={aspectRatio}
                worldTheme={worldTheme}
                visualStyle={visualStyle}
                onSelectScene={(idx) => setQuickSwapSceneIdx(idx)}
                onLoadScenePrompt={onLoadScenePrompt}
              />
            </div>
          )}

          {/* TAB 5: AUTOMATED CONTINUITY KEYWORDS ENGINE */}
          {activeTab === 'continuity_keywords' && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 animate-in fade-in duration-200">
              <ContinuityKeywordsPanel
                scenes={scenes}
                characters={characters}
                worldTheme={worldTheme}
                visualStyle={visualStyle}
                initialKeywords={initialKeywords}
                initialEnabled={initialKeywordsEnabled}
                onApplyKeywords={(kws, updatedScenes) => {
                  if (onApplyContinuityKeywords) {
                    onApplyContinuityKeywords(kws, updatedScenes);
                  }
                  setToastMessage(`✨ Applied ${kws.filter(k => k.enabled).length} Continuity Keywords to sequence!`);
                  setTimeout(() => setToastMessage(null), 3500);
                }}
              />
            </div>
          )}

        </div>
      )}

      {/* LIGHTBOX MODAL: FULL SNAPSHOT VISUAL STYLE PREVIEW */}
      {previewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Character Visual Reference Snapshot</h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingSnapshot(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-slate-800 max-h-[360px] flex items-center justify-center">
              <img
                src={previewingSnapshot.base64}
                alt={previewingSnapshot.name}
                referrerPolicy="no-referrer"
                className="w-full h-full max-h-[360px] object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-white">{previewingSnapshot.name}</span>
              <span className="font-mono text-indigo-300 text-[11px]">{previewingSnapshot.token}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DESCRIPTORS (HAIR, EYES, CLOTHING, FACIAL FEATURES) */}
      {editingCharId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Edit Visual Continuity Descriptors</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingCharId(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-amber-400 block mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Hair Style &amp; Color Descriptor:</span>
                </label>
                <input
                  type="text"
                  value={editHair}
                  onChange={(e) => setEditHair(e.target.value)}
                  placeholder="e.g. Short dark textured hair, windblown strands, clean part"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-blue-400 block mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Eyes &amp; Gaze Descriptor:</span>
                </label>
                <input
                  type="text"
                  value={editEyes}
                  onChange={(e) => setEditEyes(e.target.value)}
                  placeholder="e.g. Deep amber-brown eyes, intense calm gaze, fine natural eye creases"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-cyan-400 block mb-1 flex items-center gap-1">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Clothing / Wardrobe Descriptor:</span>
                </label>
                <input
                  type="text"
                  value={editClothing}
                  onChange={(e) => setEditClothing(e.target.value)}
                  placeholder="e.g. Ochre yellow mountain jacket with charcoal grey inner fleece and silver zipper"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Facial Features &amp; Skin Texture:</span>
                </label>
                <input
                  type="text"
                  value={editFacialFeatures}
                  onChange={(e) => setEditFacialFeatures(e.target.value)}
                  placeholder="e.g. Weathered high-altitude complexion, sharp jawline, 4k skin micro-textures"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Snapshot reference attachment preview */}
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Base-64 Visual Style Snapshot:</span>
                </label>
                <div className="flex items-center gap-3">
                  {editSnapshot ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 relative shrink-0">
                      <img src={editSnapshot} alt="Snapshot" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs shrink-0">
                      None
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{editSnapshot ? 'Replace Base64 Snapshot' : 'Upload Snapshot Image'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCharId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveEdit(editingCharId)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Descriptors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW CHARACTER PROFILE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Register New Character Profile</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCharSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Character Name:</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Maya, Tenzing, Dr. Aarav..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Avatar Emoji:</label>
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    maxLength={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Role / Archetype:</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Mountain Guide, Archaeologist, Buddhist Monk..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-amber-400 block mb-1">Hair Descriptor:</label>
                  <input
                    type="text"
                    value={newHair}
                    onChange={(e) => setNewHair(e.target.value)}
                    placeholder="e.g. Jet black wavy hair tied in bun"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-blue-400 block mb-1">Eyes Descriptor:</label>
                  <input
                    type="text"
                    value={newEyes}
                    onChange={(e) => setNewEyes(e.target.value)}
                    placeholder="e.g. Deep dark brown almond eyes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-cyan-400 block mb-1">Clothing / Attire Descriptor:</label>
                <input
                  type="text"
                  value={newClothing}
                  onChange={(e) => setNewClothing(e.target.value)}
                  placeholder="e.g. Maroon monks robe with saffron yellow sash and wooden prayer beads"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-400 block mb-1">Facial Features Descriptor:</label>
                <input
                  type="text"
                  value={newFacialFeatures}
                  onChange={(e) => setNewFacialFeatures(e.target.value)}
                  placeholder="e.g. Serene peaceful expression, warm wrinkles around eyes, photorealistic skin"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Snapshot Upload */}
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Visual Snapshot (Optional):</label>
                <div className="flex items-center gap-3">
                  {newSnapshotBase64 ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500 relative">
                      <img src={newSnapshotBase64} alt="New Snapshot" className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{newSnapshotBase64 ? 'Change Snapshot' : 'Upload Snapshot Image'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Register &amp; Lock Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
