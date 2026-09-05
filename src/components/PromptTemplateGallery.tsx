import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  BookOpen,
  TrendingUp,
  GraduationCap,
  Clapperboard,
  Scale,
  Code2,
  Share2,
  Languages,
  Filter,
  X,
  Bot
} from 'lucide-react';
import { HamroAiModel, HamroAiLanguage, HamroPromptTemplate } from '../types';
import { HAMRO_PROMPT_TEMPLATES } from '../lib/promptTemplates';

export interface PromptTemplateGalleryProps {
  onSelectPrompt: (prompt: string, suggestedModel?: HamroAiModel, suggestedLanguage?: HamroAiLanguage) => void;
  onClose?: () => void;
  className?: string;
  isEmbedded?: boolean;
}

export const PromptTemplateGallery: React.FC<PromptTemplateGalleryProps> = ({
  onSelectPrompt,
  onClose,
  className = '',
  isEmbedded = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'ne' | 'hi' | 'en'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // High-level subjects mapping
  const subjectCategories = useMemo(() => [
    { id: 'All', label: 'All Subjects', labelNe: 'सबै विषयहरू', icon: BookOpen },
    { id: 'Marketing', label: 'Marketing & Ads', labelNe: 'मार्केटिङ र विज्ञापन', icon: TrendingUp },
    { id: 'Education', label: 'Education & Study', labelNe: 'शिक्षा र अध्ययन', icon: GraduationCap },
    { id: 'Storytelling', label: 'Storytelling & Cinema', labelNe: 'कथा र चलचित्र स्क्रिप्ट', icon: Clapperboard },
    { id: 'Legal', label: 'Nepali Law & Govt', labelNe: 'नेपाली कानून र सरकारी निवेदन', icon: Scale },
    { id: 'Tech', label: 'Coding & Tech', labelNe: 'कोडिङ र प्रविधि', icon: Code2 },
    { id: 'Social', label: 'Social Media', labelNe: 'सामाजिक सञ्जाल', icon: Share2 },
    { id: 'Translation', label: 'Translation', labelNe: 'अनुवाद र रूपान्तरण', icon: Languages },
  ], []);

  // Map internal template categories to primary subjects
  const mapCategoryToSubject = (category: string): string => {
    switch (category) {
      case 'Business & Marketing':
        return 'Marketing';
      case 'Education & Academic':
        return 'Education';
      case 'Creative & Scriptwriting':
        return 'Storytelling';
      case 'Nepali Law & Govt':
        return 'Legal';
      case 'Coding & Tech':
        return 'Tech';
      case 'Social Media':
        return 'Social';
      case 'Translation':
        return 'Translation';
      case 'Content Writing':
      default:
        return 'Marketing';
    }
  };

  const filteredTemplates = useMemo(() => {
    return HAMRO_PROMPT_TEMPLATES.filter((tmpl) => {
      const subject = mapCategoryToSubject(tmpl.category);
      const matchesSubject = selectedSubject === 'All' || subject === selectedSubject;

      const matchesLang =
        selectedLanguage === 'all' ||
        tmpl.language === 'all' ||
        tmpl.language === selectedLanguage;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tmpl.title.toLowerCase().includes(q) ||
        (tmpl.titleNe && tmpl.titleNe.toLowerCase().includes(q)) ||
        (tmpl.titleHi && tmpl.titleHi.toLowerCase().includes(q)) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.prompt.toLowerCase().includes(q) ||
        tmpl.category.toLowerCase().includes(q);

      return matchesSubject && matchesLang && matchesSearch;
    });
  }, [searchQuery, selectedSubject, selectedLanguage]);

  const handleCopy = (e: React.MouseEvent, prompt: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (tmpl: HamroPromptTemplate) => {
    const lang: HamroAiLanguage = tmpl.language === 'hi' ? 'hi' : tmpl.language === 'ne' ? 'ne' : 'ne';
    const model: HamroAiModel = tmpl.category === 'Coding & Tech' ? 'gpt-5-mini' : 'gpt-4o';
    onSelectPrompt(tmpl.prompt, model, lang);
    if (onClose) onClose();
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-100 ${className}`}>
      {/* Header Bar */}
      <div className="p-4 md:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Prompt Template Gallery
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {filteredTemplates.length} Presets
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Curated intelligence templates for Nepali, Hindi & Global productivity
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 space-y-3">
        {/* Search Input & Language Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates (e.g., निवेदन, marketing, reels, python, translation)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs md:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Language Toggle Pills */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedLanguage === 'all'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedLanguage('ne')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                selectedLanguage === 'ne'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🇳🇵 Nepali
            </button>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                selectedLanguage === 'hi'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🇮🇳 Hindi
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                selectedLanguage === 'en'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌐 English
            </button>
          </div>
        </div>

        {/* Subject Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {subjectCategories.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition cursor-pointer font-medium ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white font-semibold shadow-md'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredTemplates.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">कुनै प्रम्प्ट टेम्प्लेट फेला परेन</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              तपाईंको खोजी शब्द वा फिल्टरसँग मिल्ने कुनै टेम्प्लेट भेटिएन। कृपया फरक शब्द प्रयोग गर्नुहोस्।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
                setSelectedLanguage('all');
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((tmpl) => {
              const isCopied = copiedId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleApply(tmpl)}
                  className="rounded-2xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/90 hover:border-amber-500/50 p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="space-y-2.5">
                    {/* Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700/60">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                        {tmpl.language === 'ne'
                          ? '🇳🇵 Nepali'
                          : tmpl.language === 'hi'
                          ? '🇮🇳 Hindi'
                          : '🌐 Global'}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                        {tmpl.titleNe || tmpl.titleHi || tmpl.title}
                      </h3>
                      {tmpl.titleNe && tmpl.title !== tmpl.titleNe && (
                        <p className="text-[11px] text-zinc-400 font-medium line-clamp-1 mt-0.5">
                          {tmpl.title}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {tmpl.description}
                    </p>

                    {/* Prompt Preview Snippet */}
                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 line-clamp-3 leading-relaxed">
                      {tmpl.prompt}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleCopy(e, tmpl.prompt, tmpl.id)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800 transition"
                      title="Copy raw prompt text"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleApply(tmpl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 group-hover:from-amber-600 group-hover:to-red-700 text-white font-bold text-xs shadow transition active:scale-95"
                    >
                      <span>Use in HamroAI</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
