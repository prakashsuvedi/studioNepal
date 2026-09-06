import React, { useState, useEffect } from 'react';
import { StudioTab, UserSession, UserTrialQuota } from '../types';
import { apiGetHfStatus } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
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
  TrendingUp
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
  activeWorkspaceName = 'Personal Studio',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 text-slate-900 dark:text-slate-100 shadow-2xs select-none">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[56px] py-1.5 gap-2">
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  NepalAI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 hidden sm:inline">
                  studio.nepalai.tech
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Quotas, User Profile & Upgrade */}
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Live HF Connection Indicator */}
            <div 
              title={hfStatus?.connected ? `Hugging Face API connected for @${hfStatus.username || 'prakashsuvedi'}` : 'Hugging Face API initializing'}
              className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-medium shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>HF: {hfStatus?.connected ? `@${hfStatus.username || 'prakash'}` : 'Live'}</span>
            </div>

            {/* Studio Tools: Workspaces, Shortcuts & Theme Toggle */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Workspaces Switcher Button */}
              {onOpenWorkspaces && (
                <button
                  onClick={onOpenWorkspaces}
                  className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer"
                  title="Manage Workspaces & Team Collaboration"
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="max-w-[90px] truncate text-[11px]">{activeWorkspaceName}</span>
                </button>
              )}

              {/* Keyboard Shortcuts Trigger */}
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                  title="Keyboard Shortcuts Cheatsheet (Press ?)"
                >
                  <Command className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer"
                title={isDark ? 'Switch to Clean Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            </div>

            {/* Quota & Credits Indicator */}
            {user ? (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin Mode (∞)</span>
                  </div>
                ) : (
                  <div 
                    onClick={onOpenPaywall}
                    className="flex items-center gap-2 px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition cursor-pointer shrink-0"
                    title="Click to view quota or top up credits"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="font-mono text-slate-800 dark:text-slate-200">{user.credits} CR</span>
                    </div>
                  </div>
                )}

                {/* Upgrade Button */}
                {!isAdmin && (
                  <button
                    onClick={onOpenPaywall}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-[11px] shadow-xs transition cursor-pointer shrink-0"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Upgrade</span>
                  </button>
                )}

                {/* User Avatar & Logout */}
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700 shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border border-slate-200">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[100px] truncate">{user.name}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onOpenAuth('user')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('admin')}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
                  title="Admin Gateway"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-1.5">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'landing'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'hamro_ai'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm font-bold'
                : 'text-slate-800 dark:text-amber-200 hover:text-slate-950 dark:hover:text-white hover:bg-amber-50/80 dark:hover:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20'
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${activeTab === 'hamro_ai' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
            <span className="font-bold">HamroAI</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
              activeTab === 'hamro_ai' ? 'bg-amber-400 text-zinc-950' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'video_studio'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Studio</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'image_studio'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Engine</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'sora_studio'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Sora-2 Video</span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tts_studio'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Nepali Voiceover</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          {/* Superadmin Only Tabs */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                title="Superadmin Control Center"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Center</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  PRO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                title="System Audit & Preflight Diagnostics (Superadmin Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Audit & Diagnosis</span>
              </button>

              <button
                onClick={() => setActiveTab('hf_deployment_kit')}
                title="Hugging Face Deployment Kit & Secrets (Superadmin Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'hf_deployment_kit'
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
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
