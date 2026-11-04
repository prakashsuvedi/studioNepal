import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StudioTab, UserSession, UserTrialQuota } from '../types';
import { apiGetHfStatus } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NepalAiLogo } from './NepalAiLogo';
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
  Check,
  MessageSquare,
  Smartphone,
  Menu,
  X
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
  onOpenFeedback?: () => void;
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
  onOpenFeedback,
  activeWorkspaceName = 'Personal Studio',
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const [hfStatus, setHfStatus] = useState<{ connected: boolean; username?: string } | null>(null);
  const [apkInfo, setApkInfo] = useState<{ available: boolean; sizeFormatted?: string; version?: string } | null>(null);

  useEffect(() => {
    fetch('/api/downloads/apk/status')
      .then(res => res.json())
      .then(data => setApkInfo(data))
      .catch(() => setApkInfo({ available: false }));
  }, []);

  // Dropdown states
  const [isStudioMenuOpen, setIsStudioMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUtilitiesMenuOpen, setIsUtilitiesMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
    'avatar_studio',
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
      case 'avatar_studio': return 'Avatar Presenter';
      case 'image_studio': return 'Image Engine';
      case 'character_studio': return 'Character Studio';
      case 'ad_builder': return 'Ad Builder';
      case 'tts_studio': return 'Voiceover';
      default: return 'Creation Studio';
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-md select-none transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-13 gap-2">
          
          {/* Left: Brand Logo & Main Navigation */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            </button>

            {/* Logo & Platform Name */}
            <div 
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2 cursor-pointer group shrink-0"
              title="NepalAI Studio - Home"
            >
              <NepalAiLogo size="md" />
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60 hidden lg:inline">
                2.0
              </span>
            </div>

            {/* Primary Navigation Menus */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              {/* Home */}
              <button
                onClick={() => setActiveTab('landing')}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer min-h-[38px] ${
                  activeTab === 'landing'
                    ? 'bg-slate-100 dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 border border-cyan-400/60 dark:border-cyan-500/40 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{t('nav.landing', 'Home')}</span>
              </button>

              {/* HamroAI (Nepali/Hindi Multi-lingual AI) */}
              <button
                onClick={() => handleTabClick('hamro_ai')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[38px] ${
                  activeTab === 'hamro_ai'
                    ? 'bg-amber-100 dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-orange-500/20 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/50 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
                title="HamroAI - Culturally Aware Multi-lingual Assistant (Nepali, Hindi, English)"
              >
                <Bot className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="font-semibold text-xs">{t('nav.hamro_ai', 'HamroAI')}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 hidden lg:inline font-bold">
                  NP/HI
                </span>
                {!user && <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
              </button>

              {/* Creation Studio Dropdown Submenu */}
              <div className="relative" ref={studioMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsStudioMenuOpen(!isStudioMenuOpen)}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[38px] ${
                    isStudioTabActive
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-400 dark:border-cyan-500/50 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                  title="Studio Creation Tools (Video, Sora-2, Image, Characters, Ad Builder, Voiceover)"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isStudioTabActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                  <span className="font-semibold hidden xs:inline">
                    {isStudioTabActive ? getStudioTabLabel() : 'Studio'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isStudioMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu Dropdown Panel */}
                {isStudioMenuOpen && (
                  <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:left-0 top-14 sm:top-full mt-1.5 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-slate-200 max-h-[80vh] overflow-y-auto overflow-touch">
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                      Creation Studios
                    </div>

                    <div className="space-y-0.5">
                      {/* Video Studio */}
                      <button
                        onClick={() => handleTabClick('video_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'video_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Film className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Video Studio</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Multi-track timeline</div>
                          </div>
                        </div>
                        {activeTab === 'video_studio' && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                      </button>

                      {/* Sora-2 Video */}
                      <button
                        onClick={() => handleTabClick('sora_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'sora_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Sora-2 Video</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Text-to-video reels</div>
                          </div>
                        </div>
                        {activeTab === 'sora_studio' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </button>

                      {/* Avatar Presenter */}
                      <button
                        onClick={() => handleTabClick('avatar_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'avatar_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Avatar Presenter</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">AI presenters & speakers</div>
                          </div>
                        </div>
                        {activeTab === 'avatar_studio' && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                      </button>

                      {/* Image Engine */}
                      <button
                        onClick={() => handleTabClick('image_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'image_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Image Studio</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Azure & Flux image engine</div>
                          </div>
                        </div>
                        {activeTab === 'image_studio' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </button>

                      {/* Character Studio */}
                      <button
                        onClick={() => handleTabClick('character_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'character_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Character Forge</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Consistent characters</div>
                          </div>
                        </div>
                        {activeTab === 'character_studio' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                      </button>

                      {/* Ad Builder */}
                      <button
                        onClick={() => handleTabClick('ad_builder')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'ad_builder'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Ad Builder</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Video ads & promos</div>
                          </div>
                        </div>
                        {activeTab === 'ad_builder' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                      </button>

                      {/* Nepali Voiceover */}
                      <button
                        onClick={() => handleTabClick('tts_studio')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                          activeTab === 'tts_studio'
                            ? 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Mic className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <div>
                            <div className="text-xs font-semibold leading-tight">Voice Studio</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Neural speech & voiceover</div>
                          </div>
                        </div>
                        {activeTab === 'tts_studio' && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
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
                      ? 'bg-slate-100 dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 border border-cyan-400/60 dark:border-cyan-500/40 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                  }`}
                  title="Dashboard & Refer & Earn"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="hidden md:inline font-semibold">{t('nav.dashboard', 'Dashboard')}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hidden xl:flex items-center gap-0.5 font-bold">
                    <Gift className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
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
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-400 dark:border-amber-500/60 font-semibold'
                        : 'text-amber-700 dark:text-amber-400/90 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold hidden lg:inline">Admin Hub</span>
                    <ChevronDown className={`w-3 h-3 text-amber-600 dark:text-amber-400/80 transition-transform duration-150 ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAdminMenuOpen && (
                    <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:left-0 top-14 sm:top-full mt-1.5 sm:w-56 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-slate-200">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400/80 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                        Superadmin Controls
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => handleTabClick('admin')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'admin' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Admin Center</span>
                          </div>
                          {activeTab === 'admin' && <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        </button>
                        <button
                          onClick={() => handleTabClick('audit')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'audit' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Audit & Diagnostics</span>
                          </div>
                          {activeTab === 'audit' && <Check className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />}
                        </button>
                        <button
                          onClick={() => handleTabClick('hf_deployment_kit')}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                            activeTab === 'hf_deployment_kit' ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>HF Deployment Kit</span>
                          </div>
                          {activeTab === 'hf_deployment_kit' && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right Controls: Engine Health, Language Dropdown, Theme Toggle, Utilities, & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Live HF Connection Indicator (Compact) */}
            <div 
              title={hfStatus?.connected ? `Hugging Face API connected for @${hfStatus.username || 'prakashsuvedi'}` : 'Hugging Face API initializing'}
              className="hidden 2xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-medium shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <Cpu className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>HF: {hfStatus?.connected ? `@${hfStatus.username || 'prakash'}` : 'Live'}</span>
            </div>

            {/* Compact Language Selector Dropdown */}
            <LanguageSwitcher variant="dropdown" />

            {/* Direct 1-Click Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer flex items-center justify-center shrink-0"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600 animate-in spin-in-90 duration-200" />
              )}
            </button>

            {/* Feedback & Bug Reporting Trigger Button */}
            {onOpenFeedback && (
              <button
                type="button"
                onClick={onOpenFeedback}
                aria-label="Feedback & Bug Reporting"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="Submit Feature Request, Bug Report, or Direct Feedback"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden md:inline">Feedback / Bug</span>
              </button>
            )}

            {/* Verified Android APK Download Button */}
            <a
              href="/downloads/nepalai-studio.apk"
              download="nepalai-studio-v1.0.0.apk"
              title={apkInfo?.available ? `Download NepalAI Studio Android App (${apkInfo.sizeFormatted || '12 MB'})` : 'Android App (APK)'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition shrink-0 ${
                apkInfo?.available
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-xs cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Download APK</span>
              <span className="sm:hidden font-mono text-[10px]">APK</span>
              {apkInfo?.available && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </a>

            {/* Utilities Submenu (Tour, Workspace, Shortcuts, Theme) */}
            <div className="relative" ref={utilitiesMenuRef}>
              <button
                type="button"
                aria-label="Studio Preferences & Tools"
                onClick={() => setIsUtilitiesMenuOpen(!isUtilitiesMenuOpen)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                title="Studio Preferences & Tools"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isUtilitiesMenuOpen && (
                <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:right-0 top-14 sm:top-full mt-1.5 sm:w-48 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-800 dark:text-slate-200">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-0.5">
                    Studio Utilities
                  </div>
                  {onOpenTour && (
                    <button
                      onClick={() => {
                        onOpenTour();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Studio Tour & Guide</span>
                    </button>
                  )}
                  {onOpenWorkspaces && (
                    <button
                      onClick={() => {
                        onOpenWorkspaces();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="truncate">Workspace: {activeWorkspaceName}</span>
                    </button>
                  )}
                  {onOpenShortcuts && (
                    <button
                      onClick={() => {
                        onOpenShortcuts();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Command className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Shortcuts</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">?</span>
                    </button>
                  )}
                  {onOpenFeedback && (
                    <button
                      onClick={() => {
                        onOpenFeedback();
                        setIsUtilitiesMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
                      <span>Feedback & Report Bug</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsUtilitiesMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer border-t border-slate-100 dark:border-slate-800/60 mt-0.5 pt-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
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
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600/60 text-[11px] font-bold text-amber-900 dark:text-amber-300 shrink-0 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="hidden sm:inline">Admin Mode (∞)</span>
                    <span className="sm:hidden font-mono">∞</span>
                  </div>
                ) : (
                  <div 
                    onClick={onOpenPaywall}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition cursor-pointer shrink-0"
                    title="Click to view quota or top up credits"
                  >
                    <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">{user.credits} CR</span>
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
                    className="flex items-center justify-center p-1 min-w-[38px] min-h-[38px] rounded-full hover:ring-2 ring-cyan-400/60 transition cursor-pointer"
                    aria-label="User profile & preferences"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold border border-slate-300 dark:border-slate-700">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {isUserMenuOpen && (
                    <div className="fixed inset-x-3 sm:inset-x-auto sm:absolute sm:right-0 top-14 sm:top-full mt-1.5 sm:w-60 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-800 dark:text-slate-200">
                      <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
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
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Dashboard & Analytics</span>
                        </button>

                        {onOpenUsageHistory && (
                          <button
                            onClick={() => {
                              onOpenUsageHistory();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Usage History & Audit</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onOpenPaywall();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Pricing & Credit Top-up</span>
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer font-medium"
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
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                  title="Admin Gateway"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Slide-Over Mobile Navigation Drawer (Rendered via Portal to escape header backdrop-blur stacking context) */}
      {isMobileDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex">
          {/* Dimmed Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800 h-full max-h-[100dvh] flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-250 safe-area-bottom overflow-x-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <NepalAiLogo size="sm" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate">NepalAI Studio</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">All Creative Suites & Tools</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content (Scrollable, Zero Horizontal Overflow) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden overflow-touch p-3 space-y-4 text-xs">
              {/* User Card if logged in */}
              {user ? (
                <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                      <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1 truncate">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        <span>{user.credits} CR</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { onOpenPaywall(); setIsMobileDrawerOpen(false); }}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-[10px] shrink-0 shadow-xs cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-amber-500/10 border border-cyan-500/20 text-center space-y-2">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">Sign in to unlock all studio suites & cloud render.</p>
                  <button
                    onClick={() => { onOpenAuth('user'); setIsMobileDrawerOpen(false); }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-amber-600 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Sign In with Google
                  </button>
                </div>
              )}

              {/* Section 1: Creative Studios */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Creative Studios
                </div>

                <button
                  onClick={() => { setActiveTab('landing'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'landing' ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <Home className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="truncate">Home</span>
                </button>

                <button
                  onClick={() => { handleTabClick('hamro_ai'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'hamro_ai' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Bot className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">HamroAI</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabClick('video_studio'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'video_studio' ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Film className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="truncate">Video Studio</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabClick('sora_studio'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'sora_studio' ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Video className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">Sora-2 Video</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabClick('image_studio'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'image_studio' ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">Image Studio</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabClick('tts_studio'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'tts_studio' ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Mic className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">Voice Studio</span>
                  </div>
                </button>

                <button
                  onClick={() => { handleTabClick('avatar_studio'); setIsMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'avatar_studio' ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserCheck className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="truncate">Avatar Presenter</span>
                  </div>
                </button>
              </div>

              {/* Section 2: Account & Oversight */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Account & Dashboards
                </div>

                {user && (
                  <button
                    onClick={() => { handleTabClick('dashboard'); setIsMobileDrawerOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <LayoutDashboard className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">Creator Dashboard</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">Refer</span>
                  </button>
                )}

                <button
                  onClick={() => { onOpenPaywall(); setIsMobileDrawerOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">Pricing & Credits</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 shrink-0">FonePay</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { handleTabClick('admin'); setIsMobileDrawerOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-medium transition cursor-pointer min-w-0 ${activeTab === 'admin' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">Admin Oversight</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">Admin</span>
                  </button>
                )}

                {onOpenFeedback && (
                  <button
                    onClick={() => { onOpenFeedback(); setIsMobileDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer min-w-0"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="truncate">Feedback & Bug Reports</span>
                  </button>
                )}

                {user && (
                  <button
                    onClick={() => { onLogout(); setIsMobileDrawerOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer min-w-0"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="truncate">Log Out</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer: Theme & Language */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-2 text-xs shrink-0">
              <LanguageSwitcher variant="compact" />
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer shrink-0"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
