/**
 * Universal Media URL Sanitizer & Migrator
 * Automatically detects and remaps legacy external URLs (Google Cloud Storage, Freesound, etc.)
 * into high-performance, locally cached, zero-latency streaming endpoints.
 */

export function sanitizeMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. Google Cloud Storage Video Sample Remapping
  if (trimmed.includes('commondatastorage.googleapis.com') || trimmed.includes('gtv-videos-bucket')) {
    if (trimmed.includes('ForBiggerBlazes')) return '/samples/ForBiggerBlazes.mp4';
    if (trimmed.includes('ForBiggerJoyBlazes')) return '/samples/ForBiggerJoyBlazes.mp4';
    if (trimmed.includes('ForBiggerEscapes')) return '/samples/ForBiggerEscapes.mp4';
    if (trimmed.includes('ForBiggerFun')) return '/samples/ForBiggerFun.mp4';
    if (trimmed.includes('ForBiggerMeltdowns')) return '/samples/ForBiggerMeltdowns.mp4';
    if (trimmed.includes('TearsOfSteel')) return '/samples/TearsOfSteel.mp4';
    return '/samples/everest_sunrise.mp4';
  }

  // 2. Freesound.org Audio Remapping
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

  return trimmed;
}

export function sanitizeScene(scene: any): any {
  if (!scene) return scene;
  return {
    ...scene,
    mediaUrl: sanitizeMediaUrl(scene.mediaUrl),
    thumbnailUrl: scene.thumbnailUrl ? sanitizeMediaUrl(scene.thumbnailUrl) : scene.thumbnailUrl,
  };
}

export function sanitizeScenes(scenes: any[]): any[] {
  if (!Array.isArray(scenes)) return [];
  return scenes.map(sanitizeScene);
}

/**
 * Automatically inspects and purges legacy URLs from localStorage and sessionStorage
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
      if (localRaw && (localRaw.includes('commondatastorage.googleapis.com') || localRaw.includes('freesound.org'))) {
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
      if (sessionRaw && (sessionRaw.includes('commondatastorage.googleapis.com') || sessionRaw.includes('freesound.org'))) {
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
