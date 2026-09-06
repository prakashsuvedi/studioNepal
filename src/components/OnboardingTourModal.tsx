import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { StudioTab } from '../types';
import { 
  Sparkles, 
  Bot, 
  Film, 
  Layers, 
  Mic, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Play, 
  Video, 
  Sliders, 
  Type, 
  Zap,
  Globe,
  Camera,
  Check
} from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: StudioTab) => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFinish = (targetTab?: StudioTab) => {
    if (dontShowAgain) {
      localStorage.setItem('nepalai_tour_completed', 'true');
    }
    onClose();
    if (targetTab) {
      onNavigateTab(targetTab);
    }
  };

  const steps = [
    {
      stepNumber: 1,
      title: language === 'ne' 
        ? 'नेपालAI स्टुडियोमा स्वागत छ!' 
        : language === 'hi' 
        ? 'नेपालAI स्टूडियो में आपका स्वागत है!' 
        : 'Welcome to NepalAI Studio!',
      subtitle: language === 'ne'
        ? 'तपाईंको विचारलाई सेकेन्डमै भाइरल भिडियोमा बदल्ने आधुनिक AI प्लेटफर्म'
        : language === 'hi'
        ? 'अपने विचारों को वायरल वीडियो में बदलने वाला पहला संपूर्ण AI प्लेटफॉर्म'
        : "Nepal's First Full-Stack AI Creation Platform for YouTube, Reels & Commercials",
      icon: Sparkles,
      color: 'from-rose-600 to-indigo-600',
      illustration: (
        <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-4 flex flex-col justify-between overflow-hidden border border-indigo-500/30 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[11px] font-bold text-rose-400 font-mono uppercase tracking-wider">All-In-One Studio</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
              Sora-2 • GPT-4o • SpeechT5
            </span>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs text-white text-xs font-semibold border border-white/20">
              <Film className="w-4 h-4 text-rose-400" />
              <span>Idea ➔ Script ➔ 4K Video ➔ Voiceover ➔ Export</span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              No technical video editing skills required. Let AI handle scripting, camera motion, voice synthesis, and subtitles.
            </p>
          </div>

          <div className="flex items-center justify-around text-[10px] font-mono text-slate-400 border-t border-white/10 pt-2">
            <span>🇳🇵 Nepali Neural Voice</span>
            <span>•</span>
            <span>🎥 4K Video Generation</span>
            <span>•</span>
            <span>📝 Instant Storyboard</span>
          </div>
        </div>
      ),
      highlights: [
        'Integrated with OpenAI Sora-2, Azure gpt-image-1.5, and SpeechT5',
        'Automatic storyboard generation with proven 3-second retention hooks',
        'Full Devanagari Unicode support across all scripts and subtitles',
      ],
    },
    {
      stepNumber: 2,
      title: language === 'ne' 
        ? 'हाम्रो AI (HamroAI) को-पाइलट' 
        : language === 'hi' 
        ? 'हमरो AI को-पायलट का उपयोग' 
        : 'HamroAI: Cultural Co-Pilot',
      subtitle: language === 'ne'
        ? 'नेपाली, रोमन-नेपाली र हिन्दीमा स्क्रिप्ट तथा भिडियो कन्टेन्ट तयार गर्नुहोस्'
        : language === 'hi'
        ? 'नेपाली, हिंदी और अंग्रेजी में स्क्रिप्ट और आइडियाज जनरेट करें'
        : 'Generate High-Converting Scripts in Nepali, Romanized Nepali, Hindi & English',
      icon: Bot,
      color: 'from-amber-500 to-rose-600',
      illustration: (
        <div className="relative w-full aspect-video rounded-2xl bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border border-amber-500/30">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Bot className="w-4 h-4" />
              <span>HamroAI (GPT-4o)</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
              Nepali Devanagari Active
            </span>
          </div>

          <div className="space-y-2 py-2">
            <div className="bg-slate-900 rounded-lg p-2.5 text-xs text-slate-300 border border-slate-800">
              <span className="text-amber-400 font-bold">User: </span>
              पोखराको फेवातालको बारेमा एउटा ३० सेकेन्डको भाइरल रिल बनाइदेऊ।
            </div>
            <div className="bg-amber-950/40 rounded-lg p-2.5 text-xs text-amber-200 border border-amber-800/60 font-mono text-[11px]">
              <span className="text-rose-400 font-bold">HamroAI: </span>
              ✨ ४ दृश्यको स्टोरीबोर्ड तयार छ! [हुक ➔ शान्त ताल ➔ हिमालको छाया ➔ CTA]
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <div className="px-2.5 py-1 rounded bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-[10px] flex items-center gap-1 shadow">
              <span>Send to Video Studio</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      ),
      highlights: [
        'Powered by Azure OpenAI GPT-4o with deep Nepal cultural & geographical knowledge',
        'Built-in Romanized Nepali to Devanagari transliteration engine',
        'One-click "Send to Video Studio" automatically populates timeline scenes',
      ],
    },
    {
      stepNumber: 3,
      title: language === 'ne' 
        ? 'सोरा-२ भिडियो र तस्वीर इन्जिन' 
        : language === 'hi' 
        ? 'सोरा-२ वीडियो और इमेज इंजन' 
        : 'Sora-2 Video & Visual Engines',
      subtitle: language === 'ne'
        ? 'सिनेम्याटिक क्यामेरा मुभमेन्ट र ९:१६ वा १६:९ फ्रेममा भिडियो बनाउनुहोस्'
        : language === 'hi'
        ? 'कैमरा मोशन और विभिन्न आस्पेक्ट रेशियो में 4K विजुअल्स बनाएं'
        : 'Create Photorealistic 4K Visuals with Cinematic Camera Motions',
      icon: Video,
      color: 'from-indigo-600 to-rose-600',
      illustration: (
        <div className="relative w-full aspect-video rounded-2xl bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border border-indigo-500/30">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-indigo-400">
              <Camera className="w-4 h-4" />
              <span>Camera Motion & Framing</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <span className="px-1.5 py-0.5 bg-slate-800 rounded">9:16 Vertical</span>
              <span className="px-1.5 py-0.5 bg-slate-800 rounded">16:9 Landscape</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 py-3">
            {[
              { name: 'Pan Left', icon: '⟵' },
              { name: 'Zoom In', icon: '⊕' },
              { name: 'Dolly Forward', icon: '▲' },
              { name: 'Orbit View', icon: '↻' },
            ].map((m, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-center">
                <span className="text-base text-indigo-400 block font-mono">{m.icon}</span>
                <span className="text-[10px] text-slate-300 font-semibold">{m.name}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <span>✨ Prompt Enhancement: Translates Nepali to English for optimal AI rendering</span>
          </div>
        </div>
      ),
      highlights: [
        'Native 9:16 support for TikTok & Instagram Reels, 16:9 for YouTube',
        'Choose from Pan, Zoom In/Out, Dolly, and 360-degree Orbit camera motions',
        'Preview jobs with live progress bar and direct proxy video streaming',
      ],
    },
    {
      stepNumber: 4,
      title: language === 'ne' 
        ? 'मल्टी-ट्र्याक भिडियो टाइमलाइन सम्पादक' 
        : language === 'hi' 
        ? 'मल्टी-ट्रैक वीडियो टाइमलाइन एडिटर' 
        : 'Multi-Track Timeline Editor',
      subtitle: language === 'ne'
        ? 'दृश्यहरू मिलाउनुहोस्, ट्रान्जिसन थप्नुहोस् र वास्तविक समयमा प्रिभ्यू हेर्नुहोस्'
        : language === 'hi'
        ? 'सीन एडिट करें, ट्रांजिशन जोड़ें और लाइव प्रीव्यू देखें'
        : 'Arrange Scenes, Add Cinematic Transitions & Sync Audio Effortlessly',
      icon: Layers,
      color: 'from-emerald-600 to-indigo-600',
      illustration: (
        <div className="relative w-full aspect-video rounded-2xl bg-slate-950 p-3.5 flex flex-col justify-between overflow-hidden border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Multi-Track Engine</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">00:14.2 / 00:30.0</span>
          </div>

          {/* Simulated Timeline Tracks */}
          <div className="space-y-1.5 py-1 font-mono text-[10px]">
            {/* Visual Track */}
            <div className="flex items-center gap-1.5">
              <span className="w-12 text-slate-400 shrink-0 font-sans text-[9px]">Video Track:</span>
              <div className="flex-1 flex gap-1 h-5">
                <div className="w-1/3 bg-rose-900/80 border border-rose-500 rounded px-1.5 flex items-center justify-between text-white">
                  <span>Scene 1</span>
                  <span className="text-[8px] text-rose-300">Dissolve</span>
                </div>
                <div className="w-1/3 bg-indigo-900/80 border border-indigo-500 rounded px-1.5 flex items-center justify-between text-white">
                  <span>Scene 2</span>
                  <span className="text-[8px] text-indigo-300">Flash</span>
                </div>
                <div className="w-1/3 bg-amber-900/80 border border-amber-500 rounded px-1.5 flex items-center justify-between text-white">
                  <span>Scene 3</span>
                  <span className="text-[8px] text-amber-300">Fade</span>
                </div>
              </div>
            </div>

            {/* Voiceover Track */}
            <div className="flex items-center gap-1.5">
              <span className="w-12 text-slate-400 shrink-0 font-sans text-[9px]">Voice Track:</span>
              <div className="flex-1 bg-emerald-950 border border-emerald-600 rounded h-4 px-2 flex items-center text-emerald-300 text-[9px]">
                🎙️ SpeechT5 Neural Voiceover (नेपाली आवाज)
              </div>
            </div>

            {/* Subtitles Track */}
            <div className="flex items-center gap-1.5">
              <span className="w-12 text-slate-400 shrink-0 font-sans text-[9px]">Subtitles:</span>
              <div className="flex-1 bg-sky-950 border border-sky-600 rounded h-4 px-2 flex items-center text-sky-300 text-[9px]">
                💬 Auto-Karaoke Devanagari Overlay
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 flex items-center justify-between">
            <span>⚡ Drag clips to reorder • Double click to edit duration & text</span>
            <span className="text-emerald-400 font-bold">100% In-Browser Preview</span>
          </div>
        </div>
      ),
      highlights: [
        'Drag-and-drop scene reordering with individual duration scrubbers',
        '12+ transitions: Dissolve, Wipe, Slide, Zoom, Flash White, Blur Dissolve',
        'Live playback scrubber with precise second-by-second frame display',
      ],
    },
    {
      stepNumber: 5,
      title: language === 'ne' 
        ? 'आवाज डबिंग र सबटाइटल (Voice & Subtitles)' 
        : language === 'hi' 
        ? 'वॉइसओवर और देवनागरी सबटाइटल' 
        : 'Neural Voiceover & Devanagari Subtitles',
      subtitle: language === 'ne'
        ? 'नेपाली स्पिकर प्रोफाइल र आकर्षक सबटाइटलले भ्युअर्सलाई भिडियोको अन्त्यसम्म बाँध्छ'
        : language === 'hi'
        ? 'आकर्षक आवाज और सबटाइटल से दर्शकों का ध्यान बांध कर रखें'
        : 'Retain 80%+ Viewers with Authentic Accents & Synchronized Overlays',
      icon: Mic,
      color: 'from-rose-600 to-amber-500',
      illustration: (
        <div className="relative w-full aspect-video rounded-2xl bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border border-rose-500/30">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-bold text-rose-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Acoustic Neural Synthesis (SpeechT5)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
              WAV Audio Buffer Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 py-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <span className="text-[11px] font-bold text-white">Nepali Profiles:</span>
              <div className="text-[10px] text-slate-300 space-y-0.5">
                <div>• आकाश (Aakash) - Clear Narration</div>
                <div>• प्रीति (Preeti) - Warm Commercial</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <span className="text-[11px] font-bold text-white">Hindi & English Profiles:</span>
              <div className="text-[10px] text-slate-300 space-y-0.5">
                <div>• कबीर (Kabir) - Deep Podcast</div>
                <div>• सुनिता (Sunita) - Expressive Story</div>
              </div>
            </div>
          </div>

          {/* Subtitle Banner Preview */}
          <div className="bg-black/90 rounded-lg p-2 border border-rose-500/40 text-center">
            <span className="text-xs font-black text-amber-300 tracking-wide font-sans">
              "बौद्धनाथ स्तुपाको साँझको सुनौलो किरण..."
            </span>
          </div>
        </div>
      ),
      highlights: [
        'Realistic acoustic voice generation via Hugging Face SpeechT5 neural engine',
        'Automatic syllable timing and karaoke subtitle highlighting',
        'Export directly in 1080p Full HD or 4K Ultra HD ready for monetization',
      ],
    },
  ];

  const current = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Top Progress & Close Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${current.color} text-white flex items-center justify-center shadow-xs`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Interactive Studio Tour • {currentStep + 1} / {steps.length}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStep
                        ? 'w-6 bg-rose-600'
                        : idx < currentStep
                        ? 'w-3 bg-emerald-500'
                        : 'w-3 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleFinish()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {current.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {current.subtitle}
            </p>
          </div>

          {/* Interactive Illustration */}
          <div>{current.illustration}</div>

          {/* Key Bullet Highlights */}
          <div className="space-y-2 pt-1">
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span>Don't show tour again</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isFirst && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFinish('hamro_ai')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Launch HamroAI</span>
                </button>
                <button
                  onClick={() => handleFinish('video_studio')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Open Video Studio</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
