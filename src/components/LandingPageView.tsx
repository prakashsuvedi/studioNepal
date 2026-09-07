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
  Camera
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
  const [activePersona, setActivePersona] = useState<PersonaType>('creators');
  const [activeDemo, setActiveDemo] = useState<'video' | 'shorts' | 'business' | 'voice'>('video');
  const [videoCount, setVideoCount] = useState<number>(15);
  const [pricingConfig, setPricingConfig] = useState<{
    starterNpr: number;
    creatorNpr: number;
    proStudioNpr: number;
  }>({
    starterNpr: 2500,
    creatorNpr: 6500,
    proStudioNpr: 16500,
  });

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
      badge: "The Platform You Know. Enhanced for the Creators of Tomorrow.",
      heroTitle1: "REDEFINING",
      heroTitleHighlight: "YOUR DIGITAL",
      heroTitle2: "DOMINANCE",
      heroSubtitle: "THE ULTIMATE ECOSYSTEM FOR CREATORS, BRANDS, & FREELANCERS",
      sastaCta: "Buy Micro-Credits Pass (रू 50)",
      freeTrialCta: "START FOR FREE",
      launchStudioCta: "Launch Video Studio",
      hamroAiCta: "HamroAI Multi-lingual Assistant",
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
      badge: "तपाईंले चिनेको स्टुडियो • अब नयाँ डिजिटल शक्तिका साथ!",
      heroTitle1: "डिजिटल प्रगतिको",
      heroTitleHighlight: "नयाँ शक्ति र",
      heroTitle2: "आधुनिक पहिचान",
      heroSubtitle: "क्रिएटर, विजनेस र फ्रिलान्सरहरूको लागि सम्पूर्ण एआई इकोसिस्टम",
      sastaCta: "सस्तो पास लिनुहोस् (रू ५० मात्र)",
      freeTrialCta: "निःशुल्क सुरु गर्नुहोस् (START FOR FREE)",
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
      badge: "आपका जाना-पहचाना प्लेटफ़ॉर्म • अब और भी पावरफुल!",
      heroTitle1: "डिजिटल डॉमिनेंस",
      heroTitleHighlight: "की नई शुरुआत और",
      heroTitle2: "अल्टीमेट ग्रोथ",
      heroSubtitle: "क्रिएटर्स, ब्रांड्स और फ्रीलांसर्स के लिए संपूर्ण एआई इकोसिस्टम",
      sastaCta: "सस्ता पास खरीदें (मात्र रू 50)",
      freeTrialCta: "मुफ़्त शुरू करें (START FOR FREE)",
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
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-rose-600 selection:text-white font-sans">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[720px] overflow-hidden pointer-events-none opacity-40 blur-3xl -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/35 rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute top-10 right-1/4 w-[520px] h-[520px] bg-indigo-600/35 rounded-full mix-blend-screen" />
        <div className="absolute top-48 left-1/3 w-80 h-80 bg-amber-500/25 rounded-full mix-blend-screen" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6 overflow-hidden">
        {/* Top Upgrade Announcement & Engine Status Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-xs text-slate-300 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
            <span className="font-semibold text-white">{t.badge}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-cyan-400 font-bold hidden sm:inline">NepalAI Studio 2.0</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-cyan-300 font-medium">Azure gpt-image-1.5 + Sora-2</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-semibold">🇳🇵 NPR Ready</span>
          </div>
        </div>

        {/* Hero Central Area with 3D Orbital Constellation */}
        <div className="relative max-w-6xl mx-auto py-6 sm:py-10 min-h-[480px] lg:min-h-[540px] flex items-center justify-center">
          {/* Glowing Elliptical Orbital Light Trails SVG */}
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none flex items-center justify-center -z-10">
            <svg
              viewBox="0 0 1000 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full max-w-5xl opacity-75 animate-orbit-glow"
            >
              <defs>
                <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.5" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Main Outer Orbital Ellipse */}
              <ellipse
                cx="500"
                cy="300"
                rx="440"
                ry="210"
                stroke="url(#orbitGrad1)"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                filter="url(#glowFilter)"
              />

              {/* Inner Secondary Sweeping Light Ring */}
              <ellipse
                cx="500"
                cy="300"
                rx="390"
                ry="170"
                stroke="url(#orbitGrad2)"
                strokeWidth="1.8"
                opacity="0.65"
              />

              {/* Ambient Glow Circles & Starbursts */}
              <circle cx="160" cy="190" r="3" fill="#38bdf8" filter="url(#glowFilter)" />
              <circle cx="210" cy="420" r="4" fill="#a855f7" filter="url(#glowFilter)" />
              <circle cx="820" cy="180" r="3.5" fill="#34d399" filter="url(#glowFilter)" />
              <circle cx="780" cy="440" r="4" fill="#f43f5e" filter="url(#glowFilter)" />
              <circle cx="500" cy="90" r="2.5" fill="#fbbf24" filter="url(#glowFilter)" />
              <circle cx="500" cy="510" r="3" fill="#38bdf8" filter="url(#glowFilter)" />
            </svg>
          </div>

          {/* LEFT ORBITAL FLANK: 3D Platform Badges */}
          {/* Left Element 1: 3D YouTube Icon + ENGAGE pill */}
          <div className="hidden lg:flex absolute top-6 left-0 xl:-left-6 z-20 items-center gap-2 animate-float-slow transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="relative w-16 h-12 sm:w-20 sm:h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 p-0.5 shadow-2xl shadow-red-950/60 card-3d-glow border-t border-red-300/40 flex items-center justify-center">
              {/* 3D Play Button */}
              <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-white drop-shadow-md ml-1" />
              {/* Glossy overlay */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-slate-200 uppercase shadow-md backdrop-blur-md">
              ENGAGE
            </div>
          </div>

          {/* Left Element 2: 3D TikTok Icon */}
          <div className="hidden lg:flex absolute top-1/3 -left-4 xl:-left-12 z-20 items-center gap-2 animate-float-reverse transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black p-0.5 shadow-2xl shadow-cyan-950/50 card-3d-glow border border-slate-700/60 flex items-center justify-center">
              {/* Neon TikTok Glyph */}
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                <path
                  d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.887 2.887 2.896 2.896 0 0 1-2.887-2.887 2.896 2.896 0 0 1 2.887-2.887c.307 0 .604.05.882.141v-3.52a6.34 6.34 0 0 0-.882-.061C5.973 9.345 3.125 12.193 3.125 15.686S5.973 22.027 9.487 22.027c3.514 0 6.362-2.848 6.362-6.341V8.653a8.163 8.163 0 0 0 4.74 1.488V6.697a4.8 4.8 0 0 1-1-.011z"
                  fill="#00F2FE"
                />
                <path
                  d="M18.589 5.686a4.793 4.793 0 0 1-3.77-4.245V1h-2.445v13.672a2.896 2.896 0 0 1-2.887 2.887 2.896 2.896 0 0 1-2.887-2.887 2.896 2.896 0 0 1 2.887-2.887c.307 0 .604.05.882.141v-2.52a6.34 6.34 0 0 0-.882-.061C6.973 9.345 5.125 12.193 5.125 15.686S6.973 22.027 9.487 22.027c3.514 0 6.362-2.848 6.362-6.341V7.653a8.163 8.163 0 0 0 4.74 1.488V5.697a4.8 4.8 0 0 1-2-.011z"
                  fill="#FE2C55"
                  opacity="0.85"
                />
              </svg>
              {/* Glossy top sheen */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
          </div>

          {/* Left Element 3: 3D Instagram Reels Icon + REELS pill */}
          <div className="hidden lg:flex absolute bottom-24 -left-6 xl:-left-14 z-20 items-center gap-2 animate-float-pulse transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-2xl shadow-rose-950/60 card-3d-glow border-t border-amber-200/40 flex items-center justify-center">
              <Instagram className="w-8 h-8 text-white drop-shadow-md" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-pink-300 uppercase shadow-md backdrop-blur-md">
              REELS
            </div>
          </div>

          {/* Left Element 4: 3D Facebook Sphere + CONNECT pill */}
          <div className="hidden lg:flex absolute -bottom-4 left-4 xl:-left-2 z-20 items-center gap-2 animate-float-drift transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800 p-0.5 shadow-2xl shadow-blue-950/70 card-3d-glow border-t border-blue-200/50 flex items-center justify-center">
              <span className="text-2xl font-black text-white drop-shadow leading-none ml-0.5 mt-1 font-sans">
                f
              </span>
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-blue-300 uppercase shadow-md backdrop-blur-md">
              CONNECT
            </div>
          </div>

          {/* RIGHT ORBITAL FLANK: 3D Growth, Business & Creators */}
          {/* Right Element 1: 3D Megaphone Audio Blast + COMPANY GROWING pill */}
          <div className="hidden lg:flex absolute top-4 right-0 xl:-right-6 z-20 items-center gap-2 animate-float-slow transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-amber-300 uppercase shadow-md backdrop-blur-md">
              COMPANY GROWING
            </div>
            <div className="relative w-16 h-14 sm:w-18 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-amber-500 p-0.5 shadow-2xl shadow-indigo-950/60 card-3d-glow border-t border-cyan-200/40 flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-white drop-shadow-lg transform -rotate-12" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
          </div>

          {/* Right Element 2: 3D Rising Growth Chart & Coins + GROW pill */}
          <div className="hidden lg:flex absolute top-1/3 -right-6 xl:-right-14 z-20 items-center gap-2 animate-float-reverse transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-emerald-300 uppercase shadow-md backdrop-blur-md">
              GROW
            </div>
            <div className="relative w-16 h-14 sm:w-18 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-1.5 shadow-2xl shadow-purple-950/60 card-3d-glow border border-purple-500/40 flex flex-col items-center justify-center">
              {/* 3D Mini Bar Chart with Trending Arrow */}
              <div className="flex items-end gap-1.5 h-7">
                <div className="w-2 h-3 bg-amber-400 rounded-t-sm shadow" />
                <div className="w-2 h-5 bg-rose-500 rounded-t-sm shadow" />
                <div className="w-2 h-7 bg-cyan-400 rounded-t-sm shadow" />
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] font-extrabold text-emerald-400">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>+480%</span>
              </div>
            </div>
          </div>

          {/* Right Element 3: 3D Camera & Mic + CREATORS pill */}
          <div className="hidden lg:flex absolute bottom-24 -right-4 xl:-right-12 z-20 items-center gap-2 animate-float-pulse transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-rose-300 uppercase shadow-md backdrop-blur-md">
              CREATORS
            </div>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 p-0.5 shadow-2xl shadow-purple-950/60 card-3d-glow border-t border-purple-200/40 flex items-center justify-center">
              <Camera className="w-7 h-7 text-white drop-shadow-md" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
          </div>

          {/* Right Element 4: 3D Laptop Deal + FREELANCERS pill */}
          <div className="hidden lg:flex absolute -bottom-4 right-4 xl:-right-2 z-20 items-center gap-2 animate-float-drift transform hover:scale-105 transition-transform select-none cursor-default group">
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-black tracking-wider text-cyan-300 uppercase shadow-md backdrop-blur-md">
              FREELANCERS
            </div>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-0.5 shadow-2xl shadow-indigo-950/70 card-3d-glow border-t border-indigo-200/40 flex items-center justify-center">
              <Laptop className="w-7 h-7 text-white drop-shadow-md" />
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
          </div>

          {/* CENTRAL DISPLAY TYPOGRAPHY & HEADLINE (Crisp, Understood, Direct from Reference) */}
          <div className="max-w-3xl mx-auto space-y-6 px-4 z-10">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
              <span className="block text-slate-100 uppercase text-glow-cyan drop-shadow-2xl">
                {t.heroTitle1}
              </span>
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-200 bg-clip-text text-transparent uppercase drop-shadow-[0_4px_30px_rgba(6,182,212,0.4)]">
                {t.heroTitleHighlight}
              </span>
              <span className="block bg-gradient-to-r from-indigo-300 via-purple-200 to-rose-300 bg-clip-text text-transparent uppercase drop-shadow-[0_4px_30px_rgba(168,85,247,0.4)]">
                {t.heroTitle2}
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base font-bold tracking-widest text-cyan-300/90 uppercase max-w-2xl mx-auto leading-relaxed border-t border-b border-cyan-500/20 py-2.5">
              {t.heroSubtitle}
            </p>

            {/* Prominent Glowing Pill CTA Button: START FOR FREE */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {user ? (
                <button
                  onClick={onLaunchStudio}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-cyan-400/50"
                >
                  <Film className="w-5 h-5 text-cyan-200" />
                  <span>{t.launchStudioCta}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => onSelectPlan('free')}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-base sm:text-lg shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-cyan-300/60 uppercase tracking-wider"
                >
                  <Sparkles className="w-5 h-5 text-cyan-200 fill-cyan-200" />
                  <span>{t.freeTrialCta}</span>
                  <ArrowRight className="w-5 h-5 text-cyan-200" />
                </button>
              )}

              {/* Micro-Credits NPR 50 Quick Entry Pass */}
              <button
                onClick={() => onSelectPlan('sasta_50_npr')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-amber-500/40 shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                <span>{t.sastaCta}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold uppercase tracking-wider border border-amber-400/40">
                  FonePay / eSewa
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 8-Pill Ecosystem Grid (Responsive for Mobile, Tablet & Desktop) */}
        <div className="pt-2 max-w-4xl mx-auto">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Integrated Content & Monetization Platforms</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-rose-300 flex items-center gap-2.5 hover:border-red-500/40 transition">
              <Youtube className="w-4 h-4 text-red-500 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">YouTube</span>
                <span className="text-[10px] text-slate-400">Engage & Shorts</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-cyan-300 flex items-center gap-2.5 hover:border-cyan-500/40 transition">
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">TikTok</span>
                <span className="text-[10px] text-slate-400">Viral 9:16</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-pink-300 flex items-center gap-2.5 hover:border-pink-500/40 transition">
              <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Instagram</span>
                <span className="text-[10px] text-slate-400">Reels & Reach</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-blue-300 flex items-center gap-2.5 hover:border-blue-500/40 transition">
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Facebook</span>
                <span className="text-[10px] text-slate-400">Connect & Groups</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-amber-300 flex items-center gap-2.5 hover:border-amber-500/40 transition">
              <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Company Ads</span>
                <span className="text-[10px] text-slate-400">High ROAS Ads</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-indigo-300 flex items-center gap-2.5 hover:border-indigo-500/40 transition">
              <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Scale & Grow</span>
                <span className="text-[10px] text-slate-400">Zero Agency Cost</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-rose-300 flex items-center gap-2.5 hover:border-rose-500/40 transition">
              <Camera className="w-4 h-4 text-rose-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Creators</span>
                <span className="text-[10px] text-slate-400">Monetize Studio</span>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-emerald-300 flex items-center gap-2.5 hover:border-emerald-500/40 transition">
              <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate text-left">
                <span className="text-white block font-bold leading-tight">Freelance</span>
                <span className="text-[10px] text-slate-400">Earn $ & रू</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-3">
          {/* Micro-Credits Entry Point Button */}
          <button
            onClick={() => onSelectPlan('sasta_50_npr')}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-950/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer ring-2 ring-amber-400/40"
          >
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
            <span>{t.sastaCta}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 font-extrabold uppercase tracking-wider border border-amber-400/30">
              FonePay / eSewa
            </span>
          </button>

          {/* Launch or Free Sign In */}
          {user ? (
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Film className="w-5 h-5" />
              <span>{t.launchStudioCta}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('user')}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 font-bold text-sm sm:text-base shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.37 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{t.freeTrialCta}</span>
            </button>
          )}

          {/* HamroAI Chat */}
          <button
            onClick={() => {
              if (onLaunchHamroAi) onLaunchHamroAi();
              else onLaunchStudio();
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bot className="w-5 h-5 text-amber-400" />
            <span>{t.hamroAiCta}</span>
          </button>
        </div>

        {/* Live Social Proof Stats Strip */}
        <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-xl font-black text-rose-400 block">1.25M+</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              {lang === 'ne' ? 'युट्युब र रील्स भ्युज' : lang === 'hi' ? 'यूट्यूब और रील्स व्यूज' : 'YouTube & Reels Views Generated'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-xl font-black text-emerald-400 block">100%</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              {lang === 'ne' ? 'एजेन्सी खर्च बचत' : lang === 'hi' ? 'एजेंसी लागत की बचत' : 'Agency Fees Saved for Business'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-xl font-black text-amber-400 block">रू ५०</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              {lang === 'ne' ? 'सस्तो माइक्रो टप-अप' : lang === 'hi' ? 'सस्ता माइक्रो रिचार्ज' : 'Micro-Pass (3 Img + Vid + Voice)'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-xl font-black text-indigo-400 block">३ भाषा</span>
            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
              {lang === 'ne' ? 'नेपाली, हिन्दी र अंग्रेजी' : lang === 'hi' ? 'नेपाली, हिन्दी और इंग्लिश' : 'Nepali, Hindi & Global English'}
            </span>
          </div>
        </div>
      </section>

      {/* CORE VALUE PILLARS SECTION: Who is it for? */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Rocket className="w-4 h-4 text-rose-500" />
            {t.personaTitle}
          </span>
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
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
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
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
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
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
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
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">
              {lang === 'ne' ? '४. फ्रिलान्सर अफिस' : lang === 'hi' ? '4. फ्रीलांसर्स हब' : '4. Freelancers & Agencies'}
            </span>
          </button>
        </div>

        {/* Active Persona Deep-Dive Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
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
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'पहिलो युट्युब भिडियो बनाउनुहोस्' : lang === 'hi' ? 'पहला यूट्यूब वीडियो बनाएं' : 'Create First Viral Video Now'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('sasta_50_npr')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer"
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

                    <div className="absolute bottom-4 left-3 right-3 text-left space-y-1.5">
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
                    className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-slate-950" />
                    <span>{lang === 'ne' ? 'विजनेसको पहिलो विज्ञापन बनाउनुहोस्' : lang === 'hi' ? 'बिज़नेस का पहला ऐड बनाएं' : 'Create Business Ad in 3 Minutes'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('creator')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
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
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow">
                      बिक्री धमाका • 40% OFF
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left">
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
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'कम्पनीको भिडियो सुरु गर्नुहोस्' : lang === 'hi' ? 'कंपनी वीडियो शुरू करें' : 'Scale Corporate Media'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('pro_studio')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
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
                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                      ENTERPRISE 4K SUITE
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left">
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
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-slate-950" />
                    <span>{lang === 'ne' ? 'आफ्नो अनलाइन अफिस सुरु गर्नुहोस्' : lang === 'hi' ? 'अपना अर्निंग ऑफिस शुरू करें' : 'Open Your Earning Office'}</span>
                  </button>
                  <button
                    onClick={() => onSelectPlan('sasta_50_npr')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer"
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
                    <div className="absolute top-3 left-3 bg-emerald-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded shadow">
                      ORDER COMPLETED: $120.00
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-left">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t.stepTitle}
          </span>
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
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 transition relative group">
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
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition relative group">
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
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition relative group">
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
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition relative group">
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
      <ViralTemplatesSection onSelectTemplate={onSelectTemplate} />

      {/* INTERACTIVE REVENUE & AGENCY SAVINGS CALCULATOR */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              {t.calcTitle}
            </span>
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

      {/* MULTI-FORMAT LIVE INTERACTIVE PREVIEW DOCK (100% NON-BLANK & MOBILE RESPONSIVE) */}
      <section className="py-12 sm:py-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-10">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-500" />
            Live AI Studio Player • 100% Interactive Demo
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne'
              ? 'एउटै स्टुडियोबाट सबै फर्म्याटका भिडियोहरू'
              : lang === 'hi'
              ? 'एक ही स्टूडियो से सभी फॉर्मेट के वीडियो'
              : 'One Unified Studio for All Video Dimensions & Formats'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            {lang === 'ne'
              ? 'अन्तर्राष्ट्रिय सोरा-२ भिडियो, ९:१६ सर्ट्स, पसल विज्ञापन र न्युरल आवाज प्रत्यक्ष चलाएर हेर्नुहोस्।'
              : lang === 'hi'
              ? 'इंटरनेशनल सोरा-2 वीडियो, 9:16 रील्स, दुकान विज्ञापन और नेचुरल वॉइसओवर लाइव टेस्ट करें।'
              : 'Interact directly with real 4K Sora-2 motion, vertical 9:16 reels, customizable shop ads, and acoustic speech.'}
          </p>
        </div>

        <InteractiveStudioPlayer onLaunchStudio={onLaunchStudio} lang={lang} />
      </section>

      {/* MULTILINGUAL TESTIMONIALS & COMMUNITY PROOF */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-emerald-400" />
            Loved By Creators, Businesses & Freelancers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne' 
              ? 'हाम्रा प्रयोगकर्ताहरूको वास्तविक अनुभव र सफलता'
              : lang === 'hi'
              ? 'हमारे यूजर्स का सच्चा अनुभव और सफलता की कहानियां'
              : 'Real Creators, Real Businesses, Real Earnings'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1: Nepali Creator */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-nepali">
              "पहिले एउटा युट्युब भिडियो बनाउन २ दिन एडिटिङमा खेर जान्थ्यो। अहिले नेपालएआईमा १० मिनेटमै ३ वटा सर्ट्स र १ लामो भिडियो रेडी हुन्छ। मेरो च्यानलमा भ्युज ३ गुणा बढेको छ!"
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-600 font-bold text-white flex items-center justify-center text-xs">
                सु
              </div>
              <div>
                <span className="text-xs font-bold text-white block">सुमन श्रेष्ठ (Suman S.)</span>
                <span className="text-[10px] text-slate-400">युट्युब कन्टेन्ट क्रिएटर • काठमाडौं</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2: Nepali Local Business */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-nepali">
              "विजनेसको विज्ञापन बनाउन एजेन्सीलाई लाखौं खर्च हुन्थ्यो। नेपालएआईले गर्दा बिना एजेन्सी हामी आफैंले दशैं र नयाँ वर्षको भिडियो बनाएर फेसबुकमा चलायौं, अर्डर दोब्बर भयो।"
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-600 font-bold text-white flex items-center justify-center text-xs">
                रा
              </div>
              <div>
                <span className="text-xs font-bold text-white block">राजेश महर्जन (Rajesh M.)</span>
                <span className="text-[10px] text-slate-400">फेसन तथा जुत्ता ब्राण्ड ओनर • पोखरा</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3: Hindi / Global Freelancer */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-left">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              "Fiverr aur Upwork par foreign clients ke liye video automation gigs delivery karta hoon. Har video banane mein sirf 10 minutes lagte hain aur har project ka $80–$150 milta hai. Best earning tool!"
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 font-bold text-white flex items-center justify-center text-xs">
                AK
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Amit Kumar (अमित कुमार)</span>
                <span className="text-[10px] text-slate-400">Top-Rated Freelancer • Delhi / Global</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSPARENT PRICING TIERS & SASTA PASS */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Affordable Local & Global Plans</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            {lang === 'ne' 
              ? 'सस्तो, पारदर्शी र सबैको पहुँचमा मूल्य योजना'
              : lang === 'hi'
              ? 'सस्ते, पारदर्शी और आसान प्लान्स'
              : 'Simple, Scalable Plans for Creators and Businesses'}
          </h2>
          <p className="text-sm text-slate-400">
            {lang === 'ne'
              ? 'निःशुल्क परीक्षण गर्नुहोस् वा रू ५० को सस्तो पासबाट तुरुन्तै भिडियो बनाउन सुरु गर्नुहोस्।'
              : lang === 'hi'
              ? 'फ्री ट्रायल से टेस्ट करें या रू 50 के सस्ते पास से अभी अपनी वीडियो बनाना शुरू करें।'
              : 'Test for free with our trial package, or grab the रू 50 Sasta Pass for instant on-demand top-up.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Sasta Pass Tier (50 NPR) */}
          <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-amber-500/60 flex flex-col justify-between space-y-5 relative shadow-lg shadow-amber-950/20">
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
                  <span>📸 3 HD AI Images</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>🎬 1x5-Min Video Render</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>🎙️ 1x5-Min AI Voice</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-[11px]">
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span>FonePay, eSewa, Khalti QR</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('sasta_50_npr')}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-md"
            >
              Get रू 50 Pass Now
            </button>
          </div>

          {/* Free Trial Tier */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
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

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Max 3 low-quality images</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Max 1 video (capped at 2 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Max 1 audio (capped at 4 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Max 1 full project render</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenAuth('user')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>

          {/* Starter Plan */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div className="space-y-4">
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

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>500 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎬 Up to 100 Video Minutes (20 Videos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>📸 100 HD Images OR 50 Voiceovers</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>FonePay, eSewa & Card Gateway</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('starter')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Get Starter Tier
            </button>
          </div>

          {/* Creator Plan (Most Popular) */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-2 border-rose-500/60 flex flex-col justify-between space-y-6 shadow-xl shadow-rose-950/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div className="space-y-4">
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

              <div className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <Zap className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>1,800 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎬 Up to 360 Video Minutes (6 Hours AI Video)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>📸 360 HD Images OR 180 Voiceovers</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>FonePay Instant QR & Mobile Banking</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('creator')}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition cursor-pointer"
            >
              Get Creator Tier
            </button>
          </div>

          {/* Pro Studio / Agency Tier */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div className="space-y-4">
              <span className="px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
                Pro Company & Agency
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$129</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.proStudioNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise capacity, custom voice cloning, team workspaces, priority renders.
              </p>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-purple-400">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>5,000 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎬 Up to 800 Video Mins (Full Movies & Commercials)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎙️ 160 Custom Voiceovers (800 Mins)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>⚡ Dedicated GPU & Custom Voice Clone</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>FonePay, Khalti & Invoice Payment</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('pro_studio')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Get Pro Agency Tier
            </button>
          </div>
        </div>
      </section>

      {/* FINAL HIGH-CONVERTING BOTTOM CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-rose-900/50 via-slate-900 to-indigo-900/50 border border-rose-500/40 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-5 relative z-10">
            <span className="px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold inline-block">
              {lang === 'ne' ? 'भाइरल बन्ने र कमाउने समय आजै हो' : lang === 'hi' ? 'वायरल होने और कमाने का सही समय' : 'Start Your Viral Journey Today'}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {lang === 'ne'
                ? 'आफ्नो पहिलो भिडियो अहिले नै बनाउनुहोस् र आम्दानी सुरु गर्नुहोस्!'
                : lang === 'hi'
                ? 'अपना पहला वीडियो अभी बनाएं और अपनी कमाई की शुरुआत करें!'
                : 'Create Your First Viral Video & Start Earning Today!'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              {lang === 'ne'
                ? 'हजारौं युट्युबर, पसल मालिक र फ्रिलान्सरहरूसँगै नेपालएआई स्टुडियोमा जोडिनुहोस्। बिना क्रेडिट कार्ड तुरुन्तै सुरु गर्नुहोस्।'
                : lang === 'hi'
                ? 'हजारों क्रिएटर्स, बिज़नेस ओनर्स और फ्रीलांसर्स की तरह आज ही शुरुआत करें। नो क्रेडिट कार्ड रिक्वायर्ड।'
                : 'Join thousands of creators, business owners, and solopreneurs generating millions of views and steady income without agency overhead.'}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <button
                  onClick={onLaunchStudio}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Film className="w-5 h-5" />
                  <span>{t.launchStudioCta}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('user')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{t.freeTrialCta}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => onSelectPlan('sasta_50_npr')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{t.sastaCta}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="border-t border-slate-900 py-12 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
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
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>{lang === 'en' ? 'नेपालीमा हेर्नुहोस्' : lang === 'ne' ? 'हिन्दी में देखें' : 'View in English'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
