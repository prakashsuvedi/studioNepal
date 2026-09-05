import React, { useState, useRef } from 'react';
import { BrandAsset, Scene, SceneWatermark } from '../types';
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Layers, 
  X,
  Type,
  Smile,
  Zap,
  Flame,
  Award,
  Heart,
  Globe,
  Play,
  Music,
  Camera,
  Star
} from 'lucide-react';

export const DEFAULT_BRAND_ASSETS: BrandAsset[] = [
  {
    id: 'asset_bug_nepalai',
    name: 'NepalAI Studio Bug',
    category: 'watermark',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    defaultPosition: 'top-right',
  },
  {
    id: 'asset_devanagari_crest',
    name: 'Nepal National Double Triangle',
    category: 'devanagari',
    url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=200&auto=format&fit=crop&q=80',
    defaultPosition: 'top-left',
  },
  {
    id: 'asset_4k_badge',
    name: '4K Cinema HDR Badge',
    category: 'badge',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
    defaultPosition: 'bottom-right',
  },
  {
    id: 'asset_hamro_khabar',
    name: 'Hamro Khabar News Bug',
    category: 'logo',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    defaultPosition: 'top-right',
  },
  {
    id: 'asset_verified_stamp',
    name: 'Verified Creator Gold Seal',
    category: 'stamp',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
    defaultPosition: 'bottom-left',
  },
];

export interface TextStylePreset {
  id: string;
  name: string;
  sampleText: string;
  category: 'hook' | 'lower_third' | 'subtitles' | 'header';
  fontFamily: string;
  fontSize: number;
  textColor: string;
  bgColor?: string;
}

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  {
    id: 'txt_social_hook',
    name: 'Viral Social Hook',
    sampleText: 'YOU WON\'T BELIEVE THIS!',
    category: 'hook',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 42,
    textColor: '#FFFFFF',
    bgColor: '#FF0055',
  },
  {
    id: 'txt_lower_third',
    name: 'News Lower Third',
    sampleText: 'Prakash Suvedi — Lead Producer',
    category: 'lower_third',
    fontFamily: 'Inter',
    fontSize: 24,
    textColor: '#F8FAFC',
    bgColor: '#0F172A',
  },
  {
    id: 'txt_subtitle_highlight',
    name: 'Karaoke Subtitle',
    sampleText: 'Transforming Nepal with AI',
    category: 'subtitles',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    textColor: '#FACC15',
    bgColor: '#000000B3',
  },
  {
    id: 'txt_bold_header',
    name: 'Cinematic Bold Header',
    sampleText: 'THE HIMALAYAN JOURNEY',
    category: 'header',
    fontFamily: 'Playfair Display',
    fontSize: 48,
    textColor: '#FFFFFF',
  },
];

export const ICON_PRESETS = [
  { id: 'icon_star', name: 'Star Gold', IconComponent: Star, color: '#EAB308' },
  { id: 'icon_sparkles', name: 'Sparkles Magic', IconComponent: Sparkles, color: '#A855F7' },
  { id: 'icon_zap', name: 'Lightning Zap', IconComponent: Zap, color: '#3B82F6' },
  { id: 'icon_flame', name: 'Trending Flame', IconComponent: Flame, color: '#EF4444' },
  { id: 'icon_award', name: 'Winner Trophy', IconComponent: Award, color: '#F59E0B' },
  { id: 'icon_heart', name: 'Love Heart', IconComponent: Heart, color: '#EC4899' },
  { id: 'icon_globe', name: 'World Globe', IconComponent: Globe, color: '#06B6D4' },
  { id: 'icon_play', name: 'Play Media', IconComponent: Play, color: '#10B981' },
  { id: 'icon_music', name: 'Audio Sound', IconComponent: Music, color: '#8B5CF6' },
  { id: 'icon_camera', name: 'Camera Lens', IconComponent: Camera, color: '#64748B' },
];

interface AssetLibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeScene?: Scene;
  onApplyWatermark: (watermark: SceneWatermark, applyToAll?: boolean) => void;
  onRemoveWatermark: (applyToAll?: boolean) => void;
  onInsertTextPreset?: (preset: TextStylePreset) => void;
  onInsertIcon?: (iconName: string, iconColor: string) => void;
}

export const AssetLibrarySidebar: React.FC<AssetLibrarySidebarProps> = ({
  isOpen,
  onClose,
  activeScene,
  onApplyWatermark,
  onRemoveWatermark,
  onInsertTextPreset,
  onInsertIcon,
}) => {
  const [activeTab, setActiveTab] = useState<'watermarks' | 'text' | 'icons'>('watermarks');
  const [assets, setAssets] = useState<BrandAsset[]>(DEFAULT_BRAND_ASSETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(assets[0] || null);

  const [position, setPosition] = useState<SceneWatermark['position']>('top-right');
  const [opacity, setOpacity] = useState<number>(0.85);
  const [scale, setScale] = useState<number>(0.22);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20 shadow-xl transition-all">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-xs">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Preset Asset Library</span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 gap-1 border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('watermarks')}
          className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'watermarks'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Overlays</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'text'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Typography</span>
        </button>
        <button
          onClick={() => setActiveTab('icons')}
          className={`py-1.5 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'icons'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Icons</span>
        </button>
      </div>

      {/* Tab Content: Watermarks */}
      {activeTab === 'watermarks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500">Brand Watermarks & Logos</div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {DEFAULT_BRAND_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-2 border rounded-xl cursor-pointer transition flex flex-col items-center gap-1 ${
                    selectedAsset?.id === asset.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <img src={asset.url} alt={asset.name} className="w-10 h-10 object-contain rounded-md" />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate w-full text-center">
                    {asset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedAsset && (
            <div className="p-3 space-y-3 bg-slate-50 dark:bg-slate-800/40 flex-1 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Overlay Controls</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`p-1.5 rounded-lg border capitalize text-[11px] ${
                      position === pos
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Opacity</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <button
                onClick={() =>
                  onApplyWatermark({
                    url: selectedAsset.url,
                    position,
                    opacity,
                    scale,
                  })
                }
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Overlay to Scene</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Typography Presets */}
      {activeTab === 'text' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          <div className="text-[11px] font-semibold text-slate-500">Click preset to insert on text track</div>
          <div className="space-y-2.5">
            {TEXT_STYLE_PRESETS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onInsertTextPreset && onInsertTextPreset(preset)}
                className="p-3 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{preset.name}</span>
                  <Plus className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div
                  className="p-2 rounded-lg text-center text-xs font-bold truncate"
                  style={{
                    backgroundColor: preset.bgColor || 'transparent',
                    color: preset.textColor,
                    fontFamily: preset.fontFamily,
                  }}
                >
                  {preset.sampleText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Vector Icon Library */}
      {activeTab === 'icons' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          <div className="text-[11px] font-semibold text-slate-500">Vector Icon Browser</div>
          <div className="grid grid-cols-2 gap-2">
            {ICON_PRESETS.map(({ id, name, IconComponent, color }) => (
              <button
                key={id}
                onClick={() => onInsertIcon && onInsertIcon(name, color)}
                className="p-3 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition flex flex-col items-center justify-center gap-1.5"
              >
                <IconComponent className="w-6 h-6" style={{ color }} />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
