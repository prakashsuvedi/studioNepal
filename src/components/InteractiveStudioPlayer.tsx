import React, { useState, useEffect, useRef } from 'react';
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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

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

  // Gentle ambient audio tone for demo preview when unmuted
  useEffect(() => {
    if (!isMuted && isPlaying) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        if (!oscRef.current) {
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          // Gentle meditative harmonic tone (warm pad frequency ~220Hz / 330Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(activeDemo === 'voice' ? 320 : 220, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.04, audioCtxRef.current.currentTime);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          oscRef.current = osc;
          gainRef.current = gain;
        }
      } catch (e) {
        // Web audio blocked or unsupported, fail silently
      }
    } else {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
        oscRef.current = null;
        gainRef.current = null;
      }
    }

    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
        oscRef.current = null;
      }
    };
  }, [isMuted, isPlaying, activeDemo]);

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
      className="w-full max-w-5xl mx-auto bg-slate-950/90 border border-slate-800/80 rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all"
    >
      {/* Top Header Dock & Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-slate-800/80 pb-3 sm:pb-4 gap-3">
        {/* Terminal / Live Studio Indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>
          <span className="text-xs text-slate-400 font-mono pl-1 hidden xs:inline">
            studio.nepalai.tech / <span className="text-rose-400 font-semibold">live-player</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold ml-auto sm:ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>LIVE 4K PREVIEW</span>
          </div>
        </div>

        {/* 4 Interactive Mode Tabs (Responsive wrap / scroll) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs gap-1">
          <button
            id="player-tab-video"
            onClick={() => {
              setActiveDemo('video');
              setCurrentTime(0);
            }}
            className={`px-3 py-2 sm:py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[34px] ${
              activeDemo === 'video'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
            className={`px-3 py-2 sm:py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[34px] ${
              activeDemo === 'shorts'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
            className={`px-3 py-2 sm:py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[34px] ${
              activeDemo === 'business'
                ? 'bg-amber-600 text-slate-950 shadow-md font-black shadow-amber-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
            className={`px-3 py-2 sm:py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[34px] ${
              activeDemo === 'voice'
                ? 'bg-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{lang === 'ne' ? 'न्युरल आवाज' : lang === 'hi' ? 'नेचुरल आवाज' : 'Neural Voice'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Canvas */}
      <div className="relative mt-3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group min-h-[320px] sm:min-h-[440px] flex flex-col justify-between">
        
        {/* ================= MODE 1: YOUTUBE 16:9 CINEMATIC ================= */}
        {activeDemo === 'video' && (
          <div className="relative w-full h-full min-h-[340px] sm:min-h-[460px] flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
            {/* Animated Cinematic Atmospheric Layer (Guaranteed to NEVER fail or be blank) */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-rose-950">
              {/* Dynamic SVG Animated Panoramic Stupa Landscape */}
              <svg 
                className="w-full h-full object-cover opacity-60 transition duration-1000 transform scale-105" 
                viewBox="0 0 1200 675" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="50%" stopColor="#431407" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                  <linearGradient id="sunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="peakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#334155" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>

                {/* Sky */}
                <rect width="1200" height="675" fill="url(#skyGrad)" />
                
                {/* Sun Glow Behind Himalayan Mountains */}
                <circle cx="600" cy="380" r="280" fill="url(#sunGlow)" className="animate-pulse" />

                {/* Distant Mountain Peaks */}
                <path d="M0 450 L180 320 L350 420 L520 280 L700 400 L880 290 L1050 390 L1200 310 L1200 675 L0 675 Z" fill="url(#peakGrad)" />
                <path d="M120 450 L280 350 L420 440 L600 310 L780 430 L940 330 L1100 420 L1200 360 L1200 675 L0 675 Z" fill="#090d16" opacity="0.85" />

                {/* Boudhanath Stupa Silhouette */}
                <g transform="translate(480, 260)">
                  {/* Spire */}
                  <polygon points="120,40 114,140 126,140" fill="#f59e0b" />
                  <circle cx="120" cy="35" r="8" fill="#fef08a" />
                  {/* Harmika (Square with Buddha Eyes) */}
                  <rect x="95" y="140" width="50" height="30" fill="#d97706" rx="2" />
                  <circle cx="110" cy="155" r="4" fill="#0f172a" />
                  <circle cx="130" cy="155" r="4" fill="#0f172a" />
                  {/* Dome */}
                  <path d="M40 220 C40 170 80 170 120 170 C160 170 200 170 200 220 Z" fill="#f8fafc" />
                  {/* Plinth */}
                  <rect x="20" y="220" width="200" height="50" fill="#1e293b" rx="4" />
                  <rect x="0" y="270" width="240" height="70" fill="#0f172a" />
                </g>

                {/* Golden Prayer Flags */}
                <path d="M100 280 Q 300 330 600 290 Q 900 330 1100 280" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 15" opacity="0.7" />
              </svg>

              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
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
                  title={isMuted ? 'Click to enable ambient preview audio' : 'Mute'}
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
            <div className="relative z-10 space-y-3 mt-auto">
              {/* Karaoke Subtitle Banner */}
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 max-w-xl text-left shadow-lg">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Devanagari Karaoke Subtitles</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white font-serif leading-snug">
                  "{activeSub.ne}"
                </p>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  {activeSub.en}
                </p>
              </div>

              {/* Title & Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-1">
                <div className="text-left">
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
                    Ancient Boudhanath Twilight Stupa
                  </h3>
                  <p className="text-xs text-slate-400">
                    Auto-generated prompt • Sora-2 motion interpolation • 48kHz audio balance
                  </p>
                </div>

                <button
                  id="player-open-timeline-btn"
                  onClick={onLaunchStudio}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 transition cursor-pointer flex items-center gap-2 shrink-0"
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

              {/* Animated Sunrise Himalayas Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-rose-950/40">
                <svg className="w-full h-full object-cover opacity-80" viewBox="0 0 360 640" fill="none">
                  <circle cx="180" cy="220" r="140" fill="#f59e0b" opacity="0.4" />
                  <path d="M0 380 L90 260 L180 340 L270 240 L360 360 L360 640 L0 640 Z" fill="#0f172a" />
                  <path d="M40 380 L140 290 L220 360 L320 280 L360 320 L360 640 L0 640 Z" fill="#020617" />
                </svg>
              </div>

              {/* Top Shorts HUD */}
              <div className="relative z-20 flex items-center justify-between pt-4">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center gap-1 shadow">
                  <Flame className="w-3 h-3" /> #SHORTS VIRAL
                </span>
                <span className="text-[10px] text-slate-300 font-mono bg-black/50 px-2 py-0.5 rounded">
                  9:16 Full HD
                </span>
              </div>

              {/* Right Side Social Floating Icons */}
              <div className="absolute right-2 bottom-16 z-20 flex flex-col items-center gap-3 text-white">
                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:text-red-500 transition">
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                  </button>
                  <span className="text-[9px] font-bold mt-0.5">84.2K</span>
                </div>

                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-bold mt-0.5">1,420</span>
                </div>

                <div className="flex flex-col items-center">
                  <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
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
                <p className="text-[10px] text-slate-300 line-clamp-1">
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
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  बचत: रू ६०,००० / महिना
                </span>
              </div>

              {/* Quick Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">पसल / विजनेसको नाम:</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:border-amber-400 outline-none"
                    placeholder="Shop Name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">अफर / छुट विवरण:</label>
                  <input
                    type="text"
                    value={businessOffer}
                    onChange={(e) => setBusinessOffer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-semibold text-xs focus:border-amber-400 outline-none"
                    placeholder="Offer Discount"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">सम्पर्क फोन नम्बर:</label>
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

                <div className="text-[11px] text-slate-400">
                  होम डेलिभरी उपलब्ध • आजै सम्पर्क गर्नुहोस्
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
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
            <div className="relative z-10 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hugging Face SpeechT5 + Azure EastUS Neural TTS</span>
              </div>

              {/* Dynamic Audio Visualizer Bars */}
              <div className="flex items-center justify-center gap-1.5 py-4">
                {[40, 65, 85, 30, 95, 70, 50, 80, 100, 60, 45, 90, 75, 55, 85, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-2 rounded-full bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-300"
                    style={{
                      height: isPlaying ? `${Math.max(12, (h * ((currentTime * 3 + i) % 10)) / 10)}px` : '12px',
                    }}
                  />
                ))}
              </div>

              <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  Active Synthesized Speech ({selectedVoice.toUpperCase()}):
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif leading-relaxed">
                  "{activeSub.ne}"
                </h3>
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
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{spk.name}</span>
                    {selectedVoice === spk.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[10px] text-emerald-400 block">{spk.lang}</span>
                  <span className="text-[9px] text-slate-500 block truncate">{spk.style}</span>
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
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Open Voice Studio Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Bottom Interactive Scrubber & Timeline Bar */}
        <div className="relative z-30 bg-slate-950/95 border-t border-slate-800/80 px-3 sm:px-4 py-2.5 flex items-center gap-3">
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
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 hidden xs:flex"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Time Counter */}
          <span className="text-[11px] font-mono text-slate-400 shrink-0 select-none">
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
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Aspect Ratio Indicator */}
          <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 hidden sm:inline">
            {activeDemo === 'shorts' ? '9:16' : '16:9'}
          </span>
        </div>
      </div>
    </div>
  );
};
