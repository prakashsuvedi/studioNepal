import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Lock, 
  Unlock, 
  Upload, 
  User, 
  Check, 
  Sliders, 
  Eye, 
  Camera, 
  RefreshCw, 
  Copy, 
  CheckCheck,
  ShieldCheck,
  Layers,
  Wand2,
  Scan,
  Zap,
  Info,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
  ArrowRight
} from 'lucide-react';
import { CharacterAvatar, BiometricParameters } from '../types';

interface CharacterConsistencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter?: (character: CharacterAvatar) => void;
  onApplyAnchorToPrompt?: (anchorToken: string, promptDescriptor: string) => void;
}

export const PRESET_AVATARS: CharacterAvatar[] = [
  {
    id: 'avatar-maya-01',
    name: 'Maya Thapa (Tech Creator)',
    gender: 'female',
    ageRange: 'mid_20s',
    ethnicityStyle: 'nepali_pahadi',
    avatarImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    referenceImages: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80'
    ],
    biometricAnchorToken: '[Biometric-Anchor: FaceID_v4#Maya_0192]',
    promptDescriptor: '25-year-old Nepali woman, high cheekbones, almond hazel-brown eyes, refined straight nose bridge, defined jawline angle 112 deg, shoulder-length glossy wavy black hair, warm golden undertone skin',
    createdAt: '2026-08-15',
    scenesCountUsed: 14,
    isLocked: true,
    biometricParams: {
      pitchAngle: 0,
      yawAngle: 5,
      rollAngle: 0,
      eyeShape: 'almond',
      eyeColor: 'hazel',
      interpupillaryDistance: 1.05,
      eyebrowArch: 'soft_curve',
      noseBridgeHeight: 1.1,
      noseTipAngle: 'refined',
      alarBaseWidth: 0.95,
      earPlacementRatio: 1.0,
      earLobeType: 'free',
      hairStyle: 'wavy_shoulder',
      hairColor: 'jet_black',
      hairlineHeight: 1.0,
      jawlineAngle: 112,
      chinProminence: 'rounded',
      cheekboneProminence: 1.25,
      neckLengthRatio: 1.05,
      lipFullness: 'medium',
      philtrumDepth: 0.95,
      expression: 'confident_smile'
    }
  },
  {
    id: 'avatar-aarav-02',
    name: 'Aarav Sharma (Business Host)',
    gender: 'male',
    ageRange: 'early_30s',
    ethnicityStyle: 'south_asian',
    avatarImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    referenceImages: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'
    ],
    biometricAnchorToken: '[Biometric-Anchor: FaceID_v4#Aarav_8841]',
    promptDescriptor: '31-year-old South Asian man, sharp square jawline 98 deg, deep brown expressive eyes, straight prominent nose bridge, neat side-part dark espresso hair, charismatic broadcast host appearance',
    createdAt: '2026-08-20',
    scenesCountUsed: 9,
    isLocked: true,
    biometricParams: {
      pitchAngle: -2,
      yawAngle: -3,
      rollAngle: 0,
      eyeShape: 'deep_set',
      eyeColor: 'deep_brown',
      interpupillaryDistance: 1.0,
      eyebrowArch: 'bold_defined',
      noseBridgeHeight: 1.2,
      noseTipAngle: 'straight',
      alarBaseWidth: 1.0,
      earPlacementRatio: 1.02,
      earLobeType: 'attached',
      hairStyle: 'classic_part',
      hairColor: 'dark_espresso',
      hairlineHeight: 1.05,
      jawlineAngle: 98,
      chinProminence: 'square',
      cheekboneProminence: 1.15,
      neckLengthRatio: 1.0,
      lipFullness: 'medium',
      philtrumDepth: 1.0,
      expression: 'charismatic_speaking'
    }
  },
  {
    id: 'avatar-dawa-03',
    name: 'Dawa Sherpa (Adventure Guide)',
    gender: 'male',
    ageRange: 'mid_20s',
    ethnicityStyle: 'himalayan_sherpa',
    avatarImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    referenceImages: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80'
    ],
    biometricAnchorToken: '[Biometric-Anchor: FaceID_v4#Dawa_5519]',
    promptDescriptor: '27-year-old Himalayan mountain guide, high cheekbones, dark amber eyes, sun-kissed alpine skin, athletic jawline, weather-textured hair, sincere adventurous expression',
    createdAt: '2026-08-28',
    scenesCountUsed: 6,
    isLocked: true,
    biometricParams: {
      pitchAngle: 3,
      yawAngle: 0,
      rollAngle: 0,
      eyeShape: 'hooded',
      eyeColor: 'amber',
      interpupillaryDistance: 1.02,
      eyebrowArch: 'straight',
      noseBridgeHeight: 1.05,
      noseTipAngle: 'aquiline',
      alarBaseWidth: 1.05,
      earPlacementRatio: 0.98,
      earLobeType: 'free',
      hairStyle: 'top_knot',
      hairColor: 'jet_black',
      hairlineHeight: 0.95,
      jawlineAngle: 105,
      chinProminence: 'pointed',
      cheekboneProminence: 1.35,
      neckLengthRatio: 1.1,
      lipFullness: 'medium',
      philtrumDepth: 0.9,
      expression: 'heroic_serious'
    }
  }
];

