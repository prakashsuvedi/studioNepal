import React from 'react';
import { StudioTab, UserSession } from '../types';
import { useLanguage } from '../context/LanguageContext';
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
  LayoutDashboard
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  user: UserSession | null;
  onOpenAuth: (mode?: 'user' | 'admin') => void;
  onOpenPaywall: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenPaywall,
}) => {
  const { language } = useLanguage();

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
  };

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] select-none safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1.5 rounded-2xl transition-all relative cursor-pointer ${
                isActive 
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Highlight background pill for active state */}
              {isActive && (
                <span className="absolute inset-x-2 -top-1 h-0.5 bg-rose-600 dark:bg-rose-500 rounded-full" />
              )}

              <div className="relative">
                {item.highlight ? (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-rose-950/40'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                )}

                {/* Optional Badge */}
                {item.badge && (
                  <span className={`absolute -top-1.5 -right-2 text-[8px] font-black px-1 rounded-full shadow-xs ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {/* Lock icon if not signed in */}
                {item.requiresAuth && !user && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                    <Lock className="w-2 h-2" />
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 font-medium tracking-tight leading-none ${isActive ? 'font-black' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* User Account or Sign In Button */}
        {user ? (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1 rounded-2xl cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'
            }`}
            title="User Dashboard & Refer & Earn"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400 relative">
              <Zap className="w-3.5 h-3.5 fill-amber-500" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <span>{user.credits} CR</span>
            </span>
          </button>
        ) : (
          <button
            onClick={() => onOpenAuth('user')}
            className="flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-rose-600 cursor-pointer"
            title="Sign In"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white shadow-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-rose-600 dark:text-rose-400">
              Sign In
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};

