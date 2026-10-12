import JSZip from 'jszip';
import { Scene, AudioTrack, SceneComment } from '../types';

export interface ZipExportProgress {
  message: string;
  percent: number;
  currentAsset?: string;
}

export interface ZipExportOptions {
  projectTitle?: string;
  aspectRatio?: string;
  comments?: SceneComment[];
  onProgress?: (progress: ZipExportProgress) => void;
}

export interface ZipExportResult {
  success: boolean;
  filename: string;
  sizeBytes: number;
  assetCount: number;
}

/**
 * Helper to fetch any asset URL as an ArrayBuffer, handling data URIs, blob URIs,
 * relative paths, and CORS-proxy fallbacks.
 */
async function fetchAssetBuffer(url: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  if (!url) return null;

  try {
    // 1. Data URLs (e.g. data:image/png;base64,...)
    if (url.startsWith('data:')) {
      const parts = url.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const binaryStr = atob(parts[1]);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return { buffer: bytes.buffer, contentType: mime };
    }

    // 2. Direct fetch (handles blob URLs, relative paths like /samples/..., and same-origin URLs)
    const directRes = await fetch(url).catch(() => null);
    if (directRes && directRes.ok) {
      const buffer = await directRes.arrayBuffer();
      const contentType = directRes.headers.get('content-type') || 'application/octet-stream';
      return { buffer, contentType };
    }

    // 3. Fallback via server media proxy for external domains with strict CORS
    const proxyUrl = `/api/proxy/media?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl).catch(() => null);
    if (proxyRes && proxyRes.ok) {
      const buffer = await proxyRes.arrayBuffer();
      const contentType = proxyRes.headers.get('content-type') || 'application/octet-stream';
      return { buffer, contentType };
    }
  } catch (err) {
    console.warn('[ZipExport] Asset fetch notice:', url, err);
  }

  return null;
}

/**
 * Generates an SRT subtitle file string from scene text overlays
 */
function generateSubtitlesSrt(scenes: Scene[]): string {
  let srtContent = '';
  let index = 1;
  let runningTime = 0;

  for (const scene of scenes) {
    const text = (scene.textOverlay || scene.devanagariSubtitle || '').trim();
    const duration = scene.duration || 4;
    const start = runningTime;
    const end = runningTime + duration;
    runningTime += duration;

    if (!text) continue;

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    srtContent += `${index}\n`;
    srtContent += `${formatSrtTime(start)} --> ${formatSrtTime(end)}\n`;
    srtContent += `${text}\n\n`;
    index++;
  }

  return srtContent;
}

/**
 * Packages all scene visuals, audio tracks, comments, and project manifests
 * into a single compressed .ZIP backup archive and triggers browser download.
 */
export async function exportProjectAssetsToZip(
  scenes: Scene[],
  audioTracks: AudioTrack[] = [],
  options: ZipExportOptions = {}
): Promise<ZipExportResult> {
  const {
    projectTitle = 'NepalAI_Project',
    aspectRatio = '16:9',
    comments = [],
    onProgress
  } = options;

  const zip = new JSZip();
  const safeTitle = projectTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_') || 'NepalAI_Project';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipFilename = `${safeTitle}_Backup_${timestamp}.zip`;

  onProgress?.({ message: 'Initializing project archive structure...', percent: 5 });

  // 1. Gather all comments across individual scenes and project level
  const allComments: SceneComment[] = [...comments];
  scenes.forEach(s => {
    if (s.comments && Array.isArray(s.comments)) {
      s.comments.forEach(c => {
        if (!allComments.some(existing => existing.id === c.id)) {
          allComments.push(c);
        }
      });
    }
  });

  // 2. Project Manifest
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 0), 0);
  const manifest = {
    platform: 'NepalAI Studio CapCut Pro',
    exportedAt: new Date().toISOString(),
    project: {
      title: projectTitle,
      aspectRatio,
      totalDuration,
      sceneCount: scenes.length,
      audioTrackCount: audioTracks.length,
      commentsCount: allComments.length,
    },
    scenes: scenes.map((s, idx) => ({
      sequenceIndex: idx + 1,
      id: s.id,
      title: s.title,
      duration: s.duration,
      mediaType: s.mediaType,
      aspectRatio: s.aspectRatio,
      prompt: s.prompt,
      textOverlay: s.textOverlay,
      transition: s.transition,
      filter: s.filter,
      volume: s.volume,
      comments: s.comments || [],
    })),
    audioTracks: audioTracks.map((a, idx) => ({
      trackIndex: idx + 1,
      id: a.id,
      title: a.title,
      type: a.type,
      duration: a.duration,
      volume: a.volume,
      startTime: a.startTime,
    })),
    teamFeedback: allComments,
  };

  zip.file('project_manifest.json', JSON.stringify(manifest, null, 2));

  // 3. Metadata Folder: Subtitles and Team Feedback
  const metaFolder = zip.folder('metadata');
  if (metaFolder) {
    metaFolder.file('team_feedback_comments.json', JSON.stringify(allComments, null, 2));

    const srtText = generateSubtitlesSrt(scenes);
    if (srtText) {
      metaFolder.file('subtitles.srt', srtText);
    }

    // Human-readable summary
    const summaryText = `========================================
NEPALAI STUDIO - PROJECT ASSET BACKUP
========================================
Project Name: ${projectTitle}
Aspect Ratio: ${aspectRatio}
Duration: ${totalDuration.toFixed(1)}s
Scenes: ${scenes.length}
Audio Tracks: ${audioTracks.length}
Team Comments: ${allComments.length}
Backup Created: ${new Date().toLocaleString()}

SCENE OVERVIEW:
${scenes.map((s, i) => `${i + 1}. [${s.mediaType.toUpperCase()}] "${s.title}" (${s.duration}s) - ${s.textOverlay ? `Subtitle: "${s.textOverlay}"` : 'No text overlay'}`).join('\n')}

AUDIO TRACKS:
${audioTracks.map((a, i) => `${i + 1}. [${a.type.toUpperCase()}] "${a.title}" (${a.duration}s, vol: ${Math.round((a.volume ?? 1) * 100)}%)`).join('\n')}

FEEDBACK & TIMESTAMPS:
${allComments.length > 0 ? allComments.map(c => `• [${c.timeFormatted || `${c.timestamp.toFixed(1)}s`}] ${c.author}: "${c.text}" (${c.resolved ? 'RESOLVED' : 'OPEN'})`).join('\n') : 'No team comments logged.'}
`;
    metaFolder.file('README_BACKUP_SUMMARY.txt', summaryText);
  }

  // 4. Visual Scenes Folder
  const scenesFolder = zip.folder('scenes');
  const totalAssets = scenes.length + audioTracks.length;
  let processedCount = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const seq = String(i + 1).padStart(2, '0');
    const safeSceneTitle = (scene.title || `clip_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const defaultExt = scene.mediaType === 'image' ? 'png' : 'mp4';

    onProgress?.({
      message: `Packaging scene ${i + 1}/${scenes.length}: ${scene.title}...`,
      percent: 10 + Math.round((processedCount / (totalAssets || 1)) * 70),
      currentAsset: scene.title,
    });

    if (scene.mediaUrl) {
      const asset = await fetchAssetBuffer(scene.mediaUrl);
      if (asset && scenesFolder) {
        let ext = defaultExt;
        if (asset.contentType.includes('image/jpeg')) ext = 'jpg';
        else if (asset.contentType.includes('image/webp')) ext = 'webp';
        else if (asset.contentType.includes('video/webm')) ext = 'webm';
        else if (asset.contentType.includes('video/quicktime')) ext = 'mov';

        const filename = `scene_${seq}_${safeSceneTitle}.${ext}`;
        scenesFolder.file(filename, asset.buffer);
      }
    }
    processedCount++;
  }

  // 5. Audio Tracks Folder
  const audioFolder = zip.folder('audio');
  for (let i = 0; i < audioTracks.length; i++) {
    const track = audioTracks[i];
    const seq = String(i + 1).padStart(2, '0');
    const safeTrackTitle = (track.title || track.type || `track_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');

    onProgress?.({
      message: `Packaging audio track ${i + 1}/${audioTracks.length}: ${track.title}...`,
      percent: 10 + Math.round((processedCount / (totalAssets || 1)) * 70),
      currentAsset: track.title,
    });

    if (track.url) {
      const asset = await fetchAssetBuffer(track.url);
      if (asset && audioFolder) {
        let ext = 'mp3';
        if (asset.contentType.includes('wav')) ext = 'wav';
        else if (asset.contentType.includes('ogg')) ext = 'ogg';

        const filename = `audio_${seq}_${track.type || 'track'}_${safeTrackTitle}.${ext}`;
        audioFolder.file(filename, asset.buffer);
      }
    }
    processedCount++;
  }

  // 6. Final Compression & Browser Download
  onProgress?.({ message: 'Compressing archive into high-density ZIP...', percent: 88 });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        message: `Compressing package: ${Math.round(metadata.percent)}%`,
        percent: 88 + Math.round(metadata.percent * 0.1),
      });
    }
  );

  onProgress?.({ message: 'Archive ready. Triggering download...', percent: 100 });

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return {
    success: true,
    filename: zipFilename,
    sizeBytes: zipBlob.size,
    assetCount: processedCount,
  };
}
