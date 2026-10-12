import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Video, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Globe, 
  ChevronDown, 
  QrCode,
  TrendingUp,
  DollarSign,
  Briefcase,
  Building2,
  Users,
  Store,
  Film,
  Star,
  Clock,
  Shield,
  Layers,
  Wand2,
  ChevronRight,
  Sun,
  Moon,
  MessageSquare,
  Radio,
  Play
} from 'lucide-react';
import { UserSession, StudioTab } from '../types';
import { InteractiveStudioPlayer } from './InteractiveStudioPlayer';
import { ViralTemplate } from '../data/viralTemplates';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { NepalAiLogo } from './NepalAiLogo';

interface LandingPageViewProps {
  user: UserSession | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onLaunchStudio: () => void;
  onLaunchHamroAi?: () => void;
  onSelectPlan: (planId: 'starter' | 'creator' | 'pro_studio' | 'sasta_50_npr' | string) => void;
  onSelectTemplate?: (template: ViralTemplate) => void;
  onNavigateTab?: (tab: StudioTab) => void;
}

type LangMode = 'en' | 'ne' | 'hi';
type PersonaType = 'creators' | 'business' | 'company' | 'freelancer';

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  user,
  onOpenAuth,
  onLaunchStudio,
  onLaunchHamroAi,
  onSelectPlan,
  onNavigateTab,
}) => {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const lang: LangMode = (language === 'ne' || language === 'hi' || language === 'en') ? language : 'en';
  
  const [heroPrompt, setHeroPrompt] = useState<string>(
    'Cinematic 4K drone shot over Mt. Everest sunrise with golden snow particles'
  );
  const [activePersona, setActivePersona] = useState<PersonaType>('creators');
  const [videoCount, setVideoCount] = useState<number>(15);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showFloatingCta, setShowFloatingCta] = useState<boolean>(false);
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
    { label: '🏔️ सगरमाथा विहानी (Everest)', text: 'Cinematic 4K drone shot over Mt. Everest sunrise with golden snow particles and dramatic lighting' },
    { label: '🛕 पशुपति आरती (Pashupati)', text: 'Pashupati temple evening aarti rituals, oil lamps reflection and sacred devotional chanting in slow motion' },
    { label: '🍲 मोमो क्याफे विज्ञापन (Food Ad)', text: 'Crispy steaming Nepali c-momo platter commercial with spicy chutney dip, 4K macro cinematic close-up' },
    { label: '📻 भर्चुअल एंकर (AI Anchor)', text: 'Professional Nepali virtual news anchor presenting prime news in studio with breaking headlines and charts' },
    { label: '🌿 फेवाताल यात्रा (Pokhara)', text: 'Peaceful Pokhara Phewa lake boat ride with Annapurna range reflection and serene acoustic flute' },
  ];

  // Scroll listener for floating CTA - only appears after scrolling past hero & interactive demo
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > 850);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pricing config fetch
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

  const handleHeroGenerate = () => {
    if (user) {
      onLaunchStudio();
    } else {
      onSelectPlan('free');
    }
  };

  // Content translations
  const t = {
    en: {
      badge: "Sora-2 · Neural Voices · Instant FonePay QR",
      heroH1: "Cinematic AI Video",
      heroHighlight: "Studio",
      heroSubtitle: "Transform ideas into 4K video scenes and authentic neural voiceovers.",
      sastaCta: "Micro-Pass (रू 50)",
      freeTrialCta: "Start Free Trial",
      launchStudioCta: "Launch Studio",
      hamroAiCta: "HamroAI Assistant",
      trustPill: "Watermark-Free HD/4K • Commercial Rights Included • 1,200+ Active Creators",
      capabilitiesTitle: "Four Core Creative Engines",
      capabilitiesSubtitle: "Everything needed to produce studio-grade short films, social reels, and high-converting advertisements.",
      personaTitle: "Tailored for Every Creative Workflow",
      personaSubtitle: "Select your workflow to see how NepalAI Studio streamlines production and saves agency costs.",
      stepsTitle: "Four Steps from Prompt to Published Video",
      stepsSubtitle: "No complex timelines or expensive hardware required. Everything runs in the cloud.",
      calcTitle: "Calculate Your Monthly Impact",
      calcSubtitle: "Estimate video output reach, production cost savings, and client revenue potential.",
      pricingTitle: "Simple, Transparent Pricing",
      pricingSubtitle: "Pay via FonePay, eSewa, local mobile banking, or international cards. Cancel anytime.",
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Common questions about commercial licensing, billing, and technical capabilities.",
    },
    ne: {
      badge: "सोरा-२ · न्युरल नेपाली आवाज · फोनपे क्युआर",
      heroH1: "सिनेमेटिक एआई भिडियो",
      heroHighlight: "स्टुडियो",
      heroSubtitle: "आफ्नो सोचलाई ४K भिडियो र प्राकृतिक आवाजमा बदल्नुहोस्।",
      sastaCta: "सस्तो पास (रू ५० मात्र)",
      freeTrialCta: "निःशुल्क सुरु गर्नुहोस्",
      launchStudioCta: "स्टुडियो खोल्नुहोस्",
      hamroAiCta: "हाम्रो एआई",
      trustPill: "वाटरमार्क बिनाको HD/4K • पूर्ण कमर्सियल अधिकार • १,२००+ सक्रिय क्रिएटरहरू",
      capabilitiesTitle: "चार मुख्य एआई प्रविधिहरू",
      capabilitiesSubtitle: "युट्युब, फेसबुक रील्स, टिकटक र व्यावसायिक विज्ञापनहरू निर्माण गर्ने पूर्ण स्टुडियो।",
      personaTitle: "तपाईंको आवश्यकता अनुसारको समाधान",
      personaSubtitle: "तपाईंको कार्यक्षेत्र छान्नुहोस् र हेर्नुहोस् यसले कसरी काम सजिलो बनाउँछ।",
      stepsTitle: "४ सजिलो चरणमा भिडियो तयार",
      stepsSubtitle: "कुनै महँगो क्यामरा वा भारी सफ्टवेयर चाहिँदैन।",
      calcTitle: "मासिक आम्दानी र बचत क्यालकुलेटर",
      calcSubtitle: "नियमित भिडियो उत्पादन गर्दा हुने सम्भावित आम्दानी र बचत हेर्नुहोस्।",
      pricingTitle: "पारदर्शी र सुलभ मूल्य",
      pricingSubtitle: "फोनपे, इसेवा, स्थानीय बैंकिङ वा कार्डमार्फत सजिलै भुक्तानी गर्नुहोस्।",
      faqTitle: "प्रायः सोधिने प्रश्नहरू",
      faqSubtitle: "कमर्सियल राइट्स, फोनपे भुक्तानी र भिडियो निर्माण सम्बन्धी जानकारी।",
    },
    hi: {
      badge: "सोरा-2 · नेचुरल वॉइस · फोनपे क्यूआर",
      heroH1: "सिनेमैटिक एआई वीडियो",
      heroHighlight: "स्टूडियो",
      heroSubtitle: "अपने विचारों को 4K वीडियो और नेचुरल आवाज़ में बदलें।",
      sastaCta: "सस्ता पास (मात्र रू 50)",
      freeTrialCta: "मुफ़्त शुरू करें",
      launchStudioCta: "स्टूडियो खोलें",
      hamroAiCta: "हाम्रो एआई",
      trustPill: "वॉटरमार्क-रहित HD/4K • फुल कमर्शियल राइट्स • 1,200+ क्रिएटर्स",
      capabilitiesTitle: "चार प्रमुख एआई क्षमताएं",
      capabilitiesSubtitle: "शॉर्ट्स, रील्स और प्रोफेशनल विज्ञापनों के लिए ऑल-इन-वन क्रिएटिव सुइट।",
      personaTitle: "हर क्रिएटर के लिए कस्टमाइज़्ड",
      personaSubtitle: "अपनी श्रेणी चुनें और देखें कि कैसे यह समय और एजेंसी की लागत बचाता है।",
      stepsTitle: "4 आसान चरणों में वीडियो तैयार",
      stepsSubtitle: "बिना किसी कैमरे या जटिल सॉफ्टवेयर के सीधे ब्राउज़र में बनाएं।",
      calcTitle: "मासिक बचत और कमाई कैलकुलेटर",
      calcSubtitle: "जानें हर महीने वीडियो बनाकर आप कितना समय और पैसा बचा सकते हैं।",
      pricingTitle: "पारदर्शी और किफायती प्लान्स",
      pricingSubtitle: "फोनपे, क्यूआर और कार्ड्स से तुरंत एक्टिवेट करें।",
      faqTitle: "अक्सर पूछे जाने वाले सवाल",
      faqSubtitle: "कमर्शियल लाइसेंसिंग, बिलिंग और रेंडरिंग से जुड़े मुख्य उत्तर।",
    }
  }[lang];

  // Calculated ROI values
  const estimatedViews = (videoCount * 28000).toLocaleString();
  const estimatedYoutubeRev = Math.round(videoCount * 38);
  const estimatedYoutubeRevNpr = (estimatedYoutubeRev * 134).toLocaleString();
  const estimatedAgencySavings = Math.round(videoCount * 65);
  const estimatedAgencySavingsNpr = (estimatedAgencySavings * 134).toLocaleString();
  const estimatedFreelanceRev = Math.round(videoCount * 85);
  const estimatedFreelanceRevNpr = (estimatedFreelanceRev * 134).toLocaleString();

  // Persona data mapping
  const personaData: Record<PersonaType, {
    icon: any;
    label: string;
    headline: string;
    description: string;
    benefits: string[];
    statLabel: string;
    statValue: string;
  }> = {
    creators: {
      icon: Users,
      label: lang === 'ne' ? 'युट्युब र रील्स क्रिएटर' : lang === 'hi' ? 'कंटेंट क्रिएटर्स' : 'Content Creators',
      headline: lang === 'ne' ? 'दैनिक भाइरल सर्ट्स र लङ-फर्म भिडियो' : 'Scale Faceless Channels & Viral Shorts',
      description: lang === 'ne' 
        ? 'क्यामरा अगाडि नबसी दैनिक आकर्षक कन्टेन्ट तयार गर्नुहोस् र युट्युब मोनिटाइजेसन सुरु गर्नुहोस्।'
        : 'Publish high-volume Shorts, Reels, and YouTube explainers without filming yourself. Complete with animated subtitles and localized voiceovers.',
      benefits: [
        '9:16 Vertical & 16:9 Landscape multi-format exports',
        'Word-by-word synced Devanagari & English karaoke captions',
        'Direct YouTube OAuth publishing with auto-generated metadata',
        '100% Monetization & copyright safe audiovisual output'
      ],
      statLabel: 'Avg. Views per Channel / Mo',
      statValue: '450,000+'
    },
    business: {
      icon: Store,
      label: lang === 'ne' ? 'स्थानीय व्यापार र पसल' : lang === 'hi' ? 'लोकल बिज़नेस' : 'Local Businesses',
      headline: lang === 'ne' ? 'ग्राहक आकर्षित गर्ने व्यावसायिक विज्ञापन' : 'Turn Products into High-Converting Social Ads',
      description: lang === 'ne'
        ? 'होटल, रेस्टुरेन्ट, पसल वा ट्राभल एजेन्सीका लागि सामाजिक सञ्जालमा चल्ने उत्कृष्ट विज्ञापनहरू बनाउनुहोस्।'
        : 'Create broadcast-ready video promotions for restaurants, hotels, trekking agencies, and retail brands in minutes instead of weeks.',
      benefits: [
        'Cost reduction vs hiring external digital marketing agencies',
        'Authentic Nepali voice acting for local customer trust',
        'Instant promotional asset generation for Facebook & Instagram',
        'One-click QR code and contact banner integration'
      ],
      statLabel: 'Average Agency Cost Saved',
      statValue: 'रू 45,000 / mo'
    },
    company: {
      icon: Building2,
      label: lang === 'ne' ? 'कम्पनी र ब्रान्ड' : lang === 'hi' ? 'कंपनियां और ब्रांड्स' : 'Brands & Enterprises',
      headline: lang === 'ne' ? 'ब्रान्डेड विज्ञापन र कर्पोरेट सामग्री' : 'Consistent Multi-Channel Corporate Video',
      description: lang === 'ne'
        ? 'उत्पादन लन्च, आन्तरिक प्रशिक्षण र सामाजिक अभियानहरूका लागि उच्चस्तरीय ब्रान्ड भिडियोहरू।'
        : 'Enterprise-grade video generation for product launches, employee onboarding, and global marketing with strict brand identity controls.',
      benefits: [
        'Consistent character and corporate visual identity',
        'Custom voice cloning for official brand spokespersons',
        'Enterprise multi-user project sharing and workspaces',
        '4K resolution ProRes and MP4 master exports'
      ],
      statLabel: 'Production Turnaround Time',
      statValue: '< 5 Minutes'
    },
    freelancer: {
      icon: Briefcase,
      label: lang === 'ne' ? 'फ्रिलान्सर र सम्पादक' : lang === 'hi' ? 'फ्रीलांसर्स' : 'Freelance Editors',
      headline: lang === 'ne' ? 'क्लाइन्टलाई छिटो सेवा र राम्रो आम्दानी' : 'Deliver 10x More Client Projects per Week',
      description: lang === 'ne'
        ? 'Upwork, Fiverr वा स्थानीय क्लाइन्टहरूका लागि छिटो उच्चस्तरीय भिडियो तयार गरी आम्दानी बढाउनुहोस्।'
        : 'Take on multiple high-paying client contracts without burning out on manual rendering and tedious subtitle synchronization.',
      benefits: [
        'Deliver complete commercials within 2 hours of briefing',
        'White-label deliverables with zero platform watermarks',
        'Micro-Pass (रू 50) flexibility for low-budget test renders',
        'Multi-track timeline export with full layer separation'
      ],
      statLabel: 'Potential Monthly Earnings',
      statValue: '$1,200+'
    }
  };

  const faqItems = [
    {
      q: lang === 'ne' ? 'के म यी भिडियोहरू युट्युब र फेसबुकमा मोनिटाइज गर्न सक्छु?' : 'Can I monetize videos created on NepalAI Studio on YouTube & Facebook?',
      a: lang === 'ne'
        ? 'हो, तपाईंले तयार गर्नुभएका सबै भिडियो, अडियो र तस्बिरहरूमा पूर्ण कमर्सियल अधिकार तपाईंको रहनेछ। तपाईंले ढुक्कसँग युट्युब, फेसबुक र टिकटकमा आम्दानी गर्न सक्नुहुन्छ।'
        : 'Yes. All generated video, audio, and imagery include full commercial usage rights. You can monetize them across YouTube, Facebook, TikTok, client deliverables, and paid ad campaigns.'
    },
    {
      q: lang === 'ne' ? 'सस्तो पास (रू ५०) कसरी प्रयोग गर्ने?' : 'How does the रू 50 Micro-Pass work?',
      a: lang === 'ne'
        ? 'सस्तो पासले तपाईंलाई कुनै मासिक सदस्यता नलिई तत्काल फोनपे क्युआर वा इसेवामार्फत रू ५० तिरेर भिडियो तथा अडियो जेनेरेट गर्न दिन्छ।'
        : 'The Micro-Pass allows you to generate individual videos and voiceovers on-demand for रू 50 using instant FonePay QR or eSewa without committing to a recurring subscription.'
    },
    {
      q: lang === 'ne' ? 'सोरा-२ भिडियो जेनेरेसन कति लामो हुन्छ?' : 'What video durations are supported by the Sora-2 engine?',
      a: lang === 'ne'
        ? 'सोरा-२ ले ४ सेकेन्ड, ८ सेकेन्ड र १२ सेकेन्डका सिनेमेटिक क्लिपहरू जेनेरेट गर्छ। ती क्लिपहरूलाई हाम्रो मल्टि-ट्र्याक टाइमलाइनमा जोडेर लामो भिडियो बनाउन सकिन्छ।'
        : 'Azure Sora-2 generates native 4s, 8s, and 12s high-resolution scene clips. In the NepalAI multi-track timeline, you can combine multiple scenes, voiceovers, and transitions into long-form videos.'
    },
    {
      q: lang === 'ne' ? 'नेपाली न्युरल आवाज र सबटाइटल कसरी काम गर्छ?' : 'How accurate are the Nepali neural voiceovers and Devanagari subtitles?',
      a: lang === 'ne'
        ? 'हाम्रो स्टुडियोले प्राकृतिक नेपाली र अंग्रेजी उच्चारण भएको २४kHz स्टुडियो अडियो र मुक्ता फन्टमा आधारित स्वचालित सबटाइटल उपलब्ध गराउँछ।'
        : 'The studio utilizes 24kHz studio-grade TTS tuned for fluent Nepali and Indian English. The subtitle engine applies Mukta Devanagari typography with precise word-level synchronization.'
    },
  ];

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
  };

  return (
    <div className="bg-slate-50 dark:bg-[#090B10] text-slate-900 dark:text-slate-100 min-h-screen selection:bg-rose-500 selection:text-white font-sans antialiased overflow-x-hidden transition-colors duration-300">
      {/* Ambient Lighting & Mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        <motion.div 
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.08, 0.12, 0.08]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-rose-500 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.05, 0.09, 0.05]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[800px] left-1/4 w-[550px] h-[400px] bg-indigo-500 rounded-full blur-[110px] pointer-events-none" 
        />
      </div>

      {/* 1. HERO SECTION - CLEAN, UNCLUTTERED & BILINGUAL */}
      <section className="relative pt-8 sm:pt-14 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center w-full"
        >
          {/* Subtle Live Kicker */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 tracking-wide px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              </span>
              <span>नेपालको पहिलो एआई मिडिया स्टुडियो · Sovereign Creative Suite</span>
            </div>
          </motion.div>

          {/* Clean Bilingual Hero Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.14] max-w-4xl mx-auto"
          >
            सिनेमेटिक एआई भिडियो र आवाज
            <span className="block mt-1.5 sm:mt-2.5 text-2xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 dark:from-rose-400 dark:via-purple-300 dark:to-indigo-300 bg-clip-text text-transparent font-extrabold">
              Cinematic AI Video & Studio Suite
            </span>
          </motion.h1>

          {/* Clean Bilingual Hero Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            आफ्नो सोचलाई सेकेन्डमै ४K दृश्य, प्राकृतिक नेपाली आवाज र अटो-क्याप्सनमा बदल्नुहोस्।
            <span className="block mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
              Turn ideas into 4K scenes, Sora-2 motion, neural voices & synced captions in seconds.
            </span>
          </motion.p>

          {/* Interactive Prompt Terminal - Clean & Spacious */}
          <motion.div 
            variants={itemVariants}
            className="relative mt-7 sm:mt-8 w-full max-w-3xl lg:max-w-4xl mx-auto rounded-2xl p-2.5 sm:p-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-slate-900/5 dark:shadow-black/50"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 flex items-center pl-3.5 pr-2 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/[0.08] focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
                <Wand2 className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mr-2.5" />
                <label htmlFor="hero-prompt-input" className="visually-hidden">Video prompt description</label>
                <input
                  id="hero-prompt-input"
                  name="heroPrompt"
                  aria-label="Describe the video you want to generate"
                  type="text"
                  value={heroPrompt}
                  onChange={(e) => setHeroPrompt(e.target.value)}
                  placeholder="कुनै पनि भिडियोको सोच लेख्नुहोस्... (e.g. Mt. Everest sunrise 4K)"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden font-medium py-1"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHeroGenerate}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>{user ? 'स्टुडियो खोल्नुहोस्' : 'निःशुल्क सुरु गर्नुहोस्'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectPlan('sasta_50_npr')}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>सस्तो पास (रू ५०)</span>
                </motion.button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                <Sparkles className="w-3 h-3 text-rose-500" />
                <span>सुझाव:</span>
              </span>
              {promptSuggestions.map((item, idx) => (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  key={idx}
                  onClick={() => setHeroPrompt(item.text)}
                  className="px-3 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer bg-slate-100/90 dark:bg-slate-800/70 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/[0.08] hover:border-rose-500/40"
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Trust Row */}
          <motion.div 
            variants={itemVariants}
            className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>वाटरमार्क-रहित HD/4K</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>पूर्ण कमर्सियल अधिकार</span>
            </div>
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-500" />
              <span>फोनपे / eSewa Instant QR</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. REFINED STUDIO PLAYER DEMO - Expansive & Cinematic Frame */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-14">
        <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>प्रत्यक्ष स्टुडियो डेमो · Live Studio Demo</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            हेर्नुहोस् कसरी ३ मिनेटमा ४K भिडियो, आवाज र सबटाइटल तयार हुन्छ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real Sora-2 4K scenes, authentic neural voiceovers & word-accurate Devanagari captions.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.4 }}
          className="relative w-full"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-indigo-500/20 blur-xl opacity-50 pointer-events-none -z-10" />

          <InteractiveStudioPlayer
            onLaunchStudio={onLaunchStudio}
            lang={lang}
          />
        </motion.div>
      </section>

      {/* 3. FOUR CORE CAPABILITIES - Rich Visual Cards */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-14 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>एआई प्रविधिहरू · Core AI Engines</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            चार मुख्य सिर्जनात्मक प्रविधिहरू · Four Creative Engines
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            युट्युब, रील्स, टिकटक र व्यावसायिक विज्ञापनहरू निर्माण गर्ने पूर्ण स्टुडियो। Everything needed to produce studio-grade short films and reels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Film,
              image: '/samples/everest_sunrise_thumb.jpg',
              color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
              title: 'सोरा-२ सिनेमा · Sora-2 Cinema',
              desc: '४, ८ र १२ सेकेन्डका ४K सिनेमेटिक दृश्यहरू। 4K photorealistic scenes with fluid physics & camera motion.',
              tag: '4K Broadcast Ready',
            },
            {
              icon: Mic,
              image: '/assets/avatars/aarav.jpg',
              color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
              title: 'न्युरल आवाज · Neural Voiceover',
              desc: '२४kHz प्राकृतिक नेपाली, भारतीय अंग्रेजी र हिन्दी आवाज। Fluent broadcast narration in authentic accents.',
              tag: 'Azure & SpeechT5 Master',
            },
            {
              icon: Sparkles,
              image: '/samples/durbar_square_thumb.jpg',
              color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
              title: 'देवनागरी सबटाइटल · Captions',
              desc: 'शब्द-शब्दमा मेल खाने मुक्ता फन्ट काराओके सबटाइटल। Word-level sync with native Mukta typography.',
              tag: 'Karaoke Frame Sync',
            },
            {
              icon: Zap,
              image: '/samples/phewa_lake_thumb.jpg',
              color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
              title: '१-क्लिक पब्लिश · 1-Click Post',
              desc: 'युट्युब सर्ट्स र इन्स्टाग्राम रील्समा सीधा पब्लिश गर्नुहोस्। Export directly with optimized SEO tags.',
              tag: 'YouTube & Reels Ready',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -3 }}
                className="group rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] transition shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Thumbnail Header */}
                <div className="relative h-28 w-full overflow-hidden bg-slate-950">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/samples/everest_sunrise_thumb.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-lg border backdrop-blur-md flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="absolute bottom-2 right-2.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-slate-200 border border-white/10">
                    {item.tag}
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    <span>स्टुडियोमा प्रयोग गर्नुहोस्</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3.5 RECENT STUDIO SHOWCASES (High-Resolution Sample Showcase) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>स्टुडियो नमुनाहरू · Studio Showcase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              हालै तयार गरिएका उत्कृष्ट सिनेमेटिक दृश्यहरू
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Broadcast-quality clips generated with NepalAI Studio engines. Click to launch.
            </p>
          </div>
          <button
            onClick={onLaunchStudio}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <span>सबै दृश्य हेर्नुहोस् · Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'सगरमाथा विहानी (Everest Dawn)',
              subtitle: 'Sora-2 Cinema · 4K Drone Simulation',
              thumb: '/samples/everest_sunrise_thumb.jpg',
              duration: '0:04',
              aspect: '१६:९ 4K',
            },
            {
              title: 'काठमाडौँ दरबार स्क्वायर (Durbar Heritage)',
              subtitle: 'Historical Heritage · Neural Soundscape',
              thumb: '/samples/durbar_square_thumb.jpg',
              duration: '0:08',
              aspect: '१६:९ 4K',
            },
            {
              title: 'पोखरा फेवाताल यात्रा (Phewa Lake Reel)',
              subtitle: '9:16 Shorts · Annapurna Reflections',
              thumb: '/samples/phewa_lake_thumb.jpg',
              duration: '0:12',
              aspect: '९:१६ Shorts',
            },
            {
              title: 'प्राइमटाइम एआई समाचार (Virtual Anchor)',
              subtitle: '24kHz Studio Audio · Lip-Sync Anchor',
              thumb: '/samples/dual_anchor_primetime_poster.jpg',
              duration: '0:16',
              aspect: '१६:९ News',
            },
          ].map((sample, sIdx) => (
            <motion.div
              key={sIdx}
              whileHover={{ y: -4 }}
              onClick={onLaunchStudio}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] hover:border-rose-500/40 transition shadow-xs overflow-hidden"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={sample.thumb}
                  alt={sample.title}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/samples/everest_sunrise_thumb.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/70 text-slate-200 border border-white/10">
                  {sample.duration}
                </span>
                <span className="absolute bottom-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-600/90 text-white">
                  {sample.aspect}
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors truncate">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {sample.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. PERSONA & WORKFLOW SELECTOR */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.personaTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {t.personaSubtitle}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {(Object.keys(personaData) as PersonaType[]).map((key) => {
            const item = personaData[key];
            const Icon = item.icon;
            const isActive = activePersona === key;
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={key}
                onClick={() => setActivePersona(key)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-white/[0.08]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Persona Card */}
        <motion.div 
          key={activePersona}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/[0.1] p-6 sm:p-8 shadow-sm backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 text-xs font-bold">
                <span>{personaData[activePersona].label}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {personaData[activePersona].headline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {personaData[activePersona].description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {personaData[activePersona].benefits.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-white/[0.08] text-center space-y-4 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {personaData[activePersona].statLabel}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">
                {personaData[activePersona].statValue}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLaunchStudio}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer active:scale-98 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Launch for {personaData[activePersona].label}</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. 4-STEP PRODUCTION PIPELINE */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.stepsTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {t.stepsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Prompt & Script', desc: 'Type your scene idea or paste a YouTube script. AI structures scenes automatically.' },
            { step: '02', title: 'Sora-2 Generation', desc: 'Synthesize 4K motion scenes with fluid physics and cinematic camera angles.' },
            { step: '03', title: 'Voice & Subtitles', desc: 'Generate 24kHz neural narration with auto-aligned Devanagari karaoke text.' },
            { step: '04', title: 'Export & Monetize', desc: 'Download watermark-free MP4 or publish directly to YouTube and TikTok.' },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.08] relative space-y-3 shadow-sm"
            >
              <span className="text-2xl font-black text-slate-400 dark:text-slate-600">{item.step}</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. ROI & EARNINGS CALCULATOR */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.calcTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {t.calcSubtitle}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/[0.1] max-w-5xl mx-auto shadow-sm"
        >
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label htmlFor="calc-video-count" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Videos Created Monthly:
              </label>
              <span className="text-rose-600 dark:text-rose-400 font-bold text-base">{videoCount} videos / month</span>
            </div>
            <label htmlFor="calc-video-count" className="visually-hidden">
              Monthly video production quantity slider (3 to 60 videos per month)
            </label>
            <input
              id="calc-video-count"
              name="monthlyVideoCount"
              type="range"
              min={3}
              max={60}
              value={videoCount}
              aria-label="Videos Created Monthly Slider"
              aria-valuemin={3}
              aria-valuemax={60}
              aria-valuenow={videoCount}
              aria-valuetext={`${videoCount} videos per month`}
              onChange={(e) => setVideoCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span>3 (Casual)</span>
              <span>15 (Weekly Creator)</span>
              <span>30 (Daily Shorts)</span>
              <span>60 (Agency)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-white/[0.08] text-center">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Estimated Views</div>
              <div className="text-2xl font-black text-slate-950 dark:text-white">{estimatedViews}</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">Shorts & Reels Traffic</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-white/[0.08] text-center">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Agency Cost Saved</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">रू {estimatedAgencySavingsNpr}</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">~${estimatedAgencySavings} USD Saved</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-white/[0.08] text-center">
              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-1">Freelance Client Rev</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">रू {estimatedFreelanceRevNpr}</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-1">~${estimatedFreelanceRev} USD Potential</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 7. ARCHITECTURAL PRICING MATRIX */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.pricingTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {t.pricingSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Micro-Pass */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/40 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                Sasta Pass
              </span>
              <div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">रू 50</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 ml-1 font-semibold">/ one-time</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">Single project top-up with instant FonePay QR.</p>
              <div className="space-y-1.5 text-[11px] text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-300/80 dark:border-white/[0.08] font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" /><span>1 Full Video Render</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" /><span>10 HD Images or Voices</span></div>
                <div className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" /><span>FonePay & eSewa</span></div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlan('sasta_50_npr')}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition cursor-pointer active:scale-98 shadow-sm"
            >
              Get रू 50 Pass
            </motion.button>
          </motion.div>

          {/* Free Trial */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/[0.08] flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2.5">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase tracking-wider border border-slate-300 dark:border-white/10">
                Free Trial
              </span>
              <div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">$0</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 ml-1 font-semibold">/ forever</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Evaluate the studio tools with no commitment.</p>
              <div className="space-y-1.5 text-[11px] text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-white/[0.08] font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>3 Test Images</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>1 Test Video</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>1 Voice Narration</span></div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenAuth('user')}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 text-xs font-bold transition cursor-pointer active:scale-98 shadow-sm"
            >
              Start Free
            </motion.button>
          </motion.div>

          {/* Starter */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/[0.08] flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                Starter
              </span>
              <div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">$19</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">(रू {pricingConfig.starterNpr.toLocaleString()})</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">For solo creators and weekly video channels.</p>
              <div className="space-y-1.5 text-[11px] text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-white/[0.08] font-medium">
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span>500 Credits/mo</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>20 Full Videos</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>50 Voiceovers</span></div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlan('starter')}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer active:scale-98 shadow-sm"
            >
              Choose Starter
            </motion.button>
          </motion.div>

          {/* Creator (Featured) */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-gradient-to-b from-rose-500/[0.1] to-white dark:from-rose-950/40 dark:to-slate-900 border border-rose-500/60 flex flex-col justify-between space-y-4 relative shadow-lg shadow-rose-950/10 dark:shadow-rose-950/20"
          >
            <div className="space-y-2.5">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                Creator (Popular)
              </span>
              <div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">$49</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">(रू {pricingConfig.creatorNpr.toLocaleString()})</span>
              </div>
              <p className="text-[11px] text-slate-800 dark:text-slate-200 font-medium">Active creators & local business promotions.</p>
              <div className="space-y-1.5 text-[11px] text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-300/80 dark:border-white/[0.08] font-semibold">
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" /><span>1,800 Credits/mo</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>6 Hours AI Video</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Priority Rendering</span></div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlan('creator')}
              className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-98"
            >
              Choose Creator
            </motion.button>
          </motion.div>

          {/* Pro Agency */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/[0.08] flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2.5">
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
                Pro Agency
              </span>
              <div>
                <span className="text-2xl font-black text-slate-950 dark:text-white">$129</span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">(रू {pricingConfig.proStudioNpr.toLocaleString()})</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Agencies, studios & multi-seat teams.</p>
              <div className="space-y-1.5 text-[11px] text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-white/[0.08] font-medium">
                <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" /><span>5,000 Credits/mo</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Voice Cloning</span></div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /><span>Multi-User Seats</span></div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPlan('pro_studio')}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition cursor-pointer active:scale-98 shadow-sm"
            >
              Choose Agency
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 8. COLLAPSIBLE FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-16 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.faqTitle}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {t.faqSubtitle}
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-white/[0.08] overflow-hidden transition shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed border-t border-slate-200 dark:border-white/[0.06] pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8.5 POPULAR AI WORKFLOWS & KEYWORD HUB (SEO OPTIMIZED FOR NEPAL, INDIA & SOUTH ASIA) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
            {lang === 'ne' 
              ? 'नेपाल र भारतमा ट्रेन्डिङ एआई टूल्स' 
              : lang === 'hi' 
              ? 'भारत और नेपाल में ट्रेंडिंग एआई टूल्स' 
              : 'Trending AI Creation in Nepal & India'}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {lang === 'ne' 
              ? 'सबैभन्दा लोकप्रिय एआई भिडियो, आवाज र कन्टेन्ट वर्कफ्लोहरू' 
              : lang === 'hi' 
              ? 'सर्वश्रेष्ठ एआई वीडियो, वॉइस और कंटेंट निर्माण प्लेटफॉर्म'
              : 'Popular AI Video, Voice & Content Generation Workflows'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Discover why YouTube creators, news channels, podcasters, and digital marketing agencies across Nepal and India choose NepalAI Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-xs">🎙️</span>
              <span>Nepali & Hindi TTS (Neural Voice)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Crystal-clear 24kHz neural speech synthesis in native Nepali Devanagari, Hindi, and Indian English accents. Perfect for audiobooks, documentary narrations, and podcasts.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['नेपाली आवाज AI', 'हिंदी TTS', 'Voice Cloning', 'SpeechT5'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 text-xs">🎬</span>
              <span>Azure Sora-2 AI Video Generator</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Transform English, Hindi, or Nepali prompts into 1080p photorealistic cinematic clips. Build continuous multi-scene stories with subject DNA locking and prompt context continuity.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Sora 2 Video', 'AI Video Maker India', 'Cinematic 4K', 'Text to Video'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-xs">👤</span>
              <span>AI News Anchors & Avatars</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Create realistic digital news presenters with accurate lip-synchronization for breaking news, Loksewa preparation, daily weather bulletins, and YouTube Shorts.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['AI News Anchor', 'Virtual Presenter', 'Lip Sync Hindi', 'Reels Maker'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="p-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 text-xs">🤖</span>
              <span>HamroAI Multilingual Assistant</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Intelligent cultural LLM powered by GPT-4o and GPT-5-mini. Generate video scripts, ad copy, translations, and Loksewa exam notes with deep cultural grounding.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['HamroAI', 'हाम्रो एआई', 'Nepali LLM', 'Script Generator'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-r from-rose-500/[0.1] via-purple-500/[0.08] to-indigo-500/[0.1] dark:from-rose-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-300 dark:border-white/[0.12] p-8 sm:p-12 text-center relative overflow-hidden shadow-xl"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {lang === 'ne'
                ? 'आफ्नो पहिलो भिडियो अहिले नै बनाउनुहोस्'
                : lang === 'hi'
                ? 'अपना पहला वीडियो अभी तैयार करें'
                : 'Start Creating Studio-Grade Videos Today'}
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              {lang === 'ne'
                ? 'हजारौं क्रिएटरहरूसँगै नेपालएआई स्टुडियोमा जोडिनुहोस् र आफ्ना सामाजिक सञ्जाललाई नयाँ उचाइमा पुर्‍याउनुहोस्।'
                : 'Join creators and businesses generating millions of views with Azure Sora-2 motion, neural voiceovers, and frame-accurate Devanagari subtitles.'}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{t.launchStudioCta}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectPlan('sasta_50_npr')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{t.sastaCta}</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PERSISTENT FLOATING QUICK ACTION PILL */}
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto ${
          showFloatingCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-white/[0.15] shadow-2xl backdrop-blur-lg">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mr-1 hidden sm:inline">
            NepalAI Studio
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLaunchStudio}
            className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectPlan('sasta_50_npr')}
            className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3 h-3 fill-slate-950" />
            <span>रू 50</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
