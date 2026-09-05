import React, { useState, useRef } from 'react';
import { 
  Music, 
  Volume2, 
  Image as ImageIcon, 
  Video, 
  Tag, 
  Shield, 
  Sparkles, 
  Play, 
  Pause, 
  Plus, 
  Check, 
  Search, 
  X, 
  Radio, 
  Type, 
  Layers,
  Zap,
  Globe
} from 'lucide-react';
import { Scene, AudioTrack, SceneWatermark, TickerConfig, TextStylePreset, TextAnimationOption } from '../types';

interface AssetAndSoundLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAudioTrack: (track: AudioTrack) => void;
  onAddSceneToTimeline: (scene: Omit<Scene, 'id'>) => void;
  onApplyWatermarkToSelectedScene: (watermark: SceneWatermark) => void;
  onApplyTickerToSelectedScene: (ticker: TickerConfig) => void;
  onApplyTextStyleToSelectedScene: (style: TextStylePreset, animation: TextAnimationOption) => void;
  selectedScene?: Scene;
}

export const PREDEFINED_AUDIO_LIBRARY: (AudioTrack & { category: 'bgm' | 'vo' | 'sfx'; description: string })[] = [
  {
    id: 'sfx-whoosh-1',
    title: 'Cinematic Whoosh Transition',
    artist: 'NepalAI SFX Vault',
    url: 'https://cdn.freesound.org/previews/612/612887_11861866-lq.mp3',
    duration: 1,
    volume: 85,
    genre: 'Sound Effect',
    category: 'sfx',
    description: 'High-energy fast air swish for scene transitions.'
  },
  {
    id: 'sfx-boom-1',
    title: 'Deep Sub Bass Impact Drop',
    artist: 'NepalAI SFX Vault',
    url: 'https://cdn.freesound.org/previews/568/568779_6142149-lq.mp3',
    duration: 2,
    volume: 90,
    genre: 'Sound Effect',
    category: 'sfx',
    description: 'Cinematic low-frequency sub boom for dramatic titles.'
  },
  {
    id: 'sfx-bells-1',
    title: 'Heritage Temple Bells & Chimes',
    artist: 'Sacred Nepal Soundscapes',
    url: 'https://cdn.freesound.org/previews/518/518290_7037-lq.mp3',
    duration: 3,
    volume: 70,
    genre: 'Traditional SFX',
    category: 'sfx',
    description: 'Authentic brass temple bell resonance from Kathmandu valley.'
  },
  {
    id: 'bgm-himalayan-1',
    title: 'Himalayan Morning Flute Breeze',
    artist: 'Master Sarangi Ensemble',
    url: 'https://cdn.freesound.org/previews/518/518290_7037-lq.mp3',
    duration: 30,
    volume: 80,
    genre: 'Ambient Folk',
    category: 'bgm',
    description: 'Peaceful bamboo flute melody over gentle mountain wind.'
  },
  {
    id: 'bgm-kathmandu-beat',
    title: 'Modern Kathmandu Lo-Fi Beats',
    artist: 'Prakash AI Beats',
    url: 'https://cdn.freesound.org/previews/612/612887_11861866-lq.mp3',
    duration: 25,
    volume: 80,
    genre: 'Lo-Fi / Beats',
    category: 'bgm',
    description: 'Rhythmic contemporary beat blended with traditional Sarangi.'
  },
  {
    id: 'bgm-news-broadcast',
    title: 'Newsroom Breaking Broadcast Theme',
    artist: 'Studio News Network',
    url: 'https://cdn.freesound.org/previews/568/568779_6142149-lq.mp3',
    duration: 15,
    volume: 85,
    genre: 'Corporate Broadcast',
    category: 'bgm',
    description: 'Upbeat urgent news ticker background score.'
  },
  {
    id: 'vo-nepali-male-1',
    title: 'Nepali Neural Voiceover (Devanagari Studio)',
    artist: 'NepalAI TTS Engine',
    url: 'https://cdn.freesound.org/previews/518/518290_7037-lq.mp3',
    duration: 6,
    volume: 95,
    genre: 'Devanagari TTS',
    category: 'vo',
    description: 'Clear Devanagari male voiceover reading "नमस्कार, नेपालको सुन्दर भूगोलमा स्वागत छ".'
  },
  {
    id: 'vo-nepali-female-1',
    title: 'Nepali Female Studio Narrator',
    artist: 'NepalAI TTS Engine',
    url: 'https://cdn.freesound.org/previews/612/612887_11861866-lq.mp3',
    duration: 5,
    volume: 95,
    genre: 'Devanagari TTS',
    category: 'vo',
    description: 'Warm female narration reading "माउन्ट एभरेष्टको शिखरबाट सुनौलो बिहानीको दृश्य".'
  }
];

