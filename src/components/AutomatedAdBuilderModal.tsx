import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  LayoutTemplate, 
  Megaphone, 
  Briefcase, 
  ShoppingBag, 
  Coffee, 
  Mic, 
  Home, 
  Mountain, 
  Check, 
  Wand2, 
  Layers, 
  Palette, 
  Upload, 
  Play, 
  Download,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { BrandAdSpec, BrandAdStoryboard, BrandAdScene, AdCategoryPreset, Scene, AudioTrack } from '../types';

interface AutomatedAdBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployAdToTimeline: (scenes: Scene[], audioTrack?: AudioTrack) => void;
  lockedCharacterToken?: string;
}

const CATEGORY_PRESETS: { id: AdCategoryPreset; label: string; icon: React.ReactNode; defaultHook: string; defaultProp: string }[] = [
  {
    id: 'tech_product_launch',
    label: 'Tech / SaaS Launch',
    icon: <Sparkles className="w-4 h-4" />,
    defaultHook: 'Stop wasting hours on complex legacy creative software.',
    defaultProp: 'Generate cinema-grade Sora-2 videos with 100% character consistency in under 30 seconds.'
  },
  {
    id: 'food_hospitality',
    label: 'Restaurant & Dining',
    icon: <Coffee className="w-4 h-4" />,
    defaultHook: 'Craving authentic taste made from organic Himalayan herbs?',
    defaultProp: 'Experience Kathmandu’s highest-rated artisan dining with panoramic terrace views.'
  },
  {
    id: 'ecommerce_flash_sale',
    label: 'E-Commerce Flash Sale',
    icon: <ShoppingBag className="w-4 h-4" />,
    defaultHook: 'Mega Dashain & Tihar Festive Flash Sale is LIVE!',
    defaultProp: 'Enjoy up to 60% OFF all premium handcrafted goods with free nationwide express delivery.'
  },
  {
    id: 'podcast_reel_highlight',
    label: 'Podcast & Creator Reel',
    icon: <Mic className="w-4 h-4" />,
    defaultHook: 'The single most important mindset shift every founder needs.',
    defaultProp: 'Full episode dropping this Friday on YouTube, Spotify, and Apple Podcasts.'
  },
  {
    id: 'tourism_himalaya',
    label: 'Himalaya Travel & Trekking',
    icon: <Mountain className="w-4 h-4" />,
    defaultHook: 'Everest Base Camp Trek 2026: Book Your Dream Expedition.',
    defaultProp: 'Certified Sherpa guides, luxury eco-lodges, and helicopter return included.'
  },
  {
    id: 'real_estate_luxury',
    label: 'Luxury Real Estate',
    icon: <Home className="w-4 h-4" />,
    defaultHook: 'Modern penthouse living overlooking the valley skyline.',
    defaultProp: 'Exclusive 4-bedroom smart duplexes with rooftop infinity pool and 24/7 concierge.'
  },
  {
    id: 'freelance_agency_pitch',
    label: 'Agency & Freelancer Pitch',
    icon: <Briefcase className="w-4 h-4" />,
    defaultHook: 'Scale your business with high-converting AI creative campaigns.',
    defaultProp: 'We deliver 10x ROI for fast-growing brands across digital social channels.'
  }
];

