import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Film, 
  Image as ImageIcon, 
  Upload, 
  Plus, 
  Sparkles, 
  Check, 
  Video, 
  Layers, 
  Trash2, 
  Play, 
  Pause, 
  Search, 
  Eye, 
  Clock, 
  Tag, 
  Maximize2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Scene } from '../types';
import { MediaItem, getMediaLibrary, saveMediaItem, removeMediaItem } from '../lib/mediaLibrary';

interface GlobalMediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSceneToTimeline: (scene: Scene) => void;
}

export const GlobalMediaLibraryModal: React.FC<GlobalMediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddSceneToTimeline,
}) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'sora_video' | 'ai_image' | 'upload'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

  // Sync media items from centralized storage whenever modal opens or storage updates
  const refreshLibrary = () => {
    const loaded = getMediaLibrary();
    setItems(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshLibrary();
    };
    window.addEventListener('nepalai_media_library_updated', handleStorageUpdate);
    return () => window.removeEventListener('nepalai_media_library_updated', handleStorageUpdate);
  }, []);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.prompt && item.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddMedia = (item: MediaItem) => {
    const isVideo = item.type === 'sora_video' || item.url.includes('.mp4') || item.url.includes('.webm') || item.url.includes('video');
    const validAspectRatio = (item.aspectRatio === '9:16' || item.aspectRatio === '1:1') ? item.aspectRatio : '16:9';
    const newScene: Scene = {
      id: 'scene-' + Math.random().toString(36).substring(2, 9),
      title: item.title,
      duration: item.duration || (isVideo ? 5 : 4),
      prompt: item.prompt || item.title,
      promptNepali: item.title,
      mediaUrl: item.url,
      thumbnailUrl: item.thumbnailUrl || (item.url.endsWith('.mp4') ? item.url.replace(/\.mp4$/, '_thumb.jpg') : undefined),
      mediaType: isVideo ? 'video' : 'image',
      aspectRatio: validAspectRatio,
      motion: isVideo ? 'static' : 'zoom_in',
      transition: 'dissolve',
      transitionDuration: 0.8,
      textOverlay: item.title.slice(0, 32),
      textNepali: item.title.slice(0, 32),
      textPosition: 'bottom',
      textColor: '#ffffff',
      textFont: 'sans',
      filter: 'cinematic',
      volume: 80,
      colorTag: isVideo ? 'ai_gen' : item.type === 'ai_image' ? 'a_roll' : 'b_roll',
    };

    onAddSceneToTimeline(newScene);
    setSuccessNotice(`Added "${item.title}" to video timeline!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeMediaItem(id);
    setItems(updated);
    if (previewItem?.id === id) {
      setPreviewItem(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const url = URL.createObjectURL(file);
    
    const saved = saveMediaItem({
      type: 'upload',
      title: file.name.replace(/\.[^/.]+$/, ''),
      url,
      duration: isVideo ? 6 : 4,
      category: isVideo ? 'User Video' : 'User Image',
      aspectRatio: '16:9',
      prompt: `Uploaded file: ${file.name}`
    });

    setItems(prev => [saved, ...prev]);
    setSuccessNotice(`Successfully uploaded "${saved.title}"! Click "+ Add to Timeline" to use it.`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  const soraCount = items.filter(i => i.type === 'sora_video').length;
  const imageCount = items.filter(i => i.type === 'ai_image').length;
  const uploadCount = items.filter(i => i.type === 'upload').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Global Media Library</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {items.length} Assets Available
                </span>
              </div>
              <p className="text-xs text-slate-400">All your generated AI images, Sora-2 videos, and uploaded clips ready for timeline assembly.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <label className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Media</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
            </label>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              title="Close Media Library"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Notice Bar */}
        {successNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-200 font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </span>
          </div>
        )}

        {/* Controls Toolbar: Tabs & Search */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Assets', icon: FolderOpen, count: items.length },
              { id: 'sora_video', label: 'Sora AI Videos', icon: Video, count: soraCount },
              { id: 'ai_image', label: 'Generated AI Images', icon: ImageIcon, count: imageCount },
              { id: 'upload', label: 'Uploaded Files', icon: Upload, count: uploadCount },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, titles..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Media Grid Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Film className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No media found matching your filter.</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Generate images in Image Studio, Sora videos in Video Studio, or click "Upload Media" above to add clips.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const isVideo = item.type === 'sora_video' || item.url.includes('.mp4') || item.url.includes('.webm') || item.url.includes('video');
                const isHovered = hoveredVideoId === item.id;

                return (
                  <div 
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500/70 rounded-xl overflow-hidden transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
                    onMouseEnter={() => isVideo && setHoveredVideoId(item.id)}
                    onMouseLeave={() => isVideo && setHoveredVideoId(null)}
                  >
                    {/* Media Preview Container */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewItem(item)}
                    >
                      {isVideo ? (
                        <div className="w-full h-full relative">
                          <video 
                            src={item.url}
                            poster={item.thumbnailUrl}
                            muted
                            loop
                            playsInline
                            autoPlay={isHovered}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {!isHovered && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition">
                              <div className="w-9 h-9 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                                <Play className="w-4 h-4 ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
                          item.type === 'sora_video' ? 'bg-indigo-600 text-white' :
                          item.type === 'ai_image' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {item.category}
                        </span>
                        {item.aspectRatio && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-slate-200">
                            {item.aspectRatio}
                          </span>
                        )}
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-2 right-2 pointer-events-none">
                        <span className="px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono text-white flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-300" />
                          <span>{item.duration || 5}s</span>
                        </span>
                      </div>

                      {/* Quick Inspect Hover Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition shadow"
                        title="Inspect Full Media"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 space-y-2.5 bg-slate-900">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate" title={item.title}>
                          {item.title}
                        </h4>
                        {item.prompt && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 italic" title={item.prompt}>
                            "{item.prompt}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => handleAddMedia(item)}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Timeline</span>
                        </button>
                        
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete from Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click <strong>Add to Timeline</strong> on any item to append it directly as a scene in your video storyboard.</span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Full Media Inspection / Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{previewItem.category}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-semibold text-white truncate max-w-md">{previewItem.title}</span>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              {previewItem.type === 'sora_video' || previewItem.url.includes('.mp4') || previewItem.url.includes('.webm') ? (
                <video 
                  src={previewItem.url} 
                  controls 
                  autoPlay 
                  className="max-h-[60vh] max-w-full object-contain"
                />
              ) : (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.title} 
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-slate-900 space-y-3">
              {previewItem.prompt && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Prompt:</span>
                  {previewItem.prompt}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Duration: {previewItem.duration || 5}s</span>
                  {previewItem.aspectRatio && <span>Ratio: {previewItem.aspectRatio}</span>}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleAddMedia(previewItem);
                      setPreviewItem(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Timeline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