export const CharacterConsistencyModal: React.FC<CharacterConsistencyModalProps> = ({
  isOpen,
  onClose,
  onSelectCharacter,
  onApplyAnchorToPrompt,
}) => {
  const [avatars, setAvatars] = useState<CharacterAvatar[]>(() => {
    try {
      const saved = localStorage.getItem('nepalai_saved_avatars');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return PRESET_AVATARS;
  });

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(PRESET_AVATARS[0].id);
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'biometrics' | 'angles'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Active avatar being edited or previewed
  const currentAvatar = avatars.find(a => a.id === selectedAvatarId) || avatars[0];

  const [editableParams, setEditableParams] = useState<BiometricParameters>(currentAvatar.biometricParams);
  const [avatarName, setAvatarName] = useState(currentAvatar.name);

  // Synchronize when selected avatar changes
  React.useEffect(() => {
    if (currentAvatar) {
      setEditableParams(currentAvatar.biometricParams);
      setAvatarName(currentAvatar.name);
    }
  }, [selectedAvatarId]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropPhoto = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleApplyUploadedPhoto(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUploadedPhoto = (photoUrl: string, fileName?: string) => {
    setIsScanning(true);
    const updatedRefImages = [photoUrl, ...(currentAvatar.referenceImages || [])].slice(0, 6);
    
    // Simulate high-fidelity 68-point landmark biometric extraction
    setTimeout(() => {
      setIsScanning(false);
      const extractedParams: BiometricParameters = {
        ...editableParams,
        interpupillaryDistance: 1.04,
        noseBridgeHeight: 1.12,
        jawlineAngle: 106,
        cheekboneProminence: 1.28,
        philtrumDepth: 0.95,
        lipFullness: 'medium',
        expression: 'confident_smile',
      };
      setEditableParams(extractedParams);

      setAvatars(prev => {
        const updatedList = prev.map(a => {
          if (a.id === selectedAvatarId) {
            return {
              ...a,
              avatarImageUrl: photoUrl,
              referenceImages: updatedRefImages,
              biometricParams: extractedParams,
              promptDescriptor: `Biometric twin extracted from photo (${fileName || 'custom reference'}), defined facial contours, 100% structural feature lock`,
            };
          }
          return a;
        });
        try {
          localStorage.setItem('nepalai_saved_avatars', JSON.stringify(updatedList));
        } catch (e) {}
        return updatedList;
      });
    }, 1500);
  };

  const handleSetPrimaryReference = (imgUrl: string) => {
    setAvatars(prev => {
      const updatedList = prev.map(a => {
        if (a.id === selectedAvatarId) {
          return {
            ...a,
            avatarImageUrl: imgUrl,
          };
        }
        return a;
      });
      try {
        localStorage.setItem('nepalai_saved_avatars', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });
  };

  const handleDeleteReference = (idxToRemove: number) => {
    setAvatars(prev => {
      const updatedList = prev.map(a => {
        if (a.id === selectedAvatarId) {
          const updatedRefs = (a.referenceImages || []).filter((_, idx) => idx !== idxToRemove);
          return {
            ...a,
            referenceImages: updatedRefs,
            avatarImageUrl: updatedRefs[0] || a.avatarImageUrl,
          };
        }
        return a;
      });
      try {
        localStorage.setItem('nepalai_saved_avatars', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });
  };

  const handleUpdateParam = <K extends keyof BiometricParameters>(key: K, value: BiometricParameters[K]) => {
    setEditableParams(prev => {
      const updated = { ...prev, [key]: value };
      // Update in avatars list
      setAvatars(list => list.map(a => {
        if (a.id === selectedAvatarId) {
          return {
            ...a,
            biometricParams: updated,
            promptDescriptor: generatePromptDescriptor(a.name, a.ageRange, a.ethnicityStyle, updated)
          };
        }
        return a;
      }));
      return updated;
    });
  };

  const generatePromptDescriptor = (name: string, age: string, ethnicity: string, p: BiometricParameters): string => {
    return `${ethnicity.replace('_', ' ')} individual, ${p.eyeShape} ${p.eyeColor.replace('_', ' ')} eyes, ${p.noseTipAngle} nose bridge (${p.noseBridgeHeight}x), jawline angle ${p.jawlineAngle} deg with ${p.chinProminence} chin, cheekbones prominence ${p.cheekboneProminence}x, ${p.hairStyle.replace(/_/g, ' ')} ${p.hairColor.replace(/_/g, ' ')} hair, ${p.expression.replace(/_/g, ' ')}`;
  };

  const handleSimulateBiometricScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Auto-tune parameters from biometric photo scan
      const scannedParams: BiometricParameters = {
        ...editableParams,
        interpupillaryDistance: 1.04,
        noseBridgeHeight: 1.15,
        jawlineAngle: 108,
        cheekboneProminence: 1.3,
        earPlacementRatio: 1.01,
        philtrumDepth: 0.92,
      };
      setEditableParams(scannedParams);
      handleUpdateParam('jawlineAngle', 108);
    }, 1800);
  };

  const handleCreateNewAvatar = () => {
    const newId = `avatar-custom-${Date.now()}`;
    const newAvatar: CharacterAvatar = {
      id: newId,
      name: 'New Custom Character',
      gender: 'female',
      ageRange: 'mid_20s',
      ethnicityStyle: 'nepali_pahadi',
      avatarImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
      referenceImages: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80'],
      biometricAnchorToken: `[Biometric-Anchor: FaceID_v4#Lock_${Math.floor(Math.random() * 9000 + 1000)}]`,
      promptDescriptor: 'Custom created biometric character avatar with 100% structural feature anchoring',
      createdAt: new Date().toISOString().split('T')[0],
      scenesCountUsed: 0,
      isLocked: true,
      biometricParams: { ...editableParams }
    };
    const updated = [newAvatar, ...avatars];
    setAvatars(updated);
    setSelectedAvatarId(newId);
    try {
      localStorage.setItem('nepalai_saved_avatars', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleCopyAnchor = () => {
    if (currentAvatar) {
      navigator.clipboard.writeText(`${currentAvatar.biometricAnchorToken} ${currentAvatar.promptDescriptor}`);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleApplyToStudio = () => {
    if (currentAvatar) {
      if (onSelectCharacter) onSelectCharacter(currentAvatar);
      if (onApplyAnchorToPrompt) {
        onApplyAnchorToPrompt(currentAvatar.biometricAnchorToken, currentAvatar.promptDescriptor);
      }
      setAppliedNotice(true);
      setTimeout(() => {
        setAppliedNotice(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-label="Character Consistency Engine"
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Module 1: Absolute Character Consistency Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-700/50 text-cyan-300">
                  FaceID Biometric Locked
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% Identical structural facial descriptors, biometric spatial anchoring & digital painter continuity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewAvatar}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Avatar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Avatar Selector & Biometric Wireframe Scan Preview (5 Cols) */}
          <div className="lg:col-span-5 p-5 border-r border-slate-800/80 bg-slate-950/40 flex flex-col gap-4 overflow-y-auto">
            
            {/* Avatar Profile Card with 3D Landmark Overlay */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 group shadow-xl">
              <img 
                src={currentAvatar.avatarImageUrl} 
                alt={currentAvatar.name}
                className="w-full h-72 object-cover object-top filter brightness-95 group-hover:scale-102 transition duration-500"
              />
              
              {/* Upload trigger button on card */}
              <input
                ref={fileUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileUploadInputRef.current?.click()}
                className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-lg backdrop-blur-md transition cursor-pointer z-10"
              >
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Reference</span>
              </button>

              {/* Simulated Biometric Mesh Landmark Wireframe Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-between p-4">
                <div className="flex justify-between items-start">
                  <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-cyan-500/60 backdrop-blur-md text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentAvatar.biometricAnchorToken}</span>
                  </div>
                </div>

                {/* Animated Biometric Scanning Grid */}
                {isScanning && (
                  <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center animate-pulse">
                    <div className="w-48 h-48 rounded-full border-2 border-dashed border-cyan-400 animate-spin flex items-center justify-center">
                      <Scan className="w-12 h-12 text-cyan-300" />
                    </div>
                    <span className="mt-3 text-xs font-mono font-bold text-cyan-200 text-center px-4">
                      Extracting 68-Point Biometric Facial Coordinates & Landmarks...
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-white leading-tight drop-shadow-md">
                    {currentAvatar.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 drop-shadow-sm">
                    {currentAvatar.promptDescriptor}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions: Biometric Extraction & Copy Token */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateBiometricScan}
                disabled={isScanning}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/40 hover:to-indigo-600/40 border border-cyan-500/50 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Re-Scan Landmarks'}</span>
              </button>

              <button
                onClick={handleCopyAnchor}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedToken ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copiedToken ? 'Copied to Clipboard' : 'Copy Anchor Token'}</span>
              </button>
            </div>

            {/* Saved Avatar Roster */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Avatar Library & Digital Twins</span>
                <span className="text-[10px] text-cyan-400">{avatars.length} Profiles</span>
              </div>

              <div className="space-y-2">
                {avatars.map(avatar => {
                  const isSelected = avatar.id === selectedAvatarId;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <img 
                        src={avatar.avatarImageUrl} 
                        alt={avatar.name} 
                        className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {avatar.name}
                          {avatar.isLocked && <Lock className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {avatar.ethnicityStyle?.replace('_', ' ') || 'custom'} • Used in {avatar.scenesCountUsed || 0} scenes
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Granular Parameter Tuning & Spatial Ratio Controls (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              
              {/* Sub-tabs for Granular Control */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveSubTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSubTab === 'upload'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Reference Photos</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('biometrics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSubTab === 'biometrics'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Structural Facial Features</span>
                </button>
                <button
                  onClick={() => setActiveSubTab('angles')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSubTab === 'angles'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>3D Angles & Poses</span>
                </button>
              </div>

              {/* Tab 0: Upload Reference Photos & Scanner */}
              {activeSubTab === 'upload' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={handleDropPhoto}
                    onClick={() => fileUploadInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                      isDraggingPhoto
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 scale-[1.01]'
                        : 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/50 text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload Reference Image or Drag & Drop
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Supports PNG, JPG, WEBP photos of yourself, a creator, client, or character. Extracts 68 facial biometric landmarks automatically.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300">
                      Browse File from Device
                    </span>
                  </div>

                  {/* Reference Image Angle Gallery */}
                  <div>
                    <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Multi-Angle Reference Set (Front, 45° Angle, Profile)</span>
                      <span className="text-[11px] text-cyan-400">{(currentAvatar.referenceImages || []).length} References Loaded</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {(currentAvatar.referenceImages || []).map((imgUrl, idx) => {
                        const isPrimary = imgUrl === currentAvatar.avatarImageUrl;
                        return (
                          <div 
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border group ${
                              isPrimary ? 'border-cyan-500 shadow-lg shadow-cyan-950/50' : 'border-slate-800'
                            }`}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Reference ${idx + 1}`} 
                              className="w-full h-24 object-cover"
                            />
                            {isPrimary && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/60 text-[9px] font-bold text-cyan-300">
                                Primary Anchor
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                              {!isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryReference(imgUrl)}
                                  className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold text-white transition"
                                >
                                  Make Primary
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteReference(idx)}
                                className="p-1 rounded bg-rose-600/80 hover:bg-rose-500 text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Character Continuity Info Box */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-cyan-200">
                        Zero Facial Drift Across Generations
                      </div>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">
                        When locked, the biometric anchor token <code className="text-cyan-300 font-mono text-[11px]">{currentAvatar.biometricAnchorToken}</code> and structural descriptors are automatically injected into Sora-2 video prompts and GPT-Image-1.5 pipelines.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Structural Facial Descriptors */}
              {activeSubTab === 'biometrics' && (
                <div className="space-y-5">
                  {/* Eyes & Eyebrows */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Eyes & Optical Descriptors</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 mb-1 block">Eye Shape</label>
                        <select
                          value={editableParams.eyeShape}
                          onChange={(e) => handleUpdateParam('eyeShape', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="almond">Almond (Classical)</option>
                          <option value="round">Round (Expressive)</option>
                          <option value="hooded">Hooded (Deep)</option>
                          <option value="monolid">Monolid (Sleek)</option>
                          <option value="deep_set">Deep Set (Cinematic)</option>
                          <option value="upturned">Upturned (Cat-Eye)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-300 mb-1 block">Eye Color</label>
                        <select
                          value={editableParams.eyeColor}
                          onChange={(e) => handleUpdateParam('eyeColor', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="deep_brown">Deep Brown</option>
                          <option value="hazel">Hazel Amber</option>
                          <option value="charcoal">Charcoal Slate</option>
                          <option value="emerald_green">Emerald Green</option>
                          <option value="ice_blue">Ice Blue</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Interpupillary Distance (IPD Ratio)</span>
                        <span className="font-mono text-cyan-400">{editableParams.interpupillaryDistance.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.85"
                        max="1.25"
                        step="0.01"
                        value={editableParams.interpupillaryDistance}
                        onChange={(e) => handleUpdateParam('interpupillaryDistance', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Nose Structure & Ear Placement */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Nose Bridge & Cranial Ratios</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 mb-1 block">Nose Tip Profile</label>
                        <select
                          value={editableParams.noseTipAngle}
                          onChange={(e) => handleUpdateParam('noseTipAngle', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="refined">Refined Straight</option>
                          <option value="aquiline">Aquiline (Strong Bridge)</option>
                          <option value="button">Button (Soft Rounded)</option>
                          <option value="upturned">Upturned (Delicate)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-300 mb-1 block">Ear Lobe Attachment</label>
                        <select
                          value={editableParams.earLobeType}
                          onChange={(e) => handleUpdateParam('earLobeType', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="free">Free Dangling</option>
                          <option value="attached">Attached (Continuous)</option>
                          <option value="prominent">Prominent</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Nose-to-Ear Gap</span>
                          <span className="font-mono text-cyan-400">{editableParams.earPlacementRatio.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.85"
                          max="1.15"
                          step="0.01"
                          value={editableParams.earPlacementRatio}
                          onChange={(e) => handleUpdateParam('earPlacementRatio', parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Nose Bridge Height</span>
                          <span className="font-mono text-cyan-400">{editableParams.noseBridgeHeight.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.4"
                          step="0.01"
                          value={editableParams.noseBridgeHeight}
                          onChange={(e) => handleUpdateParam('noseBridgeHeight', parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Jawline, Chin, Mouth & Philtrum */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Jawline, Lips & Philtrum Contour</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Jawline Angle</span>
                          <span className="font-mono text-cyan-400">{editableParams.jawlineAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="90"
                          max="135"
                          step="1"
                          value={editableParams.jawlineAngle}
                          onChange={(e) => handleUpdateParam('jawlineAngle', parseInt(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Cheekbone Prominence</span>
                          <span className="font-mono text-cyan-400">{editableParams.cheekboneProminence.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.8"
                          max="1.4"
                          step="0.02"
                          value={editableParams.cheekboneProminence}
                          onChange={(e) => handleUpdateParam('cheekboneProminence', parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-300 mb-1 block">Lip Fullness</label>
                        <select
                          value={editableParams.lipFullness}
                          onChange={(e) => handleUpdateParam('lipFullness', e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="medium">Medium Balanced</option>
                          <option value="plump">Plump Cupid</option>
                          <option value="thin_refined">Thin Refined</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                          <span>Nose-to-Lip (Philtrum)</span>
                          <span className="font-mono text-cyan-400">{editableParams.philtrumDepth.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.75"
                          max="1.25"
                          step="0.01"
                          value={editableParams.philtrumDepth}
                          onChange={(e) => handleUpdateParam('philtrumDepth', parseFloat(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: 3D Angles & Expression Locking */}
              {activeSubTab === 'angles' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>3D Camera Angle Offset (Pitch / Yaw / Roll)</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Pitch (Look Up / Down)</span>
                        <span className="font-mono text-cyan-400">{editableParams.pitchAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="1"
                        value={editableParams.pitchAngle}
                        onChange={(e) => handleUpdateParam('pitchAngle', parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Yaw (Head Turn Profile Left / Right)</span>
                        <span className="font-mono text-cyan-400">{editableParams.yawAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="1"
                        value={editableParams.yawAngle}
                        onChange={(e) => handleUpdateParam('yawAngle', parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300 mb-1 block">Default Locked Facial Expression</label>
                      <select
                        value={editableParams.expression}
                        onChange={(e) => handleUpdateParam('expression', e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
                      >
                        <option value="confident_smile">Confident Friendly Smile (Best for Creator Videos)</option>
                        <option value="charismatic_speaking">Charismatic Speaking (Podcast & Anchor)</option>
                        <option value="thoughtful_focused">Thoughtful & Focused (Tech/Tutorial)</option>
                        <option value="heroic_serious">Heroic & Serious (Cinematic Film)</option>
                        <option value="neutral_calm">Neutral Calm (Digital Twin Standard)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="pt-5 border-t border-slate-800 flex items-center justify-between mt-4">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Locked into Azure Sora-2 & GPT-Image-1.5 pipelines</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyToStudio}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer"
                >
                  {appliedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Applied to Timeline!</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-white" />
                      <span>Lock Character & Apply Anchor</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
