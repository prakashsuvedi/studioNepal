import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Bookmark, 
  Plus, 
  Trash2, 
  PlusCircle, 
  Check, 
  X as XIcon, 
  Sparkles, 
  Tag, 
  Layers, 
  Copy, 
  Search,
  ArrowRight
} from 'lucide-react';
import { Scene, SavedSceneTemplate } from '../types';

export interface SceneLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSceneToSave?: Scene | null;
  onInsertSceneFromLibrary: (sceneData: Omit<Scene, 'id'>) => void;
  onReplaceSelectedScene?: (sceneData: Omit<Scene, 'id'>) => void;
}

export const STARTER_SCENE_TEMPLATES: SavedSceneTemplate[] = [
  {
    id: 'tpl_cinematic_intro',
    name: 'Himalayan Sunrise Cinematic Hook',
    category: 'Hooks & Intros',
    savedAt: new Date().toISOString(),
    sceneData: {
      title: 'Himalayan Sunrise Hook',
      duration: 4,
      prompt: 'Ultra-cinematic golden hour sunrise over Mount Everest, high resolution 8k, majestic camera zoom in',
      mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      aspectRatio: '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      transitionDuration: 1.0,
      textOverlay: 'EXPLORE NEPAL WITH AI',
      textPosition: 'center',
      textColor: '#FFFFFF',
      textFont: 'sans',
      filter: 'cinematic',
      volume: 80,
      colorTag: 'a_roll',
      tags: ['Intro', 'Cinematic', 'Hook'],
      notes: 'Standard 4-second introductory hook with slow push-in motion.',
    }
  },
  {
    id: 'tpl_devanagari_lowerthird',
    name: 'Devanagari Cultural Lower Third',
    category: 'Devanagari Subtitles',
    savedAt: new Date().toISOString(),
    sceneData: {
      title: 'Kathmandu Cultural View',
      duration: 5,
      prompt: 'Patan Durbar Square intricate wood carvings, ancient pagoda temple background in warm afternoon glow',
      mediaUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      aspectRatio: '16:9',
      motion: 'pan_right',
      transition: 'wipe_right',
      transitionDuration: 0.8,
      textOverlay: 'पाटन दरबार क्षेत्र - सम्पदा',
      textPosition: 'lower_third',
      textColor: '#FBBF24',
      textFont: 'devanagari',
      filter: 'warm',
      volume: 90,
      colorTag: 'bramhanand',
      tags: ['Culture', 'Devanagari', 'Heritage'],
      notes: 'Bilingual cultural scene with gold typography and smooth pan right.',
    }
  },
  {
    id: 'tpl_broll_nature',
    name: 'Pokhara Lakeside B-Roll',
    category: 'B-Roll Scenes',
    savedAt: new Date().toISOString(),
    sceneData: {
      title: 'Fewa Lake Reflections',
      duration: 3.5,
      prompt: 'Tranquil Fewa Lake in Pokhara with colorful wooden boats reflection of Annapurna range',
      mediaUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      aspectRatio: '16:9',
      motion: 'dolly',
      transition: 'fade',
      transitionDuration: 0.8,
      textOverlay: 'Pokhara Valley',
      textPosition: 'bottom',
      textColor: '#FFFFFF',
      textFont: 'sans',
      filter: 'vibrant',
      volume: 75,
      colorTag: 'b_roll',
      tags: ['B-Roll', 'Nature', 'Lakeside'],
      notes: 'Serene water reflections with gentle camera movement.',
    }
  },
  {
    id: 'tpl_social_outro',
    name: 'YouTube Call To Action Outro',
    category: 'Outros & Call-to-Actions',
    savedAt: new Date().toISOString(),
    sceneData: {
      title: 'Subscribe & Follow Outro',
      duration: 4,
      prompt: 'Modern cyber neon particle background with gold accent sparkles and dramatic contrast',
      mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      mediaType: 'image',
      aspectRatio: '16:9',
      motion: 'zoom_out',
      transition: 'flash_white',
      transitionDuration: 0.6,
      textOverlay: 'LIKE & SUBSCRIBE FOR MORE AI CONTENT!',
      textPosition: 'center',
      textColor: '#10B981',
      textFont: 'mono',
      filter: 'cinematic',
      volume: 100,
      colorTag: 'custom',
      tags: ['Outro', 'CTA', 'Subscribe'],
      notes: 'End screen template with high-contrast text overlay.',
    }
  }
];