export const AutomatedAdBuilderModal: React.FC<AutomatedAdBuilderModalProps> = ({
  isOpen,
  onClose,
  onDeployAdToTimeline,
  lockedCharacterToken,
}) => {
  // Brand Ad Specification State
  const [companyName, setCompanyName] = useState('Hamro Brands Co.');
  const [category, setCategory] = useState<AdCategoryPreset>('tech_product_launch');
  const [topicHook, setTopicHook] = useState(CATEGORY_PRESETS[0].defaultHook);
  const [coreValueProp, setCoreValueProp] = useState(CATEGORY_PRESETS[0].defaultProp);
  const [callToActionText, setCallToActionText] = useState('Claim 50% Off Today');
  const [targetPlatform, setTargetPlatform] = useState<'instagram_reels' | 'youtube_shorts' | 'tiktok' | 'facebook_ad' | 'pinterest_pin'>('instagram_reels');
  const [adLanguage, setAdLanguage] = useState<'en' | 'ne' | 'hi'>('en');

  // 3-Color Brand Palette
  const [primaryColor, setPrimaryColor] = useState('#06b6d4'); // Cyan
  const [accentColor, setAccentColor] = useState('#6366f1');  // Indigo
  const [backgroundColor, setBackgroundColor] = useState('#0f172a'); // Slate 900
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');

  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [generatedStoryboard, setGeneratedStoryboard] = useState<BrandAdStoryboard | null>(null);
  const [deployedSuccess, setDeployedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof CATEGORY_PRESETS[0]) => {
    setCategory(preset.id);
    setTopicHook(preset.defaultHook);
    setCoreValueProp(preset.defaultProp);
  };

  const handleGenerateBrandAd = () => {
    setIsGeneratingAd(true);

    setTimeout(() => {
      const characterPrefix = lockedCharacterToken ? `${lockedCharacterToken} ` : '';

      const scenes: BrandAdScene[] = [
        {
          order: 1,
          sceneTitle: 'The Disruptive Hook (0-4s)',
          durationSeconds: 4,
          visualPrompt: `${characterPrefix}High-energy dynamic opener showcasing: ${topicHook}. Cinematic lighting, bold contrast, 4k ultra-crisp motion.`,
          scriptVoiceover: topicHook,
          headlineOverlay: topicHook.slice(0, 35) + '...',
          captionSubtext: `${companyName} Exclusive`,
          brandBadgeStyle: 'floating_pill',
          suggestedTransition: 'cut'
        },
        {
          order: 2,
          sceneTitle: 'The Solution & Value Prop (4-10s)',
          durationSeconds: 6,
          visualPrompt: `${characterPrefix}Seamless product demonstration revealing: ${coreValueProp}. Elegant clean studio presentation with ${primaryColor} ambient glow.`,
          scriptVoiceover: `${companyName} delivers the solution you need: ${coreValueProp}`,
          headlineOverlay: coreValueProp.slice(0, 40) + '...',
          captionSubtext: 'Built for High Performance',
          brandBadgeStyle: 'lower_third_bar',
          suggestedTransition: 'dissolve'
        },
        {
          order: 3,
          sceneTitle: 'The Call To Action & Brand Card (10-15s)',
          durationSeconds: 5,
          visualPrompt: `High-conversion animated end card with ${companyName} logo, branded ${primaryColor} and ${accentColor} geometric light streams, clean typography.`,
          scriptVoiceover: `${callToActionText}. Visit our official portal now.`,
          headlineOverlay: callToActionText,
          captionSubtext: `👉 ${companyName}`,
          brandBadgeStyle: 'full_end_card',
          suggestedTransition: 'zoom_in'
        }
      ];

      const storyboard: BrandAdStoryboard = {
        id: `ad-${Date.now()}`,
        brandSpec: {
          companyName,
          logoUrl,
          primaryColor,
          accentColor,
          backgroundColor,
          topicHook,
          coreValueProp,
          callToActionText,
          targetPlatform,
          categoryPreset: category,
          language: adLanguage
        },
        totalDurationSeconds: 15,
        aspectRatio: targetPlatform === 'facebook_ad' ? '16:9' : '9:16',
        musicTrackTitle: 'High Energy Modern Kathmandu Lo-Fi Beats',
        scenes,
        createdAt: new Date().toISOString()
      };

      setGeneratedStoryboard(storyboard);
      setIsGeneratingAd(false);
    }, 1600);
  };

  const handleDeployToTimeline = () => {
    if (!generatedStoryboard) return;

    const timelineScenes: Scene[] = generatedStoryboard.scenes.map((s, idx) => ({
      id: `scene-ad-${Date.now()}-${idx}`,
      title: s.sceneTitle,
      duration: s.durationSeconds,
      prompt: s.visualPrompt,
      mediaUrl: idx === 0 
        ? 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=85'
        : idx === 1
        ? 'https://images.unsplash.com/photo-1605640840605-14bd1833a759?w=1200&auto=format&fit=crop&q=85'
        : 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=1200&auto=format&fit=crop&q=85',
      mediaType: 'image',
      aspectRatio: generatedStoryboard.aspectRatio,
      motion: idx === 0 ? 'dolly' : idx === 1 ? 'pan_left' : 'zoom_in',
      transition: s.suggestedTransition,
      transitionDuration: 0.8,
      textOverlay: s.headlineOverlay,
      textPosition: 'lower_third',
      textColor: primaryColor,
      textFont: 'sans',
      textStyle: 'lower_third',
      filter: 'cinematic',
      volume: 85,
      scriptText: s.scriptVoiceover,
      brandLogo: logoUrl ? {
        assetId: 'brand-logo-custom',
        name: companyName,
        url: logoUrl,
        position: 'top-right',
        opacity: 0.9,
        scale: 0.25
      } : undefined,
      colorTag: 'custom',
      tagColor: primaryColor,
    }));

    onDeployAdToTimeline(timelineScenes);
    setDeployedSuccess(true);
    setTimeout(() => {
      setDeployedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-label="Automated Brand Ad & Template Builder"
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Module 4: Automated Ad & Template Builder
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 border border-amber-700/50 text-amber-300">
                  1-Click Multi-Scene Commercials
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-converting video advertisements with your logo, 3-color palette, and platform-optimized storyboards
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

        {/* Content Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Brand Inputs & Palette (5 Cols) */}
          <div className="lg:col-span-5 p-5 border-r border-slate-800/80 bg-slate-950/40 flex flex-col gap-4 overflow-y-auto">
            
            {/* Category Templates */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block">
                Industry & Template Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_PRESETS.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer flex items-center gap-2 ${
                      category === p.id
                        ? 'bg-amber-950/50 border-amber-500/70 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-amber-400">{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Name & Target Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">Brand / Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">Target Platform</label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="instagram_reels">Instagram Reels (9:16)</option>
                  <option value="youtube_shorts">YouTube Shorts (9:16)</option>
                  <option value="tiktok">TikTok Video (9:16)</option>
                  <option value="facebook_ad">Facebook Feed Ad (16:9)</option>
                  <option value="pinterest_pin">Pinterest Video Pin (9:16)</option>
                </select>
              </div>
            </div>

            {/* 3-Color Brand Palette Picker */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>3-Color Brand Identity Palette</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Primary Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Accent Glow</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{accentColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Canvas Dark</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{backgroundColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Topic Hook & Core Value Prop */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">Opening Hook (First 3-4 Seconds)</label>
                <input
                  type="text"
                  value={topicHook}
                  onChange={(e) => setTopicHook(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">Core Value Proposition</label>
                <textarea
                  value={coreValueProp}
                  onChange={(e) => setCoreValueProp(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">Call to Action (CTA)</label>
                <input
                  type="text"
                  value={callToActionText}
                  onChange={(e) => setCallToActionText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Generate Action */}
            <button
              onClick={handleGenerateBrandAd}
              disabled={isGeneratingAd}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Wand2 className={`w-4 h-4 ${isGeneratingAd ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAd ? 'Generating Commercial Storyboard...' : 'Generate 1-Click Brand Ad'}</span>
            </button>
          </div>

          {/* Right Column: Commercial Storyboard Preview & Timeline Deploy (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto">
            {!generatedStoryboard ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-3">
                  <Megaphone className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Instant Automated Commercial Generator</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Set your brand details on the left and click "Generate 1-Click Brand Ad" to automatically assemble a 3-scene high-converting commercial with custom kinetic typography, brand logos, and audio routing.
                </p>
                {lockedCharacterToken && (
                  <div className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Avatar Continuity Injected: {lockedCharacterToken}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Commercial Storyboard ({generatedStoryboard.scenes.length} Scenes • 15s Commercial)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-[11px] font-bold text-amber-300">{companyName}</span>
                  </div>
                </div>

                {/* 3-Scene Ad Breakdown */}
                <div className="space-y-3">
                  {generatedStoryboard.scenes.map((scene, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-900/80 border border-amber-500/50 text-xs font-bold text-amber-200 flex items-center justify-center">
                            {scene.order}
                          </span>
                          <span className="text-xs font-bold text-white">{scene.sceneTitle}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300">
                            ⏱ {scene.durationSeconds}s
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                          Badge: {scene.brandBadgeStyle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[11px] leading-relaxed">
                        {scene.visualPrompt}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-300">Voiceover:</span>
                          <span className="italic">"{scene.scriptVoiceover}"</span>
                        </div>
                        <span className="font-bold" style={{ color: primaryColor }}>
                          {scene.headlineOverlay}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Deploy to Timeline Action */}
            {generatedStoryboard && (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400">
                  Ready to deploy 3-scene brand commercial to NLE timeline
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedStoryboard(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleDeployToTimeline}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-xs font-bold text-white shadow-lg shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer"
                  >
                    {deployedSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Deployed to Timeline!</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4 text-white" />
                        <span>Deploy Brand Ad to NLE Timeline</span>
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
