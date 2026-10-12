import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Youtube, 
  Smartphone, 
  Store, 
  Mic, 
  Film, 
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
  Layers,
  Radio
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
  const [selectedVoice, setSelectedVoice] = useState<'aakash' | 'preeti' | 'kabir' | 'sunita'>('aakash');
  
  // Interactive shop customizer state for "Business Commercial" mode
  const [businessName, setBusinessName] = useState<string>('काठमाडौँ फेसन हाउस');
  const [businessOffer, setBusinessOffer] = useState<string>('दशैं-तिहार धमाका • ५०% सम्म विशेष छुट!');
  const [businessPhone, setBusinessPhone] = useState<string>('९८०१२३४५६७');

  const totalDuration = 30; // 30 seconds demo loop
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Subtitle phrases with sync for karaoke
  const subtitlesData = {
    video: [
      { start: 0, end: 7, ne: 'सगरमाथाको विहानी: सुनौलो किरण हिमालमा पोखिँदा...', en: 'Everest Dawn: When golden rays illuminate the Himalayas...' },
      { start: 7, end: 15, ne: 'बौद्धनाथ स्तुपा र शान्तिपूर्ण हिमाली बतास...', en: 'Sacred stupas, temple bells and crisp Himalayan breeze...' },
      { start: 15, end: 23, ne: 'नेपालएआई सोरा-२ बाट निर्मित सिनेम्याटिक भिडियो दृश्य।', en: 'Cinematic 4K scene rendered with NepalAI Sora-2 engine.' },
      { start: 23, end: 30, ne: 'अब तपाईं पनि ३ मिनेटमै यस्तै भिडियो बनाउनुहोस्!', en: 'Produce viral cinema in 3 minutes without camera gear!' },
    ],
    shorts: [
      { start: 0, end: 8, ne: 'पोखरा फेवाताल र माछापुच्छ्रेको प्रतिबिम्ब...', en: 'Pokhara Phewa Lake: Reflection of Mt. Machhapuchhre...' },
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
      { start: 20, end: 30, ne: '२४kHz हाई-फिडेलिटी मास्टर साउन्ड सीधा टाइमलाइनमा।', en: 'Studio-grade 24kHz master audio directly on the timeline.' },
    ],
  };

  const currentSubtitleList = subtitlesData[activeDemo];
  const activeSub = currentSubtitleList.find((s) => currentTime >= s.start && currentTime <= s.end) || currentSubtitleList[0];

  // Sync HTML5 video play/pause with isPlaying state
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, activeDemo]);

  // Sync HTML5 video mute with isMuted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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
          utterance.rate = 0.95;
          const matched = voices.find(v => (v.lang.startsWith('ne') || v.lang.startsWith('hi') || v.lang.startsWith('en')) && v.name.toLowerCase().includes('male'));
          if (matched) utterance.voice = matched;
        } else if (selectedVoice === 'preeti') {
          utterance.pitch = 1.25;
          utterance.rate = 1.02;
          const matched = voices.find(v => (v.lang.startsWith('ne') || v.lang.startsWith('hi') || v.lang.startsWith('en')) && v.name.toLowerCase().includes('female'));
          if (matched) utterance.voice = matched;
        } else if (selectedVoice === 'kabir') {
          utterance.pitch = 0.88;
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

    const timer = setTimeout(speakCurrentSubtitle, 100);

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
    const newTime = Math.round(newProgress * totalDuration * 10) / 10;
    setCurrentTime(newTime);
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (newTime / totalDuration) * videoRef.current.duration;
    }
  };

  const progressPercent = (currentTime / totalDuration) * 100;

  return (
    <div 
      ref={containerRef}
      className="w-full bg-[#080B11] text-white border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden transition-all"
    >
      {/* Top Header Dock & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800/80 px-3.5 py-2 sm:px-4 sm:py-2.5 gap-2.5 bg-slate-950/90">
        {/* Terminal / Live Studio Indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          </div>
          <span className="text-xs text-slate-400 font-mono pl-1 hidden xs:inline">
            nepalai / <span className="text-rose-400 font-semibold">studio-player</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold ml-auto sm:ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>4K PREVIEW</span>
          </div>
        </div>

        {/* 4 Interactive Mode Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 text-xs gap-1">
          <button
            id="player-tab-video"
            onClick={() => {
              setActiveDemo('video');
              setCurrentTime(0);
            }}
            className={`px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-1.5 min-h-[30px] ${
              activeDemo === 'video'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span className="truncate">१६:९ सिनेमा (Cinema)</span>
          </button>

          <button
            id="player-tab-shorts"
            onClick={() => {
              setActiveDemo('shorts');
              setCurrentTime(0);
            }}
            className={`px-2.5 py-1.5 rounded-lg transition font-semibold cursor-pointer flex items-center justify-center gap-1.5 min-h-[30px] ${
              activeDemo === 'shorts'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">९:१६ रील्स (Shorts)</span>
          </button>

          <button
            id="player-tab-business"
            onClick={() => {
              setActiveDemo('business');
              setCurrentTime(0);
            }}
            className={`px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[30px] ${
              activeDemo === 'business'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">पसल विज्ञापन (Ad)</span>
          </button>

          <button
            id="player-tab-voice"
            onClick={() => {
              setActiveDemo('voice');
              setCurrentTime(0);
            }}
            className={`px-2.5 py-1.5 rounded-lg transition font-bold cursor-pointer flex items-center justify-center gap-1.5 min-h-[30px] ${
              activeDemo === 'voice'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">न्युरल आवाज (TTS)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Canvas - Refined, Descent & Medium Height (Expansive & Uncompressed) */}
      <div className="relative bg-[#06080E] flex flex-col justify-between overflow-hidden">
        
        {/* ================= MODE 1: YOUTUBE 16:9 CINEMATIC ================= */}
        {activeDemo === 'video' && (
          <div className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] max-h-[560px] flex flex-col justify-between p-4 sm:p-6 lg:p-7 overflow-hidden">
            {/* Real Broadcast Video of Everest Sunrise */}
            <video
              ref={videoRef}
              src="/samples/everest_sunrise.mp4"
              poster="/samples/everest_sunrise_thumb.jpg"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-slate-950/40 pointer-events-none" />

            {/* Top Bar HUD */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-xs">
                  4K SORA-2
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700/80 text-slate-200 font-mono text-[10px]">
                  HIMALAYAN CINEMA • 60 FPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                  title={isMuted ? 'Click to unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Center Play Button Overlay if Paused */}
            {!isPlaying && (
              <div className="relative z-10 flex items-center justify-center my-auto">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/80 transform hover:scale-105 transition cursor-pointer"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />
                </button>
              </div>
            )}

            {/* Bottom Scene Info & Dynamic Subtitle Display */}
            <div className="relative z-10 space-y-2.5 mt-auto">
              {/* Karaoke Subtitle Banner */}
              <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-3.5 max-w-2xl text-left shadow-lg">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>देवनागरी काराओके सबटाइटल · Devanagari Captions</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white font-serif leading-snug">
                  "{activeSub.ne}"
                </p>
                <p className="text-xs text-slate-300 font-sans mt-0.5 line-clamp-1">
                  {activeSub.en}
                </p>
              </div>

              {/* Title & Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-0.5">
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    सगरमाथाको विहानी (Everest Sunrise Golden Hour)
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Sora-2 Motion • Neural Voice • 24kHz Acoustic Master
                  </p>
                </div>

                <button
                  id="player-open-timeline-btn"
                  onClick={onLaunchStudio}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Film className="w-4 h-4" />
                  <span>स्टुडियोमा खोल्नुहोस् · Open Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: SHORTS & REELS 9:16 ================= */}
        {activeDemo === 'shorts' && (
          <div className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] max-h-[560px] flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
            {/* Background Blur Preview */}
            <img 
              src="/samples/phewa_lake_thumb.jpg" 
              alt="Background preview" 
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 select-none pointer-events-none" 
            />

            {/* Side Feature Cards for Wide Balance (Left) */}
            <div className="hidden lg:flex flex-col gap-3 absolute left-6 top-1/2 -translate-y-1/2 z-20 max-w-[200px] text-left">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] text-rose-400 font-mono font-bold block">01 · REEL HOOK</span>
                <p className="text-xs text-white font-bold mt-0.5">पहिलो ३ सेकेन्डमै ध्यान खिच्ने भिडियो हुक</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Instant attention retention</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] text-amber-400 font-mono font-bold block">02 · VIRAL FORMAT</span>
                <p className="text-xs text-white font-bold mt-0.5">९:१६ टिकटक र इन्स्टाग्राम अप्टिमाइज्ड</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Full HD 1080x1920 mobile canvas</p>
              </div>
            </div>

            {/* Vertical Phone Mockup Container */}
            <div className="relative h-full max-h-[460px] sm:max-h-[480px] aspect-[9/16] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-black flex flex-col justify-between p-3 z-10">
              <video
                src="/samples/phewa_lake.mp4"
                poster="/samples/phewa_lake_thumb.jpg"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40 pointer-events-none" />

              {/* Top Shorts HUD */}
              <div className="relative z-20 flex items-center justify-between pt-1">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] flex items-center gap-1 shadow-xs">
                  <Flame className="w-3 h-3" /> 9:16 VIRAL
                </span>
                <span className="text-[10px] text-slate-200 font-mono bg-black/60 px-2 py-0.5 rounded">
                  Full HD
                </span>
              </div>

              {/* Right Side Social Floating Icons */}
              <div className="absolute right-2 bottom-14 z-20 flex flex-col items-center gap-2.5 text-white">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-rose-500">
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </div>
                  <span className="text-[9px] font-bold mt-0.5">84K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold mt-0.5">1.4K</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-rose-600 animate-spin flex items-center justify-center border border-white">
                    <Disc className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Caption & Subtitles */}
              <div className="relative z-20 text-left space-y-1.5 pr-10">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase">
                  Reel Hook
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-2">
                  "{activeSub.ne}"
                </h4>
                <button
                  onClick={onLaunchStudio}
                  className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shadow-xs transition cursor-pointer text-center"
                >
                  Create Reel
                </button>
              </div>
            </div>

            {/* Side Feature Cards for Wide Balance (Right) */}
            <div className="hidden lg:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-20 max-w-[200px] text-left">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] text-emerald-400 font-mono font-bold block">03 · NEURAL AUDIO</span>
                <p className="text-xs text-white font-bold mt-0.5">२४kHz स्पष्ट नेपाली भोइसओभर</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ultra clear narration</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] text-indigo-400 font-mono font-bold block">04 · AUTO CAPTIONS</span>
                <p className="text-xs text-white font-bold mt-0.5">शब्द-शब्दमा मेल खाने काराओके सबटाइटल</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Synced word highlights</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 3: BUSINESS COMMERCIAL (INTERACTIVE CUSTOMIZER) ================= */}
        {activeDemo === 'business' && (
          <div className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] max-h-[560px] p-4 sm:p-6 lg:p-7 flex flex-col justify-between overflow-hidden">
            {/* Background Video */}
            <video
              src="/samples/durbar_square.mp4"
              poster="/samples/durbar_square_thumb.jpg"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60 pointer-events-none" />

            {/* Live Interactive Customizer Banner - Wide & Spacious */}
            <div className="relative z-20 max-w-4xl mx-auto w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>पसलको विवरण बदल्नुहोस् (Live Customizer):</span>
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-700/60">
                  बचत: रू ६०,००० / महिना
                </span>
              </div>

              {/* Quick Input Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                <div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-xs sm:text-sm focus:border-amber-400 outline-none"
                    placeholder="पसलको नाम"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={businessOffer}
                    onChange={(e) => setBusinessOffer(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-semibold text-xs sm:text-sm focus:border-amber-400 outline-none"
                    placeholder="छुट अफर"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-semibold text-xs sm:text-sm focus:border-amber-400 outline-none"
                    placeholder="फोन नम्बर"
                  />
                </div>
              </div>
            </div>

            {/* Live Business Video Screen Canvas */}
            <div className="relative z-10 max-w-3xl mx-auto w-full my-auto p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left shadow-xl flex items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider inline-block mb-1.5">
                  {businessOffer}
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  {businessName}
                </h3>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-bold mt-1.5">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>सम्पर्क: {businessPhone}</span>
                </div>
              </div>

              {/* Simulated Payment QR Code Badge */}
              <div className="p-2 rounded-xl bg-white text-slate-950 flex flex-col items-center shadow shrink-0">
                <QrCode className="w-8 h-8 text-slate-950" />
                <span className="text-[8px] font-black text-red-600 mt-0.5">FonePay / eSewa</span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="relative z-20 flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-slate-300 hidden sm:inline">
                फेसबुक, इन्स्टाग्राम र टिकटकमा विज्ञापन चलाउन १-क्लिकमा तयार।
              </span>
              <button
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>पसल विज्ञापन सुरु गर्नुहोस् · Start Ad</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 4: NEPALI & HINDI NEURAL VOICE ================= */}
        {activeDemo === 'voice' && (
          <div className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] max-h-[560px] p-4 sm:p-6 lg:p-7 flex flex-col justify-between bg-gradient-to-br from-emerald-950/40 via-slate-950 to-indigo-950/50">
            {/* Top Voice Visualizer */}
            <div className="relative z-10 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>२४kHz नेपाली र हिन्दी न्युरल आवाज (Neural TTS)</span>
              </div>

              {/* Dynamic Audio Visualizer Bars */}
              <div className="h-10 flex items-center justify-center gap-1.5 overflow-hidden select-none">
                {[20, 36, 44, 18, 48, 38, 28, 42, 48, 32, 24, 44, 38, 28, 42, 20, 34, 46, 26, 38, 44, 22].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 transition-all duration-150 shrink-0"
                    style={{
                      height: isPlaying ? `${Math.max(8, Math.min(38, 20 + Math.sin(currentTime * 3.5 + i * 0.45) * 14))}px` : '8px',
                    }}
                  />
                ))}
              </div>

              {/* Subtitle Card */}
              <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-left shadow-md">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">
                  सक्रिय आवाज ({selectedVoice.toUpperCase()}):
                </span>
                <p className="text-xs sm:text-sm font-bold text-white font-serif line-clamp-1">
                  "{activeSub.ne}"
                </p>
              </div>
            </div>

            {/* 4 Authentic Speaker Profiles with Real Images - Wide Layout */}
            <div className="relative z-10 max-w-4xl mx-auto w-full grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
              {[
                { id: 'aakash', name: 'आकाश (Aakash)', role: 'वृत्तचित्र · Documentary', avatar: '/assets/avatars/aarav.jpg' },
                { id: 'preeti', name: 'प्रीति (Preeti)', role: 'व्यावसायिक · Commercial', avatar: '/assets/avatars/hemkala.jpg' },
                { id: 'kabir', name: 'कबीर (Kabir)', role: 'युट्युब · YouTube Energy', avatar: '/assets/avatars/rajesh.jpg' },
                { id: 'sunita', name: 'सुनिता (Sunita)', role: 'कथा वाचन · Narrative', avatar: '/assets/avatars/maya.jpg' },
              ].map((spk) => (
                <button
                  key={spk.id}
                  onClick={() => setSelectedVoice(spk.id as typeof selectedVoice)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    selectedVoice === spk.id
                      ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <img
                    src={spk.avatar}
                    alt={spk.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/avatars/aarav.jpg';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">{spk.name}</span>
                      {selectedVoice === spk.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{spk.role}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Voice Action Footer */}
            <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'आवाज सुन्नुहोस् (Unmute)' : 'अडियो सक्रिय (Playing)'}</span>
              </button>

              <button
                onClick={onLaunchStudio}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>भोइस स्टुडियो खोल्नुहोस्</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Bottom Interactive Scrubber & Timeline Bar */}
        <div className="relative z-30 bg-slate-950 border-t border-slate-800/80 px-3 py-2 flex items-center gap-2.5">
          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>

          {/* Reset / Loop */}
          <button
            onClick={() => {
              setCurrentTime(0);
              if (videoRef.current) videoRef.current.currentTime = 0;
            }}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 hidden xs:flex"
            title="Restart"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Time Counter */}
          <span className="text-[10px] font-mono text-slate-300 shrink-0 select-none">
            <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(totalDuration)}
          </span>

          {/* Interactive Scrubber Bar */}
          <div 
            onClick={handleSeek}
            className="flex-1 h-1.5 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group/scrub"
          >
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full transition-all duration-150 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover/scrub:opacity-100 transition" />
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title={isMuted ? 'Unmute Audio' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3 h-3 text-slate-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* Aspect Ratio Indicator */}
          <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 hidden sm:inline">
            {activeDemo === 'shorts' ? '9:16' : '16:9'}
          </span>
        </div>
      </div>
    </div>
  );
};
