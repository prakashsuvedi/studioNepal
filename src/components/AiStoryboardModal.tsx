import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Check, 
  RefreshCw,
  Video,
  Globe2,
  Camera,
  Layers,
  FileText
} from 'lucide-react';
import { Scene, StoryboardScene, CameraMotion, TransitionType } from '../types';

interface AiStoryboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStoryboard: (newScenes: Scene[]) => void;
}

const SCRIPT_PRESETS = [
  {
    name: '🏔️ Everest Sunrise',
    text: 'Mount Everest bathed in golden morning light. The high Himalayan winds carry colorful prayer flags dancing against the turquoise sky. Solitary yak caravans trek through ancient glacial valleys toward the high camp as dawn breaks over the roof of the world.',
    lang: 'ne' as const,
  },
  {
    name: '🛕 Kathmandu Heritage',
    text: 'In the ancient courtyard of Kathmandu Durbar Square, centuries-old woodcarvings and gilded pagoda roofs gleam in the afternoon sun. Incense smoke drifts through narrow cobblestone alleys as local artisans sculpt bronze deities and bells chime in the distance.',
    lang: 'ne' as const,
  },
  {
    name: '🚣 Pokhara Phewa Lake',
    text: 'Tranquil crystal waters of Phewa Lake reflect the dramatic double peak of Mount Machhapuchhre. Colorful wooden rowboats glide gently across the mirror-like surface while paragliders soar gracefully from Sarangkot hill into the lush valley.',
    lang: 'ne' as const,
  },
  {
    name: '☕ Himalayan Artisan',
    text: 'From the organic high-altitude coffee plantations of Nuwakot to modern Kathmandu roasteries. Freshly harvested cherries, hand-sorted beans roasted to perfection, and traditional warm hospitality poured into every artisanal cup.',
    lang: 'en' as const,
  }
];

