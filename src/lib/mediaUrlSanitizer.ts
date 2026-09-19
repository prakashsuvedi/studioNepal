/**
 * Universal Media URL Sanitizer & Migrator
 * Automatically detects and remaps legacy external URLs (Google Cloud Storage, Freesound, R2, etc.)
 * into high-performance, locally cached, zero-latency streaming endpoints.
 */

const THEMATIC_SAMPLES = [
  { video: '/samples/everest_sunrise.mp4', thumb: '/samples/everest_sunrise_thumb.jpg', keywords: ['everest', 'mountain', 'himalaya', 'snow', 'peak', 'sunrise', 'diversity', 'nature', 'landscape'] },
  { video: '/samples/durbar_square.mp4', thumb: '/samples/durbar_square_thumb.jpg', keywords: ['durbar', 'temple', 'kathmandu', 'heritage', 'history', 'ancient', 'monument', 'stupa', 'buddha', 'culture'] },
  { video: '/samples/phewa_lake.mp4', thumb: '/samples/phewa_lake_thumb.jpg', keywords: ['lake', 'phewa', 'pokhara', 'water', 'boat', 'reflection', 'river', 'annapurna', 'peace', 'serene'] },
  { video: '/samples/ForBiggerJoyBlazes.mp4', thumb: '/samples/ForBiggerJoyBlazes_thumb.jpg', keywords: ['festival', 'dashain', 'tihar', 'holi', 'celebration', 'dance', 'people', 'joy', 'color', 'tradition'] },
  { video: '/samples/ForBiggerBlazes.mp4', thumb: '/samples/ForBiggerBlazes_thumb.jpg', keywords: ['forest', 'wildlife', 'jungle', 'rhino', 'tiger', 'chitwan', 'tree', 'green', 'animals'] },
  { video: '/samples/ForBiggerEscapes.mp4', thumb: '/samples/ForBiggerEscapes_thumb.jpg', keywords: ['travel', 'trek', 'adventure', 'road', 'journey', 'explore', 'valley', 'path', 'hike'] },
  { video: '/samples/ForBiggerFun.mp4', thumb: '/samples/ForBiggerFun_thumb.jpg', keywords: ['food', 'momo', 'city', 'community', 'market', 'friends', 'life'] },
  { video: '/samples/ForBiggerMeltdowns.mp4', thumb: '/samples/ForBiggerMeltdowns_thumb.jpg', keywords: ['glacier', 'ice', 'winter', 'storm', 'cold', 'clouds'] },
  { video: '/samples/TearsOfSteel.mp4', thumb: '/samples/TearsOfSteel_thumb.jpg', keywords: ['technology', 'modern', 'future', 'robot', 'digital', 'science'] },
];

export function getFallbackMediaForScene(title?: string, prompt?: string, id?: string): { video: string; thumb: string } {
  const combined = `${title || ''} ${prompt || ''}`.toLowerCase();
  for (const sample of THEMATIC_SAMPLES) {
    if (sample.keywords.some(k => combined.includes(k))) {
      return { video: sample.video, thumb: sample.thumb };
    }
  }
  let hash = 0;
  const key = id || title || 'default_scene';
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const chosen = THEMATIC_SAMPLES[hash % THEMATIC_SAMPLES.length];
  return { video: chosen.video, thumb: chosen.thumb };
}

