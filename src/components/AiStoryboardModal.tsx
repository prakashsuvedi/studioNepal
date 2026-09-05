import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  BookOpen, 
  ArrowRight, 
  Check, 
  RefreshCw,
  Sliders,
  Globe2
} from 'lucide-react';
import { Scene, StoryboardScene, CameraMotion, TransitionType } from '../types';

interface AiStoryboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStoryboard: (newScenes: Scene[]) => void;
}

export const AiStoryboardModal: React.FC<AiStoryboardModalProps> = ({
  isOpen,
  onClose,
  onApplyStoryboard
}) => {
  const [scriptInput, setScriptInput] = useState<string>(
    'Nepal is a mesmerizing country cradled in the Himalayas. From the bustling ancient alleys of Kathmandu Durbar Square to the tranquil crystal waters of Phewa Lake in Pokhara, and the majestic sunrise over Mount Everest, every corner tells a timeless story of nature, spirituality, and vibrant culture.'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<'ne' | 'hi' | 'en'>('ne');
  const [targetSceneCount, setTargetSceneCount] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<StoryboardScene[] | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const mockStoryboard: StoryboardScene[] = [
        {
          sceneNumber: 1,
          title: 'Kathmandu Durbar Square Heritage',
          summary: 'Drone shot over ancient Newari temples and bustling pagoda courtyards in Kathmandu.',
          visualPrompt: 'Cinematic drone shot of Kathmandu Durbar Square ancient pagodas, golden hour warm lighting, 4K',
          cameraMotion: 'pan_left',
          suggestedTransition: 'dissolve',
          estimatedDuration: 5,
          voiceoverDialogue: 'Welcome to Kathmandu, the vibrant heart of the Himalayas where centuries of heritage breathe.',
          voiceoverNepali: 'काठमाडौंको प्राचीन मन्दिर र ऐतिहासिक प्राङ्गणमा स्वागत छ।',
          textOverlay: 'Kathmandu Heritage'
        },
        {
          sceneNumber: 2,
          title: 'Pokhara Phewa Lake Serenity',
          summary: 'Stunning reflection of Machhapuchhre Fishtail peak on the tranquil waters of Phewa Lake.',
          visualPrompt: 'Calm blue waters of Phewa Lake in Pokhara mirroring Mount Machhapuchhre fishtail peak, cinematic',
          cameraMotion: 'zoom_in',
          suggestedTransition: 'slide_left',
          estimatedDuration: 6,
          voiceoverDialogue: 'Find inner peace beside the pristine waters of Phewa Lake with the majestic Fishtail peak.',
          voiceoverNepali: 'फेवातालको शान्त पानी र माछापुच्छ्रे हिमालको मनमोहक दृશ्य।',
          textOverlay: 'Pokhara Serenity'
        },
        {
          sceneNumber: 3,
          title: 'Everest Majestic Sunrise',
          summary: 'Golden morning light illuminating the snowy summit of Mount Everest and high Himalayan ranges.',
          visualPrompt: 'Mount Everest golden sunrise peak illumination above clouds, cinematic 8K hyper-detailed',
          cameraMotion: 'dolly',
          suggestedTransition: 'zoom_in',
          estimatedDuration: 6,
          voiceoverDialogue: 'Witness the breathtaking dawn illuminating the apex of the world, Mount Everest.',
          voiceoverNepali: 'विश्वको सर्वोच्च शिखर सगरमाथामा सूर्योदयको स्वर्णिम किरण।',
          textOverlay: 'Roof of the World'
        },
        {
          sceneNumber: 4,
          title: 'Warm Nepali Hospitality',
          summary: 'Friendly local smiling with traditional Namaste greeting in a hillside mountain village.',
          visualPrompt: 'Friendly local Nepali elder smiling in traditional mountain village, warm golden lighting portrait',
          cameraMotion: 'static',
          suggestedTransition: 'fade',
          estimatedDuration: 5,
          voiceoverDialogue: 'Experience the warm, timeless hospitality of our people who welcome every traveler like family.',
          voiceoverNepali: 'अतिथि देव भव: हाम्रो न्यानो आतिथ्यता।',
          textOverlay: 'Namaste Nepal'
        }
      ];
      setGeneratedStoryboard(mockStoryboard.slice(0, targetSceneCount));
    }, 1500);
  };

  const handleApplyToTimeline = () => {
    if (!generatedStoryboard) return;
    const newScenes: Scene[] = generatedStoryboard.map((s, idx) => ({
      id: `scene_sb_${Date.now()}_${idx}`,
      title: s.title,
      duration: s.estimatedDuration,
      prompt: s.visualPrompt,
      promptNepali: s.voiceoverNepali,
      mediaUrl: idx % 2 === 0 
        ? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=80',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Script-to-Storyboard Generator
              </h2>
              <p className="text-xs text-slate-400">Summarize long user input scripts into concise, storyboard-ready scene descriptions for VideoStudioView</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Paste Your Script or Article Text
            </label>
            <textarea
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none font-sans"
              placeholder="Enter your script, promotional text, or article here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Language & Tone
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ne">Nepali (नेपाली - Cultural & Cinematic)</option>
                <option value="hi">Hindi (हिन्दी - Bollywood Cinematic)</option>
                <option value="en">English (Global Professional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Number of Storyboard Scenes: {targetSceneCount}
              </label>
              <div className="flex items-center gap-2">
                {[3, 4, 5, 6].map(count => (
                  <button
                    key={count}
                    onClick={() => setTargetSceneCount(count)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                      targetSceneCount === count 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {count} Scenes
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !scriptInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Storyboard Scenes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Storyboard</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Results Preview */}
          {generatedStoryboard && (
            <div className="mt-6 border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Generated Storyboard Scenes ({generatedStoryboard.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedStoryboard.map((scene, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-bold">
                        Scene {scene.sceneNumber} ({scene.estimatedDuration}s)
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{scene.cameraMotion}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{scene.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{scene.summary}</p>
                    {scene.voiceoverNepali && (
                      <p className="text-xs text-indigo-300/90 mt-2 font-serif italic">"{scene.voiceoverNepali}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition">
            Cancel
          </button>
          {generatedStoryboard && (
            <button
              onClick={handleApplyToTimeline}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-medium transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Load Storyboard into Timeline</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