export const PREDEFINED_STOCK_ASSETS = [
  {
    id: 'stock-everest-aerial',
    title: 'Mt. Everest Golden Sunrise 4K',
    category: 'Himalayan Landscapes',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1280&q=80',
    prompt: 'Ultra-cinematic golden sunrise over Everest peak, 8k aerial drone shot.',
    textOverlay: 'Roof of the World - Mount Everest',
    textNepali: 'संसारको शिखर - माउन्ट एभरेष्ट'
  },
  {
    id: 'stock-kathmandu-durbar',
    title: 'Kathmandu Patan Heritage Square',
    category: 'Cultural Heritage',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1280&q=80',
    prompt: 'Intricate carved wooden architecture of Patan Durbar Square at twilight.',
    textOverlay: 'Timeless Cultural Splendor',
    textNepali: 'कालजयी नेपाली कला र संस्कृति'
  },
  {
    id: 'stock-phewa-lake',
    title: 'Pokhara Phewa Lake Reflection',
    category: 'Lakes & Nature',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1280&q=80',
    prompt: 'Colorful wooden boats resting on Phewa Lake with Machhapuchhre peak in background.',
    textOverlay: 'Tranquil Waters of Pokhara',
    textNepali: 'फेवाताल र माछापुच्छ्रे हिमाल'
  },
  {
    id: 'stock-boudha-stupa',
    title: 'Boudhanath Stupa Prayer Flags',
    category: 'Spiritual & Monuments',
    mediaType: 'image' as const,
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1280&q=80',
    prompt: 'Fluttering colorful prayer flags over ancient Boudhanath stupa in Kathmandu.',
    textOverlay: 'Wisdom Eyes of Peace',
    textNepali: 'विश्व शान्तिको प्रतीक - बौद्धनाथ'
  }
];

export const PREDEFINED_WATERMARKS: SceneWatermark[] = [
  {
    assetId: 'wm-nepal-ai',
    name: 'NepalAI Official Gold Seal',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=NepalAIStudioGold',
    position: 'bottom-right',
    opacity: 0.85,
    scale: 0.22,
  },
  {
    assetId: 'wm-verified',
    name: '4K Broadcast Verified Stamp',
    url: 'https://api.dicebear.com/7.x/shapes/svg?seed=VerifiedBroadcast4K',
    position: 'top-right',
    opacity: 0.9,
    scale: 0.18,
  },
  {
    assetId: 'wm-tourism',
    name: 'Nepal Tourism Official Crest',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NepalTourism Crest',
    position: 'bottom-left',
    opacity: 0.8,
    scale: 0.25,
  }
];