export const SceneLibraryModal: React.FC<SceneLibraryModalProps> = ({
  isOpen,
  onClose,
  currentSceneToSave,
  onInsertSceneFromLibrary,
  onReplaceSelectedScene,
}) => {
  const [library, setLibrary] = useState<SavedSceneTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('nepalai_scene_library_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading scene library from local storage:', e);
    }
    return STARTER_SCENE_TEMPLATES;
  });

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSaveCurrentForm, setShowSaveCurrentForm] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<string>('Custom Templates');

  useEffect(() => {
    try {
      localStorage.setItem('nepalai_scene_library_v1', JSON.stringify(library));
    } catch (e) {
      console.error('Error persisting scene library:', e);
    }
  }, [library]);

  if (!isOpen) return null;

  const categories = ['All', 'Hooks & Intros', 'B-Roll Scenes', 'Devanagari Subtitles', 'Outros & Call-to-Actions', 'Custom Templates'];

  const filteredLibrary = library.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sceneData.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sceneData.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleSaveCurrentScene = () => {
    if (!currentSceneToSave) return;
    const { id, ...sceneWithoutId } = currentSceneToSave;

    const newTpl: SavedSceneTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: newTemplateName || currentSceneToSave.title || 'Saved Scene Template',
      category: newTemplateCategory || 'Custom Templates',
      savedAt: new Date().toISOString(),
      sceneData: sceneWithoutId,
    };

    setLibrary(prev => [newTpl, ...prev]);
    setShowSaveCurrentForm(false);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (tplId: string) => {
    setLibrary(prev => prev.filter(t => t.id !== tplId));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-teal-800/80 rounded-2xl max-w-4xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-400">
              <FolderPlus className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Reusable Scene Template Library</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] uppercase font-bold">
                  {library.length} Saved Templates
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Save, categorize, and insert pre-configured scene templates with transition settings, filters, and text overlays across projects.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-slate-800">

          {/* Save Active Scene Header Bar */}
          {currentSceneToSave && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-white">
                    Save Active Selected Scene ("{currentSceneToSave.title}") to Library
                  </span>
                </div>

                <button
                  onClick={() => setShowSaveCurrentForm(prev => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white border border-teal-500/40 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showSaveCurrentForm ? 'Close Form' : 'Save Active Scene as Template'}</span>
                </button>
              </div>

              {showSaveCurrentForm && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-400 font-semibold">Template Title</label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder={currentSceneToSave.title || 'My Custom Scene Preset'}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Category Tag</label>
                    <select
                      value={newTemplateCategory}
                      onChange={(e) => setNewTemplateCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      onClick={handleSaveCurrentScene}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Add to Scene Library</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search & Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeCategory === cat
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Library Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredLibrary.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-teal-500/50 transition-all space-y-3 group shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 rounded-lg bg-slate-900 overflow-hidden relative shrink-0 border border-slate-800">
                    <img
                      src={tpl.sceneData.mediaUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-teal-300">
                      {tpl.sceneData.duration}s
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate">{tpl.name}</h4>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 transition"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/40 font-semibold">
                        {tpl.category}
                      </span>
                      <span className="text-slate-500 uppercase font-mono">
                        {tpl.sceneData.transition || 'cut'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                      "{tpl.sceneData.prompt}"
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                  {onReplaceSelectedScene && (
                    <button
                      onClick={() => {
                        onReplaceSelectedScene(tpl.sceneData);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                    >
                      Replace Selected
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onInsertSceneFromLibrary(tpl.sceneData);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Insert into Timeline</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredLibrary.length === 0 && (
              <div className="sm:col-span-2 p-10 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No matching scene templates found in library.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Templates are persisted in local workspace storage.
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
};
