import React, { useState } from 'react';
import { 
  X, 
  Film, 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  Sparkles, 
  Check, 
  FolderPlus,
  Video,
  Layers,
  Trash2
} from 'lucide-react';
import { Scene } from '../types';

interface MediaItem {
  id: string;
  type: 'upload' | 'ai_image' | 'sora_video';
  title: string;
  url: string;
  duration: number;
  category: string;
}

interface GlobalMediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSceneToTimeline: (scene: Scene) => void;
}

const INITIAL_MEDIA_LIBRARY: MediaItem[] = [
  {
    id: 'media-1',
    type: 'sora_video',
    title: 'Cinematic Everest Drone Flyover',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 6,
    category: 'Sora AI Video'
  },
  {
    id: 'media-2',
    type: 'sora_video',
    title: 'Kathmandu Durbar Square Timelapse',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 5,
    category: 'Sora AI Video'
  },
  {
    id: 'media-3',
    type: 'ai_image',
    title: 'Himalayan Sunrise Peak Render',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    duration: 4,
    category: 'AI Image'
  },
  {
    id: 'media-4',
    type: 'ai_image',
    title: 'Traditional Nepali Pashmina Weaving',
    url: 'https://images.unsplash.com/photo-1590736963159-c3d40fd7df93?q=80&w=1200&auto=format&fit=crop',
    duration: 4,
    category: 'AI Image'
  },
  {
    id: 'media-5',
    type: 'upload',
    title: 'Brand Logo Watermark PNG',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    duration: 3,
    category: 'Uploads'
  }
];

export const GlobalMediaLibraryModal: React.FC<GlobalMediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddSceneToTimeline,
}) => {
  const [items, setItems] = useState<MediaItem[]>(INITIAL_MEDIA_LIBRARY);
  const [activeTab, setActiveTab] = useState<'all' | 'sora_video' | 'ai_image' | 'upload'>('all');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(i => i.type === activeTab);

  const handleAddMedia = (item: MediaItem) => {
    const newScene: Scene = {
      id: 'scene-' + Math.random().toString(36).substring(2, 9),
      title: item.title,
      duration: item.duration,
      prompt: item.title,
      mediaUrl: item.url,
      mediaType: item.type === 'sora_video' ? 'video' : 'image',
      aspectRatio: '16:9',
      motion: 'zoom_in',
      transition: 'dissolve',
      transitionDuration: 0.8,
      textOverlay: item.title,
      textPosition: 'bottom',
      textColor: '#ffffff',
      textFont: 'sans',
      filter: 'cinematic',
      volume: 80,
      colorTag: item.type === 'sora_video' ? 'ai_gen' : item.type === 'ai_image' ? 'a_roll' : 'b_roll',
    };

    onAddSceneToTimeline(newScene);
    setSuccessNotice(`Added "${item.title}" to timeline!`);
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const newItem: MediaItem = {
      id: 'media-' + Math.random().toString(36).substring(2, 9),
      type: 'upload',
      title: file.name.replace(/\.[^/.]+$/, ''),
      url,
      duration: 5,
      category: 'User Uploads'
    };

    setItems(prev => [newItem, ...prev]);
    setSuccessNotice(`Successfully uploaded "${newItem.title}"!`);
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Global Media Library</h2>
              <p className="text-xs text-slate-400">Manage uploaded assets, AI images, and Sora video clips. Click or drag to add to timeline.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Asset</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
            </label>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {successNotice && (
          <div className="bg-emerald-900/60 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-200 font-medium flex items-center justify-between animate-fadeIn">
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-2 bg-slate-950">
          {[
            { id: 'all', label: 'All Assets', count: items.length },
            { id: 'sora_video', label: 'Sora AI Video Clips', count: items.filter(i => i.type === 'sora_video').length },
            { id: 'ai_image', label: 'Generated AI Images', count: items.filter(i => i.type === 'ai_image').length },
            { id: 'upload', label: 'Uploaded Files', count: items.filter(i => i.type === 'upload').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Grid Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/60 transition group flex flex-col justify-between shadow-md"
              >
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                      item.type === 'sora_video' ? 'bg-indigo-600 text-white' :
                      item.type === 'ai_image' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-mono text-white">
                      {item.duration}s
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-2.5">
                  <h4 className="text-xs font-bold text-white truncate" title={item.title}>{item.title}</h4>
                  
                  <button
                    onClick={() => handleAddMedia(item)}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold border border-indigo-500/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Timeline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Click "Add to Timeline" to append any media item as a new scene.</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
