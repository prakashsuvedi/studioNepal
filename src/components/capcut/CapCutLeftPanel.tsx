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
  Video as VideoIcon,
  Check, 
  CheckCircle2,
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
  Clock,
  Eye,
  ArrowRightLeft,
  X,
  Copy,
  Heading,
  Shield,
  Award
} from 'lucide-react';
import { Scene, AudioTrack, StarterTemplate } from '../../types';
import { getStoredMedia, MediaItem, saveMediaItem, deleteMediaItem } from '../../lib/mediaLibrary';
import { BrandOverlayConfig, WATERMARK_PRESETS } from '../BrandOverlayModal';
import { SubtitleItem, SubtitleBurnOptions } from '../SubtitleEditorModal';

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
  brandOverlayConfig?: BrandOverlayConfig;
  setBrandOverlayConfig?: React.Dispatch<React.SetStateAction<BrandOverlayConfig>>;
  subtitles?: SubtitleItem[];
  subtitleBurnOptions?: SubtitleBurnOptions;
  setSubtitleBurnOptions?: React.Dispatch<React.SetStateAction<SubtitleBurnOptions>>;
}

type TabType = 'media' | 'audio' | 'titles' | 'watermark' | 'effects' | 'transitions' | 'captions' | 'filters' | 'templates' | 'ai';
type SubTabType = 'all' | 'imported' | 'generated' | 'stock';
type TypeFilter = 'all' | 'video' | 'image';

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
  brandOverlayConfig,
  setBrandOverlayConfig,
  subtitles,
  subtitleBurnOptions,
  setSubtitleBurnOptions,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previewingItem, setPreviewingItem] = useState<MediaItem | null>(null);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Audio preview playing state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // File input ref for fast local importing
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && setBrandOverlayConfig) {
        setBrandOverlayConfig(prev => ({
          ...prev,
          enabled: true,
          logoUrl: dataUrl,
          brandText: file.name.replace(/\.[^/.]+$/, ''),
          showBrandText: false,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId) || scenes[0];

  const loadMedia = () => {
    const items = getStoredMedia();
    setMediaItems(items);
  };

  useEffect(() => {
    loadMedia();
    const handleStorage = () => loadMedia();
    const handleCustom = () => loadMedia();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('nepalai_media_library_updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nepalai_media_library_updated', handleCustom);
    };
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

  // Extract thumbnail and duration from local video files via offscreen canvas
  const extractVideoMetadata = (file: File): Promise<{ thumbnailUrl: string; duration: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const tempUrl = URL.createObjectURL(file);
      video.src = tempUrl;
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        resolve({ thumbnailUrl: '', duration: 5 });
      }, 3500);

      video.onloadedmetadata = () => {
        const dur = Math.round(video.duration) || 5;
        video.currentTime = Math.min(1, Math.max(0.2, dur / 3));
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 320, 180);
            const thumb = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ thumbnailUrl: thumb, duration: Math.round(video.duration) || 5 });
            return;
          }
        } catch (err) {}
        resolve({ thumbnailUrl: '', duration: Math.round(video.duration) || 5 });
      };

      video.onerror = () => {
        clearTimeout(timeout);
        resolve({ thumbnailUrl: '', duration: 5 });
      };
    });
  };

  const processFiles = async (files: File[]) => {
    setIsProcessingUpload(true);
    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i);
        const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i);

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
          let thumbnail = '';
          let duration = isVideo ? 5 : 4;

          if (isVideo) {
            const meta = await extractVideoMetadata(file);
            if (meta.thumbnailUrl) thumbnail = meta.thumbnailUrl;
            if (meta.duration) duration = meta.duration;
          }

          const item: MediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            url,
            thumbnailUrl: thumbnail || (isVideo ? undefined : url),
            type: isVideo ? 'sora_video' : 'upload',
            category: isVideo ? 'Imported Video' : 'Imported Media',
            createdAt: Date.now(),
            duration
          };

          saveMediaItem(item);
          loadMedia();

          const sceneId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
          const newScene: Scene = {
            id: sceneId,
            title: item.title,
            duration: item.duration || (isVideo ? 5 : 4),
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

          // Concurrently upload file to server storage bucket for persistent server rendering
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const fullData = reader.result as string;
              const base64Data = fullData.split(',')[1] || fullData;
              const sanitizedName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              const uploadResp = await fetch('/api/storage/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: sanitizedName,
                  fileData: base64Data,
                  mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg')
                })
              });
              if (uploadResp.ok) {
                const uploadJson = await uploadResp.json();
                const serverUrl = uploadJson.url || `/api/storage/file/${uploadJson.filename}`;
                if (serverUrl && onUpdateScene) {
                  onUpdateScene(sceneId, { mediaUrl: serverUrl });
                }
              }
            } catch (syncErr) {
              console.warn('[MediaUpload] Storage bucket sync notice:', syncErr);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    } finally {
      setIsProcessingUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMediaItem(id);
    loadMedia();
  };

  // Add media item to timeline with visual feedback
  const handleAddMediaToTimeline = (item: MediaItem) => {
    const isVideoItem = item.type === 'sora_video' || (item as any).type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
    const newScene: Scene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: item.title,
      duration: item.duration || (isVideoItem ? 5 : 4),
      prompt: item.prompt || item.title,
      mediaUrl: item.url,
      thumbnailUrl: item.thumbnailUrl || (item.url.endsWith('.mp4') ? item.url.replace(/\.mp4$/, '_thumb.jpg') : undefined),
      mediaType: isVideoItem ? 'video' : 'image',
      aspectRatio: (item.aspectRatio as any) || '16:9',
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
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1500);
  };

  // 1-Click Replace selected scene's media
  const handleReplaceSelectedScene = (item: MediaItem) => {
    if (!selectedScene || !onUpdateScene) return;
    const isVideoItem = item.type === 'sora_video' || (item as any).type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
    onUpdateScene(selectedScene.id, {
      mediaUrl: item.url,
      mediaType: isVideoItem ? 'video' : 'image',
      title: item.title,
      prompt: item.prompt || item.title,
      duration: item.duration || selectedScene.duration,
    });
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1500);
  };

  // Stock Nepali & Cinematic media items
  const stockMedia: MediaItem[] = [
    {
      id: 'stock-v1',
      title: 'Himalayan Golden Flight (Sora-2 Video)',
      url: '/samples/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
      type: 'sora_video',
      category: 'Stock Video',
      createdAt: 1704067200000,
      duration: 6,
      resolution: '4K Ultra HD',
      prompt: 'Aerial drone flight over Everest at golden hour with morning light'
    },
    {
      id: 'stock-v2',
      title: 'Heritage Temple Alleys (Sora-2 Video)',
      url: '/samples/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=800&auto=format&fit=crop',
      type: 'sora_video',
      category: 'Stock Video',
      createdAt: 1704067200000,
      duration: 5,
      resolution: '1080p',
      prompt: 'Moving cinematic tracking shot through Newari historical brick architecture'
    },
    {
      id: 'stock-v3',
      title: 'Phewa Lakeside Motion (Sora-2 Reel)',
      url: '/samples/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
      type: 'sora_video',
      category: 'Stock Video',
      createdAt: 1704067200000,
      duration: 6,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      prompt: 'Vertical boat gliding on crystal mountain lake in Pokhara'
    },
    {
      id: 'stock-v4',
      title: 'Trishuli River Rapids & Mountain Valley',
      url: '/samples/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
      type: 'sora_video',
      category: 'Stock Video',
      createdAt: 1704067200000,
      duration: 6,
      resolution: '1080p',
      prompt: 'Dynamic drone tracking shot along rapid crystal blue river'
    },
    {
      id: 'stock-v5',
      title: 'Everest Khumbu Glacier Icefalls',
      url: '/samples/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
      type: 'sora_video',
      category: 'Stock Video',
      createdAt: 1704067200000,
      duration: 5,
      resolution: '1080p',
      prompt: 'Cinematic sweep across deep blue glacial crevasses'
    },
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

  // Helper to accurately identify audio / voiceover items
  const isAudioItem = (item: MediaItem) => {
    return (
      item.type === 'ai_audio' ||
      (item as any).type === 'audio' ||
      (item as any).type === 'voiceover' ||
      (item.title && item.title.toLowerCase().startsWith('[voiceover]')) ||
      (item.title && item.title.toLowerCase().includes('voiceover')) ||
      (item.category && item.category.toLowerCase().includes('voice')) ||
      (item.category && item.category.toLowerCase().includes('audio')) ||
      (item.category && item.category.toLowerCase().includes('sound')) ||
      Boolean(item.url && item.url.match(/\.(mp3|wav|ogg|m4a|aac)($|\?)/i)) ||
      Boolean(item.url && item.url.startsWith('data:audio'))
    );
  };

  // Combined visual media items (Videos and Images ONLY) for the Media Tab
  const visualMediaItems = mediaItems.filter(item => !isAudioItem(item));
  const allMedia = [...visualMediaItems, ...stockMedia];
  const totalVideos = allMedia.filter(i => i.type === 'sora_video' || (i as any).type === 'video' || (i.url && i.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i))).length;
  const totalImages = allMedia.length - totalVideos;

  const filteredMedia = allMedia.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    const isVid = item.type === 'sora_video' || (item as any).type === 'video' || (item.url && item.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i));

    // Type filter
    if (typeFilter === 'video' && !isVid) return false;
    if (typeFilter === 'image' && isVid) return false;

    // Subtab filter
    if (activeSubTab === 'imported') return item.type === 'upload';
    if (activeSubTab === 'generated') return item.type === 'sora_video' || item.type === 'ai_image';
    if (activeSubTab === 'stock') return (item.category && item.category.startsWith('Stock')) || item.id.startsWith('stock-');
    return true;
  });

  // User-generated and imported voiceovers/audio from media library (Strictly for the Audio Tab)
  const importedVoiceovers = mediaItems.filter(item => isAudioItem(item));

  // High-Quality Royalty-Free Music Samples (Nepali & Cinematic)
  const bgmSampleCatalog: AudioTrack[] = [
    {
      id: 'bgm-sample-himalayan-breeze',
      title: 'Himalayan Morning Breeze',
      artist: 'Acoustic Bansuri Ensemble',
      url: '/audio/himalayan_breeze.mp3',
      duration: 32,
      volume: 80,
      genre: 'Himalayan Folk',
      type: 'bgm'
    },
    {
      id: 'bgm-sample-kathmandu-beats',
      title: 'Kathmandu Urban Lo-Fi',
      artist: 'Patan Studio Beats',
      url: '/audio/kathmandu_beats.mp3',
      duration: 28,
      volume: 75,
      genre: 'Lo-Fi Chill',
      type: 'bgm'
    },
    {
      id: 'bgm-sample-temple-dawn',
      title: 'Pashupati Temple Dawn Chimes',
      artist: 'Sacred Himalayan Sounds',
      url: '/audio/temple_bells.mp3',
      duration: 24,
      volume: 70,
      genre: 'Spiritual Ambient',
      type: 'bgm'
    },
    {
      id: 'bgm-sample-mountain-bansuri',
      title: 'Annapurna Valley Bansuri',
      artist: 'Traditional Flute Master',
      url: '/audio/sfx_flute.mp3',
      duration: 30,
      volume: 85,
      genre: 'Acoustic Folk',
      type: 'bgm'
    },
    {
      id: 'bgm-sample-everest-winds',
      title: 'Everest Glacial Summit Winds',
      artist: 'Cinematic Soundscapes',
      url: '/audio/sfx_wind.mp3',
      duration: 35,
      volume: 90,
      genre: 'Epic Cinematic',
      type: 'bgm'
    },
    {
      id: 'bgm-sample-monsoon-rain',
      title: 'Kathmandu Monsoon Serenade',
      artist: 'Nepal Nature Records',
      url: '/audio/sfx_rain.mp3',
      duration: 30,
      volume: 70,
      genre: 'Nature Atmos',
      type: 'bgm'
    }
  ];

  // Sound Effects (SFX) Library
  const sfxLibrary: AudioTrack[] = [
    {
      id: 'sfx-swoosh',
      title: 'Cinematic Whoosh Transition',
      artist: 'Studio FX',
      url: '/audio/sfx_whoosh.mp3',
      duration: 2,
      volume: 85,
      genre: 'SFX Whoosh',
      type: 'bgm'
    },
    {
      id: 'sfx-bowl',
      title: 'Tibetan Singing Bowl Resonator',
      artist: 'Himalayan Healing',
      url: '/audio/sfx_bell.mp3',
      duration: 4,
      volume: 80,
      genre: 'SFX Healing',
      type: 'bgm'
    },
    {
      id: 'sfx-camera',
      title: 'Camera Shutter Click',
      artist: 'Studio FX',
      url: '/audio/sfx_camera.mp3',
      duration: 1,
      volume: 90,
      genre: 'SFX Shutter',
      type: 'bgm'
    },
    {
      id: 'sfx-pop',
      title: 'Modern UI Pop Ding',
      artist: 'Studio FX',
      url: '/audio/sfx_pop.mp3',
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
    <div className="flex h-full shrink-0 select-none z-20 border-r border-slate-800/80 bg-[#0c0e17]">
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

      {/* 1. Primary Vertical Tool Navigation Rail (Studio Pro Archetype) */}
      <div className="w-13 bg-[#090b13] border-r border-slate-800/80 flex flex-col items-center py-1.5 space-y-0.5 shrink-0 select-none z-10">
        {[
          { id: 'media', label: 'Media', icon: Folder },
          { id: 'audio', label: 'Audio', icon: Music },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'watermark', label: 'Brand', icon: Shield },
          { id: 'captions', label: 'Captions', icon: MessageSquare },
          { id: 'effects', label: 'Effects', icon: Sparkles },
          { id: 'transitions', label: 'Transitions', icon: Scissors },
          { id: 'filters', label: 'Filters', icon: Palette },
          { id: 'templates', label: 'Templates', icon: LayoutTemplate },
          { id: 'ai', label: 'AI Studio', icon: Zap },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`relative flex flex-col items-center justify-center w-11 py-1.5 rounded-lg text-[9px] font-semibold transition-all duration-150 cursor-pointer group ${
                isActive 
                  ? 'bg-slate-800/90 text-cyan-400 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title={tab.label}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-cyan-400 rounded-r-full shadow-sm shadow-cyan-400/50" />
              )}
              <Icon className={`w-3.5 h-3.5 mb-0.5 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="leading-tight tracking-tight text-[8.5px] truncate max-w-[42px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Contextual Media / Tools Panel */}
      <div className="w-60 sm:w-64 md:w-68 bg-[#0c0e17] flex flex-col h-full overflow-hidden shrink-0">
        {/* Contextual Header Bar */}
        <div className="h-8.5 px-3 border-b border-slate-800/80 bg-[#0a0d14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-200 capitalize tracking-wide">
              {activeTab === 'ai' ? 'AI Studio' : activeTab === 'watermark' ? 'Brand Watermark' : `${activeTab}`}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-cyan-400 font-bold">
              {activeTab === 'media' ? filteredMedia.length :
               activeTab === 'audio' ? (audioTracks.length + sfxLibrary.length + importedVoiceovers.length + bgmSampleCatalog.length) :
               activeTab === 'effects' ? vfxPresets.length :
               activeTab === 'transitions' ? transitionPresets.length :
               activeTab === 'filters' ? filterPresets.length :
               activeTab === 'text' ? textPresets.length :
               activeTab === 'watermark' ? (brandOverlayConfig?.enabled ? 'ACTIVE' : 'OFF') :
               activeTab === 'captions' ? (subtitles?.length || 0) : ''}
            </span>
          </div>
          {activeTab === 'media' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm shrink-0 cursor-pointer active:scale-95"
              title="Import local files"
            >
              <Upload className="w-2.5 h-2.5 text-slate-950 stroke-[2.5]" />
              <span>Import</span>
            </button>
          )}
        </div>

        {/* 2. Search & Filter Header (when applicable) */}
        {activeTab === 'media' && (
          <div className="p-2 border-b border-slate-800/70 space-y-1.5 bg-[#0e111b]">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-md pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

          {/* Subtabs for Media Source */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-0.5">
              {(['all', 'imported', 'generated', 'stock'] as SubTabType[]).map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubTab(sub)}
                  className={`px-1.5 py-0.5 rounded text-[9px] capitalize transition cursor-pointer ${
                    activeSubTab === sub 
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 text-slate-500">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-0.5 rounded cursor-pointer ${viewMode === 'grid' ? 'text-cyan-400 bg-slate-800' : 'hover:text-slate-300'}`}
                title="Grid view"
              >
                <Grid className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-0.5 rounded cursor-pointer ${viewMode === 'list' ? 'text-cyan-400 bg-slate-800' : 'hover:text-slate-300'}`}
                title="List view"
              >
                <List className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Type Filter Pills: All / Videos / Images */}
          <div className="flex items-center gap-1 pt-0.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium transition cursor-pointer flex items-center gap-1 ${
                typeFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All</span>
              <span className="opacity-70 text-[8px]">({allMedia.length})</span>
            </button>

            <button
              onClick={() => setTypeFilter('video')}
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium transition cursor-pointer flex items-center gap-1 ${
                typeFilter === 'video'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-cyan-300'
              }`}
            >
              <VideoIcon className="w-2 h-2" />
              <span>Videos</span>
              <span className="opacity-70 text-[8px]">({totalVideos})</span>
            </button>

            <button
              onClick={() => setTypeFilter('image')}
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium transition cursor-pointer flex items-center gap-1 ${
                typeFilter === 'image'
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-purple-300'
              }`}
            >
              <ImageIcon className="w-2 h-2" />
              <span>Images</span>
              <span className="opacity-70 text-[8px]">({totalImages})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Tab Contents Area */}
      <div 
        className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar relative"
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleFileDrop}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDraggingOver && activeTab === 'media' && (
          <div className="absolute inset-1.5 z-30 bg-cyan-950/90 border-2 border-dashed border-cyan-400 rounded-lg flex flex-col items-center justify-center text-center p-3 backdrop-blur-xs transition-all pointer-events-none">
            <Upload className="w-8 h-8 text-cyan-300 mb-1.5 animate-bounce" />
            <p className="text-xs font-bold text-white">Drop to import media</p>
            <p className="text-[10px] text-cyan-200/80 mt-0.5">Auto thumbnail & timeline ready</p>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessingUpload && (
          <div className="p-2 bg-cyan-950/40 border border-cyan-500/40 rounded-lg flex items-center gap-2 text-[11px] text-cyan-200">
            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Processing media...</span>
          </div>
        )}

        {/* ==================== MEDIA TAB ==================== */}
        {activeTab === 'media' && (
          <>
            {filteredMedia.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">No media assets</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Import or generate media.</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setTypeFilter('all');
                      setActiveSubTab('all');
                      setSearchQuery('');
                    }}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 rounded-md transition cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md text-[10px] font-bold transition cursor-pointer"
                  >
                    Import
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-1.5">
                {filteredMedia.map(item => {
                  const isVideoItem = item.type === 'sora_video' || (item as any).type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
                  const isAdded = addedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-slate-950 border border-slate-800/90 rounded-md overflow-hidden transition hover:border-cyan-500/60 flex flex-col shadow-xs"
                    >
                      {/* Thumbnail with Video Play Indicator & Hover Playback */}
                      <div className="relative aspect-[16/11] w-full bg-black overflow-hidden flex items-center justify-center">
                        {isVideoItem ? (
                          <>
                            <video
                              src={item.url}
                              poster={item.thumbnailUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onMouseEnter={(e) => {
                                const v = e.currentTarget;
                                v.play().catch(() => {});
                              }}
                              onMouseLeave={(e) => {
                                const v = e.currentTarget;
                                v.pause();
                                v.currentTime = 0;
                              }}
                            />
                            {/* Persistent Video Play Overlay Badge */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                              <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs border border-white/30 flex items-center justify-center text-white shadow-md">
                                <Play className="w-3 h-3 fill-white ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Type Badge */}
                        <span className={`absolute top-1 left-1 px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase backdrop-blur-xs ${
                          isVideoItem ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40' : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                        }`}>
                          {isVideoItem ? 'VID' : 'IMG'}
                        </span>

                        {/* Duration Badge */}
                        {item.duration && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[8px] font-mono text-slate-300">
                            {item.duration}s
                          </span>
                        )}

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          <div className="flex items-center gap-1">
                            {/* Quick Add Button */}
                            <button
                              onClick={() => handleAddMediaToTimeline(item)}
                              className={`px-2 py-1 rounded font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1 text-[10px] ${
                                isAdded 
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                              }`}
                              title="Add to Timeline"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 stroke-[2.5]" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>

                            {/* Preview Lightbox Button */}
                            <button
                              onClick={() => setPreviewingItem(item)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition cursor-pointer"
                              title="Preview Full Screen"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Quick Replace Button (when a scene is selected on timeline) */}
                          {selectedScene && onUpdateScene && (
                            <button
                              onClick={() => handleReplaceSelectedScene(item)}
                              className="px-1.5 py-0.5 bg-slate-800/90 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-200 rounded text-[9px] font-medium transition cursor-pointer flex items-center gap-1 border border-slate-700/60"
                              title={`Replace selected clip (${selectedScene.title})`}
                            >
                              <ArrowRightLeft className="w-2 h-2" />
                              <span>Replace</span>
                            </button>
                          )}

                          {item.id.startsWith('media-') && (
                            <button
                              onClick={(e) => handleDeleteMedia(item.id, e)}
                              className="text-[9px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                              title="Delete from Library"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Metadata Footer */}
                      <div className="p-1 px-1.5 flex items-center justify-between text-[10px] bg-slate-950">
                        <span className="font-semibold text-slate-300 truncate max-w-[85px]" title={item.title}>
                          {item.title}
                        </span>
                        <button
                          onClick={() => setPreviewingItem(item)}
                          className="text-slate-500 hover:text-slate-300 transition"
                          title="View Info"
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredMedia.map(item => {
                  const isVideoItem = item.type === 'sora_video' || (item as any).type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)($|\?)/i);
                  const isAdded = addedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-1.5 bg-slate-950 border border-slate-800 rounded-md hover:border-cyan-500/50 transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="relative w-12 h-8 rounded bg-black overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center cursor-pointer"
                          onClick={() => setPreviewingItem(item)}
                          title="Click to preview"
                        >
                          {isVideoItem ? (
                            <>
                              <video
                                src={item.url}
                                poster={item.thumbnailUrl}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10">
                                <Play className="w-2.5 h-2.5 fill-white text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={item.thumbnailUrl || item.url} alt={item.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-200 truncate max-w-[95px]">{item.title}</p>
                          <p className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                            <span className={isVideoItem ? 'text-cyan-400 font-bold' : 'text-purple-400 font-bold'}>
                              {isVideoItem ? 'VID' : 'IMG'}
                            </span>
                            <span>•</span>
                            <span>{item.duration || 4}s</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setPreviewingItem(item)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {selectedScene && onUpdateScene && (
                          <button
                            onClick={() => handleReplaceSelectedScene(item)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition cursor-pointer"
                            title={`Replace selected clip (${selectedScene.title})`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleAddMediaToTimeline(item)}
                          className={`p-1.5 rounded-md transition font-bold cursor-pointer flex items-center gap-1 text-[11px] ${
                            isAdded
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950'
                          }`}
                          title="Add to Timeline"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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

            {/* Voiceovers & Imported Audio (Saved in Media Library) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>AI Voiceovers & Speech</span>
                </h4>
                <span className="px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-800/60 text-[9px] text-emerald-300 font-mono rounded">
                  {importedVoiceovers.length}
                </span>
              </div>

              {importedVoiceovers.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-1.5">
                  <p className="text-[10px] text-slate-400">No generated voiceovers yet.</p>
                  {onOpenVoiceStudio && (
                    <button
                      onClick={onOpenVoiceStudio}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[10px] text-emerald-300 rounded font-semibold transition cursor-pointer flex items-center gap-1 mx-auto"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Generate Voiceover</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
                  {importedVoiceovers.map(item => {
                    const isPreviewPlaying = playingAudioUrl === item.url;
                    return (
                      <div
                        key={item.id}
                        className="p-1.5 bg-slate-950 border border-emerald-900/40 hover:border-emerald-500/60 rounded-md flex items-center justify-between transition group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => togglePlayAudioPreview(item.url)}
                            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isPreviewPlaying
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-800/80 hover:text-white'
                            }`}
                            title={isPreviewPlaying ? 'Pause' : 'Play Voiceover Preview'}
                          >
                            {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                          </button>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-200 truncate max-w-[125px] flex items-center gap-1" title={item.title}>
                              <Volume2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{item.title.replace(/^\[voiceover\]\s*/i, '')}</span>
                            </p>
                            <p className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                              <span>{item.engine || item.category || 'AI Voiceover'}</span>
                              <span>•</span>
                              <span>{Math.round(item.duration || 6)}s</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onAddAudioToTimeline({
                                id: item.id,
                                title: item.title.replace(/^\[voiceover\]\s*/i, ''),
                                artist: item.engine || 'NepalAI Voiceover',
                                url: item.url,
                                duration: item.duration || 8,
                                volume: 100,
                                genre: 'Voiceover',
                                type: 'voiceover'
                              });
                            }}
                            className="p-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded transition cursor-pointer font-bold"
                            title="Add to Voiceover Track"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteMedia(item.id, e)}
                            className="p-1 text-slate-600 hover:text-rose-400 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Voiceover"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BGM Soundtracks */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Soundtracks (BGM)</h4>
              <div className="space-y-1">
                {audioTracks.map(track => {
                  const isPreviewPlaying = playingAudioUrl === track.url;
                  return (
                    <div
                      key={track.id}
                      className="p-1.5 bg-slate-950 border border-slate-800/90 rounded-md flex items-center justify-between hover:border-purple-500/50 transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => togglePlayAudioPreview(track.url)}
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isPreviewPlaying 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-purple-950/60 text-purple-400 hover:bg-purple-800/80 hover:text-white'
                          }`}
                          title={isPreviewPlaying ? 'Pause' : 'Play'}
                        >
                          {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-200 truncate max-w-[130px]">{track.title}</p>
                          <p className="text-[9px] text-purple-400 font-mono">{track.genre || 'Soundtrack'} • {track.duration || 30}s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddAudioToTimeline(track)}
                        className="p-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded transition cursor-pointer font-bold"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Himalayan & Cultural Royalty-Free Music Catalog */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Music className="w-3 h-3 text-cyan-400" />
                  <span>Himalayan & Cinematic Catalog</span>
                </h4>
                <span className="px-1.5 py-0.2 bg-cyan-950/60 border border-cyan-800/60 text-[9px] text-cyan-300 font-mono rounded">
                  {bgmSampleCatalog.length}
                </span>
              </div>
              <div className="space-y-1">
                {bgmSampleCatalog.map(track => {
                  const isPreviewPlaying = playingAudioUrl === track.url;
                  return (
                    <div
                      key={track.id}
                      className="p-1.5 bg-slate-950 border border-slate-800/90 rounded-md flex items-center justify-between hover:border-cyan-500/50 transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => togglePlayAudioPreview(track.url)}
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isPreviewPlaying 
                              ? 'bg-cyan-500 text-slate-950 font-black' 
                              : 'bg-cyan-950/60 text-cyan-400 hover:bg-cyan-800/80 hover:text-white'
                          }`}
                          title={isPreviewPlaying ? 'Pause' : 'Play'}
                        >
                          {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-200 truncate max-w-[130px]">{track.title}</p>
                          <p className="text-[9px] text-cyan-400 font-mono truncate max-w-[130px]">
                            {track.artist} • {track.duration}s
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddAudioToTimeline(track)}
                        className="p-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 rounded transition cursor-pointer font-bold"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sound Effects (SFX) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sound Effects (SFX)</h4>
              <div className="space-y-1">
                {sfxLibrary.map(sfx => {
                  const isPreviewPlaying = playingAudioUrl === sfx.url;
                  return (
                    <div
                      key={sfx.id}
                      className="p-1.5 bg-slate-950 border border-slate-800/90 rounded-md flex items-center justify-between hover:border-amber-500/50 transition group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => togglePlayAudioPreview(sfx.url)}
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition cursor-pointer ${
                            isPreviewPlaying 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : 'bg-amber-950/60 text-amber-400 hover:bg-amber-800/80 hover:text-white'
                          }`}
                          title={isPreviewPlaying ? 'Pause' : 'Play'}
                        >
                          {isPreviewPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-200 truncate max-w-[130px]">{sfx.title}</p>
                          <p className="text-[9px] text-amber-400 font-mono">{sfx.genre} • {sfx.duration}s</p>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddAudioToTimeline(sfx)}
                        className="p-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-slate-950 rounded transition cursor-pointer font-bold"
                        title="Add to Timeline"
                      >
                        <Plus className="w-3 h-3" />
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

        {/* ==================== WATERMARK & BRANDING TAB ==================== */}
        {activeTab === 'watermark' && (
          <div className="space-y-3">
            {/* Header / Master Switch */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${brandOverlayConfig?.enabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-500'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Brand Watermark</h4>
                    <p className="text-[10px] text-slate-400">Live overlay & export burn</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (setBrandOverlayConfig) {
                      setBrandOverlayConfig(prev => ({
                        ...prev,
                        enabled: !prev.enabled
                      }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    brandOverlayConfig?.enabled
                      ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  {brandOverlayConfig?.enabled ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {brandOverlayConfig?.enabled && (
                <div className="text-[10px] text-cyan-300/80 bg-cyan-950/30 border border-cyan-800/40 px-2 py-1 rounded">
                  Watermark is visible on preview and will burn into downloaded MP4.
                </div>
              )}
            </div>

            {/* Hidden Logo File Input */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = '';
              }}
            />

            {/* Custom Transparent Logo Uploader */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Custom Logo Upload</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">PNG / WEBP / SVG</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload your company or brand transparent logo to position across the video clips.
              </p>

              {brandOverlayConfig?.logoUrl ? (
                <div className="flex items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:8px_8px] bg-slate-950 border border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={brandOverlayConfig.logoUrl}
                      alt="Brand Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {brandOverlayConfig.brandText || 'Custom Logo'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">Ready for rendering</p>
                  </div>
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => logoFileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/50 text-cyan-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Transparent Logo</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Studio Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {WATERMARK_PRESETS.map(preset => {
                  const isSelected = brandOverlayConfig?.logoUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        if (setBrandOverlayConfig) {
                          setBrandOverlayConfig(prev => ({
                            ...prev,
                            enabled: true,
                            logoUrl: preset.url,
                            brandText: preset.text,
                            showBrandText: true
                          }));
                        }
                      }}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-6 h-6 rounded object-cover shrink-0 border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold truncate">{preset.name.split(' ')[0]}</p>
                        <p className="text-[9px] text-slate-500 truncate">{preset.text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position & Scale & Opacity */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              {/* Position */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300 block">Screen Placement</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'top-left', label: 'Top Left' },
                    { id: 'center', label: 'Center' },
                    { id: 'top-right', label: 'Top Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'bottom-right', label: 'Bottom Right' }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      onClick={() => {
                        if (setBrandOverlayConfig) {
                          setBrandOverlayConfig(prev => ({
                            ...prev,
                            position: pos.id as any
                          }));
                        }
                      }}
                      className={`py-1.5 px-2 rounded text-[10px] font-bold border transition cursor-pointer ${
                        (brandOverlayConfig?.position || 'top-right') === pos.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300 text-xs">
                  <span className="font-semibold text-[11px]">Opacity</span>
                  <span className="font-mono text-cyan-400 font-bold">{brandOverlayConfig?.opacityPercent ?? 85}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={brandOverlayConfig?.opacityPercent ?? 85}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (setBrandOverlayConfig) {
                      setBrandOverlayConfig(prev => ({ ...prev, opacityPercent: val }));
                    }
                  }}
                  className="w-full accent-cyan-400 h-1 bg-slate-900 rounded cursor-pointer"
                />
              </div>

              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-300 text-xs">
                  <span className="font-semibold text-[11px]">Scale Size</span>
                  <span className="font-mono text-cyan-400 font-bold">{brandOverlayConfig?.scalePercent ?? 25}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={brandOverlayConfig?.scalePercent ?? 25}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (setBrandOverlayConfig) {
                      setBrandOverlayConfig(prev => ({ ...prev, scalePercent: val }));
                    }
                  }}
                  className="w-full accent-cyan-400 h-1 bg-slate-900 rounded cursor-pointer"
                />
              </div>

              {/* Brand Text Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold">Brand Text</span>
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-cyan-400">
                    <input
                      type="checkbox"
                      checked={brandOverlayConfig?.showBrandText ?? true}
                      onChange={e => {
                        const checked = e.target.checked;
                        if (setBrandOverlayConfig) {
                          setBrandOverlayConfig(prev => ({ ...prev, showBrandText: checked }));
                        }
                      }}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Show Text</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="हाम्रोAI Studio..."
                  value={brandOverlayConfig?.brandText ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (setBrandOverlayConfig) {
                      setBrandOverlayConfig(prev => ({ ...prev, brandText: val }));
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Launch Full Modal */}
            {onOpenBrandWatermark && (
              <button
                onClick={onOpenBrandWatermark}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Advanced Watermark Studio</span>
              </button>
            )}
          </div>
        )}

        {/* ==================== CAPTIONS TAB ==================== */}
        {activeTab === 'captions' && (
          <div className="space-y-3">
            {/* Auto Generator Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Subtitles & Captions</span>
                </h4>
                <span className="px-1.5 py-0.2 bg-cyan-950/60 border border-cyan-800/60 text-[9px] text-cyan-300 font-mono rounded">
                  {subtitles?.length || 0} Lines
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronized Devanagari (नेपाली) & English captions overlaid on video.
              </p>

              {/* Subtitle Burn Switch */}
              {subtitleBurnOptions && setSubtitleBurnOptions && (
                <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-300">Burn into Video Output</span>
                  <button
                    onClick={() => {
                      setSubtitleBurnOptions(prev => ({
                        ...prev,
                        burnIn: !prev.burnIn
                      }));
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      subtitleBurnOptions.burnIn
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {subtitleBurnOptions.burnIn ? 'ENABLED' : 'OFF'}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if (onOpenSubtitleEditor) {
                    onOpenSubtitleEditor();
                  }
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-current" />
                <span>Open Full Subtitle Studio</span>
              </button>
            </div>

            {/* Subtitles Preview List */}
            {subtitles && subtitles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sequence Subtitles</span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
                  {subtitles.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="p-2 bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400">
                        <span>#{idx + 1} • {sub.startTimeSec.toFixed(1)}s - {sub.endTimeSec.toFixed(1)}s</span>
                      </div>
                      <p className="text-xs font-bold text-slate-100">{sub.devanagariText || sub.text}</p>
                      {sub.devanagariText && sub.text && sub.devanagariText !== sub.text && (
                        <p className="text-[10px] text-slate-400 italic">{sub.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Caption Adder for Active Clip */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">Active Clip Subtitle / Caption</h4>
                {selectedScene && (
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Clip #{scenes.findIndex(s => s.id === selectedScene.id) + 1}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Subtitle Text</label>
                <input
                  type="text"
                  placeholder="Type subtitle for active clip..."
                  value={selectedScene?.textOverlay || ''}
                  onChange={(e) => {
                    if (selectedScene && onUpdateScene) {
                      onUpdateScene(selectedScene.id, {
                        textOverlay: e.target.value
                      });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Subtitle Positioning Controls */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 block">Position on Screen</label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {selectedScene?.textCustomYPercent !== undefined
                      ? `${selectedScene.textCustomYPercent}% height`
                      : selectedScene?.textPosition || 'bottom (88%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'top', label: 'Top (12%)', y: 12 },
                    { id: 'center', label: 'Center (50%)', y: 50 },
                    { id: 'lower_third', label: 'Lower 3rd (74%)', y: 74 },
                    { id: 'bottom_lifted', label: 'Lifted (82%)', y: 82 },
                    { id: 'bottom', label: 'Bottom (88%)', y: 88 }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      onClick={() => {
                        if (selectedScene && onUpdateScene) {
                          onUpdateScene(selectedScene.id, {
                            textPosition: pos.id as any,
                            textCustomYPercent: pos.y
                          });
                        }
                        if (setSubtitleBurnOptions) {
                          setSubtitleBurnOptions(prev => ({
                            ...prev,
                            position: pos.id as any,
                            customYPercent: pos.y
                          }));
                        }
                      }}
                      className={`py-1 px-1.5 rounded text-[10px] font-medium border transition cursor-pointer text-center ${
                        (selectedScene?.textPosition || 'bottom') === pos.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>

                {/* Fine-tune vertical position slider */}
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Vertical Height Custom</span>
                    <span>5% (Top) — 95% (Bottom)</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={selectedScene?.textCustomYPercent ?? (selectedScene?.textPosition === 'top' ? 12 : selectedScene?.textPosition === 'center' ? 50 : selectedScene?.textPosition === 'lower_third' ? 74 : selectedScene?.textPosition === 'bottom_lifted' ? 82 : 88)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedScene && onUpdateScene) {
                        onUpdateScene(selectedScene.id, {
                          textCustomYPercent: val
                        });
                      }
                      if (setSubtitleBurnOptions) {
                        setSubtitleBurnOptions(prev => ({
                          ...prev,
                          customYPercent: val
                        }));
                      }
                    }}
                    className="w-full accent-cyan-400 h-1 bg-slate-900 rounded cursor-pointer"
                  />
                </div>
              </div>
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

      {/* 4. Media Preview Lightbox Modal */}
      {previewingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-[#0f1322] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0b0e19]">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  previewingItem.type === 'sora_video' || previewingItem.url.match(/\.(mp4|webm|mov)($|\?)/i)
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                }`}>
                  {previewingItem.type === 'sora_video' || previewingItem.url.match(/\.(mp4|webm|mov)($|\?)/i) ? 'SORA-2 VIDEO' : 'AI IMAGE'}
                </span>
                <h3 className="text-sm font-bold text-white truncate">{previewingItem.title}</h3>
              </div>
              <button
                onClick={() => setPreviewingItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Stage */}
            <div className="p-4 bg-black/70 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[50vh]">
              {previewingItem.type === 'sora_video' || previewingItem.url.match(/\.(mp4|webm|mov)($|\?)/i) ? (
                <video
                  src={previewingItem.url}
                  poster={previewingItem.thumbnailUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-w-full max-h-[46vh] rounded-lg shadow-2xl object-contain"
                />
              ) : (
                <img
                  src={previewingItem.thumbnailUrl || previewingItem.url}
                  alt={previewingItem.title}
                  className="max-w-full max-h-[46vh] rounded-lg shadow-2xl object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Modal Metadata & Prompt Details */}
            <div className="p-4 space-y-3 bg-[#0d101c] border-t border-slate-800/80 overflow-y-auto max-h-[30vh]">
              {/* Prompt Box */}
              {previewingItem.prompt && (
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Sparkles className="w-3 h-3" />
                      Generation Prompt
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(previewingItem.prompt || '');
                        setCopySuccess(true);
                        setTimeout(() => setCopySuccess(false), 2000);
                      }}
                      className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="italic text-slate-200">{previewingItem.prompt}</p>
                </div>
              )}

              {/* Technical Specifications */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {previewingItem.duration && (
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 font-mono">
                    Duration: {previewingItem.duration}s
                  </span>
                )}
                {previewingItem.aspectRatio && (
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-300 font-mono">
                    Aspect Ratio: {previewingItem.aspectRatio}
                  </span>
                )}
                {previewingItem.resolution && (
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-cyan-300 font-mono">
                    {previewingItem.resolution}
                  </span>
                )}
                {previewingItem.engine && (
                  <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-slate-400 font-mono">
                    Engine: {previewingItem.engine}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-4 py-3 bg-[#0a0c16] border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPreviewingItem(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedScene && onUpdateScene && (
                  <button
                    onClick={() => {
                      handleReplaceSelectedScene(previewingItem);
                      setPreviewingItem(null);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Replace Clip</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleAddMediaToTimeline(previewingItem);
                    setPreviewingItem(null);
                  }}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Timeline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
