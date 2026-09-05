import React from 'react';
import { 
  X, 
  Sparkles, 
  Film, 
  Sliders, 
  Zap,
  ArrowRight,
  Maximize2,
  Minimize2,
  Clock
} from 'lucide-react';
import { Scene, TransitionType } from '../types';

interface TransitionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneA: Scene;
  sceneB?: Scene;
  sceneIndex: number;
  onUpdateTransition: (sceneId: string, transition: TransitionType, duration: number) => void;
}

const TRANSITION_PRESETS: { type: TransitionType; label: string; description: string; iconName: string }[] = [
  { type: 'cut', label: 'Hard Cut', description: 'Instant jump cut with zero frame overlap', iconName: 'scissors' },
  { type: 'fade', label: 'Fade to Black', description: 'Smooth fade through solid black color', iconName: 'moon' },
  { type: 'dissolve', label: 'Cross Dissolve', description: 'Smooth optical alpha blend between clips', iconName: 'blend' },
  { type: 'slide_left', label: 'Slide Left', description: 'Incoming clip slides smoothly from right to left', iconName: 'arrow-left' },
  { type: 'slide_right', label: 'Slide Right', description: 'Incoming clip slides smoothly from left to right', iconName: 'arrow-right' },
  { type: 'slide_up', label: 'Slide Up', description: 'Incoming clip slides up from bottom', iconName: 'arrow-up' },
  { type: 'slide_down', label: 'Slide Down', description: 'Incoming clip slides down from top', iconName: 'arrow-down' },
  { type: 'zoom_in', label: 'Zoom In Transition', description: 'Dynamic camera scale push-in across cut', iconName: 'zoom-in' },
  { type: 'zoom_out', label: 'Zoom Out Transition', description: 'Dynamic camera pull-back across cut', iconName: 'zoom-out' },
  { type: 'flash_white', label: 'Flash White', description: 'Cinematic lightning white flash transition', iconName: 'zap' },
  { type: 'blur_dissolve', label: 'Blur Dissolve', description: 'Gaussian lens blur optical transition', iconName: 'activity' }
];

export const TransitionManagerModal: React.FC<TransitionManagerModalProps> = ({
  isOpen,
  onClose,
  sceneA,
  sceneB,
  sceneIndex,
  onUpdateTransition
}) => {
  if (!isOpen || !sceneA) return null;

  const currentType = sceneA.transition || 'dissolve';
  const currentDuration = sceneA.transitionDuration || 0.8;

  const handleSelect = (type: TransitionType) => {
    onUpdateTransition(sceneA.id, type, currentDuration);
  };

  const handleDurationChange = (dur: number) => {
    onUpdateTransition(sceneA.id, currentType, dur);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Transition Manager (Scene {sceneIndex + 1} → {sceneIndex + 2})
              </h2>
              <p className="text-xs text-slate-400">Configure professional cinematic cuts and visual transition effects</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Clip Pair */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800 flex items-center justify-center gap-4">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Clip {sceneIndex + 1}</p>
            <p className="text-xs font-bold text-white truncate mt-1">{sceneA.title}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
              {sceneA.duration}s duration
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <div className="px-3 py-1 bg-indigo-600 text-white font-mono text-xs rounded-lg shadow-lg flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>{currentType.replace('_', ' ').toUpperCase()}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{currentDuration}s</span>
          </div>

          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Clip {sceneIndex + 2}</p>
            <p className="text-xs font-bold text-white truncate mt-1">{sceneB ? sceneB.title : 'End of Timeline'}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
              {sceneB ? `${sceneB.duration}s duration` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Duration Slider */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-200">Transition Duration:</span>
            <span className="text-sm font-mono font-bold text-indigo-400">{currentDuration}s</span>
          </div>
          <div className="flex items-center gap-3">
            {[0.3, 0.5, 0.8, 1.2, 2.0].map(dur => (
              <button
                key={dur}
                onClick={() => handleDurationChange(dur)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  currentDuration === dur 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* Transition Grid */}
        <div className="p-6 overflow-y-auto max-h-[350px] grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRANSITION_PRESETS.map(preset => {
            const isSelected = currentType === preset.type;
            return (
              <button
                key={preset.type}
                onClick={() => handleSelect(preset.type)}
                className={`text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg' 
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{preset.label}</span>
                    {isSelected && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">Active</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition shadow"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
