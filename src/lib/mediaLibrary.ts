export interface MediaItem {
  id: string;
  type: 'sora_video' | 'ai_image' | 'upload' | 'ai_audio';
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  createdAt: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  prompt?: string;
  resolution?: string;
  engine?: string;
}

export const DEFAULT_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'sample-sora-1',
    type: 'sora_video',
    title: 'Himalayan Sunrise Golden Peak 4K',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
    duration: 6,
    category: 'Sora-2 AI Video',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 2,
    prompt: 'Cinematic golden hour aerial drone flight over snowy Himalayan mountain range with warm morning light',
    engine: 'Azure Sora-2'
  },
  {
    id: 'sample-sora-2',
    type: 'sora_video',
    title: 'Kathmandu Heritage Durbar Square',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=800&auto=format&fit=crop',
    duration: 5,
    category: 'Sora-2 AI Video',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 3,
    prompt: 'Hyper-lapse moving shot through historical Newari brick architecture and ancient temple courtyards',
    engine: 'Azure Sora-2'
  },
  {
    id: 'sample-sora-3',
    type: 'sora_video',
    title: 'Phewa Lake Calm Reflections (9:16 Reel)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    duration: 6,
    category: 'Sora-2 AI Video',
    aspectRatio: '9:16',
    createdAt: Date.now() - 3600000 * 4,
    prompt: 'Vertical 9:16 ultra HD boat gliding on crystal mountain lake with vibrant colorful boats',
    engine: 'Azure Sora-2'
  },
  {
    id: 'sample-img-1',
    type: 'ai_image',
    title: 'Pashmina Craft Artisan Portrait',
    url: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=600&auto=format&fit=crop',
    duration: 4,
    category: 'Azure AI Image',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 5,
    prompt: 'Traditional artisan hand-weaving fine cashmere silk shawl in Kathmandu studio, warm cinematic lighting',
    engine: 'Azure gpt-image-1.5'
  },
  {
    id: 'sample-img-2',
    type: 'ai_image',
    title: 'Everest Basecamp Sunset Glow',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
    duration: 4,
    category: 'Azure AI Image',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 6,
    prompt: 'Majestic view of Mount Everest summit bathed in orange-purple sunset gradient with alpine glow',
    engine: 'FLUX.1 Schnell'
  },
  {
    id: 'sample-img-3',
    type: 'ai_image',
    title: 'Cyberpunk Cyber-Kathmandu 2077',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    duration: 4,
    category: 'Azure AI Image',
    aspectRatio: '16:9',
    createdAt: Date.now() - 3600000 * 8,
    prompt: 'Futuristic neon temple streets with holographic prayer flags and flying transport vehicles',
    engine: 'Azure gpt-image-1.5'
  },
  {
    id: 'sample-upload-1',
    type: 'upload',
    title: 'NepalAI Studio Official Brand Logo',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
    duration: 3,
    category: 'Uploads',
    aspectRatio: '1:1',
    createdAt: Date.now() - 3600000 * 12,
    prompt: 'High resolution transparent brand watermark logo asset'
  }
];

const STORAGE_KEY = 'nepalai_generated_media_library_v2';

/**
 * Retrieve all user generated assets + uploads + default presets
 */
export function getMediaLibrary(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MEDIA_ITEMS));
      return DEFAULT_MEDIA_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse media library from localStorage', e);
  }
  return DEFAULT_MEDIA_ITEMS;
}

/**
 * Save or prepend a new generated asset / upload to the media library
 */
export function saveMediaItem(item: {
  type: 'sora_video' | 'ai_image' | 'upload' | 'ai_audio';
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  category?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
  prompt?: string;
  resolution?: string;
  engine?: string;
}): MediaItem {
  const current = getMediaLibrary();
  
  const newItem: MediaItem = {
    id: 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    type: item.type,
    title: item.title || (item.type === 'sora_video' ? 'Generated Sora Video' : item.type === 'ai_image' ? 'Generated AI Image' : 'Uploaded Asset'),
    url: item.url,
    thumbnailUrl: item.thumbnailUrl || (item.type === 'ai_image' ? item.url : undefined),
    duration: item.duration || (item.type === 'sora_video' ? 5 : 4),
    category: item.category || (item.type === 'sora_video' ? 'Sora-2 AI Video' : item.type === 'ai_image' ? 'AI Image' : item.type === 'ai_audio' ? 'AI Voiceover' : 'User Upload'),
    createdAt: Date.now(),
    aspectRatio: item.aspectRatio || '16:9',
    prompt: item.prompt,
    resolution: item.resolution,
    engine: item.engine
  };

  // Prevent duplicate exact URLs at the top
  const filtered = current.filter(i => i.url !== newItem.url);
  const updated = [newItem, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a custom event so open components instantly react to newly generated media
    window.dispatchEvent(new CustomEvent('nepalai_media_library_updated', { detail: newItem }));
  } catch (e) {
    console.warn('Failed to save item to media library storage', e);
  }

  return newItem;
}

/**
 * Delete an item from the media library
 */
export function removeMediaItem(id: string): MediaItem[] {
  const current = getMediaLibrary();
  const updated = current.filter(i => i.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nepalai_media_library_updated'));
  } catch (e) {}
  return updated;
}

export const getStoredMedia = getMediaLibrary;
export const deleteMediaItem = removeMediaItem;

