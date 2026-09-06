import React, { useState } from 'react';
import { VIRAL_TEMPLATES, ViralTemplate, ViralStoryboardScene } from '../data/viralTemplates';
import { useLanguage } from '../context/LanguageContext';
import { 
  Sparkles, 
  Play, 
  Flame, 
  Clock, 
  Layers, 
  Music, 
  ArrowRight, 
  Check, 
  Film, 
  X,
  Volume2,
  Tv,
  Share2,
  TrendingUp,
  Camera,
  Smartphone
} from 'lucide-react';

interface ViralTemplatesSectionProps {
  onSelectTemplate: (template: ViralTemplate) => void;
  onOpenAuth?: () => void;
}

export const ViralTemplatesSection: React.FC<ViralTemplatesSectionProps> = ({
  onSelectTemplate,
  onOpenAuth,
}) => {
  const { language } = useLanguage();
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'tiktok' | 'reels' | 'shorts' | 'commercial'>('all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'standard' | 'premium'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<ViralTemplate | null>(null);

  const filteredTemplates = VIRAL_TEMPLATES.filter((tpl) => {
    const matchesPlatform = selectedPlatform === 'all' || tpl.category === selectedPlatform;
    const matchesTier = selectedTier === 'all' || (tpl.tier || 'standard') === selectedTier;
    return matchesPlatform && matchesTier;
  });

  const getLocalizedTitle = (tpl: ViralTemplate) => {
    if (language === 'ne') return tpl.titleNe;
    if (language === 'hi') return tpl.titleHi;
    return tpl.title;
  };

  const getLocalizedDesc = (tpl: ViralTemplate) => {
    if (language === 'ne') return tpl.descriptionNe;
    if (language === 'hi') return tpl.descriptionHi;
    return tpl.description;
  };

  return (
    <section id="viral-templates-library" className="py-16 sm:py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold tracking-tight shadow-xs">
            <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>
              {language === 'ne' 
                ? 'भाइरल स्टोरीबोर्ड टेम्प्लेट्स लाइब्रेरी' 
                : language === 'hi' 
                ? 'वायरल स्टोरीबोर्ड टेम्पलेट्स लाइब्रेरी' 
                : 'Viral Storyboard Templates Library'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'ne' ? (
              <>टिकटक, रिल्स र शर्ट्सका लागि <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-500 to-indigo-600">प्रुभन भाइरल स्ट्रक्चरहरू</span></>
            ) : language === 'hi' ? (
              <>टिकटॉक, रील्स और शॉर्ट्स के लिए <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-500 to-indigo-600">साबित वायरल फॉर्मूले</span></>
            ) : (
              <>Pre-Built Storyboards for <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-500 to-indigo-600">TikTok, Reels & Shorts</span></>
            )}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {language === 'ne'
              ? 'खाली स्क्रिनबाट सुरु गर्नु पर्दैन! ३-सेकेन्ड हुक, सिनेमाटिक क्यामेरा मुभमेन्ट र देवनागरी सबटाइटल सहितको रेडी-टु-युज स्टोरीबोर्ड १ क्लिकमै स्टुडियोमा लोड गर्नुहोस्।'
              : language === 'hi'
              ? 'खाली स्क्रीन से शुरू करने की जरूरत नहीं! 3-सेकंड हुक, सिनेमैटिक कैमरा मूवमेंट और सबटाइटल वाले रेडी स्टोरीबोर्ड 1 क्लिक में लोड करें।'
              : 'Never stare at a blank timeline. Jumpstart your video with high-retention 3-second hooks, synchronized Devanagari overlays, and camera motions proven to maximize watch time.'}
          </p>

          {/* Platform Filter Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: language === 'ne' ? 'सबै टेम्प्लेट्स (All)' : language === 'hi' ? 'सभी टेम्पलेट्स' : 'All Formats', icon: Sparkles },
              { id: 'tiktok', label: 'TikTok (9:16)', icon: Smartphone },
              { id: 'reels', label: 'Instagram Reels (9:16)', icon: Film },
              { id: 'shorts', label: 'YouTube Shorts (9:16)', icon: Play },
              { id: 'commercial', label: language === 'ne' ? 'व्यापारिक विज्ञापन' : language === 'hi' ? 'बिजनेस ऐड' : 'Business Commercial', icon: Tv },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedPlatform === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPlatform(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tier Filter Toggle (Standard vs Premium) */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Tier:</span>
            {[
              { id: 'all', label: 'All Tiers' },
              { id: 'standard', label: 'Standard (Free)' },
              { id: 'premium', label: '⭐ Premium VIP' }
            ].map(tierOption => {
              const isTierActive = selectedTier === tierOption.id;
              return (
                <button
                  key={tierOption.id}
                  onClick={() => setSelectedTier(tierOption.id as any)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                    isTierActive
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-bold'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tierOption.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Single Line of Standard & Premium Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredTemplates.slice(0, 4).map((template) => {
            const localizedTitle = getLocalizedTitle(template);
            const localizedDesc = getLocalizedDesc(template);

            return (
              <div
                key={template.id}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/60 dark:hover:border-rose-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Visual Cover Banner with Overlay Badges */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                  <img
                    src={template.coverImage}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0.3';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {template.tier === 'premium' ? (
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        PREMIUM
                      </span>
                    ) : (
                      <span className="bg-emerald-600/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                        STANDARD
                      </span>
                    )}
                    <span className={`text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs ${template.badgeColor}`}>
                      {template.badge}
                    </span>
                    <span className="bg-black/70 backdrop-blur-xs text-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                      {template.aspectRatio}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-500/30">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{template.viralityScore}%</span>
                  </div>

                  {/* Bottom Preview Info */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-slate-300 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{template.targetDuration}s runtime</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>{template.scenes.length} Beats</span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        {template.categoryLabel}
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium">
                        Hook: {template.hookRetentionRate}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition leading-snug line-clamp-1">
                      {localizedTitle}
                    </h3>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {localizedDesc}
                    </p>

                    {/* Compact Scene Sequence Pills */}
                    <div className="pt-1 flex items-center gap-1 overflow-hidden">
                      {template.scenes.slice(0, 3).map((sc, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-100 dark:bg-slate-800/80 rounded px-1.5 py-0.5 border border-slate-200/60 dark:border-slate-700/50 text-[9px] text-slate-600 dark:text-slate-400 truncate max-w-[70px]"
                        >
                          S{idx + 1}: {sc.duration}s
                        </div>
                      ))}
                      {template.scenes.length > 3 && (
                        <span className="text-[9px] text-slate-500 font-mono">+{template.scenes.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Preview & Load into Studio */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                      title="Inspect storyboard beats"
                    >
                      <Film className="w-3 h-3" />
                      <span>{language === 'ne' ? 'हेर्नुहोस्' : language === 'hi' ? 'देखें' : 'Inspect'}</span>
                    </button>

                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{language === 'ne' ? 'लोड गर्नुहोस्' : language === 'hi' ? 'उपयोग करें' : 'Use'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Studio Explore Banner Beneath Single Row */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {language === 'ne'
                  ? 'थप ५०+ भाइरल स्ट्रक्चर, एजेन्सी एड्स र अडियो टेम्प्लेट्स भिडियो स्टुडियो भित्र उपलब्ध छन्'
                  : language === 'hi'
                  ? 'अतिरिक्त 50+ वायरल स्ट्रक्चर, ऐड और ऑडियो टेम्पलेट्स वीडियो स्टूडियो के अंदर उपलब्ध हैं'
                  : 'Full catalog of 20+ viral structures, commercial storyboards & audio templates available inside Studio'}
              </p>
              <p className="text-[11px] text-slate-400">
                {language === 'ne'
                  ? 'ल्यान्डिङ पेजलाई सफा राख्न बाँकी टेम्प्लेट्स स्टुडियोको टाइमलाइनमा १-क्लिकमा लोड गर्न सकिन्छ।'
                  : language === 'hi'
                  ? 'लैंडिंग पेज साफ रखने के लिए बाकी सभी टेम्पलेट्स स्टूडियो टाइमलाइन में 1-क्लिक में लोड किए जा सकते हैं।'
                  : 'Curated for clean browsing. Access complete niche libraries directly on your studio timeline.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTemplate(filteredTemplates[0] || VIRAL_TEMPLATES[0])}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>{language === 'ne' ? 'स्टुडियोमा सबै टेम्प्लेट्स खोल्नुहोस्' : language === 'hi' ? 'स्टूडियो में सभी टेम्पलेट्स खोलें' : 'Open All Templates in Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Storyboard Inspection & Breakdown Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {getLocalizedTitle(previewTemplate)}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{previewTemplate.categoryLabel}</span>
                    <span>•</span>
                    <span>{previewTemplate.targetDuration}s total</span>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{previewTemplate.hookRetentionRate}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scene Beats Detailed List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Creator Hook Advice Box */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">Retention Strategy: </span>
                  <span className="text-amber-800 dark:text-amber-300">{previewTemplate.viralHookTip}</span>
                </div>
              </div>

              {/* Music Recommendation */}
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <Music className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold">Soundtrack Suggestion: </span>
                    <span>{previewTemplate.audioSuggestion.title}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                  {previewTemplate.audioSuggestion.mood}
                </span>
              </div>

              {/* Scene List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Scene-by-Scene Storyboard Breakdown ({previewTemplate.scenes.length} Scenes):
                </div>

                {previewTemplate.scenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {scene.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                          {scene.duration}s
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 uppercase">
                          {scene.motion}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 uppercase">
                          {scene.transition}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
                      <span className="text-slate-400 font-sans">Prompt: </span>
                      {scene.prompt}
                    </div>

                    {scene.textOverlay && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
                          Devanagari Subtitle
                        </span>
                        <span className="font-semibold truncate">{scene.textOverlay}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const tpl = previewTemplate;
                  setPreviewTemplate(null);
                  onSelectTemplate(tpl);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Storyboard into Video Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
