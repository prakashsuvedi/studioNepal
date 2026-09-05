import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  Pause, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  RefreshCw, 
  Plus, 
  Film, 
  Sparkles,
  X,
  Check
} from 'lucide-react';
import { RenderQueueItem, Scene } from '../types';

interface RenderQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenes: Scene[];
  projectTitle: string;
  onLoadRenderedVideo?: (url: string) => void;
}

export const RenderQueueModal: React.FC<RenderQueueModalProps> = ({
  isOpen,
  onClose,
  currentScenes,
  projectTitle,
  onLoadRenderedVideo
}) => {
  const [queue, setQueue] = useState<RenderQueueItem[]>(() => {
    const saved = localStorage.getItem('nepalai_render_queue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'rq_1',
        title: 'Kathmandu Heritage Cinematic 4K',
        type: 'project',
        scenesCount: 5,
        totalDuration: 24,
        resolution: '4k',
        aspectRatio: '16:9',
        status: 'completed',
        progress: 100,
        createdAt: Date.now() - 3600000,
        completedAt: Date.now() - 3500000,
        downloadUrl: '#',
        fileSizeMb: 148.5,
        thumbnailUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'rq_2',
        title: 'Everest Sunrise Drone Shot - 9:16 Reel',
        type: 'single_scene',
        scenesCount: 1,
        totalDuration: 5,
        resolution: '1080p',
        aspectRatio: '9:16',
        status: 'rendering',
        progress: 68,
        stepDescription: 'Applying color grading & Devanagari subtitles...',
        createdAt: Date.now() - 120000,
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'all' | 'rendering' | 'completed'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('nepalai_render_queue', JSON.stringify(queue));
  }, [queue]);

  // Simulate active rendering progress
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prev => prev.map(item => {
        if (item.status === 'rendering') {
          const nextProg = item.progress + Math.floor(Math.random() * 12) + 5;
          if (nextProg >= 100) {
            setNotification(`Render Complete: "${item.title}" is ready for download!`);
            setTimeout(() => setNotification(null), 5000);
            return {
              ...item,
              status: 'completed',
              progress: 100,
              completedAt: Date.now(),
              fileSizeMb: Number((item.totalDuration * 4.2).toFixed(1)),
              downloadUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
              thumbnailUrl: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=600&q=80',
              stepDescription: 'Render finished successfully'
            };
          }
          return {
            ...item,
            progress: nextProg,
            stepDescription: nextProg < 40 ? 'Compositing AI video frames & audio...' : nextProg < 80 ? 'Applying transitions & Devanagari text...' : 'Encoding final MP4 container...'
          };
        }
        return item;
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleAddToQueue = (resolution: '1080p' | '4k' | '720p', aspectRatio: '16:9' | '9:16' | '1:1') => {
    const totalDuration = currentScenes.reduce((acc, s) => acc + s.duration, 0);
    const newItem: RenderQueueItem = {
      id: `rq_${Date.now()}`,
      title: `${projectTitle} (${resolution.toUpperCase()} - ${aspectRatio})`,
      type: 'project',
      scenesCount: currentScenes.length,
      totalDuration,
      resolution,
      aspectRatio,
      status: 'rendering',
      progress: 5,
      stepDescription: 'Initializing cloud render worker...',
      createdAt: Date.now()
    };
    setQueue([newItem, ...queue]);
    setNotification(`Added "${newItem.title}" to render queue.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCancelItem = (id: string) => {
    setQueue(queue.map(q => q.id === id ? { ...q, status: 'failed', error: 'Cancelled by user' } : q));
  };

  const handleDeleteItem = (id: string) => {
    setQueue(queue.filter(q => q.id !== id));
  };

  const handleRestartItem = (id: string) => {
    setQueue(queue.map(q => q.id === id ? { ...q, status: 'rendering', progress: 5, error: undefined, stepDescription: 'Restarting render worker...' } : q));
  };

  if (!isOpen) return null;

  const filteredQueue = queue.filter(q => {
    if (activeTab === 'rendering') return q.status === 'rendering' || q.status === 'pending';
    if (activeTab === 'completed') return q.status === 'completed';
    return true;
  });

  const activeRenderingCount = queue.filter(q => q.status === 'rendering' || q.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Batch Render & Export Queue
                {activeRenderingCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full animate-bounce">
                    {activeRenderingCount} active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Background processing queue for multiple scenes and video projects</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification banner */}
        {notification && (
          <div className="bg-indigo-600 text-white px-6 py-2.5 text-sm font-medium flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-indigo-200 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* Toolbar & Quick Add */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              All Jobs ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab('rendering')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'rendering' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Active ({activeRenderingCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              Completed ({queue.filter(q => q.status === 'completed').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Add Current Project:</span>
            <button
              onClick={() => handleAddToQueue('1080p', aspectRatioDefault(currentScenes))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              Queue 1080p
            </button>
            <button
              onClick={() => handleAddToQueue('4k', aspectRatioDefault(currentScenes))}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Queue 4K Ultra
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No render jobs found in this view.</p>
              <p className="text-xs text-slate-600 mt-1">Click "Queue 4K Ultra" above to dispatch current timeline to the background queue.</p>
            </div>
          ) : (
            filteredQueue.map(item => (
              <div 
                key={item.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    item.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 animate-pulse'
                  }`}>
                    {item.status === 'completed' ? <Check className="w-5 h-5" /> :
                     item.status === 'failed' ? <AlertCircle className="w-5 h-5" /> :
                     <RefreshCw className="w-5 h-5 animate-spin" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {item.resolution} • {item.aspectRatio}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                        {item.scenesCount} scenes ({item.totalDuration}s)
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.stepDescription || (item.status === 'completed' ? 'Render complete' : 'Queued')}</span>
                      {item.fileSizeMb && <span className="text-emerald-400 font-mono">({item.fileSizeMb} MB)</span>}
                    </p>

                    {/* Progress Bar */}
                    {(item.status === 'rendering' || item.status === 'pending') && (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5 max-w-md">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {item.status === 'completed' && item.downloadUrl && (
                    <>
                      {onLoadRenderedVideo && (
                        <button
                          onClick={() => {
                            onLoadRenderedVideo(item.downloadUrl!);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                        >
                          <Film className="w-3.5 h-3.5 text-indigo-400" />
                          Load in Preview
                        </button>
                      )}
                      <a
                        href={item.downloadUrl}
                        download
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download MP4
                      </a>
                    </>
                  )}

                  {item.status === 'rendering' && (
                    <button
                      onClick={() => handleCancelItem(item.id)}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                  )}

                  {item.status === 'failed' && (
                    <button
                      onClick={() => handleRestartItem(item.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Background worker running on Cloud Run Node cluster (Port 3000)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition"
          >
            Close Queue
          </button>
        </div>

      </div>
    </div>
  );
};

function aspectRatioDefault(scenes: Scene[]): '16:9' | '9:16' | '1:1' {
  return scenes[0]?.aspectRatio || '16:9';
}
