import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Check, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Layers, 
  Sliders, 
  Clock, 
  Video, 
  Languages,
  Zap,
  Play,
  RotateCcw
} from 'lucide-react';
import { Scene, CameraMotion, TransitionType, BatchScriptSegment } from '../types';

interface BatchSceneProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenesToTimeline: (newScenes: Scene[]) => void;
  currentAspectRatio?: '16:9' | '9:16' | '1:1';
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Himalayan Sherpa Heritage (Documentary)',
    genre: 'documentary',
    text: `In the shadows of Mount Everest lies the ancient high-altitude valley of Khumbu. 
For generations, the Sherpa communities have preserved sacred Buddhist monasteries, chanting under colorful prayer flags fluttering against icy winds. 
Early in the morning, yaks transport trading goods across stone suspension bridges shrouded in mist. 
As dawn breaks over Ama Dablam, mountaineers and local guides prepare their climbing gear with spiritual devotion. 
This is not merely a journey of extreme survival, but a timeless tapestry of spiritual harmony with the highest peaks on Earth.`
  },
  {
    title: 'Kathmandu Coffee & Startup Culture (Podcast Intro)',
    genre: 'podcast',
    text: `Welcome back to the Tech Himalaya Studio! Today we are discussing the explosion of Kathmandu's specialty coffee hubs and startup founders. 
Across Jhamsikhel and Thamel, young software engineers and designers are building global products right from traditional brick houses. 
With high-speed fiber internet and rich organic beans from Gulmi, the work culture has completely transformed. 
Let's dive into how modern tech talent in Nepal is redefining remote work and cross-border innovation.`
  },
  {
    title: 'Pashmina Luxury Brand (Commercial TV Ad)',
    genre: 'commercial',
    text: `Pure warmth. Pure Nepali craftsmanship. 
Harvested ethically from high-altitude Chyangra goats in Mustang, every thread is hand-spun by master artisans in Patan. 
Feel the ethereal featherlight softness and unmatched elegance in every fold. 
Upgrade your winter wardrobe with authentic Himalayan Cashmere. Visit our flagship store in Durbar Marg or order online worldwide.`
  }
];

