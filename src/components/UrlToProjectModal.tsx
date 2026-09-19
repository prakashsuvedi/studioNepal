import React, { useState } from 'react';
import {
  X,
  Globe,
  FileText,
  Sparkles,
  Film,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Compass,
  Mic,
  Volume2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Scene, AudioTrack } from '../types';
import { SubtitleItem } from './SubtitleEditorModal';

interface UrlToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProject: (project: {
    id: string;
    title: string;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
    scenes: Scene[];
    subtitles?: SubtitleItem[];
    audioTracks?: AudioTrack[];
    metadata?: Record<string, any>;
  }) => void;
}

const PRESET_ARTICLES = [
  {
    title: 'Artificial Intelligence & Deep Learning',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    category: 'Computer Science & AI',
  },
  {
    title: 'James Webb Space Telescope Discoveries',
    url: 'https://en.wikipedia.org/wiki/James_Webb_Space_Telescope',
    category: 'Space & Astronomy',
  },
  {
    title: 'Swayambhunath Stupa (Monkey Temple)',
    url: 'https://en.wikipedia.org/wiki/Swayambhunath',
    category: 'Cultural Heritage / UNESCO',
  },
  {
    title: 'Mount Everest Expedition & History',
    url: 'https://en.wikipedia.org/wiki/Mount_Everest',
    category: 'Himalayan Geography',
  },
];

const VOICES = [
  { id: 'ava', label: 'Ava (Multilingual Studio Female)' },
  { id: 'andrew', label: 'Andrew (Multilingual Studio Male)' },
  { id: 'hemkala', label: 'Hemkala (Nepali Native Female)' },
  { id: 'sagar', label: 'Sagar (Nepali Native Male)' },
  { id: 'nova', label: 'Nova (gpt-audio Foundry)' },
];

