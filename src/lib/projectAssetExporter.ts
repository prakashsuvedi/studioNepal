import JSZip from 'jszip';
import { Scene, AudioTrack } from '../types';

export interface ExportZipProgress {
  step: string;
  current: number;
  total: number;
  percent: number;
}

/**
 * Packages all scene video/image assets, voiceover audio clips,
 * Himalayan background soundtrack tracks, EDL and team feedback comments
 * into a single compressed ZIP archive for external backup.
 */
export async function exportProjectAssetsToZip(
  projectTitle: string,
  scenes: Scene[],
  audioTracks: AudioTrack[] = [],
  aspectRatio: string = '16:9',
  onProgress?: (progress: ExportZipProgress) => void
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  const safeTitle = (projectTitle || 'nepalai_project').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

  // 1. Project Manifest JSON
  const manifest = {
    generator: 'NepalAI Studio Asset Exporter v2.0',
    projectTitle: projectTitle || 'Untitled Project',
    exportedAt: new Date().toISOString(),
    aspectRatio,
    totalScenes: scenes.length,
    totalAudioTracks: audioTracks.length,
    scenes: scenes.map((s, idx) => ({
      index: idx + 1,
      id: s.id,
      title: s.title || `Scene ${idx + 1}`,
      description: s.description || '',
      prompt: s.prompt || '',
      duration: s.duration || 4,
      transition: s.transition || 'cut',
      transitionDuration: s.transitionDuration || 0.5,
      comments: s.comments || [],
      aspectRatio: s.aspectRatio || aspectRatio,
      speed: s.speed || s.playbackRate || 1,
      hasMedia: Boolean(s.mediaUrl),
      hasAudio: Boolean(s.audioUrl),
      filter: s.filter || 'normal',
      zoomEffect: s.zoomEffect || 'none',
    })),
    audioTracks: audioTracks.map((a, idx) => ({
      index: idx + 1,
      id: a.id,
      title: a.title,
      type: a.type || 'bgm',
      duration: a.duration,
      volume: a.volume,
      startTime: a.startTime || 0,
    })),
  };
  zip.file('project_manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Comprehensive External Backup README
  const readmeContent = `NepalAI Studio - Offline Project Assets Backup Archive
======================================================
Project Title : ${projectTitle || 'Untitled Project'}
Export Date   : ${new Date().toLocaleString()}
Scene Clips   : ${scenes.length}
Audio Tracks  : ${audioTracks.length}
Target Aspect : ${aspectRatio}

FOLDER STRUCTURE:
-----------------
/scenes/       : Production scene footage and high-resolution still frames
/audio/        : Neural voiceover recordings, Himalayan soundtrack tracks, and sound effects
/metadata/     : Team scene feedback review notes and EDL clip timings
project_manifest.json : Complete project timeline data ready for NepalAI Studio re-import

IMPORT & COMPATIBILITY:
-----------------------
- You can re-import this project into NepalAI Studio anytime via "Import Project JSON"
- Scene assets are organized chronologically (scene_01, scene_02, etc.) for direct drag-and-drop into Adobe Premiere Pro, DaVinci Resolve, CapCut, or Final Cut Pro.
- Watermark-free production assets generated on NepalAI Studio (https://nepalai.tech).
`;
  zip.file('README.txt', readmeContent);

  // 3. Team Comments & Feedback Review Notes
  const allComments: Array<{
    sceneIndex: number;
    sceneTitle: string;
    commentId: string;
    author: string;
    role: string;
    text: string;
    timestampSec: number;
    timelineTimeSec: number;
    resolved: boolean;
    createdAt: string;
  }> = [];

  let runningTime = 0;
  scenes.forEach((s, idx) => {
    const sDur = s.duration || 4;
    if (s.comments && Array.isArray(s.comments) && s.comments.length > 0) {
      s.comments.forEach(c => {
        allComments.push({
          sceneIndex: idx + 1,
          sceneTitle: s.title || `Scene ${idx + 1}`,
          commentId: c.id,
          author: c.author,
          role: c.role || 'Reviewer',
          text: c.text,
          timestampSec: c.timestamp,
          timelineTimeSec: c.timelineTime ?? (runningTime + c.timestamp),
          resolved: Boolean(c.resolved),
          createdAt: c.createdAt || new Date().toISOString(),
        });
      });
    }
    runningTime += sDur;
  });

  if (allComments.length > 0) {
    zip.file('metadata/team_timeline_comments.json', JSON.stringify(allComments, null, 2));
    
    // Human-readable summary
    const commentsTxt = allComments
      .map(
        c =>
          `[Scene ${c.sceneIndex}: ${c.sceneTitle} @ ${c.timestampSec.toFixed(1)}s] ${c.author} (${c.role}): "${c.text}" [${c.resolved ? 'RESOLVED' : 'OPEN'}]`
      )
      .join('\n');
    zip.file('metadata/team_timeline_comments.txt', commentsTxt);
  }

  // 4. Download and bundle media assets
  const scenesFolder = zip.folder('scenes');
  const audioFolder = zip.folder('audio');

  const totalTasks = Math.max(1, scenes.length + audioTracks.length);
  let completedTasks = 0;

  // Process scene media files
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const cleanName = `scene_${String(i + 1).padStart(2, '0')}_${(s.title || 'clip').replace(/[^a-z0-9_-]/gi, '_').substring(0, 30)}`;

    if (onProgress) {
      onProgress({
        step: `Archiving scene ${i + 1}/${scenes.length}: ${s.title || 'Clip'}...`,
        current: completedTasks,
        total: totalTasks,
        percent: Math.min(90, Math.round((completedTasks / totalTasks) * 90)),
      });
    }

    if (s.mediaUrl) {
      try {
        if (s.mediaUrl.startsWith('data:')) {
          const parts = s.mediaUrl.split(',');
          const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/png';
          const ext = mime.includes('video') ? 'mp4' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          scenesFolder?.file(`${cleanName}.${ext}`, u8arr);
        } else {
          const res = await fetch(s.mediaUrl);
          if (res.ok) {
            const blob = await res.blob();
            const ext = blob.type.includes('video') ? 'mp4' : blob.type.includes('jpeg') ? 'jpg' : 'png';
            scenesFolder?.file(`${cleanName}.${ext}`, blob);
          } else {
            scenesFolder?.file(`${cleanName}_source_url.txt`, `Source Asset URL: ${s.mediaUrl}`);
          }
        }
      } catch (err) {
        console.warn(`Could not fetch media for scene ${i + 1}:`, err);
        scenesFolder?.file(`${cleanName}_source_url.txt`, `Source Asset URL: ${s.mediaUrl}`);
      }
    }

    // Process scene voiceover audio
    if (s.audioUrl) {
      try {
        if (s.audioUrl.startsWith('data:')) {
          const parts = s.audioUrl.split(',');
          const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'audio/wav';
          const ext = mime.includes('mp3') ? 'mp3' : 'wav';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          audioFolder?.file(`${cleanName}_voiceover.${ext}`, u8arr);
        } else {
          const res = await fetch(s.audioUrl);
          if (res.ok) {
            const blob = await res.blob();
            const ext = blob.type.includes('mp3') ? 'mp3' : 'wav';
            audioFolder?.file(`${cleanName}_voiceover.${ext}`, blob);
          }
        }
      } catch (err) {
        console.warn(`Could not fetch voiceover for scene ${i + 1}:`, err);
      }
    }

    completedTasks++;
  }

  // Process timeline audio tracks (BGM / SFX)
  for (let j = 0; j < audioTracks.length; j++) {
    const track = audioTracks[j];
    const trackName = `track_${String(j + 1).padStart(2, '0')}_${(track.title || track.type || 'audio').replace(/[^a-z0-9_-]/gi, '_').substring(0, 30)}`;

    if (onProgress) {
      onProgress({
        step: `Archiving soundtrack ${j + 1}/${audioTracks.length}: ${track.title || 'Audio'}...`,
        current: completedTasks,
        total: totalTasks,
        percent: Math.min(90, Math.round((completedTasks / totalTasks) * 90)),
      });
    }

    if (track.url) {
      try {
        if (track.url.startsWith('data:')) {
          const parts = track.url.split(',');
          const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'audio/mp3';
          const ext = mime.includes('wav') ? 'wav' : 'mp3';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          audioFolder?.file(`${trackName}.${ext}`, u8arr);
        } else {
          const res = await fetch(track.url);
          if (res.ok) {
            const blob = await res.blob();
            const ext = blob.type.includes('wav') ? 'wav' : 'mp3';
            audioFolder?.file(`${trackName}.${ext}`, blob);
          }
        }
      } catch (err) {
        console.warn(`Could not fetch soundtrack ${j + 1}:`, err);
      }
    }

    completedTasks++;
  }

  if (onProgress) {
    onProgress({
      step: 'Compressing archive with DEFLATE stream...',
      current: totalTasks,
      total: totalTasks,
      percent: 95,
    });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  if (onProgress) {
    onProgress({
      step: 'Backup archive ready for download!',
      current: totalTasks,
      total: totalTasks,
      percent: 100,
    });
  }

  const filename = `${safeTitle}_assets_backup_${new Date().toISOString().slice(0, 10)}.zip`;
  return { blob: zipBlob, filename };
}
