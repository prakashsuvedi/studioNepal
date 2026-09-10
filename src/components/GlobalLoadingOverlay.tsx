import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Film, Bot, Mic, ImageIcon, RefreshCw, Wand2, Layers } from 'lucide-react';

export interface GlobalLoadingState {
  active: boolean;
  title: string;
  subtitle?: string;
  type?: 'image' | 'video' | 'voice' | 'render' | 'hamroai' | 'general';
  subState?: 'transcoding' | 'generating' | 'encoding' | 'compositing' | 'syncing' | 'audio_mix' | string;
  progress?: number;
  onCancel?: () => void;
}

interface GlobalLoadingOverlayProps {
  loading: GlobalLoadingState;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({ loading }) => {
  if (!loading.active) return null;

  const isTranscoding = loading.subState === 'transcoding' || loading.subState === 'encoding';
  const isGenerating = loading.subState === 'generating';

  const getIcon = () => {
    if (isTranscoding) {
      return <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />;
    }
    if (isGenerating) {
      return <Wand2 className="w-7 h-7 text-amber-400" />;
    }
    switch (loading.type) {
      case 'video':
        return <Film className="w-7 h-7 text-indigo-400" />;
      case 'image':
        return <ImageIcon className="w-7 h-7 text-rose-400" />;
      case 'voice':
        return <Mic className="w-7 h-7 text-amber-400" />;
      case 'hamroai':
        return <Bot className="w-7 h-7 text-amber-400" />;
      case 'render':
        return <Cpu className="w-7 h-7 text-emerald-400" />;
      default:
        return <Sparkles className="w-7 h-7 text-rose-400" />;
    }
  };

  const getGradientTheme = () => {
    if (isTranscoding) {
      return 'from-cyan-400 via-teal-500 to-indigo-500';
    }
    if (isGenerating) {
      return 'from-amber-400 via-rose-500 to-purple-500';
    }
    switch (loading.type) {
      case 'video':
        return 'from-indigo-500 via-purple-500 to-pink-500';
      case 'image':
        return 'from-rose-500 via-orange-500 to-amber-500';
      case 'voice':
        return 'from-amber-500 via-rose-500 to-red-500';
      case 'hamroai':
        return 'from-amber-400 via-red-500 to-indigo-500';
      case 'render':
        return 'from-emerald-400 via-teal-500 to-cyan-500';
      default:
        return 'from-rose-500 via-purple-500 to-indigo-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
      >
        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-md w-full rounded-3xl bg-zinc-950/95 border border-zinc-800 p-7 shadow-2xl overflow-hidden flex flex-col items-center text-center"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sub-State Pipeline Status Pill */}
          {loading.subState && (
            <div className="mb-4 z-10">
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 shadow-sm ${
                isTranscoding 
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80' 
                  : isGenerating 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/80' 
                  : 'bg-zinc-900 text-emerald-400 border-zinc-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isTranscoding ? 'bg-cyan-400 animate-spin' : isGenerating ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>PIPELINE: {loading.subState}</span>
              </span>
            </div>
          )}

          {/* REVOLVING ANIMATION CORE */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-5">
            {/* Outer Revolving Conic Arc */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: isTranscoding ? 3 : 5,
                ease: 'linear',
              }}
              className={`absolute inset-0 rounded-full p-[2px] bg-gradient-to-r ${getGradientTheme()} opacity-70`}
              style={{
                maskImage: 'radial-gradient(transparent 58%, black 60%)',
                WebkitMaskImage: 'radial-gradient(transparent 58%, black 60%)',
              }}
            />

            {/* Inner Counter-Revolving Segment */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                repeat: Infinity,
                duration: 8,
                ease: 'linear',
              }}
              className="absolute inset-2 rounded-full border border-dashed border-zinc-700/80"
            />

            {/* Orbiting particle dot */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: 'easeInOut',
              }}
              className="absolute inset-0"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isTranscoding ? 'bg-cyan-400 shadow-cyan-400/80' : 'bg-amber-400 shadow-amber-400/80'} shadow-md mx-auto -translate-y-1`} />
            </motion.div>

            {/* Center Glowing Icon Core */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                boxShadow: [
                  '0 0 15px rgba(6, 182, 212, 0.2)',
                  '0 0 25px rgba(6, 182, 212, 0.4)',
                  '0 0 15px rgba(6, 182, 212, 0.2)',
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut',
              }}
              className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-lg"
            >
              {getIcon()}
            </motion.div>
          </div>

          {/* Status Details */}
          <div className="space-y-1.5 mb-5 max-w-xs">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {loading.title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {loading.subtitle || (isTranscoding ? 'Encoding and transcoding frames via FFmpeg engine...' : 'उच्च-गुणस्तरको एआई प्रशोधन जारी छ (High precision AI generation in progress)...')}
            </p>
          </div>

          {/* Progress Bar (if provided) */}
          {loading.progress !== undefined && (
            <div className="w-full max-w-xs space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>{isTranscoding ? 'Transcoding Progress' : 'Inference Progress'}</span>
                <span className={`${isTranscoding ? 'text-cyan-400' : 'text-amber-400'} font-bold`}>{Math.round(loading.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getGradientTheme()}`}
                  initial={{ width: '5%' }}
                  animate={{ width: `${Math.min(100, Math.max(5, loading.progress))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* AI Pipeline Architecture Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isTranscoding ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>{isTranscoding ? 'FFmpeg H.264 / AAC Direct Stream' : 'Direct Inference Cluster: studio.nepalai.tech'}</span>
          </div>

          {/* Optional Dismiss / Cancel */}
          {loading.onCancel && (
            <button
              onClick={loading.onCancel}
              className="mt-3.5 text-xs text-zinc-500 hover:text-zinc-300 transition underline underline-offset-4 cursor-pointer"
            >
              रद्द गर्नुहोस् (Cancel)
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
