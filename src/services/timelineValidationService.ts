import { Scene, AudioTrack, TimelineValidationReport } from '../types';

export interface PreRenderValidationOptions {
  scenes: Scene[];
  audioTracks: AudioTrack[];
  targetDuration?: number; // Target requested output duration in seconds
  brandLogoUrl?: string;
}

/**
 * Timeline Validation Service
 * Verifies all media assets, audio tracks, transitions, and kinetic text parameters
 * match the requested output duration before initiating final video rendering.
 */
export function validateTimelineBeforeRender(options: PreRenderValidationOptions): TimelineValidationReport {
  const { scenes, audioTracks, targetDuration, brandLogoUrl } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  const missingAssets: string[] = [];

  // Calculate actual total duration of all scenes
  const actualDuration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);
  const target = targetDuration || actualDuration;

  // 1. Duration Verification
  const durationDiff = Math.abs(actualDuration - target);
  let durationMatch = true;

  if (durationDiff > 0.05) {
    durationMatch = false;
    if (actualDuration < target) {
      warnings.push(
        `Timeline duration (${actualDuration.toFixed(1)}s) is shorter than target requested duration (${target.toFixed(1)}s). ${
          (target - actualDuration).toFixed(1)
        }s black padding will be appended.`
      );
    } else {
      warnings.push(
        `Timeline duration (${actualDuration.toFixed(1)}s) exceeds target requested duration (${target.toFixed(1)}s). Scenes after ${target.toFixed(
          1
        )}s will be clipped.`
      );
    }
  }

  if (scenes.length === 0) {
    errors.push('Timeline contains no scenes. Please add at least one scene before rendering.');
  }

  // 2. Asset & Media Validation
  let totalAssetsCount = 0;

  scenes.forEach((scene, idx) => {
    totalAssetsCount++;
    if (!scene.mediaUrl || scene.mediaUrl.trim() === '') {
      errors.push(`Scene #${idx + 1} ("${scene.title}") is missing a valid video or image asset.`);
      missingAssets.push(`Scene #${idx + 1} media asset`);
    } else if (!scene.mediaUrl.startsWith('http') && !scene.mediaUrl.startsWith('data:') && !scene.mediaUrl.startsWith('/')) {
      warnings.push(`Scene #${idx + 1} media URL may be invalid or unresolvable: ${scene.mediaUrl.substring(0, 30)}...`);
    }

    // Check transition duration sanity
    if (scene.transition && (scene.transition as string) !== 'none') {
      const transDur = scene.transitionDuration || 0.8;
      if (transDur >= scene.duration) {
        errors.push(
          `Scene #${idx + 1} transition duration (${transDur}s) is equal to or longer than scene duration (${scene.duration}s). Reduce transition time.`
        );
      }
    }

    // Check watermark asset validity
    if (scene.watermark?.url) {
      totalAssetsCount++;
      if (!scene.watermark.url.startsWith('http') && !scene.watermark.url.startsWith('data:') && !scene.watermark.url.startsWith('/')) {
        warnings.push(`Scene #${idx + 1} watermark image URL might be broken.`);
      }
    }

    // Check kinetic typography parameters
    if (scene.kineticConfig) {
      if (!scene.kineticConfig.primaryText && !scene.textOverlay) {
        warnings.push(`Scene #${idx + 1} kinetic typography enabled but primary text is empty.`);
      }
      if (scene.kineticConfig.fontSize <= 0) {
        errors.push(`Scene #${idx + 1} kinetic typography has invalid font size (${scene.kineticConfig.fontSize}px).`);
      }
    }
  });

  // Check global brand logo asset
  if (brandLogoUrl) {
    totalAssetsCount++;
  }

  // 3. Audio Tracks Verification
  let audioOverrun = false;
  const maxAudioEndTime = audioTracks.reduce((max, track) => {
    const end = (track.startTime || 0) + (track.duration || 0);
    return Math.max(max, end);
  }, 0);

  if (maxAudioEndTime > actualDuration + 1.0) {
    audioOverrun = true;
    warnings.push(
      `Audio track extends past scene timeline by ${(maxAudioEndTime - actualDuration).toFixed(1)}s. Audio will be auto-faded out at end of render.`
    );
  }

  audioTracks.forEach((track, i) => {
    totalAssetsCount++;
    if (!track.url || track.url.trim() === '') {
      warnings.push(`Audio Track #${i + 1} ("${track.title}") is missing a source audio stream.`);
    }
  });

  const isValid = errors.length === 0;

  return {
    isValid,
    targetDuration: target,
    actualDuration,
    durationMatch,
    errors,
    warnings,
    missingAssets,
    audioOverrun,
    totalAssetsCount,
    sceneCount: scenes.length,
    audioTrackCount: audioTracks.length,
  };
}
