import { Scene, TransitionType } from '../types';

export interface SceneTiming {
  index: number;
  id: string;
  startTime: number;
  duration: number;
  endTime: number;
  sourceStart: number;
  playbackRate: number;
}

export interface TimelineCompositionState {
  totalDuration: number;
  currentTime: number; // authoritative projectTime (seconds)
  activeSceneIndex: number;
  activeScene: Scene | null;
  sceneStartTime: number;
  sceneElapsed: number; // local time within activeScene = projectTime - sceneStartTime
  sceneDuration: number;
  sceneProgress: number; // 0.0 to 1.0 within activeScene
  videoSourceTime: number; // sourceStart + sceneElapsed * playbackRate
  isTransitioning: boolean;
  transitionType: TransitionType;
  transitionDuration: number;
  transitionProgress: number; // 0.0 to 1.0 within transition window
  transitionStartTime: number;
  nextScene: Scene | null;
  nextSceneIndex: number | null;
  nextSceneElapsed: number;
  nextSceneVideoSourceTime: number;
}

/**
 * Deterministically computes timing boundaries for each scene.
 * Uses exact half-open intervals: startTime <= projectTime < endTime
 */
export function computeSceneTimings(scenes: Scene[]): SceneTiming[] {
  let accumulated = 0;
  return scenes.map((s, idx) => {
    const dur = Math.max(0.1, Number(s.duration) || 4);
    const startTime = accumulated;
    const endTime = startTime + dur;
    accumulated = endTime;
    return {
      index: idx,
      id: s.id,
      startTime,
      duration: dur,
      endTime,
      sourceStart: s.sourceStart !== undefined ? Number(s.sourceStart) : 0,
      playbackRate: s.playbackRate !== undefined ? Number(s.playbackRate) : (Number(s.speed) || 1),
    };
  });
}

/**
 * Single authoritative source of truth for timeline composition at any given playback timestamp.
 * Pure and deterministic: getCompositionAtTime(scenes, projectTime) -> TimelineCompositionState.
 * Used identically by real-time preview canvas, timeline deck, and final rendering pipelines.
 */
export function getCompositionAtTime(
  scenes: Scene[],
  projectTime: number
): TimelineCompositionState {
  if (!scenes || scenes.length === 0) {
    return {
      totalDuration: 0,
      currentTime: 0,
      activeSceneIndex: -1,
      activeScene: null,
      sceneStartTime: 0,
      sceneElapsed: 0,
      sceneDuration: 0,
      sceneProgress: 0,
      videoSourceTime: 0,
      isTransitioning: false,
      transitionType: 'cut',
      transitionDuration: 0,
      transitionProgress: 0,
      transitionStartTime: 0,
      nextScene: null,
      nextSceneIndex: null,
      nextSceneElapsed: 0,
      nextSceneVideoSourceTime: 0,
    };
  }

  const timings = computeSceneTimings(scenes);
  const totalDuration = timings.length > 0 ? timings[timings.length - 1].endTime : 0;
  const clampedTime = Math.max(0, Math.min(projectTime, totalDuration));

  // Determine active scene using strict half-open interval: startTime <= projectTime < endTime
  let activeIndex = 0;
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i];
    if (clampedTime >= t.startTime && clampedTime < t.endTime) {
      activeIndex = i;
      break;
    }
  }

  // Handle exact end of timeline boundary: snap to last scene
  if (clampedTime >= totalDuration && timings.length > 0) {
    activeIndex = timings.length - 1;
  }

  const activeTiming = timings[activeIndex];
  const activeScene = scenes[activeIndex];
  const sceneDuration = activeTiming.duration;
  const sceneStartTime = activeTiming.startTime;
  const sceneElapsed = Math.max(0, clampedTime - sceneStartTime);
  const sceneProgress = Math.min(1, Math.max(0, sceneElapsed / sceneDuration));

  // Video source time formula: localTime = projectTime - clip.startTime; sourceTime = clip.sourceStart + localTime * clip.playbackRate
  const videoSourceTime = activeTiming.sourceStart + sceneElapsed * activeTiming.playbackRate;

  // Transition evaluation to next scene
  const rawTransDuration = activeScene.transitionDuration !== undefined ? activeScene.transitionDuration : 0.8;
  const transitionDuration = Math.min(sceneDuration * 0.5, rawTransDuration);
  const rawTransitionType = activeScene.transition || 'cut';

  const hasNextScene = activeIndex < scenes.length - 1;
  const transitionStartTime = activeTiming.endTime - transitionDuration;
  const inTransitionWindow = clampedTime >= transitionStartTime && clampedTime < activeTiming.endTime;
  const isTransitioning = hasNextScene && rawTransitionType !== 'cut' && inTransitionWindow && transitionDuration > 0;

  let transitionProgress = 0;
  let nextScene: Scene | null = null;
  let nextSceneIndex: number | null = null;
  let nextSceneElapsed = 0;
  let nextSceneVideoSourceTime = 0;

  if (isTransitioning) {
    nextSceneIndex = activeIndex + 1;
    nextScene = scenes[nextSceneIndex] || null;
    const nextTiming = timings[nextSceneIndex];
    transitionProgress = Math.min(1, Math.max(0, (clampedTime - transitionStartTime) / transitionDuration));
    nextSceneElapsed = transitionProgress * transitionDuration;
    if (nextTiming) {
      nextSceneVideoSourceTime = nextTiming.sourceStart + nextSceneElapsed * nextTiming.playbackRate;
    }
  }

  return {
    totalDuration,
    currentTime: clampedTime,
    activeSceneIndex: activeIndex,
    activeScene,
    sceneStartTime,
    sceneElapsed,
    sceneDuration,
    sceneProgress,
    videoSourceTime,
    isTransitioning,
    transitionType: rawTransitionType,
    transitionDuration,
    transitionProgress,
    transitionStartTime,
    nextScene,
    nextSceneIndex,
    nextSceneElapsed,
    nextSceneVideoSourceTime,
  };
}

/**
 * Format seconds to standard video SMPTE timecode (HH:MM:SS:FF or MM:SS.mmm)
 */
export function formatTimecode(seconds: number, includeFrames = false, fps = 30): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (includeFrames) {
    const frames = Math.floor((seconds % 1) * fps);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