export const UrlToProjectModal: React.FC<UrlToProjectModalProps> = ({
  isOpen,
  onClose,
  onApplyProject,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [targetDuration, setTargetDuration] = useState<number>(25);
  const [language, setLanguage] = useState<'auto' | 'ne' | 'en'>('auto');

  // New Voiceover & Visual Relevance States
  const [generateVoiceover, setGenerateVoiceover] = useState<boolean>(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('ava');
  const [visualMode, setVisualMode] = useState<'ai_gen' | 'article_media' | 'curated_motion'>('ai_gen');

  // Progress states
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    setCreatedProject(null);

    if (activeTab === 'url' && (!urlInput.trim() || !urlInput.startsWith('http'))) {
      setError('Please enter a valid HTTP or HTTPS article or blog URL.');
      return;
    }

    if (activeTab === 'text' && rawTextInput.trim().length < 40) {
      setError('Please provide at least 40 characters of article text.');
      return;
    }

    setIsLoading(true);
    setCurrentStep(activeTab === 'url' ? 'Extracting article facts, key takeaways & rich imagery...' : 'Extracting key takeaways & core insights...');

    try {
      const stepTimer1 = setTimeout(() => {
        setCurrentStep('Directing complete narrative video (Intro Hook → Main Points → Outro)...');
      }, 1400);

      const stepTimer2 = setTimeout(() => {
        setCurrentStep('Generating topic-relevant visuals & photorealistic scene imagery...');
      }, 3500);

      const stepTimer3 = setTimeout(() => {
        setCurrentStep('Synthesizing broadcast AI voiceovers for on-screen main points...');
      }, 6500);

      const response = await fetch('/api/import/url-to-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeTab === 'url' ? urlInput.trim() : undefined,
          rawText: activeTab === 'text' ? rawTextInput.trim() : undefined,
          articleTitle: activeTab === 'text' ? textTitle.trim() : undefined,
          targetDuration,
          aspectRatio,
          language,
          generateVoiceover,
          voiceId: selectedVoiceId,
          visualMode,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to import article to project');
      }

      setCreatedProject(data.project);
      setCurrentStep('Complete video project assembled successfully!');

      // Automatically apply after brief visual confirmation
      setTimeout(() => {
        onApplyProject(data.project);
        onClose();
      }, 1300);
    } catch (err: any) {
      console.error('[UrlToProjectModal] Import failed:', err);
      setError(err.message || 'An unexpected error occurred during URL import.');
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="url-to-project-modal"
        className="relative w-full max-w-2xl bg-[#0d111a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#101624]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Article to Complete Video Studio
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Intro • Visuals • Voiceover • Outro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transforms any web URL or text into a complete, structured video with topic-engineered visuals and voiceover for each main point.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mode Selector Tabs */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('url')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'url'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Article / Web Page URL
            </button>
            <button
              onClick={() => setActiveTab('text')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'text'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Direct Text / Article Copy
            </button>
          </div>

          {/* Tab 1: URL Input */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Web Article / Blog URL (Wikipedia, News, Substack, Medium, etc.)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                  {urlInput && (
                    <button
                      onClick={() => setUrlInput('')}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Examples */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-cyan-400" />
                  Quick Try Sample Topics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_ARTICLES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setUrlInput(preset.url)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                        urlInput === preset.url
                          ? 'border-cyan-500/60 bg-cyan-950/30 text-cyan-200'
                          : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <span className="font-medium truncate">{preset.title}</span>
                      <span className="text-[10px] text-slate-500 mt-1">{preset.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Direct Text Input */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Article Title (Optional)
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="E.g., Quantum Computing Breakthroughs in 2026"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Article Body Text / Key Takeaways
                </label>
                <textarea
                  rows={5}
                  value={rawTextInput}
                  onChange={(e) => setRawTextInput(e.target.value)}
                  placeholder="Paste article paragraphs, findings, or bullet points here..."
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* Complete Video Feature Cards */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-cyan-400" />
                AI Voiceover for Main Points
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateVoiceover}
                  onChange={(e) => setGenerateVoiceover(e.target.checked)}
                  disabled={isLoading}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {generateVoiceover && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Voiceover Voice</label>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Visual Generation Style</label>
                  <select
                    value={visualMode}
                    onChange={(e) => setVisualMode(e.target.value as any)}
                    disabled={isLoading}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ai_gen">AI Photorealistic Visuals (Topic-Engineered)</option>
                    <option value="article_media">Extract Real Web Page Photos & Media</option>
                    <option value="curated_motion">Cinematic Film & Motion Footage</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Video Configuration Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Aspect Ratio */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Aspect Ratio
              </label>
              <div className="flex gap-1.5">
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      aspectRatio === ratio
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Duration & Scenes */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Duration & Scenes
              </label>
              <div className="flex gap-1.5">
                {[
                  { dur: 15, label: '15s (3sc)' },
                  { dur: 25, label: '25s (5sc)' },
                  { dur: 35, label: '35s (7sc)' },
                ].map((item) => (
                  <button
                    key={item.dur}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setTargetDuration(item.dur)}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                      targetDuration === item.dur
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Language
              </label>
              <div className="flex gap-1.5">
                {[
                  { code: 'auto', label: 'Match Article' },
                  { code: 'ne', label: 'नेपाली' },
                  { code: 'en', label: 'English' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setLanguage(item.code as any)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      language === item.code
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Narrative Flow Visual Guide */}
          <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/25 rounded-xl text-xs text-cyan-200/90 space-y-1.5">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              Complete Narrative Video Assembly:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-0.5">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-cyan-400">1. Intro Hook:</span> Welcome, question, topic premise & visual hook.
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-emerald-400">2. Main Points:</span> On-screen headlines, bespoke visual & spoken voiceover.
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-amber-400">3. Outro Ending:</span> Key takeaway, final perspective & closing call-to-action.
              </div>
            </div>
          </div>

          {/* Loading / Status State */}
          {isLoading && (
            <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/40 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span className="text-sm font-medium text-white">{currentStep}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full rounded-full w-3/4 animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Success Preview */}
          {createdProject && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">{createdProject.title}</div>
                  <div className="text-xs text-emerald-300">
                    {createdProject.scenes.length} scenes (Intro + Main Points + Outro) • {createdProject.totalDuration}s duration • {createdProject.audioTracks?.length || 1} audio tracks
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-medium animate-pulse">
                Opening in Studio Timeline...
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-3 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#101624]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-import-url-project"
            type="button"
            onClick={handleImport}
            disabled={isLoading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'text' && !rawTextInput.trim())}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-cyan-500/20 transition-all font-sans"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                Directing Complete Video...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                Generate Complete Video
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
