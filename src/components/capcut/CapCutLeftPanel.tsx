import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  Music, 
  Type, 
  Sparkles, 
  Wand2, 
  Scissors, 
  MessageSquare, 
  Palette, 
  LayoutTemplate, 
  Zap, 
  Plus, 
  Upload, 
  Mic, 
  Search, 
  Grid, 
  List, 
  Play, 
  Pause,
  Film, 
  Image as ImageIcon, 
  Check, 
  Trash2,
  Sliders,
  ExternalLink,
  Volume2,
  Layers,
  Sparkle,
  Clapperboard,
  Flame,
  Globe,
  Radio,
  Clock
} from 'lucide-react';
import { Scene, AudioTrack, StarterTemplate } from '../../types';
import { getStoredMedia, MediaItem, saveMediaItem, deleteMediaItem } from '../../lib/mediaLibrary';

interface CapCutLeftPanelProps {
  onAddSceneToTimeline: (scene: Scene) => void;
  onAddAudioToTimeline: (track: AudioTrack) => void;
  onOpenImageStudio: () => void;
  onOpenSoraStudio: () => void;
  onOpenVoiceStudio?: () => void;
  onOpenSubtitleEditor?: () => void;
  onOpenSceneTemplates?: () => void;
  onOpenBrandWatermark?: () => void;
  scenes: Scene[];
  audioTracks: AudioTrack[];
  selectedSceneId?: string;
  onUpdateScene?: (sceneId: string, updated: Partial<Scene>) => void;
  onLoadStarterTemplate?: (templateId: string) => void;
}

type TabType = 'media' | 'audio' | 'text' | 'effects' | 'transitions' | 'captions' | 'filters' | 'templates' | 'ai';
type SubTabType = 'all' | 'imported' | 'generated' | 'stock';

