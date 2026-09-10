import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Volume2, 
  Film, 
  Image as ImageIcon, 
  Sparkles, 
  Search, 
  Plus, 
  GripVertical, 
  Download, 
  Database, 
  Check, 
  Zap,
  Play,
  Pause,
  X
} from 'lucide-react';
import { AudioTrack, Scene, SceneWatermark } from '../types';

export interface MediaAssetItem {
  id: string;
  title: string;
  category: 'sfx' | 'bgm' | 'video' | 'watermark' | 'graphic';
  url: string;
  duration?: number;
  tags: string[];
  previewUrl?: string;
}

const PREDEFINED_PRODUCTION_ASSETS: MediaAssetItem[] = [
  // SFX
  {
    id: 'sfx-whoosh-1',
    title: 'Cinematic Camera Whoosh',
    category: 'sfx',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-cinematic-transition-whoosh-148.mp3',
    duration: 1.5,
    tags: ['sfx', 'transition', 'whoosh']
  },
  {
    id: 'sfx-boom-1',
    title: 'Deep Sub Bass Impact',
    category: 'sfx',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-deep-impact-1576.mp3',
    duration: 2.2,
    tags: ['sfx', 'impact', 'bass']
  },
  {
    id: 'sfx-temple-bell',
    title: 'Himalayan Temple Chime',
    category: 'sfx',
    url: 'https://assets.mixkit.co/sfx/preview/mixkit-happy-bells-notification-937.mp3',
    duration: 3.0,
    tags: ['sfx', 'bell', 'nepal']
  },
  // BGM
  {
    id: 'bgm-himalaya-ambient',
    title: 'Himalayan Peace Flute',
    category: 'bgm',
    url: 'https://assets.mixkit.co/music/preview/mixkit-relaxing-in-nature-522.mp3',
    duration: 180,
    tags: ['bgm', 'ambient', 'flute']
  },
  {
    id: 'bgm-newsroom-fast',
    title: 'Headline Newsroom Synth',
    category: 'bgm',
    url: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    duration: 120,
    tags: ['bgm', 'news', 'fast']
  },
  // Video
  {
    id: 'vid-kathmandu-street',
    title: 'Kathmandu Durbar Square 4K',
    category: 'video',
    url: '/samples/ForBiggerBlazes.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=400&auto=format&fit=crop',
    duration: 10,
    tags: ['video', 'kathmandu', 'heritage']
  },
  {
    id: 'vid-everest-timelapse',
    title: 'Mount Everest Sunrise Drone',
    category: 'video',
    url: '/samples/ForBiggerEscapes.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop',
    duration: 12,
    tags: ['video', 'everest', 'mountains']
  },
  {
    id: 'vid-pokhara-lake',
    title: 'Phewa Lake Peaceful Drift 4K',
    category: 'video',
    url: '/samples/TearsOfSteel.mp4',
    previewUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=400&auto=format&fit=crop',
    duration: 15,
    tags: ['video', 'pokhara', 'nature']
  },
  // Watermarks
  {
    id: 'wm-hamroai-spire',
    title: 'HamroAI Spire Core',
    category: 'watermark',
    url: '/logo.jpg',
    tags: ['watermark', 'logo', 'hamroai', 'spire']
  },
  {
    id: 'wm-nepalai-gold',
    title: 'NepalAI Gold Emblem',
    category: 'watermark',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    tags: ['watermark', 'logo', 'gold']
  },
  {
    id: 'wm-news-live',
    title: 'Live News Broadcast Badge',
    category: 'watermark',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200&auto=format&fit=crop&q=80',
    tags: ['watermark', 'news', 'live']
  }
];

interface MediaLibraryProps {
  onAddAudioTrack: (track: AudioTrack) => void;
  onAddScene: (scene: Omit<Scene, 'id'>) => void;
  onApplyWatermark?: (watermark: SceneWatermark) => void;
  className?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onAddAudioTrack,
  onAddScene,
  onApplyWatermark,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sfx' | 'bgm' | 'video' | 'watermark'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [previewingVideo, setPreviewingVideo] = useState<MediaAssetItem | null>(null);
  const [assets, setAssets] = useState<MediaAssetItem[]>(PREDEFINED_PRODUCTION_ASSETS);
  const [isFetchingFromSupabase, setIsFetchingFromSupabase] = useState(false);