export const AiStoryboardModal: React.FC<AiStoryboardModalProps> = ({
  isOpen,
  onClose,
  onApplyStoryboard
}) => {
  const [scriptInput, setScriptInput] = useState<string>(SCRIPT_PRESETS[0].text);
  const [selectedLanguage, setSelectedLanguage] = useState<'ne' | 'hi' | 'en'>('ne');
  const [targetSceneCount, setTargetSceneCount] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<StoryboardScene[] | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Call HamroAI chat endpoint to intelligently break down the user's script
      const promptText = `Act as an award-winning cinematic director and storyboard artist. 
Analyze the script below and break it down into exactly ${targetSceneCount} cinematic storyboard scenes.
Language: ${selectedLanguage === 'ne' ? 'Nepali context and Nepali Devanagari voiceover' : selectedLanguage === 'hi' ? 'Hindi context' : 'English'}.

Respond ONLY with a valid JSON array of ${targetSceneCount} objects, no markdown wrappers, no backticks, no preamble.
Schema:
[
  {
    "sceneNumber": 1,
    "title": "Short descriptive scene title",
    "summary": "1-2 sentence description of visual action",
    "visualPrompt": "Detailed photorealistic 4k camera prompt for AI video/image generator",
    "cameraMotion": "pan_left" | "pan_right" | "zoom_in" | "zoom_out" | "dolly" | "static",
    "suggestedTransition": "crossfade" | "fade" | "dissolve" | "slide_left" | "zoom_in",
    "estimatedDuration": 5,
    "voiceoverDialogue": "Narration text in English",
    "voiceoverNepali": "नेपाली देवनागरीमा संवाद वा वर्णन",
    "textOverlay": "Concise 2-4 word screen title"
  }
]

Script:
"""${scriptInput}"""`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: []
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.reply || data.text || '';
        // Extract JSON from response
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as StoryboardScene[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGeneratedStoryboard(parsed.slice(0, targetSceneCount));
            setIsGenerating(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('AI Storyboard live generation fallback used:', e);
    }

    // Fallback template scenes
    const fallbackScenes: StoryboardScene[] = [
      {
        sceneNumber: 1,
        title: 'Himalayan Ridge Dawn',
        summary: 'First light breaking over snowbound Himalayan peaks, golden crests emerging from soft violet mist.',
        visualPrompt: 'Cinematic wide drone shot of Mount Everest and Himalayan ridges, golden sunrise rim light, 8k',
        cameraMotion: 'dolly',
        suggestedTransition: 'dissolve',
        estimatedDuration: 5,
        voiceoverDialogue: 'The morning dawn breaks across the roof of the world, bathed in eternal golden light.',
        voiceoverNepali: 'हिमालको चुचुरोमा प्रभातको पहिलो किरण, जहाँ प्रकृतिले स्वर्णिम रूप लिन्छ।',
        textOverlay: 'Roof of the World'
      },
      {
        sceneNumber: 2,
        title: 'Kathmandu Temple Pagodas',
        summary: 'Ancient pagoda courtyards with pigeons fluttering around carved wood pavilions during morning prayers.',
        visualPrompt: 'Kathmandu Durbar Square ancient pagoda temples, golden hour sunlight, fluttering pigeons, hyper-realistic',
        cameraMotion: 'pan_left',
        suggestedTransition: 'slide_left',
        estimatedDuration: 6,
        voiceoverDialogue: 'Centuries of timeless heritage whisper through carved pavilions and ancient streets.',
        voiceoverNepali: 'काठमाडौंका प्राचीन गल्ली र मन्दिरहरूमा बग्ने इतिहासको जीवन्त धुन।',
        textOverlay: 'Heritage & Spirit'
      },
      {
        sceneNumber: 3,
        title: 'Phewa Lake Serenity',
        summary: 'Mirror-still waters of Phewa Lake reflecting Mount Machhapuchhre with traditional colorful rowboats.',
        visualPrompt: 'Calm reflection of Fishtail peak on Phewa Lake Pokhara, colorful wooden boats gently swaying, 4k cinematic',
        cameraMotion: 'zoom_in',
        suggestedTransition: 'zoom_in',
        estimatedDuration: 6,
        voiceoverDialogue: 'Tranquil mountain waters hold the timeless reflection of the sacred Fishtail peak.',
        voiceoverNepali: 'फेवातालको शान्त पानीमा माछापुच्छ्रेको जादुमयी छायाँ।',
        textOverlay: 'Lakes of Pokhara'
      },
      {
        sceneNumber: 4,
        title: 'Warm Himalayan Welcome',
        summary: 'Traditional Namaste greeting from welcoming villagers with warm smiles and steaming butter tea.',
        visualPrompt: 'Portrait of smiling friendly Nepali local in traditional attire, warm golden lighting, 8k cinematic portrait',
        cameraMotion: 'static',
        suggestedTransition: 'fade',
        estimatedDuration: 5,
        voiceoverDialogue: 'Every traveler is received as family with our eternal greeting of Namaste.',
        voiceoverNepali: 'अतिथि देवो भव: हाम्रो न्यानो नेपाली आतिथ्यता र नमस्ते।',
        textOverlay: 'Namaste Nepal'
      },
      {
        sceneNumber: 5,
        title: 'Prayer Flags in High Pass',
        summary: 'Multicolor prayer flags fluttering against windy alpine pass with panoramic peaks in distance.',
        visualPrompt: 'Vibrant Buddhist prayer flags waving in mountain wind against dramatic snow peaks, 4k cinematic',
        cameraMotion: 'pan_right',
        suggestedTransition: 'dissolve',
        estimatedDuration: 5,
        voiceoverDialogue: 'Prayers of peace and compassion carried on mountain winds across the valleys.',
        voiceoverNepali: 'हावामा फहराइरहेका शान्तिका मन्त्र र रंगीबिरंगी लुङदर।',
        textOverlay: 'Breeze of Peace'
      },
      {
        sceneNumber: 6,
        title: 'Twilight Over the Valley',
        summary: 'Gentle dusk settling over valley villages as lanterns illuminate and stars ignite the night sky.',
        visualPrompt: 'Twilight dusk over mountain valley village, warm lantern lights, starry Himalayan sky, cinematic time-lapse',
        cameraMotion: 'dolly',
        suggestedTransition: 'fade',
        estimatedDuration: 6,
        voiceoverDialogue: 'As night falls, the Himalayas sleep beneath a canopy of infinite stars.',
        voiceoverNepali: 'सयौँ ताराहरूको आँगनमा निदाएको शान्त हिमाली उपत्यका।',
        textOverlay: 'Timeless Journey'
      }
    ];

    setGeneratedStoryboard(fallbackScenes.slice(0, targetSceneCount));
    setIsGenerating(false);
  };

  const handleApplyToTimeline = () => {
    if (!generatedStoryboard) return;
    const unsplashPhotos = [
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80'
    ];

    const newScenes: Scene[] = generatedStoryboard.map((s, idx) => ({
      id: `scene_sb_${Date.now()}_${idx}`,
      title: s.title,
      duration: s.estimatedDuration,
      prompt: s.visualPrompt,
      promptNepali: s.voiceoverNepali,
      mediaUrl: unsplashPhotos[idx % unsplashPhotos.length],
      mediaType: 'image',
      aspectRatio: '16:9',
      motion: s.cameraMotion,
      transition: s.suggestedTransition,
      transitionDuration: 0.8,
      textOverlay: s.textOverlay,
      textNepali: s.voiceoverNepali,
      textPosition: 'lower_third',
      textColor: '#FFFFFF',
      textFont: 'devanagari',
      filter: 'cinematic',
      volume: 80,
      colorTag: idx === 0 ? 'a_roll' : idx === 1 ? 'b_roll' : idx === 2 ? 'ai_gen' : 'interview'
    }));

    onApplyStoryboard(newScenes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800/60 shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Script-to-Storyboard Studio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform scripts or story ideas into cinematic multi-scene sequences with visual prompts and localized narration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Starter Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Script Inspiration Presets
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Click to autofill</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {SCRIPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setScriptInput(preset.text);
                    setSelectedLanguage(preset.lang);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Script Input Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Your Video Script or Concept
            </label>
            <textarea
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition resize-none font-sans"
              placeholder="Paste or write your script, promotional narrative, or article here..."
            />
          </div>

          {/* Controls: Target Language & Scene Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Target Language & Cultural Tone</span>
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer"
              >
                <option value="ne">Nepali (नेपाली - Cultural & Cinematic)</option>
                <option value="hi">Hindi (हिन्दी - Bollywood Cinematic)</option>
                <option value="en">English (Global Professional Documentary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Number of Storyboard Scenes</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{targetSceneCount} Scenes</span>
              </label>
              <div className="flex items-center gap-2">
                {[3, 4, 5, 6].map(count => (
                  <button
                    key={count}
                    onClick={() => setTargetSceneCount(count)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      targetSceneCount === count 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {count} Scenes
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button CTA */}
          <div className="text-center pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !scriptInput.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Storyboard Scenes with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Generate AI Storyboard ({targetSceneCount} Scenes)</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Results Preview */}
          {generatedStoryboard && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-500" />
                  <span>Generated Storyboard Scenes ({generatedStoryboard.length})</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to import to multi-track timeline
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {generatedStoryboard.map((scene, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 hover:border-indigo-400/50 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md font-bold">
                          Scene {scene.sceneNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {scene.estimatedDuration}s
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono uppercase">
                        {scene.cameraMotion.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {scene.title}
                    </h4>
                    
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {scene.summary}
                    </p>

                    {/* Visual Prompt tag */}
                    <div className="text-[11px] bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Prompt: </span>
                      {scene.visualPrompt}
                    </div>

                    {/* Localized Dialogue */}
                    {scene.voiceoverNepali && (
                      <div className="pt-1">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-serif italic bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          "{scene.voiceoverNepali}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          {generatedStoryboard && (
            <button
              onClick={handleApplyToTimeline}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-semibold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Load Storyboard into Timeline ({generatedStoryboard.length} Scenes)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
