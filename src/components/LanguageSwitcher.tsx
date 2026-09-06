import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES, AppLanguage } from '../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'floating' | 'header' | 'compact';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, langMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: AppLanguage[] = ['ne', 'hi', 'en'];

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold ${className}`}>
        {languages.map((code) => {
          const meta = SUPPORTED_LANGUAGES[code];
          const isSelected = language === code;
          return (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={`${meta.name} (${meta.nativeName})`}
            >
              <span>{meta.flag}</span>
              <span className="text-[11px]">{meta.shortCode}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs group"
        title="Change Platform Language (भाषा चयन)"
        aria-label="Language selector"
      >
        <span className="text-sm leading-none">{langMeta.flag}</span>
        <span className="font-semibold text-[11px] tracking-tight text-slate-800 dark:text-slate-200">
          {langMeta.nativeName}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-slate-600'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              भाषा / Language
            </span>
            <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">Persists across tools</span>
          </div>

          <div className="py-1">
            {languages.map((code) => {
              const meta = SUPPORTED_LANGUAGES[code];
              const isSelected = language === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{meta.flag}</span>
                    <div>
                      <div className="font-medium text-[12px] leading-tight">{meta.nativeName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{meta.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 pt-1.5 pb-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
            Auto-translates HamroAI, Voiceover & Studio tools
          </div>
        </div>
      )}
    </div>
  );
};
