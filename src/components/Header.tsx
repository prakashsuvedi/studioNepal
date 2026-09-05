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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 text-slate-900 shadow-2xs select-none">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  NepalAI Studio
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  studio.nepalai.tech
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Cinema AI Video • Azure Sora-2 & FLUX • Bilingual Nepali Media Suite
              </p>
            </div>
          </div>

          {/* Right Controls: Quotas, User Profile & Upgrade */}
          <div className="flex items-center gap-2.5">
            {/* Live HF Connection Indicator */}
            <div 
              title={hfStatus?.connected ? `Hugging Face API connected for @${hfStatus.username || 'prakashsuvedi'}` : 'Hugging Face API initializing'}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cpu className="w-3 h-3 text-slate-500" />
              <span>HF: {hfStatus?.connected ? `@${hfStatus.username || 'prakashsuvedi'}` : 'Live'}</span>
            </div>

            {/* Studio Tools: Workspaces, Shortcuts & Theme Toggle */}
            <div className="flex items-center gap-1.5 pl-1">
              {/* Workspaces Switcher Button */}
              {onOpenWorkspaces && (
                <button
                  onClick={onOpenWorkspaces}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
                  title="Manage Workspaces & Team Collaboration"
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden lg:inline max-w-[110px] truncate">{activeWorkspaceName}</span>
                </button>
              )}

              {/* Keyboard Shortcuts Trigger */}
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-400 transition cursor-pointer"
                  title="Keyboard Shortcuts Cheatsheet (Press ?)"
                >
                  <Command className="w-4 h-4" />
                </button>
              )}

              {/* Usage & Task History Trigger */}
              {onOpenUsageHistory && user && (
                <button
                  onClick={onOpenUsageHistory}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-400 transition cursor-pointer"
                  title="View Task & Credit Usage History"
                >
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden xl:inline text-xs font-bold">Usage History</span>
                </button>
              )}

              {/* Theme Toggle: Premium Dark (Video Editing) / Clean Light */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                title={isDark ? 'Switch to Clean Light Mode' : 'Switch to Premium Dark Mode (Optimized for Video Editing)'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>

            {/* Trial Quota & Credit Meters (Simultaneous Dual Progress Bars) */}
            {user ? (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>∞ Admin (Unlimited)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* 20% Low Free Quota Warning System Banner */}
                    {show20PercentWarning && (
                      <div
                        onClick={onOpenPaywall}
                        className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold animate-pulse hover:bg-amber-500/25 transition cursor-pointer shadow-sm"
                        title="Low daily quota remaining! Click to buy Micro-Credits (रू 50 Pass)"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Low Daily Quota (≤20% left)! Grab Sasta रू 50 Pass</span>
                      </div>
                    )}

                    {/* Dual Progress Bars Container */}
                    <div 
                      onClick={onOpenPaywall}
                      className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer shadow-xs"
                      title="Click to view full quota breakdown or buy Micro-Credits"
                    >
                      {/* Bar 1: Daily Free Credits (Emerald Green) */}
                      {trialUsage && (
                        <div className="flex flex-col gap-0.5 min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Daily Free
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {dailyFreePercent}%
                            </span>
                          </div>
                          {/* Progress Bar Track */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                dailyFreePercent <= 20 
                                  ? 'bg-rose-500' 
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`}
                              style={{ width: `${dailyFreePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 leading-none">
                            📸{Math.max(0, 3 - trialUsage.imagesCount)}/3 • 🎬{Math.max(0, 1 - trialUsage.videoCount)}/1
                          </span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="w-px h-7 bg-slate-200 dark:bg-slate-800"></div>

                      {/* Bar 2: Purchased Package Credits (Indigo / Purple) */}
                      <div className="flex flex-col gap-0.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-indigo-500" />
                            {user.tier === 'pro_studio' ? 'Agency' : user.tier === 'free_trial' ? 'Paid' : user.tier}
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-200">
                            {user.credits} CR
                          </span>
                        </div>
                        {/* Progress Bar Track */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-500"
                            style={{ width: `${packageCreditsPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 leading-none">
                          {isFreeTrial ? '0 Paid Credits' : `${packageCreditsPercent}% Balance`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upgrade Button */}
                {!isAdmin && (
                  <button
                    onClick={onOpenPaywall}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Upgrade to Pro</span>
                    <span className="sm:hidden">Upgrade</span>
                  </button>
                )}

                {/* User Avatar & Logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono leading-tight">{user.email}</div>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('user')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-2"
                >
                  <span>Sign In with Google</span>
                </button>
                <button
                  onClick={() => onOpenAuth('admin')}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                  title="Admin Gateway"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-1.5">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'landing'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm'
                : 'text-slate-800 hover:text-slate-950 hover:bg-amber-50/80 border border-amber-300/80 bg-amber-50/40'
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${activeTab === 'hamro_ai' ? 'text-white' : 'text-amber-600'}`} />
            <span className="font-bold">HamroAI</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
              activeTab === 'hamro_ai' ? 'bg-amber-400 text-zinc-950' : 'bg-amber-100 text-amber-900 border border-amber-200'
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
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin Center</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  PRO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                title="System Audit & Preflight Diagnostics (Superadmin Only)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
