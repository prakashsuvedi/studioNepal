import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Film, Bot, Mic, ImageIcon, RefreshCw, Wand2, Layers, CheckCircle2, Lock, Clapperboard } from 'lucide-react';

export interface GlobalLoadingStageItem {
  id: string;
  label: string;
  subtitle?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface GlobalLoadingState {
  active: boolean;
  title: string;
  subtitle?: string;
  type?: 'image' | 'video' | 'voice' | 'render' | 'hamroai' | 'general';
  subState?: 'transcoding' | 'generating' | 'encoding' | 'compositing' | 'syncing' | 'audio_mix' | string;
  progress?: number;
  onCancel?: () => void;
  // Multi-stage long-form & storyboard sequencing support
  currentStage?: number;
  totalStages?: number;
  stageTitle?: string;
  stageDetails?: string;
  stagesList?: GlobalLoadingStageItem[];
  characterLockToken?: string;
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

          {/* Multi-Stage Sequencing Stepper (e.g. Generating Scene 2 of 7) */}
          {loading.totalStages && loading.totalStages > 1 && (
            <div className="w-full max-w-sm mb-4 p-3 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 text-left space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Clapperboard className="w-4 h-4 text-indigo-400" />
                  <span>
                    STORYBOARD SEQUENCE: SCENE {loading.currentStage || 1} OF {loading.totalStages}
                  </span>
                </div>
                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  {Math.round(((loading.currentStage || 1) / loading.totalStages) * 100)}% Movie Done
                </span>
              </div>

              {/* Stage Dots / Steps */}
              <div className="flex items-center gap-1.5 pt-0.5 pb-0.5">
                {Array.from({ length: loading.totalStages }).map((_, idx) => {
                  const stepNum = idx + 1;
                  const isDone = (loading.currentStage || 1) > stepNum;
                  const isCurrent = (loading.currentStage || 1) === stepNum;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                          : isCurrent
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 animate-pulse ring-2 ring-indigo-400/40'
                          : 'bg-zinc-800'
                      }`}
                      title={`Scene ${stepNum}`}
                    />
                  );
                })}
              </div>

              {/* Stage Title and Details */}
              {loading.stageTitle && (
                <div className="text-[11.5px] font-semibold text-zinc-200 truncate">
                  🎬 {loading.stageTitle}
                </div>
              )}

              {loading.stageDetails && (
                <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{loading.stageDetails}</span>
                </div>
              )}

              {/* Character Lock Active Notice */}
              {loading.characterLockToken && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/40">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">Identity Lock: {loading.characterLockToken} (100% Retained)</span>
                </div>
              )}
            </div>
          )}

          {/* Sub-State Pipeline Status Pill */}
          {loading.subState && !loading.totalStages && (
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