export function sanitizeMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. Cloudflare R2 Remote Bucket Remapping
  // Converts inaccessible / unroutable external R2 links directly to high-speed local streaming proxy
  if (trimmed.includes('.r2.dev') || trimmed.includes('r2.cloudflarestorage.com')) {
    if (trimmed.includes('/api/storage/file/')) {
      const filename = trimmed.split('/api/storage/file/')[1]?.split('?')[0];
      if (filename) return `/api/storage/file/${encodeURIComponent(filename)}`;
    }
    // Extract base filename from R2 path
    const parts = trimmed.split('/');
    const lastPart = parts[parts.length - 1]?.split('?')[0];
    if (lastPart) {
      return `/api/storage/file/${encodeURIComponent(lastPart)}`;
    }
  }

  // 2. Sora or direct video filename without route prefix
  if ((trimmed.startsWith('sora_') || trimmed.startsWith('video_')) && trimmed.endsWith('.mp4')) {
    return `/api/storage/file/${encodeURIComponent(trimmed)}`;
  }

  // 3. Google Cloud Storage Video Sample Remapping
  if (trimmed.includes('commondatastorage.googleapis.com') || trimmed.includes('gtv-videos-bucket')) {
    if (trimmed.includes('ForBiggerBlazes')) return '/samples/ForBiggerBlazes.mp4';
    if (trimmed.includes('ForBiggerJoyBlazes')) return '/samples/ForBiggerJoyBlazes.mp4';
    if (trimmed.includes('ForBiggerEscapes')) return '/samples/ForBiggerEscapes.mp4';
    if (trimmed.includes('ForBiggerFun')) return '/samples/ForBiggerFun.mp4';
    if (trimmed.includes('ForBiggerMeltdowns')) return '/samples/ForBiggerMeltdowns.mp4';
    if (trimmed.includes('TearsOfSteel')) return '/samples/TearsOfSteel.mp4';
    return '/samples/everest_sunrise.mp4';
  }

  // 4. Freesound.org Audio Remapping
  if (trimmed.includes('freesound.org')) {
    if (trimmed.includes('608645') || trimmed.includes('612887')) return '/audio/sfx_whoosh.mp3';
    if (trimmed.includes('568779') || trimmed.includes('518296')) return '/audio/sfx_bell.mp3';
    if (trimmed.includes('518290')) return '/audio/sfx_wind.mp3';
    if (trimmed.includes('522247')) return '/audio/sfx_flute.mp3';
    if (trimmed.includes('443806')) return '/audio/sfx_impact.mp3';
    if (trimmed.includes('387232')) return '/audio/sfx_camera.mp3';
    if (trimmed.includes('536422')) return '/audio/sfx_pop.mp3';
    return '/audio/sfx_whoosh.mp3';
  }

  // 5. Ensure local relative paths have leading slash
  if (trimmed.startsWith('samples/')) return `/${trimmed}`;
  if (trimmed.startsWith('audio/')) return `/${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `/${trimmed}`;
  if (trimmed.startsWith('renders/')) return `/${trimmed}`;

  return trimmed;
}

export function sanitizeScene(scene: any): any {
  if (!scene) return scene;
  let sanitizedMediaUrl = sanitizeMediaUrl(scene.mediaUrl);
  let sanitizedThumbUrl = scene.thumbnailUrl ? sanitizeMediaUrl(scene.thumbnailUrl) : undefined;

  // Guarantee that every scene has a visual asset for timeline playback
  if (!sanitizedMediaUrl || sanitizedMediaUrl.trim() === '') {
    const fallback = getFallbackMediaForScene(scene.title, scene.prompt || scene.promptNepali, scene.id);
    sanitizedMediaUrl = fallback.video;
    if (!sanitizedThumbUrl) {
      sanitizedThumbUrl = fallback.thumb;
    }
  }

  return {
    ...scene,
    mediaUrl: sanitizedMediaUrl,
    thumbnailUrl: sanitizedThumbUrl || scene.thumbnailUrl,
  };
}

export function sanitizeScenes(scenes: any[]): any[] {
  if (!Array.isArray(scenes)) return [];
  return scenes.map(sanitizeScene);
}

/**
 * Automatically inspects and purges legacy/broken URLs from localStorage and sessionStorage
 */
export function purgeLegacyStorageUrls(): void {
  try {
    const keysToCheck = [
      'nepalai_video_project_autosave',
      'nepalai_media_library_v1',
      'nepalai_render_queue',
      'nepalai_saved_avatars',
    ];

    keysToCheck.forEach((key) => {
      // LocalStorage
      const localRaw = localStorage.getItem(key);
      if (localRaw && (localRaw.includes('commondatastorage.googleapis.com') || localRaw.includes('freesound.org') || localRaw.includes('r2.dev'))) {
        try {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((item) => {
              if (item.url) item.url = sanitizeMediaUrl(item.url);
              if (item.mediaUrl) item.mediaUrl = sanitizeMediaUrl(item.mediaUrl);
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.scenes)) {
              parsed.scenes = sanitizeScenes(parsed.scenes);
            }
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        } catch {}
      }

      // SessionStorage
      const sessionRaw = sessionStorage.getItem(key);
      if (sessionRaw && (sessionRaw.includes('commondatastorage.googleapis.com') || sessionRaw.includes('freesound.org') || sessionRaw.includes('r2.dev'))) {
        try {
          const parsed = JSON.parse(sessionRaw);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((item) => {
              if (item.url) item.url = sanitizeMediaUrl(item.url);
              if (item.mediaUrl) item.mediaUrl = sanitizeMediaUrl(item.mediaUrl);
              return item;
            });
            sessionStorage.setItem(key, JSON.stringify(updated));
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.scenes)) {
              parsed.scenes = sanitizeScenes(parsed.scenes);
            }
            sessionStorage.setItem(key, JSON.stringify(parsed));
          }
        } catch {}
      }
    });
  } catch (err) {
    console.warn('[MediaSanitizer] Storage migration notice:', err);
  }
}
