import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../context/LanguageContext';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'compact' | 'landing';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();
  const languages: AppLanguage[] = ['en', 'ne', 'hi'];

  if (variant === 'compact' || variant === 'landing') {
    return (
      <div 
        role="group"
        aria-label="Language selection"
        className={`inline-flex items-center rounded-xl bg-slate-900/95 p-1 border border-slate-800 shadow-inner text-xs ${className}`}
      >
        {languages.map((code) => {
          const meta = SUPPORTED_LANGUAGES[code];
          const isSelected = language === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
              }`}
              title={`Switch to ${meta.name} (${meta.nativeName})`}
            >
              <span className="text-sm leading-none">{meta.flag}</span>
              <span className="text-xs">{meta.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Header Segmented Switcher (Visible and responsive across all screens)
  return (
    <div 
      role="group"
      aria-label="Header language selection"
      className={`inline-flex items-center rounded-xl bg-slate-900/90 p-0.5 border border-slate-800 shadow-inner text-xs ${className}`}
    >
      {languages.map((code) => {
        const meta = SUPPORTED_LANGUAGES[code];
        const isSelected = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
            }`}
            title={`Switch to ${meta.name} (${meta.nativeName})`}
          >
            <span className="text-xs leading-none">{meta.flag}</span>
            <span className="hidden sm:inline">{meta.nativeName}</span>
            <span className="sm:hidden font-bold">{meta.shortCode}</span>
          </button>
        );
      })}
    </div>
  );
};