export const PREDEFINED_TICKERS: TickerConfig[] = [
  {
    enabled: true,
    text: 'BREAKING: NepalAI Studio v2.0 Production Engine Releases • Live 60FPS Timeline Compositor • 4K HDR Export Active',
    textNepali: 'ताजा समाचार: नेपालआई स्टुडियोमा अत्याधुनिक ६० FPS टाइमलाइन र ४K भिडियो सम्पादन उपलब्ध',
    style: 'breaking_red',
    speed: 'medium',
    position: 'bottom',
    badgeText: 'BREAKING NEWS',
  },
  {
    enabled: true,
    text: 'NEPAL TOURISM SPECIAL: Visit Nepal 2026 • Discover Majestic Everest, Kathmandu Heritage & Pokhara Peace',
    textNepali: 'नेपाल भ्रमण वर्ष २०२६: हिमाल, संस्कृति र आतिथ्यताको स्वर्गीय संगम',
    style: 'nepal_heritage',
    speed: 'slow',
    position: 'bottom',
    badgeText: 'NEPAL 2026',
  },
  {
    enabled: true,
    text: 'NEON CYBER STREAM • AI STORYBOARD • NEURAL SPEECH SYNTHESIS • SORA VIDEO INFERENCE',
    textNepali: 'साइबर भिजुअल: एआई स्टोरीबोर्ड, न्युरल भ्वाइस र सोरा भिडियो',
    style: 'neon_cyber',
    speed: 'fast',
    position: 'bottom',
    badgeText: 'LIVE STREAM',
  },
  {
    enabled: true,
    text: 'GOLDEN LUXURY EDITION • Production Grade Video Engineering • Studio Mastered Multitrack Audio',
    textNepali: 'सुनौलो संस्करण: व्यावसायिक उत्पादन र गुणस्तरीय अडियो सम्पादन',
    style: 'gold_luxury',
    speed: 'medium',
    position: 'bottom',
    badgeText: 'PRO EDITION',
  }
];

