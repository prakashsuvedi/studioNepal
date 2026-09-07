import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Scissors, 
  Crop, 
  Maximize2, 
  Check, 
  Sliders, 
  Zap, 
  Layers, 
  Eye, 
  Sun, 
  Contrast, 
  ShieldCheck, 
  RefreshCw,
  Video,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Square,
  Wand2,
  Download
} from 'lucide-react';
import { BackgroundRemovalOptions, SmartCropConfig, UpscaleQualityConfig, Scene } from '../types';

interface AiMediaProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetScene: Scene | null;
  onApplyProcessedMedia: (sceneId: string, updatedProps: Partial<Scene>) => void;
}

export const AiMediaProcessingModal: React.FC<AiMediaProcessingModalProps> = ({
  isOpen,
  onClose,
  targetScene,
  onApplyProcessedMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'bg_remover' | 'smart_crop' | 'upscaler'>('bg_remover');
  
  // Background Remover State
  const [bgMode, setBgMode] = useState<'transparent_png' | 'green_screen' | 'ai_depth_blur' | 'custom_color'>('transparent_png');
  const [featherRadius, setFeatherRadius] = useState<number>(3);
  const [edgeSmoothness, setEdgeSmoothness] = useState<number>(5);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgRemovedApplied, setBgRemovedApplied] = useState(false);

  // Smart Cropping State
  const [targetRatio, setTargetRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5' | '21:9'>('9:16');
  const [focalTracking, setFocalTracking] = useState<'auto_face' | 'action_center' | 'rule_of_thirds'>('auto_face');
  const [focalPointX, setFocalPointX] = useState<number>(50);
  const [focalPointY, setFocalPointY] = useState<number>(45);

  // AI Quality Upscaler State
  const [upscaleRes, setUpscaleRes] = useState<'1080p_hdr' | '2k_super_res' | '4k_ultra_master'>('4k_ultra_master');
  const [sharpening, setSharpening] = useState<number>(65);
  const [denoiseStrength, setDenoiseStrength] = useState<number>(40);
  const [vibranceBoost, setVibranceBoost] = useState<boolean>(true);
  const [stabilization, setStabilization] = useState<boolean>(true);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleApplied, setUpscaleApplied] = useState(false);

  if (!isOpen || !targetScene) return null;

  const handleProcessBackgroundRemoval = () => {
    setIsProcessingBg(true);
    setTimeout(() => {
      setIsProcessingBg(false);
      setBgRemovedApplied(true);
      setTimeout(() => setBgRemovedApplied(false), 2000);
    }, 1400);
  };

  const handleProcessUpscaling = () => {
    setIsUpscaling(true);
    setTimeout(() => {
      setIsUpscaling(false);
      setUpscaleApplied(true);
      setTimeout(() => setUpscaleApplied(false), 2000);
    }, 1800);
  };

  const handleApplyToTimelineScene = () => {
    const updatedProps: Partial<Scene> = {};
    if (activeTab === 'smart_crop') {
      updatedProps.aspectRatio = targetRatio === '21:9' || targetRatio === '4:5' ? '16:9' : targetRatio;
    }
    if (activeTab === 'upscaler') {
      updatedProps.filter = 'cinematic';
      updatedProps.colorAdjustments = {
        contrast: 15,
        saturation: vibranceBoost ? 20 : 0,
        brightness: 5,
      };
    }
    onApplyProcessedMedia(targetScene.id, updatedProps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-label="Pro-Grade NLE AI Media Processing Suite"
        className="relative w-full max-w-4xl h-[85vh] max-h-[780px] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Module 3: Pro-Grade NLE AI Processing Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700/50 text-emerald-300">
                  Target: {targetScene.title}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI background remover, intelligent multi-platform aspect ratio reframing & 4K super-resolution upscaling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('bg_remover')}
            className={`pb-3 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'bg_remover'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>AI Background Remover</span>
          </button>

          <button
            onClick={() => setActiveTab('smart_crop')}
            className={`pb-3 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'smart_crop'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Intelligent Aspect Ratio & Reframing</span>
          </button>

          <button
            onClick={() => setActiveTab('upscaler')}
            className={`pb-3 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'upscaler'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4K Super-Resolution & HDR Remastering</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Preview Box (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-xl">
              {targetScene.mediaType === 'video' ? (
                <video
                  src={targetScene.mediaUrl}
                  controls
                  className={`w-full h-full object-cover ${
                    bgRemovedApplied ? 'filter contrast-125 saturate-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]' : ''
                  }`}
                />
              ) : (
                <img
                  src={targetScene.mediaUrl}
                  alt={targetScene.title}
                  className={`w-full h-full object-cover ${
                    bgRemovedApplied ? 'filter contrast-125 saturate-110' : ''
                  }`}
                />
              )}

              {/* Smart Crop Focal Grid Overlay */}
              {activeTab === 'smart_crop' && (
                <div className="absolute inset-0 pointer-events-none border border-cyan-400/40 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-cyan-400/20"></div>
                  <div className="border-r border-b border-cyan-400/20"></div>
                  <div className="border-b border-cyan-400/20"></div>
                  <div className="border-r border-b border-cyan-400/20"></div>
                  <div className="border-r border-b border-cyan-400/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-400 animate-ping"></div>
                  </div>
                  <div className="border-b border-cyan-400/20"></div>
                  <div className="border-r border-cyan-400/20"></div>
                  <div className="border-r border-cyan-400/20"></div>
                  <div></div>
                </div>
              )}

              {/* Processing Spinner Overlay */}
              {(isProcessingBg || isUpscaling) && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-400 animate-spin"></div>
                  <span className="text-xs font-semibold text-cyan-200">
                    {isProcessingBg ? 'Executing Neural Matting & Alpha Extraction...' : 'Rendering 4K Super-Resolution Upscaling...'}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Source: {targetScene.mediaType.toUpperCase()} ({targetScene.aspectRatio})</span>
              <span className="font-mono text-cyan-400">Duration: {targetScene.duration}s</span>
            </div>
          </div>

          {/* Right Parameter Controls (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* 1. Background Remover Controls */}
            {activeTab === 'bg_remover' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                    Matting & Cutout Mode
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBgMode('transparent_png')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        bgMode === 'transparent_png'
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>Transparent Alpha PNG</div>
                      <div className="text-[10px] text-slate-400 font-normal">Isolates subject completely</div>
                    </button>

                    <button
                      onClick={() => setBgMode('green_screen')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        bgMode === 'green_screen'
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>Chroma Key Green</div>
                      <div className="text-[10px] text-slate-400 font-normal">Broadcast green screen</div>
                    </button>

                    <button
                      onClick={() => setBgMode('ai_depth_blur')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        bgMode === 'ai_depth_blur'
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>AI Depth Bokeh Blur</div>
                      <div className="text-[10px] text-slate-400 font-normal">DSLR cinematic bokeh</div>
                    </button>

                    <button
                      onClick={() => setBgMode('custom_color')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                        bgMode === 'custom_color'
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>Studio Solid Backdrop</div>
                      <div className="text-[10px] text-slate-400 font-normal">Clean dark slate background</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Feather Radius (Edge Softness)</span>
                      <span className="font-mono text-emerald-400">{featherRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={featherRadius}
                      onChange={(e) => setFeatherRadius(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Hair & Edge Boundary Smoothing</span>
                      <span className="font-mono text-emerald-400">{edgeSmoothness}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={edgeSmoothness}
                      onChange={(e) => setEdgeSmoothness(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProcessBackgroundRemoval}
                  disabled={isProcessingBg}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className={`w-4 h-4 ${isProcessingBg ? 'animate-spin' : ''}`} />
                  <span>{isProcessingBg ? 'Extracting Alpha Mask...' : 'Remove Background Now'}</span>
                </button>
              </div>
            )}

            {/* 2. Smart Crop & Aspect Ratio Controls */}
            {activeTab === 'smart_crop' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    Target Platform Aspect Ratio
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTargetRatio('9:16')}
                      className={`p-2 rounded-xl border text-center text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                        targetRatio === '9:16'
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>9:16 (Shorts/Reels)</span>
                    </button>

                    <button
                      onClick={() => setTargetRatio('16:9')}
                      className={`p-2 rounded-xl border text-center text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                        targetRatio === '16:9'
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>16:9 (YouTube/TV)</span>
                    </button>

                    <button
                      onClick={() => setTargetRatio('1:1')}
                      className={`p-2 rounded-xl border text-center text-xs transition cursor-pointer flex flex-col items-center gap-1 ${
                        targetRatio === '1:1'
                          ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Square className="w-4 h-4" />
                      <span>1:1 (Insta Post)</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                    AI Smart Focal Reframing Tracker
                  </label>

                  <div className="space-y-2">
                    <button
                      onClick={() => setFocalTracking('auto_face')}
                      className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                        focalTracking === 'auto_face'
                          ? 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>👤 Auto Face & Character Tracking</span>
                      {focalTracking === 'auto_face' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>

                    <button
                      onClick={() => setFocalTracking('action_center')}
                      className={`w-full p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                        focalTracking === 'action_center'
                          ? 'bg-cyan-950/50 border-cyan-500/70 text-cyan-200 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>🎯 Center of Action & Motion Anchor</span>
                      {focalTracking === 'action_center' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI Upscaler Controls */}
            {activeTab === 'upscaler' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                    Target Master Resolution
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setUpscaleRes('1080p_hdr')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition cursor-pointer ${
                        upscaleRes === '1080p_hdr'
                          ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>1080p HDR</div>
                      <div className="text-[10px] text-slate-500">Fast Master</div>
                    </button>

                    <button
                      onClick={() => setUpscaleRes('2k_super_res')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition cursor-pointer ${
                        upscaleRes === '2k_super_res'
                          ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>2K Quad-HD</div>
                      <div className="text-[10px] text-slate-500">Sharpened</div>
                    </button>

                    <button
                      onClick={() => setUpscaleRes('4k_ultra_master')}
                      className={`p-2.5 rounded-xl border text-center text-xs transition cursor-pointer ${
                        upscaleRes === '4k_ultra_master'
                          ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>4K Ultra</div>
                      <div className="text-[10px] text-slate-500">Broadcast Max</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Neural Edge Sharpening</span>
                      <span className="font-mono text-purple-400">{sharpening}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sharpening}
                      onChange={(e) => setSharpening(parseInt(e.target.value))}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-300">HDR Color & Vibrance Boost</span>
                    <input
                      type="checkbox"
                      checked={vibranceBoost}
                      onChange={(e) => setVibranceBoost(e.target.checked)}
                      className="accent-purple-400 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProcessUpscaling}
                  disabled={isUpscaling}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isUpscaling ? 'animate-spin' : ''}`} />
                  <span>{isUpscaling ? 'Enhancing Texture & Details...' : 'Upscale to 4K Super-Resolution'}</span>
                </button>
              </div>
            )}

            {/* Bottom Save & Apply to Timeline */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Changes will update this scene in the NLE timeline
              </span>
              <button
                onClick={handleApplyToTimelineScene}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply to Selected Timeline Scene</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
