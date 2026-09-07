import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'header' | 'compact' | 'landing' | 'dropdown';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();
  const languages: AppLanguage[] = ['en', 'ne', 'hi'];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMeta = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'dropdown' || variant === 'header') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer shadow-xs"
          title={`Current Language: ${currentMeta.name}`}
        >
          <span className="text-xs leading-none">{currentMeta.flag}</span>
          <span className="text-[11px] font-semibold">{currentMeta.nativeName}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/60 mb-0.5">
              Select Language
            </div>
            {languages.map((code) => {
              const meta = SUPPORTED_LANGUAGES[code];
              const isSelected = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLanguage(code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none">{meta.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium leading-tight">{meta.nativeName}</span>
                      <span className="text-[9px] text-slate-400">{meta.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Segmented mode for landing or modal pages
  return (
    <div 
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner text-xs ${className}`}
    >
      {languages.map((code) => {
        const meta = SUPPORTED_LANGUAGES[code];
        const isSelected = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
            }`}
            title={`Switch to ${meta.name} (${meta.nativeName})`}
          >
            <span className="text-xs leading-none">{meta.flag}</span>
            <span>{meta.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
};