  // Filter assets
  const filteredAssets = assets.filter(a => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const togglePreviewAudio = (asset: MediaAssetItem) => {
    if (playingAudioId === asset.id) {
      if (audioObj) {
        audioObj.pause();
        setPlayingAudioId(null);
      }
    } else {
      if (audioObj) audioObj.pause();
      const newAudio = new Audio(asset.url);
      newAudio.play().catch(() => {});
      newAudio.onended = () => setPlayingAudioId(null);
      setAudioObj(newAudio);
      setPlayingAudioId(asset.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, asset: MediaAssetItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddAsset = (asset: MediaAssetItem) => {
    if (asset.category === 'bgm' || asset.category === 'sfx') {
      onAddAudioTrack({
        id: 'track-' + Math.random().toString(36).substring(2, 8),
        title: asset.title,
        url: asset.url,
        type: asset.category === 'sfx' ? 'sfx' : 'bgm',
        volume: 85,
        startTime: 0,
        duration: asset.duration || 10,
      });
    } else if (asset.category === 'video') {
      onAddScene({
        title: asset.title,
        duration: asset.duration || 8,
        prompt: `Production media asset: ${asset.title}`,
        mediaUrl: asset.url,
        thumbnailUrl: asset.previewUrl,
        mediaType: 'video',
        aspectRatio: '16:9',
        motion: 'pan_right',
        transition: 'crossfade',
        textOverlay: asset.title.toUpperCase(),
        textNepali: 'नेपालआई मिडिया',
        textPosition: 'bottom',
        textColor: '#ffffff',
        textFont: 'sans',
        textStyle: 'lower_third',
        textAnimation: 'fade_in',
        filter: 'none',
        volume: 80,
      });
    } else if (asset.category === 'watermark' && onApplyWatermark) {
      onApplyWatermark({
        assetId: asset.id,
        name: asset.title,
        url: asset.url,
        position: 'top-right',
        opacity: 0.85,
        scale: 0.2,
      });
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Production Asset Library
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>Supabase Storage Ready</span>
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
        {(['all', 'sfx', 'bgm', 'video', 'watermark'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-1 py-1 rounded text-center capitalize transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sound effects, BGM, videos, watermarks..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Assets Grid / List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            draggable
            onDragStart={(e) => handleDragStart(e, asset)}
            className="group flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/50 transition cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="text-slate-500 group-hover:text-slate-300">
                <GripVertical className="w-3.5 h-3.5" />
              </div>

              {/* Media Thumbnail / Icon */}
              {asset.category === 'video' ? (
                <div 
                  className="relative w-12 h-8 rounded-md bg-black overflow-hidden shrink-0 border border-slate-700/80 group/vid cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewingVideo(previewingVideo?.id === asset.id ? null : asset);
                  }}
                  title="Click to preview video"
                >
                  <img
                    src={asset.previewUrl || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=300&auto=format&fit=crop'}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/vid:bg-black/20 transition">
                    <div className="w-4 h-4 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow">
                      <Play className="w-2 h-2 ml-0.5 fill-white text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 text-slate-300">
                  {asset.category === 'sfx' && <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                  {asset.category === 'bgm' && <Music className="w-3.5 h-3.5 text-indigo-400" />}
                  {asset.category === 'watermark' && <ImageIcon className="w-3.5 h-3.5 text-teal-400" />}
                </div>
              )}

              <div className="min-w-0">
                <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate block">
                  {asset.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {asset.category.toUpperCase()} {asset.duration ? `• ${asset.duration}s` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {(asset.category === 'sfx' || asset.category === 'bgm') && (
                <button
                  onClick={() => togglePreviewAudio(asset)}
                  className="p-1 rounded-md bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                  title="Preview Audio"
                >
                  {playingAudioId === asset.id ? <Pause className="w-3 h-3 text-rose-400" /> : <Play className="w-3 h-3" />}
                </button>
              )}

              {asset.category === 'video' && (
                <button
                  onClick={() => setPreviewingVideo(previewingVideo?.id === asset.id ? null : asset)}
                  className="p-1 rounded-md bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Preview Video Player"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => handleAddAsset(asset)}
                className="px-2 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                title="Add to Timeline"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Preview Lightbox Modal */}
      {previewingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white truncate max-w-xs">{previewingVideo.title}</h4>
              </div>
              <button
                onClick={() => setPreviewingVideo(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative">
              <video
                src={previewingVideo.url}
                poster={previewingVideo.previewUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-400">
                Duration: {previewingVideo.duration || 10}s
              </span>
              <button
                onClick={() => {
                  handleAddAsset(previewingVideo);
                  setPreviewingVideo(null);
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
