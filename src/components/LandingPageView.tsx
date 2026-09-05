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
  QrCode
} from 'lucide-react';
import { UserSession } from '../types';

interface LandingPageViewProps {
  user: UserSession | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onLaunchStudio: () => void;
  onLaunchHamroAi?: () => void;
  onSelectPlan: (planId: 'starter' | 'creator' | 'pro_studio') => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  user,
  onOpenAuth,
  onLaunchStudio,
  onLaunchHamroAi,
  onSelectPlan,
}) => {
  const [activeDemo, setActiveDemo] = useState<'video' | 'image' | 'voice'>('video');
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

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-rose-600 selection:text-white">
      {/* Background ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none opacity-40 blur-3xl -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/30 rounded-full mix-blend-screen" />
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Top announcement badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 backdrop-blur-md shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">studio.nepalai.tech v2.0 Live</span>
          <span className="text-slate-500">•</span>
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            Hugging Face & Sora-2 Pipeline <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* Display Headline */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Next-Gen AI Media Studio for{' '}
            <span className="bg-gradient-to-r from-rose-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Nepali & Global Creators
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Create cinema-grade videos, photorealistic FLUX images, and authentic Nepali voiceovers in one unified timeline editor.
          </p>
        </div>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-4">
          {/* Micro-Credits High Visibility Entry Point Button */}
          <button
            onClick={() => onSelectPlan('sasta_50_npr')}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 hover:from-emerald-600 hover:to-rose-600 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-950/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-amber-400/50"
          >
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>Buy Micro-Credits Pass (रू 50)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 font-extrabold uppercase tracking-wider">
              3 Img • 5m Vid • 5m Aud
            </span>
          </button>

          <button
            onClick={() => {
              if (onLaunchHamroAi) onLaunchHamroAi();
              else onLaunchStudio();
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-amber-900/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bot className="w-5 h-5 text-white" />
            <span>Open HamroAI Chat</span>
          </button>

          {user ? (
            <button
              onClick={onLaunchStudio}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Video Studio</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('user')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-sm sm:text-base shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign in with Google</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onOpenAuth('admin')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Admin Login</span>
              </button>
            </>
          )}
        </div>

        {/* Trial Guarantee Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required for trial
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 Images + 1 Video + 1 Audio + 1 Render included
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Google OAuth sign-in
          </span>
        </div>

        {/* Live Interactive Studio Preview Dock */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
            {/* Dock Switcher */}
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-slate-400 font-mono ml-2">studio.nepalai.tech / live-editor</span>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveDemo('video')}
                  className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                    activeDemo === 'video' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Video Studio
                </button>
                <button
                  onClick={() => setActiveDemo('image')}
                  className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                    activeDemo === 'image' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Image Engine
                </button>
                <button
                  onClick={() => setActiveDemo('voice')}
                  className={`px-3 py-1 rounded-md transition font-medium cursor-pointer ${
                    activeDemo === 'voice' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Voiceover
                </button>
              </div>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center group">
              {activeDemo === 'video' && (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80"
                    alt="Video Studio Preview"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-left flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-1 rounded bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider">
                        Sora-2 Motion Pipeline
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">Himalayan Golden Hour Flyover</h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-md">
                        Prompt: "Cinematic drone shot flying through Annapurna base camp at sunrise, warm alpine glow, 4K 60fps."
                      </p>
                    </div>
                    <button
                      onClick={onLaunchStudio}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Open in Studio Editor</span>
                    </button>
                  </div>
                </>
              )}

              {activeDemo === 'image' && (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1582650625119-3a31f8418b7d?w=1200&auto=format&fit=crop&q=80"
                    alt="Image Engine Preview"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-left flex items-end justify-between">
                    <div>
                      <span className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
                        FLUX.1-schnell / GPT-Image-1.5
                      </span>
                      <h3 className="text-xl font-bold text-white mt-2">Ancient Boudhanath Twilight Stupa</h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-md">
                        Prompt: "Atmospheric twilight scene of Boudhanath Stupa, fluttering colorful prayer flags, warm butter lamps."
                      </p>
                    </div>
                    <button
                      onClick={onLaunchStudio}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <span>Generate More Images</span>
                    </button>
                  </div>
                </>
              )}

              {activeDemo === 'voice' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-900 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Mic className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <span className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      Bilingual Nepali TTS Engine
                    </span>
                    <h3 className="text-lg font-bold text-white">"नेपालको पहिलो व्यावसायिक एआई भिडियो स्टुडियो"</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Voice: Aakash (Natural Nepali Male) • 48kHz High-Fidelity
                    </p>
                  </div>
                  <button
                    onClick={onLaunchStudio}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Synthesize Voiceover in Studio</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Value Propositions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Built for Serious Production</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything You Need to Create Viral, High-Impact Media
          </h2>
          <p className="text-sm text-slate-400">
            Engineered with direct inference routes to top AI models, real-time credit tracking, and full admin oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/40 space-y-4 hover:border-amber-500 transition shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">HamroAI Assistant</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                New
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multilingual GPT-4o & GPT-5-mini. Type in Roman Nepali or Roman Hindi and get authentic Devanagari responses, legal templates, code & scripts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sora-2 & Video Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connects directly to OpenAI Sora-2 and Hugging Face video pipelines for realistic motion, camera pans, and cinematic zooms.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Bilingual Nepali & English</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native Devanagari font rendering with Mukta typography, prompt translation, and Nepali voice synthesis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Track Timeline Editor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arrange media scenes, drag-and-drop sequencing, overlay subtitle lower thirds, and balance background audio tracks.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Tiers with Freemium Paywall Details */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Transparent Credit Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Simple, Scalable Plans for Creators and Studios
          </h2>
          <p className="text-sm text-slate-400">
            Test for free with our strict trial package, then upgrade to unlock higher resolution, duration, and priority queues.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Sasta Pass Tier (50 NPR) */}
          <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-amber-500/60 flex flex-col justify-between space-y-5 relative shadow-lg shadow-amber-950/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              Sasta Pass
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
                Perfect for instant short-form content generation without a recurring monthly subscription!
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
              onClick={() => onSelectPlan('sasta_50_npr' as any)}
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
                Great for solo content creators & YouTubers making weekly shorts.
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
                Creator Tier
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$49</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.creatorNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                For professional media agencies, brands, and creative studios.
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
                Pro Agency
              </span>
              <div>
                <span className="text-3xl font-extrabold text-white">$129</span>
                <span className="text-xs text-rose-400 font-bold ml-2">(रू {pricingConfig.proStudioNpr.toLocaleString()})</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise agency capacity, custom Nepali voice cloning, and priority renders.
              </p>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 font-semibold text-purple-400">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>5,000 Credits / month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎬 Up to 800 Video Mins (30 Full Movies + 100 Clips)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>🎙️ 160 Custom Nepali Voiceovers (800 Mins)</span>
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

      {/* Footer Banner */}
      <footer className="border-t border-slate-900 py-10 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-white">studio.nepalai.tech</span>
            <span>•</span>
            <span>Nepal's Premier AI Media Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={onLaunchStudio} className="hover:text-white transition cursor-pointer">
              Launch Studio
            </button>
            <button onClick={() => onOpenAuth('admin')} className="hover:text-white transition cursor-pointer">
              Admin Portal
            </button>
            <a href="#pricing" className="hover:text-white transition">
              Pricing Plans
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
