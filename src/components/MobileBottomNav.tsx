import React, { useState } from 'react';
import { StudioTab, UserSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, 
  Bot, 
  Film, 
  Image as ImageIcon, 
  Mic, 
  Menu,
  ShieldCheck, 
  User, 
  Zap, 
  Lock,
  Gift,
  LayoutDashboard,
  Video,
  Sparkles,
  Briefcase,
  History,
  MessageSquare,
  Sun,
  Moon,
  Smartphone,
  X,
  CreditCard,
  ChevronRight
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  user: UserSession | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onOpenPaywall: () => void;
  onOpenTour?: () => void;
  onOpenWorkspaces?: () => void;
  onOpenUsageHistory?: () => void;
  onOpenFeedback?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenPaywall,
  onOpenTour,
  onOpenWorkspaces,
  onOpenUsageHistory,
  onOpenFeedback,
}) => {
  const { language, setLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      id: 'landing' as StudioTab,
      label: language === 'ne' ? 'होम' : language === 'hi' ? 'होम' : 'Home',
      icon: Home,
      requiresAuth: false,
    },
    {
      id: 'hamro_ai' as StudioTab,
      label: 'HamroAI',
      icon: Bot,
      requiresAuth: true,
      badge: 'AI',
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'video_studio' as StudioTab,
      label: language === 'ne' ? 'भिडियो' : language === 'hi' ? 'वीडियो' : 'Video',
      icon: Film,
      requiresAuth: true,
      highlight: true,
    },
    {
      id: 'tts_studio' as StudioTab,
      label: language === 'ne' ? 'आवाज' : language === 'hi' ? 'आवाज' : 'Voice',
      icon: Mic,
      requiresAuth: true,
    },
  ];

  const handleTabClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      onOpenAuth('user');
      return;
    }
    setActiveTab(item.id);
    setIsMoreOpen(false);
  };

  const handleSelectStudio = (tab: StudioTab, requiresAuth = true) => {
    if (requiresAuth && !user) {
      onOpenAuth('user');
      return;
    }
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Slide-Up "More" Categorized Menu Sheet */}
      {isMoreOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMoreOpen(false)}
        >
          <div 
            className="bg-slate-950 border-t border-slate-800 rounded-t-3xl max-h-[85dvh] overflow-y-auto overflow-x-hidden overflow-touch p-4 text-slate-100 shadow-2xl safe-area-bottom animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
                  ने
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 leading-tight">
                    {language === 'ne' ? 'नेपालएआई स्टुडियो' : 'NepalAI Studio'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {language === 'ne' ? 'सबै सिर्जनात्मक उपकरणहरू' : 'All Creative Studios & Tools'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Session / Credits Card */}
            {user ? (
              <div className="mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{user.name || 'Creator'}</span>
                      {isAdmin && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">Admin</span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{user.credits} CR Available</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenPaywall();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Top Up</span>
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-800/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-200">Sign in to unlock all studios</div>
                  <div className="text-[10px] text-slate-400">Free daily credits for video & voice generation</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenAuth('user');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Category: Creative Studios */}
            <div className="mb-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 px-1">
                Creative AI Studios
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectStudio('sora_studio')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    activeTab === 'sora_studio'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Video className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">Azure Sora-2</div>
                    <div className="text-[9px] text-slate-400">1080p AI Video</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudio('image_studio')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    activeTab === 'image_studio'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">GPT-Image</div>
                    <div className="text-[9px] text-slate-400">2.5 & 1.5 Stills</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudio('avatar_studio')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    activeTab === 'avatar_studio'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">Avatar Presenter</div>
                    <div className="text-[9px] text-slate-400">Nepali Lip-Sync</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectStudio('dashboard')}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${
                    activeTab === 'dashboard'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-tight">User Dashboard</div>
                    <div className="text-[9px] text-slate-400">Referrals & Credits</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: Tools & Modals */}
            <div className="mb-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 px-1">
                Studio Tools & Utilities
              </div>
              <div className="space-y-1.5">
                {onOpenWorkspaces && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenWorkspaces();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Workspaces</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                {onOpenUsageHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenUsageHistory();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Usage History & Ledger</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                {onOpenTour && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenTour();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Studio Guided Tour</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                {onOpenFeedback && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onOpenFeedback();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs text-rose-300"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                      <span>Feedback & Report Bug</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-rose-500/60" />
                  </button>
                )}
              </div>
            </div>

            {/* Category: System & Downloads */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5 text-xs font-bold"
                  title="Toggle Light / Dark Theme"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{isDark ? 'Light' : 'Dark'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage(language === 'ne' ? 'en' : language === 'en' ? 'hi' : 'ne')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  {language === 'ne' ? 'नेपाली' : language === 'hi' ? 'हिंदी' : 'EN'}
                </button>
              </div>

              <a
                href="/downloads/nepalai-studio.apk"
                download="nepalai-studio-v1.0.0.apk"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>

            {/* Admin Shortcuts if applicable */}
            {isAdmin && (
              <div className="mt-3 pt-3 border-t border-amber-900/40 flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-500">Admin Mode</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectStudio('admin')}
                    className="px-2 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[10px] font-bold"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectStudio('audit')}
                    className="px-2 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[10px] font-bold"
                  >
                    Audit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main 5-Button Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.5)] select-none safe-area-bottom text-slate-100"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1 rounded-2xl transition-all relative cursor-pointer ${
                  isActive 
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-2 -top-1 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <div className="relative">
                  {item.highlight ? (
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900 text-cyan-400 border border-slate-800'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  ) : (
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-cyan-300' : ''}`} />
                  )}

                  {item.badge && (
                    <span className={`absolute -top-1.5 -right-2 text-[8px] font-black px-1 rounded-full shadow-xs ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}

                  {item.requiresAuth && !user && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-900 rounded-full flex items-center justify-center text-slate-400 border border-slate-700">
                      <Lock className="w-2 h-2" />
                    </span>
                  )}
                </div>

                <span className={`text-[10px] mt-0.5 font-medium tracking-tight leading-none ${isActive ? 'font-black text-cyan-300' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5th Button: More Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1 rounded-2xl cursor-pointer transition-all ${
              isMoreOpen ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="More Studios, Settings & Tools"
          >
            <div className={`flex items-center justify-center w-7 h-7 rounded-full border transition ${
              isMoreOpen 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold">
              {language === 'ne' ? 'अझै' : language === 'hi' ? 'और' : 'More'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
