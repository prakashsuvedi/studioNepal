import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  User, 
  Palette, 
  RefreshCw, 
  Link as LinkIcon,
  ShieldCheck,
  Plus
} from 'lucide-react';

export interface ReferencePresetItem {
  id: string;
  name: string;
  roleOrCategory: string;
  category: 'avatar' | 'style';
  imageUrl: string;
  promptInjection: string;
}

export const CURATED_REFERENCE_PRESETS: ReferencePresetItem[] = [
  // Character Avatars
  {
    id: 'avatar-prakash',
    name: 'Prakash Suvedi',
    roleOrCategory: 'Creator & Host',
    category: 'avatar',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Subject Visual Anchor: Prakash Suvedi, professional charismatic male presenter in tailored jacket, confident natural facial expressions]',
  },
  {
    id: 'avatar-aarav',
    name: 'Aarav Sharma',
    roleOrCategory: 'Himalayan Climber',
    category: 'avatar',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Subject Visual Anchor: Aarav Sharma, 30-year-old Nepali mountaineer in red technical Gore-Tex expedition parka, dark hair, expressive brown eyes]',
  },
  {
    id: 'avatar-maya',
    name: 'Maya Gurung',
    roleOrCategory: 'Village Storyteller',
    category: 'avatar',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Subject Visual Anchor: Maya Gurung, 24-year-old Nepali mountain village girl wearing traditional Dhaka shawl, woolen sweater, radiant warm smile]',
  },
  {
    id: 'avatar-sagar',
    name: 'Sagar Thapa',
    roleOrCategory: 'Kathmandu Creator',
    category: 'avatar',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Subject Visual Anchor: Sagar Thapa, 26-year-old modern urban media creator, denim overshirt, smart stylish spectacles, thoughtful gaze]',
  },
  // Visual Styles
  {
    id: 'style-35mm-anamorphic',
    name: '35mm Anamorphic Film',
    roleOrCategory: 'Hollywood Cinema',
    category: 'style',
    imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Visual Style Reference: 35mm anamorphic widescreen master, cinematic Arri Alexa color grade, natural halation, subtle film grain, dramatic rim lighting]',
  },
  {
    id: 'style-natgeo-8k',
    name: 'National Geographic 8K',
    roleOrCategory: 'Ultra-Realism',
    category: 'style',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Visual Style Reference: National Geographic 8k photorealistic documentary aesthetic, razor-sharp natural textures, pristine volumetric daylight]',
  },
  {
    id: 'style-pixar-3d',
    name: 'Pixar 3D Animation',
    roleOrCategory: 'Stylized 3D',
    category: 'style',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Visual Style Reference: Vibrant Pixar Disney 3D animation render, rich expressive subsurface scattering, whimsical volumetric lighting, stylized charm]',
  },
  {
    id: 'style-vintage-kodachrome',
    name: '1970s Kodachrome Retro',
    roleOrCategory: 'Warm Vintage',
    category: 'style',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    promptInjection: '[Visual Style Reference: 1970s Kodachrome retro film stock, warm golden nostalgia, amber and teal color harmony, rich authentic vintage depth]',
  },
];

export interface UploadReferenceImageProps {
  selectedImageUrl?: string | null;
  selectedImageName?: string | null;
  onSelectImage: (imageUrl: string, imageName: string, promptInjection: string) => void;
  onClearImage: () => void;
  label?: string;
  subLabel?: string;
  compact?: boolean;
  className?: string;
  currentPrompt?: string;
  onAppendToPrompt?: (injectedPrompt: string) => void;
}

