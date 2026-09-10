import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Video, 
  Music, 
  Mic, 
  VolumeX, 
  Sliders, 
  Clock, 
  Check, 
  Play, 
  Layers, 
  Plus, 
  ArrowRight,
  Zap,
  Wand2,
  Camera,
  Sun,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ScriptSceneInterval, AudioRoutingOption, CameraMotion, Scene } from '../types';

interface ScriptToSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddScenesToTimeline: (scenes: Scene[]) => void;
  lockedCharacterToken?: string;
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Himalayan Luxury Tourism Promo',
    topic: 'Travel & Tourism',
    script: `Scene 1: Wake up above the clouds in the majestic Annapurna sanctuary as morning sunlight strikes golden peaks.
Scene 2: Stroll through ancient cobblestone courtyards of Bhaktapur with master artisan woodcarvers.
Scene 3: Glide across the crystal-clear waters of Phewa Lake in Pokhara with colorful boats and soaring paragliders.
Scene 4: Experience world-class Himalayan hospitality by evening fireside with hot spiced chai and panoramic night skies.`
  },
  {
    title: 'AI Tech Studio SaaS Product Launch',
    topic: 'Tech & Freelancer',
    script: `Scene 1: Stop struggling with slow editing software and fragmented creative tools.
Scene 2: Introducing NepalAI Studio: generate 100% consistent character avatars and Sora-2 cinematic scenes in seconds.
Scene 3: Precision multi-track NLE timeline locks voiceovers, Devanagari captions, and 4K upscaling flawlessly.
Scene 4: Export directly to YouTube, Instagram, and TikTok with one click. Start your creative revolution today.`
  }
];

