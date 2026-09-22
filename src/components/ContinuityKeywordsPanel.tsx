import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Tag, 
  Check, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  Sun, 
  Camera, 
  Shirt, 
  Eye, 
  Layers, 
  Palette, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Sliders,
  Copy,
  Info
} from 'lucide-react';
import { 
  ContinuityKeyword, 
  SequentialSceneNode, 
  DynamicCharacterIdentity,
  extractContinuityKeywordsFromScene,
  formatContinuityKeywordsPrefix,
  applyContinuityKeywordsToSequence
} from '../services/characterContinuityEngine';

interface ContinuityKeywordsPanelProps {
  scenes: SequentialSceneNode[];
  characters: DynamicCharacterIdentity[];
  worldTheme?: string;
  visualStyle?: string;
  onApplyKeywords: (keywords: ContinuityKeyword[], updatedScenes: SequentialSceneNode[]) => void;
  initialKeywords?: ContinuityKeyword[];
  initialEnabled?: boolean;
}

export const ContinuityKeywordsPanel: React.FC<ContinuityKeywordsPanelProps> = ({
  scenes = [],
  characters = [],
  worldTheme = 'Himalayan Cinematic Realism',
  visualStyle = 'Photorealistic 4k 35mm',
  onApplyKeywords,
  initialKeywords,
  initialEnabled = true
}) => {
  const [keywords, setKeywords] = useState<ContinuityKeyword[]>(() => {
    if (initialKeywords && initialKeywords.length > 0) return initialKeywords;
    return extractContinuityKeywordsFromScene({
      scene1: scenes[0],
      characters,
      worldTheme,
      visualStyle
    });
  });

  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ContinuityKeyword['category']>('lighting');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Auto extract on first mount if empty
  useEffect(() => {
    if (keywords.length === 0 && scenes.length > 0) {
      const extracted = extractContinuityKeywordsFromScene({
        scene1: scenes[0],
        characters,
        worldTheme,
        visualStyle
      });
      setKeywords(extracted);
    }
  }, [scenes, characters, worldTheme, visualStyle]);

  const handleToggleKeyword = (id: string) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k));
  };

  const handleDeleteKeyword = (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const handleAddCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newKeywordInput.trim();
    if (!clean) return;

    const newKw: ContinuityKeyword = {
      id: `kw-custom-${Date.now()}`,
      keyword: clean,
      category: newCategory,
      source: 'custom',
      enabled: true,
      confidence: 1.0
    };

    setKeywords(prev => [...prev, newKw]);
    setNewKeywordInput('');
  };

  const handleAutoReExtract = () => {
    const fresh = extractContinuityKeywordsFromScene({
      scene1: scenes[0],
      characters,
      worldTheme,
      visualStyle
    });
    setKeywords(fresh);
    setAppliedToast(`✨ Extracted ${fresh.length} prioritized continuity keywords from Scene 1 & Character DNA!`);
    setTimeout(() => setAppliedToast(null), 3500);
  };

  const handleApplyToSequence = () => {
    const activeKws = isEnabled ? keywords : [];
    const updatedScenes = applyContinuityKeywordsToSequence({
      scenes,
      keywords: activeKws,
      projectRegistry: characters
    });

    onApplyKeywords(keywords, updatedScenes);
    const activeCount = keywords.filter(k => k.enabled).length;
    setAppliedToast(`🚀 Applied ${activeCount} Continuity Keywords to all subsequent scenes (Scene 2+)!`);
    setTimeout(() => setAppliedToast(null), 4000);
  };

  const constructedPrefix = isEnabled ? formatContinuityKeywordsPrefix(keywords) : '';

  const handleCopyToken = () => {
    if (!constructedPrefix) return;
    navigator.clipboard.writeText(constructedPrefix);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const categoryIcons: Record<ContinuityKeyword['category'], React.ReactNode> = {
    lighting: <Sun className="w-3 h-3 text-amber-400" />,
    optics: <Camera className="w-3 h-3 text-cyan-400" />,
    wardrobe: <Shirt className="w-3 h-3 text-indigo-400" />,
    facial: <Eye className="w-3 h-3 text-emerald-400" />,
    environment: <Layers className="w-3 h-3 text-purple-400" />,
    style: <Palette className="w-3 h-3 text-pink-400" />
  };

  const categoryLabels: Record<ContinuityKeyword['category'], string> = {
    lighting: 'Lighting & Atmosphere',
    optics: 'Optics & Film Grain',
    wardrobe: 'Wardrobe & Attire',
    facial: 'Facial & Hair DNA',
    environment: 'Environment Textures',
    style: 'Master Visual Style'
  };

  const groupedCategories = (['lighting', 'optics', 'wardrobe', 'facial', 'environment', 'style'] as const).filter(
    cat => keywords.some(k => k.category === cat)
  );

  return (
    <div className="space-y-4">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Automated Continuity Keywords Engine</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              Scene 1 DNA Lock
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automatically suggests and prepends visual descriptors (lighting, 35mm lens, wardrobe, facial DNA) from Scene 1 to all subsequent scenes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Re-Extract Button */}
          <button
            type="button"
            onClick={handleAutoReExtract}
            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700"
            title="Re-analyze Scene 1 user prompt & character DNA"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Auto-Extract from Scene 1</span>
          </button>
        </div>
      </div>

      {/* Applied Toast Alert */}
      {appliedToast && (
        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{appliedToast}</span>
        </div>
      )}

      {/* Master Enable/Disable & Live Injection Preview Bar */}
      <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEnabled(e => !e)}
              className={`text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                isEnabled
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {isEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Prepend Keywords to Scenes 2+: {isEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              ({keywords.filter(k => k.enabled).length} of {keywords.length} active tags)
            </span>
          </div>

          <button
            type="button"
            onClick={handleApplyToSequence}
            className="text-[11px] px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply to Sequence Prompts</span>
          </button>
        </div>

        {/* Live Constructed Prefix Token Preview */}
        {isEnabled && constructedPrefix && (
          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-500/30 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Active Prefix Token Prepend (Injected into Scene 2, Scene 3, ...):</span>
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
              >
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
              </button>
            </div>
            <p className="text-[10.5px] font-mono text-amber-100 bg-slate-950 p-2 rounded border border-slate-800 break-all leading-relaxed">
              {constructedPrefix}
            </p>
          </div>
        )}
      </div>

      {/* Categorized Keyword Pools */}
      <div className="space-y-3">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
          Categorized Continuity Anchors ({keywords.length} Discovered)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groupedCategories.map(cat => {
            const catKeywords = keywords.filter(k => k.category === cat);
            return (
              <div 
                key={cat}
                className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    {categoryIcons[cat]}
                    <span className="text-xs font-bold text-white">{categoryLabels[cat]}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {catKeywords.filter(k => k.enabled).length}/{catKeywords.length} Active
                  </span>
                </div>

                {/* Keyword Pills List */}
                <div className="space-y-1.5">
                  {catKeywords.map(kw => (
                    <div
                      key={kw.id}
                      onClick={() => handleToggleKeyword(kw.id)}
                      className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        kw.enabled
                          ? 'bg-slate-900/90 border-amber-500/40 text-slate-100'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                          kw.enabled ? 'bg-amber-600 border-amber-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {kw.enabled && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate font-medium text-[11px]">{kw.keyword}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 font-mono border border-slate-800">
                          {Math.round(kw.confidence * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteKeyword(kw.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-0.5 transition cursor-pointer"
                          title="Remove keyword"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Continuity Keyword Form */}
      <form onSubmit={handleAddCustomKeyword} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
        <label className="text-[11px] font-bold text-slate-300 block flex items-center gap-1">
          <Plus className="w-3 h-3 text-indigo-400" />
          <span>Add Custom Continuity Keyword / Visual Anchor</span>
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="w-full sm:w-44 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="lighting">Lighting &amp; Atmosphere</option>
            <option value="optics">Optics &amp; Grain</option>
            <option value="wardrobe">Wardrobe &amp; Attire</option>
            <option value="facial">Facial &amp; Hair</option>
            <option value="environment">Environment Textures</option>
            <option value="style">Master Style</option>
          </select>

          <input
            type="text"
            value={newKeywordInput}
            onChange={(e) => setNewKeywordInput(e.target.value)}
            placeholder="e.g. Amber sunset rim light, 35mm shallow depth of field, red silk scarf..."
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </div>
      </form>

      {/* Educational Notice */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-[10.5px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>How Sora-2 Continuity Keywords Work:</strong> When enabled, the selected keywords are compiled into a unified token <code className="text-amber-300 font-mono">[Visual-Continuity-Lock: ...]</code> that is prepended to every subsequent prompt (Scene 2, Scene 3, etc.). This forces Sora-2 to lock camera optical profiles, lighting temperatures, and wardrobe textures consistently across scene transitions.
        </p>
      </div>

    </div>
  );
};