export const CapCutLeftPanel: React.FC<CapCutLeftPanelProps> = ({
  onAddSceneToTimeline,
  onAddAudioToTimeline,
  onOpenImageStudio,
  onOpenSoraStudio,
  onOpenVoiceStudio,
  onOpenSubtitleEditor,
  onOpenSceneTemplates,
  onOpenBrandWatermark,
  scenes,
  audioTracks,
  selectedSceneId,
  onUpdateScene,
  onLoadStarterTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Audio preview playing state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // File input ref for fast local importing
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];

  const loadMedia = () => {
    const items = getStoredMedia();
    setMediaItems(items);
  };

  useEffect(() => {
    loadMedia();
    const handleStorage = () => loadMedia();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Audio preview playback toggle
  const togglePlayAudioPreview = (url: string) => {
    if (playingAudioUrl === url) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioUrl(null);
    } else {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play().catch(e => console.warn('Audio preview play error:', e));
      audioPlayerRef.current.onended = () => setPlayingAudioUrl(null);
      setPlayingAudioUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');

      if (isAudio) {
        const newAudio: AudioTrack = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Imported Audio',
          url,
          duration: 30,
          volume: 80,
          genre: 'User Import',
          type: 'bgm'
        };
        onAddAudioToTimeline(newAudio);
      } else {
        const item: MediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url,
          type: isVideo ? 'sora_video' : 'upload',
          category: isVideo ? 'Imported Video' : 'Imported Media',
          createdAt: Date.now(),
          duration: isVideo ? 5 : 4
        };

        saveMediaItem(item);
        loadMedia();

        const newScene: Scene = {
          id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: item.title,
          duration: item.duration || 4,
          prompt: item.title,
          mediaUrl: url,
          mediaType: isVideo ? 'video' : 'image',
          aspectRatio: '16:9',
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
        onAddSceneToTimeline(newScene);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMediaItem(id);
    loadMedia();
  };

  // Stock Nepali & Cinematic media fallback demo items
  const stockMedia: MediaItem[] = [
    {
      id: 'stock-1',
      title: 'Himalayan Dawn Over Everest',
      url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop',
      type: 'ai_image',
      category: 'Stock Landscape',
      createdAt: 1704067200000,
      duration: 4,
    },
    {
      id: 'stock-2',
      title: 'Kathmandu Heritage Durbar Square',
      url: 'https://images.unsplash.com/photo-1582650625119-3a31f841839d?q=80&w=1000&auto=format&fit=crop',
      type: 'ai_image',
      category: 'Stock Heritage',
      createdAt: 1704067200000,
      duration: 4,
    },
    {
      id: 'stock-3',
      title: 'Phewa Lake Pokhara Reflection',
      url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
      type: 'ai_image',
      category: 'Stock Lake',
      createdAt: 1704067200000,
      duration: 5,
    },
    {
      id: 'stock-4',
      title: 'Misty Alpine Rhododendron Forest',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
      type: 'ai_image',
      category: 'Stock Nature',
      createdAt: 1704067200000,
      duration: 4,
    }
  ];

  // Combined media items for search & filter
  const allMedia = [...mediaItems, ...stockMedia];
  const filteredMedia = allMedia.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeSubTab === 'imported') return item.type === 'upload';
    if (activeSubTab === 'generated') return item.type === 'sora_video' || item.type === 'ai_image' || item.type === 'ai_audio';
    if (activeSubTab === 'stock') return item.category.startsWith('Stock');
    return true;
  });

  // Sound Effects (SFX) Library
  const sfxLibrary: AudioTrack[] = [
    {
      id: 'sfx-swoosh',
      title: 'Cinematic Whoosh Transition',
      artist: 'Studio FX',
      url: 'https://cdn.freesound.org/previews/608/608645_11861866-lq.mp3',
      duration: 2,
      volume: 85,
      genre: 'SFX Whoosh',
      type: 'bgm'
    },
    {
      id: 'sfx-bowl',
      title: 'Tibetan Singing Bowl Resonator',
      artist: 'Himalayan Healing',
      url: 'https://cdn.freesound.org/previews/518/518296_6142149-lq.mp3',
      duration: 6,
      volume: 80,
      genre: 'SFX Healing',
      type: 'bgm'
    },
    {
      id: 'sfx-camera',
      title: 'Camera Shutter Click',
      artist: 'Studio FX',
      url: 'https://cdn.freesound.org/previews/387/387232_1474204-lq.mp3',
      duration: 1,
      volume: 90,
      genre: 'SFX Shutter',
      type: 'bgm'
    },
    {
      id: 'sfx-pop',
      title: 'Modern UI Pop Ding',
      artist: 'Studio FX',
      url: 'https://cdn.freesound.org/previews/536/536422_4921277-lq.mp3',
      duration: 1,
      volume: 75,
      genre: 'SFX Pop',
      type: 'bgm'
    }
  ];

  // Visual Effects (VFX) Presets
  const vfxPresets = [
    { id: 'vhs_80s', name: 'VHS Retro 1980s', icon: Radio, desc: 'CRT scanlines & color aberration', filter: 'vintage' },
    { id: 'glitch', name: 'Cyberpunk RGB Glitch', icon: Zap, desc: 'Chromatic aberration pulse', filter: 'cyberpunk' },
    { id: 'film_grain', name: '35mm Film Grain', icon: Film, desc: 'Warm cinematic film texture', filter: 'cinematic' },
    { id: 'light_leak', name: 'Golden Light Leak', icon: Sparkle, desc: 'Organic warm lens flares', filter: 'warm_gold' },
    { id: 'mist', name: 'Himalayan Mist', icon: Globe, desc: 'Dreamy mountain atmosphere', filter: 'mist' },
    { id: 'vignette', name: 'Dark Cinematic Edge', icon: Layers, desc: 'Focused vignette contrast', filter: 'bw' },
  ];

  // Transition Presets
  const transitionPresets = [
    { id: 'dissolve', name: 'Cross Dissolve', desc: 'Smooth opacity blending', duration: 0.8 },
    { id: 'hard_cut', name: 'Hard Cut', desc: 'Instant frame switch', duration: 0.0 },
    { id: 'fade_black', name: 'Fade to Black', desc: 'Cinematic scene fade', duration: 0.9 },
    { id: 'wipe_right', name: 'Wipe Right', desc: 'Horizontal slide reveal', duration: 0.7 },
    { id: 'slide_left', name: 'Slide Left', desc: 'Kinetic push transition', duration: 0.6 },
    { id: 'zoom_in', name: 'Zoom In Flash', desc: 'Punchy camera push', duration: 0.5 },
  ];

  // Filter & Color Grades
  const filterPresets = [
    { id: 'cinematic', name: 'Cinematic Teal & Orange', previewBg: 'from-amber-600 to-cyan-800' },
    { id: 'warm_gold', name: 'Golden Hour Sunset', previewBg: 'from-amber-500 to-rose-700' },
    { id: 'mist', name: 'Himalayan Alpine Mist', previewBg: 'from-slate-400 to-indigo-900' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', previewBg: 'from-fuchsia-600 to-cyan-600' },
    { id: 'bw', name: 'High-Contrast B&W', previewBg: 'from-slate-900 to-slate-200' },
    { id: 'vintage', name: 'Vintage 1970s Kodachrome', previewBg: 'from-yellow-700 to-emerald-900' },
  ];

  // Text / Typography Presets
  const textPresets = [
    { label: 'Devanagari Header', text: 'काठमाडौँ उपत्यका', font: 'sans', style: 'text-2xl font-black text-cyan-300 drop-shadow-md' },
    { label: 'Lower Third News', text: 'BREAKING: HIMALAYAN EXPEDITION', font: 'sans', style: 'text-xs uppercase font-bold tracking-wider bg-slate-950/80 px-2 py-1 border-l-2 border-cyan-400' },
    { label: 'Cyberpunk Neon', text: 'नमस्ते नेपाल ✨', font: 'neon', style: 'text-xl font-extrabold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]' },
    { label: 'Gold Cinematic', text: 'SAGARMATHA DISCOVERY', font: 'serif', style: 'text-lg font-serif tracking-widest text-amber-300 italic' },
    { label: 'Typewriter Subtitle', text: 'नेपाली कला र संस्कृतिको संगम...', font: 'mono', style: 'text-xs font-mono text-slate-200 bg-black/60 px-2 py-0.5 rounded' },
    { label: 'TikTok Reel Hook', text: 'WAIT TILL THE END! 🏔️', font: 'sans', style: 'text-base font-black text-yellow-300 bg-red-600 px-3 py-1 rounded-md' },
  ];

  return (
    <div className="w-80 md:w-96 bg-[#0c0e17] border-r border-slate-800/80 flex flex-col h-full shrink-0 select-none z-20">
      {/* Hidden file inputs for immediate upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Primary Left Navigation Bar (CapCut Style Icon Deck) */}
      <div className="flex items-center gap-1 p-1.5 bg-[#090b12] border-b border-slate-800/80 overflow-x-auto no-scrollbar">
        {[
          { id: 'media', label: 'Media', icon: Folder },
          { id: 'audio', label: 'Audio', icon: Music },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'effects', label: 'Effects', icon: Sparkles },
          { id: 'transitions', label: 'Transitions', icon: Scissors },
          { id: 'filters', label: 'Filters', icon: Palette },
          { id: 'captions', label: 'Captions', icon: MessageSquare },
          { id: 'templates', label: 'Templates', icon: LayoutTemplate },
          { id: 'ai', label: 'AI Studio', icon: Zap },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 px-1 rounded-lg text-[10px] font-semibold transition cursor-pointer shrink-0 ${
                isActive 
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60 font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Search & Filter Header (when applicable) */}
      {activeTab === 'media' && (
        <div className="p-3 border-b border-slate-800/70 space-y-2.5 bg-[#0e111b]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search assets, clips, images..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition"
              />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm shrink-0 cursor-pointer active:scale-95"
              title="Import local media files"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>Import</span>
            </button>
          </div>

          {/* Subtabs for Media filtering */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(['all', 'imported', 'generated', 'stock'] as SubTabType[]).map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubTab(sub)}
                  className={`px-2 py-0.5 rounded text-[10px] capitalize transition cursor-pointer ${
                    activeSubTab === sub 
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'text-cyan-400 bg-slate-800' : 'hover:text-slate-300'}`}
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'text-cyan-400 bg-slate-800' : 'hover:text-slate-300'}`}
              >
                <List className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab Contents Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">

        {/* ==================== MEDIA TAB ==================== */}
        {activeTab === 'media' && (
          <>
            {filteredMedia.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No media assets found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Import files or generate AI images & videos.</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Import File
                  </button>
                  <button
                    onClick={onOpenImageStudio}
                    className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    AI Image
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredMedia.map(item => (
                  <div
                    key={item.id}
                    className="group relative bg-slate-950 border border-slate-800/90 rounded-lg overflow-hidden transition hover:border-cyan-500/60 flex flex-col shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}

                      {/* Type Badge */}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[9px] font-mono font-bold text-slate-200 uppercase">
                        {item.type}
                      </span>

                      {/* Hover Overlay Actions */}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          onClick={() => {
                            const newScene: Scene = {
                              id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                              title: item.title,
                              duration: item.duration || 4,
                              prompt: item.title,
                              mediaUrl: item.url,
                              mediaType: item.type,
                              aspectRatio: '16:9',
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
                            onAddSceneToTimeline(newScene);
                          }}
                          className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-bold shadow-md transition active:scale-95 cursor-pointer"
                          title="Add to Timeline"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {item.source === 'import' && (
                          <button
                            onClick={(e) => handleDeleteMedia(item.id, e)}
                            className="p-2 bg-rose-900/80 hover:bg-rose-600 text-rose-200 rounded-lg font-bold shadow-md transition active:scale-95 cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300 truncate max-w-[110px]" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredMedia.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-cyan-500/50 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-7 rounded bg-black overflow-hidden shrink-0">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{item.type} • {item.duration || 4}s</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newScene: Scene = {
                          id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          title: item.title,
                          duration: item.duration || 4,
                          prompt: item.title,
                          mediaUrl: item.url,
                          mediaType: item.type,
                          aspectRatio: '16:9',
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
                        onAddSceneToTimeline(newScene);
                      }}
                      className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 rounded-md transition font-bold cursor-pointer"
                      title="Add to Timeline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== AUDIO TAB ==================== */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => audioInputRef.current?.click()}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload Audio</span>
              </button>

              {onOpenVoiceStudio && (
                <button
                  onClick={onOpenVoiceStudio}
                  className="flex-1 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-xs font-bold text-emerald-300 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AI Voiceover</span>
                </button>
              )}
            </div>

            {/* BGM Soundtracks */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Soundtracks (BGM)</h4>
              <div className="space-y-1.5">
                {audioTracks.map(track => {
                  const isPreviewPlaying = playingAudioUrl === track.url;
                  return (
                    <div
                      key={track.id}
                      className="p-2 bg-slate-950 border border-slate-800/90 rounded-lg flex items-center justify-between hover:border-purple-500/50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => togglePlayAudioPreview(track.url)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isPreviewPlaying 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-purple-950/60 text-purple-400 hover:bg-purple-800/80 hover:text-white'
                          }`}
                          title={isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}
                        >
                          {isPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{track.title}</p>
                          <p className="text-[10px] text-purple-400 font-mono">{track.genre || 'Soundtrack'} • {track.duration || 30}s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddAudioToTimeline(track)}
                        className="p-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-md transition cursor-pointer font-bold"
                        title="Apply Track to Timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sound Effects (SFX) */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Sound Effects (SFX)</h4>
              <div className="space-y-1.5">
                {sfxLibrary.map(sfx => {
                  const isPreviewPlaying = playingAudioUrl === sfx.url;
                  return (
                    <div
                      key={sfx.id}
                      className="p-2 bg-slate-950 border border-slate-800/90 rounded-lg flex items-center justify-between hover:border-amber-500/50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => togglePlayAudioPreview(sfx.url)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isPreviewPlaying 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-amber-950/60 text-amber-400 hover:bg-amber-800/80 hover:text-white'
                          }`}
                          title={isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}
                        >
                          {isPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{sfx.title}</p>
                          <p className="text-[10px] text-amber-400 font-mono">{sfx.genre} • {sfx.duration}s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddAudioToTimeline(sfx)}
                        className="p-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-slate-950 rounded-md transition cursor-pointer font-bold"
                        title="Apply SFX to Timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TEXT TAB ==================== */}
        {activeTab === 'text' && (
          <div className="space-y-2.5">
            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400">
              Click any style to apply to the active scene ({selectedScene ? selectedScene.title : 'Clip #1'}) or create a title card.
            </div>

            <div className="space-y-2">
              {textPresets.map((preset, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-cyan-500/60 transition group flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">{preset.label}</span>
                    <span className="text-[9px] font-mono px-1 bg-slate-900 text-slate-500 rounded uppercase">{preset.font}</span>
                  </div>

                  <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center justify-center min-h-[44px]">
                    <span className={preset.style}>{preset.text}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        if (selectedScene && onUpdateScene) {
                          onUpdateScene(selectedScene.id, {
                            textOverlay: preset.text,
                            textNepali: preset.text,
                            textFont: preset.font as any
                          });
                        }
                      }}
                      className="flex-1 py-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 rounded-md text-[11px] font-bold transition cursor-pointer text-center"
                    >
                      Apply to Active Clip
                    </button>

                    <button
                      onClick={() => {
                        const newTitleScene: Scene = {
                          id: `scene-title-${Date.now()}`,
                          title: preset.label,
                          duration: 3.5,
                          prompt: preset.text,
                          mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
                          mediaType: 'image',
                          aspectRatio: '16:9',
                          motion: 'zoom_in',
                          transition: 'dissolve',
                          transitionDuration: 0.8,
                          textOverlay: preset.text,
                          textNepali: preset.text,
                          textColor: '#ffffff',
                          textFont: preset.font as any,
                          textPosition: 'center',
                          filter: 'cinematic',
                          volume: 90
                        };
                        onAddSceneToTimeline(newTitleScene);
                      }}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[11px] font-bold transition cursor-pointer"
                      title="Add as New Title Scene"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== EFFECTS (VFX) TAB ==================== */}
        {activeTab === 'effects' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Apply cinematic lens filters and optical effects to the active clip.</p>
            <div className="grid grid-cols-2 gap-2">
              {vfxPresets.map(fx => {
                const Icon = fx.icon;
                const isCurrent = selectedScene?.filter === fx.filter;
                return (
                  <div
                    key={fx.id}
                    onClick={() => {
                      if (selectedScene && onUpdateScene) {
                        onUpdateScene(selectedScene.id, { filter: fx.filter });
                      }
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between group ${
                      isCurrent 
                        ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-sm' 
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-cyan-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate">{fx.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{fx.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TRANSITIONS TAB ==================== */}
        {activeTab === 'transitions' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Select smooth cinematic transitions between storyboard scenes.</p>
            <div className="space-y-1.5">
              {transitionPresets.map(trans => {
                const isSelected = selectedScene?.transition === trans.id;
                return (
                  <div
                    key={trans.id}
                    onClick={() => {
                      if (selectedScene && onUpdateScene) {
                        onUpdateScene(selectedScene.id, {
                          transition: trans.id as any,
                          transitionDuration: trans.duration
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-950/40 border-cyan-400 text-white' 
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-cyan-400'
                      }`}>
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{trans.name}</p>
                        <p className="text-[10px] text-slate-500">{trans.desc}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">{trans.duration}s</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== FILTERS TAB ==================== */}
        {activeTab === 'filters' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Color grading LUTs and atmospheric palettes.</p>
            <div className="grid grid-cols-2 gap-2">
              {filterPresets.map(f => {
                const isActive = selectedScene?.filter === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      if (selectedScene && onUpdateScene) {
                        onUpdateScene(selectedScene.id, { filter: f.id });
                      }
                    }}
                    className={`p-2 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      isActive 
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400' 
                        : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className={`h-12 w-full rounded-lg bg-gradient-to-tr ${f.previewBg} relative overflow-hidden flex items-end p-1`}>
                      {isActive && (
                        <span className="px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-bold text-cyan-300">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-200 truncate">{f.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== CAPTIONS TAB ==================== */}
        {activeTab === 'captions' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Generate Subtitles</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Generate synchronized Devanagari and English captions from your scene scripts.
              </p>
              <button
                onClick={() => {
                  if (onOpenSubtitleEditor) {
                    onOpenSubtitleEditor();
                  }
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
              >
                Launch Subtitle Studio & Burner
              </button>
            </div>

            {/* Quick Caption Adder */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-200">Active Clip Caption</h4>
              <input
                type="text"
                placeholder="Type Nepali or English subtitle..."
                value={selectedScene?.textOverlay || ''}
                onChange={(e) => {
                  if (selectedScene && onUpdateScene) {
                    onUpdateScene(selectedScene.id, {
                      textOverlay: e.target.value,
                      textNepali: e.target.value
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* ==================== TEMPLATES TAB ==================== */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400">Instant full-project sequence templates with synced visuals & audio.</p>
            
            <div className="space-y-2">
              {[
                {
                  id: 'nepal_tourism',
                  title: 'Nepal Tourism Reel (3 Clips)',
                  desc: 'Himalayan sunrise, Pokhara lake, Kathmandu durbar with cinematic flute.',
                  badge: 'Popular',
                  bg: 'from-amber-600/30 to-indigo-950/50'
                },
                {
                  id: 'product_promo',
                  title: 'Product Launch & Commercial',
                  desc: 'High-energy typography, dynamic motion, modern electronic beat.',
                  badge: 'Commercial',
                  bg: 'from-purple-600/30 to-cyan-950/50'
                },
                {
                  id: 'breaking_news',
                  title: 'Breaking News Broadcast',
                  desc: 'Studio lower-third, urgent ticker, field reporting footage.',
                  badge: 'News',
                  bg: 'from-rose-600/30 to-slate-950/50'
                },
                {
                  id: 'tiktok_montage',
                  title: 'TikTok & Shorts Fast Montage',
                  desc: '9:16 vertical fast cuts, vibrant neon text, punchy transitions.',
                  badge: 'Shorts 9:16',
                  bg: 'from-fuchsia-600/30 to-teal-950/50'
                },
              ].map(tpl => (
                <div
                  key={tpl.id}
                  className={`p-3 rounded-xl border border-slate-800 bg-gradient-to-r ${tpl.bg} hover:border-cyan-500/60 transition flex flex-col gap-2`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{tpl.title}</h5>
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[9px] font-bold">
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{tpl.desc}</p>
                  
                  <button
                    onClick={() => {
                      if (onLoadStarterTemplate) {
                        onLoadStarterTemplate(tpl.id);
                      } else if (onOpenSceneTemplates) {
                        onOpenSceneTemplates();
                      }
                    }}
                    className="w-full py-1.5 bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer text-center mt-1"
                  >
                    Load Sequence to Timeline
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== AI CREATE TAB ==================== */}
        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div
              onClick={onOpenSoraStudio}
              className="p-3.5 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-600/40 rounded-xl hover:border-purple-400 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow-md">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sora-2 AI Video Studio</h4>
                  <p className="text-[11px] text-purple-300">Generate 720p/1080p photorealistic videos.</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-400" />
            </div>

            <div
              onClick={onOpenImageStudio}
              className="p-3.5 bg-gradient-to-r from-cyan-950/40 to-teal-950/40 border border-cyan-600/40 rounded-xl hover:border-cyan-400 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-600 text-slate-950 shadow-md">
                  <ImageIcon className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">GPT Image 1.5 Studio</h4>
                  <p className="text-[11px] text-cyan-300">High-definition AI image generator.</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </div>

            {onOpenVoiceStudio && (
              <div
                onClick={onOpenVoiceStudio}
                className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-green-950/40 border border-emerald-600/40 rounded-xl hover:border-emerald-400 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-600 text-slate-950 shadow-md">
                    <Mic className="w-5 h-5 font-bold" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Neural SpeechT5 Studio</h4>
                    <p className="text-[11px] text-emerald-300">Nepali & Hindi studio voiceover generation.</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