export const UploadReferenceImage: React.FC<UploadReferenceImageProps> = ({
  selectedImageUrl,
  selectedImageName,
  onSelectImage,
  onClearImage,
  label = 'Reference Image & Character / Style Avatar',
  subLabel = 'Locks face, clothing, or cinematic style anchor across video scenes',
  compact = false,
  className = '',
  currentPrompt,
  onAppendToPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'style'>('avatar');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        let finalUrl = base64Data;

        try {
          const res = await fetch('/api/storage/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `ref_${Date.now()}_${cleanName}`,
              fileData: base64Data,
              mimeType: file.type || 'image/jpeg',
            }),
          });
          const data = await res.json();
          if (data.url) {
            finalUrl = data.url;
          }
        } catch (uploadErr) {
          console.warn('Direct upload fallback used base64:', uploadErr);
        }

        const tag = `[Visual Reference Anchor: ${cleanName} (${finalUrl})]`;
        onSelectImage(finalUrl, file.name, tag);

        if (onAppendToPrompt && currentPrompt !== undefined) {
          if (!currentPrompt.includes(finalUrl)) {
            const nextPrompt = currentPrompt.trim()
              ? `${currentPrompt.trim()}, ${tag}`
              : `Cinematic scene featuring ${cleanName}, ${tag}`;
            onAppendToPrompt(nextPrompt);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed reading reference image:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (item: ReferencePresetItem) => {
    onSelectImage(item.imageUrl, item.name, item.promptInjection);

    if (onAppendToPrompt && currentPrompt !== undefined) {
      if (!currentPrompt.includes(item.promptInjection)) {
        const nextPrompt = currentPrompt.trim()
          ? `${currentPrompt.trim()}, ${item.promptInjection}`
          : `Cinematic scene featuring ${item.name}, ${item.promptInjection}`;
        onAppendToPrompt(nextPrompt);
      }
    }
  };

  const handleApplyCustomUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const name = 'Custom Reference Image';
    const tag = `[Visual Reference Anchor: ${name} (${url})]`;
    onSelectImage(url, name, tag);

    if (onAppendToPrompt && currentPrompt !== undefined) {
      if (!currentPrompt.includes(url)) {
        const nextPrompt = currentPrompt.trim()
          ? `${currentPrompt.trim()}, ${tag}`
          : `Cinematic scene with visual reference, ${tag}`;
        onAppendToPrompt(nextPrompt);
      }
    }
    setUrlInput('');
    setShowUrlInput(false);
  };

  const currentPresets = CURATED_REFERENCE_PRESETS.filter(p => p.category === activeTab);

  return (
    <div className={`p-3 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/80 space-y-2.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">{label}</span>
            {!compact && <span className="text-[10px] text-slate-400 block truncate">{subLabel}</span>}
          </div>
        </div>

        {selectedImageUrl && (
          <button
            type="button"
            onClick={onClearImage}
            className="text-[10.5px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition shrink-0"
            title="Clear active reference image"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Active Selected Card Preview */}
      {selectedImageUrl ? (
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-500/40 animate-in fade-in duration-150">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-400/60 shadow-md shrink-0 bg-black">
            <img
              src={selectedImageUrl}
              alt="Reference"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 p-0.5 bg-indigo-600 rounded-bl text-white">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">
                {selectedImageName || 'Visual Reference Anchor'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                <Check className="w-2.5 h-2.5" />
                <span>Prompt Injected</span>
              </span>
            </div>
            <p className="text-[10.5px] text-indigo-200/80 truncate font-mono mt-0.5">
              Subject &amp; style visual anchor active for backend video synthesis
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-semibold border border-slate-700 transition cursor-pointer shrink-0"
          >
            Change
          </button>
        </div>
      ) : (
        /* Selector Controls when nothing is selected yet */
        <div className="space-y-2">
          {/* Action Row: Upload Custom, Paste URL, and Category Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Upload local PNG or JPG file as reference image"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-white" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 text-white" />
                    <span>Upload Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                title="Enter external image URL"
              >
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>URL</span>
              </button>
            </div>

            {/* Avatar vs Style Tabs */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10.5px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'avatar'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-2.5 h-2.5" />
                <span>Avatars</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'style'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-2.5 h-2.5" />
                <span>Styles</span>
              </button>
            </div>
          </div>

          {/* Direct URL input bar */}
          {showUrlInput && (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://... (image URL)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!urlInput.trim()}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Curated Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            {currentPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/60 transition cursor-pointer text-left group"
                title={`Lock ${preset.name} visual anchor for generation`}
              >
                <img
                  src={preset.imageUrl}
                  alt={preset.name}
                  className="w-8 h-8 rounded-md object-cover border border-slate-700 group-hover:border-indigo-400 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white group-hover:text-indigo-300 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate">
                    {preset.roleOrCategory}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