export const BatchSceneProcessorModal: React.FC<BatchSceneProcessorModalProps> = ({
  isOpen,
  onClose,
  onApplyScenesToTimeline,
  currentAspectRatio = '16:9',
}) => {
  const [scriptText, setScriptText] = useState(SAMPLE_SCRIPTS[0].text);
  const [pacingMode, setPacingMode] = useState<'fast' | 'balanced' | 'cinematic'>('balanced');
  const [targetAspect, setTargetAspect] = useState<'16:9' | '9:16' | '1:1'>(currentAspectRatio);
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'nepali' | 'english'>('bilingual');
  const [parsedSegments, setParsedSegments] = useState<BatchScriptSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcessScript = () => {
    setIsProcessing(true);

    // Split script into meaningful paragraphs or sentence clusters
    const rawParagraphs = scriptText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 10);

    const segmentsToUse = rawParagraphs.length >= 3 
      ? rawParagraphs 
      : scriptText.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 10);

    const targetDuration = pacingMode === 'fast' ? 3.5 : pacingMode === 'cinematic' ? 6.5 : 4.8;
    const cameraMotions: CameraMotion[] = ['zoom_in', 'pan_right', 'dolly', 'pan_left', 'orbit', 'static'];
    const transitions: TransitionType[] = ['cut', 'dissolve', 'fade', 'wipe_right', 'zoom_in'];

    const generatedSegments: BatchScriptSegment[] = segmentsToUse.map((textChunk, idx) => {
      let segmentType: BatchScriptSegment['segmentType'] = 'narrative_beat';
      if (idx === 0) segmentType = 'hook_intro';
      else if (idx === segmentsToUse.length - 1) segmentType = 'call_to_action';
      else if (idx % 2 === 1) segmentType = 'b_roll_visual';

      // Generate optimized prompts and subtitles
      const title = `Scene ${idx + 1}: ${textChunk.slice(0, 30)}...`;
      const promptEn = `Cinematic 8k photorealistic scene, ${textChunk}, professional cinematography, Kodak Vision3 500T, high visual depth, golden hour volumetric lighting.`;
      const promptNe = `${textChunk} - उच्च गुणस्तरीय सिनेम्याटिक दृश्य।`;
      
      const subtitleEn = textChunk.length > 90 ? textChunk.slice(0, 87) + '...' : textChunk;
      const subtitleNe = `${textChunk.slice(0, 60)}...`;

      return {
        id: 'batch-seg-' + Math.random().toString(36).substring(2, 9),
        order: idx + 1,
        segmentType,
        title,
        promptEn,
        promptNe,
        subtitleEn,
        subtitleNe,
        duration: targetDuration,
        cameraMotion: cameraMotions[idx % cameraMotions.length],
        transition: idx === 0 ? 'cut' : transitions[idx % transitions.length],
        soundCue: idx === 0 ? 'Himalayan Bell & Wind' : 'Acoustic Ambience'
      };
    });

    setTimeout(() => {
      setParsedSegments(generatedSegments);
      setIsProcessing(false);
    }, 350);
  };

  const handleUpdateSegment = (id: string, field: keyof BatchScriptSegment, value: any) => {
    setParsedSegments(prev => prev.map(seg => seg.id === id ? { ...seg, [field]: value } : seg));
  };

  const handleDeleteSegment = (id: string) => {
    setParsedSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const handleApplyToTimeline = () => {
    if (parsedSegments.length === 0) return;

    // Convert parsed batch segments into standard Scene objects
    const defaultPlaceholderImage = targetAspect === '9:16'
      ? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';

    const newScenes: Scene[] = parsedSegments.map((seg, idx) => ({
      id: 'scene-batch-' + Math.random().toString(36).substring(2, 9),
      title: seg.title,
      duration: seg.duration,
      prompt: seg.promptEn,
      promptNepali: seg.promptNe,
      mediaUrl: defaultPlaceholderImage,
      mediaType: 'image',
      aspectRatio: targetAspect,
      motion: seg.cameraMotion,
      transition: seg.transition,
      transitionDuration: 0.8,
      textOverlay: languageMode === 'english' ? seg.subtitleEn : seg.subtitleEn,
      textNepali: languageMode !== 'english' ? seg.subtitleNe : undefined,
      textPosition: 'lower_third',
      textColor: '#ffffff',
      textFont: 'devanagari',
      filter: 'warm_gold',
      volume: 85
    }));

    onApplyScenesToTimeline(newScenes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Batch Scene Processor & Script Breakdown</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  AI Storyboard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Break long-form scripts into optimized multi-shot scenes with synced subtitles, camera motions, and durations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Preset Script Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Quick Sample Scripts:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_SCRIPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setScriptText(item.text);
                    setParsedSegments([]);
                  }}
                  className="text-left p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-xs flex flex-col gap-1 cursor-pointer"
                >
                  <span className="font-semibold text-white truncate">{item.title}</span>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{item.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Script Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste Your Script or Narrative (English, Nepali, or Romanized):</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {scriptText.length} characters
              </span>
            </div>

            <textarea
              rows={5}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste your long-form story, documentary narration, or podcast script here..."
              className="w-full bg-[#070a11] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Configuration Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-medium">Pacing & Duration:</span>
              <div className="flex items-center gap-1">
                {(['fast', 'balanced', 'cinematic'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPacingMode(mode)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                      pacingMode === mode 
                        ? 'bg-cyan-500 text-slate-950 font-bold' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode === 'fast' ? '3s Fast' : mode === 'balanced' ? '5s Standard' : '7s Epic'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1 font-medium">Aspect Ratio:</span>
              <div className="flex items-center gap-1">
                {(['16:9', '9:16', '1:1'] as const).map(aspect => (
                  <button
                    key={aspect}
                    onClick={() => setTargetAspect(aspect)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                      targetAspect === aspect 
                        ? 'bg-cyan-500 text-slate-950 font-bold' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {aspect}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1 font-medium">Subtitle Mode:</span>
              <div className="flex items-center gap-1">
                {(['bilingual', 'nepali', 'english'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguageMode(lang)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                      languageMode === lang 
                        ? 'bg-cyan-500 text-slate-950 font-bold' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button: Parse Script */}
          <div className="flex justify-center">
            <button
              onClick={handleProcessScript}
              disabled={isProcessing || !scriptText.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? 'Analyzing & Splitting Script...' : 'Break Down into Optimized Scenes'}</span>
            </button>
          </div>

          {/* Parsed Scenes List */}
          {parsedSegments.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Generated Scenes ({parsedSegments.length} shots • {parsedSegments.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s total)</span>
                </h3>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Ready to inject into Timeline
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {parsedSegments.map((seg, idx) => (
                  <div 
                    key={seg.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-2 relative group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {seg.segmentType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {seg.duration}s
                        </span>
                        <span className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          {seg.cameraMotion}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteSegment(seg.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Remove Scene"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      <strong className="text-slate-400">Prompt:</strong> {seg.promptEn}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="truncate"><strong>Subtitle:</strong> {seg.subtitleEn}</span>
                      <span className="shrink-0 text-cyan-400 font-mono">Transition: {seg.transition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleApplyToTimeline}
            disabled={parsedSegments.length === 0}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <span>Add {parsedSegments.length} Scenes to Video Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
