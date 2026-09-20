import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Youtube, 
  Smartphone, 
  Store, 
  Mic, 
  Film, 
  TrendingUp, 
  Share2, 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Disc, 
  Flame, 
  Check, 
  Zap, 
  RotateCcw,
  Sliders,
  PhoneCall,
  QrCode,
  Tag
} from 'lucide-react';

interface InteractiveStudioPlayerProps {
  onLaunchStudio: () => void;
  lang?: 'en' | 'ne' | 'hi';
}

export type DemoMode = 'video' | 'shorts' | 'business' | 'voice';

export const InteractiveStudioPlayer: React.FC<InteractiveStudioPlayerProps> = ({
  onLaunchStudio,
  lang = 'ne',
}) => {
  const [activeDemo, setActiveDemo] = useState<DemoMode>('video');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(4);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<'aakash' | 'preeti' | 'kabir' | 'sunita'>('aakash');
  
  // Interactive shop customizer state for "Business Commercial" mode
  const [businessName, setBusinessName] = useState<string>('काठमाडौँ फेसन हाउस');
  const [businessOffer, setBusinessOffer] = useState<string>('दशैं-तिहार धमाका • ५०% सम्म विशेष छुट!');
  const [businessPhone, setBusinessPhone] = useState<string>('९८०१२३४५६७');

  const totalDuration = 30; // 30 seconds demo loop
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Subtitle phrases with sync for karaoke
  const subtitlesData = {
    video: [
      { start: 0, end: 7, ne: 'बौद्धनाथ स्तुपाको साँझको सुनौलो किरण...', en: 'The sacred golden sunset twilight over Boudhanath Stupa...' },
      { start: 7, end: 16, ne: 'प्राकृतिक घण्टीको धुन र शान्तिपूर्ण हिमाली बतास...', en: 'Chiming temple bells and the peaceful Himalayan breeze...' },
      { start: 16, end: 24, ne: 'नेपालएआई सोरा-२ बाट निर्मित सिनेम्याटिक भिडियो दृश्य।', en: 'Cinematic 4K scene rendered with NepalAI Sora-2 engine.' },
      { start: 24, end: 30, ne: 'अब तपाईं पनि ३ मिनेटमै यस्तै भिडियो बनाउनुहोस्!', en: 'Produce viral cinema in 3 minutes without camera gear!' },
    ],
    shorts: [
      { start: 0, end: 8, ne: 'सगरमाथाको विहानी: पहिलो किरणले हिमाल चुम्दा...', en: 'Everest Sunrise: When the first rays touch the peaks...' },
      { start: 8, end: 18, ne: 'भाइरल युट्युब सर्ट्स र टिकटक भिडियो तयार!', en: 'Viral YouTube Shorts & Reels crafted automatically!' },
      { start: 18, end: 30, ne: 'क्यामरा बिना फेथलेस च्यानल चलाउनुहोस् र कमाउनुहोस्।', en: 'Run faceless YouTube channels and keep monetizing.' },
    ],
    business: [
      { start: 0, end: 10, ne: `${businessName} मा भव्य अफर! ${businessOffer}`, en: `Special Offer at ${businessName}! ${businessOffer}` },
      { start: 10, end: 20, ne: `सम्पर्क: ${businessPhone} • फोनपे / इसेवा भुक्तानी उपलब्ध`, en: `Call: ${businessPhone} • FonePay & eSewa accepted` },
      { start: 20, end: 30, ne: 'कुनै एजेन्सी बिना आफ्नो पसलको भिडियो विज्ञापन ३ मिनेटमै!', en: 'Zero agency fees — High converting shop commercial!' },
    ],
    voice: [
      { start: 0, end: 10, ne: 'नेपालको पहिलो व्यावसायिक एआई न्युरल भोइसओभर स्टुडियो।', en: "Nepal's first authentic neural TTS studio with acoustic clarity." },
      { start: 10, end: 20, ne: 'आकाश, प्रीति र कबीरको प्राकृतिक आवाजमा तुरुन्तै अडियो सुन्नुहोस्।', en: 'Synthesize Aakash, Preeti & Kabir voices instantly.' },
      { start: 20, end: 30, ne: '४८kHz हाई-फिडेलिटी मास्टर साउन्ड सीधा टाइमलाइनमा।', en: 'Studio-grade 48kHz master audio directly on the timeline.' },
    ],
  };

  const currentSubtitleList = subtitlesData[activeDemo];
  const activeSub = currentSubtitleList.find((s) => currentTime >= s.start && currentTime <= s.end) || currentSubtitleList[0];

  // Playback timeline timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            return 0;
          }
          return Math.round((prev + 0.5) * 10) / 10;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Natural Speech Synthesis playback for preview voices when unmuted
  useEffect(() => {
    if (isMuted || !isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const speakCurrentSubtitle = () => {
      try {
        window.speechSynthesis.cancel();
        const textToSpeak = lang === 'en' ? activeSub.en : activeSub.ne;
        if (!textToSpeak) return;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();

        if (selectedVoice === 'aakash') {
          utterance.pitch = 0.95;
          utterance.rate = 1.0;
          const matched = voices.find(v => v.lang.startsWith('ne') || v.lang.startsWith('hi') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('male')));
          if (matched) utterance.voice = matched;
        } else if (selectedVoice === 'preeti') {
          utterance.pitch = 1.25;
          utterance.rate = 1.02;
          const matched = voices.find(v => (v.lang.startsWith('ne') || v.lang.startsWith('hi') || v.lang.startsWith('en')) && v.name.toLowerCase().includes('female'));
          if (matched) utterance.voice = matched;
        } else if (selectedVoice === 'kabir') {
          utterance.pitch = 0.85;
          utterance.rate = 0.98;
          const matched = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('ne') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('male')));
          if (matched) utterance.voice = matched;
        } else if (selectedVoice === 'sunita') {
          utterance.pitch = 1.15;
          utterance.rate = 0.96;
          const matched = voices.find(v => v.lang.startsWith('ne') || v.lang.startsWith('hi') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female')));
          if (matched) utterance.voice = matched;
        }

        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // Fail gracefully if Web Speech API blocked by browser policy
      }
    };

    // Slight debounce so quick timeline seeks don't stutter
    const timer = setTimeout(speakCurrentSubtitle, 80);

    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeSub.ne, activeSub.en, isMuted, isPlaying, selectedVoice, lang]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(Math.round(newProgress * totalDuration * 10) / 10);
  };

  const progressPercent = (currentTime / totalDuration) * 100;

  return (
    <div 
      ref={containerRef}
      className="w-full bg-[#0B0F19] text-white border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all"
    >
      {/* Top Header Dock & Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-800/80 p-3 sm:px-5 sm:py-3.5 gap-3 bg-slate-950/80">
        {/* Terminal / Live Studio Indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>
          <span className="text-xs text-slate-300 font-mono pl-1 hidden xs:inline">
            nepalai-studio / <span className="text-rose-400 font-semibold">live-player</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold ml-auto sm:ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>LIVE 4K PREVIEW</span>
          </div>
        </div>

        {/* 4 Interactive Mode Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs gap-1">
          <button
            id="player-tab-video"
            onClick={() => {
              setActiveDemo('video');
              setCurrentTime(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              activeDemo === 'video'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">{lang === 'ne' ? 'युट्युब 16:9' : lang === 'hi' ? 'यूट्यूब 16:9' : 'YouTube 16:9'}</span>
          </button>

          <button
            id="player-tab-shorts"
            onClick={() => {
              setActiveDemo('shorts');
              setCurrentTime(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              activeDemo === 'shorts'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">{lang === 'ne' ? 'सर्ट्स / रील्स (9:16)' : lang === 'hi' ? 'रील्स (9:16)' : 'Shorts & Reels'}</span>
          </button>

          <button
            id="player-tab-business"
            onClick={() => {
              setActiveDemo('business');
              setCurrentTime(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              activeDemo === 'business'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{lang === 'ne' ? 'पसल विज्ञापन' : lang === 'hi' ? 'दुकान विज्ञापन' : 'Shop Ad'}</span>
          </button>

          <button
            id="player-tab-voice"
            onClick={() => {
              setActiveDemo('voice');
              setCurrentTime(0);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] ${
              activeDemo === 'voice'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{lang === 'ne' ? 'न्युरल आवाज' : lang === 'hi' ? 'नेचुरल आवाज' : 'Neural Voice'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Canvas */}
      <div className="relative bg-[#07090E] flex flex-col justify-between min-h-[300px] sm:min-h-[400px]">
        
        {/* ================= MODE 1: YOUTUBE 16:9 CINEMATIC ================= */}
        {activeDemo === 'video' && (
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[460px] flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
            {/* Photorealistic Himalayan Twilight Scene: Sun Behind Mountain, Electric Pole & 5-Color Flags */}
            <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
              <svg 
                className="w-full h-full object-cover pointer-events-none" 
                viewBox="0 0 1200 675" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  {/* Sky Twilight Gradient */}
                  <linearGradient id="skyAtmosphere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#080c1a" />
                    <stop offset="35%" stopColor="#1e1b4b" />
                    <stop offset="60%" stopColor="#4c1d24" />
                    <stop offset="78%" stopColor="#9a3412" />
                    <stop offset="92%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>

                  {/* Sun Corona Radial Glow (Behind the Mountain) */}
                  <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                    <stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                    <stop offset="75%" stopColor="#ea580c" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
                  </radialGradient>

                  {/* Distant Mountain Peak Alpenglow */}
                  <linearGradient id="snowPeakGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                    <stop offset="20%" stopColor="#fde047" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#f97316" stopOpacity="0.6" />
                    <stop offset="75%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Mid-Ground Mountain Ridge */}
                  <linearGradient id="midRidge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>

                  {/* Foreground Mountain Terrain */}
                  <linearGradient id="foreTerrain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#05080f" />
                  </linearGradient>

                  {/* Electric Pole Gradients */}
                  <linearGradient id="poleGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0b0f19" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#080c14" />
                  </linearGradient>
                  <linearGradient id="transformerBody" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="stupaGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                </defs>

                {/* 1. LAYER 1: SKY BACKGROUND */}
                <rect width="1200" height="675" fill="url(#skyAtmosphere)" />

                {/* Stars in Upper Twilight Sky */}
                <circle cx="150" cy="40" r="1" fill="#ffffff" opacity="0.8" />
                <circle cx="280" cy="65" r="1.2" fill="#ffffff" opacity="0.9" />
                <circle cx="450" cy="35" r="0.8" fill="#ffffff" opacity="0.7" />
                <circle cx="820" cy="50" r="1.5" fill="#ffffff" opacity="0.95" />
                <circle cx="950" cy="75" r="1" fill="#ffffff" opacity="0.8" />
                <circle cx="1100" cy="45" r="1.2" fill="#ffffff" opacity="0.85" />

                {/* 2. LAYER 2: THE SUN (SITTING BEHIND THE MOUNTAIN RIDGELINE) */}
                <g transform="translate(620, 275)">
                  {/* Atmospheric Sun Glow Halo */}
                  <circle cx="0" cy="0" r="260" fill="url(#sunCorona)" opacity="0.85" />
                  {/* Sun Corona Core */}
                  <circle cx="0" cy="0" r="75" fill="#fffbeb" />
                  {/* Upward Twilight Sky Rays */}
                  <polygon points="0,0 -80,-275 -30,-275" fill="#fde047" opacity="0.15" />
                  <polygon points="0,0 20,-275 80,-275" fill="#fde047" opacity="0.15" />
                  <polygon points="0,0 120,-275 190,-275" fill="#fde047" opacity="0.12" />
                </g>

                {/* 3. LAYER 3: DISTANT HIMALAYAN SNOW PEAKS (IN FRONT OF SUN - OCCLUDING LOWER SUN) */}
                {/* Back Snow Peaks (Everest, Lhotse, Ama Dablam crests physically covering bottom half of the sun) */}
                <path 
                  d="M0 410 L90 320 L180 370 L290 280 L380 330 L520 220 L610 270 L720 190 L830 280 L960 210 L1080 300 L1200 230 L1200 675 L0 675 Z" 
                  fill="url(#snowPeakGlow)" 
                />
                
                {/* Snow Ridge Shading & Glacial Couloirs */}
                <path d="M520 220 L550 290 L610 270 L650 340 L720 190 L750 280 L830 280 L890 350 L960 210 L1010 300 L1080 300 L1200 675 L520 675 Z" fill="#0f172a" opacity="0.65" />
                <path d="M0 410 L90 320 L130 390 L180 370 L240 420 L290 280 L340 370 L380 330 L450 420 L520 220 L0 675 Z" fill="#1e293b" opacity="0.7" />

                {/* Middle Mountain Ridge (Rich Slate/Indigo with Depth) */}
                <path 
                  d="M0 460 L140 360 L280 430 L440 330 L600 410 L750 310 L910 390 L1070 320 L1200 380 L1200 675 L0 675 Z" 
                  fill="url(#midRidge)" 
                />

                {/* Closer Valley Foothill Ridge */}
                <path 
                  d="M0 520 L180 430 L360 500 L550 410 L780 490 L990 420 L1200 480 L1200 675 L0 675 Z" 
                  fill="url(#foreTerrain)" 
                />

                {/* 4. LAYER 4: BOUDHANATH STUPA SILHOUETTE (MIDDLE-RIGHT GROUND) */}
                <g transform="translate(720, 345)" opacity="0.95">
                  {/* Golden Pinnacle / Gajur */}
                  <path d="M60,10 L56,35 L64,35 Z" fill="#fef08a" />
                  <circle cx="60" cy="8" r="4" fill="#fef08a" />
                  {/* 13 Steps Golden Spire */}
                  <polygon points="60,35 46,110 74,110" fill="url(#stupaGold)" />
                  {/* Harmika (Square Cube) */}
                  <rect x="42" y="110" width="36" height="22" fill="#92400e" rx="1" />
                  {/* Eyes of Buddha */}
                  <circle cx="53" cy="121" r="2.5" fill="#fef08a" />
                  <circle cx="67" cy="121" r="2.5" fill="#fef08a" />
                  {/* White Hemisphere Dome (Garba) */}
                  <path d="M12,175 C12,130 38,132 60,132 C82,132 108,130 108,175 Z" fill="#f1f5f9" />
                  {/* Stupa Multi-tiered Plinth */}
                  <polygon points="2,175 118,175 126,200 -6,200" fill="#1e293b" />
                  <rect x="-18" y="200" width="156" height="40" fill="#090d16" />
                </g>

                {/* 5. LAYER 5: KATHMANDU ELECTRIC UTILITY POLE & POWER/FIBER CABLES */}
                <g transform="translate(130, 140)">
                  {/* Main Vertical Pole (Tapered Concrete/Timber) */}
                  <polygon points="38,0 32,535 48,535 42,0" fill="url(#poleGrad)" stroke="#05080f" strokeWidth="1" />
                  
                  {/* Top Crossarm Horizontal Beam 1 */}
                  <rect x="-35" y="45" width="150" height="9" fill="#1e293b" rx="1" stroke="#05080f" strokeWidth="0.8" />
                  {/* Crossarm Diagonal Metal Braces */}
                  <line x1="40" y1="75" x2="-15" y2="54" stroke="#475569" strokeWidth="2.5" />
                  <line x1="40" y1="75" x2="95" y2="54" stroke="#475569" strokeWidth="2.5" />

                  {/* High-Voltage Ceramic Pin Insulators with Caps */}
                  <rect x="-24" y="32" width="8" height="14" fill="#64748b" rx="2" />
                  <circle cx="-20" cy="30" r="3" fill="#cbd5e1" />
                  <rect x="22" y="32" width="8" height="14" fill="#64748b" rx="2" />
                  <circle cx="26" cy="30" r="3" fill="#cbd5e1" />
                  <rect x="60" y="32" width="8" height="14" fill="#64748b" rx="2" />
                  <circle cx="64" cy="30" r="3" fill="#cbd5e1" />
                  <rect x="102" y="32" width="8" height="14" fill="#64748b" rx="2" />
                  <circle cx="106" cy="30" r="3" fill="#cbd5e1" />

                  {/* Middle Crossarm Horizontal Beam 2 */}
                  <rect x="-20" y="110" width="125" height="8" fill="#1e293b" rx="1" stroke="#05080f" strokeWidth="0.8" />
                  <line x1="40" y1="135" x2="0" y2="118" stroke="#475569" strokeWidth="2" />
                  <line x1="40" y1="135" x2="80" y2="118" stroke="#475569" strokeWidth="2" />

                  {/* Distribution Step-down Transformer Unit */}
                  <rect x="46" y="145" width="34" height="48" fill="url(#transformerBody)" rx="3" stroke="#090d16" strokeWidth="1" />
                  {/* Transformer Vertical Cooling Fins */}
                  <line x1="50" y1="152" x2="50" y2="186" stroke="#475569" strokeWidth="1.5" />
                  <line x1="56" y1="152" x2="56" y2="186" stroke="#475569" strokeWidth="1.5" />
                  <line x1="63" y1="152" x2="63" y2="186" stroke="#475569" strokeWidth="1.5" />
                  <line x1="70" y1="152" x2="70" y2="186" stroke="#475569" strokeWidth="1.5" />
                  <line x1="76" y1="152" x2="76" y2="186" stroke="#475569" strokeWidth="1.5" />
                  {/* Transformer Bushings on Top */}
                  <rect x="52" y="137" width="5" height="9" fill="#94a3b8" rx="1" />
                  <rect x="68" y="137" width="5" height="9" fill="#94a3b8" rx="1" />

                  {/* Streetlamp Fixture Extension */}
                  <path d="M38,130 C-30,120 -55,140 -75,170" stroke="#1e293b" strokeWidth="3" fill="none" />
                  <polygon points="-83,172 -67,172 -75,165" fill="#334155" />
                  <ellipse cx="-75" cy="173" rx="6" ry="2.5" fill="#fef08a" opacity="0.9" />

                  {/* Lower Telecom / Internet Cable Coils */}
                  <circle cx="40" cy="240" r="14" stroke="#0a0e17" strokeWidth="3" fill="none" opacity="0.8" />
                  <circle cx="40" cy="240" r="10" stroke="#0a0e17" strokeWidth="2" fill="none" opacity="0.8" />
                  <rect x="32" y="270" width="16" height="6" fill="#1e293b" />
                </g>

                {/* Multi-layered Sagging Transmission & Optical Fiber Wires */}
                {/* Top High-Voltage Line 1 */}
                <path d="M0,172 Q110,170 195,170 Q650,240 1200,120" stroke="#0f172a" strokeWidth="1.8" fill="none" opacity="0.85" />
                {/* Top High-Voltage Line 2 */}
                <path d="M0,185 Q150,183 236,183 Q700,265 1200,145" stroke="#090d16" strokeWidth="2" fill="none" opacity="0.9" />
                {/* Secondary Power Lines */}
                <path d="M0,250 Q170,250 230,250 Q750,350 1200,220" stroke="#090d16" strokeWidth="1.6" fill="none" opacity="0.8" />
                {/* Lower Drooping Broadband Fiber Cable Bundle */}
                <path d="M0,380 Q170,380 170,380 Q620,510 1200,340" stroke="#05080f" strokeWidth="2.4" fill="none" opacity="0.75" />

                {/* Authentic 5-Color Tibetan / Nepali Lungta Prayer Flags */}
                <path d="M170,250 Q450,370 780,380" stroke="#475569" strokeWidth="1" fill="none" opacity="0.6" />
                {[
                  { x: 210, y: 275, c: '#2563eb' }, // Blue (Sky)
                  { x: 250, y: 298, c: '#f8fafc' }, // White (Air)
                  { x: 290, y: 318, c: '#dc2626' }, // Red (Fire)
                  { x: 330, y: 332, c: '#16a34a' }, // Green (Water)
                  { x: 370, y: 340, c: '#eab308' }, // Yellow (Earth)
                  { x: 410, y: 344, c: '#2563eb' },
                  { x: 450, y: 345, c: '#f8fafc' },
                  { x: 490, y: 343, c: '#dc2626' },
                  { x: 530, y: 340, c: '#16a34a' },
                  { x: 570, y: 338, c: '#eab308' },
                  { x: 610, y: 339, c: '#2563eb' },
                  { x: 650, y: 344, c: '#f8fafc' },
                  { x: 690, y: 352, c: '#dc2626' },
                  { x: 730, y: 364, c: '#16a34a' },
                ].map((flag, idx) => (
                  <polygon
                    key={idx}
                    points={`${flag.x},${flag.y} ${flag.x + 13},${flag.y + 6} ${flag.x + 11},${flag.y + 22} ${flag.x - 2},${flag.y + 16}`}
                    fill={flag.c}
                    opacity="0.9"
                  />
                ))}
              </svg>

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/10 pointer-events-none" />
            </div>

            {/* Top Bar HUD */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow">
                  4K ULTRA HD
                </span>
                <span className="px-2 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 font-mono text-[10px]">
                  SORA-2 MOTION • 60 FPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                  title={isMuted ? 'Click to enable voice preview audio' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
                </button>
              </div>
            </div>

            {/* Center Play Button Overlay if Paused */}
            {!isPlaying && (
              <div className="relative z-10 flex items-center justify-center my-auto">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-950/80 transform hover:scale-110 transition cursor-pointer"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Scene Info & Dynamic Subtitle Display */}
            <div className="relative z-10 space-y-2.5 mt-auto">
              {/* Karaoke Subtitle Banner */}
              <div className="bg-black/75 backdrop-blur-md border border-white/20 rounded-xl p-3 max-w-xl text-left shadow-xl">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Devanagari Karaoke Subtitles</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white font-serif leading-snug">
                  "{activeSub.ne}"
                </p>
                <p className="text-xs text-slate-200 font-sans mt-0.5">
                  {activeSub.en}
                </p>
              </div>

              {/* Title & Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-1">
                <div className="text-left">
                  <h3 className="text-base sm:text-xl font-extrabold text-white leading-tight">
                    Ancient Boudhanath Twilight Stupa
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Auto-generated prompt • Sora-2 motion interpolation • 48kHz audio balance
                  </p>
                </div>

                <button
                  id="player-open-timeline-btn"
                  onClick={onLaunchStudio}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Film className="w-4 h-4" />
                  <span>Open in Studio Timeline</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: SHORTS & REELS 9:16 ================= */}
        {activeDemo === 'shorts' && (
          <div className="relative w-full h-full min-h-[360px] sm:min-h-[460px] flex items-center justify-center p-3 sm:p-6 bg-slate-950">
            {/* Realistic Vertical Phone Mockup Container */}
            <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-gradient-to-b from-indigo-950 via-slate-900 to-black flex flex-col justify-between p-3">
              
              {/* Phone Camera Punch Hole */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-30 border border-slate-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>

              {/* Photorealistic Himalayan Twilight Scene in 9:16 (Sun Behind Mountain & Utility Pole) */}
              <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
                <svg 
                  className="w-full h-full object-cover pointer-events-none" 
                  viewBox="0 0 360 640" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <linearGradient id="skyAtmosphereShorts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#080c1a" />
                      <stop offset="35%" stopColor="#1e1b4b" />
                      <stop offset="58%" stopColor="#4c1d24" />
                      <stop offset="75%" stopColor="#9a3412" />
                      <stop offset="90%" stopColor="#ea580c" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>

                    <radialGradient id="sunCoronaShorts" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                      <stop offset="25%" stopColor="#fef08a" stopOpacity="0.95" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                      <stop offset="75%" stopColor="#ea580c" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
                    </radialGradient>

                    <linearGradient id="snowPeakGlowShorts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                      <stop offset="20%" stopColor="#fde047" stopOpacity="0.85" />
                      <stop offset="45%" stopColor="#f97316" stopOpacity="0.6" />
                      <stop offset="75%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>

                  {/* 1. Sky */}
                  <rect width="360" height="640" fill="url(#skyAtmosphereShorts)" />
                  <circle cx="80" cy="50" r="1" fill="#ffffff" opacity="0.8" />
                  <circle cx="270" cy="70" r="1.2" fill="#ffffff" opacity="0.9" />

                  {/* 2. The Sun Behind Mountain Peaks */}
                  <g transform="translate(180, 260)">
                    <circle cx="0" cy="0" r="140" fill="url(#sunCoronaShorts)" opacity="0.85" />
                    <circle cx="0" cy="0" r="45" fill="#fffbeb" />
                  </g>

                  {/* 3. Mountain Ridge Occluding Lower Half of Sun */}
                  <path 
                    d="M0 380 L60 300 L120 340 L180 230 L240 310 L300 240 L360 330 L360 640 L0 640 Z" 
                    fill="url(#snowPeakGlowShorts)" 
                  />
                  <path d="M0 420 L90 350 L180 400 L270 340 L360 390 L360 640 L0 640 Z" fill="#1e293b" opacity="0.8" />
                  <path d="M0 470 L120 410 L240 460 L360 420 L360 640 L0 640 Z" fill="#090d16" />

                  {/* 4. Stupa in 9:16 frame */}
                  <g transform="translate(210, 360)" opacity="0.9">
                    <polygon points="30,15 22,55 38,55" fill="#d97706" />
                    <circle cx="30" cy="12" r="3" fill="#fef08a" />
                    <rect x="20" y="55" width="20" height="12" fill="#92400e" rx="1" />
                    <path d="M5,95 C5,70 18,72 30,72 C42,72 55,70 55,95 Z" fill="#f1f5f9" />
                    <rect x="-5" y="95" width="70" height="20" fill="#090d16" />
                  </g>

                  {/* 5. Utility Pole on Left Edge */}
                  <g transform="translate(30, 150)">
                    <polygon points="18,0 15,490 23,490 20,0" fill="#1e293b" stroke="#05080f" strokeWidth="0.8" />
                    <rect x="-15" y="40" width="70" height="6" fill="#334155" rx="1" />
                    <circle cx="-6" cy="30" r="2.5" fill="#cbd5e1" />
                    <circle cx="15" cy="30" r="2.5" fill="#cbd5e1" />
                    <circle cx="36" cy="30" r="2.5" fill="#cbd5e1" />
                    <rect x="22" y="110" width="20" height="30" fill="#0f172a" rx="2" stroke="#334155" />
                  </g>

                  {/* Power Lines & Prayer Flags */}
                  <path d="M0,190 Q48,190 200,290 Q360,180 360,180" stroke="#090d16" strokeWidth="1.5" fill="none" opacity="0.85" />
                  <path d="M0,300 Q48,300 220,410 Q360,320 360,320" stroke="#05080f" strokeWidth="1.8" fill="none" opacity="0.75" />
                  <path d="M48,190 Q150,290 230,390" stroke="#475569" strokeWidth="1" fill="none" opacity="0.6" />
                  
                  {[
                    { x: 70, y: 215, c: '#2563eb' },
                    { x: 95, y: 240, c: '#f8fafc' },
                    { x: 120, y: 265, c: '#dc2626' },
                    { x: 145, y: 290, c: '#16a34a' },
                    { x: 170, y: 315, c: '#eab308' },
                    { x: 195, y: 340, c: '#2563eb' },
                    { x: 215, y: 365, c: '#f8fafc' },
                  ].map((fl, i) => (
                    <polygon
                      key={i}
                      points={`${fl.x},${fl.y} ${fl.x + 10},${fl.y + 4} ${fl.x + 8},${fl.y + 16} ${fl.x - 2},${fl.y + 12}`}
                      fill={fl.c}
                      opacity="0.9"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-slate-950/10 pointer-events-none" />
              </div>

              {/* Top Shorts HUD */}
              <div className="relative z-20 flex items-center justify-between pt-4">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center gap-1 shadow">
                  <Flame className="w-3 h-3" /> #SHORTS VIRAL
                </span>
                <span className="text-[10px] text-slate-200 font-mono bg-black/60 px-2 py-0.5 rounded">
                  9:16 Full HD
                </span>
              </div>

              {/* Right Side Social Floating Icons */}
              <div className="absolute right-2 bottom-16 z-20 flex flex-col items-center gap-3 text-white">
                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:text-red-500 transition">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </button>
                  <span className="text-[9px] font-bold mt-0.5">84.2K</span>
                </div>

                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-bold mt-0.5">1,420</span>
                </div>

                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-bold mt-0.5">9,800</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-600 animate-spin flex items-center justify-center border-2 border-white/80">
                    <Disc className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Caption & Subtitles */}
              <div className="relative z-20 text-left space-y-1.5 pr-10">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                  Viral Retention Hook
                </span>
                <h4 className="text-xs font-black text-white leading-snug">
                  "{activeSub.ne}"
                </h4>
                <p className="text-[10px] text-slate-200 line-clamp-1">
                  NepalAI Sora-2 Engine • Mukta Subtitles • 1-Click Post
                </p>
                <div className="pt-1">
                  <button
                    onClick={onLaunchStudio}
                    className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow transition cursor-pointer text-center"
                  >
                    Use This Shorts Preset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 3: BUSINESS COMMERCIAL (INTERACTIVE CUSTOMIZER) ================= */}
        {activeDemo === 'business' && (
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[460px] p-4 sm:p-6 flex flex-col justify-between bg-gradient-to-br from-amber-950/60 via-slate-950 to-slate-900">
            {/* Live Interactive Customizer Banner */}
            <div className="relative z-20 bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ne' ? 'तपाईंको पसलको विवरण राखेर हेर्नुहोस् (Live Simulator):' : 'Customize Your Shop Ad Live:'}</span>
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                  बचत: रू ६०,००० / महिना
                </span>
              </div>

              {/* Quick Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-300 block mb-0.5 font-bold">पसल / विजनेसको नाम:</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:border-amber-400 outline-none"
                    placeholder="Shop Name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 block mb-0.5 font-bold">अफर / छुट विवरण:</label>
                  <input
                    type="text"
                    value={businessOffer}
                    onChange={(e) => setBusinessOffer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-semibold text-xs focus:border-amber-400 outline-none"
                    placeholder="Offer Discount"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 block mb-0.5 font-bold">सम्पर्क फोन नम्बर:</label>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-semibold text-xs focus:border-amber-400 outline-none"
                    placeholder="Phone"
                  />
                </div>
              </div>
            </div>

            {/* Live Business Video Screen Canvas */}
            <div className="relative z-10 my-3 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/30 text-left shadow-2xl flex flex-col justify-between min-h-[180px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider inline-block mb-1">
                    {businessOffer}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {businessName}
                  </h3>
                </div>

                {/* Simulated Payment QR Code Badge */}
                <div className="p-2 rounded-xl bg-white text-slate-950 flex flex-col items-center shadow-lg shrink-0">
                  <QrCode className="w-8 h-8 text-slate-950" />
                  <span className="text-[8px] font-black text-red-600">FonePay / eSewa</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <PhoneCall className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>अर्डर वा बुकिङका लागि: {businessPhone}</span>
                </div>

                <div className="text-[11px] text-slate-300">
                  होम डेलिभरी उपलब्ध • आजै सम्पर्क गर्नुहोस्
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-300">
                फेसबुक, इन्स्टाग्राम र टिकटकमा विज्ञापन चलाउन १-क्लिकमा तयार।
              </span>
              <button
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>{lang === 'ne' ? 'आफ्नो पसलको विज्ञापन बनाउनुहोस्' : 'Create This Ad in 3 Mins'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 4: NEPALI & HINDI NEURAL VOICE ================= */}
        {activeDemo === 'voice' && (
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[460px] p-4 sm:p-6 flex flex-col justify-between bg-gradient-to-br from-emerald-950/40 via-slate-950 to-indigo-950">
            {/* Top Voice Spectrum Display */}
            <div className="relative z-10 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hugging Face SpeechT5 + Azure EastUS Neural TTS</span>
              </div>

              {/* Dynamic Audio Visualizer Bars in Fixed Constant-Height Stage (Zero Layout Shift) */}
              <div className="h-16 flex items-center justify-center gap-1.5 overflow-hidden select-none">
                {[30, 48, 60, 24, 64, 50, 36, 56, 64, 44, 32, 58, 52, 38, 56, 28].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 transition-all duration-150 shrink-0"
                    style={{
                      height: isPlaying ? `${Math.max(12, Math.min(54, 28 + Math.sin(currentTime * 3.5 + i * 0.45) * 18 + Math.cos(currentTime * 2 + i * 0.3) * 6))}px` : '12px',
                    }}
                  />
                ))}
              </div>

              {/* Constant-Phase Subtitle Card (Fixed Height to Prevent Vertical Jumping) */}
              <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-700 rounded-2xl p-4 text-left h-[100px] flex flex-col justify-center shadow-lg overflow-hidden">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1 shrink-0">
                  Active Synthesized Speech ({selectedVoice.toUpperCase()}):
                </span>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSub.ne}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: "linear" }}
                    className="min-h-[44px] flex items-center"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-white font-serif leading-snug line-clamp-2">
                      "{activeSub.ne}"
                    </h3>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* 4 Authentic Speaker Profiles */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
              {[
                { id: 'aakash', name: 'आकाश (Aakash)', lang: 'Nepali Male', style: 'Natural Documentary' },
                { id: 'preeti', name: 'प्रीति (Preeti)', lang: 'Nepali Female', style: 'Warm Commercial' },
                { id: 'kabir', name: 'कबीर (Kabir)', lang: 'Hindi Male', style: 'High-Energy YouTube' },
                { id: 'sunita', name: 'सुनिता (Sunita)', lang: 'Nepali Story', style: 'Emotional Narrative' },
              ].map((spk) => (
                <button
                  key={spk.id}
                  onClick={() => setSelectedVoice(spk.id as typeof selectedVoice)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedVoice === spk.id
                      ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-lg'
                      : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{spk.name}</span>
                    {selectedVoice === spk.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium block">{spk.lang}</span>
                  <span className="text-[9px] text-slate-400 block truncate mt-0.5">{spk.style}</span>
                </button>
              ))}
            </div>

            {/* Voice Action Footer */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'आवाज सुन्नुहोस् (Unmute Audio)' : 'अडियो सक्रिय छ (Audio Playing)'}</span>
              </button>

              <button
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Open Voice Studio Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Bottom Interactive Scrubber & Timeline Bar */}
        <div className="relative z-30 bg-slate-950 border-t border-slate-800 px-3 sm:px-4 py-2.5 flex items-center gap-3">
          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Reset / Loop */}
          <button
            onClick={() => setCurrentTime(0)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 hidden xs:flex"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Time Counter */}
          <span className="text-[11px] font-mono text-slate-300 shrink-0 select-none">
            <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(totalDuration)}
          </span>

          {/* Interactive Scrubber Bar */}
          <div 
            onClick={handleSeek}
            className="flex-1 h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group/scrub"
          >
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full transition-all duration-150 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover/scrub:opacity-100 transition" />
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Aspect Ratio Indicator */}
          <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 hidden sm:inline">
            {activeDemo === 'shorts' ? '9:16' : '16:9'}
          </span>
        </div>
      </div>
    </div>
  );
};