export const ScriptToSceneModal: React.FC<ScriptToSceneModalProps> = ({
  isOpen,
  onClose,
  onAddScenesToTimeline,
  lockedCharacterToken,
}) => {
  const [scriptText, setScriptText] = useState(SAMPLE_SCRIPTS[0].script);
  const [selectedTopic, setSelectedTopic] = useState('Travel & Tourism');
  const [targetDuration, setTargetDuration] = useState<number>(48); // 4 scenes x 12s = 48s
  const [defaultAudioRouting, setDefaultAudioRouting] = useState<AudioRoutingOption>('sync_ai_audio');
  
  // Cinematic Prompt Guides
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>('dolly');
  const [lensSpec, setLensSpec] = useState<'anamorphic_35mm' | 'portrait_85mm' | 'wide_24mm' | 'drone_aerial'>('anamorphic_35mm');
  const [lightingPreset, setLightingPreset] = useState<'golden_hour' | 'neon_cyber' | 'himalayan_mist' | 'studio_softbox'>('golden_hour');

  const [isDecomposing, setIsDecomposing] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<ScriptSceneInterval[]>([]);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDecomposeScript = () => {
    setIsDecomposing(true);

    setTimeout(() => {
      // Split script into 12-second intervals
      const rawLines = scriptText.split('\n').filter(line => line.trim().length > 0);
      const lines = rawLines.length > 0 ? rawLines : [
        'Scene 1: Establishing dynamic cinematic shot',
        'Scene 2: Action focal sequence with character interaction',
        'Scene 3: Climax detail shot with lighting atmosphere',
        'Scene 4: Final resolution and branded call to action'
      ];

      const lensDescriptions: Record<string, string> = {
        anamorphic_35mm: 'Shot on Panavision Anamorphic 35mm f/1.8, cinematic bokeh, organic horizontal lens flare',
        portrait_85mm: '85mm f/1.4 prime portrait lens, creamy depth of field, razor-sharp eye focus',
        wide_24mm: '24mm ultra-wide master prime, expansive dynamic perspective, immersive architecture',
        drone_aerial: 'DJI Inspire 3 ProRes Raw aerial sweep, smooth gimbal stabilization, 4K HDR'
      };

      const lightingDescriptions: Record<string, string> = {
        golden_hour: 'golden hour warm amber sunlight, soft volumetric dust motes, rim lighting',
        neon_cyber: 'cyberpunk neon accents, cyan and magenta contrast, moody ambient reflections',
        himalayan_mist: 'rolling mountain fog, soft diffuse alpine light, crisp cool atmospheric depth',
        studio_softbox: 'high-key clean commercial softbox lighting, pristine contrast balance'
      };

      const characterPrefix = lockedCharacterToken ? `${lockedCharacterToken} ` : '';

      const scenes: ScriptSceneInterval[] = lines.slice(0, 8).map((line, idx) => {
        const startSec = idx * 12;
        const endSec = (idx + 1) * 12;
        const startMinStr = `${Math.floor(startSec / 60)}:${(startSec % 60).toString().padStart(2, '0')}`;
        const endMinStr = `${Math.floor(endSec / 60)}:${(endSec % 60).toString().padStart(2, '0')}`;
        
        const cleanContent = line.replace(/^Scene \d+:\s*/i, '');

        return {
          sceneIndex: idx + 1,
          intervalRange: `${startMinStr} - ${endMinStr}`,
          durationSeconds: 12,
          synopsis: cleanContent,
          visualPrompt: `${characterPrefix}Cinematic 12-second sequence: ${cleanContent}. ${lensDescriptions[lensSpec]}, ${lightingDescriptions[lightingPreset]}, photorealistic 4k cinema render.`,
          cinematicCamera: cameraMotion,
          cameraMovementDetail: `${cameraMotion.replace('_', ' ')} movement with ${lensSpec.replace('_', ' ')}`,
          voiceoverDialogue: cleanContent,
          onscreenCaption: cleanContent.slice(0, 45) + (cleanContent.length > 45 ? '...' : ''),
          audioRouting: defaultAudioRouting,
          lightingStyle: lightingPreset,
          status: 'ready',
          generatedMediaUrl: '/samples/ForBiggerBlazes.mp4',
        };
      });

      setGeneratedScenes(scenes);
      setIsDecomposing(false);
    }, 1500);
  };

  const handlePushToTimeline = () => {
    if (generatedScenes.length === 0) return;

    const timelineScenes: Scene[] = generatedScenes.map((s, idx) => ({
      id: `scene-sora-12s-${Date.now()}-${idx}`,
      title: `Scene ${s.sceneIndex} (12s)`,
      duration: 12,
      prompt: s.visualPrompt,
      mediaUrl: s.generatedMediaUrl || '/samples/ForBiggerBlazes.mp4',
      mediaType: 'video',
      aspectRatio: '16:9',
      motion: s.cinematicCamera,
      transition: idx === 0 ? 'cut' : 'dissolve',
      transitionDuration: 0.8,
      textOverlay: s.onscreenCaption,
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'sans',
      textStyle: 'lower_third',
      filter: 'cinematic',
      volume: s.audioRouting === 'silent_broll' ? 0 : 90,
      scriptText: s.voiceoverDialogue,
      colorTag: 'ai_gen',
    }));

    onAddScenesToTimeline(timelineScenes);
    setSuccessCount(timelineScenes.length);
    setTimeout(() => {
      setSuccessCount(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-label="Script-to-Scene 12s Sora-2 Engine"
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/40 text-purple-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Module 2: Advanced AI Video & Audio Generation (Sora-2 Pipeline)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 border border-purple-700/50 text-purple-300">
                  12-Second Scene Intervals
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Script-to-scene frame sequencing, flexible audio routing, and cinematic structural prompt guides
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Script Input, Audio Routing & Prompt Guide (5 Cols) */}
          <div className="lg:col-span-5 p-5 border-r border-slate-800/80 bg-slate-950/40 flex flex-col gap-4 overflow-y-auto">
            
            {/* Script Presets */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block">
                Quick Storyboard Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_SCRIPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setScriptText(item.script);
                      setSelectedTopic(item.topic);
                    }}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left text-xs text-slate-200 transition cursor-pointer"
                  >
                    <div className="font-semibold truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400">{item.topic}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Text Input */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Script / Story Synopsis
                </label>
                <span className="text-[10px] text-slate-400">Decomposes into 12s blocks</span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder="Enter your script, dialogue, or story scenes..."
                className="w-full flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Audio Routing Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>Flexible Audio Routing</span>
              </label>

              <div className="space-y-1.5">
                <button
                  onClick={() => setDefaultAudioRouting('sync_ai_audio')}
                  className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    defaultAudioRouting === 'sync_ai_audio'
                      ? 'bg-purple-950/40 border-purple-500/70 text-purple-200 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Synchronous AI Audio (Native Sora-2 soundscape)</span>
                  </div>
                  {defaultAudioRouting === 'sync_ai_audio' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>

                <button
                  onClick={() => setDefaultAudioRouting('layered_voiceover')}
                  className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    defaultAudioRouting === 'layered_voiceover'
                      ? 'bg-purple-950/40 border-purple-500/70 text-purple-200 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Layered Neural Voiceover (SpeechT5 / Azure TTS)</span>
                  </div>
                  {defaultAudioRouting === 'layered_voiceover' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>

                <button
                  onClick={() => setDefaultAudioRouting('silent_broll')}
                  className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                    defaultAudioRouting === 'silent_broll'
                      ? 'bg-purple-950/40 border-purple-500/70 text-purple-200 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    <span>Silent Video (Visual B-Roll Only)</span>
                  </div>
                  {defaultAudioRouting === 'silent_broll' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              </div>
            </div>

            {/* Cinematic Prompt Guides */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Cinematography & Lens Presets</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Camera Motion</label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="dolly">Dolly Push-In</option>
                    <option value="orbit">Orbit 360°</option>
                    <option value="pan_left">Pan Left</option>
                    <option value="pan_right">Pan Right</option>
                    <option value="zoom_in">Cinematic Zoom In</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Optics & Lens</label>
                  <select
                    value={lensSpec}
                    onChange={(e) => setLensSpec(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="anamorphic_35mm">35mm Anamorphic</option>
                    <option value="portrait_85mm">85mm f/1.4 Prime</option>
                    <option value="wide_24mm">24mm Master Wide</option>
                    <option value="drone_aerial">ProRes Aerial Drone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Lighting Atmosphere</label>
                <select
                  value={lightingPreset}
                  onChange={(e) => setLightingPreset(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="golden_hour">Golden Hour (Warm Alpine Glow)</option>
                  <option value="neon_cyber">Neon Cyber (High Contrast)</option>
                  <option value="himalayan_mist">Himalayan Mist (Volumetric Depth)</option>
                  <option value="studio_softbox">High-Key Commercial Softbox</option>
                </select>
              </div>
            </div>

            {/* Decompose Action Button */}
            <button
              onClick={handleDecomposeScript}
              disabled={isDecomposing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isDecomposing ? 'animate-spin' : ''}`} />
              <span>{isDecomposing ? 'Decomposing 12s Frame Intervals...' : 'Decompose Script into 12s Scenes'}</span>
            </button>
          </div>

          {/* Right Column: 12-Second Sequence Storyboard & Timeline Push (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto">
            {generatedScenes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-3">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Ready for 12-Second Scene Sequencing</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Click "Decompose Script into 12s Scenes" to automatically generate exact 12-second scene intervals, visual prompts, and camera movements.
                </p>
                {lockedCharacterToken && (
                  <div className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Character Biometric Anchor Active: {lockedCharacterToken}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Generated 12s Scene Intervals ({generatedScenes.length} Scenes = {generatedScenes.length * 12}s total)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    Sora-2 Ready
                  </span>
                </div>

                {/* Scene Sequence List */}
                <div className="space-y-3">
                  {generatedScenes.map((scene, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-900/80 border border-purple-500/50 text-xs font-bold text-purple-200 flex items-center justify-center">
                            {scene.sceneIndex}
                          </span>
                          <span className="text-xs font-bold text-white">Scene {scene.sceneIndex}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-purple-300">
                            ⏱ {scene.intervalRange} (12s)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {scene.cameraMovementDetail}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] leading-relaxed">
                        {scene.visualPrompt}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300">Dialogue:</span>
                          <span className="italic">"{scene.voiceoverDialogue}"</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300">
                          {scene.audioRouting === 'sync_ai_audio' ? '🔊 Sync AI Audio' : scene.audioRouting === 'layered_voiceover' ? '🎙 Neural TTS' : '🔇 Silent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            {generatedScenes.length > 0 && (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">
                  {generatedScenes.length} Scenes ready for timeline rendering
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedScenes([])}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handlePushToTimeline}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-xs font-bold text-white shadow-lg shadow-purple-500/25 flex items-center gap-2 transition cursor-pointer"
                  >
                    {successCount ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Pushed {successCount} Scenes to Timeline!</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4 text-white" />
                        <span>Push All 12s Scenes to NLE Timeline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
