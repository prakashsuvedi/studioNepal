import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Eye, 
  Sun, 
  Grid, 
  Crosshair, 
  Sliders, 
  Layers, 
  Film, 
  Sparkles, 
  Maximize2, 
  Volume2, 
  Zap, 
  CheckCheck,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  SequentialSceneNode, 
  DynamicCharacterIdentity 
} from '../services/characterContinuityEngine';

interface SequencePreviewWireframeProps {
  scenes: SequentialSceneNode[];
  characters: DynamicCharacterIdentity[];
  aspectRatio?: '16:9' | '9:16';
  worldTheme?: string;
  visualStyle?: string;
  onSelectScene?: (sceneIndex: number) => void;
  onLoadScenePrompt?: (prompt: string, duration: string) => void;
}

export const SequencePreviewWireframe: React.FC<SequencePreviewWireframeProps> = ({
  scenes = [],
  characters = [],
  aspectRatio = '16:9',
  worldTheme = 'Himalayan Cinematic Realism',
  visualStyle = 'Photorealistic 4k 35mm',
  onSelectScene,
  onLoadScenePrompt
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playProgress, setPlayProgress] = useState<number>(0); // 0 to 100%
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5, 1, 2
  const [cameraOverride, setCameraOverride] = useState<string>('auto');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showLightingVector, setShowLightingVector] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const activeScene = scenes[currentSceneIdx] || scenes[0];
  const sceneDurationSec = activeScene ? (parseInt(activeScene.duration, 10) || 8) : 8;

  // Active characters in this scene
  const activeChars = characters.filter(c => activeScene?.activeCharacterIds.includes(c.id));
  const primaryChar = activeChars[0] || characters[0];

  // Resolve camera motion mode
  const resolvedMotion = cameraOverride !== 'auto' 
    ? cameraOverride 
    : (activeScene?.cameraMovement || 'Pan Right').toLowerCase();

  // Animation Loop for wireframe playback
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const durationMs = sceneDurationSec * 1000 / playbackSpeed;
      const progressDelta = (deltaMs / durationMs) * 100;

      setPlayProgress(prev => {
        const next = prev + progressDelta;
        if (next >= 100) {
          // Advance to next scene or loop
          if (currentSceneIdx < scenes.length - 1) {
            setCurrentSceneIdx(idx => idx + 1);
            return 0;
          } else if (isLooping) {
            setCurrentSceneIdx(0);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, sceneDurationSec, playbackSpeed, currentSceneIdx, scenes.length, isLooping]);

  const handleTogglePlay = () => {
    if (playProgress >= 100) {
      setPlayProgress(0);
    }
    setIsPlaying(p => !p);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlayProgress(0);
    setCurrentSceneIdx(0);
  };

  const handlePrevScene = () => {
    setPlayProgress(0);
    setCurrentSceneIdx(idx => Math.max(0, idx - 1));
  };

  const handleNextScene = () => {
    setPlayProgress(0);
    setCurrentSceneIdx(idx => Math.min(scenes.length - 1, idx + 1));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayProgress(parseFloat(e.target.value));
  };

  // Compute animated coordinates based on camera movement and progress
  const progressRatio = playProgress / 100;
  
  // Pan motion: shifts background & subject horizontally
  let panX = 0;
  let panY = 0;
  let zoomScale = 1;
  let orbitAngle = 0;
  let craneY = 0;

  if (resolvedMotion.includes('pan') || resolvedMotion.includes('tracking')) {
    const direction = resolvedMotion.includes('left') ? 1 : -1;
    panX = Math.sin(progressRatio * Math.PI) * 45 * direction;
  } else if (resolvedMotion.includes('zoom') || resolvedMotion.includes('dolly') || resolvedMotion.includes('push')) {
    zoomScale = 1 + progressRatio * 0.35;
  } else if (resolvedMotion.includes('orbit') || resolvedMotion.includes('arc') || resolvedMotion.includes('360')) {
    orbitAngle = progressRatio * 360;
    panX = Math.cos((orbitAngle * Math.PI) / 180) * 30;
  } else if (resolvedMotion.includes('crane') || resolvedMotion.includes('tilt') || resolvedMotion.includes('boom')) {
    craneY = Math.sin(progressRatio * Math.PI) * 35;
  }

  // Lighting angle computation
  const lightingStr = (activeScene?.lightingAtmosphere || '').toLowerCase();
  const isGoldenHour = lightingStr.includes('golden') || lightingStr.includes('sunset') || lightingStr.includes('dawn');
  const isBlueHour = lightingStr.includes('blue') || lightingStr.includes('twilight') || lightingStr.includes('dusk');
  const isCandle = lightingStr.includes('candle') || lightingStr.includes('lamp') || lightingStr.includes('monastery');

  const currentSecondsElapsed = ((progressRatio * sceneDurationSec)).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Sequence Preview &amp; Animated Storyboard Wireframe</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
              Low-Res Flow Simulator
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Simulate 35mm camera motion, framing boundaries, subject tracking reticles, and character continuity before final Sora-2 render.
          </p>
        </div>

        {/* Playback HUD Control Quick Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setShowGrid(g => !g)}
              className={`px-2 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                showGrid ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Rule-of-Thirds Grid"
            >
              <Grid className="w-3 h-3" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setShowReticle(r => !r)}
              className={`px-2 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                showReticle ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Optical Crosshairs"
            >
              <Crosshair className="w-3 h-3" />
              <span>Crosshairs</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLightingVector(l => !l)}
              className={`px-2 py-1 rounded font-bold transition cursor-pointer flex items-center gap-1 ${
                showLightingVector ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Lighting Vector"
            >
              <Sun className="w-3 h-3" />
              <span>Lighting</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Wireframe Viewport Stage */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        
        {/* Dynamic Aspect Ratio Container */}
        <div 
          className={`relative w-full mx-auto flex items-center justify-center overflow-hidden ${
            aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[360px] h-[520px]' : 'aspect-video max-h-[480px]'
          }`}
        >
          {/* Studio Depth Backdrop / Perspective Grid */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoomScale}) translate(${panX * 0.3}px, ${craneY * 0.3}px)`
            }}
          >
            {/* 3D Wireframe Ground Plane & Converging Vanishing Point */}
            <svg className="w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.75" />
                </pattern>
                <linearGradient id="lighting-beam" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isGoldenHour ? '#f59e0b' : isBlueHour ? '#38bdf8' : '#818cf8'} stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              
              {/* Converging Horizon Depth Lines */}
              <line x1="50%" y1="45%" x2="0%" y2="100%" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50%" y1="45%" x2="100%" y2="100%" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50%" y1="45%" x2="50%" y2="100%" stroke="rgba(99, 102, 241, 0.6)" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Horizon Level Bar */}
              <line x1="10%" y1="45%" x2="90%" y2="45%" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" strokeDasharray="6 6" />
            </svg>
          </div>

          {/* Volumetric Lighting Vector Indicator */}
          {showLightingVector && (
            <div 
              className={`absolute top-0 right-0 w-72 h-72 pointer-events-none transition-opacity duration-300 ${
                isGoldenHour ? 'bg-amber-500/15' : isBlueHour ? 'bg-sky-500/15' : 'bg-indigo-500/15'
              } rounded-full blur-3xl`}
              style={{
                transform: `translate(${panX * 0.5}px, ${-panY * 0.5}px)`
              }}
            />
          )}

          {/* Rule of Thirds Cinematic Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none border border-slate-700/40">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-indigo-400" />
                <div className="border-r border-b border-indigo-400" />
                <div className="border-b border-indigo-400" />
                <div className="border-r border-b border-indigo-400" />
                <div className="border-r border-b border-indigo-400" />
                <div className="border-b border-indigo-400" />
                <div className="border-r border-indigo-400" />
                <div className="border-r border-indigo-400" />
                <div />
              </div>
            </div>
          )}

          {/* Optical Safe Area Border & Crosshair Reticle */}
          {showReticle && (
            <div className="absolute inset-4 sm:inset-8 pointer-events-none border border-cyan-500/30 rounded-lg">
              {/* Center Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/60" />
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-400/60" />
                <div className="absolute inset-0 border border-cyan-400/40 rounded-full" />
              </div>
              
              {/* Corner Framing Brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
            </div>
          )}

          {/* Subject Mannequin & Identity Tracking Reticle */}
          <div 
            className="absolute transition-transform duration-75 ease-out flex flex-col items-center justify-center pointer-events-none z-10"
            style={{
              transform: `translate(${panX}px, ${craneY}px) scale(${zoomScale})`
            }}
          >
            {/* Multi-Character Scene Positioning */}
            <div className="flex items-center gap-6">
              {activeChars.length > 0 ? (
                activeChars.map((char, cIdx) => (
                  <div key={char.id} className="flex flex-col items-center space-y-1.5 animate-in fade-in">
                    
                    {/* Character Tag Pill above Wireframe */}
                    <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-indigo-400/80 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-xs">
                      <span className="text-xs">{char.avatarEmoji}</span>
                      <span>{char.name}</span>
                      <span className="text-indigo-300 font-mono text-[9px]">ID#{cIdx + 1}</span>
                    </div>

                    {/* Wireframe Bounding Box & Snapshot Reticle */}
                    <div className="relative w-28 h-36 sm:w-32 sm:h-44 rounded-xl border-2 border-indigo-400/80 bg-indigo-950/40 backdrop-blur-xs p-2 flex flex-col items-center justify-between shadow-xl shadow-indigo-950/50">
                      
                      {/* Top Head / Facial Reticle */}
                      <div className="w-12 h-12 rounded-full border border-cyan-400/90 bg-slate-900/80 overflow-hidden relative flex items-center justify-center shadow-inner">
                        {char.snapshotBase64 || char.referenceImage ? (
                          <img 
                            src={char.snapshotBase64 || char.referenceImage} 
                            alt={char.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{char.avatarEmoji}</span>
                        )}
                        <div className="absolute inset-0 border border-cyan-400/50 rounded-full animate-ping opacity-30" />
                      </div>

                      {/* Torso & Wardrobe Wireframe Shape */}
                      <div className="w-full h-16 border border-indigo-400/50 rounded-lg bg-indigo-900/30 p-1 flex flex-col justify-between text-[8.5px] text-slate-300 leading-tight">
                        <div className="flex items-center justify-between text-indigo-200 font-bold">
                          <span>{char.roleOrArchetype}</span>
                          <span className="text-[8px] text-emerald-400">Locked</span>
                        </div>
                        <p className="line-clamp-2 text-slate-300 italic">
                          {char.clothing || char.attire || 'Wardrobe Anchor'}
                        </p>
                      </div>

                      {/* Anchor Token Badge at bottom of Mannequin */}
                      <div className="w-full text-center">
                        <span className="text-[7.5px] px-1 py-0.2 rounded bg-slate-900/90 text-indigo-300 font-mono block truncate border border-slate-700">
                          {char.anchorToken}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback generic wireframe if no character selected */
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-indigo-400 text-white text-[10px] font-bold">
                    <span>{primaryChar?.name || 'Primary Subject'}</span>
                  </div>
                  <div className="w-28 h-36 rounded-xl border-2 border-indigo-400/80 bg-indigo-950/40 p-2 flex flex-col items-center justify-between">
                    <div className="w-12 h-12 rounded-full border border-cyan-400 bg-slate-900 flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div className="w-full h-14 border border-indigo-400/50 rounded bg-indigo-900/30 p-1 text-[8.5px] text-slate-300">
                      Subject Wireframe
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TOP HUD: Scene Info, Cinematography, & Timing */}
          <div className="absolute top-2 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] font-mono shadow-md">
                  SCENE {activeScene?.sceneIndex || (currentSceneIdx + 1)} / {scenes.length || 1}
                </span>
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {activeScene?.title || 'Cinematic Beat'}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 backdrop-blur-xs w-fit">
                ⏱️ {currentSecondsElapsed}s / {sceneDurationSec}s ({activeScene?.duration || '8'}s total)
              </span>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-cyan-300 font-mono font-bold flex items-center gap-1 backdrop-blur-xs shadow-md">
                <Camera className="w-3 h-3 text-cyan-400" />
                <span>{activeScene?.framing || '35mm Master'}</span>
              </span>
              <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-amber-300 font-mono font-bold flex items-center gap-1 backdrop-blur-xs shadow-md">
                <Compass className="w-3 h-3 text-amber-400" />
                <span>{activeScene?.cameraMovement || 'Pan Right'}</span>
              </span>
            </div>
          </div>

          {/* BOTTOM HUD: Subtitle & Narrative Script Prompter */}
          <div className="absolute bottom-2 left-3 right-3 pointer-events-none">
            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Scene Prompt Transcript:</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold">
                  ✓ Active Vectors Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-100 font-medium leading-relaxed line-clamp-2">
                "{activeScene?.userPrompt || 'Cinematic sequence beat...'}"
              </p>
            </div>
          </div>
        </div>

        {/* Playback Scrubber & Transport Controls Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2.5">
          
          {/* Progress Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-cyan-400 font-bold w-10 text-right">
              {currentSecondsElapsed}s
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={playProgress}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-slate-400 font-bold w-10">
              {sceneDurationSec}s
            </span>
          </div>

          {/* Transport Buttons & Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            
            {/* Left Transport Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevScene}
                disabled={currentSceneIdx === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition cursor-pointer"
                title="Previous Scene"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-950/40"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
              </button>

              <button
                type="button"
                onClick={handleNextScene}
                disabled={currentSceneIdx >= scenes.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition cursor-pointer"
                title="Next Scene"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Rewind to Scene 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle: Speed & Loop Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-slate-400">Speed:</span>
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition cursor-pointer border ${
                    playbackSpeed === speed
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsLooping(l => !l)}
                className={`text-[10px] px-2 py-0.5 rounded font-bold transition cursor-pointer border ml-1 ${
                  isLooping
                    ? 'bg-indigo-600/40 text-indigo-300 border-indigo-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                Loop: {isLooping ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Right: Camera Motion Mode Simulator Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-slate-400">Camera Sim:</span>
              <select
                value={cameraOverride}
                onChange={(e) => setCameraOverride(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10.5px] text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="auto">Auto (Scene Defined)</option>
                <option value="pan right">Pan Right</option>
                <option value="pan left">Pan Left</option>
                <option value="zoom in">Zoom In / Push</option>
                <option value="orbit 360">Orbit 360 / Arc</option>
                <option value="crane vertical">Crane Vertical</option>
                <option value="static master">Static Master</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* STORYBOARD SEQUENCE STRIP (Horizontal Cards for All Scenes) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sequence Storyboard Strip ({scenes.length} Scenes)</span>
          </span>
          <span className="text-[10px] text-slate-400">Click any card to preview camera wireframe flow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {scenes.map((scene, idx) => {
            const isSelected = currentSceneIdx === idx;
            const assignedChars = characters.filter(c => scene.activeCharacterIds.includes(c.id));
            const primarySnap = assignedChars[0]?.snapshotBase64 || assignedChars[0]?.referenceImage;

            return (
              <div
                key={scene.id}
                onClick={() => {
                  setCurrentSceneIdx(idx);
                  setPlayProgress(0);
                  if (onSelectScene) onSelectScene(idx);
                }}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative group ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Header: Scene Index & Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center font-mono ${
                      isSelected ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {scene.sceneIndex}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {scene.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                      {scene.duration}s
                    </span>
                    {scene.videoUrl && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/40">
                        ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Thumbnail + Cinematography Badges */}
                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {primarySnap ? (
                      <img src={primarySnap} alt={scene.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{assignedChars[0]?.avatarEmoji || '🎬'}</span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-[7.5px] text-center text-indigo-300 font-mono">
                      {assignedChars[0]?.name || 'Scene'}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[10.5px] text-slate-300 line-clamp-2 leading-tight">
                      "{scene.userPrompt}"
                    </p>
                    <div className="flex flex-wrap gap-1 text-[9px]">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800/80 text-cyan-300 font-mono">
                        {scene.framing}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300 font-mono">
                        {scene.cameraMovement}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Load Scene Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-500 font-mono">
                    Actors: {assignedChars.map(c => c.name).join(', ') || 'Lead'}
                  </span>
                  
                  {onLoadScenePrompt && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadScenePrompt(scene.constructedPrompt || scene.userPrompt, scene.duration);
                      }}
                      className="text-indigo-400 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Load Prompt</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
