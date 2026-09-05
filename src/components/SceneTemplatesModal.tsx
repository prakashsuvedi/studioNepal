import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Sparkles, 
  Plus, 
  Replace, 
  Clock, 
  Film, 
  Tv, 
  Layers, 
  MoveRight,
  Check,
  Tag
} from 'lucide-react';
import { SCENE_TEMPLATES, SceneTemplate, createSceneFromTemplate } from '../lib/sceneTemplates';
import { Scene } from '../types';

export interface SceneTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: '16:9' | '9:16' | '1:1';
  selectedSceneId?: string;
  onAppendScene: (newScene: Scene) => void;
  onInsertAfterScene: (newScene: Scene, afterId: string) => void;
  onReplaceScene: (newScene: Scene, targetId: string) => void;
}

export const SceneTemplatesModal: React.FC<SceneTemplatesModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  selectedSceneId,
  onAppendScene,
  onInsertAfterScene,
  onReplaceScene,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<SceneTemplate | null>(SCENE_TEMPLATES[0]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const categories = useMemo(() => [
    { id: 'All', label: 'All Structures' },
    { id: 'Intro', label: 'Intro Hooks' },
    { id: 'Lower-Thirds', label: 'Lower-Thirds' },
    { id: 'Breaking-News', label: 'News Banners' },
    { id: 'Showcase', label: 'Product Hero' },
    { id: 'Outro', label: 'Outro & CTA' },
    { id: 'Content', label: 'Story & Culture' },
  ], []);

  const filteredTemplates = useMemo(() => {
    return SCENE_TEMPLATES.filter(tmpl => {
      const matchCategory = selectedCategory === 'All' || tmpl.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        tmpl.name.toLowerCase().includes(q) || 
        tmpl.nameNe.toLowerCase().includes(q) ||
        tmpl.description.toLowerCase().includes(q) ||
        tmpl.sampleText.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleApply = (type: 'append' | 'insert_after' | 'replace', tmpl: SceneTemplate) => {
    const newScene = createSceneFromTemplate(tmpl, aspectRatio);
    if (type === 'append') {
      onAppendScene(newScene);
      setActionNotice(`Added "${tmpl.name}" to the end of timeline.`);
    } else if (type === 'insert_after' && selectedSceneId) {
      onInsertAfterScene(newScene, selectedSceneId);
      setActionNotice(`Inserted "${tmpl.name}" after current scene.`);
    } else if (type === 'replace' && selectedSceneId) {
      onReplaceScene(newScene, selectedSceneId);
      setActionNotice(`Replaced current scene with "${tmpl.name}".`);
    } else {
      onAppendScene(newScene);
      setActionNotice(`Added "${tmpl.name}" to timeline.`);
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Scene Structure Templates</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  सिन टेम्प्लेटहरू
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pre-configured video blocks: Intros, Outros, News Banners, Lower-Thirds, & Hooks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates (e.g. news, intro)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notice Banner */}
        {actionNotice && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main 2-Column Content: Templates List (left) + Preview & Action (right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Templates Grid (Col 7) */}
          <div className="md:col-span-7 overflow-y-auto p-6 space-y-3 border-r border-slate-100">
            <div className="grid grid-cols-1 gap-3">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No scene templates match your search criteria.
                </div>
              ) : (
                filteredTemplates.map(tmpl => {
                  const isSelected = previewTemplate?.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setPreviewTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 relative ${
                        isSelected 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                        <img 
                          src={tmpl.previewThumbnail} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-85"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-1 rounded">
                          {tmpl.duration}s
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${tmpl.badgeColor}`}>
                              {tmpl.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {tmpl.motion} • {tmpl.transition}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                            {tmpl.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {tmpl.description}
                          </p>
                        </div>

                        <div className="text-[10px] text-indigo-700 font-medium truncate pt-1">
                          {tmpl.nameNe}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Detailed Inspector & Direct Apply Actions (Col 5) */}
          <div className="md:col-span-5 bg-slate-50/50 p-6 flex flex-col justify-between overflow-y-auto">
            {previewTemplate ? (
              <div className="space-y-4">
                {/* Visual Preview Box */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-slate-200">
                  <img 
                    src={previewTemplate.previewThumbnail} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  
                  {/* Simulated Text Overlay */}
                  <div className={`absolute inset-x-3 pointer-events-none text-center ${
                    previewTemplate.textPosition === 'top' ? 'top-3' :
                    previewTemplate.textPosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                    previewTemplate.textPosition === 'lower_third' ? 'bottom-2 text-left bg-slate-900/80 p-2 rounded' : 'bottom-3'
                  }`}>
                    <p className="text-white text-xs font-bold drop-shadow-md">
                      {previewTemplate.sampleText}
                    </p>
                    {previewTemplate.sampleTextNe && (
                      <p className="text-amber-300 text-[10px] font-medium drop-shadow-md">
                        {previewTemplate.sampleTextNe}
                      </p>
                    )}
                  </div>

                  <span className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {previewTemplate.badge}
                  </span>
                </div>

                {/* Template Specs */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {previewTemplate.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {previewTemplate.description}
                  </p>
                  <p className="text-xs text-indigo-700 font-medium">
                    {previewTemplate.descriptionNe}
                  </p>
                </div>

                {/* Technical Meta Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-2 shadow-2xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Duration:</span>
                      <span className="font-semibold text-slate-800">{previewTemplate.duration} seconds</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Camera Motion:</span>
                      <span className="font-semibold text-slate-800 uppercase">{previewTemplate.motion}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Transition:</span>
                      <span className="font-semibold text-slate-800 uppercase">{previewTemplate.transition}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Color Filter:</span>
                      <span className="font-semibold text-slate-800 uppercase">{previewTemplate.filter}</span>
                    </div>
                  </div>
                </div>

                {/* Prompt Blueprint */}
                <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Prompt Blueprint:</span>
                  <p className="text-[11px] text-slate-700 italic">
                    "{previewTemplate.samplePrompt}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a template to view details
              </div>
            )}

            {/* Action Buttons */}
            {previewTemplate && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => handleApply('append', previewTemplate)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add as New Scene (+ Append)</span>
                </button>

                {selectedSceneId && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApply('insert_after', previewTemplate)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <MoveRight className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Insert After</span>
                    </button>
                    <button
                      onClick={() => handleApply('replace', previewTemplate)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Replace className="w-3.5 h-3.5 text-rose-600" />
                      <span>Replace Current</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
