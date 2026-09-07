import React, { useState, useRef, useEffect } from 'react';
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
  CreditCard,
  LogOut,
  Home,
  Cpu,
  Bot,
  Sun,
  Moon,
  Command,
  Briefcase,
  History,
  Gift,
  LayoutDashboard,
  Megaphone,
  UserCheck,
  ChevronDown,
  MoreHorizontal,
  Wand2,
  Check
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
  const { toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const [hfStatus, setHfStatus] = useState<{ connected: boolean; username?: string } | null>(null);

  // Dropdown states
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUtilitiesMenuOpen, setIsUtilitiesMenuOpen] = useState(false);

  const studioMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const utilitiesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGetHfStatus().then(st => setHfStatus(st)).catch(() => {});
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (studioMenuRef.current && !studioMenuRef.current.contains(target)) {
        setIsStudioMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(target)) {
        setIsAdminMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (utilitiesMenuRef.current && !utilitiesMenuRef.current.contains(target)) {
        setIsUtilitiesMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Check if current active tab is one of the Studio tools
  const studioTabs: StudioTab[] = [
    'video_studio',
    'sora_studio',
    'image_studio',
    'character_studio',
    'ad_builder',
    'tts_studio'
  ];
  const isStudioTabActive = studioTabs.includes(activeTab);

  // Check if current active tab is an Admin tool
  const adminTabs: StudioTab[] = ['admin', 'audit', 'hf_deployment_kit'];
  const isAdminTabActive = adminTabs.includes(activeTab);

  const handleTabClick = (tab: StudioTab) => {
    if (!user && tab !== 'landing') {
      onOpenAuth('user');
      return;
    }
    setActiveTab(tab);
    setIsStudioMenuOpen(false);
    setIsAdminMenuOpen(false);
  };

  const getStudioTabLabel = () => {
    switch (activeTab) {
      case 'video_studio': return 'Video Studio';
      case 'sora_studio': return 'Sora-2 Video';
      case 'image_studio': return 'Image Engine';
      case 'character_studio': return 'Character Studio';
      case 'ad_builder': return 'Ad Builder';
      case 'tts_studio': return 'Voiceover';
      default: return 'Creation Studio';
    }
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 text-slate-100 shadow-md select-none transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-13 gap-2">
          
          {/* Left: Brand Logo & Main Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Logo & Platform Name */}
            <div 
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title="NepalAI Studio - Home"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-900 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:border-cyan-400/60 group-hover:scale-105 transition duration-150 shrink-0">
                <img 
                  src="/logo.jpg" 
                  alt="NepalAI Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.logo-fallback')) {
                      const fallbackEl = document.createElement('div');
                      fallbackEl.className = 'logo-fallback w-full h-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-black';
                      fallbackEl.innerText = 'NAI';
                      parent.appendChild(fallbackEl);
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-300 transition">
                  NepalAI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hidden md:inline">
                  Studio 2.0
                </span>
              </div>
            </div>

            {/* Primary Navigation Menus */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              {/* Home */}
              <button
                onClick={() => setActiveTab('landing')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'landing'
                    ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.landing', 'Home')}</span>
              </button>

              {/* HamroAI (Nepali/Hindi Multi-lingual AI) */}
              <button
                onClick={() => handleTabClick('hamro_ai')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'hamro_ai'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
                title="HamroAI - Culturally Aware Multi-lingual Assistant (Nepali, Hindi, English)"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">{t('nav.hamro_ai', 'HamroAI')}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60 hidden lg:inline font-bold">
                  NP/HI
                </span>
                {!user && <Lock className="w-3 h-3 text-slate-500" />}
              </button>

              {/* Creation Studio Dropdown Submenu */}
              <div className="relative" ref={studioMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsStudioMenuOpen(!isStudioMenuOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    isStudioTabActive
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                  title="Studio Creation Tools (Video, Sora-2, Image, Characters, Ad Builder, Voiceover)"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isStudioTabActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="font-semibold">
                    {isStudioTabActive ? getStudioTabLabel() : 'Studio Tools'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isStudioMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu Dropdown Panel */}
                {isStudioMenuOpen && (
                  <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                      <span>AI Creation Tools</span>
                      <span className="text-[9px] text-cyan-400 font-mono">6 Engines</span>
                    </div>

                    <div className="space-y-0.5">
                      {/* Video Studio */}
                      <button
                        onClick={() => handleTabClick('video_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'video_studio'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Video Studio</div>
                            <div className="text-[10px] text-slate-400">Multi-track timeline & scenes</div>
                          </div>
                        </div>
                        {activeTab === 'video_studio' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>

                      {/* Sora-2 Video */}
                      <button
                        onClick={() => handleTabClick('sora_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'sora_studio'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                              <span>Sora-2 Video</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Azure</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Cinematic text-to-video AI</div>
                          </div>
                        </div>
                        {activeTab === 'sora_studio' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>

                      {/* Image Engine */}
                      <button
                        onClick={() => handleTabClick('image_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'image_studio'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Image Engine</div>
                            <div className="text-[10px] text-slate-400">Azure gpt-image-1.5 & FLUX</div>
                          </div>
                        </div>
                        {activeTab === 'image_studio' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      {/* Character Studio */}
                      <button
                        onClick={() => handleTabClick('character_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'character_studio'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                              <span>Character Studio</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">FaceID</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Consistent characters & avatars</div>
                          </div>
                        </div>
                        {activeTab === 'character_studio' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>

                      {/* Ad Builder */}
                      <button
                        onClick={() => handleTabClick('ad_builder')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'ad_builder'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                              <span>Ad Builder</span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">Templates</span>
                            </div>
                            <div className="text-[10px] text-slate-400">High-converting viral ads</div>
                          </div>
                        </div>
                        {activeTab === 'ad_builder' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </button>

                      {/* Nepali Voiceover */}
                      <button
                        onClick={() => handleTabClick('tts_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'tts_studio'
                            ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Mic className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Nepali Voiceover</div>
                            <div className="text-[10px] text-slate-400">SpeechT5 & Azure neural TTS</div>
                          </div>
                        </div>
                        {activeTab === 'tts_studio' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard & Refer & Earn */}
              {user && (
                <button
                  onClick={() => handleTabClick('dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-900 text-cyan-300 border border-cyan-500/40 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                  title="Dashboard & Refer & Earn"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline font-semibold">{t('nav.dashboard', 'Dashboard')}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60 hidden xl:flex items-center gap-0.5 font-bold">
                    <Gift className="w-2.5 h-2.5 text-amber-400" />
                    <span>Earn</span>
                  </span>
                </button>
              )}

              {/* Admin Hub (For Admins Only) */}
              {isAdmin && (
                <div className="relative" ref={adminMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      isAdminTabActive
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/60 font-semibold'
                        : 'text-amber-400/90 hover:text-amber-200 hover:bg-amber-950/40'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold hidden lg:inline">Admin Hub</span>
                    <ChevronDown className={`w-3 h-3 text-amber-400/80 transition-transform duration-150 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdminMenuOpen && (
                    <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 border-b border-slate-800/80 mb-1">
                        Superadmin Controls
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => handleTabClick('admin')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'admin' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Admin Center</span>
                          </div>
                          {activeTab === 'admin' && <Check className="w-3 h-3 text-amber-400" />}
                        </button>
                        <button
                          onClick={() => handleTabClick('audit')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'audit' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Audit & Diagnostics</span>
                          </div>
                          {activeTab === 'audit' && <Check className="w-3 h-3 text-cyan-400" />}
                        </button>
                        <button
                          onClick={() => handleTabClick('hf_deployment_kit')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'hf_deployment_kit' ? 'bg-amber-500/15 text-amber-300 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>HF Deployment Kit</span>
                          </div>
                          {activeTab === 'hf_deployment_kit' && <Check className="w-3 h-3 text-indigo-400" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right Controls: Engine Health, Language Dropdown, Utilities, & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Live HF Connection Indicator (Compact) */}
            <div 
              title={hfStatus?.connected ? `Hugging Face API connected for @${hfStatus.username || 'prakashsuvedi'}` : 'Hugging Face API initializing'}
              className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 font-medium shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>HF: {hfStatus?.connected ? `@${hfStatus.username || 'prakash'}` : 'Live'}</span>
            </div>

            {/* Compact Language Selector Dropdown */}
            <LanguageSwitcher variant="dropdown" />

            {/* Utilities Submenu (Tour, Workspace, Shortcuts, Theme) */}
            <div className="relative" ref={utilitiesMenuRef}>
              <button
                type="button"
                onClick={() => setIsUtilitiesMenuOpen(!isUtilitiesMenuOpen)}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                title="Studio Preferences & Tools"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isUtilitiesMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-0.5">
                    Studio Utilities
                  </div>
                  {onOpenTour && (
                    <button
                      onClick={() => {
                        onOpenTour();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Studio Tour & Guide</span>
                    </button>
                  )}
                  {onOpenWorkspaces && (
                    <button
                      onClick={() => {
                        onOpenWorkspaces();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate">Workspace: {activeWorkspaceName}</span>
                    </button>
                  )}
                  {onOpenShortcuts && (
                    <button
                      onClick={() => {
                        onOpenShortcuts();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Command className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shortcuts</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">?</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsUtilitiesMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer border-t border-slate-800/60 mt-0.5 pt-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Quota & User Authentication Section */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Admin Mode Badge or User Credits Pill */}
                {isAdmin ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-600/60 text-[11px] font-bold text-amber-300 shrink-0 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Admin Mode (∞)</span>
                    <span className="sm:hidden font-mono">∞</span>
                  </div>
                ) : (
                  <div 
                    onClick={onOpenPaywall}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer shrink-0"
                    title="Click to view quota or top up credits"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="font-mono text-xs font-bold text-cyan-300">{user.credits} CR</span>
                  </div>
                )}

                {/* Upgrade Button */}
                {!isAdmin && (
                  <button
                    onClick={onOpenPaywall}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition cursor-pointer shrink-0"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>{t('btn.upgrade', 'Upgrade')}</span>
                  </button>
                )}

                {/* User Avatar with Profile Dropdown Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 ring-cyan-400/60 transition cursor-pointer"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-bold border border-slate-700">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                      <div className="px-2.5 py-2 border-b border-slate-800/80 mb-1">
                        <div className="font-bold text-white text-xs truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                          <span className="capitalize">{user.tier.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{user.credits} credits</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <button
                          onClick={() => {
                            setActiveTab('dashboard');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Dashboard & Analytics</span>
                        </button>

                        {onOpenUsageHistory && (
                          <button
                            onClick={() => {
                              onOpenUsageHistory();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Usage History & Audit</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onOpenPaywall();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Pricing & Credit Top-up</span>
                        </button>

                        <div className="border-t border-slate-800/80 my-1"></div>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition cursor-pointer font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('user')}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('admin')}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                  title="Admin Gateway"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
