import React, { useState, useEffect } from 'react';
import { StudioTab, UserSession, UserTrialQuota } from '../types';
import { apiGetHfStatus } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { 
  Film, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  ShieldCheck, 
  FileText, 
  Code2, 
  Sparkles,
  Zap,
  Lock,
  Unlock,
  CreditCard,
  User as UserIcon,
  LogOut,
  Home,
  Cpu,
  Bot,
  MessageSquare,
  Sun,
  Moon,
  Command,
  Briefcase,
  History,
  AlertTriangle,
  TrendingUp,
  Gift,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  user: UserSession | null;
  trialUsage: UserTrialQuota | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onOpenPaywall: () => void;
  onLogout: () => void;
  onOpenShortcuts?: () => void;
  onOpenWorkspaces?: () => void;
  onOpenUsageHistory?: () => void;
  onOpenTour?: () => void;
  activeWorkspaceName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  trialUsage,
  onOpenAuth,
  onOpenPaywall,
  onLogout,
  onOpenShortcuts,
  onOpenWorkspaces,
  onOpenUsageHistory,
  onOpenTour,
  activeWorkspaceName = 'Personal Studio',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t, language } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const isFreeTrial = user?.tier === 'free_trial';
  const [hfStatus, setHfStatus] = useState<{ connected: boolean; username?: string } | null>(null);

  // Daily Free Quota Calculations
  const maxFreeItems = trialUsage ? (trialUsage.maxImages + trialUsage.maxVideo + trialUsage.maxAudio + trialUsage.maxRenders) : 6;
  const usedFreeItems = trialUsage ? (trialUsage.imagesCount + trialUsage.videoCount + trialUsage.audioCount + trialUsage.rendersCount) : 0;
  const remainingFreeItems = Math.max(0, maxFreeItems - usedFreeItems);
  const dailyFreePercent = Math.min(100, Math.max(0, Math.round((remainingFreeItems / maxFreeItems) * 100)));

  // 20% Warning Trigger Rule
  const show20PercentWarning = !isAdmin && dailyFreePercent <= 20;

  // Purchased Package Credits Calculations
  const tierMaxCredits = user?.tier === 'starter' ? 500 : user?.tier === 'creator' ? 1800 : user?.tier === 'pro_studio' ? 5000 : 60;
  const packageCreditsPercent = user ? Math.min(100, Math.max(0, Math.round((user.credits / tierMaxCredits) * 100))) : 0;

  useEffect(() => {
    apiGetHfStatus().then(st => setHfStatus(st)).catch(() => {});
  }, []);

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/90 sticky top-0 z-40 text-slate-100 shadow-xl select-none">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[56px] py-1.5 gap-2">
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-slate-950 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 group-hover:border-cyan-400/60 transition duration-200 shrink-0">
              <img 
                src="/logo.jpg" 
                alt="NepalAI Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallbackEl = document.createElement('div');
                    fallbackEl.className = 'logo-fallback w-full h-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white';
                    fallbackEl.innerHTML = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
                    parent.appendChild(fallbackEl);
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white group-hover:text-cyan-300 transition">
                  NepalAI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 hidden sm:inline shadow-xs">
                  studio.nepalai.tech
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Quotas, User Profile & Upgrade */}
          <div className="flex items-center gap-2 overflow-visible">
            {/* Live HF Connection Indicator */}
            <div 
              title={hfStatus?.connected ? `Hugging Face API connected for @${hfStatus.username || 'prakashsuvedi'}` : 'Hugging Face API initializing'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 font-medium shrink-0 shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>HF: {hfStatus?.connected ? `@${hfStatus.username || 'prakash'}` : 'Live'}</span>
            </div>

            {/* Studio Tools: Language, Tour, Workspaces, Shortcuts & Theme Toggle */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-visible">
              {/* Visible Segmented Language Switcher */}
              <LanguageSwitcher variant="header" />

              {/* Studio Onboarding Tour Button */}
              {onOpenTour && (
                <button
                  onClick={onOpenTour}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/80 hover:border-indigo-500 transition cursor-pointer shadow-2xs"
                  title="Interactive Studio Tour & Guide"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline font-bold text-[11px]">{t('nav.tour', 'Tour')}</span>
                </button>
              )}

              {/* Workspaces Switcher Button */}
              {onOpenWorkspaces && (
                <button
                  onClick={onOpenWorkspaces}
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition cursor-pointer"
                  title="Manage Workspaces & Team Collaboration"
                >
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[90px] truncate text-[11px]">{activeWorkspaceName}</span>
                </button>
              )}

              {/* Keyboard Shortcuts Trigger */}
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="hidden sm:flex p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition cursor-pointer"
                  title="Keyboard Shortcuts Cheatsheet (Press ?)"
                >
                  <Command className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition cursor-pointer"
                title={isDark ? 'Switch to Clean Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>
            </div>

            {/* Quota & Credits Indicator */}
            {user ? (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-600/60 text-[11px] font-bold text-amber-300 shrink-0 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Mode (∞)</span>
                  </div>
                ) : (
                  <div 
                    onClick={onOpenPaywall}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer shrink-0"
                    title="Click to view quota or top up credits"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="font-mono text-cyan-300">{user.credits} CR</span>
                    </div>
                  </div>
                )}

                {/* Upgrade Button */}
                {!isAdmin && (
                  <button
                    onClick={onOpenPaywall}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition cursor-pointer shrink-0"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>{t('btn.upgrade', 'Upgrade')}</span>
                  </button>
                )}

                {/* User Avatar & Logout */}
                <div 
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 pl-1.5 border-l border-slate-800 shrink-0 cursor-pointer group"
                  title="Open Dashboard & Refer & Earn"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700 group-hover:ring-2 ring-cyan-400 transition"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border border-slate-700 group-hover:ring-2 ring-cyan-400 transition">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <div className="text-[11px] font-bold text-slate-100 leading-tight max-w-[100px] truncate group-hover:text-cyan-300 transition">{user.name}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenAuth('user')}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('admin')}
                  className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                  title="Admin Gateway"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/80 pt-1.5">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'landing'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('nav.landing', 'Landing')}</span>
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('hamro_ai');
              }
            }}
            title={!user ? 'Sign in with Google to unlock HamroAI' : 'HamroAI (Multilingual GPT-4o & GPT-5-mini)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'hamro_ai'
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.35)] font-bold border border-amber-400/60'
                : 'text-amber-300 hover:text-white hover:bg-amber-950/50 border border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${activeTab === 'hamro_ai' ? 'text-white' : 'text-amber-400'}`} />
            <span className="font-bold">{t('nav.hamro_ai', 'HamroAI')}</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
              activeTab === 'hamro_ai' ? 'bg-amber-400 text-zinc-950' : 'bg-amber-900/60 text-amber-200 border border-amber-700/60'
            }`}>
              Nepali/Hindi
            </span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('video_studio');
              }
            }}
            title={!user ? 'Sign in with Google to unlock Video Studio' : 'Video Studio'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'video_studio'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{t('nav.video_studio', 'Video Studio')}</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('image_studio');
              }
            }}
            title={!user ? 'Sign in with Google to unlock Image Engine' : 'Image Engine'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'image_studio'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t('nav.image_studio', 'Image Engine')}</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('sora_studio');
              }
            }}
            title={!user ? 'Sign in with Google to unlock Sora-2 Video' : 'Sora-2 Video'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sora_studio'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t('nav.sora_studio', 'Sora-2 Video')}</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('tts_studio');
              }
            }}
            title={!user ? 'Sign in with Google to unlock Nepali Voiceover' : 'Nepali Voiceover'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tts_studio'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t('nav.tts_studio', 'Nepali Voiceover')}</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          {/* User Dashboard / Refer & Earn Tab */}
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('user');
              } else {
                setActiveTab('dashboard');
              }
            }}
            title={!user ? 'Sign in to access Referral Rewards & Dashboard' : 'User Dashboard & Refer & Earn'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t('nav.dashboard', 'Dashboard')}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-700/60 flex items-center gap-0.5">
              <Gift className="w-2.5 h-2.5 text-amber-400" />
              <span>{t('nav.refer_earn', 'Refer & Earn')}</span>
            </span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          {/* Superadmin Only Tabs */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                title="Superadmin Control Center"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Center</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60">
                  PRO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                title="System Audit & Preflight Diagnostics (Superadmin Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Audit & Diagnosis</span>
              </button>

              <button
                onClick={() => setActiveTab('hf_deployment_kit')}
                title="Hugging Face Deployment Kit & Secrets (Superadmin Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'hf_deployment_kit'
                    ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>HF Deployment Kit</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
