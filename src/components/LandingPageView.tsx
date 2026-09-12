import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Play, 
  Globe, 
  ChevronRight, 
  Flame, 
  Award, 
  Lock, 
  Bot, 
  QrCode,
  TrendingUp,
  DollarSign,
  Briefcase,
  Building2,
  Users,
  Store,
  Share2,
  Youtube,
  Instagram,
  Check,
  Smartphone,
  BarChart3,
  Rocket,
  Film,
  Star,
  Clock,
  Tv,
  HelpCircle,
  HeartHandshake,
  Megaphone,
  Target,
  Laptop,
  Wand2,
  Camera,
  Compass,
  Sliders,
  Sparkle
} from 'lucide-react';
import { UserSession } from '../types';
import { InteractiveStudioPlayer } from './InteractiveStudioPlayer';
import { ViralTemplatesSection } from './ViralTemplatesSection';
import { ViralTemplate } from '../data/viralTemplates';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LandingPageViewProps {
  user: UserSession | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onLaunchStudio: () => void;
  onLaunchHamroAi?: () => void;
  onSelectPlan: (planId: 'starter' | 'creator' | 'pro_studio' | 'sasta_50_npr' | string) => void;
  onSelectTemplate?: (template: ViralTemplate) => void;
}

type LangMode = 'en' | 'ne' | 'hi';
type PersonaType = 'creators' | 'business' | 'company' | 'freelancer';

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  user,
  onOpenAuth,
  onLaunchStudio,
  onLaunchHamroAi,
  onSelectPlan,
  onSelectTemplate,
}) => {
  const { language, setLanguage } = useLanguage();
  const lang: LangMode = (language === 'ne' || language === 'hi' || language === 'en') ? language : 'en';
  const [heroPrompt, setHeroPrompt] = useState<string>('Cinematic 4K drone shot over Mt. Everest sunrise with golden snow particles');
  const [activePersona, setActivePersona] = useState<PersonaType>('creators');
  const [videoCount, setVideoCount] = useState<number>(15);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pricingConfig, setPricingConfig] = useState<{
    starterNpr: number;
    creatorNpr: number;
    proStudioNpr: number;
  }>({
    starterNpr: 2500,
    creatorNpr: 6500,
    proStudioNpr: 16500,
  });

  const promptSuggestions = [
    { label: '🏔️ Everest Sunrise 4K', text: 'Cinematic 4K drone shot over Mt. Everest sunrise with golden snow particles and dramatic lighting' },
    { label: '🛕 Kathmandu Night Drone', text: 'Kathmandu Dashain festival night, thousands of oil lamps and floating lanterns in 60fps slow motion' },
    { label: '📱 9:16 Viral Shorts Ad', text: 'Fast-paced 9:16 YouTube Short product commercial for Himalayan organic honey with kinetic subtitles' },
    { label: '☕ Organic Tea Commercial', text: 'Artisanal Nepali mountain tea plantation in Ilam, morning mist rising with peaceful ambient breeze' },
    { label: '🌌 Cyberpunk Nepal 2099', text: 'Futuristic Cyberpunk Kathmandu in 2099 with holographic temples and flying electric vehicles in neon rain' },
  ];

  const handleHeroGenerate = () => {
    if (user) {
      onLaunchStudio();
    } else {
      onSelectPlan('free');
    }
  };

  const [showFloatingCta, setShowFloatingCta] = useState<boolean>(false);

  // Persistent floating CTA visibility trigger on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setShowFloatingCta(true);
      } else {
        setShowFloatingCta(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Subtle scroll-triggered fade-in animations on feature cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6', 'translate-y-8');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    const cards = document.querySelectorAll('.scroll-fade-in');
    cards.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [activePersona, lang]);

  useEffect(() => {
    fetch('/api/payment/pricing-config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setPricingConfig({
            starterNpr: data.config.starterNpr || 2500,
            creatorNpr: data.config.creatorNpr || 6500,
            proStudioNpr: data.config.proStudioNpr || 16500,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Multi-lingual Text Matrix for Global, Nepali and Hindi visitors
  const t = {
    en: {
      badge: "Next-Gen AI Video Studio • Azure Sora-2 & Neural Voice",
      heroTitle1: "Create Viral AI Videos",
      heroTitleHighlight: "In Seconds, Not Days.",
      heroSubtitle: "Generate 4K cinematic Sora-2 motion, authentic Nepali neural voiceovers, Devanagari auto-subtitles, and high-converting ads with zero editing skills.",
      sastaCta: "Micro-Pass (रू 50)",
      freeTrialCta: "Start Creating Free",
      launchStudioCta: "Launch Video Studio",
      hamroAiCta: "HamroAI Chat",
      viralStat: "1,250,000+ views generated on YouTube, Reels & TikTok",
      agencySavedStat: "$0 Spent on Costly Video Agencies",
      personaTitle: "Who is NepalAI Studio Built For?",
      personaSubtitle: "Tailored AI pipelines designed to turn your screen time into viral fame, client cashflow, and business growth.",
      stepTitle: "From Idea to Viral Cashflow in 4 Easy Steps",
      stepSubtitle: "No camera, no expensive studio, and no technical editing skills needed.",
      calcTitle: "Estimate Your Monthly Earning & Savings Potential",
      calcSubtitle: "See how creating consistent videos with NepalAI studio unlocks real revenue.",
    },
    ne: {
      badge: "नेपालको #1 एआई भिडियो स्टुडियो • सोरा-२ र न्युरल आवाज",
      heroTitle1: "भाइरल एआई भिडियो",
      heroTitleHighlight: "मिनेटमै तयार, सिधै आम्दानी।",
      heroSubtitle: "सोरा-२ भिडियो, नेपाली न्युरल आवाज, मुक्ता फन्ट सबटाइटल र आकर्षक विज्ञापनहरू १-क्लिकमै बनाउनुहोस्। कुनै क्यामरा वा एडिटिङ ज्ञान चाहिँदैन।",
      sastaCta: "सस्तो पास (रू ५० मात्र)",
      freeTrialCta: "निःशुल्क सुरु गर्नुहोस्",
      launchStudioCta: "भिडियो स्टुडियो खोल्नुहोस्",
      hamroAiCta: "हाम्रो एआई च्याट",
      viralStat: "१२ लाख ५० हजार भन्दा बढी युट्युब र रील्स भ्युज",
      agencySavedStat: "डिजिटल एजेन्सीको लाखौं खर्च बचत",
      personaTitle: "नेपालएआई स्टुडियो कस-कसको लागि हो?",
      personaSubtitle: "तपाईं चाहे युट्युबर हुनुहोस्, पसल/विजनेस मालिक, कम्पनी वा फ्रिलान्सर—सबैका लागि पूर्ण समाधान।",
      stepTitle: "४ सजिलो चरणमा भिडियो बनाउनुहोस् र कमाउनुहोस्",
      stepSubtitle: "कुनै क्यामरा, महँगो स्टुडियो वा एडिटिङ ज्ञान चाहिँदैन।",
      calcTitle: "तपाईंको मासिक आम्दानी र बचत क्यालकुलेटर",
      calcSubtitle: "हेर्नुहोस् नियमित भिडियो बनाउँदा कति आम्दानी र एजेन्सी खर्च बचत हुन्छ।",
    },
    hi: {
      badge: "नेक्स्ट-जेन एआई वीडियो स्टूडियो • सोरा-2 और नेचुरल वॉइस",
      heroTitle1: "वायरल एआई वीडियो बनाएं",
      heroTitleHighlight: "मिनटों में, बिना किसी झंझट के।",
      heroSubtitle: "4K सोरा-2 वीडियो, नेचुरल वॉइसओवर, एनिमेटेड सबटाइटल्स और हाई-कन्वर्टिंग एड्स अब चुटकियों में। न कैमरा चाहिए, न भारी सॉफ्टवेयर।",
      sastaCta: "सस्ता पास (मात्र रू 50)",
      freeTrialCta: "मुफ़्त शुरू करें",
      launchStudioCta: "वीडियो स्टूडियो खोलें",
      hamroAiCta: "हाम्रो एआई चैट",
      viralStat: "12,50,000+ से अधिक यूट्यूब और रील्स व्यूज",
      agencySavedStat: "एजेंसी की मोटी फीस से 100% आज़ादी",
      personaTitle: "नेपालएआई स्टूडियो किसके लिए है?",
      personaSubtitle: "चाहे आप क्रिएटर हों, बिज़नेस ओनर, कंपनी या फ्रीलांसर—यह आपके काम को 10 गुना तेज़ और मुनाफ़ेदार बनाता है।",
      stepTitle: "4 आसान स्टेप्स में वीडियो बनाएं और कमाई शुरू करें",
      stepSubtitle: "न कैमरा चाहिए, न महंगा स्टूडियो, न कोई भारी एडिटिंग स्किल।",
      calcTitle: "अपनी अनुमानित मासिक कमाई और बचत कैलकुलेटर",
      calcSubtitle: "देखें हर महीने वीडियो बनाकर आप यूट्यूब, क्लाइंट्स और बिज़नेस से कितना कमा सकते हैं।",
    }
  }[lang];

  // Dynamic calculated estimates
  const estimatedViews = (videoCount * 28000).toLocaleString();
  const estimatedYoutubeRev = Math.round(videoCount * 38);
  const estimatedYoutubeRevNpr = (estimatedYoutubeRev * 134).toLocaleString();
  const estimatedAgencySavings = Math.round(videoCount * 65);
  const estimatedAgencySavingsNpr = (estimatedAgencySavings * 134).toLocaleString();
  const estimatedFreelanceRev = Math.round(videoCount * 85);
  const estimatedFreelanceRevNpr = (estimatedFreelanceRev * 134).toLocaleString();

  return (
    <div className="bg-[#070913] text-slate-100 min-h-screen selection:bg-rose-500 selection:text-white font-sans overflow-x-hidden">
      {/* Background ambient lighting & subtle matrix grid */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Subtle grid mesh */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        {/* Luxury radial glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-gradient-to-b from-cyan-500/20 via-indigo-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-[1200px] -right-40 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* World-Class Interactive Studio Hero Section */}
      <section className="relative pt-4 sm:pt-8 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Top Floating Engine Status & Local Currency Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-300 backdrop-blur-xl shadow-lg shadow-cyan-950/40">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-semibold text-white tracking-wide">{t.badge}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold backdrop-blur-xl shadow-lg shadow-amber-950/30">
            <span>🇳🇵</span>
            <span>NPR FonePay & eSewa Instant QR</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 uppercase tracking-wider font-extrabold">रू 50 Pass</span>
          </div>
        </div>

        {/* Hero Headline & High-Impact Copy */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6 mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
            <span className="block text-white">
              {t.heroTitle1}
            </span>
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(6,182,212,0.45)]">
              {t.heroTitleHighlight}
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t.heroSubtitle}
          </p>

          {/* Interactive "Magic Prompt-to-Video" Terminal */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] backdrop-blur-2xl transition-all duration-300 focus-within:border-cyan-400 focus-within:shadow-[0_0_45px_rgba(6,182,212,0.35)]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
                  <input
                    type="text"
                    value={heroPrompt}
                    onChange={(e) => setHeroPrompt(e.target.value)}
                    placeholder={lang === 'ne' ? 'आफ्नो भिडियोको विषय वा प्रम्प्ट लेख्नुहोस्...' : 'Describe any video idea in Nepali, Hindi or English...'}
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none font-medium py-1.5"
                  />
                </div>

                <button
                  id="hero-generate-trigger-btn"
                  onClick={handleHeroGenerate}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-600 hover:from-cyan-400 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 cursor-pointer transition transform hover:scale-[1.02] active:scale-98 shrink-0"
                >
                  <Wand2 className="w-4 h-4 text-cyan-200" />
                  <span>{lang === 'ne' ? '४K भिडियो बनाउनुहोस्' : lang === 'hi' ? '4K वीडियो बनाएं' : 'Generate 4K Video'}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </button>
              </div>

              {/* Instant Prompt Sample Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 px-1 text-[11px] scrollbar-none">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Trending:</span>
                </span>
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroPrompt(s.text)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition whitespace-nowrap cursor-pointer text-[11px] font-medium shrink-0"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Glowing Primary CTAs & NPR 50 Entry */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <button
                id="hero-launch-studio-cta"
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-base shadow-[0_0_35px_rgba(6,182,212,0.45)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-cyan-400/40 active:scale-98"
              >
                <Film className="w-5 h-5 text-cyan-200" />
                <span>{t.launchStudioCta}</span>
                <ArrowRight className="w-5 h-5 text-cyan-200" />
              </button>
            ) : (
              <button
                id="hero-free-trial-cta"
                onClick={() => onSelectPlan('free')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-base shadow-[0_0_35px_rgba(6,182,212,0.45)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-cyan-400/40 active:scale-98"
              >
                <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                <span>{t.freeTrialCta}</span>
                <ArrowRight className="w-5 h-5 text-cyan-200" />
              </button>
            )}

            {/* Micro-Credits NPR 50 Quick Entry Pass */}
            <button
              id="hero-sasta-pass-cta"
              onClick={() => onSelectPlan('sasta_50_npr')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/95 hover:bg-slate-800/95 text-white font-bold text-sm border border-amber-500/40 shadow-xl shadow-amber-950/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
              <span>{t.sastaCta}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-extrabold uppercase tracking-wider border border-amber-400/30">
                FonePay / eSewa
              </span>
            </button>
          </div>

          {/* Social Proof & Trust Strip */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <span>★★★★★</span>
              <span className="text-slate-300 font-semibold ml-1">4.9/5 Rating</span>
              <span className="text-slate-500 font-normal">(8,400+ creators)</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Commercial Monetization Rights</span>
            </div>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-cyan-300 font-medium">
              <Sparkle className="w-3.5 h-3.5 text-cyan-400" />
              <span>No Watermark</span>
            </div>
          </div>
        </div>

        {/* Cinematic Live Studio Showcase Embed */}
        <div className="relative mt-6 sm:mt-10">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 -z-10" />
          <InteractiveStudioPlayer onLaunchStudio={onLaunchStudio} lang={lang} />
        </div>

        {/* 6-Pillar Ecosystem Grid below the Player */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8 sm:mt-12 text-left">
          {/* Card 1 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-red-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-950/50 mb-2.5">
              <Youtube className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-red-300 transition">YouTube Shorts</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">9:16 • 60 FPS • High CTR</p>
          </div>

          {/* Card 2 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-100 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-amber-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-950/50 mb-2.5">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition">Nepali Neural Voice</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">48kHz • SpeechT5 TTS</p>
          </div>

          {/* Card 3 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-200 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-cyan-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/50 mb-2.5">
              <Video className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition">Azure Sora-2</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">4K Motion • 60 FPS</p>
          </div>

          {/* Card 4 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-300 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-pink-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-950/50 mb-2.5">
              <Instagram className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-pink-300 transition">Auto Subtitles</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Mukta Devanagari Karaoke</p>
          </div>

          {/* Card 5 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-400 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-emerald-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 mb-2.5">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-emerald-300 transition">FonePay & eSewa</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Instant NPR रू 50 Top-Up</p>
          </div>

          {/* Card 6 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-500 ease-out p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/40 shadow-xl backdrop-blur-xl group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-950/50 mb-2.5">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition">100% Monetization</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">YouTube AdSense Ready</p>
          </div>
        </div>
      </section>

      {/* CORE VALUE PILLARS SECTION: Who is it for? */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide uppercase">
            <Rocket className="w-3.5 h-3.5 text-rose-500" />
            <span>{t.personaTitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne' 
              ? 'तपाईंको आवश्यकता अनुसार प्रत्यक्ष समाधान र आम्दानी'
              : lang === 'hi'
              ? 'क्रिएटर्स, बिज़नेस और फ्रीलांसर्स के लिए पावरफुल सॉल्यूशन्स'
              : 'Direct Solutions for Creators, Businesses, Companies & Freelancers'}
          </h2>
          <p className="text-sm text-slate-400">
            {t.personaSubtitle}
          </p>
        </div>

        {/* Persona Selector Tabs (Mobile Grid & Touch-Optimized) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-8 max-w-5xl mx-auto w-full">
          <button
            onClick={() => setActivePersona('creators')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center sm:justify-start gap-2.5 border min-h-[48px] ${
              activePersona === 'creators'
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Youtube className="w-4 h-4 shrink-0 text-rose-300" />
            <span className="truncate">
              {lang === 'ne' ? '१. युट्युबर र क्रिएटर' : lang === 'hi' ? '1. क्रिएटर्स (यूट्यूब)' : '1. Creators & Influencers'}
            </span>
          </button>

          <button
            onClick={() => setActivePersona('business')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center sm:justify-start gap-2.5 border min-h-[48px] ${
              activePersona === 'business'
                ? 'bg-amber-600 border-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Store className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">
              {lang === 'ne' ? '२. विजनेस र पसल' : lang === 'hi' ? '2. बिज़नेस व दुकान' : '2. Businesses & Retail'}
            </span>
          </button>

          <button
            onClick={() => setActivePersona('company')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center sm:justify-start gap-2.5 border min-h-[48px] ${
              activePersona === 'company'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0 text-indigo-300" />
            <span className="truncate">
              {lang === 'ne' ? '३. कम्पनी र ब्राण्ड' : lang === 'hi' ? '3. कंपनियाँ व ब्रांड' : '3. Companies & Brands'}
            </span>
          </button>

          <button
            onClick={() => setActivePersona('freelancer')}
            className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center sm:justify-start gap-2.5 border min-h-[48px] ${
              activePersona === 'freelancer'
                ? 'bg-emerald-600 border-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">
              {lang === 'ne' ? '४. फ्रिलान्सर अफिस' : lang === 'hi' ? '4. फ्रीलांसर्स हब' : '4. Freelancers & Agencies'}
            </span>
          </button>
        </div>

        {/* Active Persona Deep-Dive Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Persona 1: Content Creators & YouTubers */}
          {activePersona === 'creators' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span>YouTube Videos • Shorts • Instagram Reels • TikTok Viral</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {lang === 'ne'
                    ? 'युट्युब भिडियो र रील्स बनाएर भाइरल हुनुहोस्, मनिटाइज गरेर निरन्तर कमाउनुहोस्!'
                    : lang === 'hi'
                    ? 'यूट्यूब वीडियो और रील्स बनाएं, तेजी से वायरल हों और हर महीने मोनेटाइजेशन से कमाएं!'
                    : 'Make YouTube Videos, Stories, Reels & TikToks: Go Viral, Monetize & Keep Earning!'}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'ne'
                    ? 'क्यामरा अगाडि आउन लाज लाग्छ? कुनै समस्या छैन! फेथलेस (Faceless) युट्युब च्यानल, टिकटक र फेसबुक रील्स अब एआईले मिनेटमै तयार गर्छ। भाइरल हुक, सोरा-२ सिनेम्याटिक भिडियो, प्राकृतिक नेपाली आवाज र अटोमेटिक सबटाइटलसहित सिधै युट्युबमा पोस्ट गर्नुहोस्।'
                    : lang === 'hi'
                    ? 'कैमरा फेस करने की झिझक है? कोई बात नहीं! फेसलेस यूट्यूब चैनल, इंस्टाग्राम रील्स और टिकटॉक अब एआई से मिनटों में बनाएं। वायरल हुक, सोरा-2 मोशन, नेचुरल वॉइसओवर और ऑटो-सबटाइटल्स के साथ 1-क्लिक में यूट्यूब पर पब्लिश करें।'
                    : 'Hesitant to face the camera? Build high-earning faceless channels on YouTube, TikTok, and Instagram! With OpenAI Sora-2, HamroAI scripts, and authentic Nepali & Hindi neural voices, produce 20+ viral videos per week and turn views into ad monetization and sponsorships.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">1-Click Direct YouTube Post</span>
                      <span className="text-slate-400 text-[11px]">Direct upload to Shorts (9:16) & Standard (16:9).</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Viral Hook & Subtitle Toolkit</span>
                      <span className="text-slate-400 text-[11px]">Mukta Devanagari fonts, animated karaoke subtitles.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Authentic Nepali & Hindi TTS</span>
                      <span className="text-slate-400 text-[11px]">Real acoustic emotion without robotic English accents.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Monetization Ready Renders</span>
                      <span className="text-slate-400 text-[11px]">100% copyright-safe FLUX visuals & licensed audio.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onLaunchStudio}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'पहिलो युट्युब भिडियो बनाउनुहोस्' : lang === 'hi' ? 'पहला यूट्यूब वीडियो बनाएं' : 'Create First Viral Video Now'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('sasta_50_npr')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ne' ? 'रू ५० को सस्तो पास लिनुहोस्' : lang === 'hi' ? 'रू 50 का सस्ता पास लें' : 'Get रू 50 Micro-Pass'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 shadow-2xl space-y-3">
                  <div className="aspect-[9/16] max-w-[260px] mx-auto rounded-xl overflow-hidden relative border border-slate-800 group shadow-inner bg-gradient-to-b from-indigo-950 via-slate-900 to-black">
                    <img
                      src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80"
                      alt="Shorts Preview"
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-15" />
                    
                    {/* Floating simulated badges */}
                    <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Flame className="w-3 h-3" /> #SHORTS VIRAL
                    </div>

                    <div className="absolute bottom-4 left-3 right-3 text-left space-y-1.5 z-20">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                        Estimated: 350K+ Views
                      </span>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        "हिमालयको रहस्य र विहानीको सुनौलो दृश्य"
                      </h4>
                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        Auto-generated prompt • Sora-2 motion • Mukta font subtitles
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 8,400+ creators actively publishing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persona 2: Businesses & Retailers */}
          {activePersona === 'business' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>No Digital Marketing Agency Needed • 10x Business Sales</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {lang === 'ne'
                    ? 'विजनेसको विज्ञापन र भिडियो आफैं बनाउनुहोस्—कुनै महँगो एजेन्सी चाहिँदैन!'
                    : lang === 'hi'
                    ? 'अपने बिज़नेस के कमर्शियल वीडियो खुद बनाएं—किसी महंगी एजेंसी की ज़रूरत नहीं!'
                    : 'Enhance Your Business with Cinematic Video Ads. Zero Digital Agency Fees!'}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'ne'
                    ? 'मार्केटिङ एजेन्सीलाई महिनाको ३०,००० देखि १,००,००० सम्म किन तिर्ने? दशैं-तिहार अफर, नयाँ वर्ष डिस्काउन्ट, रेस्टुरेन्ट मेनु, कपडा पसल र नयाँ प्रोडक्टका आकर्षक भिडियो विज्ञापन ३ मिनेटमै बनाउनुहोस्। आफ्नो फोन नम्बर, पसलको लोकेसन र इसेवा/फोनपे क्यूआर कोडसहित फेसबुक, इन्स्टा र युट्युबमा चलाउनुहोस्।'
                    : lang === 'hi'
                    ? 'मार्केटिंग एजेंसी को महीने के हजारों रुपये क्यों देना? दिवाली, न्यू ईयर ऑफर्स, रेस्टोरेंट, फैशन बुटीक और नए प्रोडक्ट्स के शानदार वीडियो एड्स 3 मिनट में बनाएं। अपना नंबर, लोकेशन और क्यूआर कोड लगाकर फेसबुक, इंस्टाग्राम और यूट्यूब पर चलाएं और बिक्री बढ़ाएं।'
                    : 'Stop spending $500–$2,000 every month on traditional marketing agencies. Create high-converting product showcase reels, festive discount ads (Dashain, Diwali, New Year), and brand commercials in minutes. Add your logo, shop phone number, and QR code to double your customer reach.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">100% Agency Cost Elimination</span>
                      <span className="text-slate-400 text-[11px]">Save lakhs in monthly agency retainers and production delays.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Festival & Promotional Templates</span>
                      <span className="text-slate-400 text-[11px]">Dashain, Tihar, Diwali, Black Friday & seasonal sales.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Brand Logo & Phone Number Overlay</span>
                      <span className="text-slate-400 text-[11px]">Put your shop name, contact number, and FonePay QR directly.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Hyper-Local Voiceovers</span>
                      <span className="text-slate-400 text-[11px]">Authentic conversational voice that builds customer trust.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onLaunchStudio}
                    className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Store className="w-4 h-4 text-slate-950" />
                    <span>{lang === 'ne' ? 'विजनेसको पहिलो विज्ञापन बनाउनुहोस्' : lang === 'hi' ? 'बिज़नेस का पहला ऐड बनाएं' : 'Create Business Ad in 3 Minutes'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('creator')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <span>{lang === 'ne' ? 'विजनेस प्याकेज हेर्नुहोस्' : lang === 'hi' ? 'बिज़नेस प्लान्स देखें' : 'View Business Plans'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="bg-slate-950 rounded-2xl border border-amber-500/30 p-4 shadow-2xl space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden relative border border-slate-800 bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950">
                    <img
                      src="https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=800&auto=format&fit=crop&q=80"
                      alt="Business Ad Preview"
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="w-full h-full object-cover relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-15" />
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow z-20">
                      बिक्री धमाका • 40% OFF
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left z-20">
                      <span className="text-[10px] text-amber-300 font-bold block">पसल / रेस्टुरेन्ट विज्ञापन</span>
                      <h4 className="text-sm font-bold text-white">"आजै सम्पर्क गर्नुहोस्: ९८०१२३४५६७"</h4>
                      <p className="text-[10px] text-slate-300">घरमै डेलिभरी • फोनपे / इसेवा भुक्तानी</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300 flex items-center justify-between">
                    <span>औसत एजेन्सी बचत:</span>
                    <span className="font-mono font-black text-amber-400">रू ६०,००० / महिना</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persona 3: Companies & Corporate Enterprises */}
          {activePersona === 'company' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Corporate Storytelling • Global Scale • Multi-Market Reach</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {lang === 'ne'
                    ? 'कम्पनीको ब्राण्ड विस्तार गर्नुहोस् र विश्वभरका ग्राहकमाझ पुग्नुहोस्'
                    : lang === 'hi'
                    ? 'कंपनी की ब्रांडिंग बढ़ाएं और ग्लोबल मार्केट तक अपनी पहुंच बनाएं'
                    : 'Grow Your Company & Brand: Enterprise AI Video Production'}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'ne'
                    ? 'तपाईंको कम्पनीको इन्भेस्टर प्रेजेन्टेसन, कर्मचारी ट्रेनिङ, नयाँ सेवा लन्च र कर्पोरेट स्टोरीटेलिङ अब हाई-डेफिनिसन ४K मा तयार हुन्छ। नेपाली, हिन्दी र अन्तर्राष्ट्रिय अंग्रेजी गरी ३ वटै भाषामा एकसाथ कन्टेन्ट निकालेर अन्तर्राष्ट्रिय बजारमा आफ्नो कम्पनीको गरिमा बढाउनुहोस्।'
                    : lang === 'hi'
                    ? 'कंपनी के इन्वेस्टर पिचों, एम्प्लॉई ट्रेनिंग, प्रोडक्ट लॉन्च और कॉर्पोरेट स्टोरीटेलिंग को 4K क्वालिटी में तैयार करें। नेपाली, हिन्दी और इंटरनेशनल इंग्लिश में एक साथ वीडियो बनाकर अपने ब्रांड का विस्तार करें।'
                    : 'Empower marketing teams, HR, and executives to generate polished brand videos, employee onboarding modules, investor updates, and multi-regional advertising campaigns. Maintain rigorous brand consistency with multi-user team workspaces.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Multi-Regional Localization</span>
                      <span className="text-slate-400 text-[11px]">Generate synchronized Nepali, Hindi & English releases.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Team Workspaces & Roles</span>
                      <span className="text-slate-400 text-[11px]">Shared media libraries, admin oversight, and project locking.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Custom Voice Cloning Pipeline</span>
                      <span className="text-slate-400 text-[11px]">Clone founder or executive voices for authentic communication.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Priority GPU Renders</span>
                      <span className="text-slate-400 text-[11px]">Dedicated Azure Foundry pipeline for enterprise deadlines.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onLaunchStudio}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'कम्पनीको भिडियो सुरु गर्नुहोस्' : lang === 'hi' ? 'कंपनी वीडियो शुरू करें' : 'Scale Corporate Media'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('pro_studio')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <span>{lang === 'ne' ? 'प्रो एजेन्सी टियर हेर्नुहोस्' : lang === 'hi' ? 'प्रो एजेंसी प्लान देखें' : 'View Pro Agency Tier'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="bg-slate-950 rounded-2xl border border-indigo-500/30 p-4 shadow-2xl space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden relative border border-slate-800 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950">
                    <img
                      src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80"
                      alt="Corporate Enterprise Video"
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="w-full h-full object-cover relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-15" />
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow z-20">
                      ENTERPRISE 4K SUITE
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left z-20">
                      <span className="text-[10px] text-indigo-300 font-bold block">Annual Review & Strategy 2026</span>
                      <h4 className="text-sm font-bold text-white">Global Expansion & Innovation</h4>
                      <p className="text-[10px] text-slate-400">Nepali • Hindi • English Multi-Track</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300 flex items-center justify-between">
                    <span>ग्लोबल पहुँच:</span>
                    <span className="font-mono font-black text-indigo-400">१२+ देशहरूमा बजार विस्तार</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Persona 4: Freelancers & Solopreneurs */}
          {activePersona === 'freelancer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Freelancer Earning Office • $50–$300 Per Client Video</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {lang === 'ne'
                    ? 'घरमै बसी ल्यापटपबाट आफ्नो अनलाइन अफिस चलाउनुहोस् र अन्तर्राष्ट्रिय कमाई गर्नुहोस्!'
                    : lang === 'hi'
                    ? 'अपने लैपटॉप को बनाएं अपना अर्निंग ऑफिस और घर बैठे विदेशी क्लाइंट्स से कमाएं!'
                    : 'Freelancers: Make NepalAI Your Personal High-Income Earning Office!'}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'ne'
                    ? 'Upwork, Fiverr, र स्थानीय क्लाइन्टलाई भिडियो एडिटिङ र एआई भोइसओभर सेवा दिनुहोस्। एउटा भिडियो तयार गर्न ५० देखि २०० डलर (रू ६,५०० देखि २५,००० सम्म) चार्ज गर्नुहोस्। नेपालएआईको अटोमेटेड स्टुडियोले १० मिनेटमै सम्पूर्ण भिडियो तयार गरिदिन्छ, जसले गर्दा महिनामा लाखौं कमाउन सम्भव हुन्छ!'
                    : lang === 'hi'
                    ? 'Upwork, Fiverr और लोकल क्लाइंट्स को वीडियो एडिटिंग और एआई वॉइसओवर सर्विस दें। एक वीडियो के लिए $50 से $200 (लगभग 5,000 से 20,000 रुपये) चार्ज करें। नेपालएआई स्टूडियो 10 मिनट में पूरा वीडियो रेडी कर देता है, जिससे आपकी कमाई तेजी से बढ़ती है।'
                    : 'Launch your high-margin digital production agency directly from your bedroom. Offer video editing, YouTube Shorts automation, and multi-lingual voiceover services on Upwork and Fiverr. Deliver orders in minutes and keep 95%+ profit margins.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Rapid Client Delivery in Minutes</span>
                      <span className="text-slate-400 text-[11px]">Deliver 10 client videos in the time it used to take for 1.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Upwork & Fiverr Ready Exports</span>
                      <span className="text-slate-400 text-[11px]">MP4 full HD/4K with clean metadata and audio masters.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Micro-Cost Production</span>
                      <span className="text-slate-400 text-[11px]">Produce each video for as low as रू 50 and sell for $50+.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">100% Commercial Rights</span>
                      <span className="text-slate-400 text-[11px]">Transfer full copyright and commercial use to clients safely.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={onLaunchStudio}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Briefcase className="w-4 h-4 text-slate-950" />
                    <span>{lang === 'ne' ? 'आफ्नो अनलाइन अफिस सुरु गर्नुहोस्' : lang === 'hi' ? 'अपना अर्निंग ऑफिस शुरू करें' : 'Open Your Earning Office'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('sasta_50_npr')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'ne' ? 'रू ५० मा टेस्ट गर्नुहोस्' : lang === 'hi' ? 'रू 50 में टेस्ट करें' : 'Test with रू 50 Pass'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="bg-slate-950 rounded-2xl border border-emerald-500/30 p-4 shadow-2xl space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden relative border border-slate-800 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950">
                    <img
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
                      alt="Freelancer Desk Preview"
                      onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                      className="w-full h-full object-cover relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-15" />
                    <div className="absolute top-3 left-3 bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded shadow z-20">
                      ORDER COMPLETED: $120.00
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left z-20">
                      <span className="text-[10px] text-emerald-300 font-bold block">Fiverr / Upwork Client Delivery</span>
                      <h4 className="text-sm font-bold text-white">"5x YouTube Automation Shorts Package"</h4>
                      <p className="text-[10px] text-slate-300">Production Time: 18 Minutes • Net Profit: $118</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span>अनुमानित मासिक आम्दानी:</span>
                    <span className="font-mono font-black text-emerald-400">$800 – $2,500+ / महिना</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4-STEP ACTION WORKFLOW: From Idea to Viral Cashflow */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.stepTitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne' 
              ? 'कसरी काम गर्छ? केवल ४ सजिलो पाइला!'
              : lang === 'hi'
              ? 'यह कैसे काम करता है? सिर्फ 4 आसान स्टेप्स!'
              : 'How It Works: Zero Technical Skills Required'}
          </h2>
          <p className="text-sm text-slate-400">
            {t.stepSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 ease-out p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 relative group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-base mb-4">
              १
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'ne' ? '१. प्रम्प्ट वा स्क्रिप्ट लेख्नुहोस्' : lang === 'hi' ? '1. प्रॉम्प्ट या स्क्रिप्ट लिखें' : '1. Prompt or Paste Script'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ne'
                ? 'हाम्रो एआई च्याट (HamroAI) मा नेपाली, रोमन वा हिन्दीमा आफ्नो विषय भन्नुहोस्। एआईले तुरुन्तै भाइरल हुक र दृश्य स्क्रिप्ट बनाइदिन्छ।'
                : lang === 'hi'
                ? 'हाम्रो एआई चैट में अपने विचार बताएं। एआई तुरंत वायरल हुक्स और सीन-बाय-सीन स्क्रिप्ट तैयार कर देगा।'
                : 'Type your idea in plain English, Romanized Nepali, or Hindi. HamroAI instantly formats viral hooks and scene-by-scene prompts.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-150 ease-out p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 relative group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-black text-base mb-4">
              २
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'ne' ? '२. सिनेम्याटिक भिडियो जेनेरेट गर्नुहोस्' : lang === 'hi' ? '2. सिनेमाई वीडियो जनरेट करें' : '2. Generate Sora-2 Visuals'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ne'
                ? 'अन्तर्राष्ट्रिय सोरा-२ र FLUX.1 एआईले उच्च गुणस्तरका भिडियो क्लिप र थम्बनेल फोटोहरू सेकेन्डमै बनाउँछ।'
                : lang === 'hi'
                ? 'सोरा-2 और FLUX.1 एआई सीधे हाई-क्वालिटी वीडियो सीन्स और थंबनेल विजुअल्स तुरंत तैयार करते हैं।'
                : 'OpenAI Sora-2 and FLUX generate 4K cinematic scenes, camera movements, and photorealistic assets automatically.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-300 ease-out p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 relative group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-black text-base mb-4">
              ३
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'ne' ? '३. आवाज र सबटाइटल थप्नुहोस्' : lang === 'hi' ? '3. वॉइसओवर और सबटाइटल जोड़ें' : '3. Neural Voice & Subtitles'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ne'
                ? 'नेपाली तथा हिन्दी न्युरल भोइसओभर, मुक्ता फन्ट सबटाइटल र ब्याकग्राउन्ड म्युजिक टाइमलाइनमा मिलाउनुहोस्।'
                : lang === 'hi'
                ? 'नेचुरल नेपाली व हिन्दी वॉइसओवर और एनिमेटेड सबटाइटल्स को मल्टी-ट्रैक टाइमलाइन पर आसानी से सेट करें।'
                : 'Attach crystal-clear 48kHz neural voiceovers, background audio, and animated Devanagari/Latin subtitles.'}
            </p>
          </div>

          {/* Step 4 */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-450 ease-out p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 relative group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-base mb-4">
              ४
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {lang === 'ne' ? '४. सिधै पोस्ट र आम्दानी सुरु' : lang === 'hi' ? '4. यूट्यूब पर पोस्ट और कमाई' : '4. Post to YouTube & Monetize'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ne'
                ? '१-क्लिकमा युट्युब सर्ट्स वा भिडियोमा सिधै पब्लिश गर्नुहोस्, टिकटक र इन्स्टामा हाल्नुहोस् र भ्युजबाट पैसा कमाउनुहोस्।'
                : lang === 'hi'
                ? 'सीधे 1-क्लिक में यूट्यूब पर पब्लिश करें या डाउनलोड करके इंस्टाग्राम और टिकटॉक पर डालकर मोनेटाइज करें।'
                : 'Directly publish to your connected YouTube channel, export MP4 for TikTok/Reels, or deliver files to high-paying clients.'}
            </p>
          </div>
        </div>
      </section>

      {/* VIRAL STORYBOARD TEMPLATES LIBRARY */}
      <ViralTemplatesSection 
        onSelectTemplate={onSelectTemplate || (() => {})} 
        onOpenAuth={() => onOpenAuth('user')}
      />

      {/* INTERACTIVE REVENUE & AGENCY SAVINGS CALCULATOR */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.calcTitle}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {lang === 'ne' 
                ? 'भिडियो बनाउँदा कति फाइदा हुन्छ? आफैं हिसाब गर्नुहोस्!'
                : lang === 'hi'
                ? 'वीडियो बनाने से कितना फायदा होगा? खुद कैलकुलेट करें!'
                : 'Interactive Growth & Agency Savings Calculator'}
            </h3>
            <p className="text-xs text-slate-400">
              {t.calcSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive Slider Input */}
            <div className="lg:col-span-5 space-y-6 text-left p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="landing-video-count-slider" className="text-xs font-bold text-slate-300">
                    {lang === 'ne' ? 'महिनामा बनाउने भिडियो संख्या:' : lang === 'hi' ? 'प्रति माह बनाए जाने वाले वीडियो:' : 'Videos Created Per Month:'}
                  </label>
                  <span className="px-3 py-1 rounded-lg bg-rose-600 text-white font-mono font-black text-sm">
                    {videoCount} {lang === 'ne' ? 'भिडियो' : lang === 'hi' ? 'वीडियो' : 'Videos'}
                  </span>
                </div>

                <input
                  id="landing-video-count-slider"
                  type="range"
                  min="3"
                  max="60"
                  value={videoCount}
                  onChange={(e) => setVideoCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>3 (Casual)</span>
                  <span>15 (Creator)</span>
                  <span>30 (Business)</span>
                  <span>60 (Pro Agency)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cost with Sasta Pass: <strong>रू {(videoCount * 50).toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Time required per video: <strong>~8-12 minutes</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No video camera or crew equipment needed</span>
                </div>
              </div>
            </div>

            {/* Calculated Output Pillars */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {/* Pillar 1: YouTube & Social Ad Revenue */}
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Youtube className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'युट्युब विज्ञापन आम्दानी' : lang === 'hi' ? 'यूट्यूब ऐड रेवेन्यू' : 'Estimated Views & Ad Rev'}</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-white block font-mono">${estimatedYoutubeRev}</span>
                  <span className="text-xs text-rose-300 font-bold">रू {estimatedYoutubeRevNpr} / महिना</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Based on ~{estimatedViews} combined YouTube Shorts & Reels views.
                </p>
              </div>

              {/* Pillar 2: Agency Savings */}
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Store className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'एजेन्सी खर्च बचत' : lang === 'hi' ? 'एजेंसी लागत बचत' : 'Agency Fees Saved'}</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-white block font-mono">${estimatedAgencySavings}</span>
                  <span className="text-xs text-amber-300 font-bold">रू {estimatedAgencySavingsNpr} / महिना</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  What an outside video marketing agency would charge for {videoCount} ads.
                </p>
              </div>

              {/* Pillar 3: Freelance Income */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-2 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <DollarSign className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'फ्रिलान्सर आम्दानी' : lang === 'hi' ? 'फ्रीलांसिंग कमाई' : 'Freelance Client Sales'}</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-white block font-mono">${estimatedFreelanceRev}</span>
                  <span className="text-xs text-emerald-300 font-bold">रू {estimatedFreelanceRevNpr} / महिना</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Delivering {videoCount} short video projects on Upwork/Fiverr @ $50–$100 avg.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UNIFIED CREATOR & BUSINESS FAQ HUB */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-900/80">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ne' ? 'प्रायः सोधिने प्रश्नहरू (FAQs)' : lang === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne'
              ? 'सबैभन्दा महत्त्वपूर्ण प्रश्नहरूको स्पष्ट जवाफ'
              : lang === 'hi'
              ? 'मोनेटाइजेशन, पेमेंट्स और कमर्शियल राइट्स'
              : 'Clear Answers on Monetization, Payments & Commercial Rights'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {lang === 'ne'
              ? 'नेपालएआई स्टुडियो, सस्तो पास, कपीराइट सुरक्षा र मोनेटाइजेशनका बारेमा सबै कुरा बुझ्नुहोस्।'
              : lang === 'hi'
              ? 'नेपालएआई स्टूडियो, सस्ता पास, कॉपीराइट सुरक्षा और कमाई के बारे में पूरी जानकारी।'
              : 'Everything you need to know about NepalAI Studio, Sasta Pass, copyright safety, and earnings.'}
          </p>
        </div>

        {/* Streamlined Interactive FAQ Accordion Hub */}
        <div className="space-y-3 text-left">
          {/* FAQ 1 */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition hover:border-slate-700">
            <button
              onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
              className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-rose-400 shrink-0" />
                <span>
                  {lang === 'ne'
                    ? 'के नेपालएआईबाट बनेका भिडियो युट्युब र टिकटकमा मोनेटाइज हुन्छन्?'
                    : lang === 'hi'
                    ? 'क्या नेपालएआई से बने वीडियो यूट्यूब और टिकटॉक पर मोनेटाइज होंगे?'
                    : 'Can I monetize videos made with NepalAI on YouTube, TikTok & Reels?'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === 0 ? 'rotate-90 text-rose-400' : ''}`} />
            </button>
            {openFaq === 0 && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                {lang === 'ne'
                  ? 'हो, १००% मोनेटाइज हुन्छन्! हाम्रा भिडियो, आवाज र इमेजहरू ओरिजिनल एआई सिर्जना भएकाले कुनै कपीराइट लाग्दैन। तपाईंले सिधै युट्युब पार्टनर प्रोग्राम, टिकटक क्रिएटर रिवार्ड्स र फेसबुक इन्स्ट्रिम विज्ञापनबाट पैसा कमाउन सक्नुहुन्छ।'
                  : lang === 'hi'
                  ? 'हाँ, 100% मोनेटाइज होते हैं! हमारे सभी वीडियो, ऑडियो और इमेजेस ओरिजिनल एआई जनरेटेड हैं, इसलिए कॉपीराइट का कोई खतरा नहीं है।'
                  : 'Yes, 100%! All generated video frames, synthesized audio tracks, and images are generated uniquely with full commercial monetization rights. You can earn directly from YouTube AdSense, TikTok Creator Rewards, and brand sponsorships.'}
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition hover:border-slate-700">
            <button
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  {lang === 'ne'
                    ? 'रू ५० को सस्तो पास (Sasta Pass) कसरी काम गर्छ?'
                    : lang === 'hi'
                    ? 'रू 50 का सस्ता पास (Sasta Pass) कैसे काम करता है?'
                    : 'How does the रू 50 Sasta Pass (Micro-Topup) work?'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === 1 ? 'rotate-90 text-amber-400' : ''}`} />
            </button>
            {openFaq === 1 && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                {lang === 'ne'
                  ? 'सस्तो पास नेपालका क्रिएटरहरूका लागि डिजाइन गरिएको हो। कुनै मासिक सदस्यता बाँधिनु पर्दैन—FonePay, eSewa वा Khalti बाट रू ५० को QR स्क्यान गर्नासाथ ६० क्रेडिट तुरुन्तै थपिन्छ जसबाट ३ वटा एचडी इमेज, भिडियो रेन्डर र भोइसओभर बनाउन सकिन्छ।'
                  : lang === 'hi'
                  ? 'सस्ता पास बिना किसी मासिक सब्सक्रिप्शन के तुरंत एक्टिवेट होता है। FonePay, eSewa या Khalti QR से रू 50 पे करके तुरंत 60 क्रेडिट्स पाएं।'
                  : 'The Sasta Pass offers frictionless pay-as-you-go access. Scan the FonePay/eSewa/Khalti QR code with any mobile banking app to instantly receive 60 credits with zero recurring subscription commitments.'}
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition hover:border-slate-700">
            <button
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>
                  {lang === 'ne'
                    ? 'के पसल वा विजनेसले आफ्नो लोगो, फोन नम्बर र लोकेसन राख्न मिल्छ?'
                    : lang === 'hi'
                    ? 'क्या दुकान या बिजनेस अपना लोगो, फोन नंबर और लोकेशन डाल सकते हैं?'
                    : 'Can local businesses upload custom logos, contact numbers & addresses?'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === 2 ? 'rotate-90 text-cyan-400' : ''}`} />
            </button>
            {openFaq === 2 && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                {lang === 'ne'
                  ? 'मिल्छ! हाम्रो मल्टी-ट्र्याक टाइमलाइनमा तपाईंले आफ्नो पसलको लोगो, फोन नम्बर, फेसबुक पेज लिङ्क र अफरको ब्यानर सिधै ओभरले गर्न सक्नुहुन्छ र फेसबुक/इन्स्टा विज्ञापनको लागि तयार भिडियो डाउनलोड गर्न सक्नुहुन्छ।'
                  : lang === 'hi'
                  ? 'हाँ! मल्टी-ट्रैक टाइमलाइन पर आप अपना लोगो, कॉन्टैक्ट नंबर और एड्रेस टेक्स्ट आसानी से जोड़कर फेसबुक/इंस्टाग्राम विज्ञापनों के लिए वीडियो एक्सपोर्ट कर सकते हैं।'
                  : 'Absolutely! Our multi-track timeline allows you to overlay transparent PNG brand logos, shop contact badges, discount banners, and call-to-actions directly onto the synthesized video.'}
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden transition hover:border-slate-700">
            <button
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  {lang === 'ne'
                    ? 'फ्रिलान्सरहरूले विदेशी क्लाइन्टका लागि कसरी काम गर्न सक्छन्?'
                    : lang === 'hi'
                    ? 'फ्रीलांसर्स विदेशी क्लाइंट्स के लिए कैसे काम कर सकते हैं?'
                    : 'How can freelancers deliver video projects on Upwork and Fiverr?'}
                </span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === 3 ? 'rotate-90 text-emerald-400' : ''}`} />
            </button>
            {openFaq === 3 && (
              <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                {lang === 'ne'
                  ? 'तपाईंले अपवर्क र फाइभरमा "AI Shorts & Reels Automation" वा "Commercial Video Ad" को गिग बनाएर क्लाइन्टबाट स्क्रिप्ट लिन सक्नुहुन्छ र नेपालएआईमा १० मिनेटमा भिडियो तयार पारी $50–$150 प्रति भिडियोमा डेलिभरी गर्न सक्नुहुन्छ।'
                  : lang === 'hi'
                  ? 'आप Upwork और Fiverr पर AI वीडियो ऑटोमेशन की सर्विसेज लिस्ट कर सकते हैं और सिर्फ 10 मिनट में वीडियो तैयार करके विदेशी क्लाइंट्स को $50-$150 प्रति वीडियो पर डिलीवर कर सकते हैं।'
                  : 'You can offer automated video services on freelance platforms. Simply take the client brief, generate realistic visual reels and voiceovers in minutes, and export production-ready MP4s at $50–$150 per project.'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRANSPARENT PRICING TIERS & SASTA PASS */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900/80">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide uppercase">
            <span>{lang === 'ne' ? 'किफायती र पारदर्शी योजनाहरू' : lang === 'hi' ? 'सस्ते और पारदर्शी प्लान्स' : 'Affordable Local & Global Plans'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne' 
              ? 'सस्तो, पारदर्शी र सबैको पहुँचमा मूल्य योजना'
              : lang === 'hi'
              ? 'सस्ते, पारदर्शी और आसान प्लान्स'
              : 'Simple, Scalable Plans for Creators and Businesses'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {lang === 'ne'
              ? 'निःशुल्क परीक्षण गर्नुहोस् वा रू ५० को सस्तो पासबाट तुरुन्तै भिडियो बनाउन सुरु गर्नुहोस्।'
              : lang === 'hi'
              ? 'फ्री ट्रायल से टेस्ट करें या रू 50 के सस्ते पास से अभी अपनी वीडियो बनाना शुरू करें।'
              : 'Test for free with our trial package, or grab the रू 50 Sasta Pass for instant on-demand top-up.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {/* Sasta Pass Tier (50 NPR) */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 ease-out p-5 rounded-2xl bg-amber-950/20 border-2 border-amber-500/60 flex flex-col justify-between space-y-5 relative shadow-lg shadow-amber-950/20 hover:border-amber-400">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              सस्तो पास (रू ५०)
            </span>
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                Nepalese Micro-Topup
              </span>
              <div>
                <span className="text-3xl font-black text-white">रू 50</span>
                <span className="text-xs text-amber-400 font-bold ml-1">($0.38)</span>
                <span className="text-xs text-slate-500 block text-[10px]">pay as you go</span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Perfect for creating viral shorts and reels without any monthly subscription commitment!
              </p>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-amber-500/20">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>60 Credits Top-Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>3 HD AI Images</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1x 5-Min Video Render</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1x 5-Min AI Voice</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>FonePay, eSewa, Khalti QR</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('sasta_50_npr')}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md active:scale-98"
            >
              Get रू 50 Pass Now
            </button>
          </div>

          {/* Free Trial Tier */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-100 ease-out p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-5 hover:border-slate-700">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
                Free Trial
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-500 ml-1">/ forever</span>
              </div>
              <p className="text-xs text-slate-400">
                Included automatically with Google sign-up to evaluate media output.
              </p>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Max 3 low-quality images</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Max 1 video (capped at 2 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Max 1 audio (capped at 4 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Max 1 full project render</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth('user')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer active:scale-98"
            >
              Start Free Trial
            </button>
          </div>

          {/* Starter Plan */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-200 ease-out p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-5 hover:border-slate-700">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                Starter Tier
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$19</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.starterNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                Great for solo YouTubers & creators making weekly videos and shorts.
              </p>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>500 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100 Video Minutes (20 Videos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100 HD Images OR 50 Voiceovers</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>FonePay, eSewa & Card Gateway</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('starter')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer active:scale-98"
            >
              Get Starter Tier
            </button>
          </div>

          {/* Creator Plan (Most Popular) */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-300 ease-out p-5 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-2 border-rose-500/60 flex flex-col justify-between space-y-5 shadow-xl shadow-rose-950/30 relative hover:border-rose-400">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                Creator & Business
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$49</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.creatorNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                For active creators, local businesses replacing agencies, and freelancers.
              </p>

              <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>1,800 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>360 Video Minutes (6 Hours AI Video)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>360 HD Images OR 180 Voiceovers</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>FonePay Instant QR & Banking</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('creator')}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition cursor-pointer active:scale-98"
            >
              Get Creator Tier
            </button>
          </div>

          {/* Pro Studio / Agency Tier */}
          <div className="scroll-fade-in opacity-0 translate-y-6 transition-all duration-700 delay-400 ease-out p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-5 hover:border-slate-700">
            <div className="space-y-3">
              <span className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                Pro Agency
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$129</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.proStudioNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise capacity, custom voice cloning, team workspaces, priority renders.
              </p>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-purple-400">
                  <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>5,000 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>800 Video Mins (Full Movies & Ads)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>160 Custom Voiceovers (800 Mins)</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>FonePay, Khalti & Invoice Payment</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('pro_studio')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer active:scale-98"
            >
              Get Pro Agency Tier
            </button>
          </div>
        </div>
      </section>

      {/* FINAL HIGH-CONVERTING BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>{lang === 'ne' ? 'भाइरल बन्ने र कमाउने समय आजै हो' : lang === 'hi' ? 'वायरल होने और कमाने का सही समय' : 'Start Your Viral Journey Today'}</span>
            </div>
            <h2 className="text-2xl sm:text-5xl font-black text-white leading-tight">
              {lang === 'ne'
                ? 'आफ्नो पहिलो भिडियो अहिले नै बनाउनुहोस् र आम्दानी सुरु गर्नुहोस्!'
                : lang === 'hi'
                ? 'अपना पहला वीडियो अभी बनाएं और अपनी कमाई की शुरुआत करें!'
                : 'Create Your First Viral Video & Start Earning Today!'}
            </h2>
            <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {lang === 'ne'
                ? 'हजारौं युट्युबर, पसल मालिक र फ्रिलान्सरहरूसँगै नेपालएआई स्टुडियोमा जोडिनुहोस्। बिना क्रेडिट कार्ड तुरुन्तै सुरु गर्नुहोस्।'
                : lang === 'hi'
                ? 'हजारों क्रिएटर्स, बिज़नेस ओनर्स और फ्रीलांसर्स की तरह आज ही शुरुआत करें। नो क्रेडिट कार्ड रिक्वायर्ड।'
                : 'Join thousands of creators, business owners, and solopreneurs generating millions of views and steady income without agency overhead.'}
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <button
                  onClick={onLaunchStudio}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Film className="w-4 h-4" />
                  <span>{t.launchStudioCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('user')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>{t.freeTrialCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onSelectPlan('sasta_50_npr')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{t.sastaCta}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER BANNER */}
      <footer className="border-t border-slate-900 py-10 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-bold text-white text-sm">studio.nepalai.tech</span>
              <span>•</span>
              <span>Nepal's Premier AI Video & Creative Suite</span>
            </div>
            <p className="text-[11px] text-slate-500">
              YouTube Videos • Shorts • Instagram Reels • TikTok • Business Ads • Freelance Earning Studio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button onClick={onLaunchStudio} className="hover:text-white transition cursor-pointer">
              Launch Studio
            </button>
            <button onClick={() => onOpenAuth('admin')} className="hover:text-white transition cursor-pointer">
              Admin Portal
            </button>
            <a href="#pricing" className="hover:text-white transition">
              Pricing Plans
            </a>
            <button onClick={() => setLanguage(lang === 'en' ? 'ne' : lang === 'ne' ? 'hi' : 'en')} className="hover:text-white transition cursor-pointer flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'नेपालीमा हेर्नुहोस्' : lang === 'ne' ? 'हिन्दी में देखें' : 'View in English'}</span>
            </button>
          </div>
        </div>
      </footer>
      {/* PERSISTENT FLOATING 'START CREATING' CTA DOCK */}
      <div
        id="persistent-floating-cta-dock"
        className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out pointer-events-auto ${
          showFloatingCta
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 pl-3 sm:pl-4 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl ring-1 ring-white/10">
          <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
              {lang === 'ne' ? 'नेपालएआई स्टुडियो २.०' : lang === 'hi' ? 'नेपालएआई स्टूडियो 2.0' : 'NepalAI Studio 2.0'}
            </span>
          </div>

          {user ? (
            <button
              onClick={onLaunchStudio}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-950/40 transition active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Film className="w-4 h-4" />
              <span>{t.launchStudioCta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('user')}
              className="px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-950/40 transition active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ne' ? 'भिडियो बनाउन सुरु गर्नुहोस्' : lang === 'hi' ? 'वीडियो बनाना शुरू करें' : 'Start Creating Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onSelectPlan('sasta_50_npr')}
            className="px-3 sm:px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>{t.sastaCta}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