export const AssetAndSoundLibraryModal: React.FC<AssetAndSoundLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddAudioTrack,
  onAddSceneToTimeline,
  onApplyWatermarkToSelectedScene,
  onApplyTickerToSelectedScene,
  onApplyTextStyleToSelectedScene,
  selectedScene,
}) => {
  const [activeTab, setActiveTab] = useState<'sounds' | 'stock' | 'logos' | 'tickers' | 'text_styles'>('sounds');
  const [searchQuery, setSearchQuery] = useState('');
  const [audioFilter, setAudioFilter] = useState<'all' | 'bgm' | 'sfx' | 'vo'>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleTogglePlayAudio = (track: AudioTrack) => {
    if (playingAudioId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.play().catch(e => console.warn('Audio preview error:', e));
      audioRef.current.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(track.id);
    }
  };

  const filteredAudio = PREDEFINED_AUDIO_LIBRARY.filter(a => {
    const matchesCategory = audioFilter === 'all' || a.category === audioFilter;
    const matchesQuery = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const filteredStock = PREDEFINED_STOCK_ASSETS.filter(s => {
    return !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Production Asset & Sound Library</h2>
              <p className="text-xs text-slate-500">Royalty-free predefined audio tracks, stock clips, tickers, logos & styled text presets</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-white border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sounds')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'sounds' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Predefined Sounds & SFX</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-900 text-[10px]">
                {PREDEFINED_AUDIO_LIBRARY.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'stock' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Stock Clips & Scenes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {PREDEFINED_STOCK_ASSETS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logos')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'logos' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Logos & Watermarks</span>
            </button>

            <button
              onClick={() => setActiveTab('tickers')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'tickers' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>News Tickers</span>
            </button>

            <button
              onClick={() => setActiveTab('text_styles')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'text_styles' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Styled Text & Anim</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: PREDEFINED SOUNDS & SFX */}
          {activeTab === 'sounds' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filter:</span>
                {(['all', 'bgm', 'sfx', 'vo'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAudioFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      audioFilter === f
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'All Sounds' : f === 'bgm' ? '🎶 Background Music' : f === 'sfx' ? '⚡ Sound Effects (SFX)' : '🎙️ Voiceover (VO)'}
                  </button>
                ))}
              </div>

              {/* Grid of Audio Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAudio.map(track => {
                  const isPlayingThis = playingAudioId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleTogglePlayAudio(track)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition shadow-sm ${
                            isPlayingThis
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-indigo-600 text-white group-hover:scale-105'
                          }`}
                          title={isPlayingThis ? 'Pause Audio Preview' : 'Play Audio Preview'}
                        >
                          {isPlayingThis ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{track.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">{track.genre}</span>
                            <span>{track.duration}s</span>
                            <span>•</span>
                            <span className="truncate">{track.artist}</span>
                          </div>
                          <p className="text-[10px] text-slate-600 truncate mt-1">{track.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onAddAudioTrack(track);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                        title="Add this predefined sound track to timeline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STOCK CLIPS & SCENES */}
          {activeTab === 'stock' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
              {filteredStock.map(asset => (
                <div
                  key={asset.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={asset.mediaUrl}
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                      {asset.category}
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{asset.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{asset.prompt}</p>
                    </div>

                    <button
                      onClick={() => {
                        onAddSceneToTimeline({
                          title: asset.title,
                          duration: 4,
                          prompt: asset.prompt,
                          mediaUrl: asset.mediaUrl,
                          mediaType: asset.mediaType,
                          aspectRatio: '16:9',
                          motion: 'pan_right',
                          transition: 'fade',
                          textOverlay: asset.textOverlay,
                          textNepali: asset.textNepali,
                          textPosition: 'lower_third',
                          textColor: '#ffffff',
                          textFont: 'devanagari',
                          filter: 'cinematic',
                          volume: 90
                        });
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Scene to Timeline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LOGOS & WATERMARKS */}
          {activeTab === 'logos' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Select a predefined watermark stamp to instantly apply to the current active scene or entire timeline:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PREDEFINED_WATERMARKS.map(wm => (
                  <div
                    key={wm.assetId}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center space-y-3 hover:border-indigo-400 transition"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
                      <img src={wm.url} alt={wm.name} className="max-w-full max-h-full object-contain" />
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{wm.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Position: {wm.position}</p>
                    </div>

                    <button
                      onClick={() => {
                        onApplyWatermarkToSelectedScene(wm);
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Logo Stamp</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TICKERS */}
          {activeTab === 'tickers' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 font-medium">Select a predefined scrolling marquee news ticker style to attach to the active scene preview:</p>

              <div className="grid grid-cols-1 gap-3">
                {PREDEFINED_TICKERS.map((ticker, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900 border border-slate-700 rounded-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                          {ticker.badgeText}
                        </span>
                        <span className="text-xs font-bold text-indigo-300 uppercase">{ticker.style.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 font-['Mukta']">{ticker.textNepali}</p>
                      <p className="text-[11px] text-slate-400">{ticker.text}</p>
                    </div>

                    <button
                      onClick={() => {
                        onApplyTickerToSelectedScene(ticker);
                        onClose();
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer shadow-sm"
                    >
                      Attach Ticker
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TEXT STYLES & ANIMATIONS */}
          {activeTab === 'text_styles' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Classic Lower Third', style: 'lower_third' as const, anim: 'fade_in' as const, desc: 'Dark frosted pill with clear white text' },
                { name: 'Neon Cyber Glow', style: 'neon_glow' as const, anim: 'glitch' as const, desc: 'Electric cyan shadow with futuristic vibe' },
                { name: 'Gold Luxury Bar', style: 'gold_gradient' as const, anim: 'bounce' as const, desc: 'Shimmering gold border with rich dark background' },
                { name: 'Devanagari Mukta Bold', style: 'devanagari_bold' as const, anim: 'typewriter' as const, desc: 'Mukta font optimized for Nepali subtitles' },
                { name: 'Impact Meme Caption', style: 'impact_caption' as const, anim: 'zoom_pop' as const, desc: 'Bold uppercase impact text with drop shadow' },
                { name: 'Minimalist Glass Pill', style: 'glass_pill' as const, anim: 'slide_up' as const, desc: 'Translucent frosted glass with subtle tracking' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-indigo-400 transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => {
                      onApplyTextStyleToSelectedScene(item.style, item.anim);
                      onClose();
                    }}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Apply Text Style
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>NepalAI Production Library v2.0 • High-Fidelity Multi-Track Assets</span>
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
